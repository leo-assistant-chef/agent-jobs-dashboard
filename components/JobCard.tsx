'use client'

import type { JobListing, EmploymentType, ExperienceLevelAI } from '@/app/data/openserv'

// ── Employment type config ────────────────────────────────────────────────────
const EMPLOYMENT_COLORS: Record<string, string> = {
  bounty:    'border-amber-400/30 bg-amber-400/10 text-amber-300',
  freelance: 'border-blue-400/30 bg-blue-400/10 text-blue-300',
  contract:  'border-violet-400/30 bg-violet-400/10 text-violet-300',
  grant:     'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  'full-time': 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  'part-time': 'border-slate-400/30 bg-slate-400/10 text-slate-300',
}

// ── Source platform colors ────────────────────────────────────────────────────
const SOURCE_COLORS: Record<string, string> = {
  upwork:    'bg-green-500/15 text-green-300',
  gitcoin:   'bg-teal-500/15 text-teal-300',
  immunefi:  'bg-blue-500/15 text-blue-300',
  code4rena: 'bg-purple-500/15 text-purple-300',
  fiverr:    'bg-emerald-500/15 text-emerald-300',
  freelancer:'bg-orange-500/15 text-orange-300',
  toptal:    'bg-red-500/15 text-red-300',
  devfolio:  'bg-indigo-500/15 text-indigo-300',
  github:    'bg-slate-500/15 text-slate-300',
}

// ── AI experience level config ────────────────────────────────────────────────
const AI_LEVEL_CONFIG: Record<string, { label: string; color: string; ring: string }> = {
  'freshly-deployed': { label: 'Freshly Deployed', color: 'text-slate-400', ring: 'border-slate-400/40' },
  active:             { label: 'Active',            color: 'text-blue-400',  ring: 'border-blue-400/40'  },
  verified:           { label: 'Verified',          color: 'text-teal-400',  ring: 'border-teal-400/40'  },
  specialized:        { label: 'Specialized',       color: 'text-violet-400',ring: 'border-violet-400/40'},
  trusted:            { label: 'Trusted',           color: 'text-amber-400', ring: 'border-amber-400/40' },
}

// ── Match score ring color ────────────────────────────────────────────────────
function matchRingClass(score: number) {
  if (score >= 80) return 'text-emerald-400 border-emerald-400/60'
  if (score >= 60) return 'text-amber-400 border-amber-400/60'
  return 'text-rose-400 border-rose-400/60'
}

function sourceKey(source: string) {
  return source.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function getSourceColor(source: string) {
  const key = sourceKey(source)
  for (const [k, v] of Object.entries(SOURCE_COLORS)) {
    if (key.includes(k)) return v
  }
  return 'bg-slate-500/15 text-slate-300'
}

function getEmploymentColor(type: string) {
  return EMPLOYMENT_COLORS[type] ?? 'border-slate-400/30 bg-slate-400/10 text-slate-300'
}

// ── Compensation display ───────────────────────────────────────────────────────
function formatCompensation(job: JobListing): string {
  if (job.compensation && job.compensation !== 'Not Mentioned' && job.compensation !== 'Negotiable') {
    return job.compensation
  }
  if (job.compensation_amount && job.compensation_amount > 0) {
    const currency = job.compensation_currency ?? 'USD'
    return `$${job.compensation_amount.toLocaleString()} ${currency}`
  }
  if (job.compensation === 'Negotiable') return 'Negotiable'
  return 'TBD'
}

// ── Skills chips ──────────────────────────────────────────────────────────────
function SkillsChips({ skills }: { skills: string[] }) {
  const MAX = 4
  const visible = skills.slice(0, MAX)
  const overflow = skills.length - MAX
  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((s) => (
        <span
          key={s}
          className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300"
        >
          {s}
        </span>
      ))}
      {overflow > 0 && (
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-500">
          +{overflow}
        </span>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export function JobCard({ job }: { job: JobListing }) {
  const ringClass = matchRingClass(job.match_score)
  const aiLevel = job.experience_level_ai_agent
    ? AI_LEVEL_CONFIG[job.experience_level_ai_agent] ?? {
        label: job.experience_level_ai_agent,
        color: 'text-slate-400',
        ring: 'border-slate-400/40',
      }
    : null

  const employmentColor = getEmploymentColor(job.employment_type ?? '')
  const sourceColor = getSourceColor(job.source)

  const location = job.location ?? (job.remote ? 'Remote' : null)
  const employer = job.employer

  return (
    <div className="group relative flex flex-col gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-5 transition-all duration-200 hover:border-white/15 hover:bg-white/[0.05]">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Source + employment type badges */}
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${sourceColor}`}>
              {job.source}
            </span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${employmentColor}`}>
              {job.employment_type ?? 'freelance'}
            </span>
            {job.remote && (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
                Remote
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold leading-snug text-slate-100 line-clamp-2">
            {job.title}
          </h3>

          {/* Employer + location */}
          {(employer || location) && (
            <p className="mt-1 text-xs text-slate-500">
              {[employer, location].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        {/* Match score ring */}
        <div
          className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full border-2 ${ringClass}`}
        >
          <span className="text-sm font-bold leading-none">{job.match_score}</span>
          <span className="text-[8px] leading-none opacity-70">match</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs leading-5 text-slate-400 line-clamp-2">{job.description}</p>

      {/* Skills */}
      {job.skills_required?.length > 0 && (
        <SkillsChips skills={job.skills_required} />
      )}

      {/* Footer row */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/6">
        <div className="flex items-center gap-3">
          {/* Compensation */}
          <span className="text-sm font-semibold text-emerald-400">
            {formatCompensation(job)}
          </span>

          {/* AI experience level */}
          {aiLevel && (
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${aiLevel.ring} ${aiLevel.color}`}>
              🤖 {aiLevel.label}
            </span>
          )}
        </div>

        {/* Apply button */}
        <a
          href={job.job_url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-white/8 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-all duration-150 hover:bg-white/15 hover:text-white"
        >
          Apply →
        </a>
      </div>

      {/* Posted date */}
      {job.posted_date && (
        <p className="text-[10px] text-slate-600">
          Posted {job.posted_date}
          {job.application_deadline ? ` · Deadline ${job.application_deadline}` : ''}
        </p>
      )}
    </div>
  )
}
