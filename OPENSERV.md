# OpenServ Integration

This document details how AI Jobs Finder integrates with [OpenServ](https://openserv.ai) — the multi-agent platform powering all intelligence in this project.

> **Honest note:** OpenServ isn't just a logo on our README. It's our entire intelligence layer. Without it, AI Jobs Finder is a Next.js app that renders an empty list.

---

## Overview

The dApp connects to OpenServ via two mechanisms:

1. **Webhook Trigger (POST)** — fires the full 3-agent pipeline synchronously
2. **REST API (GET)** — fetches cached task results as fallback

```
POST https://api.openserv.ai/webhooks/trigger/{TOKEN}
GET  https://api.openserv.ai/workspaces/{WORKSPACE_ID}/tasks?apiKey={API_KEY}
```

The webhook is configured with **Wait For Completion: ON** — the dApp hangs synchronously until OpenServ returns all results. No polling. No state machine. One request, one response.

---

## Multi-Agent Workflow

![Multi Agent workflow](./img/openserv_multi_agents_workflow.png)

The workflow runs **3 specialized agents in sequence** — each agent owns exactly one responsibility. No overlaps. This is multi-agent separation of concerns in practice.

| # | OpenServ Agent Type | Task ID | Name | Role |
|---|---|---|---|---|
| 1 | General Assistant | `58494` | **Intake Coordinator** | Parses the skill profile → outputs `search_brief` JSON |
| 2 | Research Agent | `58495` | **Job Scraper** | Searches 10+ platforms → outputs structured job listings |
| 3 | Research Agent | `61236` | **Market Analyst** | Ranks, scores, and summarises → outputs market intelligence text |

**Sequencing matters:** The Analyst runs *after* the Scraper — not in parallel. It receives structured job data, not raw text blobs. This was the key architectural fix on Day 3 of the build.

---

## Agent 1: Intake Coordinator (Task `58494`)

![Intake Coordinator Agent](./img/openserv_schema_agent1_intake_coordinator.png)

**Assigned to:** General Assistant  
**Output type:** Structured JSON (`search_brief`)

**What it does:**
- Receives the raw skill profile pasted by the user
- Identifies primary skills, experience level, and secondary skills
- Generates targeted search queries for the Job Scraper
- Does **NOT** search the web — it only dispatches

**Output schema (`search_brief`):**

```json
{
  "search_id": "string",
  "timestamp": "number",
  "skill_profile": {
    "primary_skills": ["string"],
    "experience_level": "junior | mid | senior",
    "secondary_skills": ["string"]
  },
  "search_queries": ["string"]
}
```

---

## Agent 2: Job Scraper (Task `58495`)

![Job Scraper Agent](./img/openserv_schema_agent2_job_scraper.png)

**Assigned to:** Research Agent  
**Output type:** Structured JSON (`job_listings_structured`) — array of job objects

**What it does:**
- Receives the `search_brief` from the Intake Coordinator
- Searches across 10+ job platforms: Upwork, Fiverr, Freelancer, TopTal, GitHub, Gitcoin, Devfolio, Remote3, Web3Career, CryptoJobsList, Immunefi, Code4Rena
- Returns all jobs together in a **single `out_complete_task` call** (not one per job)

**Output schema (`job_listings_structured`):**

```json
{
  "jobs": [
    {
      "title": "string",
      "company": "string",
      "source": "string (platform name)",
      "job_url": "string (direct link)",
      "employment_type": "freelance | contract | full-time | part-time | bounty | grant",
      "remote": "boolean",
      "compensation_min": "number",
      "compensation_max": "number",
      "compensation_currency": "string (USD | ETH | USDC | ...)",
      "skills_required": ["string"],
      "match_score": "integer (0–100)",
      "experience_level_ai_agent": "freshly-deployed | active | verified | specialized | trusted",
      "experience_level_human": ["junior", "mid", "senior"],
      "description": "string",
      "posted_date": "string (ISO 8601 or relative)",
      "application_deadline": "string (optional)",
      "worth_investigating": "boolean"
    }
  ]
}
```

> **Key insight:** The schema uses `jobs: []` array wrapper — not a flat object — so the agent can return multiple listings in a single structured output call. This was a critical fix: the original `type: object` schema caused the agent to return exactly one job per run regardless of how many it found.

---

## Agent 3: Market Analyst (Task `61236`)

![Market Analyst](./img/openserv_agent3_market_analyst.png)

**Assigned to:** Research Agent  
**Output type:** Text (markdown — `market_analysis`)

**What it does:**
- Receives structured job data from the Job Scraper
- Ranks and scores opportunities against the skill profile
- Writes a human-readable market intelligence summary
- Categorises opportunities into: Top Paid, Matching Skills, Worth Investigating

**Output format (markdown sections):**

```markdown
## Market Intelligence

[summary paragraph]

#### Top Paid
- [Job Title] — [Compensation]

#### Matching Skills
- [Job Title] — [match rationale]

#### Worth Investigating
- [Job Title] — [why it's interesting]
```

---

## The Schema War (Day 2.5)

Our first workflow results came back... highly creative. Instead of structured job listings, we got free-form paragraphs. Sometimes JSON, sometimes markdown, sometimes a mix of both.

**The fix:** strict output schemas on every agent. Once the schema was locked, agents stopped improvising. Every run returned clean, typed, parseable data.

The defining moment: Agent 2 was returning exactly **one job per run** despite finding many. Root cause: the output schema was typed as `type: object` — a single job dict. The model was faithfully returning exactly what we asked for. Fix: wrap in `{ jobs: [] }`. Next run returned 8 jobs.

---

## A Live Bug We Found & Reported

Mid-build, we discovered that the **OpenServ Design dashboard silently wipes task descriptions** on save whenever the input contains a dash character (`-`).

**Root cause:** The UI parser treats `-` as a markdown list delimiter and strips the rest of the description.

**Workaround:** Replace all dashes with the bullet character (`•`, Unicode U+2022) in prompt text.

**We reported it directly to the OpenServ team** in the Synthesis hackathon Telegram channel:
> 🔗 [https://t.me/synthesis_md/1804/3220](https://t.me/synthesis_md/1804/3220)

---

## Webhook Integration Details

```
POST https://api.openserv.ai/webhooks/trigger/ee932cdefb0f4d6da761f9b74877a2ee
Content-Type: application/json

{
  "input": "<pasted skill profile>",
  "agentResponse": "<pasted skill profile>"
}
```

Configuration:
- **Wait For Completion:** ON (synchronous — blocks until all 3 agents finish)
- **Timeout:** 600 seconds
- **Workspace ID:** `12972`

The `Wait For Completion` flag is a superpower. Synchronous execution eliminates polling, queuing, and an entire category of async infrastructure complexity we'd been dreading.

---

## Key Lessons

1. **Webhooks beat MCP for external app integration.** MCP is incredible for tool-use inside an agent. For external apps triggering workflows, a webhook with "Wait For Completion" is simpler and more reliable.

2. **Output schemas are non-negotiable.** Without a schema, you're hoping for good formatting. With a schema, you're requiring it.

3. **Workflow architecture matters more than prompt quality.** The best prompts can't fix an agent receiving the wrong input. Design the pipeline first. Write prompts second.

4. **Isolation is a trust primitive.** An agent that can't drift is an agent you can rely on. Architectural constraints create more trust than any amount of system-prompt engineering.

5. **Agents are more reliable when they do less.** Specialisation isn't just efficient — it's secure. Focused agents hallucinate less and produce cleaner outputs.
