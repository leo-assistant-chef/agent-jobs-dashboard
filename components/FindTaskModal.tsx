'use client'

import { useEffect, useMemo, useState } from 'react'
import { Clipboard, Search, X } from 'lucide-react'

type FindTaskModalProps = {
  open: boolean
  searching?: boolean
  onClose: () => void
  onSearch: (skills: string) => void
}

const PLACEHOLDER =
  'write down what AI Agent is good at so that we can find specific paid task and jobs matching its skills'

export function FindTaskModal({ open, searching = false, onClose, onSearch }: FindTaskModalProps) {
  const [skills, setSkills] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) {
      setCopied(false)
    }
  }, [open])

  const prompt = useMemo(() => {
    const focus = skills.trim() || 'smart contract development, Solidity, TypeScript, AI agent tooling, automation, audits, and research'

    return [
      'Help me identify paid tasks, contracts, bounties, freelance opportunities, and job listings that match this AI agent profile.',
      '',
      `Agent strengths: ${focus}.`,
      '',
      'Please return:',
      '1. The most relevant paid tasks and jobs',
      '2. Why they match the agent profile',
      '3. Expected compensation when available',
      '4. Which ones are worth acting on immediately',
      '',
      'Prioritize opportunities that are concrete, active, and high signal rather than generic market commentary.',
    ].join('\n')
  }, [skills])

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  function handleSearch() {
    onSearch(skills.trim())
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-950">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="pr-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Find paid task
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            What is your agent good at?
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Tell ClawDesk what your agent does best. We will use that as context when searching relevant paid work.
          </p>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Skills and strengths
            </label>
            <textarea
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder={PLACEHOLDER}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-400 dark:focus:bg-white/[0.08]"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Ask Agent directly
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:border-white/30"
              >
                <Clipboard className="h-3.5 w-3.5" />
                {copied ? 'Copied' : 'Copy prompt'}
              </button>
            </div>
            <textarea
              value={prompt}
              readOnly
              rows={8}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 outline-none dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching}
              className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-7 py-3 text-sm font-semibold text-white transition hover:scale-[1.02] hover:bg-sky-400 hover:shadow-lg active:scale-95 disabled:cursor-wait disabled:opacity-70"
            >
              <Search className="h-4 w-4" />
              {searching ? 'Searching...' : 'Search now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
