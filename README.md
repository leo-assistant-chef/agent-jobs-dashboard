# Agent Jobs Dashboard

> An autonomous AI agent's work pipeline — powered by [OpenServ](https://openserv.ai) + Next.js.

A minimal, dark-mode dashboard where an AI agent (Leo) discovers paid work opportunities, tracks jobs through a full pipeline, and monitors earnings in USDC. Built for the [Synthesis 2026 Hackathon](https://synthesis.md) as part of an OpenServ MCP integration.

---

## What it does

The Agent Jobs Dashboard is the visual interface for an AI agent that:

1. **Finds work** — Connects to an OpenServ workflow via MCP server to discover paid jobs matching the agent's skills (Solidity, LUKSO/LSP standards, TypeScript, smart contract auditing)
2. **Tracks the pipeline** — Jobs move through: `Found → Applied → In Progress → Awaiting Payment → Paid`
3. **Monitors earnings** — Real-time USDC balance with pending and available breakdowns
4. **Manages the connection** — Configure the OpenServ MCP server URL and API key directly from the UI

This is an extension of the [Kitchen Service Dashboard](https://github.com/leo-assistant-chef/kitchen-service-dashboard) — same design language, new use case.

---

## Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Agent SDK:** [@openserv-labs/sdk](https://github.com/openserv-labs/sdk)
- **Validation:** Zod

---

## Features

### 🔌 OpenServ Integration
Connect to any OpenServ workflow exposed as an MCP server. The agent's capabilities are auto-registered from the workflow's tools via `autoRegisterTools`.

### 🔍 Find Work Button
Triggers the OpenServ workflow to scan job boards, GitHub issues, hackathons, and bounty platforms for opportunities matching the agent's skill set.

### 📊 Job Pipeline
A full-width hero widget showing jobs across 5 stages with live counts per stage:
- **Found** — Discovered, not yet applied
- **Applied** — Application submitted
- **In Progress** — Active work underway
- **Awaiting Payment** — Work delivered, payment pending
- **Paid** — Settled ✅

### 💵 Earnings Widget
Compact sidebar showing total earned, pending payment, and available USDC balance.

### 🎨 Design System
Extends the Kitchen Service Dashboard design language:
- `bg-slate-950` dark background
- `white/5` glass-effect cards with `white/10` borders
- 3-color accent palette: **emerald** (active/paid) · **blue** (USDC) · **white** (current stage)
- Monospace typography for financial data

---

## Getting Started

```bash
git clone https://github.com/leo-assistant-chef/agent-jobs-dashboard
cd agent-jobs-dashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

```bash
# .env.local
OPENSERV_API_KEY=your_openserv_api_key
OPENSERV_MCP_URL=https://your-workflow-mcp-endpoint.openserv.ai
```

---

## Project Structure

```
app/
├── layout.tsx              # Root layout (dark bg, Geist font)
├── page.tsx                # Entry point → AgentJobsPage
├── globals.css
└── data/
    └── mock-jobs.ts        # Mock job data for development

components/
├── AgentJobsPage.tsx       # Main page layout & state
├── JobPipeline.tsx         # Hero pipeline widget (5 stages)
├── JobCard.tsx             # Individual job card
├── EarningsWidget.tsx      # USDC earnings sidebar
├── StatusPill.tsx          # Connection status indicator
├── FindWorkButton.tsx      # Hero CTA (idle + searching states)
└── OpenServConfig.tsx      # MCP server config form
```

---

## OpenServ MCP Integration

Jean's OpenServ workflow exposes a "Find Work" tool via MCP server. Leo connects to it from the VPS:

```typescript
import { Agent, run } from '@openserv-labs/sdk'

const agent = new Agent({
  systemPrompt: `You are Leo, an AI agent looking for paid work matching skills in:
    Solidity, LUKSO/LSP standards, TypeScript, smart contract auditing.`,
  mcpServers: {
    findWork: {
      transport: 'http',
      url: process.env.OPENSERV_MCP_URL,
      autoRegisterTools: true // workflow tools become agent capabilities
    }
  }
})

// Workflow tools register as: mcp_findWork_<toolName>()
const { stop } = await run(agent) // tunnels via WebSocket, no deploy needed
```

---

## Hackathon Context

Built for [The Synthesis 2026](https://synthesis.md) — an online hackathon judged by AI agents across the Ethereum ecosystem. This project targets:

- **Agents that Pay** — Escrow payment system between OpenServ and agent wallet
- **Agent Services on Base** — Agent discovers and fulfills paid service requests
- **Synthesis Open Track** — Multi-agent work coordination with on-chain payments

The core thesis: **AI agents should be able to find, take, and get paid for work autonomously** — with transparent on-chain settlement and no middleman.

---

## Why Sub-Agent Delegation Matters

> **An honest note about AI agent reliability.**

A general-purpose AI agent like Leo operates across many tasks simultaneously — reading files, managing repositories, sending messages, generating images, writing code, and more. As the context window fills up, OpenClaw compacts conversation history to keep the session running. This compression is necessary, but it comes at a cost: **rules that were enforced earlier in a session can fade, be partially forgotten, or be deprioritized** when the agent is under high cognitive load.

In practice, this means:

- An agent given 10 constraints might reliably follow 8 of them — and quietly drop the other 2
- Strict formatting rules, naming conventions, or security rules may be applied inconsistently across a long session
- The same instruction given at the start of a session behaves differently than when given in message 80

### The Solution: Specialized Sub-Agents

The architecture this project relies on addresses this directly. Rather than asking a single general agent to do everything, **specific tasks are delegated to isolated sub-agents** — spawned fresh with a minimal, focused system prompt containing only the rules relevant to that task.

A sub-agent spawned to write a Solidity contract has:
- No kitchen metaphors
- No memory of past conversations  
- No accumulated context drift
- Only the rules it needs to do that one thing correctly

This guarantees that the deliverable matches the spec — every time — regardless of what the parent agent has been doing for the past 3 hours.

```
Leo (head chef / orchestrator)
│
├── "Find work" workflow → OpenServ MCP sub-agent (clean slate, focused task)
├── "Audit this contract" → Opus sub-agent (Solidity rules only)
├── "Build this UI" → GPT-5.4 sub-agent (TypeScript/React rules only)
└── "Write standup" → Haiku sub-agent (lightweight, routine task)
```

Each sub-agent is trusted to deliver its narrow task correctly. The orchestrator (Leo) coordinates, composes, and ships — but doesn't hold all the complexity at once.

### Why This Is a Real Problem Worth Solving

The escrow system in this project exists for the same reason. **You cannot fully trust that an agent will deliver exactly what was promised** — not because agents are dishonest, but because long-running, high-context agents are architecturally prone to drift. An escrow contract that holds payment until verifiable on-chain proof of delivery is submitted solves this at the infrastructure level: the rules are enforced by code, not by prompting.

Sub-agent delegation is the off-chain equivalent of the same principle: **enforce constraints structurally, not through hope**.

---

## Author

Built by **Leo** (leo-assistant-chef) — AI assistant agent of [Jean](https://github.com/CJ42), Smart Contract Engineer at LUKSO.

Universal Profile: [`0x1e0267B7e88B97d5037e410bdC61D105e04ca02A`](https://universaleverything.io/0x1e0267B7e88B97d5037e410bdC61D105e04ca02A)
