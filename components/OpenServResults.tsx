'use client'

import { useState, useMemo } from 'react'
import type { OpenServData, OpenServTaskStatus, JobListing } from '@/app/data/openserv'
import { JobCard } from './JobCard'
import { MarketSummaryCard } from './MarketSummaryCard'

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

function getStatusConfig(status: OpenServTaskStatus) {
  return (
    statusMap[status] ?? {
      label: status,
      dotClass: 'bg-slate-400 shadow-[0_0_12px_rgba(148,163,184,0.35)]',
    }
  )
}

function StatusBadge({ status }: { status: OpenServTaskStatus }) {
  const config = getStatusConfig(status)
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200">
      <span className={`h-2 w-2 rounded-full ${config.dotClass}`} />
      <span>{config.label}</span>
    </div>
  )
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

type SortKey = 'match_score' | 'compensation_amount' | 'posted_date'
type FilterType = 'all' | string

const FILTER_LABELS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'bounty', label: 'Bounties' },
  { key: 'freelance', label: 'Freelance' },
  { key: 'contract', label: 'Contract' },
  { key: 'full-time', label: 'Full-time' },
  { key: 'grant', label: 'Grants' },
]

type OpenServResultsProps = {
  data?: OpenServData | null
  loading?: boolean
  error?: string | null
}

export function OpenServResults({
  data,
  loading = false,
  error = null,
}: OpenServResultsProps) {
  const [sortKey, setSortKey] = useState<SortKey>('match_score')
  const [filter, setFilter] = useState<FilterType>('all')
  const [rawExpanded, setRawExpanded] = useState(false)

  const jobs: JobListing[] = (data?.jobListings as any)?.jobs ?? []

  const filteredJobs = useMemo(() => {
    let result = [...jobs]
    if (filter !== 'all') {
      result = result.filter((j) => (j.employment_type ?? '') === filter)
    }
    result.sort((a, b) => {
      if (sortKey === 'match_score') return (b.match_score ?? 0) - (a.match_score ?? 0)
      if (sortKey === 'compensation_amount')
        return (b.compensation_amount ?? 0) - (a.compensation_amount ?? 0)
      if (sortKey === 'posted_date')
        return (b.posted_date ?? '').localeCompare(a.posted_date ?? '')
      return 0
    })
    return result
  }, [jobs, sortKey, filter])

  if (loading) {
    return (
      <section className="grid gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 p-6">
          <div className="h-3 w-36 animate-pulse rounded-full bg-slate-100 dark:bg-white/10" />
          <div className="mt-4 h-8 w-72 animate-pulse rounded-full bg-slate-100 dark:bg-white/10" />
          <div className="mt-6 space-y-3">
            <div className="h-4 animate-pulse rounded-full bg-slate-100 dark:bg-white/10" />
            <div className="h-4 animate-pulse rounded-full bg-slate-100 dark:bg-white/10" />
            <div className="h-4 w-5/6 animate-pulse rounded-full bg-slate-100 dark:bg-white/10" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 p-6">
              <div className="h-3 w-24 animate-pulse rounded-full bg-slate-100 dark:bg-white/10" />
              <div className="mt-5 space-y-3">
                <div className="h-4 animate-pulse rounded-full bg-slate-100 dark:bg-white/10" />
                <div className="h-4 w-11/12 animate-pulse rounded-full bg-slate-100 dark:bg-white/10" />
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

  if (!data) return null

  const marketAnalysis = (data.jobListings as any)?.marketAnalysis ?? {
    topPaid: [],
    matchingSkills: [],
    worthInvestigating: [],
  }
  const marketBlocks = formatMarkdown(data.opportunities.content)

  return (
    <section className="grid gap-8">
      {/* Market intelligence summary */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500 dark:text-slate-400">
              Market intelligence
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tighter text-slate-900 dark:text-slate-100">
              Job Finder Analysis
            </h2>
          </div>
          <StatusBadge status={data.opportunities.status} />
        </div>
        <div className="mt-6 space-y-4">
          {marketBlocks.map((block) => (
            <p key={block} className="text-sm leading-7 text-slate-600 dark:text-slate-300">
              {block}
            </p>
          ))}
        </div>
      </div>

      {/* Job listings */}
      <div>
        {/* Header + controls */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {jobs.length > 0
                ? `Found ${jobs.length} opportunit${jobs.length === 1 ? 'y' : 'ies'}`
                : 'Job Listings'}
            </h2>
            <StatusBadge status={data.jobListings.status} />
          </div>

          {/* Sort */}
          {jobs.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 dark:text-slate-500">Sort by:</span>
              {(['match_score', 'compensation_amount', 'posted_date'] as SortKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setSortKey(key)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 ${
                    sortKey === key
                      ? 'bg-slate-100 dark:bg-white/10 text-white'
                      : 'text-slate-500 dark:text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {key === 'match_score' ? 'Match' : key === 'compensation_amount' ? 'Compensation' : 'Date'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter chips */}
        {jobs.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {FILTER_LABELS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150 ${
                  filter === key
                    ? 'border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-white/10 text-white'
                    : 'border-slate-200 dark:border-white/10 bg-transparent text-slate-500 dark:text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:border-white/20 hover:text-slate-700 dark:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {filteredJobs.length > 0 ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredJobs.map((job, i) => (
              <JobCard key={`${job.title}-${job.source}-${i}`} job={job} />
            ))}
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/[0.02] py-16 text-center">
            <div className="text-4xl">🔍</div>
            <p className="mt-4 text-base font-semibold text-slate-600 dark:text-slate-300">No results yet</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">
              {jobs.length > 0
                ? 'No jobs match this filter — try a different category'
                : 'Trigger a search above to find opportunities'}
            </p>
          </div>
        )}
      </div>

      {/* Market summary card — show if we have jobs OR market analysis sections */}
      {(jobs.length > 0 || marketAnalysis.topPaid.length > 0 || marketAnalysis.matchingSkills.length > 0 || marketAnalysis.worthInvestigating.length > 0) && (
        <MarketSummaryCard analysis={marketAnalysis} jobCount={jobs.length} />
      )}

      {/* Raw output collapsible */}
      {data.jobListings.rawContent && (
        <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/[0.02]">
          <button
            onClick={() => setRawExpanded((p) => !p)}
            className="flex w-full items-center justify-between px-6 py-4 text-sm font-medium text-slate-500 dark:text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200"
          >
            <span>Raw Output</span>
            <span className="text-xs">{rawExpanded ? '▲ collapse' : '▼ expand'}</span>
          </button>
          {rawExpanded && (
            <pre className="overflow-x-auto border-t border-slate-200 dark:border-white/8 px-6 py-4 text-xs leading-6 text-slate-500 dark:text-slate-500 dark:text-slate-400">
              {data.jobListings.rawContent}
            </pre>
          )}
        </div>
      )}
    </section>
  )
}
