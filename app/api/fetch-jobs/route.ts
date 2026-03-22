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
    output?: {
      value?: string
    }
  }
}

// Task IDs for fetching existing opportunities and job listings (fallback when trigger unavailable)
const OPPORTUNITIES_TASK_ID = 58494
const JOB_LISTINGS_TASK_ID = 58495

// REST API endpoints
const OPEN_SERV_BASE_URL = 'https://api.openserv.ai'
const OPEN_SERV_WORKSPACE_ID = process.env.OPENSERV_WORKSPACE_ID ?? '12972'

// Webhook trigger URL for posting pasted agent responses to the workflow
// Format: https://api.openserv.ai/webhooks/trigger/{TRIGGER_TOKEN}
// Set in .env: OPENSERV_TRIGGER_URL
const OPEN_SERV_TRIGGER_URL = process.env.OPENSERV_TRIGGER_URL

function extractOutput(task: OpenServTask) {
  return task.latest_task_execution_record?.output?.value?.trim() ?? ''
}

function parseAiSuitability(text: string): 'low' | 'medium' | 'high' | undefined {
  if (text.includes('High') || text.includes('\u{1F916}\u{1F64C}')) return 'high'
  if (text.includes('Medium') || text.includes('\u{1F916}\u{1F44B}')) return 'medium'
  if (text.includes('Low') || text.includes('\u{1F916}\u{1F44E}')) return 'low'
  return undefined
}

function parseMarketAnalysis(rawContent: string, jobs: JobListing[]): MarketAnalysis {
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

function buildJobListings(task: OpenServTask): OpenServJobListings {
  const rawContent = extractOutput(task)

  if (!rawContent) {
    throw new Error(`Task ${JOB_LISTINGS_TASK_ID} did not include output.`)
  }

  let jobs: JobListing[] = []

  try {
    const parsed = JSON.parse(rawContent)
    const arr = parsed.web3_job_listings ?? parsed.jobs ?? (Array.isArray(parsed) ? parsed : [])
    jobs = arr as JobListing[]
  } catch {
    console.warn('[buildJobListings] Failed to parse JSON output, falling back to empty jobs array')
  }

  return {
    type: 'job_listings',
    status: task.status ?? 'unknown',
    jobs,
    marketAnalysis: parseMarketAnalysis(rawContent, jobs),
    rawContent,
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

  if (!opportunitiesTask || !jobListingsTask) {
    throw new Error('Required OpenServ tasks were not found.')
  }

  return {
    opportunities: buildOpportunities(opportunitiesTask),
    jobListings: buildJobListings(jobListingsTask),
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
