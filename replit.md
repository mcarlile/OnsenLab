# Hot Tub Monitoring Dashboard

## Overview

A web application for monitoring hot tub water chemistry through AI-powered test strip image analysis. Users can capture photos using their device camera or upload existing photos from their gallery. The system uses Google's Gemini AI to extract chemical readings (pH, chlorine, alkalinity, bromine, hardness) with optional test strip brand selection for improved accuracy. The dashboard displays current chemical levels with status indicators, historical trends through interactive charts, and maintains a test history log. Users can manage their test strip brands through a dedicated brands management page. Each test includes a full audit trail with the original uploaded photos stored in persistent cloud storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### March 12, 2026
- **Gemini 3 Flash Upgrade**: AI model upgraded from `gemini-2.5-pro` to `gemini-3-flash-preview` for faster analysis and improved chemical color matching
- **Auditable Image Storage**: Uploaded test strip photos are now persisted to Replit App Storage (Object Storage) as audit evidence
  - Images stored at `public/audits/{readingId}_top.jpg` and `public/audits/{readingId}_bottom.jpg`
  - Served via `GET /api/audit-images/audits/{readingId}_{part}.{ext}`
  - Schema updated: `imageUrl` replaced with `imageTopUrl` + `imageBottomUrl` on `test_readings`
- **Test Detail Page**: New `/readings/:id` route shows full chemical readings + "Original Evidence" section with side-by-side uploaded photos and timestamp overlay
  - "View" button in Test History now navigates to the detail page
  - Back button returns to dashboard
- **Error Handling**: Gemini API errors now show clean, user-friendly messages instead of raw JSON; auto-retry (2 attempts) for transient rate-limit errors
- **Per-Parameter Confidence & Intervals**: Each chemical reading now includes its own confidence score and margin-of-error interval
- **Schema Extended**: 10 confidence/interval columns plus `imageTopUrl`/`imageBottomUrl` on `test_readings`
- **Gemini Prompt Overhaul**: AI now returns per-parameter confidence and interval values; multi-image instructions enforce same-image color-key matching and de-duplication rules
- **ChemicalLevelCard Enhanced**: Displays values in "7.4 ±0.2" format with per-parameter confidence percentage; low-confidence values highlighted in amber
- **Low-Confidence Warning Banner**: Dashboard shows an amber alert banner when any parameter in the latest reading has confidence < 70%, listing affected parameters
- **TestHistory Updated**: Table cells show interval notation (±) alongside values; confidence column uses destructive badge variant for < 70% readings with warning icon
- **BrandDetail Updated**: Usage history table shows interval notation next to status badges for each chemical parameter; confidence column shows warning icon for low-confidence readings

### October 10, 2025
- **Enhanced Upload Flow**: Added dual upload options supporting both camera capture and gallery upload using HTML5 file input attributes
- **Test Strip Brand Management**: Created dedicated brands management page (/brands) with full CRUD operations for test strip brands
- **SKU & Image Management**: Added SKU/model number field and image upload capability for test strip brands
- **AI Accuracy Improvements**: Integrated brand selection into upload flow to provide context-specific information to Gemini AI for improved reading accuracy
- **Default Brands**: Pre-loaded AquaChek 6-in-1 and JNW Direct 7-Way test strips as default brands with SKUs

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast hot module replacement
- Wouter for lightweight client-side routing (Dashboard, Brands, Test Detail pages)
- Single Page Application (SPA) architecture with client-side rendering

**UI Component System**
- Shadcn/ui component library built on Radix UI primitives for accessible, unstyled components
- TailwindCSS for utility-first styling with custom design system
- Design philosophy: Utility-focused dashboard inspired by MyFitnessPal and Grafana, prioritizing data clarity and functional efficiency
- Responsive grid layout: mobile-first approach with breakpoints for tablet (md:) and desktop (lg:)
- Custom color palette with pool-blue primary colors and status-based theming (green for optimal, amber for warning, red for critical)

**State Management**
- TanStack Query (React Query) for server state management, caching, and API synchronization
- React Hook Form with Zod schema validation for form handling
- No global state management library - leveraging React Query's caching and local component state

**Data Visualization**
- Recharts library for rendering trend charts and chemical level visualizations
- Custom chart components wrapping Recharts primitives with application-specific styling

**Pages**
- `/` — Dashboard with current levels, trend charts, test history
- `/readings/:id` — Test Detail with chemical readings + Original Evidence photos
- `/brands` — Brands management with CRUD operations
- `/brands/:id` — Brand detail with usage history

### Backend Architecture

**Server Framework**
- Express.js running on Node.js with TypeScript
- RESTful API design pattern
- Middleware stack includes JSON parsing, URL encoding, request logging with duration tracking

