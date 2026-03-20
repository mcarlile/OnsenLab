# Hot Tub Monitor — Architecture Document

> This document describes the complete system so that any reviewer (human or AI) can
> understand what the application does, how every piece connects, and where to find
> things in the source tree.

---

## 1. Purpose

Hot Tub Monitor is a web application that helps hot tub owners track water chemistry.
A user photographs a test strip with their phone, the app sends the photo to Google
Gemini (vision AI), and the AI returns numerical readings for five chemical parameters.
Those readings are stored, trended over time, and displayed in a dashboard.

Key capabilities:

| Capability | Details |
|---|---|
| AI-powered readings | Gemini 3 Flash Preview analyzes test strip photos and returns pH, chlorine, alkalinity, bromine, hardness |
| Per-parameter confidence | Each chemical gets its own confidence score (0–1) and margin-of-error interval |
| Multi-image support | User can supply up to 2 photos of the same strip (e.g. strip + bottle key) |
| Test strip brand management | Users create/edit brands; brand info is sent to Gemini as context for better accuracy |
| Audit trail | Every uploaded photo is compressed and stored in Replit Object Storage as evidence |
| Real-time progress | Upload, compression, AI analysis, and saving are streamed to the client via SSE |
| Per-user isolation | Replit Auth (OpenID Connect); every database row is scoped by `userId` |
| Marketing landing page | Unauthenticated visitors see a feature-marketing page with login CTA |

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite |
| Routing | Wouter (client-side SPA) |
| UI components | shadcn/ui (Radix UI primitives) + TailwindCSS |
| Charts | Recharts |
| Server state | TanStack Query v5 |
| Form handling | react-hook-form + zod |
| Backend | Express.js (Node.js, TypeScript) |
| Database | PostgreSQL via Drizzle ORM |
| Auth | Replit Auth (OIDC) via openid-client + Passport.js |
| Session store | connect-pg-simple (PostgreSQL) |
| AI | Google Gemini 3 Flash Preview (@google/genai) |
| Image processing | Sharp (resize + JPEG compression) |
| Object storage | Replit App Storage (@google-cloud/storage) |

---

## 3. Directory Structure

```
/
├── client/                          # React SPA
│   ├── index.html                   # HTML shell
│   └── src/
│       ├── main.tsx                 # React entry point
│       ├── App.tsx                  # Root component: auth gate, sidebar layout, router
│       ├── index.css                # Tailwind + custom CSS variables
│       ├── components/
│       │   ├── AppSidebar.tsx       # Sidebar nav + user profile / logout
│       │   ├── PhotoUpload.tsx      # PhotoPicker + UploadDialog
│       │   ├── ChemicalLevelCard.tsx # Single chemical gauge card
│       │   ├── TrendChart.tsx       # Recharts line chart
│       │   ├── ThemeToggle.tsx      # Light/dark mode toggle
│       │   └── ui/                  # shadcn/ui primitives (Button, Card, Dialog, etc.)
│       ├── hooks/
│       │   ├── use-auth.ts          # useAuth() hook — calls /api/auth/user
│       │   ├── use-toast.ts         # Toast notification hook
│       │   └── use-upload.ts        # Presigned-URL upload hook (object storage)
│       ├── lib/
│       │   ├── queryClient.ts       # TanStack Query client + apiRequest helper
│       │   ├── auth-utils.ts        # Auth utility functions
│       │   └── utils.ts             # cn() className merger
│       └── pages/
│           ├── Landing.tsx          # Marketing page (unauthenticated)
│           ├── Dashboard.tsx        # Main dashboard (readings + upload)
│           ├── TestDetail.tsx       # Single reading detail + audit photos
│           ├── BrandsManagement.tsx # CRUD list of test strip brands
│           ├── BrandDetail.tsx      # Single brand + usage history
│           └── not-found.tsx        # 404 page
│
├── server/                          # Express backend
│   ├── index.ts                     # App bootstrap: auth setup, routes, error handler, listen
│   ├── routes.ts                    # All API endpoints
│   ├── db.ts                        # Drizzle client (pg + DATABASE_URL)
│   ├── storage.ts                   # IStorage interface + DatabaseStorage implementation
│   ├── gemini.ts                    # Gemini AI integration (prompt, parse, retry)
│   ├── imageCompressor.ts           # Sharp: resize to 1024px max, 70% JPEG quality
│   ├── imageStorage.ts             # Upload compressed images to Object Storage
│   ├── vite.ts                      # Vite dev-server middleware (do not modify)
│   └── replit_integrations/
│       ├── auth/
│       │   ├── replitAuth.ts        # OIDC discovery, Passport strategy, setupAuth(), isAuthenticated
│       │   ├── storage.ts           # User upsert/get (authStorage)
│       │   ├── routes.ts            # /api/login, /api/logout, /api/callback, /api/auth/user
│       │   └── index.ts             # Re-exports
│       └── object_storage/
│           ├── index.ts             # ObjectStorageService class + routes
│           └── ...                  # Presigned URL helpers
│
├── shared/                          # Code shared between client and server
│   ├── schema.ts                    # Drizzle table definitions + Zod insert schemas + types
│   └── models/
│       └── auth.ts                  # users + sessions table definitions
│
├── attached_assets/                 # Static images (hero photo, etc.)
├── scripts/
│   └── post-merge.sh               # Post-merge environment reconciliation
├── drizzle.config.ts                # Drizzle Kit config (schema path: ./shared/schema.ts)
├── vite.config.ts                   # Vite config (do not modify)
├── tailwind.config.ts               # Tailwind theme + custom colors
├── tsconfig.json                    # TypeScript config
└── package.json                     # Dependencies and scripts
```

