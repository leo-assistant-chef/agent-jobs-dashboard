# OpenServ Architecture

## Overview

AI Jobs Finder uses a 2-agent OpenServ workflow to turn an agent skill profile into actionable market intelligence.

1. **General Assistant** receives the submitted skill profile and produces a competency analysis.
2. **Research Agent** takes that analysis, searches job sources across the web, and returns structured job data.

The workflow is designed so the first agent interprets the candidate profile and the second agent performs broad market discovery using that interpretation as context.

## General Assistant

The General Assistant is the first stage of the workflow.

Responsibilities:
- Read the submitted skill profile or pasted agent response.
- Analyze strengths, niches, tooling familiarity, and likely commercial fit.
- Produce a competency analysis that the downstream agent can use as a search brief.
- Frame the candidate in terms that are useful for web3 and AI-agent job research.

This stage is intentionally qualitative. It converts raw profile information into a structured research direction before any job platform queries are made.

## Research Agent

The Research Agent is the second stage of the workflow.

Responsibilities:
- Consume the competency analysis from the General Assistant.
- Search across 12+ platforms and sources for relevant opportunities.
- Normalize the findings into a structured JSON payload.
- Return both job listings and high-level market analysis signals.

The expected output is machine-readable JSON so the Next.js backend can parse and display results without relying on brittle markdown-section scraping.

## Dash Bug Workaround

There is a known OpenServ Design dashboard bug where task descriptions containing dashes may get wiped or corrupted.

To avoid that:
- Use **•** bullet characters instead of **-** in OpenServ prompt/task descriptions.
- Avoid relying on dash-prefixed lists inside the dashboard-configured prompts.

This is a prompt-authoring workaround only. It does not affect the JSON schema returned by the workflow.

## Webhook Behavior

The app can trigger the workflow synchronously through an OpenServ webhook.

Key behavior:
- The webhook is called with a JSON payload containing `input` and `agentResponse`.
- **Wait For Completion** must be **ON**.
- Timeout is **600 seconds**.
- The trigger token is used as the webhook authentication mechanism.
- The backend treats the webhook as synchronous: it waits for workflow completion, then fetches task outputs.

In practice, the route first attempts the REST webhook trigger. If triggering is unavailable or skipped, it falls back to reading the latest task outputs directly.

## 16-Field Job Listing Schema

The Research Agent should output job listings using this 16-field schema:

1. `title`
2. `job_url`
3. `description`
4. `compensation`
5. `compensation_amount`
6. `source`
7. `source_url`
8. `skills_required`
9. `category`
10. `experience_level_human`
11. `experience_level_ai_agents`
12. `employment_type`
13. `remote`
14. `posted_date`
15. `application_deadline`
16. `match_score`

### Schema Notes

- `category` should map to one of the supported normalized categories used by the app.
- `employment_type` should use the app's controlled values such as `freelance`, `contract`, or `full-time`.
- `experience_level_human` and `experience_level_ai_agents` allow the workflow to express fit for both human candidates and AI agents.
- `match_score` is the primary ranking signal used for downstream grouping and market analysis.
- `compensation_amount` is optional but useful for sorting top-paid roles.

## Backend Consumption Model

The backend parses the workflow output as JSON and supports these shapes:
- `web3_job_listings`
- `jobs`
- a raw array of job objects

After parsing:
- listings with `match_score >= 75` feed **topPaid** (sorted by `compensation_amount`)
- listings with `60 <= match_score < 75` feed **matchingSkills**
- listings with `match_score < 60` feed **worthInvestigating**
- overall AI-agent suitability is inferred from the raw output text when markers such as High, Medium, or Low are present
