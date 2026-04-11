# MioIsland Plugin Marketplace - GitHub Integration Design

## Overview

Transform mio-plugin-store from a static mock site into a fully functional plugin marketplace with GitHub-based authentication, plugin submission with source code review, paid plugin support, and one-click installation.

## Architecture

### System Components

```
Store (miomio.chat, Vercel)          Admin (cat.wdao.chat, Server)
  - Next.js frontend                   - Admin panel (existing)
  - GitHub OAuth callback              - Public API endpoints (new)
  - Framer Motion animations           - SQLite database
  - Calls Admin public API             - Bundle file storage
                                       - GitHub App (source code access)
                                       - License management

MioIsland App (macOS)
  - URL scheme handler (mioIsland://)
  - Plugin installer
  - License verification
```

### Backend: Extend Admin (Phase A)

Admin at cat.wdao.chat gains public API endpoints. Store on Vercel calls these APIs. Bundle files stored on server filesystem.

## Roles

- **User**: GitHub OAuth login. Browse, purchase, install plugins. View "My Plugins".
- **Developer**: User who submits plugins. Links GitHub repos via GitHub App. Uploads compiled .bundle files.
- **Admin**: Reviews source code from GitHub, approves/rejects plugins.

All roles authenticate via GitHub OAuth. No separate auth systems.

## Database Schema Changes

