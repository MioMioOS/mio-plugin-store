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
  github_app_installation_id INTEGER,  -- if they installed the GitHub App
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
```

### Extend licenses table

```sql
ALTER TABLE licenses ADD COLUMN user_id TEXT REFERENCES users(id);
```

No device limit. License validated by GitHub ID only.

## API Design

### Admin Public API (cat.wdao.chat/api/public/*)

All public endpoints require CORS headers for miomio.chat origin.

**Auth:**
- `POST /api/public/auth/github` — Exchange GitHub OAuth code for session. Returns user info + JWT token.
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
- `GET /api/public/user/plugins` — List user's purchased/installed plugins.
- `POST /api/public/user/purchase` — Purchase plugin (Stripe integration, future).

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

### OAuth Flow

1. User clicks "Sign in with GitHub" on miomio.chat
2. Redirect to GitHub OAuth authorization (using GitHub App's client ID)
3. GitHub redirects to miomio.chat/api/auth/callback with code
4. Store sends code to Admin API (`POST /api/public/auth/github`)
5. Admin exchanges code for access token with GitHub
6. Admin fetches user profile from GitHub API
7. Admin creates/updates user record, generates JWT
8. Returns JWT to Store, Store stores in cookie
9. User is logged in

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
2. Triggers `mioIsland://install?id=PLUGIN_ID&token=JWT`
3. App uses token to call download API
4. Plugin installed to ~/.config/codeisland/plugins/

### Paid Plugins (Future - Stripe)
1. User clicks "Buy" → Stripe checkout
2. Payment success → License key generated (bound to github_id)
3. "Install" button appears
4. Triggers `mioIsland://install?id=PLUGIN_ID&key=LICENSE_KEY`
5. App downloads .bundle using license key
6. App stores license locally, periodically verifies with server

### My Plugins Page
- Shows all purchased + installed free plugins
- Re-install button for each (switching computers)
- Version update indicator when newer version available

## Store Frontend Design

### Tech
- Next.js 16 App Router
- Framer Motion for all animations
- shadcn/ui components
- No emoji anywhere

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

## Security

- JWT tokens with expiration (24h)
- CORS restricted to miomio.chat origin
- Bundle download requires authentication
- Paid bundles require valid license
- Admin API endpoints require admin session (existing auth)
- Rate limiting on public API endpoints
- Bundle file size limit (50MB)
- GitHub App uses minimum required permissions (read-only)

## Out of Scope (Future)

- Stripe payment integration (P2)
- Plugin reviews/ratings from users
- Plugin auto-update in app
- Developer analytics dashboard
- Plugin dependency management
- App-side plugin store UI (C option)
