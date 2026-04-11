# MioIsland Plugin Marketplace Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform mio-plugin-store from a static mock site into a real marketplace with GitHub OAuth, plugin submission with source code review, and one-click install via URL scheme.

**Architecture:** Two codebases — Admin backend (mio-plugin-admin at cat.wdao.chat) gains public API endpoints for auth, plugins, uploads. Store frontend (mio-plugin-store on Vercel at miomio.chat) adds auth proxy routes, replaces mock data with API calls, adds Framer Motion animations throughout. Auth uses first-party cookie proxy pattern to avoid third-party cookie issues.

**Tech Stack:** Next.js 16 App Router, better-sqlite3, jsonwebtoken/jose, Framer Motion, shadcn/ui, lucide-react

**Spec:** `docs/superpowers/specs/2026-04-11-github-plugin-marketplace-design.md`

**IMPORTANT:** Both projects use Next.js 16 which may have breaking changes. Before writing any code, read `node_modules/next/dist/docs/` in each project for current API routes docs. Both projects have an AGENTS.md warning about this.

---

## File Structure

### Admin Backend (mio-plugin-admin) — New Files

| File | Responsibility |
|------|---------------|
| `src/lib/jwt.ts` | JWT access token signing/verification, refresh token generation/validation |
| `src/lib/crypto.ts` | AES-256-GCM encryption for GitHub tokens, SHA-256 hashing, constant-time compare |
| `src/lib/github.ts` | GitHub API client: OAuth code exchange, user profile fetch, installation token, repo listing |
| `src/lib/public-auth.ts` | Middleware: extract and verify JWT from Authorization header for public API routes |
| `src/lib/cors.ts` | CORS headers helper for public API routes |
| `src/lib/rate-limit.ts` | In-memory rate limiter (IP-based, configurable per-endpoint) |
| `src/app/api/public/auth/github/route.ts` | POST: exchange OAuth code for JWT + refresh token |
| `src/app/api/public/auth/refresh/route.ts` | POST: exchange refresh token for new access token |
| `src/app/api/public/auth/logout/route.ts` | POST: invalidate refresh token |
| `src/app/api/public/auth/me/route.ts` | GET: current user info from JWT |
| `src/app/api/public/plugins/route.ts` | GET: list approved plugins with search/filter/sort/pagination |
| `src/app/api/public/plugins/[id]/route.ts` | GET: single plugin detail |
| `src/app/api/public/plugins/[id]/download/route.ts` | GET: download bundle file (validates download token) |
| `src/app/api/public/developer/repos/route.ts` | GET: list developer's GitHub repos via installation |
| `src/app/api/public/developer/submit/route.ts` | POST: submit plugin metadata + GitHub repo link |
| `src/app/api/public/developer/upload/route.ts` | POST: upload .bundle file (multipart) |
| `src/app/api/public/developer/plugins/route.ts` | GET: developer's own plugins with all statuses |
| `src/app/api/public/user/plugins/route.ts` | GET: user's installed/purchased plugins |
| `src/app/api/public/user/install-token/route.ts` | POST: generate one-time download token |
| `src/app/api/public/license/verify/route.ts` | POST: verify license key for app |

### Admin Backend — Modified Files

| File | Changes |
|------|---------|
| `src/lib/db.ts` | Add users, plugin_versions, user_plugins, download_tokens tables; migrate existing plugins table with new columns |
| `package.json` | Add `jose` (JWT), no other new deps needed (crypto is built-in) |

### Store Frontend (mio-plugin-store) — New Files

| File | Responsibility |
|------|---------------|
| `src/lib/api.ts` | API client: fetch wrapper for admin backend with auth token injection + refresh logic |
| `src/lib/auth-context.tsx` | React context: user state, login/logout methods, token management |
| `src/app/api/auth/login/route.ts` | GET: generate state, store in cookie, redirect to GitHub OAuth |
| `src/app/api/auth/callback/route.ts` | GET: verify state, exchange code via admin API, set refresh cookie |
| `src/app/api/auth/refresh/route.ts` | POST: read refresh cookie, proxy to admin, return new access token |
| `src/app/api/auth/logout/route.ts` | POST: clear refresh cookie, proxy logout to admin |
| `src/app/my-plugins/page.tsx` | User's purchased/installed plugins page |
| `src/components/auth/LoginButton.tsx` | GitHub sign-in button with animation |
| `src/components/auth/UserMenu.tsx` | Avatar dropdown: profile, my plugins, developer dashboard, logout |
| `src/components/motion/PageTransition.tsx` | AnimatePresence wrapper for page transitions |
| `src/components/motion/AnimatedCard.tsx` | 3D tilt + glow border plugin card |
| `src/components/motion/StaggerGrid.tsx` | Staggered grid animation for plugin lists |
| `src/components/motion/InstallButton.tsx` | Animated install button: idle -> progress -> success burst |
| `src/components/motion/ShimmerSkeleton.tsx` | Loading skeleton with shimmer effect |
| `src/components/motion/AnimatedCounter.tsx` | Number counter animation for stats |

### Store Frontend — Modified Files

| File | Changes |
|------|---------|
| `package.json` | Add `framer-motion`, `jose` |
| `src/app/client-layout.tsx` | Wrap with AuthProvider |
| `src/components/layout/Header.tsx` | Add LoginButton/UserMenu, add "My Plugins" nav item |
| `src/app/page.tsx` | Replace mock imports with API calls, add motion components |
| `src/app/plugins/page.tsx` | Replace mock data, add StaggerGrid, animated filters |
| `src/app/plugins/[id]/page.tsx` | Replace mock data, add InstallButton, animated version timeline |
| `src/app/developer/page.tsx` | Real GitHub auth check, real stats from API, AnimatedCounter |
| `src/app/developer/submit/page.tsx` | Real repo selection from GitHub, real bundle upload, real submission |
| `src/app/about/page.tsx` | Add motion animations |
| `src/data/plugins.ts` | Keep Plugin type definition, remove hardcoded data array and helper functions |

---

## Chunk 1: Admin Backend Infrastructure

Database schema migration, JWT utilities, crypto helpers, CORS, rate limiting. This is the foundation everything else builds on.

### Task 1.1: Database Schema Migration

**Files:**
- Modify: `mio-plugin-admin/src/lib/db.ts`

- [ ] **Step 1: Read current Next.js 16 API docs**

Run: `ls /Users/ying/Documents/AI/mio-plugin-admin/node_modules/next/dist/docs/` and read relevant API route docs to ensure we use the correct patterns.

- [ ] **Step 2: Update initDb in db.ts — add new tables**

Add after existing CREATE TABLE statements in `initDb()`:

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  github_id INTEGER UNIQUE NOT NULL,
  github_login TEXT NOT NULL,
  avatar_url TEXT,
  email TEXT,
  role TEXT DEFAULT 'user',
  github_access_token TEXT,
  github_app_installation_id INTEGER,
  refresh_token_hash TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS plugin_versions (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  version TEXT NOT NULL,
  commit_sha TEXT,
  bundle_path TEXT,
  bundle_size INTEGER,
  release_notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (plugin_id) REFERENCES plugins(id)
);

CREATE TABLE IF NOT EXISTS user_plugins (
  user_id TEXT NOT NULL,
  plugin_id TEXT NOT NULL,
  installed_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, plugin_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (plugin_id) REFERENCES plugins(id)
);

