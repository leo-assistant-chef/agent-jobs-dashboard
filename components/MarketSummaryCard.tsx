import type { MarketAnalysis } from '@/app/data/openserv'

const suitabilityConfig = {
  high: {
    label: '🤖🙌🏻 High Agent Fit',
    classes: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
    bar: 'bg-emerald-400',
    barWidth: 'w-full',
  },
  medium: {
    label: '🤖👋🏻 Medium Agent Fit',
    classes: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
    bar: 'bg-amber-400',
    barWidth: 'w-2/3',
  },
  low: {
    label: '🤖👎🏻 Low Agent Fit',
    classes: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
    bar: 'bg-rose-400',
    barWidth: 'w-1/3',
  },
}

function parseListItem(item: string) {
  // Format: "Title | Pay | URL"
  const parts = item.split(' | ')
  return {
    title: parts[0]?.trim() ?? item,
    pay: parts[1]?.trim() ?? '',
    url: parts[2]?.trim() ?? '',
  }
}

function MarketSection({
  emoji,
  title,
  items,
  accentClass,
}: {
  emoji: string
  title: string
  items: string[]
  accentClass: string
}) {
  if (!items.length) return null

  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
        <span>{emoji}</span>
        <span>{title}</span>
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => {
          const { title: jobTitle, pay, url } = parseListItem(item)
          return (
            <li key={i} className="flex items-center justify-between gap-3">
              <span className="min-w-0 flex-1">
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-sm text-slate-600 dark:text-slate-300 hover:text-white hover:underline"
                  >
                    {jobTitle}
                  </a>
                ) : (
                  <span className="truncate text-sm text-slate-600 dark:text-slate-300">{jobTitle}</span>
                )}
              </span>
              {pay && (
                <span className={`shrink-0 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-2 py-0.5 text-[10px] font-semibold ${accentClass}`}>
                  {pay}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

interface MarketSummaryCardProps {
  analysis: MarketAnalysis
  jobCount: number
}

export function MarketSummaryCard({ analysis, jobCount }: MarketSummaryCardProps) {
  const suitability = analysis.aiAgentSuitability
    ? suitabilityConfig[analysis.aiAgentSuitability]
    : null

  const hasSections =
    analysis.topPaid.length > 0 ||
    analysis.matchingSkills.length > 0 ||
    analysis.worthInvestigating.length > 0

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03]">
      {/* Gradient header */}
      <div className="relative bg-gradient-to-br from-white/[0.06] to-transparent px-6 pb-5 pt-6">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              OpenServ Intelligence
            </p>
            <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Market Analysis
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {jobCount} opportunit{jobCount === 1 ? 'y' : 'ies'} analysed
            </p>
          </div>

          {/* AI Agent Suitability badge */}
          {suitability ? (
            <div className={`flex flex-col items-end gap-2`}>
              <span className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${suitability.classes}`}>
                {suitability.label}
              </span>
              <div className="flex w-32 items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                  <div className={`h-full rounded-full ${suitability.bar} ${suitability.barWidth} transition-all duration-700`} />
                </div>
              </div>
            </div>
          ) : (
            <span className="rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-1.5 text-sm text-slate-500">
              🤖 Suitability: Analyzing...
            </span>
          )}
        </div>
      </div>

      {/* Sections */}
      {hasSections && (
        <div className="grid gap-6 px-6 pb-6 pt-2 md:grid-cols-3">
          <MarketSection
            emoji="⭐️"
            title="Top Paid"
            items={analysis.topPaid}
            accentClass="text-amber-300"
          />
          <MarketSection
            emoji="🟩"
            title="Matching Skills"
            items={analysis.matchingSkills}
            accentClass="text-emerald-300"
          />
          <MarketSection
            emoji="🟧"
            title="Worth Investigating"
            items={analysis.worthInvestigating}
            accentClass="text-amber-200"
          />
        </div>
      )}

      {analysis.summary && (
        <div className="border-t border-white/8 px-6 py-4">
          <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">{analysis.summary}</p>
        </div>
      )}
    </div>
  )
}
