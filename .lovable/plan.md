
# OmniChat AI SaaS — Full Build Plan

## Visual Identity
- **Dark theme** with base `#0B0E14`, glassmorphism panels (`backdrop-blur-xl`, semi-transparent borders), neon accent colors (Cyan `#00F2FF`, Indigo `#6366F1`)
- Plasma-gradient backgrounds on cards and headers
- Framer Motion for page transitions, drawer slides, and drag physics

## Database Schema (Lovable Cloud / Supabase)
1. **profiles** — user_id (FK auth.users), display_name, avatar_url, created_at
2. **bots** — id, user_id (FK), name, system_prompt, colors (JSON: bubble_color, header_color, font), greeting_message, created_at
3. **knowledge_items** — id, bot_id (FK), type (url/file), source_name, content_text, created_at
4. **leads** — id, bot_id (FK), name, email, chat_transcript (text), created_at
5. **conversations** — id, bot_id (FK), session_id, started_at, message_count
6. **analytics** — id, bot_id (FK), date, total_conversations, leads_captured, bot_success_rate

## Pages & Layout
- **Auth pages** — Sign up / Login with email (Lovable Cloud auth)
- **Dashboard layout** — Sidebar navigation (Shadcn Sidebar) with: Dashboard, My Bots, Knowledge Base, Analytics, Settings
- All pages wrapped in auth guard

## Dashboard Features

### Home / Overview
- Welcome card with quick stats (total bots, conversations today, leads this week)
- Recent activity feed

### Bot Manager (`/bots`)
- Create/edit bots with name, system prompt, greeting message
- **Live Style Editor** — color pickers for bubble, header, text colors + font selector
- **Live Preview** panel showing the widget updating in real-time as styles change

### Knowledge Base (`/knowledge`)
- URL input field → calls edge function that uses Firecrawl to scrape and store content
- Drag-and-drop zone for PDF/TXT files → extracts text and stores in `knowledge_items`
- List of ingested sources with delete option

### Analytics (`/analytics`)
- Recharts-powered cards: Total Conversations (line chart), Leads Captured (bar chart), Bot Success Rate (gauge/radial)
- Date range filter

### Settings (`/settings`)
- Profile management
- Embed code generator (copy-paste snippet for the widget)

## Edge Functions (Backend)

1. **chat** — Receives user message + bot_id, fetches relevant knowledge_items for RAG context, calls Lovable AI Gateway with streaming, returns SSE response. If confidence is low, triggers human handoff flag.
2. **scrape-url** — Uses Firecrawl connector to scrape a URL, stores extracted text in knowledge_items
3. **process-file** — Accepts uploaded PDF/TXT, extracts text, stores in knowledge_items

## The Omni-Widget (Embeddable Component)

### Floating Bubble
- Draggable anywhere on viewport using Framer Motion drag constraints
- Persists last position in localStorage
- Neon-glow animation on hover

### Chat Drawer
- Slides open on bubble click with smooth Framer Motion animation
- Threaded chat interface with markdown rendering (react-markdown)
- Streaming AI responses with typing indicator
- **RAG logic**: Edge function searches knowledge_items by bot_id, injects as context
- **Human Handoff**: If bot can't answer, shows lead capture form (name, email) → saves to `leads` table

### Pro-Active Engagement
- Auto-popup greeting message after 5 seconds of page load (configurable per bot)
- Dismissible, won't show again in same session (sessionStorage)

### Embed Code
- Self-contained React component that merchants embed via `<script>` tag with their bot_id
- Widget fetches bot config (colors, greeting) on mount

## Responsive Design
- Dashboard: collapsible sidebar on mobile, stacked cards
- Widget: adapts drawer size to viewport, drag bounds constrained to visible area
