import type { OpenServData, OpenServTaskStatus } from '@/app/data/openserv'

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

function ResultList({ items, itemClassName }: { items: string[]; itemClassName: string }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className={`text-sm leading-6 ${itemClassName}`}>
          {item}
        </li>
      ))}
    </ul>
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
              OpenServ market scan
            </h2>
          </div>
          <StatusBadge status={data.opportunities.status} />
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
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-400">
              ⭐️ Top Paid
            </p>
            <div className="mt-4">
              <ResultList items={data.jobListings.topPaid} itemClassName="text-blue-400/70" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-400">
              🟩 Matching Skills
            </p>
            <div className="mt-4">
              <ResultList items={data.jobListings.matchingSkills} itemClassName="text-emerald-400/60" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-400">
              🟧 Worth Investigating
            </p>
            <div className="mt-4">
              <ResultList items={data.jobListings.worthInvestigating} itemClassName="text-slate-300" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