**API Endpoints Structure**
- `GET /api/readings` - Fetch all test readings
- `GET /api/readings/:id` - Fetch specific reading
- `POST /api/analyze` - Upload and analyze test strip image (accepts image and optional brandId); persists images to Object Storage
- `GET /api/audit-images/*` - Serve stored audit images from Object Storage
- `GET /api/brands` - Fetch test strip brands
- `POST /api/brands` - Create new brand (with SKU and image)
- `PATCH /api/brands/:id` - Update brand
- `DELETE /api/brands/:id` - Delete brand
- `POST /api/brands/upload-image` - Upload brand image, returns base64 data URL

**Image Capture & Upload**
- Dual upload methods: camera capture (HTML5 `capture="environment"`) and gallery upload
- Multer middleware for multipart/form-data processing
- 10MB file size limit enforced
- **Image compression**: Sharp resizes each image to 1024px max dimension at 70% JPEG quality before upload
- Compressed images persisted to Replit App Storage (Object Storage) in `public/audits/` directory
- Image URLs stored on test reading records (`imageTopUrl`, `imageBottomUrl`)
- Optional test strip brand selection for context-aware AI analysis

**Upload Speed Optimizations**
- Object Storage upload and Gemini AI call run in parallel (`Promise.all`) — total wait time is `max(upload_time, ai_time)` not their sum
- `POST /api/analyze` streams Server-Sent Events so the client gets live phase updates in real time
- Gemini configured with `temperature: 0.1` and `topK: 1` for fast, decisive responses
- `complete` event emitted immediately when AI returns; DB write follows without blocking the stream

**AI Integration**
- Google Gemini AI (gemini-3-flash-preview) for image analysis
- Structured JSON output from vision model with per-parameter confidence scores and margin-of-error intervals
- Brand-specific context injection to improve color matching accuracy
- Multi-image support with same-image color-key matching and de-duplication rules
- Per-parameter confidence scoring (pHConfidence, chlorineConfidence, etc.) and overall confidence
- Margin-of-error intervals (pHInterval, chlorineInterval, etc.) based on color match precision
- Automatic retry (2 attempts) for transient rate-limit errors with clean error messages

### Data Storage Solutions

**Database Strategy**
- Drizzle ORM as the type-safe database toolkit
- PostgreSQL as the primary database (via @neondatabase/serverless driver)
- Schema-first approach with migrations managed in `/migrations` directory

**Object Storage**
- Replit App Storage (@google-cloud/storage) for persistent image files
- Bucket configured via `DEFAULT_OBJECT_STORAGE_BUCKET_ID` environment variable
- Public search paths via `PUBLIC_OBJECT_SEARCH_PATHS`
- Audit images stored at `public/audits/{readingId}_{top|bottom}.{ext}`

**Schema Design**
- `test_strip_brands` table: Stores test strip product information (id, name, manufacturer, sku, description, imageUrl, color_ranges)
  - SKU field for product/model identification
  - imageUrl stores base64 data URLs for brand images
- `test_readings` table: Chemical readings with timestamp, imageTopUrl, imageBottomUrl, brand reference, measurement values (pH, chlorine, alkalinity, bromine, hardness), overall confidence, per-parameter confidence scores (*Confidence), and per-parameter margin-of-error intervals (*Interval)
- UUID primary keys generated via `gen_random_uuid()`
- Optional brand association for readings (nullable foreign key relationship)

**Development Storage**
- In-memory storage implementation (`MemStorage` class) for development/testing
- Implements `IStorage` interface for consistent API across storage backends
- Pre-populated with default test strip brands (AquaChek, JNW Direct)

### External Dependencies

**Third-Party Services**
- **Google Gemini AI API**: Vision model (gemini-3-flash-preview) for test strip image analysis and chemical reading extraction
- **Replit App Storage**: Persistent object storage for audit images via @google-cloud/storage
- **Neon Database**: Serverless PostgreSQL hosting via @neondatabase/serverless driver
- **Google Fonts**: Inter and Roboto font families loaded from Google Fonts CDN

**Key NPM Packages**
- **UI Libraries**: @radix-ui/* components, shadcn/ui patterns, recharts for visualization
- **Form & Validation**: react-hook-form, @hookform/resolvers, zod for schema validation
- **State Management**: @tanstack/react-query for server state
- **Database**: drizzle-orm, drizzle-kit, @neondatabase/serverless
- **AI Integration**: @google/genai for Gemini API access
- **Object Storage**: @google-cloud/storage for Replit App Storage
- **Utilities**: date-fns for date formatting, clsx/tailwind-merge for className management, class-variance-authority for component variants

**Development Tools**
- Replit-specific plugins for development banner, error overlay, and cartographer
- TypeScript for type safety across full stack
- ESBuild for server bundling in production builds