---

## 4. Database Schema

All tables live in a single PostgreSQL database accessed via the `DATABASE_URL` environment variable.

### 4.1 `users`

Stores Replit Auth user profiles. The `id` column is the OIDC `sub` claim.

| Column | Type | Constraints | Default |
|---|---|---|---|
| id | varchar | PK | gen_random_uuid() |
| email | varchar | UNIQUE | — |
| first_name | varchar | | — |
| last_name | varchar | | — |
| profile_image_url | varchar | | — |
| created_at | timestamp | | now() |
| updated_at | timestamp | | now() |

### 4.2 `sessions`

PostgreSQL session store for express-session (connect-pg-simple).

| Column | Type | Constraints | Default |
|---|---|---|---|
| sid | varchar | PK | — |
| sess | jsonb | NOT NULL | — |
| expire | timestamp | NOT NULL | — |

Index: `IDX_session_expire` on `expire`.

### 4.3 `test_strip_brands`

User-owned test strip brand definitions. Brand info is sent to Gemini for context.

| Column | Type | Constraints | Default |
|---|---|---|---|
| id | varchar | PK | gen_random_uuid() |
| user_id | varchar | NOT NULL | — |
| name | text | NOT NULL | — |
| manufacturer | text | NOT NULL | — |
| sku | text | | — |
| description | text | | — |
| image_url | text | | — |
| color_ranges | text | | — |

### 4.4 `test_readings`

One row per test strip analysis. All chemical values are nullable (the strip may not test for every parameter).

| Column | Type | Constraints | Default |
|---|---|---|---|
| id | varchar | PK | gen_random_uuid() |
| user_id | varchar | NOT NULL | — |
| timestamp | timestamp | NOT NULL | now() |
| image_top_url | text | | — |
| image_bottom_url | text | | — |
| brand_id | varchar | | — |
| ph | real | | — |
| chlorine | real | | — |
| alkalinity | real | | — |
| bromine | real | | — |
| hardness | real | | — |
| confidence | real | | — |
| ph_interval | real | | — |
| chlorine_interval | real | | — |
| alkalinity_interval | real | | — |
| bromine_interval | real | | — |
| hardness_interval | real | | — |
| ph_confidence | real | | — |
| chlorine_confidence | real | | — |
| alkalinity_confidence | real | | — |
| bromine_confidence | real | | — |
| hardness_confidence | real | | — |

### Logical Relationships

- `test_strip_brands.user_id` and `test_readings.user_id` reference `users.id` (enforced in application code, not FK constraint).
- `test_readings.brand_id` references `test_strip_brands.id` (nullable; not all readings have a brand).

---

## 5. Authentication Flow

