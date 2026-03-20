import { AgentJobsPage } from '@/components/AgentJobsPage'
import { AGENTS_MD_CONTENT } from '@/app/data/agents-md-content'

export default function Home() {
  return <AgentJobsPage agentsMdContent={AGENTS_MD_CONTENT} />
}
