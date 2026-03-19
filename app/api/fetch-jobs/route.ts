import { NextResponse } from 'next/server'

import type { OpenServData, OpenServJobListings, OpenServOpportunity } from '@/app/data/openserv'

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

function extractOutput(task: OpenServTask) {
  return task.latest_task_execution_record?.output?.value?.trim() ?? ''
}

function parseSection(markdown: string, heading: string) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const sectionRegex = new RegExp(`${escapedHeading}\\s*([\\s\\S]*?)(?=\\n(?:⭐️ Top Paid|🟩 Matching Skills|🟧 Worth Investigating)|$)`, 'i')
  const match = markdown.match(sectionRegex)

  if (!match?.[1]) {
    return []
  }

  return match[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.replace(/^-\s*/, '').trim())
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

export async function GET() {
  const apiKey = process.env.OPENSERV_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENSERV_API_KEY is not configured.' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(
      `${OPEN_SERV_BASE_URL}/workspaces/${OPEN_SERV_WORKSPACE_ID}/tasks?apiKey=${apiKey}`,
      {
        method: 'GET',
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: `OpenServ request failed with status ${response.status}.` },
        { status: response.status }
      )
    }

    const tasks = (await response.json()) as OpenServTask[]
    const opportunitiesTask = tasks.find((task) => task.id === OPPORTUNITIES_TASK_ID)
    const jobListingsTask = tasks.find((task) => task.id === JOB_LISTINGS_TASK_ID)

    if (!opportunitiesTask || !jobListingsTask) {
      return NextResponse.json(
        {
          error: 'Required OpenServ tasks were not found.',
          foundTaskIds: tasks.map((task) => task.id),
        },
        { status: 404 }
      )
    }

    const data: OpenServData = {
      opportunities: buildOpportunities(opportunitiesTask),
      jobListings: buildJobListings(jobListingsTask),
    }

    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown OpenServ fetch error.'

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