```
Browser                        Express                       Replit OIDC
  │                               │                              │
  │  GET /api/login               │                              │
  │──────────────────────────────>│                              │
  │                               │  302 Redirect                │
  │                               │─────────────────────────────>│
  │                               │                              │
  │         (user authenticates on Replit)                        │
  │                               │                              │
  │                               │  GET /api/callback?code=...  │
  │                               │<─────────────────────────────│
  │                               │                              │
  │                               │  Verify tokens, extract claims
  │                               │  Upsert user in DB (sub → id)
  │                               │  Store session in PG          │
  │  302 → /                      │                              │
  │<──────────────────────────────│                              │
  │                               │                              │
  │  GET /api/auth/user           │                              │
  │──────────────────────────────>│                              │
  │  { id, email, firstName, ... }│                              │
  │<──────────────────────────────│                              │
```

**Key details:**

- OIDC discovery URL: `https://replit.com/oidc`
- Client ID: `REPL_ID` environment variable
- Scopes: `openid email profile offline_access`
- Strategy name: `replitauth:<domain>`
- Session secret: `SESSION_SECRET` env var
- Session TTL: 7 days
- `isAuthenticated` middleware checks `req.isAuthenticated()`, verifies token expiry, and auto-refreshes expired tokens using the refresh token. Returns 401 on failure.
- User ID in routes: `req.user.claims.sub`

---

## 6. API Endpoints

### Auth routes (no middleware)

| Method | Path | Description |
|---|---|---|
| GET | /api/login | Starts OIDC login redirect |
| GET | /api/callback | OIDC callback — creates session, upserts user |
| GET | /api/logout | Destroys session, redirects to / |
| GET | /api/auth/user | Returns current user profile or 401 |

### Data routes (all behind `isAuthenticated`)

| Method | Path | Description |
|---|---|---|
| GET | /api/readings | All readings for current user (newest first) |
| GET | /api/readings/:id | Single reading (user-scoped) |
| POST | /api/analyze | Upload + analyze test strip (SSE stream, see Section 7) |
| GET | /api/brands | All brands for current user (alphabetical) |
| GET | /api/brands/:id | Single brand (user-scoped) |
| GET | /api/brands/:id/readings | All readings that used this brand |
| POST | /api/brands | Create brand (userId injected server-side) |
| PATCH | /api/brands/:id | Update brand fields |
| DELETE | /api/brands/:id | Delete brand |
| POST | /api/brands/upload-image | Upload brand image, returns base64 data URL |

### Public routes