### New Table: users

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  github_id INTEGER UNIQUE NOT NULL,
  github_login TEXT NOT NULL,
  avatar_url TEXT,
  email TEXT,
  role TEXT DEFAULT 'user',  -- user / developer / admin
  github_access_token TEXT,  -- encrypted, for GitHub API calls
  github_app_installation_id INTEGER,  -- if they installed the GitHub App
  refresh_token TEXT,  -- for JWT refresh
  created_at TEXT DEFAULT (datetime('now'))
);
```

### Extend plugins table

```sql
ALTER TABLE plugins ADD COLUMN github_repo TEXT;       -- owner/repo
ALTER TABLE plugins ADD COLUMN github_branch TEXT;
ALTER TABLE plugins ADD COLUMN commit_sha TEXT;        -- pinned version for review
ALTER TABLE plugins ADD COLUMN bundle_path TEXT;        -- server filesystem path
ALTER TABLE plugins ADD COLUMN bundle_size INTEGER;
ALTER TABLE plugins ADD COLUMN developer_id TEXT REFERENCES users(id);
ALTER TABLE plugins ADD COLUMN downloads INTEGER DEFAULT 0;
ALTER TABLE plugins ADD COLUMN icon_url TEXT;
ALTER TABLE plugins ADD COLUMN current_version_id TEXT;  -- FK to plugin_versions
```

### New Table: plugin_versions

```sql
CREATE TABLE plugin_versions (
  id TEXT PRIMARY KEY,
  plugin_id TEXT REFERENCES plugins(id),
  version TEXT NOT NULL,
  commit_sha TEXT,
  bundle_path TEXT,
  bundle_size INTEGER,
  release_notes TEXT,
  status TEXT DEFAULT 'pending',  -- pending / approved / rejected
  created_at TEXT DEFAULT (datetime('now'))
);
```

### New Table: user_plugins (tracks free installs + purchases)

```sql
CREATE TABLE user_plugins (
  user_id TEXT REFERENCES users(id),
  plugin_id TEXT REFERENCES plugins(id),
  installed_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, plugin_id)
);
```

### Extend licenses table

```sql
ALTER TABLE licenses ADD COLUMN user_id TEXT REFERENCES users(id);
```

No device limit. License validated by GitHub ID only.

## API Design

### Store Auth Proxy (miomio.chat/api/auth/*)

These are Next.js API routes on Vercel that proxy auth operations to the Admin API. This keeps the refresh token as a first-party cookie on miomio.chat.

- `GET /api/auth/login` — Generates state, stores in cookie, redirects to GitHub OAuth.
- `GET /api/auth/callback` — Verifies state, exchanges code via Admin API, sets refresh token cookie, redirects to app with access token.
- `POST /api/auth/refresh` — Reads refresh token from httpOnly cookie, calls Admin API, returns new access token.
- `POST /api/auth/logout` — Clears refresh token cookie, calls Admin API to invalidate token.

### Admin Public API (cat.wdao.chat/api/public/*)

All public endpoints require CORS headers for miomio.chat origin.

**Auth:**
- `POST /api/public/auth/github` — Exchange GitHub OAuth code for session. Returns user info + JWT access token (15min) + refresh token.
- `POST /api/public/auth/refresh` — Exchange refresh token for new access token.
- `POST /api/public/auth/logout` — Invalidate refresh token.
- `GET /api/public/auth/me` — Get current user info from JWT.

**Plugins (public):**
- `GET /api/public/plugins` — List approved plugins. Supports search, type filter, sort, pagination.
- `GET /api/public/plugins/:id` — Plugin detail.
- `GET /api/public/plugins/:id/download` — Download .bundle file. Free plugins: login required. Paid plugins: valid license required. Increments download count.

**Developer (auth required, role=developer):**
- `GET /api/public/developer/repos` — List user's GitHub repos (via GitHub App installation).
- `POST /api/public/developer/submit` — Submit plugin: repo, branch, commit SHA, metadata.
- `POST /api/public/developer/upload` — Upload .bundle file (multipart form data).
- `GET /api/public/developer/plugins` — List developer's own plugins with status.

**User (auth required):**
- `GET /api/public/user/plugins` — List user's purchased/installed plugins (from user_plugins table).
- `POST /api/public/user/purchase` — Purchase plugin (Stripe integration, future).
- `POST /api/public/user/install-token` — Generate a one-time download token (5min TTL, single use) for URL scheme install.

**License (for App verification):**
- `POST /api/public/license/verify` — Verify license key. Body: { key, plugin_id, github_id }. Returns validity status.

## GitHub Integration

### GitHub App: "MioIsland Plugin Review"

**Permissions:**
- Repository contents: Read-only
- Metadata: Read-only

**Setup:**
- Created under MioMioOS organization
- Callback URL: https://miomio.chat/api/auth/callback
- Setup URL: https://miomio.chat/developer (where developers land after installing)

**Flow:**
1. Developer clicks "Connect GitHub" on developer dashboard
2. Redirected to GitHub App installation page
3. Selects repos to grant access to
4. Redirected back to miomio.chat with installation_id
5. Platform stores installation_id on user record

### Authentication (OAuth) — separate from GitHub App installation

OAuth uses the GitHub App's client ID for "Sign in with GitHub". This is purely for identity. Repo access comes later via GitHub App installation (developers only).

1. User clicks "Sign in with GitHub" on miomio.chat
2. Store generates random `state` string, stores in httpOnly cookie, redirects to GitHub OAuth with `state` param
3. GitHub redirects to `miomio.chat/api/auth/callback` with `code` + `state`
4. **Store API route (server-side)** verifies `state` matches cookie, then sends `code` to Admin API (`POST /api/public/auth/github`)
5. Admin exchanges code for GitHub access token (server-to-server, code is single-use)
6. Admin fetches user profile from GitHub API
7. Admin creates/updates user record, stores encrypted GitHub access token
8. Admin generates JWT access token (15min) + refresh token (hashed in DB)
9. Returns both tokens to Store API route
10. **Store API route** sets refresh token as httpOnly cookie on miomio.chat domain (first-party cookie, no cross-origin issues), returns access token to browser
11. Browser stores access token in memory only
12. All subsequent API calls to cat.wdao.chat use `Authorization: Bearer <access_token>` header
13. When access token expires, browser calls **Store's** `/api/auth/refresh` route, which reads the httpOnly cookie and proxies to Admin API, returning a new access token

### GitHub App Installation (repo access) — developers only

This is a separate step from OAuth login. Developers install the GitHub App to grant read access to their repos.

1. Developer (already logged in) clicks "Connect Repos" on developer dashboard
2. Redirected to GitHub App installation page (github.com/apps/mioIsland-plugin-review/installations/new)
3. Developer selects which repos to grant access to
4. Redirected back to miomio.chat/developer with installation_id
5. Store sends installation_id to Admin API, stored on user record
6. Now Admin can use the installation token to read those repos via GitHub API

### Source Code Review

When developer submits a plugin:
1. Admin records the repo + commit SHA
2. Admin panel shows "Review" button
3. Admin clicks Review → Admin uses GitHub API to fetch file tree at that commit
4. Source code displayed in admin panel for review
5. Admin approves/rejects with notes

## Plugin Submission Flow

1. Developer signs in with GitHub on miomio.chat
2. Developer installs MioIsland GitHub App (grants repo read access)
3. Developer goes to Submit page:
   - Step 1: Select repo from dropdown (fetched via GitHub API)
   - Step 2: Select branch/tag, enter plugin metadata (name, description, type, price)
   - Step 3: Upload compiled .bundle file
   - Step 4: Review summary → Submit
4. Plugin enters "pending" status
5. Admin reviews source code + tests .bundle
6. Approved → listed on marketplace

## Purchase & Install Flow

### Free Plugins
1. User logged in → clicks "Install" on plugin page
2. Store requests one-time download token from Admin API (`POST /api/public/user/install-token`)
3. Triggers `mioIsland://install?id=PLUGIN_ID&download_token=ONETIME_TOKEN`
4. App uses one-time token to call download API (token valid 5min, single use)
5. Plugin installed to ~/.config/codeisland/plugins/
6. User-plugin relationship recorded in user_plugins table (enables "My Plugins")

