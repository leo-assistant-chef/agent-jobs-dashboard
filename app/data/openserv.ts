export type OpenServTaskStatus = 'queued' | 'running' | 'done' | 'failed' | string

export type OpenServOpportunity = {
  type: 'opportunities'
  content: string
  status: OpenServTaskStatus
}

export type OpenServJobListings = {
  type: 'job_listings'
  status: OpenServTaskStatus
  topPaid: string[]
  matchingSkills: string[]
  worthInvestigating: string[]
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
