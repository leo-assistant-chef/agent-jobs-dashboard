'use client'

import { useMemo, useState } from 'react'

import { mockJobs, type Job, type JobStatus } from '@/app/data/mock-jobs'
import type { OpenServData } from '@/app/data/openserv'
import { EarningsWidget } from '@/components/EarningsWidget'
import { FindWorkButton } from '@/components/FindWorkButton'
import { JobCard } from '@/components/JobCard'
import { JobPipeline } from '@/components/JobPipeline'
import { OpenServConfig } from '@/components/OpenServConfig'
import { OpenServResults } from '@/components/OpenServResults'
import { StatusPill } from '@/components/StatusPill'

function extractTitleAndDescription(item: string) {
  const cleaned = item.replace(/\*\*/g, '').trim()
  const [title, ...rest] = cleaned.split(':')
  const description = rest.join(':').trim()

  return {
    title: title.trim(),
    description: description || cleaned,
  }
}

function mapOpenServJobs(data: OpenServData): Job[] {
  const categoryMap = [
    { items: data.jobListings.topPaid, skillMatch: 80 },
    { items: data.jobListings.matchingSkills, skillMatch: 95 },
    { items: data.jobListings.worthInvestigating, skillMatch: 70 },
  ]

  return categoryMap.flatMap(({ items, skillMatch }, categoryIndex) =>
    items.map((item, itemIndex) => {
      const { title, description } = extractTitleAndDescription(item)

      return {
        id: `openserv-${categoryIndex}-${itemIndex}`,
        title,
        description,
        source: 'OpenServ',
        skillMatch,
        reward: 0,
        status: 'found',
        postedAt: new Date().toISOString().slice(0, 10),
      } satisfies Job
    })
  )
}

function calculatePipelineCounts(jobs: Job[]) {
  return jobs.reduce<Record<JobStatus, number>>(
    (acc, job) => {
      acc[job.status] += 1
      return acc
    },
    {
      found: 0,
      applied: 0,
      in_progress: 0,
      awaiting_payment: 0,
      paid: 0,
    }
  )
}

function calculateAmounts(jobs: Job[]) {
  return {
    totalPaid: jobs
      .filter((job) => job.status === 'paid')
      .reduce((sum, job) => sum + job.reward, 0),
    pendingAmount: jobs
      .filter((job) => job.status === 'awaiting_payment')
      .reduce((sum, job) => sum + job.reward, 0),
    availableAmount: jobs
      .filter((job) => job.status === 'in_progress' || job.status === 'paid')
      .reduce((sum, job) => sum + job.reward, 0),
  }
}

export function AgentJobsPage() {
  const [isSearching, setIsSearching] = useState(false)
  const [openServResults, setOpenServResults] = useState<OpenServData | null>(null)
  const [openServError, setOpenServError] = useState<string | null>(null)

  const jobs = useMemo(
    () => (openServResults ? mapOpenServJobs(openServResults) : mockJobs),
    [openServResults]
  )
  const pipelineCounts = useMemo(() => calculatePipelineCounts(jobs), [jobs])
  const { totalPaid, pendingAmount, availableAmount } = useMemo(() => calculateAmounts(jobs), [jobs])

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-10 md:px-8 lg:px-10">
      <section className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-400">
            Agent work
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tighter text-slate-100">
            Agent Jobs
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
            Discover aligned work, track the execution pipeline, and keep OpenServ-connected payouts visible from one operator dashboard.
          </p>
        </div>

        <div className="flex flex-col items-start gap-4 lg:items-end">
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill label="OpenServ connected" connected />
            <StatusPill label="MCP workflow live" connected />
          </div>
          <FindWorkButton
            searching={isSearching}
            onSearchingChange={setIsSearching}
            onResults={setOpenServResults}
            onError={setOpenServError}
          />
        </div>
      </section>

      <JobPipeline counts={pipelineCounts} />

      {(isSearching || openServResults || openServError) ? (
        <OpenServResults
          data={openServResults}
          loading={isSearching}
          error={openServError}
        />
      ) : null}

      <section className="grid grid-cols-1 gap-8 md:grid-cols-12">
        <div className="space-y-5 md:col-span-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-400">
                Active opportunities
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tighter text-slate-100">
                {openServResults ? 'OpenServ live job feed' : 'Matching contracts and bounties'}
              </h2>
            </div>
            <p className="hidden text-sm text-slate-500 md:block">{jobs.length} jobs indexed</p>
          </div>

          <div className="space-y-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>

        <div className="md:col-span-4">
          <EarningsWidget
            totalPaid={totalPaid}
            pendingAmount={pendingAmount}
            availableAmount={availableAmount}
            totalJobs={jobs.length}
          />
        </div>
      </section>

      <OpenServConfig />
    </main>
  )
}
