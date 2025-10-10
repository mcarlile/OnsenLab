# Hot Tub Monitoring Dashboard - Design Guidelines

## Design Approach
**Utility-Focused Dashboard** - Drawing inspiration from MyFitnessPal's clear data presentation and Grafana's scientific visualization interfaces. Prioritizing data clarity, functional efficiency, and intuitive interaction patterns for chemical monitoring.

## Color System

### Core Palette
- **Primary**: 207 82% 59% (Pool Blue - #0EA5E9)
- **Secondary**: 186 94% 43% (Aqua - #06B6D4)
- **Background**: 210 40% 98% (Light Blue-Grey - #F8FAFC)
- **Text Primary**: 215 25% 27% (Slate - #1E293B)
- **Text Secondary**: 215 20% 65% (Muted Slate)

### Status Colors
- **Success**: 158 64% 52% (Green - #10B981) - Optimal chemical levels
- **Warning**: 38 92% 50% (Amber - #F59E0B) - Needs attention
- **Error**: 0 72% 51% (Red - #EF4444) - Critical levels
- **Info**: 207 82% 59% (Primary Blue) - Informational states

### Dark Mode
- Background: 222 47% 11%
- Surface: 217 33% 17%
- Text: 210 40% 98%
- Borders: 217 33% 25%

## Typography
- **Primary Font**: Inter (Google Fonts)
- **Fallback**: Roboto, system-ui, sans-serif
- **Scale**: 
  - Headings: 2xl (32px), xl (24px), lg (20px) - font-semibold
  - Body: base (16px) - font-normal
  - Small: sm (14px), xs (12px) - font-medium for labels
- **Line Height**: relaxed (1.625) for body, tight (1.25) for headings

## Layout System

### Spacing Units
Consistent Tailwind spacing: **2, 4, 6, 8, 12, 16** (0.5rem to 4rem increments)
- Component padding: p-6 or p-8
- Section margins: mt-8, mb-12
- Card gaps: gap-4 or gap-6
- Touch targets: min-h-12 (48px) for buttons

### Grid Structure
- Container: max-w-7xl mx-auto px-4
- Dashboard Layout: Grid-based responsive
  - Mobile: Single column stack
  - Tablet (md:): 2-column for cards
  - Desktop (lg:): 3-column for data cards, 2-column for charts
- Chart Area: Full-width cards spanning available columns

## Component Library

### Photo Upload Interface
**Prominent Featured Area** - Hero-style upload zone
- Large drop zone: min-h-64 with dashed border (border-2 border-dashed)
- Drag-and-drop with visual feedback (hover state: bg-cyan-50 dark:bg-cyan-900/20)
- Camera icon (Heroicons) centered, 64px size
- Secondary text: "Drop test strip photo or click to upload"
- Supported formats badge: "JPG, PNG up to 10MB"
- Mobile: Direct camera capture button with icon

### Data Visualization Cards
**Chart Containers** - Grafana-inspired
- White/dark surface cards with subtle shadows (shadow-lg)
- Rounded corners: rounded-xl
- Padding: p-6
- Header: Metric name + time range selector
- Chart libraries: Chart.js or Recharts for line/bar charts
- Color coding: Use status colors for zones (green=safe, amber=warning, red=critical)
- Grid lines: Subtle (opacity-20)
- Tooltips: Dark background with white text, rounded-lg

### Chemical Level Indicators
**Status Badges & Metrics**
- Large metric display: 3xl font size, semibold
- Unit labels: Small muted text below
- Status badges: Rounded-full, px-3 py-1, with corresponding status color
- Progress bars: h-2, rounded-full, bg-gray-200 with colored fill
- Icon indicators: Heroicons check-circle (green), exclamation-triangle (amber), x-circle (red)

### Historical Data Table
**Reading History List**
- Alternating row backgrounds for readability
- Timestamp column: font-mono, text-sm
- Chemical columns: Center-aligned with color-coded values
- Action column: View details icon button
- Mobile: Card-based list view instead of table
- Pagination: Bottom-aligned, simple prev/next with page numbers

### Navigation
**Top Bar Dashboard Nav**
- Fixed header: h-16, bg-white/95 backdrop-blur
- Logo/Title: Left-aligned with droplet icon
- Navigation items: Upload, Dashboard, History, Settings
- User menu: Right-aligned avatar dropdown
- Mobile: Hamburger menu collapse

### Action Buttons
**CTA Hierarchy**
- Primary actions: bg-primary (pool blue), text-white, hover:bg-cyan-600
- Secondary: variant="outline" with border-primary
- Icon buttons: Ghost variant for supplementary actions
- Floating Action Button: Fixed bottom-right for "New Test" on mobile (rounded-full, w-14 h-14)

## Visual Treatment

### Cards & Surfaces
- All cards: bg-white dark:bg-slate-800, rounded-xl, shadow-md
- Interactive cards: hover:shadow-xl transition-shadow
- Borders: border border-gray-200 dark:border-gray-700 (optional, use sparingly)

### Data Hierarchy
- Most recent test: Larger card, elevated position (top of dashboard)
- Trend charts: Mid-sized cards, 2-column on desktop
- Historical data: Compact table/list at bottom
- Empty states: Centered with illustration, muted text, prominent upload CTA

### Micro-interactions
- Upload zone: Pulse animation on drag-over
- Status changes: Smooth color transitions (transition-colors duration-300)
- Chart updates: Animated line/bar growth
- Loading states: Spinner with pool blue color
- Success feedback: Green checkmark animation after upload

### Responsive Breakpoints
- Mobile: < 768px - Single column, larger touch targets
- Tablet: 768px - 1024px - 2-column layouts
- Desktop: > 1024px - Full 3-column grid, side-by-side charts

## Accessibility
- Maintain WCAG AA contrast ratios (4.5:1 text, 3:1 UI)
- Color-blind safe: Status icons accompany colors
- Focus indicators: ring-2 ring-primary ring-offset-2
- Screen reader labels for charts and upload zones
- Keyboard navigation: Tab order follows visual hierarchy

## Special Features

### AI Analysis Feedback
- Processing state: Skeleton loader on upload with "Analyzing..." text
- Results display: Smooth fade-in with chemical values
- Confidence indicators: Percentage badge next to each reading
- Re-scan option: If confidence < 80%, suggest retake

### Alert System
- Critical alerts: Toast notifications with error color, auto-dismiss
- Recommendations: Info cards below affected metrics
- Trend alerts: Line chart with shaded warning zones

This design system ensures a professional, data-focused dashboard that clearly communicates chemical levels while maintaining an approachable, user-friendly interface for hot tub maintenance tracking.