### Paid Plugins (Future - Stripe)
1. User clicks "Buy" → Stripe checkout
2. Payment success → License key generated (bound to github_id), recorded in user_plugins
3. "Install" button appears
4. Store requests one-time download token
5. Triggers `mioIsland://install?id=PLUGIN_ID&download_token=ONETIME_TOKEN`
6. App downloads .bundle using one-time token
7. App stores license locally, periodically verifies with server

### My Plugins Page
- Shows all purchased + installed free plugins
- Re-install button for each (switching computers)
- Version update indicator when newer version available

## Store Frontend Design

### Tech
- Next.js 16 App Router
- Framer Motion for all animations
- shadcn/ui components
- No emoji anywhere (replace existing emoji in mock data with SVG icons from lucide-react)

### Interaction & Animation Principles
- Every user action has visual feedback
- Page transitions: smooth slide/fade with Framer Motion AnimatePresence
- Plugin cards: 3D tilt on hover, glow border, floating install button
- Search: real-time filter with layout animation, results spring in with stagger
- Install button: click → progress ring → success burst animation
- GitHub login: slide-in panel with GitHub icon animation
- Plugin detail: screenshot gallery, animated version timeline, star rating fill animation
- Developer submit wizard: step indicator with connecting line animation
- Scroll-triggered animations throughout
- Skeleton loading states with shimmer
- Toast notifications with slide + spring physics

### Key Pages
1. **Home** — Hero with animated particles/gradient, featured plugins carousel, category cards
2. **Browse** — Search + filters with animated transitions, infinite scroll or animated pagination
3. **Plugin Detail** — Rich detail page with install/buy CTA, screenshots, version history, reviews
4. **Developer Dashboard** — Stats with animated counters, plugin list with status badges, revenue chart
5. **Submit Plugin** — Multi-step wizard with progress animation
6. **My Plugins** — User's purchased/installed plugins, re-install, update available indicators
7. **Profile** — GitHub profile info, role badge

## File Storage

Bundle files stored at: `/data/bundles/{plugin_id}/{version}/{filename}.bundle`

Admin server serves files via the download API endpoint with proper auth checks.

## Route Separation (Admin server)

Admin server has two route families with different auth and CORS:

- `/api/auth/*` + `/api/admin/*` — Admin-only routes. Password-based session auth (existing). No CORS. Protected by admin middleware.
- `/api/public/*` — Public API for Store. JWT Bearer auth. CORS allowed for miomio.chat only. Rate limited.

These must not interfere with each other. Middleware checks the path prefix to apply the correct auth strategy.

## Security

### Authentication & Token Security

- JWT access tokens: 15min expiry, stored in memory (not localStorage), signed with HS256 + server secret (min 256-bit, from env var `JWT_SECRET`)
- Refresh tokens: 7-day expiry, **first-party httpOnly cookie on miomio.chat domain** (NOT cross-origin cookie to cat.wdao.chat — Safari and modern browsers block third-party cookies)
- **Auth proxy pattern**: Store has its own API routes (`/api/auth/*`) that proxy to Admin API server-side. This keeps the refresh token cookie first-party on miomio.chat. The Store's server-side code forwards the refresh token to Admin API and returns a new access token.
- Refresh tokens stored as hashed values (SHA-256) in DB — even if DB is compromised, tokens cannot be reused
- Token rotation: issuing a new refresh token invalidates the old one (detect token reuse as compromise signal)

### OAuth CSRF Protection

