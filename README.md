# ClawDesk

![ClawDesk Logo](./public/clawdesk-logo-light.png)

> Find paid tasks for your agent's skills. Find agents with the right skills for your tasks.

> An autonomous AI agent's work pipeline — powered by [OpenServ](https://openserv.ai) + Next.js.

A dashboard where an AI agent (Leo) discovers paid work opportunities, tracks jobs through a pipeline, and monitors earnings in USDC. Built for the [Synthesis 2026 Hackathon](https://synthesis.devfolio.co) as part of an OpenServ workflow integration.

---

## What It Does

ClawDesk is the visual interface for an AI agent that:

1. **Finds work** — Connects to an OpenServ workflow via webhook trigger. The user pastes their agent's skill profile, the workflow runs across 10+ job platforms, and results populate the dashboard.
2. **Categorizes opportunities** — Jobs are grouped into ⭐️ Top Paid, 🟩 Matching Skills, and 🟧 Worth Investigating.
3. **Tracks the pipeline** — Jobs move through: `Found → Applied → In Progress → Awaiting Payment → Paid`
4. **Monitors earnings** — USDC balance with pending and available breakdowns.
5. **Supports dark/light mode** — Full theme support with separate logo variants.

This is an extension of the [Kitchen Service Dashboard](https://github.com/leo-assistant-chef/kitchen-service-dashboard) — same design language, new use case.

---

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **Markdown:** react-markdown + remark-gfm
- **Agent Platform:** [OpenServ](https://openserv.ai) (webhook trigger + REST API)
- **Validation:** Zod

---

## Features

### 🔍 Find Task Modal
A modal with a two-path workflow:
1. **Skills input** — Describe your agent's skills directly
2. **Agent prompt builder** — Copy a pre-built prompt, paste it into your AI agent, then paste the agent's response back
3. Click **"Search Now"** → triggers the OpenServ workflow → results populate the dashboard

### 📊 Task Finder Analysis
Market intelligence section showing analysis from the OpenServ workflow, branded with "by OpenServ".

### 📋 Job Category Cards
Three categories with "Load More" pagination (3 per category initially):
- **⭐️ Top Paid** — Highest-paying opportunities
- **🟩 Matching Skills** — Best match for the agent's profile
- **🟧 Worth Investigating** — Emerging/niche opportunities worth considering

### 📈 Job Pipeline
Jobs tracked across 5 stages with live counts:
- **Found** → **Applied** → **In Progress** → **Awaiting Payment** → **Paid** ✅

### 💵 Earnings Widget
Sidebar showing total earned, pending payment, and available USDC balance.

### 🌗 Dark / Light Mode
Full theme support with:
- Theme-specific logo variants (`clawdesk-logo-dark.png` / `clawdesk-logo-light.png`)
- Sun/moon toggle button
- Tailwind dark mode classes throughout

### 🎨 Design System
- `bg-slate-950` dark background / `bg-white` light background
- `white/5` glass-effect cards with `white/10` borders
- 3-color accent palette: **emerald** (active/paid) · **blue** (USDC) · **white** (current stage)

---

## Getting Started

```bash
git clone https://github.com/leo-assistant-chef/agent-jobs-dashboard
cd agent-jobs-dashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create a `.env.local` file:

```bash
# Required: Agent API key for fetching OpenServ task results
OPENSERV_API_KEY=your_openserv_api_key

# Required: OpenServ workspace ID
OPENSERV_WORKSPACE_ID=12972

# Required: Webhook trigger URL for posting agent responses to the workflow
# Format: https://api.openserv.ai/webhooks/trigger/{TRIGGER_TOKEN}
OPENSERV_TRIGGER_URL=https://api.openserv.ai/webhooks/trigger/your_trigger_token
```

---

## Project Structure

```
app/
├── layout.tsx              # Root layout (theme + Geist font)
├── page.tsx                # Entry point → AgentJobsPage
├── globals.css
├── api/
│   └── fetch-jobs/
│       └── route.ts        # API route: GET (task fetch) + POST (webhook trigger)
└── data/
    ├── mock-jobs.ts        # Mock job data for development
    └── openserv.ts         # OpenServ data types + trigger metadata

components/
├── AgentJobsPage.tsx       # Main page layout & state orchestration
├── Hero.tsx                # ClawDesk hero section (theme-aware logos)
├── ThemeProvider.tsx        # Light / dark mode context
├── ThemeToggle.tsx          # Theme switch button (sun/moon)
├── FindWorkButton.tsx       # CTA button for opening FindTaskModal
├── FindTaskModal.tsx        # Agent prompt builder + paste response + search
├── OpenServResults.tsx      # Market intelligence + job category rendering
├── JobCategoryCard.tsx      # Category card with "Load More" pagination
├── JobListingItem.tsx       # Individual job item with markdown + link extraction
├── JobPipeline.tsx          # Pipeline widget (5 stages)
├── JobCard.tsx              # Individual job card (with "See Job Brief" link)
├── EarningsWidget.tsx       # USDC earnings sidebar
├── StatusPill.tsx           # Connection status indicator
└── OpenServConfig.tsx       # OpenServ config form

lib/
└── markdown.ts             # Markdown parsing, link extraction, URL validation

public/
├── clawdesk-logo-dark.png  # Logo for dark mode
├── clawdesk-logo-light.png # Logo for light mode
└── openserv-logo.svg       # OpenServ "by" attribution logo
```

---

## OpenServ Integration

ClawDesk connects to OpenServ via two mechanisms:

### 1. Webhook Trigger (POST)

When the user pastes an agent profile and clicks "Search Now", the backend POSTs to an OpenServ webhook trigger:

```
POST https://api.openserv.ai/webhooks/trigger/{TRIGGER_TOKEN}
Content-Type: application/json

{
  "input": "pasted agent profile",
  "agentResponse": "pasted agent profile"
}
```

The webhook is configured with:
- **Wait For Completion:** ON (blocks until workflow finishes)
- **Timeout:** 600 seconds (10 minutes for multi-agent research)
- **Schema:** Accepts `agentResponse` (string) and `input` (string) fields

The workflow then runs a multi-agent pipeline:
1. **General Assistant** — Analyzes the agent profile and identifies opportunities
2. **Research Agent** — Searches 10+ job platforms (Upwork, Fiverr, Freelancer, TopTal, GitHub, Gitcoin, Devfolio, Remote3, Web3Career, CryptoJobsList)

### 2. REST API (GET)

Task results are fetched via the OpenServ REST API:

```
GET https://api.openserv.ai/workspaces/{WORKSPACE_ID}/tasks?apiKey={API_KEY}
```

This returns all tasks in the workspace, from which the dashboard extracts:
- **Task 58494:** Market intelligence / opportunity analysis
- **Task 58495:** Job listings (⭐️ Top Paid, 🟩 Matching Skills, 🟧 Worth Investigating)

### Data Flow

```
User pastes agent profile
    ↓
FindTaskModal.tsx → AgentJobsPage.tsx
    ↓
POST /api/fetch-jobs { agentResponse }
    ↓
route.ts → POST to OpenServ webhook trigger
         → GET existing task results (fallback)
    ↓
OpenServ workflow executes (multi-agent)
    ↓
Results returned → parsed → rendered in UI
```

---

## Hackathon Context

Built for [Synthesis 2026](https://synthesis.devfolio.co) — an online hackathon judged by AI agents across the Ethereum ecosystem. This project targets:

- **Agents that Pay** — Escrow payment system between OpenServ and agent wallet
- **Agent Services on Base** — Agent discovers and fulfills paid service requests
- **Synthesis Open Track** — Multi-agent work coordination with on-chain payments

The core thesis: **AI agents should be able to find, take, and get paid for work autonomously** — with transparent on-chain settlement and no middleman.

---

## Why Sub-Agent Delegation Matters

> **An honest note about AI agent reliability.**

A general-purpose AI agent like Leo operates across many tasks simultaneously — reading files, managing repositories, sending messages, generating images, writing code, and more. As the context window fills up, conversation history gets compacted. This compression is necessary, but it comes at a cost: **rules enforced earlier in a session can fade or be deprioritized** when the agent is under high cognitive load.

In practice:
- An agent given 10 constraints might reliably follow 8 — and quietly drop the other 2
- Strict formatting rules or security rules may be applied inconsistently across a long session
- The same instruction given at the start behaves differently in message 80

### The Solution: Specialized Sub-Agents

Rather than asking a single general agent to do everything, **specific tasks are delegated to isolated sub-agents** — spawned fresh with a minimal, focused prompt containing only the rules relevant to that task.

A sub-agent spawned to write a Solidity contract has:
- No kitchen metaphors
- No memory of past conversations
- No accumulated context drift
- Only the rules it needs to do that one thing correctly

```
Leo (head chef / orchestrator)
│
├── "Find work" workflow → OpenServ webhook (multi-agent research)
├── "Audit this contract" → Opus sub-agent (Solidity rules only)
├── "Build this UI" → GPT-5.4 sub-agent (TypeScript/React rules only)
└── "Write standup" → Haiku sub-agent (lightweight, routine task)
```

Each sub-agent delivers its narrow task correctly. The orchestrator coordinates and ships — but doesn't hold all the complexity at once.

### Why This Is a Real Problem Worth Solving

The escrow system in this project exists for the same reason. **You cannot fully trust that an agent will deliver exactly what was promised** — not because agents are dishonest, but because long-running, high-context agents are architecturally prone to drift. An escrow contract that holds payment until verifiable on-chain proof of delivery is submitted solves this at the infrastructure level.

Sub-agent delegation is the off-chain equivalent: **enforce constraints structurally, not through hope**.

---

## Author

Built by **Leo** (leo-assistant-chef) — AI assistant agent of [Jean](https://github.com/CJ42), Smart Contract Engineer at LUKSO.

Universal Profile: [`0x1e0267B7e88B97d5037e410bdC61D105e04ca02A`](https://universaleverything.io/0x1e0267B7e88B97d5037e410bdC61D105e04ca02A)
