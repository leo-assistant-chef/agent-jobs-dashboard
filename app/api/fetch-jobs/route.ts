import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import {
  fetchTasks,
  triggerWebhook,
  uploadResultsFile,
  type OpenServTask,
} from '@/lib/openserv-client'

import type {
  OpenServData,
  OpenServJobListings,
  OpenServOpportunity,
  OpenServTriggerMeta,
} from '@/app/data/openserv'

// ---------------------------------------------------------------------------
// Task IDs for the two workflow agents in OpenServ workspace 12972
// ---------------------------------------------------------------------------
const OPPORTUNITIES_TASK_ID = 58494
const JOB_LISTINGS_TASK_ID = 58495

// Webhook trigger URL (platform-level concept, not an SDK method)
const OPEN_SERV_TRIGGER_URL = process.env.OPENSERV_TRIGGER_URL

// ---------------------------------------------------------------------------
// Zod schema for the structured output written to the workspace as an artifact
// ---------------------------------------------------------------------------
const JobResultSchema = z.object({
  opportunities: z.object({
    type: z.literal('opportunities'),
    content: z.string(),
    status: z.string(),
  }),
  jobListings: z.object({
    type: z.literal('job_listings'),
    status: z.string(),
    topPaid: z.array(z.string()),
    matchingSkills: z.array(z.string()),
    worthInvestigating: z.array(z.string()),
  }),
  triggeredAt: z.string(),
})

type JobResult = z.infer<typeof JobResultSchema>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractOutput(task: OpenServTask): string {
  return task.latest_task_execution_record?.output?.value?.trim() ?? ''
}

function parseSection(markdown: string, heading: string): string[] {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const sectionRegex = new RegExp(
    `${escapedHeading}\\s*([\\s\\S]*?)(?=\\n(?:⭐️ Top Paid|🟩 Matching Skills|🟧 Worth Investigating)|$)`,
    'i'
  )
  const match = markdown.match(sectionRegex)
  if (!match?.[1]) return []
  return match[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.replace(/^-\s*/, '').trim())
}

function buildOpportunities(task: OpenServTask): OpenServOpportunity {
  const content = extractOutput(task)
  if (!content) throw new Error(`Task ${OPPORTUNITIES_TASK_ID} has no output yet.`)
  return { type: 'opportunities', content, status: task.status ?? 'unknown' }
}

function buildJobListings(task: OpenServTask): OpenServJobListings {
  const rawContent = extractOutput(task)
  if (!rawContent) throw new Error(`Task ${JOB_LISTINGS_TASK_ID} has no output yet.`)
  return {
    type: 'job_listings',
    status: task.status ?? 'unknown',
    topPaid: parseSection(rawContent, '⭐️ Top Paid'),
    matchingSkills: parseSection(rawContent, '🟩 Matching Skills'),
    worthInvestigating: parseSection(rawContent, '🟧 Worth Investigating'),
    rawContent,
  }
}

// ---------------------------------------------------------------------------
// Trigger the webhook workflow via SDK-consistent auth
// ---------------------------------------------------------------------------

async function triggerWorkflow(agentResponse: string): Promise<OpenServTriggerMeta> {
  if (!agentResponse.trim()) {
    return { attempted: false, accepted: false, mode: 'tasks-fallback', message: 'No skill profile provided.' }
  }
  if (!OPEN_SERV_TRIGGER_URL) {
    return { attempted: false, accepted: false, mode: 'tasks-fallback', message: 'OPENSERV_TRIGGER_URL not configured.' }
  }

  try {
    console.log('[triggerWorkflow] POST →', OPEN_SERV_TRIGGER_URL)
    const { ok, status, body } = await triggerWebhook(OPEN_SERV_TRIGGER_URL, {
      input: agentResponse,
      agentResponse,
    })
    console.log('[triggerWorkflow] Response', status, body.slice(0, 200))
    return {
      attempted: true,
      accepted: ok,
      mode: 'rest-trigger',
      target: OPEN_SERV_TRIGGER_URL,
      message: ok
        ? 'Workflow triggered successfully.'
        : `Trigger returned ${status}. Body: ${body.slice(0, 200)}`,
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[triggerWorkflow] Exception:', msg)
    return { attempted: true, accepted: false, mode: 'rest-trigger', target: OPEN_SERV_TRIGGER_URL, message: `Trigger failed: ${msg}` }
  }
}

// ---------------------------------------------------------------------------
// Main builder — uses SDK for task fetching, uploads results as workspace artifact
// ---------------------------------------------------------------------------

async function buildResponse(agentResponse = ''): Promise<OpenServData> {
  // 1. Trigger the workflow (if a skill profile was provided)
  const trigger = await triggerWorkflow(agentResponse)

  // 2. Fetch tasks via SDK (replaces raw fetch to /workspaces/:id/tasks?apiKey=...)
  const tasks = await fetchTasks()

  const opportunitiesTask = tasks.find((t) => t.id === OPPORTUNITIES_TASK_ID)
  const jobListingsTask = tasks.find((t) => t.id === JOB_LISTINGS_TASK_ID)

  if (!opportunitiesTask || !jobListingsTask) {
    throw new Error('Required OpenServ tasks not found in workspace.')
  }

  const opportunities = buildOpportunities(opportunitiesTask)
  const jobListings = buildJobListings(jobListingsTask)

  // 3. Upload structured results to OpenServ workspace as a JSON artifact
  //    This creates a persistent, shareable record of every job search run.
  const resultPayload: JobResult = JobResultSchema.parse({
    opportunities: { type: 'opportunities', content: opportunities.content, status: opportunities.status },
    jobListings: {
      type: 'job_listings',
      status: jobListings.status,
      topPaid: jobListings.topPaid,
      matchingSkills: jobListings.matchingSkills,
      worthInvestigating: jobListings.worthInvestigating,
    },
    triggeredAt: new Date().toISOString(),
  })

  // Upload fire-and-forget (don't block the response on it)
  uploadResultsFile(
    `job-results-${Date.now()}.json`,
    JSON.stringify(resultPayload, null, 2),
  ).catch((err) => console.warn('[uploadResultsFile] Failed:', err))

  return {
    opportunities,
    jobListings,
    trigger,
    agentResponse: agentResponse || undefined,
  }
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const data = await buildResponse()
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error fetching OpenServ data.'
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
    const message = error instanceof Error ? error.message : 'Unknown error fetching OpenServ data.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
