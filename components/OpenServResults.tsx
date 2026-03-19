import type { OpenServData, OpenServTaskStatus } from '@/app/data/openserv'
import { JobListingItem } from './JobListingItem'
import { JobCategoryCard } from './JobCategoryCard'

const statusMap: Record<string, { label: string; dotClass: string }> = {
  done: {
    label: 'Done',
    dotClass: 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.45)]',
  },
  running: {
    label: 'Running',
    dotClass: 'bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.45)]',
  },
  queued: {
    label: 'Queued',
    dotClass: 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.45)]',
  },
  failed: {
    label: 'Failed',
    dotClass: 'bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.45)]',
  },
}

function formatMarkdown(markdown: string) {
  return markdown
    .replace(/^###\s+/gm, '')
    .replace(/^####\s+/gm, '')
    .replace(/\*\*/g, '')
    .trim()
    .split('\n\n')
    .map((block) => block.trim())
    .filter(Boolean)
}

function getStatusConfig(status: OpenServTaskStatus) {
  return statusMap[status] ?? {
    label: status,
    dotClass: 'bg-slate-400 shadow-[0_0_12px_rgba(148,163,184,0.35)]',
  }
}

function StatusBadge({ status }: { status: OpenServTaskStatus }) {
  const config = getStatusConfig(status)

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
      <span className={`h-2 w-2 rounded-full ${config.dotClass}`} />
      <span>{config.label}</span>
    </div>
  )
}



type OpenServResultsProps = {
  data?: OpenServData | null
  loading?: boolean
  error?: string | null
}

export function OpenServResults({ data, loading = false, error = null }: OpenServResultsProps) {
  if (loading) {
    return (
      <section className="grid gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="h-3 w-36 animate-pulse rounded-full bg-white/10" />
          <div className="mt-4 h-8 w-72 animate-pulse rounded-full bg-white/10" />
          <div className="mt-6 space-y-3">
            <div className="h-4 animate-pulse rounded-full bg-white/10" />
            <div className="h-4 animate-pulse rounded-full bg-white/10" />
            <div className="h-4 w-5/6 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((card) => (
            <div key={card} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
              <div className="mt-5 space-y-3">
                <div className="h-4 animate-pulse rounded-full bg-white/10" />
                <div className="h-4 w-11/12 animate-pulse rounded-full bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-rose-400/20 bg-rose-500/5 p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-300/80">
          OpenServ sync error
        </p>
        <p className="mt-3 text-sm leading-6 text-rose-100/90">{error}</p>
      </section>
    )
  }

  if (!data) {
    return null
  }

  const marketBlocks = formatMarkdown(data.opportunities.content)

  return (
    <section className="grid gap-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-400">
              Market intelligence
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tighter text-slate-100">
              Task Finder Analysis
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <StatusBadge status={data.opportunities.status} />
            <div className="hidden items-center gap-2 md:flex">
              <span className="text-xs text-slate-400">by</span>
              <div className="h-6 w-auto text-slate-300">
                <svg
                  viewBox="0 0 200 50"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-full w-auto"
                  fill="none"
                >
                  <circle cx="15" cy="25" r="10" stroke="currentColor" strokeWidth="1.5" />
                  <path
                    d="M15 15 L18 18 M15 15 L12 18"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M25 25 L22 22 M25 25 L22 28"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15 35 L12 32 M15 35 L18 32"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 25 L8 28 M5 25 L8 22"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line x1="35" y1="15" x2="35" y2="35" stroke="currentColor" strokeWidth="1.5" />
                  <text
                    x="45"
                    y="30"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="14"
                    fontWeight="600"
                    fill="currentColor"
                    letterSpacing="-0.5"
                  >
                    OpenServ
                  </text>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {marketBlocks.map((block) => (
            <p key={block} className="text-sm leading-7 text-slate-300">
              {block}
            </p>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-400">
              Job listings
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tighter text-slate-100">
              OpenServ live opportunities
            </h2>
          </div>
          <StatusBadge status={data.jobListings.status} />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <JobCategoryCard
            emoji="⭐️"
            title="Top Paid"
            items={data.jobListings.topPaid}
            className="text-blue-400/70"
          />

          <JobCategoryCard
            emoji="🟩"
            title="Matching Skills"
            items={data.jobListings.matchingSkills}
            className="text-emerald-400/60"
          />

          <JobCategoryCard
            emoji="🟧"
            title="Worth Investigating"
            items={data.jobListings.worthInvestigating}
            className="text-slate-300"
          />
        </div>
      </div>
    </section>
  )
}