CREATE TABLE IF NOT EXISTS download_tokens (
  id TEXT PRIMARY KEY,
  token_hash TEXT UNIQUE NOT NULL,
  plugin_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (plugin_id) REFERENCES plugins(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

- [ ] **Step 3: Add migration for existing plugins table columns**

Add a migration function that runs after table creation. Use `PRAGMA table_info(plugins)` to check if columns exist before adding:

```typescript
function migratePluginsTable(db: Database.Database) {
  const columns = db.prepare("PRAGMA table_info(plugins)").all() as Array<{ name: string }>;
  const columnNames = new Set(columns.map(c => c.name));

  const newColumns = [
    { name: "github_repo", sql: "ALTER TABLE plugins ADD COLUMN github_repo TEXT" },
    { name: "github_branch", sql: "ALTER TABLE plugins ADD COLUMN github_branch TEXT" },
    { name: "commit_sha", sql: "ALTER TABLE plugins ADD COLUMN commit_sha TEXT" },
    { name: "bundle_path", sql: "ALTER TABLE plugins ADD COLUMN bundle_path TEXT" },
    { name: "bundle_size", sql: "ALTER TABLE plugins ADD COLUMN bundle_size INTEGER" },
    { name: "developer_id", sql: "ALTER TABLE plugins ADD COLUMN developer_id TEXT" },
    { name: "downloads", sql: "ALTER TABLE plugins ADD COLUMN downloads INTEGER DEFAULT 0" },
    { name: "icon_url", sql: "ALTER TABLE plugins ADD COLUMN icon_url TEXT" },
    { name: "current_version_id", sql: "ALTER TABLE plugins ADD COLUMN current_version_id TEXT" },
    { name: "name_en", sql: "ALTER TABLE plugins ADD COLUMN name_en TEXT" },
    { name: "description_en", sql: "ALTER TABLE plugins ADD COLUMN description_en TEXT" },
  ];

  for (const col of newColumns) {
    if (!columnNames.has(col.name)) {
      db.exec(col.sql);
    }
  }

  // Migrate licenses table
  const licCols = db.prepare("PRAGMA table_info(licenses)").all() as Array<{ name: string }>;
  const licColNames = new Set(licCols.map(c => c.name));
  if (!licColNames.has("user_id")) {
    db.exec("ALTER TABLE licenses ADD COLUMN user_id TEXT");
  }
}
```

Call `migratePluginsTable(db)` at the end of `initDb()`.

- [ ] **Step 4: Verify migration works**

Run: `cd /Users/ying/Documents/AI/mio-plugin-admin && npm run build`
Expected: Build succeeds, no errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/ying/Documents/AI/mio-plugin-admin
git add src/lib/db.ts
git commit -m "feat: add users, plugin_versions, user_plugins, download_tokens tables and migrate plugins schema"
```

### Task 1.2: Crypto Utilities

**Files:**
- Create: `mio-plugin-admin/src/lib/crypto.ts`

- [ ] **Step 1: Create crypto.ts**

```typescript
import { createCipheriv, createDecipheriv, randomBytes, createHash, timingSafeEqual } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const key = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    throw new Error("GITHUB_TOKEN_ENCRYPTION_KEY must be at least 32 characters");
  }
  return createHash("sha256").update(key).digest();
}

export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${encrypted}:${authTag}`;
}

export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();
  const [ivHex, encrypted, authTagHex] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSecureToken(): string {
  return randomBytes(32).toString("hex");
}

export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/crypto.ts
git commit -m "feat: add crypto utilities — AES-256-GCM encryption, secure token generation, constant-time compare"
```

### Task 1.3: JWT Utilities

**Files:**
- Create: `mio-plugin-admin/src/lib/jwt.ts`
- Modify: `mio-plugin-admin/package.json` (add jose)

- [ ] **Step 1: Install jose**

Run: `cd /Users/ying/Documents/AI/mio-plugin-admin && npm install jose`

- [ ] **Step 2: Create jwt.ts**

Use `jose` library (works in Edge and Node, no native deps). The JWT contains: `{ sub: user.id, github_id, github_login, role }`.

```typescript
import { SignJWT, jwtVerify } from "jose";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export interface JwtPayload {
  sub: string;       // user id
  github_id: number;
  github_login: string;
  role: string;
}

export async function signAccessToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getJwtSecret());
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, getJwtSecret());
  return payload as unknown as JwtPayload;
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json src/lib/jwt.ts
git commit -m "feat: add JWT utilities with jose — 15min access tokens, HS256"
```

### Task 1.4: CORS Helper

**Files:**
- Create: `mio-plugin-admin/src/lib/cors.ts`

- [ ] **Step 1: Create cors.ts**

A helper that returns CORS headers for public API routes. Must handle preflight (OPTIONS) requests.

```typescript
const ALLOWED_ORIGIN = process.env.STORE_ORIGIN || "https://miomio.chat";

export function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  };
}

export function corsResponse(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: corsHeaders() });
}

export function corsError(error: string, code: string, status: number): Response {
  return Response.json({ error, code }, { status, headers: corsHeaders() });
}

export function handleOptions(): Response {
  return new Response(null, { status: 204, headers: corsHeaders() });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/cors.ts
git commit -m "feat: add CORS helper for public API routes"
```

### Task 1.5: Rate Limiter

**Files:**
- Create: `mio-plugin-admin/src/lib/rate-limit.ts`

- [ ] **Step 1: Create rate-limit.ts**

Simple in-memory sliding window rate limiter. No external dependencies.

```typescript
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 60_000);

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  entry.count++;
  if (entry.count > limit) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: limit - entry.count };
}

export function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/rate-limit.ts
git commit -m "feat: add in-memory rate limiter with sliding window"
```

### Task 1.6: Public Auth Middleware

**Files:**
- Create: `mio-plugin-admin/src/lib/public-auth.ts`

- [ ] **Step 1: Create public-auth.ts**

Extracts and verifies JWT from Authorization header. Returns user payload or null.

```typescript
import { verifyAccessToken, type JwtPayload } from "./jwt";

export async function getAuthUser(request: Request): Promise<JwtPayload | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  try {
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}

export async function requireAuth(request: Request): Promise<JwtPayload> {
  const user = await getAuthUser(request);
  if (!user) throw new AuthError("Unauthorized", "UNAUTHORIZED", 401);
  return user;
}

export async function requireRole(request: Request, role: string): Promise<JwtPayload> {
  const user = await requireAuth(request);
  if (user.role !== role && user.role !== "admin") {
    throw new AuthError("Forbidden", "FORBIDDEN", 403);
  }
  return user;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number
  ) {
    super(message);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/public-auth.ts
git commit -m "feat: add public API auth middleware — JWT verification, role checking"
```

---

## Chunk 2: Admin Auth API (GitHub OAuth)

GitHub OAuth code exchange, token refresh, user management.

### Task 2.1: GitHub API Client

**Files:**
- Create: `mio-plugin-admin/src/lib/github.ts`

- [ ] **Step 1: Create github.ts**

