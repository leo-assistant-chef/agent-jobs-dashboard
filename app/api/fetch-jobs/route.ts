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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getMarkdownSection(markdown: string, heading: string, levels: number[] = [3]): string {
  const headingPattern = levels.map((level) => `#{${level}}`).join('|')
  const sectionRegex = new RegExp(
    `^(?:${headingPattern})\\s+${escapeRegExp(heading)}\\s*$([\\s\\S]*?)(?=^#{1,4}\\s+|$)`,
    'im'
  )
  const match = markdown.match(sectionRegex)
  return match?.[1]?.trim() ?? ''
}

function parseMarkdownSection(markdown: string, heading: string, levels: number[] = [3, 4]): string[] {
  const section = getMarkdownSection(markdown, heading, levels)
  if (!section) return []

  return section
    .split('\n')
    .map(line => line.trim())
    .filter(line => /^\d+\.|^[-*]/.test(line))
    .map(line => line.replace(/^\d+\.\s*|^[-*]\s*/, '').replace(/\*\*/g, '').trim())
    .filter(Boolean)
}

function extractMarkdownField(block: string, label: string): string | undefined {
  const regex = new RegExp(`[-*]\\s+\\*\\*${escapeRegExp(label)}\\*\\*:\\s*(.+)`, 'i')
  return block.match(regex)?.[1]?.trim()
}

function extractMarkdownLink(value: string | undefined): string | undefined {
  if (!value) return undefined
  const markdownLink = value.match(/\[[^\]]+\]\((https?:\/\/[^)]+)\)/i)
  if (markdownLink?.[1]) return markdownLink[1].trim()
  const rawUrl = value.match(/https?:\/\/\S+/i)
  return rawUrl?.[0]?.trim()
}

function parseJobsFromMarketAnalysisText(text: string): JobListing[] {
  if (!text.trim()) return []

  const sections = text.split(/^##\s+/m).slice(1)

  return sections.flatMap(section => {
    if (!section.includes('### Job Listing')) return []

    const jobListingBlock = getMarkdownSection(section, 'Job Listing', [3])
    if (!jobListingBlock) return []

    const title = extractMarkdownField(jobListingBlock, 'Title')
    const jobUrl = extractMarkdownLink(extractMarkdownField(jobListingBlock, 'Job URL'))

    if (!title || !jobUrl) return []

    const remoteValue = extractMarkdownField(jobListingBlock, 'Remote')
    const source = extractMarkdownField(jobListingBlock, 'Platform') ?? ''
    const description = extractMarkdownField(jobListingBlock, 'Description') ?? ''
    const skillsRequired = (extractMarkdownField(jobListingBlock, 'Skills Required') ?? '')
      .split(',')
      .map(skill => skill.trim())
      .filter(Boolean)

    const experienceLevel = extractMarkdownField(jobListingBlock, 'Experience Level')
    const aiAgentMatch = experienceLevel?.match(/AI Agent:\s*([^\)\n]+)/i)
    const compensation = parseMarkdownSection(section, 'Top Paid', [4])
      .map(line => {
        const parts = line.split('|').map(part => part.trim())
        const lineUrl = extractMarkdownLink(line)
        return lineUrl === jobUrl || parts[0] === title ? parts[1] : undefined
      })
      .find(Boolean) ?? 'Negotiable'

    return [{
      title,
      job_url: jobUrl,
      description,
      source,
      employment_type: 'freelance',
      remote: /^yes$/i.test(remoteValue ?? ''),
      match_score: 75,
      skills_required: skillsRequired,
      compensation,
      experience_level_ai_agent: aiAgentMatch?.[1]?.trim().toLowerCase(),
    } satisfies JobListing]
  })
}

function mergeJobListings(primaryJobs: JobListing[], fallbackJobs: JobListing[]): JobListing[] {
  const merged = new Map<string, JobListing>()

  for (const job of fallbackJobs) {
    const key = job.job_url || `${job.title}:${job.source}`
    merged.set(key, job)
  }

  for (const job of primaryJobs) {
    const key = job.job_url || `${job.title}:${job.source}`
    const existing = merged.get(key)
    merged.set(key, {
      ...existing,
      ...job,
      skills_required: job.skills_required?.length
        ? job.skills_required
        : (existing?.skills_required ?? []),
    })
  }

  return Array.from(merged.values())
}

function parseMarketAnalysis(rawContent: string, jobs: JobListing[]): MarketAnalysis {
  const parsedTopPaid = parseMarkdownSection(rawContent, 'Top Paid', [4])
  const parsedMatchingSkills = parseMarkdownSection(rawContent, 'Matching Skills', [4])
  const parsedWorthInvestigating = parseMarkdownSection(rawContent, 'Worth Investigating', [4])

  const derivedTopPaid = jobs
    .filter(j => j.match_score >= 75)
    .sort((a, b) => (b.compensation_amount ?? 0) - (a.compensation_amount ?? 0))
    .slice(0, 5)
    .map(j => `${j.title} | ${j.compensation ?? 'Negotiable'} | ${j.job_url}`)

  const derivedMatchingSkills = jobs
    .filter(j => j.match_score >= 60 && j.match_score < 75)
    .slice(0, 5)
    .map(j => `${j.title} | ${j.compensation ?? 'Negotiable'} | ${j.job_url}`)

  const derivedWorthInvestigating = jobs
    .filter(j => j.match_score < 60)
    .slice(0, 5)
    .map(j => `${j.title} | ${j.compensation ?? 'Negotiable'} | ${j.job_url}`)

  return {
    topPaid: parsedTopPaid.length > 0 ? parsedTopPaid : derivedTopPaid,
    matchingSkills: parsedMatchingSkills.length > 0 ? parsedMatchingSkills : derivedMatchingSkills,
    worthInvestigating: parsedWorthInvestigating.length > 0 ? parsedWorthInvestigating : derivedWorthInvestigating,
    aiAgentSuitability: parseAiSuitability(rawContent),
  }
}