| Method | Path | Description |
|---|---|---|
| GET | /api/audit-images/* | Serve stored audit photos from Object Storage (cached 24h) |

---

## 7. Upload & Analysis Flow (SSE)

This is the most complex operation in the system. It runs as a single `POST /api/analyze` request that streams Server-Sent Events back to the client.

```
Client (Dashboard.tsx)                    Server (routes.ts)
  │                                          │
  │  POST /api/analyze                       │
  │  FormData: images[], brandId?            │
  │─────────────────────────────────────────>│
  │                                          │
  │  SSE: {type:"status", phase:"compressing"}
  │<─────────────────────────────────────────│
  │                                          │  sharp: resize 1024px, 70% JPEG
  │                                          │
  │  SSE: {type:"status", phase:"analyzing"} │
  │<─────────────────────────────────────────│
  │                                          │
  │                                          │  ┌──────────────────────────────┐
  │                                          │  │ Promise.all([               │
  │                                          │  │   uploadAuditImage(top),    │
  │                                          │  │   uploadAuditImage(bottom), │
  │                                          │  │   analyzeTestStrip(gemini)  │
  │                                          │  │ ])                          │
  │                                          │  └──────────────────────────────┘
  │                                          │
  │  SSE: {type:"complete", reading:{...}}   │
  │<─────────────────────────────────────────│
  │                                          │
  │  (stream ends)                           │  storage.createTestReading()
  │                                          │  (fire-and-forget background write)
  │  invalidateQueries("/api/readings")      │
  │  close dialog after 600ms                │
```

**Multer config:** `memoryStorage`, max 10 MB, image MIME types only.

**Image compression:** Sharp resizes to max 1024px on longest dimension, 70% JPEG quality.

**Object Storage paths:** `public/audits/{readingId}_top.jpg`, `public/audits/{readingId}_bottom.jpg`

**SSE event types:**
- `{type: "status", phase: string, label: string}` — progress update
- `{type: "complete", reading: TestReading}` — success with full reading data
- `{type: "error", error: string, phase: string}` — failure with user-friendly message

---

## 8. Gemini AI Integration

**File:** `server/gemini.ts`

### Model Configuration

| Setting | Value | Rationale |
|---|---|---|
| Model | gemini-3-flash-preview | Fast, vision-capable |
| Temperature | 0.1 | Near-deterministic for consistent readings |
| topK | 1 | Most probable token only |
| responseMimeType | application/json | Forces structured output |
| thinkingBudget | 0 | Prevents thinking-mode output that corrupts JSON at ~64K chars |

### System Prompt Summary

The prompt instructs the model to act as a "water chemistry expert and computer vision analyst" and:

1. Look for 5 parameters: pH (6.0–8.4), Chlorine (0–10 ppm), Alkalinity (0–240 ppm), Bromine (0–20 ppm), Hardness (0–1000 ppm)
2. For each parameter, return `{value, confidence, interval}`
3. Be conservative with confidence — high only when colors are clearly visible and well-lit
4. If a parameter can't be detected, set all three fields to null
5. Return overall confidence (0–1) across all readings

**Brand context:** If the user selected a brand, the brand name, manufacturer, and description are appended to the prompt.

**Multi-image rules:** When 2 images are provided, additional instructions tell the model to:
- Identify pads and color keys across both images
- Match each pad to the color scale in the **same image** (for lighting consistency)
- De-duplicate pads appearing in both images (keep higher confidence)
- Rely on the visible key, not pre-known brand colors

### Response Schema (enforced by Gemini)

```json
{
  "parameters": {
    "pH":         { "value": 7.2, "confidence": 0.85, "interval": 0.2 },
    "chlorine":   { "value": 1.0, "confidence": 0.9,  "interval": 0.5 },
    "alkalinity": { "value": 120, "confidence": 0.8,  "interval": 20 },
    "bromine":    { "value": null, "confidence": null, "interval": null },
    "hardness":   { "value": 250, "confidence": 0.7,  "interval": 50 }
  },
  "confidence": 0.82
}
```

### Response Parsing

1. Extract text from `result.candidates[0].content.parts`, filtering out any parts where `part.thought === true` (safety against thinking-mode leakage)
2. `JSON.parse` the concatenated text
3. Normalize into a flat `ChemicalReadings` object with top-level fields (`pH`, `pHConfidence`, `pHInterval`, etc.) plus nested `parameters` and `intervals` maps

### Retry Logic

- **Max retries:** 2 (total 3 attempts)
- **Delays:** 1000ms, then 2000ms
- **Retryable conditions:** rate limits (429, quota, resource_exhausted), availability (503), JSON parse errors (SyntaxError), empty responses
- **Final error classification:** Translates technical API errors into user-friendly messages before throwing

---

## 9. Object Storage

**Service:** Replit App Storage (Google Cloud Storage under the hood)

**Bucket ID:** `DEFAULT_OBJECT_STORAGE_BUCKET_ID` environment variable

**File layout:**
```
public/
  audits/
    {readingId}_top.jpg
    {readingId}_bottom.jpg
```

**Serving:** `GET /api/audit-images/audits/{readingId}_{part}.jpg` — uses `objectStorageService.searchPublicObject()` to find the file, then `downloadObject()` to stream it with a 24-hour cache header.

---

## 10. Client-Side Architecture

### Auth-Aware Rendering (App.tsx)

```
AppContent
  ├── isLoading?  → Spinner
  ├── !isAuthenticated?  → <Landing />
  └── isAuthenticated?  → <AuthenticatedApp />
        ├── SidebarProvider (--sidebar-width: 13rem)
        ├── AppSidebar (nav + user profile)
        ├── Header (sidebar trigger + theme toggle)
        └── Router
              ├── /              → Dashboard
              ├── /readings/:id  → TestDetail
              ├── /brands        → BrandsManagement
              ├── /brands/:id    → BrandDetail
              └── *              → NotFound
```

### useAuth Hook

- Calls `GET /api/auth/user`
- Returns `{ user, isLoading, isAuthenticated }`
- Used by App.tsx (auth gate) and AppSidebar (profile display)

### Data Fetching Pattern

All data queries use TanStack Query v5 with the default fetcher configured in `queryClient.ts`. Mutations use `apiRequest()` and invalidate cache by query key after success.

Example query keys:
- `["/api/readings"]` — all readings
- `["/api/readings", id]` — single reading
- `["/api/brands"]` — all brands
- `["/api/brands", id]` — single brand
- `["/api/brands", id, "readings"]` — readings for a brand

### Dashboard Upload Flow (Client Side)

1. User opens upload dialog, selects 1–2 photos via `PhotoPicker`
2. Optionally selects a test strip brand from dropdown
3. Clicks "Analyze Strip"
4. `Dashboard.tsx` creates `FormData`, POSTs to `/api/analyze`
5. Reads SSE stream via `response.body.getReader()`
6. Updates `uploadPhase` state on each `status` event
7. On `complete`: invalidates `/api/readings` cache, closes dialog after 600ms
8. On `error`: shows error message with failed phase context

---

## 11. Environment Variables

| Variable | Purpose |
|---|---|
| DATABASE_URL | PostgreSQL connection string |
| GEMINI_API_KEY | Google Gemini API key |
| SESSION_SECRET | Express session signing secret |
| DEFAULT_OBJECT_STORAGE_BUCKET_ID | Replit App Storage bucket |
| PUBLIC_OBJECT_SEARCH_PATHS | Object storage public search paths |
| PRIVATE_OBJECT_DIR | Object storage private directory |
| REPL_ID | Used as OIDC client ID for Replit Auth |

---

## 12. Build & Run

### Development

```bash
npm run dev          # Starts Express + Vite dev server on port 5000
```

### Database

```bash
npm run db:push      # Sync Drizzle schema to PostgreSQL (interactive)
```

### Production

The production build bundles the server with ESBuild and the client with Vite:
- Server output: `dist/index.js`
- Client output: `dist/public/`

---

## 13. Key Design Decisions

| Decision | Rationale |
|---|---|
| SSE instead of WebSocket | Simpler for unidirectional progress; no library needed |
| Fire-and-forget DB write | The client gets the reading data immediately; the DB insert happens after the stream closes so the user doesn't wait for it |
| Parallel upload + AI | `Promise.all([uploadAuditImage, analyzeTestStrip])` — total latency = max(upload, AI) instead of sum |
| thinkingBudget: 0 | Gemini's thinking mode can produce 64K+ chars of internal reasoning that gets prepended to JSON, corrupting parse |
| Smart part filtering | Even with thinkingBudget: 0, the response parser filters out any `part.thought === true` parts as a safety net |
| Per-parameter confidence | More useful than a single overall confidence; lets the UI highlight specific parameters that may be unreliable |
| Sharp compression before upload | Reduces file size (and upload time) while preserving enough detail for AI analysis at 1024px |
| No FK constraints in DB | Application-level enforcement is sufficient; avoids migration complexity when adding/removing tables |
| userId on every data row | Simple per-user isolation without complex RLS; all storage methods accept userId as a parameter |

---

## 14. Common Gotchas

1. **Route order matters:** `POST /api/brands/upload-image` must be registered before `GET /api/brands/:id`, otherwise Express matches `:id = "upload-image"`.

2. **Gemini JSON corruption:** If `thinkingBudget` is not set to 0, the model can produce thinking output that gets concatenated with the JSON response, causing parse failures. The smart part filter in `gemini.ts` is a safety net.

3. **SSE format:** Each event must be `data: {json}\n\n` (note the double newline). The client reader splits on `\n\n` boundaries.

4. **Object Storage paths:** Files are stored under `public/audits/` but served via `/api/audit-images/audits/...`. The leading `audits/` in the URL maps to the path inside the `public/` search directory.

5. **Session table:** The `sessions` table must exist before the app starts. It's created via direct SQL migration, not Drizzle Kit, because connect-pg-simple expects a specific schema.
