# Hot Tub Monitoring Dashboard

## Overview

A web application for monitoring hot tub water chemistry through AI-powered test strip image analysis. Users create accounts via Replit Auth (OpenID Connect) and each user's data is fully isolated. Users can capture photos using their device camera or upload existing photos from their gallery. The system uses Google's Gemini AI to extract chemical readings (pH, chlorine, alkalinity, bromine, hardness) with optional test strip brand selection for improved accuracy. The dashboard displays current chemical levels with status indicators, historical trends through interactive charts, and maintains a test history log. Users can manage their test strip brands through a dedicated brands management page. Each test includes a full audit trail with the original uploaded photos stored in persistent cloud storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### March 20, 2026
- **Authentication**: Added Replit Auth (OpenID Connect) for user accounts
  - Login via Google, GitHub, X, Apple, or email/password
  - Session management with PostgreSQL-backed session store
  - All API routes protected with `isAuthenticated` middleware
- **Per-User Data Isolation**: Added `userId` column to `test_readings` and `test_strip_brands` tables; all queries filter by authenticated user
- **Marketing Landing Page**: New landing page at `/` for unauthenticated users with hero image, feature cards, and CTA buttons
- **Database Storage**: Migrated from in-memory `MemStorage` to PostgreSQL `DatabaseStorage` via Drizzle ORM
- **Sidebar User Profile**: Added user avatar, name, and logout button to sidebar footer

### March 15, 2026
- **Bulk Photo Selection**: Replaced dual ImageSlot upload boxes with single PhotoPicker supporting multi-select (up to 2 photos at once from gallery)
- **Gemini Thinking Disabled**: Added `thinkingBudget: 0` to prevent model thinking output from corrupting JSON responses
- **Smart Response Parsing**: Extracts only non-thinking text parts from Gemini response to avoid JSON corruption
- **JSON Parse Retry**: JSON parse errors now trigger automatic retries (previously only rate-limit errors did)

### March 12, 2026
- **Gemini 3 Flash Upgrade**: AI model upgraded to `gemini-3-flash-preview` for faster analysis
- **Auditable Image Storage**: Test strip photos persisted to Replit App Storage as audit evidence
- **Real-Time Upload Progress**: SSE streaming with live step-by-step progress UI
- **Image Compression**: Sharp resizes to 1024px max at 70% JPEG quality
- **Per-Parameter Confidence & Intervals**: Each chemical reading has its own confidence score and margin-of-error

## System Architecture

### Authentication
- Replit Auth via OpenID Connect (passport + openid-client)
- Session store: PostgreSQL via connect-pg-simple
- Auth module: `server/replit_integrations/auth/` (replitAuth.ts, storage.ts, routes.ts)
- Client hook: `client/src/hooks/use-auth.ts` — provides `user`, `isAuthenticated`, `isLoading`, `logout`
- Auth routes: `/api/login`, `/api/logout`, `/api/callback`, `/api/auth/user`
- All data API routes protected with `isAuthenticated` middleware
- User ID extracted via `req.user.claims.sub`

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- SPA architecture with auth-aware rendering (Landing vs Dashboard)

**Pages**
- `/` — Landing page (unauthenticated) or Dashboard (authenticated)
- `/readings/:id` — Test Detail with chemical readings + Original Evidence photos
- `/brands` — Brands management with CRUD operations
- `/brands/:id` — Brand detail with usage history

**UI Component System**
- Shadcn/ui component library built on Radix UI primitives
- TailwindCSS for utility-first styling
- Recharts for data visualization
- Custom color palette with pool-blue primary and status-based theming

### Backend Architecture

**Server Framework**
- Express.js with TypeScript
- Auth setup in `server/index.ts` before route registration
- RESTful API with `isAuthenticated` middleware on all data routes

**API Endpoints** (all protected except audit-images)
- `GET /api/readings` - Fetch user's test readings
- `GET /api/readings/:id` - Fetch specific reading (user-scoped)
- `POST /api/analyze` - Upload and analyze test strip (SSE stream)
- `GET /api/audit-images/*` - Serve stored audit images (public)
- `GET /api/brands` - Fetch user's test strip brands
- `POST /api/brands` - Create brand (userId injected server-side)
- `PATCH /api/brands/:id` - Update brand (user-scoped)
- `DELETE /api/brands/:id` - Delete brand (user-scoped)
- `POST /api/brands/upload-image` - Upload brand image

### Data Storage

**Database**
- PostgreSQL via Drizzle ORM (`server/db.ts`)
- `DatabaseStorage` class in `server/storage.ts` implements `IStorage` interface
- All queries include `userId` filter for data isolation
- Schema: `shared/schema.ts` + `shared/models/auth.ts`

**Tables**
- `users` — Replit Auth user records (id, email, name, profile image)
- `sessions` — PostgreSQL session store for auth
- `test_strip_brands` — Brand info with userId ownership (id, userId, name, manufacturer, sku, description, imageUrl, colorRanges)
- `test_readings` — Chemical readings with userId ownership (id, userId, timestamp, imageTopUrl, imageBottomUrl, brandId, chemical values, confidence scores, intervals)

**Object Storage**
- Replit App Storage for persistent audit images
- Bucket: `DEFAULT_OBJECT_STORAGE_BUCKET_ID`
- Audit images at `public/audits/{readingId}_{top|bottom}.jpg`

### Key Dependencies
- **Auth**: openid-client, passport, express-session, connect-pg-simple
- **AI**: @google/genai (Gemini 3 Flash Preview)
- **Database**: drizzle-orm, pg, drizzle-kit
- **Image Processing**: sharp for compression
- **Object Storage**: @google-cloud/storage
- **UI**: @radix-ui/*, shadcn/ui, recharts, @tanstack/react-query
- **Routing**: wouter
