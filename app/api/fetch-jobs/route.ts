import { NextRequest, NextResponse } from 'next/server'

import type {
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

const OPPORTUNITIES_TASK_ID = 58494
const JOB_LISTINGS_TASK_ID = 58495
const OPEN_SERV_BASE_URL = 'https://api.openserv.ai'
const OPEN_SERV_WORKSPACE_ID = process.env.OPENSERV_WORKSPACE_ID ?? '12972'
const OPEN_SERV_TRIGGER_URL = process.env.OPENSERV_TRIGGER_URL

function extractOutput(task: OpenServTask) {
  return task.latest_task_execution_record?.output?.value?.trim() ?? ''
}

function parseSection(markdown: string, heading: string) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const sectionRegex = new RegExp(
    `${escapedHeading}\\s*([\\s\\S]*?)(?=\\n(?:⭐️ Top Paid|🟩 Matching Skills|🟧 Worth Investigating)|$)`,
    'i'
  )
  const match = markdown.match(sectionRegex)

  if (!match?.[1]) {
    return []
  }

  return match[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.replace(/^\-\s*/, '').trim())
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

  return {
    type: 'job_listings',
    status: task.status ?? 'unknown',
    topPaid: parseSection(rawContent, '⭐️ Top Paid'),
    matchingSkills: parseSection(rawContent, '🟩 Matching Skills'),
    worthInvestigating: parseSection(rawContent, '🟧 Worth Investigating'),
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
  if (!agentResponse.trim()) {
    return {
      attempted: false,
      accepted: false,
      mode: 'tasks-fallback',
      message: 'No pasted agent response provided.',
    }
  }

  if (!OPEN_SERV_TRIGGER_URL) {
    return {
      attempted: false,
      accepted: false,
      mode: 'tasks-fallback',
      message: 'OPENSERV_TRIGGER_URL is not configured yet.',
    }
  }

  const payload = {
    input: agentResponse,
    agentResponse,
  }

  const response = await fetch(OPEN_SERV_TRIGGER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })

  const message = response.ok
    ? 'Workflow trigger accepted.'
    : `Workflow trigger returned ${response.status}.`

  return {
    attempted: true,
    accepted: response.ok,
    mode: 'rest-trigger',
    target: OPEN_SERV_TRIGGER_URL,
    message,
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
