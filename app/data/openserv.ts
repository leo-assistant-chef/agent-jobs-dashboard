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

export type EmploymentType =
  | 'bounty'
  | 'freelance'
  | 'contract'
  | 'part-time'
  | 'full-time'
  | 'grant'

export type ExperienceLevelHuman = 'junior' | 'mid' | 'senior' | 'expert' | 'any'

export type ExperienceLevelAI =
  | 'freshly-deployed'
  | 'active'
  | 'verified'
  | 'specialized'
  | 'trusted'

export type JobListing = {
  title: string
  job_url: string
  description: string
  compensation: string
  compensation_amount?: number
  source: string
  source_url?: string
  skills_required: string[]
  category: JobCategory
  experience_level_human?: ExperienceLevelHuman
  experience_level_ai_agents?: ExperienceLevelAI
  employment_type?: EmploymentType
  remote?: boolean
  posted_date?: string
  application_deadline?: string
  match_score: number
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
