# AGENTS.md

> Guide for AI coding agents working on this repository.

## Project Overview

ClawJobs Finder is an AI-powered job discovery dashboard built with Next.js 16 and OpenServ multi-agent workflows. Users paste a skill profile, the backend triggers an OpenServ webhook which runs specialized sub-agents to search 10+ job platforms, and results are displayed as categorized job cards.

## Setup Commands

```bash
# Install dependencies
npm install

# Start dev server (hot reload, better error messages)
npm run dev

# Production build
npm run build

# Start production server
npx next start
```

## Environment Variables

Create `.env.local` at the project root:

```bash
# Required: Agent API key for fetching OpenServ task results
OPENSERV_API_KEY=<your_openserv_api_key>

# Required: OpenServ workspace ID
OPENSERV_WORKSPACE_ID=12972

# Required: Webhook trigger URL for posting agent responses to the workflow
# Format: https://api.openserv.ai/webhooks/trigger/{TRIGGER_TOKEN}
OPENSERV_TRIGGER_URL=<your_trigger_url>
```

The `.env` file is gitignored. Never commit API keys or trigger tokens.

## Code Style

- **TypeScript** strict mode enabled
- **Single quotes** for strings
- **No semicolons** — enforced by project convention
- **Functional components** only (no class components)
- **Tailwind CSS v4** for styling — use utility classes, no custom CSS unless necessary
- **`'use client'`** directive required for components using React hooks or browser APIs
- **Import aliases**: `@/` maps to the project root (e.g., `@/components/...`, `@/lib/...`, `@/app/data/...`)

## Architecture

```
app/
├── layout.tsx              # Root layout (ThemeProvider + Geist font)
├── page.tsx                # Entry → AgentJobsPage
├── globals.css             # Tailwind base styles
├── api/
│   └── fetch-jobs/
│       └── route.ts        # API route: GET (task fetch) + POST (webhook trigger)
└── data/
    ├── mock-jobs.ts        # Mock job data (development fallback)
    └── openserv.ts         # OpenServ types (OpenServData, OpenServTriggerMeta)

components/
├── AgentJobsPage.tsx       # Main page: state orchestration, data fetching
├── Hero.tsx                # Hero section (theme-aware logos)
├── ThemeProvider.tsx        # Dark/light mode context
├── ThemeToggle.tsx          # Sun/moon theme switch
├── FindWorkButton.tsx       # CTA → opens FindTaskModal
├── FindTaskModal.tsx        # Agent prompt builder + paste response + search trigger
├── OpenServResults.tsx      # Market intelligence + job category rendering
├── JobCategoryCard.tsx      # Category card with "Load More" pagination
├── JobListingItem.tsx       # Single job item with markdown cleanup + link extraction
├── JobPipeline.tsx          # 5-stage pipeline widget
├── JobCard.tsx              # Individual job card ("See Job Brief" links to URL)
├── EarningsWidget.tsx       # USDC earnings sidebar
├── StatusPill.tsx           # Connection status indicator
└── OpenServConfig.tsx       # OpenServ config form (UI only)

lib/
└── markdown.ts             # parseMarkdown(), extractLinks(), isValidUrl()
```

## Key Data Flow

1. User pastes skill profile in `FindTaskModal`
2. `AgentJobsPage.fetchOpenServJobs(agentResponse)` called
3. `POST /api/fetch-jobs` with `{ agentResponse }` body
4. `route.ts` → POSTs to OpenServ webhook trigger URL
5. OpenServ workflow runs (General Assistant + Research Agent)
6. Results fetched via `GET /workspaces/{id}/tasks?apiKey=...`
7. Parsed into `OpenServData` → rendered by `OpenServResults`

## OpenServ Integration Notes

- **Webhook trigger**: `POST https://api.openserv.ai/webhooks/trigger/{TOKEN}` — self-authenticating via URL token, no auth headers needed
- **Task fetch**: `GET https://api.openserv.ai/workspaces/{ID}/tasks?apiKey={KEY}` — agent API key as query param
- **Task IDs**: 58494 (market intelligence), 58495 (job listings)
- **Webhook config**: Wait For Completion = ON, Timeout = 600s
- **Payload format**: `{ "input": string, "agentResponse": string }`

## Component Conventions

- All components are in `components/` (flat structure, no nesting)
- Props interfaces defined inline or in the same file
- Theme-aware: use `dark:` Tailwind prefix for dark mode styles
- Design system: `bg-slate-950` dark bg, `white/5` glass cards, `white/10` borders
- Accent colors: emerald (active/paid), blue (USDC), white (current stage)

## Adding New Features

- New components go in `components/`
- New utility functions go in `lib/`
- New types go in `app/data/`
- New API routes go in `app/api/<route-name>/route.ts`
- Always run `npm run build` before committing — the build must pass

## Security

- Never commit `.env` or `.env.local` files
- Never expose API keys, trigger tokens, or wallet private keys in client-side code
- All OpenServ API calls happen server-side in `route.ts`
- External links use `target="_blank" rel="noopener noreferrer"`
- URL validation via `isValidUrl()` before rendering links

## Git Conventions

- Branch naming: `feat/`, `fix/`, `docs/`, `refactor/`
- Commit messages: conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, `debug:`)
- Always create PRs — no direct pushes to `main`
- Run `npm run build` before pushing — green build = minimum bar