function formatSearchBriefAsMarkdown(structured: unknown): string {
  if (typeof structured !== 'object' || !structured) return ''
  const obj = structured as Record<string, unknown>

  const profile = obj.skill_profile as Record<string, unknown> | undefined
  const primarySkills = (profile?.primary_skills as string[]) ?? []
  const secondarySkills = (profile?.secondary_skills as string[]) ?? []
  const experienceLevel = (profile?.experience_level as string) ?? ''
  const searchQueries = (obj.search_queries as string[]) ?? []

  const lines: string[] = []

  if (primarySkills.length > 0) {
    lines.push(`**Skills profile:** ${primarySkills.join(', ')}`)
  }
  if (secondarySkills.length > 0) {
    lines.push(`**Supporting skills:** ${secondarySkills.join(', ')}`)
  }
  if (experienceLevel) {
    lines.push(`**Experience level:** ${experienceLevel}`)
  }
  if (searchQueries.length > 0) {
    lines.push(`\n**Search queries used:**`)
    searchQueries.forEach((q) => lines.push(`• ${q}`))
  }

  return lines.join('\n')
}

function buildOpportunities(task: OpenServTask): OpenServOpportunity {
  const structured = extractStructuredValue(task)

  // Task 58494 now outputs structured search_brief JSON — format it nicely
  if (structured && typeof structured === 'object' && !Array.isArray(structured)) {
    const obj = structured as Record<string, unknown>
    if (obj.search_queries || obj.skill_profile) {
      return {
        type: 'opportunities',
        content: formatSearchBriefAsMarkdown(structured),
        status: task.status ?? 'unknown',
      }
    }
  }

  // Fallback: text output
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
  // Map final OpenServ Agent 2 schema fields to JobListing type
  // Field names match Jean's confirmed schema exactly
  return {
    // Required
    title: (raw.title as string) ?? '',
    job_url: (raw.job_url as string) ?? '',
    description: (raw.description as string) ?? '',
    source: (raw.source as string) ?? '',
    employment_type: (raw.employment_type as string) ?? 'freelance',
    remote: typeof raw.remote === 'boolean' ? raw.remote : true,
    match_score: typeof raw.match_score === 'number' ? raw.match_score : 0,
    skills_required: Array.isArray(raw.skills_required)
      ? (raw.skills_required as string[])
      : typeof raw.skills_required === 'string'
        ? (raw.skills_required as string).split(',').map((s: string) => s.trim()).filter(Boolean)
        : [],
    // Optional
    employer: raw.employer as string | undefined,
    source_url: raw.source_url as string | undefined,
    category: raw.category as string | undefined,
    location: raw.location as string | undefined,
    compensation: raw.compensation as string | undefined,
    compensation_amount: typeof raw.compensation_amount === 'number' ? raw.compensation_amount : undefined,
    compensation_currency: raw.compensation_currency as string | undefined,
    posted_date: raw.posted_date as string | undefined,
    application_deadline: raw.application_deadline as string | undefined,
    experience_level_human: raw.experience_level_human as string | string[] | undefined,
    experience_level_ai_agent: raw.experience_level_ai_agent as string | undefined,
    employment_duration: raw.employment_duration as string | undefined,
  } as JobListing
}

function buildJobListings(task: OpenServTask, marketAnalysisText?: string): OpenServJobListings {
  const rawContent = extractOutput(task)
  // Use dedicated market analysis text for section parsing (task 61236),
  // fall back to task's own raw content
  const analysisText = marketAnalysisText || rawContent
  const structured = extractStructuredValue(task)

  let structuredJobs: JobListing[] = []

  if (structured !== null) {
    // Single job object (OpenServ structured output returns one item)
    if (Array.isArray(structured)) {
      structuredJobs = structured.map((j) => normalizeJob(j as Record<string, unknown>))
    } else if (typeof structured === 'object' && structured !== null) {
      const obj = structured as Record<string, unknown>
      // Handle { jobs: [...] } or { web3_job_listings: [...] } wrappers
      const arr = obj.web3_job_listings ?? obj.jobs
      if (Array.isArray(arr)) {
        structuredJobs = arr.map((j) => normalizeJob(j as Record<string, unknown>))
      } else if (obj.title) {
        // Single job dict — wrap in array
        structuredJobs = [normalizeJob(obj)]
      }
    }
  }

  const textParsedJobs = parseJobsFromMarketAnalysisText(analysisText)
  const jobs = mergeJobListings(structuredJobs, textParsedJobs)

  if (structuredJobs.length === 0 && textParsedJobs.length === 0) {
    console.warn('[buildJobListings] No structured or text-parsed jobs found')
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
