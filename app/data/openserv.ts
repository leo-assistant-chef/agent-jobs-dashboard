export type OpenServTaskStatus = 'queued' | 'running' | 'done' | 'failed' | string

export type JobCategory =
  | 'smart-contract-audit'
  | 'smart-contract-development'
  | 'frontend'
  | 'backend'
  | 'full-stack'
  | 'devrel'
  | 'research'
  | 'other'
  | string

export type EmploymentType =
  | 'bounty'
  | 'freelance'
  | 'contract'
  | 'part-time'
  | 'full-time'
  | 'grant'
  | string

export type ExperienceLevelHuman = 'junior' | 'mid' | 'senior' | 'expert' | 'any' | string

export type ExperienceLevelAI =
  | 'freshly-deployed'
  | 'active'
  | 'verified'
  | 'specialized'
  | 'trusted'
  | string

// Matches the final OpenServ Agent 2 (Job Scraper) structured output schema exactly
export type JobListing = {
  // Required fields
  title: string
  job_url: string
  description: string
  source: string
  employment_type: EmploymentType
  remote: boolean
  match_score: number
  skills_required: string[]

  // Optional fields
  employer?: string
  source_url?: string
  category?: JobCategory
  location?: string
  compensation?: string
  compensation_amount?: number
  compensation_currency?: string
  posted_date?: string
  application_deadline?: string
  experience_level_human?: ExperienceLevelHuman | ExperienceLevelHuman[]
  experience_level_ai_agent?: ExperienceLevelAI
  employment_duration?: string
}

export type MarketAnalysis = {
  topPaid: string[]
  matchingSkills: string[]
  worthInvestigating: string[]
  summary?: string
  aiAgentSuitability?: 'low' | 'medium' | 'high'
}

export type OpenServOpportunity = {
  type: 'opportunities'
  content: string
  status: OpenServTaskStatus
}

export type OpenServJobListings = {
  type: 'job_listings'
  status: OpenServTaskStatus
  jobs: JobListing[]
  marketAnalysis: MarketAnalysis
  rawContent: string
}

export type OpenServTriggerMeta = {
  attempted: boolean
  accepted: boolean
  mode: 'rest-trigger' | 'tasks-fallback'
  target?: string
  message?: string
}

export type OpenServData = {
  opportunities: OpenServOpportunity
  jobListings: OpenServJobListings
  trigger?: OpenServTriggerMeta
  agentResponse?: string
}
