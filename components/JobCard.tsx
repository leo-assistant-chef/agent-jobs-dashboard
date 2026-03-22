'use client'

import { ArrowUpRight } from 'lucide-react'
import type { JobListing } from '@/app/data/openserv'

const platformColors: Record<string, string> = {
  Gitcoin: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  Upwork: 'border-blue-400/30 bg-blue-400/10 text-blue-300',
  'Code4rena': 'border-rose-400/30 bg-rose-400/10 text-rose-300',
  Immunefi: 'border-violet-400/30 bg-violet-400/10 text-violet-300',
  Fiverr: 'border-green-400/30 bg-green-400/10 text-green-300',
  TopTal: 'border-orange-400/30 bg-orange-400/10 text-orange-300',
  GitHub: 'border-slate-400/30 bg-slate-400/10 text-slate-300',
  OpenServ: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300',
  Freelancer: 'border-indigo-400/30 bg-indigo-400/10 text-indigo-300',
  Devfolio: 'border-purple-400/30 bg-purple-400/10 text-purple-300',
}

function getPlatformClass(source: string) {
  return platformColors[source] ?? 'border-white/10 bg-white/5 text-slate-300'
}

function getScoreRing(score: number) {
  if (score >= 75) return { ring: 'border-emerald-400', text: 'text-emerald-400', glow: 'shadow-[0_0_12px_rgba(52,211,153,0.4)]' }
  if (score >= 50) return { ring: 'border-amber-400', text: 'text-amber-400', glow: 'shadow-[0_0_12px_rgba(251,191,36,0.4)]' }
  return { ring: 'border-rose-400', text: 'text-rose-400', glow: 'shadow-[0_0_12px_rgba(251,113,133,0.4)]' }
}

const categoryLabels: Record<string, string> = {
  'smart-contract-audit': 'Smart Contract Audit',
  'smart-contract-development': 'Smart Contract Dev',
  'frontend': 'Frontend',
  'backend': 'Backend',
  'full-stack': 'Full Stack',
  'devrel': 'DevRel',
  'research': 'Research',
  'other': 'Other',
}

const employmentColors: Record<string, string> = {
  bounty: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
  freelance: 'border-blue-400/20 bg-blue-400/10 text-blue-300',
  contract: 'border-purple-400/20 bg-purple-400/10 text-purple-300',
  'part-time': 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300',
  'full-time': 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  grant: 'border-rose-400/20 bg-rose-400/10 text-rose-300',
}

const agentLevelColors: Record<string, string> = {
  'freshly-deployed': 'text-slate-400',
  'active': 'text-blue-400',
  'verified': 'text-emerald-400',
  'specialized': 'text-violet-400',
  'trusted': 'text-amber-400',
}

export function JobCard({ job }: { job: JobListing }) {
  const scoreStyle = getScoreRing(job.match_score)
  const visibleSkills = job.skills_required.slice(0, 4)
  const extraSkills = job.skills_required.length - 4

  const isNegotiable = !job.compensation_amount || job.compensation_amount === 0
  const compensationClass = isNegotiable ? 'text-slate-400' : 'text-emerald-400'

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] p-6 transition-all duration-150 ease-in-out hover:scale-[1.02] hover:border-white/20 hover:shadow-lg hover:shadow-black/30">
      {/* Top shimmer line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${getPlatformClass(job.source)}`}>
            {job.source}
          </span>
          <h3 className="mt-2 truncate text-base font-semibold tracking-tight text-slate-100">
            {job.title}
          </h3>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-widest text-slate-500">
            {categoryLabels[job.category] ?? job.category}
          </p>
        </div>

        {/* Match score ring */}
        <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border-2 ${scoreStyle.ring} ${scoreStyle.glow}`}>
          <span className={`text-base font-bold leading-none ${scoreStyle.text}`}>{job.match_score}</span>
          <span className="text-[8px] font-medium uppercase tracking-wider text-slate-500">match</span>
        </div>
      </div>

      {/* Description */}
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">
        {job.description}
      </p>

      {/* Skills */}
      {job.skills_required.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {visibleSkills.map((skill) => (
            <span key={skill} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
              {skill}
            </span>
          ))}
          {extraSkills > 0 && (
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
              +{extraSkills} more
            </span>
          )}
        </div>
      )}

      {/* Meta row */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {job.employment_type && (
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${employmentColors[job.employment_type] ?? 'border-white/10 bg-white/5 text-slate-400'}`}>
            {job.employment_type}
          </span>
        )}
        <span className="text-xs text-slate-500">
          {job.remote !== false ? '🌍 Remote' : '🏢 On-site'}
        </span>
      </div>

      {/* Experience levels */}
      {(job.experience_level_human || job.experience_level_ai_agents) && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {job.experience_level_human && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <span>👤</span>
              <span>{job.experience_level_human}</span>
            </span>
          )}
          {job.experience_level_ai_agents && (
            <span className={`flex items-center gap-1 text-xs font-medium ${agentLevelColors[job.experience_level_ai_agents] ?? 'text-slate-400'}`}>
              <span>🤖</span>
              <span>{job.experience_level_ai_agents}</span>
            </span>
          )}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Divider */}
      <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-white/8 to-transparent" />

      {/* Footer */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Compensation</p>
          <p className={`mt-0.5 text-lg font-bold tracking-tight ${compensationClass}`}>
            {job.compensation}
          </p>
        </div>
        <a
          href={job.job_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition-all duration-150 hover:border-white/30 hover:bg-white/10"
        >
          Apply
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </article>
  )
}
