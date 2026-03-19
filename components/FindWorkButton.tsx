'use client'

import { LoaderCircle, Search } from 'lucide-react'

import type { OpenServData } from '@/app/data/openserv'

type FindWorkButtonProps = {
  searching?: boolean
  onSearchingChange?: (searching: boolean) => void
  onResults: (data: OpenServData) => void
  onError?: (message: string | null) => void
}

export function FindWorkButton({
  searching = false,
  onSearchingChange,
  onResults,
  onError,
}: FindWorkButtonProps) {
  async function handleFindWork() {
    if (searching) {
      return
    }

    onSearchingChange?.(true)
    onError?.(null)

    try {
      const response = await fetch('/api/fetch-jobs')
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to fetch OpenServ jobs.')
      }

      onResults(payload)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch OpenServ jobs.'
      onError?.(message)
    } finally {
      onSearchingChange?.(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleFindWork}
      disabled={searching}
      className={searching
        ? 'flex cursor-wait items-center gap-3 rounded-full border border-white/20 bg-white/10 px-7 py-3 text-sm font-semibold text-slate-100'
        : 'flex items-center gap-3 rounded-full bg-slate-100 px-7 py-3 text-sm font-semibold text-slate-900 transition-all duration-300 hover:scale-[1.02] hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95'}
    >
      {searching ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
      <span>{searching ? 'Searching jobs' : 'Find Work'}</span>
    </button>
  )
}