```typescript
import { encrypt, decrypt } from "./crypto";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;

export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  email: string | null;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`GitHub OAuth error: ${data.error_description}`);
  return data.access_token;
}

export async function getGitHubUser(accessToken: string): Promise<GitHubUser> {
  const res = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

export async function getUserRepos(installationId: number): Promise<Array<{ full_name: string; private: boolean; default_branch: string }>> {
  const installationToken = await getInstallationToken(installationId);
  const res = await fetch("https://api.github.com/installation/repositories?per_page=100", {
    headers: { Authorization: `Bearer ${installationToken}`, Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const data = await res.json();
  return data.repositories.map((r: any) => ({
    full_name: r.full_name,
    private: r.private,
    default_branch: r.default_branch,
  }));
}

export async function getRepoFileTree(installationId: number, repo: string, sha: string): Promise<any> {
  const installationToken = await getInstallationToken(installationId);
  const res = await fetch(`https://api.github.com/repos/${repo}/git/trees/${sha}?recursive=1`, {
    headers: { Authorization: `Bearer ${installationToken}`, Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

export async function getFileContent(installationId: number, repo: string, path: string, sha: string): Promise<string> {
  const installationToken = await getInstallationToken(installationId);
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${sha}`, {
    headers: { Authorization: `Bearer ${installationToken}`, Accept: "application/vnd.github.raw+json" },
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.text();
}

async function getInstallationToken(installationId: number): Promise<string> {
  // GitHub App authentication: create JWT from App private key, exchange for installation token
  const appId = process.env.GITHUB_APP_ID!;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY!;

  const { SignJWT } = await import("jose");
  const key = await import("crypto").then(c => c.createPrivateKey(privateKey));

  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(appId)
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(key);

  const res = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}`, Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(`GitHub installation token error: ${res.status}`);
  const data = await res.json();
  return data.token;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/github.ts
git commit -m "feat: add GitHub API client — OAuth exchange, user profile, installation token, repo access"
```

### Task 2.2: Auth API — GitHub OAuth Exchange

**Files:**
- Create: `mio-plugin-admin/src/app/api/public/auth/github/route.ts`

- [ ] **Step 1: Read Next.js 16 route handler docs**

Run: `find /Users/ying/Documents/AI/mio-plugin-admin/node_modules/next/dist/docs -name "*.md" | head -20` and read the relevant API route handler documentation to confirm the correct export signature.

- [ ] **Step 2: Create the route**

This endpoint receives the OAuth code from the Store's callback route, exchanges it for a GitHub access token, creates/updates the user, and returns JWT + refresh token.

```typescript
import { getDb } from "@/lib/db";
import { exchangeCodeForToken, getGitHubUser } from "@/lib/github";
import { signAccessToken } from "@/lib/jwt";
import { encrypt, hashToken, generateSecureToken } from "@/lib/crypto";
import { corsResponse, corsError, handleOptions } from "@/lib/cors";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { randomUUID } from "crypto";

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`auth:${ip}`, 20);
  if (!rl.allowed) return corsError("Too many requests", "RATE_LIMITED", 429);

  try {
    const { code } = await request.json();
    if (!code) return corsError("Missing code", "VALIDATION_ERROR", 400);

    // Exchange code for GitHub access token
    const githubToken = await exchangeCodeForToken(code);
    const githubUser = await getGitHubUser(githubToken);

    const db = getDb();

    // Create or update user
    let user = db.prepare("SELECT * FROM users WHERE github_id = ?").get(githubUser.id) as any;

    if (!user) {
      const userId = randomUUID();
      db.prepare(
        `INSERT INTO users (id, github_id, github_login, avatar_url, email, github_access_token)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(userId, githubUser.id, githubUser.login, githubUser.avatar_url, githubUser.email, encrypt(githubToken));
      user = { id: userId, github_id: githubUser.id, github_login: githubUser.login, role: "user", avatar_url: githubUser.avatar_url };
    } else {
      db.prepare(
        "UPDATE users SET github_login = ?, avatar_url = ?, email = ?, github_access_token = ? WHERE id = ?"
      ).run(githubUser.login, githubUser.avatar_url, githubUser.email, encrypt(githubToken), user.id);
    }

    // Generate tokens
    const accessToken = await signAccessToken({
      sub: user.id,
      github_id: user.github_id,
      github_login: user.github_login,
      role: user.role,
    });

    const refreshToken = generateSecureToken();
    db.prepare("UPDATE users SET refresh_token_hash = ? WHERE id = ?")
      .run(hashToken(refreshToken), user.id);

    return corsResponse({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        github_id: user.github_id,
        github_login: user.github_login,
        avatar_url: user.avatar_url,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error("GitHub auth error:", err);
    return corsError(err.message || "Authentication failed", "INTERNAL_ERROR", 500);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/public/auth/github/route.ts
git commit -m "feat: add GitHub OAuth exchange endpoint — creates user, returns JWT + refresh token"
```

### Task 2.3: Auth API — Refresh & Logout & Me

**Files:**
- Create: `mio-plugin-admin/src/app/api/public/auth/refresh/route.ts`
- Create: `mio-plugin-admin/src/app/api/public/auth/logout/route.ts`
- Create: `mio-plugin-admin/src/app/api/public/auth/me/route.ts`

- [ ] **Step 1: Create refresh route**

Receives refresh token in body (sent from Store's proxy route). Validates against hashed token in DB. Issues new access token + new refresh token (rotation).

```typescript
// refresh/route.ts
import { getDb } from "@/lib/db";
import { signAccessToken } from "@/lib/jwt";
import { hashToken, generateSecureToken, constantTimeCompare } from "@/lib/crypto";
import { corsResponse, corsError, handleOptions } from "@/lib/cors";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function OPTIONS() { return handleOptions(); }

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`auth:${ip}`, 20);
  if (!rl.allowed) return corsError("Too many requests", "RATE_LIMITED", 429);

  try {
    const { refresh_token } = await request.json();
    if (!refresh_token) return corsError("Missing refresh_token", "VALIDATION_ERROR", 400);

    const db = getDb();
    const tokenHash = hashToken(refresh_token);

    const user = db.prepare(
      "SELECT * FROM users WHERE refresh_token_hash = ?"
    ).get(tokenHash) as any;

    if (!user) return corsError("Invalid refresh token", "UNAUTHORIZED", 401);

    // Rotate refresh token
    const newRefreshToken = generateSecureToken();
    const newAccessToken = await signAccessToken({
      sub: user.id,
      github_id: user.github_id,
      github_login: user.github_login,
      role: user.role,
    });

    db.prepare("UPDATE users SET refresh_token_hash = ? WHERE id = ?")
      .run(hashToken(newRefreshToken), user.id);

    return corsResponse({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    });
  } catch {
    return corsError("Token refresh failed", "INTERNAL_ERROR", 500);
  }
}
```

- [ ] **Step 2: Create logout route**

```typescript
// logout/route.ts
import { getDb } from "@/lib/db";
import { hashToken } from "@/lib/crypto";
import { corsResponse, corsError, handleOptions } from "@/lib/cors";

export async function OPTIONS() { return handleOptions(); }

export async function POST(request: Request) {
  try {
    const { refresh_token } = await request.json();
    if (refresh_token) {
      const db = getDb();
      const tokenHash = hashToken(refresh_token);
      db.prepare("UPDATE users SET refresh_token_hash = NULL WHERE refresh_token_hash = ?").run(tokenHash);
    }
    return corsResponse({ ok: true });
  } catch {
    return corsResponse({ ok: true });
  }
}
```

- [ ] **Step 3: Create me route**

```typescript
// me/route.ts
import { getDb } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/public-auth";
import { corsResponse, corsError, handleOptions } from "@/lib/cors";

export async function OPTIONS() { return handleOptions(); }

export async function GET(request: Request) {
  try {
    const payload = await requireAuth(request);
    const db = getDb();
    const user = db.prepare(
      "SELECT id, github_id, github_login, avatar_url, email, role, github_app_installation_id, created_at FROM users WHERE id = ?"
    ).get(payload.sub) as any;
    if (!user) return corsError("User not found", "NOT_FOUND", 404);
    return corsResponse({ user });
  } catch (err) {
    if (err instanceof AuthError) return corsError(err.message, err.code, err.status);
    return corsError("Internal error", "INTERNAL_ERROR", 500);
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/public/auth/
git commit -m "feat: add refresh, logout, me endpoints — token rotation, session management"
```

---

## Chunk 3: Admin Plugin Public API

Public endpoints for plugin listing, detail, and bundle download.

### Task 3.1: List Plugins API

**Files:**
- Create: `mio-plugin-admin/src/app/api/public/plugins/route.ts`

- [ ] **Step 1: Create plugins list route**

```typescript
import { getDb } from "@/lib/db";
import { corsResponse, handleOptions } from "@/lib/cors";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function OPTIONS() { return handleOptions(); }

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`plugins:${ip}`, 100);
  if (!rl.allowed) return corsResponse({ error: "Too many requests", code: "RATE_LIMITED" }, 429);

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const type = url.searchParams.get("type") || "";
  const sort = url.searchParams.get("sort") || "popular";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
  const offset = (page - 1) * limit;

  const db = getDb();
  let query = "SELECT * FROM plugins WHERE status = 'approved'";
  const params: any[] = [];

  if (search) {
    query += " AND (name LIKE ? OR name_en LIKE ? OR description LIKE ? OR author_name LIKE ?)";
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  if (type && type !== "all") {
    query += " AND type = ?";
    params.push(type);
  }

  // Count total
  const countQuery = query.replace("SELECT *", "SELECT COUNT(*) as total");
  const { total } = db.prepare(countQuery).get(...params) as { total: number };

  // Sort
  if (sort === "newest") query += " ORDER BY submitted_at DESC";
  else if (sort === "popular") query += " ORDER BY downloads DESC";
  else query += " ORDER BY submitted_at DESC";

  query += " LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const plugins = db.prepare(query).all(...params);

  return corsResponse({
    plugins,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/public/plugins/route.ts
git commit -m "feat: add public plugin list API with search, filter, sort, pagination"
```

### Task 3.2: Plugin Detail API

**Files:**
- Create: `mio-plugin-admin/src/app/api/public/plugins/[id]/route.ts`

- [ ] **Step 1: Create plugin detail route**

Returns full plugin info plus version history. Check Next.js 16 docs for the correct dynamic route params pattern (may use `props.params` or `{ params }` depending on version).

```typescript
import { getDb } from "@/lib/db";
import { corsResponse, corsError, handleOptions } from "@/lib/cors";

export async function OPTIONS() { return handleOptions(); }

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();

  const plugin = db.prepare("SELECT * FROM plugins WHERE id = ? AND status = 'approved'").get(id);
  if (!plugin) return corsError("Plugin not found", "NOT_FOUND", 404);

  const versions = db.prepare(
    "SELECT id, version, release_notes, status, created_at FROM plugin_versions WHERE plugin_id = ? AND status = 'approved' ORDER BY created_at DESC"
  ).all(id);

  return corsResponse({ plugin, versions });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/public/plugins/\[id\]/route.ts
git commit -m "feat: add public plugin detail API with version history"
```

### Task 3.3: Bundle Download API

**Files:**
- Create: `mio-plugin-admin/src/app/api/public/plugins/[id]/download/route.ts`

- [ ] **Step 1: Create download route**

Validates one-time download token. Streams the bundle file. Increments download count.

```typescript
import { getDb } from "@/lib/db";
import { hashToken } from "@/lib/crypto";
import { corsResponse, corsError, handleOptions } from "@/lib/cors";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createReadStream, statSync } from "fs";
import { Readable } from "stream";

export async function OPTIONS() { return handleOptions(); }

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ip = getClientIp(request);
  const rl = rateLimit(`download:${ip}`, 30);
  if (!rl.allowed) return corsError("Too many requests", "RATE_LIMITED", 429);

  const url = new URL(request.url);
  const downloadToken = url.searchParams.get("token");
  if (!downloadToken) return corsError("Missing download token", "UNAUTHORIZED", 401);

  const db = getDb();

  // Validate one-time token
  const tokenHash = hashToken(downloadToken);
  const tokenRecord = db.prepare(
    "SELECT * FROM download_tokens WHERE token_hash = ? AND plugin_id = ? AND used = 0"
  ).get(tokenHash, id) as any;

  if (!tokenRecord) return corsError("Invalid or expired token", "UNAUTHORIZED", 401);
  if (new Date(tokenRecord.expires_at) < new Date()) {
    return corsError("Token expired", "UNAUTHORIZED", 401);
  }

  // Mark token as used
  db.prepare("UPDATE download_tokens SET used = 1 WHERE id = ?").run(tokenRecord.id);

  // Get plugin and serve bundle
  const plugin = db.prepare("SELECT * FROM plugins WHERE id = ?").get(id) as any;
  if (!plugin?.bundle_path) return corsError("Bundle not found", "NOT_FOUND", 404);

  try {
    const stat = statSync(plugin.bundle_path);
    const stream = createReadStream(plugin.bundle_path);
    const webStream = Readable.toWeb(stream) as ReadableStream;

    // Increment download count
    db.prepare("UPDATE plugins SET downloads = downloads + 1 WHERE id = ?").run(id);

    // Record in user_plugins
    db.prepare(
      "INSERT OR IGNORE INTO user_plugins (user_id, plugin_id) VALUES (?, ?)"
    ).run(tokenRecord.user_id, id);

    return new Response(webStream, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${plugin.name}.bundle"`,
        "Content-Length": stat.size.toString(),
        ...Object.fromEntries(Object.entries({
          "Access-Control-Allow-Origin": process.env.STORE_ORIGIN || "https://miomio.chat",
        })),
      },
    });
  } catch {
    return corsError("Bundle file not found on disk", "INTERNAL_ERROR", 500);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/public/plugins/\[id\]/download/route.ts
git commit -m "feat: add bundle download API with one-time token validation"
```

### Task 3.4: Install Token Generation API

**Files:**
- Create: `mio-plugin-admin/src/app/api/public/user/install-token/route.ts`

- [ ] **Step 1: Create install-token route**

```typescript
import { getDb } from "@/lib/db";
import { generateSecureToken, hashToken } from "@/lib/crypto";
import { requireAuth, AuthError } from "@/lib/public-auth";
import { corsResponse, corsError, handleOptions } from "@/lib/cors";
import { randomUUID } from "crypto";

export async function OPTIONS() { return handleOptions(); }

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const { plugin_id } = await request.json();
    if (!plugin_id) return corsError("Missing plugin_id", "VALIDATION_ERROR", 400);

    const db = getDb();

    // Check plugin exists and is approved
    const plugin = db.prepare("SELECT id FROM plugins WHERE id = ? AND status = 'approved'").get(plugin_id);
    if (!plugin) return corsError("Plugin not found", "NOT_FOUND", 404);

    // TODO: For paid plugins, check license ownership here

    // Generate one-time token
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min

    db.prepare(
      "INSERT INTO download_tokens (id, token_hash, plugin_id, user_id, expires_at) VALUES (?, ?, ?, ?, ?)"
    ).run(randomUUID(), hashToken(token), plugin_id, user.sub, expiresAt);

    // Clean up old expired tokens
    db.prepare("DELETE FROM download_tokens WHERE expires_at < datetime('now') OR used = 1").run();

    return corsResponse({ download_token: token, expires_at: expiresAt });
  } catch (err) {
    if (err instanceof AuthError) return corsError(err.message, err.code, err.status);
    return corsError("Internal error", "INTERNAL_ERROR", 500);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/public/user/install-token/route.ts
git commit -m "feat: add one-time download token generation endpoint"
```

---

## Chunk 4: Admin Developer API

Developer plugin submission and bundle upload.

### Task 4.1: Developer Repos API

**Files:**
- Create: `mio-plugin-admin/src/app/api/public/developer/repos/route.ts`

- [ ] **Step 1: Create repos route**

Lists repositories the developer has granted access to via GitHub App installation.

```typescript
import { getDb } from "@/lib/db";
import { getUserRepos } from "@/lib/github";
import { requireAuth, AuthError } from "@/lib/public-auth";
import { corsResponse, corsError, handleOptions } from "@/lib/cors";

export async function OPTIONS() { return handleOptions(); }

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const db = getDb();
    const dbUser = db.prepare("SELECT github_app_installation_id FROM users WHERE id = ?").get(user.sub) as any;

    if (!dbUser?.github_app_installation_id) {
      return corsResponse({ repos: [], needs_installation: true });
    }

    const repos = await getUserRepos(dbUser.github_app_installation_id);
    return corsResponse({ repos });
  } catch (err) {
    if (err instanceof AuthError) return corsError(err.message, err.code, err.status);
    return corsError("Failed to fetch repos", "INTERNAL_ERROR", 500);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/public/developer/repos/route.ts
git commit -m "feat: add developer repos listing via GitHub App installation"
```

### Task 4.2: Plugin Submission API

**Files:**
- Create: `mio-plugin-admin/src/app/api/public/developer/submit/route.ts`

- [ ] **Step 1: Create submit route**

Receives plugin metadata + GitHub repo info. Creates plugin record with pending status. Developer role auto-granted on first submission.

```typescript
import { getDb } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/public-auth";
import { corsResponse, corsError, handleOptions } from "@/lib/cors";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { randomUUID } from "crypto";

export async function OPTIONS() { return handleOptions(); }

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`submit:${ip}`, 5);
  if (!rl.allowed) return corsError("Too many requests", "RATE_LIMITED", 429);

  try {
    const user = await requireAuth(request);
    const body = await request.json();

    const { name, name_en, type, description, description_en, price, github_repo, github_branch, commit_sha } = body;

    // Validate required fields
    if (!name || !type || !github_repo || !commit_sha) {
      return corsError("Missing required fields", "VALIDATION_ERROR", 400);
    }
    if (!["theme", "buddy", "sound"].includes(type)) {
      return corsError("Invalid plugin type", "VALIDATION_ERROR", 400);
    }

    const db = getDb();

    // Auto-upgrade to developer role
    if (user.role === "user") {
      db.prepare("UPDATE users SET role = 'developer' WHERE id = ?").run(user.sub);
    }

    const pluginId = randomUUID();
    const versionId = randomUUID();

    db.prepare(
      `INSERT INTO plugins (id, type, name, name_en, version, author_name, author_github, price, description, description_en,
        status, github_repo, github_branch, commit_sha, developer_id, current_version_id)
       VALUES (?, ?, ?, ?, '1.0.0', ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)`
    ).run(
      pluginId, type, name, name_en || "", user.github_login, user.github_login,
      price || 0, description || "", description_en || "",
      github_repo, github_branch || "main", commit_sha, user.sub, versionId
    );

    db.prepare(
      `INSERT INTO plugin_versions (id, plugin_id, version, commit_sha, status)
       VALUES (?, ?, '1.0.0', ?, 'pending')`
    ).run(versionId, pluginId, commit_sha);

    return corsResponse({ plugin_id: pluginId, version_id: versionId, status: "pending" }, 201);
  } catch (err) {
    if (err instanceof AuthError) return corsError(err.message, err.code, err.status);
    return corsError("Submission failed", "INTERNAL_ERROR", 500);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/public/developer/submit/route.ts
git commit -m "feat: add plugin submission API with auto developer role upgrade"
```

### Task 4.3: Bundle Upload API

**Files:**
- Create: `mio-plugin-admin/src/app/api/public/developer/upload/route.ts`

- [ ] **Step 1: Create upload route**

Accepts multipart form data with `.bundle` file (zipped). Stores to `/data/bundles/{plugin_id}/{version}/`. Server generates all path components. Max 50MB.

```typescript
import { getDb } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/public-auth";
import { corsResponse, corsError, handleOptions } from "@/lib/cors";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const MAX_SIZE = 50 * 1024 * 1024; // 50MB
const BUNDLES_DIR = path.join(process.cwd(), "data", "bundles");

export async function OPTIONS() { return handleOptions(); }

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`upload:${ip}`, 5, 60_000);
  if (!rl.allowed) return corsError("Too many requests", "RATE_LIMITED", 429);

  try {
    const user = await requireAuth(request);
    const formData = await request.formData();
    const file = formData.get("bundle") as File | null;
    const pluginId = formData.get("plugin_id") as string | null;
    const versionId = formData.get("version_id") as string | null;

    if (!file || !pluginId || !versionId) {
      return corsError("Missing bundle file, plugin_id, or version_id", "VALIDATION_ERROR", 400);
    }
    if (file.size > MAX_SIZE) {
      return corsError("File too large (max 50MB)", "VALIDATION_ERROR", 400);
    }

    const db = getDb();

    // Verify ownership
    const plugin = db.prepare(
      "SELECT * FROM plugins WHERE id = ? AND developer_id = ?"
    ).get(pluginId, user.sub) as any;
    if (!plugin) return corsError("Plugin not found or not owned", "FORBIDDEN", 403);

    // Save file with server-generated path
    const safeFilename = `${randomUUID()}.bundle`;
    const dir = path.join(BUNDLES_DIR, pluginId, versionId);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, safeFilename);

    const buffer = Buffer.from(await file.arrayBuffer());
    writeFileSync(filePath, buffer);

    // Update plugin record
    db.prepare(
      "UPDATE plugins SET bundle_path = ?, bundle_size = ? WHERE id = ?"
    ).run(filePath, file.size, pluginId);

    db.prepare(
      "UPDATE plugin_versions SET bundle_path = ?, bundle_size = ? WHERE id = ?"
    ).run(filePath, file.size, versionId);

    return corsResponse({ ok: true, size: file.size });
  } catch (err) {
    if (err instanceof AuthError) return corsError(err.message, err.code, err.status);
    return corsError("Upload failed", "INTERNAL_ERROR", 500);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/public/developer/upload/route.ts
git commit -m "feat: add bundle upload API — server-generated paths, 50MB limit, ownership validation"
```

### Task 4.4: Developer Plugins List + User Plugins List + License Verify

**Files:**
- Create: `mio-plugin-admin/src/app/api/public/developer/plugins/route.ts`
- Create: `mio-plugin-admin/src/app/api/public/user/plugins/route.ts`
- Create: `mio-plugin-admin/src/app/api/public/license/verify/route.ts`

- [ ] **Step 1: Create developer plugins list**

```typescript
// developer/plugins/route.ts — lists developer's own plugins (all statuses)
import { getDb } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/public-auth";
import { corsResponse, corsError, handleOptions } from "@/lib/cors";

export async function OPTIONS() { return handleOptions(); }

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const db = getDb();
    const plugins = db.prepare(
      "SELECT * FROM plugins WHERE developer_id = ? ORDER BY submitted_at DESC"
    ).all(user.sub);
    return corsResponse({ plugins });
  } catch (err) {
    if (err instanceof AuthError) return corsError(err.message, err.code, err.status);
    return corsError("Internal error", "INTERNAL_ERROR", 500);
  }
}
```

- [ ] **Step 2: Create user plugins list**

```typescript
// user/plugins/route.ts — lists user's installed/purchased plugins
import { getDb } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/public-auth";
import { corsResponse, corsError, handleOptions } from "@/lib/cors";

