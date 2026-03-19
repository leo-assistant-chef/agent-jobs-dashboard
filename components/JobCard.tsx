import { ArrowUpRight } from 'lucide-react'

import type { Job, JobStatus } from '@/app/data/mock-jobs'

const sourceClasses: Record<Job['source'], string> = {
  GitHub: 'border-white/10 bg-white/5 text-slate-200',
  Devfolio: 'border-white/10 bg-white/5 text-slate-200',
  OpenServ: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  Gitcoin: 'border-white/10 bg-white/5 text-slate-200',
}

const statusLabel: Record<JobStatus, string> = {
  found: 'Found',
  applied: 'Applied',
  in_progress: 'In Progress',
  awaiting_payment: 'Awaiting Payment',
  paid: 'Paid',
}

const statusClasses: Record<JobStatus, string> = {
  found: 'border-white/10 bg-white/5 text-slate-300',
  applied: 'border-white/10 bg-white/5 text-slate-300',
  in_progress: 'border-white/20 bg-white/10 text-white',
  awaiting_payment: 'border-white/10 bg-white/5 text-slate-300',
  paid: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
}

const actionCopy: Record<JobStatus, string> = {
  found: 'See Job Brief',
  applied: 'Track reply',
  in_progress: 'Open workspace',
  awaiting_payment: 'Follow up',
  paid: 'View receipt',
}

export function JobCard({ job }: { job: Job }) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all duration-500 ease-out hover:border-white/15 hover:bg-white/[0.04]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-400">
            {job.postedAt}
          </p>
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-slate-100">
              {job.title}
            </h3>
            <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-6 text-slate-400">
              {job.description}
            </p>
          </div>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.16em] uppercase ${sourceClasses[job.source]}`}
        >
          {job.source}
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-400">
            Skill match
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-sm font-medium text-slate-100">{job.skillMatch}%</span>
            <div className="h-1 w-32 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-white/50"
                style={{ width: `${job.skillMatch}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-400">
              Reward
            </p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-blue-400/70">
              {job.reward.toLocaleString()} USDC
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClasses[job.status]}`}
          >
            {statusLabel[job.status]}
          </span>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/5"
        >
          {actionCopy[job.status]}
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  )
}
