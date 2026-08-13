# Voishper

### Project Authority: OmniChat AI SaaS (Full-Stack Professional Blueprint)



**Core Objective:** Develop a high-performance, scalable AI Customer Support SaaS. The application must feature a centralized "Merchant Dashboard" and an "Embeddable/Draggable AI Widget." Start building the entire architecture, database schema, and UI components simultaneously upon plan approval.



**1. Technical Foundation & UI Specs:**

- **Framework:** Next.js/React with Tailwind CSS.

- **Visual Aesthetic:** "Elite Dark Mode" (Hex: #0B0E14). Use Glassmorphism (Backdrop-blur: 12px), Neon Borders (Cyan #00F2FF, Indigo #6366F1), and Plasma-textured UI elements.

- **Animations:** Framer Motion for liquid-smooth sliding and drag-and-drop physics.

- **Responsiveness:** Precision-optimized for Mobile (Snapdragon 855/OnePlus 7 constraints) and Desktop.



**2. Unified Feature Implementation (Build Concurrently):**

- **SaaS Dashboard (The Brain):**

    - **Knowledge Ingestion:** Input field for Website URLs and a Drag-and-Drop zone for PDF/TXT files.

    - **Live Style Editor:** Side-panel with color pickers and font selectors. Changes must reflect instantly in a "Live Preview" widget.

    - **Analytics Engine:** Visual cards showing: Total Conversations, Leads Captured, and Bot Success Rate (using Recharts or Lucide).

    - **API Gateway:** A settings page to securely input OpenAI/Gemini/Anthropic API keys and Supabase credentials.

- **The Omni-Widget (The Product):**

    - **Advanced Drag Logic:** A floating bubble that can be dragged anywhere on the viewport. It must use local storage to remember its last position.

    - **Smart Drawer:** Upon clicking, a sliding panel appears with a "threaded" chat interface.

    - **AI RAG Logic:** Implement Retrieval-Augmented Generation (RAG). The bot must only answer based on the ingested data. If unknown, trigger a "Human Handoff" lead form.

    - **Pro-Active Engagement:** Auto-popup a greeting message after 5 seconds of page load.



**3. Database & Deployment (Supabase Integration):**

- **Schema Requirements:** 1. `Users` (Auth & Profile)

    2. `Bots` (Config, Colors, Knowledge Base link)

    3. `Leads` (Name, Email, Timestamp, Chat Transcript)

    4. `Analytics` (Daily session counts)

- **Deployment:** Prepare the app for one-click deployment to Netlify/Vercel via Lovable.



**4. Strict Output Command for Lovable:**

Do not build in isolated phases. Initialize the Supabase database schema, the main layout, and the draggable component in the very first generation. If any logic (like web scraping) requires a backend function, build the UI interface for it and ask me for the necessary API keys or permissions immediately. Start the full generation now.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://voishper.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/704999b6-9a2a-4ead-a1ce-c19fae527386).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