export async function OPTIONS() { return handleOptions(); }

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const db = getDb();
    const plugins = db.prepare(
      `SELECT p.*, up.installed_at
       FROM user_plugins up
       JOIN plugins p ON up.plugin_id = p.id
       WHERE up.user_id = ?
       ORDER BY up.installed_at DESC`
    ).all(user.sub);
    return corsResponse({ plugins });
  } catch (err) {
    if (err instanceof AuthError) return corsError(err.message, err.code, err.status);
    return corsError("Internal error", "INTERNAL_ERROR", 500);
  }
}
```

- [ ] **Step 3: Create license verify**

```typescript
// license/verify/route.ts — for macOS app to verify licenses
import { getDb } from "@/lib/db";
import { hashToken, constantTimeCompare } from "@/lib/crypto";
import { corsResponse, corsError, handleOptions } from "@/lib/cors";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function OPTIONS() { return handleOptions(); }

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`license:${ip}`, 10);
  if (!rl.allowed) return corsError("Too many requests", "RATE_LIMITED", 429);

  try {
    const { key, plugin_id } = await request.json();
    if (!key || !plugin_id) return corsError("Missing fields", "VALIDATION_ERROR", 400);

    const db = getDb();
    const license = db.prepare(
      "SELECT * FROM licenses WHERE plugin_id = ? AND status = 'active'"
    ).all(plugin_id) as any[];

    const match = license.find(l => constantTimeCompare(l.key, key));
    if (!match) return corsResponse({ valid: false });

    if (match.expires_at && new Date(match.expires_at) < new Date()) {
      return corsResponse({ valid: false, reason: "expired" });
    }

    return corsResponse({ valid: true, plugin_id, expires_at: match.expires_at });
  } catch {
    return corsError("Verification failed", "INTERNAL_ERROR", 500);
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/public/developer/plugins/ src/app/api/public/user/plugins/ src/app/api/public/license/
git commit -m "feat: add developer plugins list, user plugins list, license verify endpoints"
```

### Task 4.5: Build and Deploy Admin

- [ ] **Step 1: Create .env.example for admin**

Create `/Users/ying/Documents/AI/mio-plugin-admin/.env.example` with all required env vars:

```bash
ADMIN_PASSWORD=mioadmin2026
JWT_SECRET=your-secret-at-least-32-chars-long-change-this
GITHUB_TOKEN_ENCRYPTION_KEY=your-encryption-key-at-least-32-chars
GITHUB_CLIENT_ID=your-github-app-client-id
GITHUB_CLIENT_SECRET=your-github-app-client-secret
GITHUB_APP_ID=your-github-app-id
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
STORE_ORIGIN=https://miomio.chat
```

- [ ] **Step 2: Build and test locally**

Run: `cd /Users/ying/Documents/AI/mio-plugin-admin && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "feat: add env example with all required configuration variables"
```

---

## Chunk 5: Store Auth (Proxy + Context)

Store-side auth proxy routes and React auth context. This enables login functionality.

### Task 5.1: Install Dependencies

**Files:**
- Modify: `mio-plugin-store/package.json`

- [ ] **Step 1: Install framer-motion and jose**

Run: `cd /Users/ying/Documents/AI/mio-plugin-store && npm install framer-motion jose`

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add framer-motion and jose dependencies"
```

### Task 5.2: API Client

**Files:**
- Create: `mio-plugin-store/src/lib/api.ts`

- [ ] **Step 1: Read Next.js 16 docs for API route patterns**

Run: `ls /Users/ying/Documents/AI/mio-plugin-store/node_modules/next/dist/docs/` and read relevant docs.

- [ ] **Step 2: Create api.ts**

Centralized API client. Stores access token in memory. Auto-refreshes via Store proxy when expired.

```typescript
const ADMIN_API = process.env.NEXT_PUBLIC_ADMIN_API || "https://cat.wdao.chat";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

async function refreshToken(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/refresh", { method: "POST" });
    if (!res.ok) return false;
    const data = await res.json();
    accessToken = data.access_token;
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${ADMIN_API}${path}`;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  let res = await fetch(url, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401 && accessToken) {
    const refreshed = await refreshToken();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${accessToken}`;
      res = await fetch(url, { ...options, headers });
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed", code: "UNKNOWN" }));
    throw new ApiError(error.error, error.code, res.status);
  }

  return res.json();
}

export class ApiError extends Error {
  constructor(message: string, public code: string, public status: number) {
    super(message);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: add API client with auto token refresh"
```

### Task 5.3: Auth Proxy Routes

**Files:**
- Create: `mio-plugin-store/src/app/api/auth/login/route.ts`
- Create: `mio-plugin-store/src/app/api/auth/callback/route.ts`
- Create: `mio-plugin-store/src/app/api/auth/refresh/route.ts`
- Create: `mio-plugin-store/src/app/api/auth/logout/route.ts`

- [ ] **Step 1: Create login route**

Generates random state, sets it as a cookie, redirects to GitHub OAuth.

```typescript
// login/route.ts
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;

export async function GET() {
  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600, // 10 min
    path: "/",
  });

  const githubUrl = new URL("https://github.com/login/oauth/authorize");
  githubUrl.searchParams.set("client_id", GITHUB_CLIENT_ID);
  githubUrl.searchParams.set("redirect_uri", `${process.env.NEXT_PUBLIC_SITE_URL || "https://miomio.chat"}/api/auth/callback`);
  githubUrl.searchParams.set("scope", "read:user user:email");
  githubUrl.searchParams.set("state", state);

  return Response.redirect(githubUrl.toString());
}
```

- [ ] **Step 2: Create callback route**

Verifies state, exchanges code via admin API, sets refresh token cookie, redirects to homepage with access token in a short-lived cookie (read once by client).

```typescript
// callback/route.ts
import { cookies } from "next/headers";

const ADMIN_API = process.env.ADMIN_API || "https://cat.wdao.chat";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://miomio.chat";

  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state")?.value;

  // Verify state
  if (!state || !savedState || state !== savedState) {
    return Response.redirect(`${siteUrl}?error=invalid_state`);
  }
  cookieStore.delete("oauth_state");

  if (!code) {
    return Response.redirect(`${siteUrl}?error=no_code`);
  }

  try {
    // Exchange code via admin API
    const res = await fetch(`${ADMIN_API}/api/public/auth/github`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (!res.ok) {
      return Response.redirect(`${siteUrl}?error=auth_failed`);
    }

    const data = await res.json();

    // Set refresh token as first-party httpOnly cookie
    cookieStore.set("mio_refresh", data.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    // Set access token + user info as short-lived cookie for client to read once
    cookieStore.set("mio_auth_data", JSON.stringify({
      access_token: data.access_token,
      user: data.user,
    }), {
      httpOnly: false, // client needs to read this
      secure: true,
      sameSite: "lax",
      maxAge: 60, // 1 min, just long enough for client to pick up
      path: "/",
    });

    return Response.redirect(`${siteUrl}?auth=success`);
  } catch {
    return Response.redirect(`${siteUrl}?error=auth_failed`);
  }
}
```

- [ ] **Step 3: Create refresh route**

```typescript
// refresh/route.ts
import { cookies } from "next/headers";

const ADMIN_API = process.env.ADMIN_API || "https://cat.wdao.chat";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("mio_refresh")?.value;

  if (!refreshToken) {
    return Response.json({ error: "No refresh token" }, { status: 401 });
  }

  try {
    const res = await fetch(`${ADMIN_API}/api/public/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      cookieStore.delete("mio_refresh");
      return Response.json({ error: "Refresh failed" }, { status: 401 });
    }

    const data = await res.json();

    // Update refresh token cookie (rotation)
    cookieStore.set("mio_refresh", data.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return Response.json({ access_token: data.access_token });
  } catch {
    return Response.json({ error: "Refresh failed" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Create logout route**

```typescript
// logout/route.ts
import { cookies } from "next/headers";

const ADMIN_API = process.env.ADMIN_API || "https://cat.wdao.chat";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("mio_refresh")?.value;

  if (refreshToken) {
    // Best effort invalidation on admin
    fetch(`${ADMIN_API}/api/public/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }).catch(() => {});
  }

  cookieStore.delete("mio_refresh");
  cookieStore.delete("mio_auth_data");

  return Response.json({ ok: true });
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/auth/
git commit -m "feat: add auth proxy routes — login, callback, refresh, logout with first-party cookies"
```

### Task 5.4: Auth Context

**Files:**
- Create: `mio-plugin-store/src/lib/auth-context.tsx`
- Modify: `mio-plugin-store/src/app/client-layout.tsx`

- [ ] **Step 1: Create auth-context.tsx**

React context providing user state, login/logout functions. On mount, reads one-time auth cookie if present, otherwise attempts silent refresh.

```typescript
"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { setAccessToken, getAccessToken } from "./api";

interface User {
  id: string;
  github_id: number;
  github_login: string;
  avatar_url: string;
  role: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for one-time auth cookie (set after OAuth callback)
    const cookies = document.cookie.split("; ");
    const authCookie = cookies.find(c => c.startsWith("mio_auth_data="));
    if (authCookie) {
      try {
        const data = JSON.parse(decodeURIComponent(authCookie.split("=").slice(1).join("=")));
        setAccessToken(data.access_token);
        setUser(data.user);
        // Clear the one-time cookie
        document.cookie = "mio_auth_data=; max-age=0; path=/";
        setLoading(false);
        return;
      } catch {}
    }

    // Try silent refresh
    fetch("/api/auth/refresh", { method: "POST" })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        setAccessToken(data.access_token);
        // Decode JWT to get user info (jose library works client-side too)
        const payload = JSON.parse(atob(data.access_token.split(".")[1]));
        setUser({
          id: payload.sub,
          github_id: payload.github_id,
          github_login: payload.github_login,
          avatar_url: "", // Will be fetched separately if needed
          role: payload.role,
        });
      })
      .catch(() => {
        setUser(null);
        setAccessToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(() => {
    window.location.href = "/api/auth/login";
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setAccessToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

- [ ] **Step 2: Wrap ClientLayout with AuthProvider**

Modify `src/app/client-layout.tsx` to wrap with `AuthProvider`:

```typescript
"use client";
import { I18nProvider } from "@/i18n/context";
import { AuthProvider } from "@/lib/auth-context";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </AuthProvider>
    </I18nProvider>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth-context.tsx src/app/client-layout.tsx
git commit -m "feat: add auth context with silent refresh and one-time cookie pickup"
```

### Task 5.5: Login Button & User Menu Components

**Files:**
- Create: `mio-plugin-store/src/components/auth/LoginButton.tsx`
- Create: `mio-plugin-store/src/components/auth/UserMenu.tsx`
- Modify: `mio-plugin-store/src/components/layout/Header.tsx`

- [ ] **Step 1: Create LoginButton.tsx**

Animated GitHub sign-in button using Framer Motion.

```typescript
"use client";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { Github } from "lucide-react";

export function LoginButton() {
  const { login } = useAuth();
  return (
    <motion.button
      onClick={login}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
    >
      <Github className="h-4 w-4" />
      <span>Sign in</span>
    </motion.button>
  );
}
```

- [ ] **Step 2: Create UserMenu.tsx**

Animated dropdown with user avatar.

```typescript
"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/i18n/context";
import Link from "next/link";
import { LogOut, Package, Code, User } from "lucide-react";

export function UserMenu() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 rounded-full"
      >
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full ring-2 ring-transparent hover:ring-[#CAFF00] transition-all" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#CAFF00]/20 text-sm font-bold text-[#CAFF00]">
            {user.github_login[0].toUpperCase()}
          </div>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border/50 bg-background/95 p-2 shadow-2xl backdrop-blur-xl"
          >
            <div className="px-3 py-2 border-b border-border/50 mb-1">
              <p className="text-sm font-medium">{user.github_login}</p>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
            <MenuItem href="/my-plugins" icon={Package} label={t.nav.myPlugins || "My Plugins"} onClick={() => setOpen(false)} />
            {(user.role === "developer" || user.role === "admin") && (
              <MenuItem href="/developer" icon={Code} label={t.nav.developers} onClick={() => setOpen(false)} />
            )}
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>{t.nav.logout || "Logout"}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({ href, icon: Icon, label, onClick }: { href: string; icon: any; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}
```

- [ ] **Step 3: Update Header.tsx**

Add LoginButton/UserMenu to the right section. Add "My Plugins" nav item for logged-in users.

Replace the right section div with:

```typescript
import { useAuth } from "@/lib/auth-context";
import { LoginButton } from "@/components/auth/LoginButton";
import { UserMenu } from "@/components/auth/UserMenu";
// ... in Header component:
const { user, loading } = useAuth();
// ... in right section:
{!loading && (user ? <UserMenu /> : <LoginButton />)}
```

Add to `navItems` conditionally: `{ href: "/my-plugins", label: t.nav.myPlugins || "My Plugins" }` when user is logged in.

- [ ] **Step 4: Commit**

```bash
git add src/components/auth/ src/components/layout/Header.tsx
git commit -m "feat: add GitHub login button and animated user menu dropdown"
```

---

## Chunk 6: Store — Motion Components & Core Pages

Framer Motion animation components and replacing mock data with real API calls.

### Task 6.1: Create Motion Components

**Files:**
- Create: `mio-plugin-store/src/components/motion/AnimatedCard.tsx`
- Create: `mio-plugin-store/src/components/motion/StaggerGrid.tsx`
- Create: `mio-plugin-store/src/components/motion/ShimmerSkeleton.tsx`
- Create: `mio-plugin-store/src/components/motion/AnimatedCounter.tsx`
- Create: `mio-plugin-store/src/components/motion/InstallButton.tsx`
- Create: `mio-plugin-store/src/components/motion/PageTransition.tsx`

- [ ] **Step 1: Create AnimatedCard.tsx**

3D tilt on hover with glow border effect. Used for plugin cards.

```typescript
"use client";
import { motion, useMotionValue, useTransform } from "framer-motion";
import type { ReactNode, MouseEvent } from "react";

export function AnimatedCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useTransform(y, [0, 1], [8, -8]);
  const rotateY = useTransform(x, [0, 1], [-8, 8]);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  }

  function handleMouseLeave() {
    x.set(0.5);
    y.set(0.5);
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`group relative rounded-2xl border border-border/50 bg-card p-6 shadow-lg transition-shadow hover:shadow-[0_0_30px_rgba(202,255,0,0.15)] ${className}`}
    >
      <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100 bg-gradient-to-br from-[#CAFF00]/5 to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Create StaggerGrid.tsx**

```typescript
"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } },
};

export function StaggerGrid({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 3: Create ShimmerSkeleton.tsx**

```typescript
"use client";

export function ShimmerSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-white/5 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
}

export function PluginCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-4">
      <ShimmerSkeleton className="h-12 w-12 rounded-xl" />
      <ShimmerSkeleton className="h-5 w-3/4" />
      <ShimmerSkeleton className="h-4 w-full" />
      <ShimmerSkeleton className="h-4 w-2/3" />
      <div className="flex justify-between">
        <ShimmerSkeleton className="h-4 w-20" />
        <ShimmerSkeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}
```

Add shimmer keyframe to `globals.css`:
```css
@keyframes shimmer {
  100% { transform: translateX(100%); }
}
```

- [ ] **Step 4: Create AnimatedCounter.tsx**

```typescript
"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

export function AnimatedCounter({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.floor(eased * value));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, value, duration]);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
    >
      {count.toLocaleString()}
    </motion.span>
  );
}
```

- [ ] **Step 5: Create InstallButton.tsx**

Animated button: idle -> loading ring -> success checkmark.

```typescript
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";

type ButtonState = "idle" | "loading" | "success";

export function InstallButton({ pluginId, price = 0 }: { pluginId: string; price?: number }) {
  const { user, login } = useAuth();
  const [state, setState] = useState<ButtonState>("idle");

  async function handleInstall() {
    if (!user) { login(); return; }
    if (state !== "idle") return;

    setState("loading");
    try {
      const { download_token } = await apiFetch("/api/public/user/install-token", {
        method: "POST",
        body: JSON.stringify({ plugin_id: pluginId }),
      });

      // Trigger URL scheme
      window.location.href = `mioIsland://install?id=${pluginId}&download_token=${download_token}`;
      setState("success");
      setTimeout(() => setState("idle"), 3000);
    } catch {
      setState("idle");
    }
  }

  return (
    <motion.button
      onClick={handleInstall}
      whileHover={state === "idle" ? { scale: 1.05 } : {}}
      whileTap={state === "idle" ? { scale: 0.95 } : {}}
      className={`relative flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all ${
        state === "success"
          ? "bg-green-500 text-white"
          : "bg-[#CAFF00] text-black hover:bg-[#d4ff33]"
      }`}
    >
      <AnimatePresence mode="wait">
        {state === "idle" && (
          <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            {price > 0 ? `$${price.toFixed(2)}` : "Install"}
          </motion.span>
        )}
        {state === "loading" && (
          <motion.span key="loading" initial={{ opacity: 0, rotate: 0 }} animate={{ opacity: 1, rotate: 360 }} transition={{ rotate: { repeat: Infinity, duration: 1, ease: "linear" } }}>
            <Loader2 className="h-4 w-4" />
          </motion.span>
        )}
        {state === "success" && (
          <motion.span key="success" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            Installed
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
```

- [ ] **Step 6: Create PageTransition.tsx**

```typescript
"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add src/components/motion/ src/app/globals.css
git commit -m "feat: add motion components — 3D card, stagger grid, shimmer skeleton, counter, install button"
```

### Task 6.2: Update Home Page with Real API Data

**Files:**
- Modify: `mio-plugin-store/src/app/page.tsx`

- [ ] **Step 1: Read current page.tsx to understand the structure**

- [ ] **Step 2: Rewrite as client component using API + motion components**

Replace all mock data imports (`import { plugins, ... } from "@/data/plugins"`) with `apiFetch` calls. Wrap sections with motion animations. Use AnimatedCard for plugin cards, AnimatedCounter for stats, StaggerGrid for grids, ShimmerSkeleton for loading states.

Key changes:
- `useState` + `useEffect` to fetch from `/api/public/plugins?sort=popular&limit=6` for featured
- Stats from API response pagination.total + computed values
- Wrap hero section with gradient motion animation
- Plugin cards use AnimatedCard
- All numbers use AnimatedCounter

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: home page with real API data and motion animations"
```

### Task 6.3: Update Browse Page

**Files:**
- Modify: `mio-plugin-store/src/app/plugins/page.tsx`

- [ ] **Step 1: Rewrite browse page**

Replace mock data with API calls. Add Framer Motion `layout` animations on filter changes. Use StaggerGrid for results. Add ShimmerSkeleton loading state.

Key changes:
- Fetch from `/api/public/plugins?search=X&type=Y&sort=Z&page=N`
- `layout` animation on plugin grid items when filters change
- Animated filter badges
- Pagination with animated transitions

- [ ] **Step 2: Commit**

```bash
git add src/app/plugins/page.tsx
git commit -m "feat: browse page with real API, animated filters and stagger grid"
```

### Task 6.4: Update Plugin Detail Page

**Files:**
- Modify: `mio-plugin-store/src/app/plugins/[id]/page.tsx`

- [ ] **Step 1: Rewrite detail page**

Fetch single plugin from API. Use InstallButton component. Add animated version timeline. Add PageTransition wrapper.

- [ ] **Step 2: Commit**

```bash
git add src/app/plugins/\[id\]/page.tsx
git commit -m "feat: plugin detail page with real API, install button, animated timeline"
```

### Task 6.5: Update Plugin Type Definition

**Files:**
- Modify: `mio-plugin-store/src/data/plugins.ts`

- [ ] **Step 1: Keep only the type definition, remove all data**

```typescript
export type PluginType = "theme" | "buddy" | "sound";

export interface Plugin {
  id: string;
  type: PluginType;
  name: string;
  name_en: string;
  author_name: string;
  author_github: string;
  price: number;
  description: string;
  description_en: string;
  downloads: number;
  rating: number;
  version: string;
  status: string;
  submitted_at: string;
  github_repo?: string;
  bundle_size?: number;
  icon_url?: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/data/plugins.ts
git commit -m "refactor: remove mock data, keep only Plugin type definition"
```

---

## Chunk 7: Store — Developer Flow

Real developer dashboard and plugin submission wizard.

### Task 7.1: Developer Dashboard

**Files:**
- Modify: `mio-plugin-store/src/app/developer/page.tsx`

- [ ] **Step 1: Rewrite developer dashboard**

Replace fake GitHub login with real auth check. Fetch developer's plugins from API. Show real stats with AnimatedCounter. Show plugin list with status badges (pending/approved/rejected).

If user is not logged in, show LoginButton. If logged in but no GitHub App installation, show "Connect Repos" button that links to GitHub App installation URL.

- [ ] **Step 2: Commit**

```bash
git add src/app/developer/page.tsx
git commit -m "feat: developer dashboard with real auth and API data"
```

### Task 7.2: Plugin Submission Wizard

**Files:**
- Modify: `mio-plugin-store/src/app/developer/submit/page.tsx`

- [ ] **Step 1: Rewrite submission wizard**

4-step wizard with real functionality:
1. **Select Repo**: Fetch repos from `/api/public/developer/repos`, dropdown with search. If `needs_installation`, show "Connect GitHub" button.
2. **Plugin Info**: Name (zh + en), description (zh + en), type (theme/buddy/sound), price, branch/tag selection, commit SHA
3. **Upload Bundle**: Real file upload with drag-and-drop, progress indicator, 50MB limit display
4. **Review & Submit**: Summary of all fields, submit calls `/api/public/developer/submit` then `/api/public/developer/upload`

Step indicator with animated connecting lines (Framer Motion).

- [ ] **Step 2: Commit**

```bash
git add src/app/developer/submit/page.tsx
git commit -m "feat: real plugin submission wizard with GitHub repo selection and bundle upload"
```

### Task 7.3: My Plugins Page

**Files:**
- Create: `mio-plugin-store/src/app/my-plugins/page.tsx`

- [ ] **Step 1: Create my-plugins page**

Fetch from `/api/public/user/plugins`. Show installed plugins with re-install button. If not logged in, redirect to login.

- [ ] **Step 2: Commit**

```bash
git add src/app/my-plugins/page.tsx
git commit -m "feat: add My Plugins page with re-install capability"
```

### Task 7.4: Update i18n Dictionaries

**Files:**
- Modify: `mio-plugin-store/src/i18n/dictionaries.ts`

- [ ] **Step 1: Add new translation keys**

Add keys for: `nav.myPlugins`, `nav.logout`, `auth.signIn`, `auth.signInWithGithub`, `developer.connectRepos`, `developer.submitPlugin`, `developer.yourPlugins`, `install.installing`, `install.installed`, `install.openInApp`, etc.

- [ ] **Step 2: Commit**

```bash
git add src/i18n/dictionaries.ts
git commit -m "feat: add i18n keys for auth, developer, and install flows"
```

### Task 7.5: Store .env.example

**Files:**
- Create: `mio-plugin-store/.env.example`

- [ ] **Step 1: Create .env.example**

```bash
GITHUB_CLIENT_ID=your-github-app-client-id
ADMIN_API=https://cat.wdao.chat
NEXT_PUBLIC_ADMIN_API=https://cat.wdao.chat
NEXT_PUBLIC_SITE_URL=https://miomio.chat
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "feat: add store env example"
```

---

## Chunk 8: Integration Testing & Deployment

### Task 8.1: Local Integration Test

- [ ] **Step 1: Start admin locally**

```bash
cd /Users/ying/Documents/AI/mio-plugin-admin
# Create .env with test values
npm run dev
```

- [ ] **Step 2: Start store locally**

```bash
cd /Users/ying/Documents/AI/mio-plugin-store
# Create .env with ADMIN_API=http://localhost:3007
npm run dev
```

- [ ] **Step 3: Test the following flows in browser**

1. Homepage loads plugin data from admin API
2. Browse page search and filter work
3. Plugin detail page loads
4. GitHub OAuth login flow works
5. After login, user menu appears with correct GitHub info
6. Developer dashboard shows after login
7. "Connect Repos" flow works
8. Plugin submission wizard: select repo, fill info, upload file, submit
9. "My Plugins" page shows installed plugins
10. Install button triggers URL scheme

- [ ] **Step 4: Fix any issues discovered**

### Task 8.2: Deploy Admin Updates

- [ ] **Step 1: Deploy admin to server**

```bash
cd /Users/ying/Documents/AI/mio-plugin-admin
rsync -avz --exclude node_modules --exclude .git --exclude data . user@106.54.19.137:/path/to/mio-plugin-admin/
ssh user@106.54.19.137 "cd /path/to/mio-plugin-admin && npm install && npm run build && pm2 restart mio-plugin-admin"
```

- [ ] **Step 2: Set environment variables on server**

Ensure all env vars from `.env.example` are set in the server environment.

### Task 8.3: Deploy Store Updates

- [ ] **Step 1: Push to GitHub and deploy via Vercel**

```bash
cd /Users/ying/Documents/AI/mio-plugin-store
git push origin main
```

Vercel auto-deploys from main.

- [ ] **Step 2: Set environment variables in Vercel dashboard**

Add `GITHUB_CLIENT_ID`, `ADMIN_API`, `NEXT_PUBLIC_ADMIN_API`, `NEXT_PUBLIC_SITE_URL` to Vercel project settings.

### Task 8.4: Create GitHub App

- [ ] **Step 1: Create GitHub App at github.com/organizations/MioMioOS/settings/apps/new**

Settings:
- Name: MioIsland Plugin Review
- Homepage URL: https://miomio.chat
- Callback URL: https://miomio.chat/api/auth/callback
- Setup URL: https://miomio.chat/developer
- Webhook: inactive (not needed for now)
- Permissions: Repository contents (Read-only), Metadata (Read-only)
- Where can this app be installed: Any account

- [ ] **Step 2: Record credentials**

Save App ID, Client ID, Client Secret, Private Key. Set them in admin server env vars.

---

## Execution Notes

- **Admin and Store are separate repos.** Chunks 1-4 are in mio-plugin-admin. Chunks 5-7 are in mio-plugin-store. Chunk 8 spans both.
- **GitHub App must be created before testing OAuth.** But code can be written and committed before the app exists.
- **Next.js 16 warning:** Both repos have AGENTS.md warning about breaking changes. Read `node_modules/next/dist/docs/` before writing route handlers — the API route signature may differ from training data (e.g., `params` may be a Promise).
- **No TDD for this project** — it's primarily API routes and UI components. Integration testing in Task 8.1 covers the verification.
- **Framer Motion animations** in Chunk 6 tasks provide the specific motion components, but the page rewrites (Tasks 6.2-6.4) will integrate them. The page rewrites are large and may need to be adapted based on the current page structure — read each page before rewriting.
