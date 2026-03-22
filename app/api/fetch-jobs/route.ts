import { NextRequest, NextResponse } from 'next/server'

import type {
  JobListing,
  MarketAnalysis,
  OpenServData,
  OpenServJobListings,
  OpenServOpportunity,
  OpenServTriggerMeta,
} from '@/app/data/openserv'

type OpenServTask = {
  id: number
  status?: string
  latest_task_execution_record?: {
    outputOptionId?: string
    output?: {
      type?: 'text' | 'structured' | string
      value?: string | Record<string, unknown> | unknown[]
    }
  }
}

// Task IDs (updated 2026-03-22 after workflow restructure)
// 58494 = General Assistant → text output (opportunities/context)
// 58495 = Research Agent   → job_listings_structured (structured JSON jobs)
// 61236 = Research Agent   → market_analysis (text markdown sections)
const OPPORTUNITIES_TASK_ID = 58494
const JOB_LISTINGS_TASK_ID = 58495
const MARKET_ANALYSIS_TASK_ID = 61236

// REST API endpoints
const OPEN_SERV_BASE_URL = 'https://api.openserv.ai'
const OPEN_SERV_WORKSPACE_ID = process.env.OPENSERV_WORKSPACE_ID ?? '12972'

// Webhook trigger URL for posting pasted agent responses to the workflow
// Format: https://api.openserv.ai/webhooks/trigger/{TRIGGER_TOKEN}
// Set in .env: OPENSERV_TRIGGER_URL
const OPEN_SERV_TRIGGER_URL = process.env.OPENSERV_TRIGGER_URL

function extractOutput(task: OpenServTask): string {
  const value = task.latest_task_execution_record?.output?.value
  if (!value) return ''
  if (typeof value === 'string') return value.trim()
  // Structured output: value is already a parsed object — serialize for rawContent
  return JSON.stringify(value)
}

function extractStructuredValue(task: OpenServTask): unknown {
  const rec = task.latest_task_execution_record
  if (!rec) return null
  const output = rec.output
  if (!output) return null
  // Structured output: value is a parsed object/array from OpenServ
  if (output.type === 'structured') return output.value ?? null
  // Text output: try to JSON.parse
  if (typeof output.value === 'string') {
    try { return JSON.parse(output.value) } catch { return null }
  }
  return output.value ?? null
}

function parseAiSuitability(text: string): 'low' | 'medium' | 'high' | undefined {
  if (text.includes('High') || text.includes('🤖🙌')) return 'high'
  if (text.includes('Medium') || text.includes('🤖👋')) return 'medium'
  if (text.includes('Low') || text.includes('🤖👎')) return 'low'
  return undefined
}

// Restore markdown section parser for text-output fallback
function parseMarkdownSection(markdown: string, heading: string): string[] {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const sectionRegex = new RegExp(
    `${escapedHeading}\\s*([\\s\\S]*?)(?=\\n#{1,3}\\s|$)`,
    'i'
  )
  const match = markdown.match(sectionRegex)
  if (!match?.[1]) return []
  return match[1]
    .split('\n')
    .map(line => line.trim())
    .filter(line => /^\d+\.|^[-*]/.test(line))
    .map(line => line.replace(/^\d+\.\s*|^[-*]\s*/, '').replace(/\*\*/g, '').trim())
    .filter(Boolean)
}

function parseMarketAnalysis(rawContent: string, jobs: JobListing[]): MarketAnalysis {
  // If we have structured jobs, derive sections from them
  if (jobs.length > 0) {
    const topPaid = jobs
      .filter(j => j.match_score >= 75)
      .sort((a, b) => (b.compensation_amount ?? 0) - (a.compensation_amount ?? 0))
      .slice(0, 5)
      .map(j => `${j.title} | ${j.compensation} | ${j.job_url}`)

    const matchingSkills = jobs
      .filter(j => j.match_score >= 60 && j.match_score < 75)
      .slice(0, 5)
      .map(j => `${j.title} | ${j.compensation} | ${j.job_url}`)

    const worthInvestigating = jobs
      .filter(j => j.match_score < 60)
      .slice(0, 5)
      .map(j => `${j.title} | ${j.compensation} | ${j.job_url}`)

    return {
      topPaid,
      matchingSkills,
      worthInvestigating,
      aiAgentSuitability: parseAiSuitability(rawContent),
    }
  }

  // Fallback: parse markdown text output (when structured output not firing)
  return {
    topPaid: parseMarkdownSection(rawContent, '⭐️ Top Paid'),
    matchingSkills: parseMarkdownSection(rawContent, '🟩 Matching Skills'),
    worthInvestigating: parseMarkdownSection(rawContent, '🟧 Worth Investigating'),
    aiAgentSuitability: parseAiSuitability(rawContent),
  }
}

function buildOpportunities(task: OpenServTask): OpenServOpportunity {
  const content = extractOutput(task)

  if (!content) {
    throw new Error(`Task ${OPPORTUNITIES_TASK_ID} did not include output.`)
  }

  return {
    type: 'opportunities',
    content,
    status: task.status ?? 'unknown',
  }
}

function normalizeJob(raw: Record<string, unknown>): JobListing {
  // Normalize field name differences: ai_agent (singular) → ai_agents (plural)
  return {
    ...raw,
    experience_level_ai_agents:
      (raw.experience_level_ai_agents as string | undefined) ??
      (raw.experience_level_ai_agent as string | undefined),
    // Flatten array experience_level_human to first value if needed
    experience_level_human: Array.isArray(raw.experience_level_human)
      ? (raw.experience_level_human[0] as string)
      : (raw.experience_level_human as string | undefined),
  } as unknown as JobListing
}