- OAuth flow MUST include a `state` parameter: random string generated by Store, stored in session/cookie, verified when GitHub redirects back
- OAuth `code` is single-use and exchanged server-side (Store API route → Admin API), never exposed to the browser

### CORS & API Access

- CORS restricted to `https://miomio.chat` origin (public API only)
- macOS App does NOT use CORS (not a browser). App authenticates via one-time download tokens or license keys — these are validated server-side without CORS.
- Download endpoint (`/api/public/plugins/:id/download`) accepts both:
  - Browser requests with CORS (from miomio.chat)
  - Non-browser requests with valid download token (from macOS App)

### Bundle Upload Security

- File type validation: uploaded file must be a valid .bundle (zip containing Mach-O binary + Info.plist). Server verifies structure before accepting.
- File size limit: 50MB max (enforced at HTTP level and application level)
- **Path traversal prevention**: bundle_path is generated server-side (never from user input). Format: `/data/bundles/{uuid}/{version}/{uuid}.bundle`. All path components are server-generated UUIDs or sanitized semver strings.
- Filenames from upload are discarded — server assigns its own filename.
- Bundle files served via streaming from the API, never via static file serving (no direct filesystem access).

### License & Payment Security

- License keys: cryptographically random, 32-byte hex string (256 bits of entropy). Generated via `crypto.randomBytes(32)`. Impossible to brute-force.
- License key verification uses **constant-time comparison** (`crypto.timingSafeEqual`) to prevent timing attacks.
- License verify endpoint rate limit: **10 req/min per IP** (stricter than general API limit).
- **Stripe payment flow** (future but architecture defined now):
  - Payment via Stripe Checkout (server-created session) — price set server-side, not client-provided
  - Payment confirmation via **Stripe webhooks only** (not client-side callback)
  - Webhook endpoint verifies Stripe signature (`stripe.webhooks.constructEvent` with webhook secret)
  - License generation is atomic with webhook processing: webhook handler creates license in a DB transaction
  - Idempotency: webhook handler checks `stripe_payment_id` uniqueness before creating license (handles Stripe's at-least-once delivery)
  - Refund webhook revokes the associated license

### GitHub Token Storage

- GitHub access tokens encrypted at rest using **AES-256-GCM**
- Encryption key from env var `GITHUB_TOKEN_ENCRYPTION_KEY` (32 bytes)
- Each token encrypted with unique IV (initialization vector)
- Stored format: `{iv}:{encrypted}:{authTag}` in database

### One-Time Download Tokens

- Generated via `crypto.randomBytes(32)`, hex-encoded
- Stored in DB with: token_hash (SHA-256), plugin_id, user_id, expires_at, used (boolean)
- 5-minute TTL, single use (marked used after first download)
- Expired/used tokens cleaned up by periodic job

### Rate Limiting

- General public API: 100 req/min per IP
- Auth endpoints: 20 req/min per IP
- License verify: 10 req/min per IP
- Bundle upload: 5 req/min per user
- Download: 30 req/min per user

### Role Management

- Default role is `user` on first login
- Developer role granted automatically when user installs the GitHub App (has installation_id)
- Admin role set manually in database (not self-assignable via API)
- Role changes logged in an audit trail

### Server Hardening

- Admin server (cat.wdao.chat) must have HTTPS enforced (redirect HTTP → HTTPS)
- All API responses include security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`
- Input validation on all API parameters (plugin metadata, search queries) — reject unexpected fields, sanitize strings

## Binary-Source Verification

Uploaded .bundle files cannot be automatically verified against linked source code (macOS bundles are not reproducibly buildable). Mitigation:
- Admin must manually test the .bundle in a sandboxed MioIsland instance before approving
- Developer must provide a build.sh in their repo; admin can spot-check by building from source
- Mismatch between source and binary is grounds for rejection and developer ban
- Future: require Apple Developer ID code signing for .bundle files (notarization verifies binary integrity)

## API Error Response Format

All public API endpoints return errors in a consistent format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

Common codes: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `RATE_LIMITED`, `VALIDATION_ERROR`, `INTERNAL_ERROR`.

Store frontend shows appropriate error UI with retry option when Admin API is unreachable.

## Out of Scope (Future)

- Stripe payment integration (P2)
- Plugin reviews/ratings from users
- Plugin auto-update in app
- Developer analytics dashboard
- Plugin dependency management
- App-side plugin store UI (C option)
- CDN for bundle delivery (currently served directly from Admin server)
- Automated build verification