function buildJobListings(task: OpenServTask, marketAnalysisText?: string): OpenServJobListings {
  const rawContent = extractOutput(task)
  // Use dedicated market analysis text for section parsing (task 61236),
  // fall back to task's own raw content
  const analysisText = marketAnalysisText || rawContent
  const structured = extractStructuredValue(task)

  let jobs: JobListing[] = []

  if (structured !== null) {
    // Single job object (OpenServ structured output returns one item)
    if (Array.isArray(structured)) {
      jobs = structured.map((j) => normalizeJob(j as Record<string, unknown>))
    } else if (typeof structured === 'object' && structured !== null) {
      const obj = structured as Record<string, unknown>
      // Handle { jobs: [...] } or { web3_job_listings: [...] } wrappers
      const arr = obj.web3_job_listings ?? obj.jobs
      if (Array.isArray(arr)) {
        jobs = arr.map((j) => normalizeJob(j as Record<string, unknown>))
      } else if (obj.title) {
        // Single job dict — wrap in array
        jobs = [normalizeJob(obj)]
      }
    }
  } else {
    console.warn('[buildJobListings] No structured output found, jobs will be empty')
  }

  return {
    type: 'job_listings',
    status: task.status ?? 'unknown',
    jobs,
    marketAnalysis: parseMarketAnalysis(analysisText, jobs),
    rawContent: analysisText || rawContent,
  }
}

async function fetchOpenServTasks(apiKey: string) {
  const response = await fetch(
    `${OPEN_SERV_BASE_URL}/workspaces/${OPEN_SERV_WORKSPACE_ID}/tasks?apiKey=${apiKey}`,
    {
      method: 'GET',
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    throw new Error(`OpenServ request failed with status ${response.status}.`)
  }

  return (await response.json()) as OpenServTask[]
}

async function triggerWorkflow(agentResponse: string): Promise<OpenServTriggerMeta> {
  // If no pasted agent response, skip triggering and use task fallback
  if (!agentResponse.trim()) {
    return {
      attempted: false,
      accepted: false,
      mode: 'tasks-fallback',
      message: 'No pasted agent response provided.',
    }
  }

  // If webhook trigger URL is not configured, fall back to existing task fetch
  if (!OPEN_SERV_TRIGGER_URL) {
    return {
      attempted: false,
      accepted: false,
      mode: 'tasks-fallback',
      message: 'OPENSERV_TRIGGER_URL is not configured yet.',
    }
  }

  // POST the pasted agent response to the OpenServ webhook trigger
  // The webhook is configured with:
  // - Wait For Completion: ON (blocks until workflow finishes)
  // - Timeout: 600s (allows 10 minutes for multi-agent workflow)
  // - Schema: accepts { agentResponse, input } fields
  const payload = {
    input: agentResponse,
    agentResponse,
  }

  try {
    console.log('[triggerWorkflow] Attempting POST to:', OPEN_SERV_TRIGGER_URL)
    console.log('[triggerWorkflow] Payload:', JSON.stringify(payload))
    
    const response = await fetch(OPEN_SERV_TRIGGER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })

    const responseText = await response.text()
    console.log('[triggerWorkflow] Response status:', response.status)
    console.log('[triggerWorkflow] Response body:', responseText.slice(0, 500))

    const message = response.ok
      ? 'Workflow triggered successfully.'
      : `Workflow trigger returned ${response.status}. Body: ${responseText.slice(0, 200)}`

    return {
      attempted: true,
      accepted: response.ok,
      mode: 'rest-trigger',
      target: OPEN_SERV_TRIGGER_URL,
      message,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[triggerWorkflow] Exception:', errorMsg)
    
    return {
      attempted: true,
      accepted: false,
      mode: 'rest-trigger',
      target: OPEN_SERV_TRIGGER_URL,
      message: `Trigger failed: ${errorMsg}`,
    }
  }
}

async function buildResponse(agentResponse = ''): Promise<OpenServData> {
  const apiKey = process.env.OPENSERV_API_KEY

  if (!apiKey) {
    throw new Error('OPENSERV_API_KEY is not configured.')
  }

  const trigger = await triggerWorkflow(agentResponse)
  const tasks = await fetchOpenServTasks(apiKey)

  const opportunitiesTask = tasks.find((task) => task.id === OPPORTUNITIES_TASK_ID)
  const jobListingsTask = tasks.find((task) => task.id === JOB_LISTINGS_TASK_ID)
  const marketAnalysisTask = tasks.find((task) => task.id === MARKET_ANALYSIS_TASK_ID)

  if (!opportunitiesTask || !jobListingsTask) {
    throw new Error('Required OpenServ tasks were not found.')
  }

  // Market analysis text comes from task 61236 (dedicated market_analysis task)
  // Fall back to job listings raw content if 61236 has no output yet
  const marketAnalysisText = marketAnalysisTask
    ? extractOutput(marketAnalysisTask)
    : extractOutput(jobListingsTask)

  return {
    opportunities: buildOpportunities(opportunitiesTask),
    jobListings: buildJobListings(jobListingsTask, marketAnalysisText),
    trigger,
    agentResponse: agentResponse || undefined,
  }
}

export async function GET() {
  try {
    const data = await buildResponse()
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown OpenServ fetch error.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const agentResponse = typeof body?.agentResponse === 'string' ? body.agentResponse : ''
    const data = await buildResponse(agentResponse)
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown OpenServ fetch error.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
