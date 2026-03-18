import { LoaderCircle, Search } from 'lucide-react'

type FindWorkButtonProps = {
  searching?: boolean
}

export function FindWorkButton({ searching = false }: FindWorkButtonProps) {
  return (
    <button
      type="button"
      className={searching
        ? 'flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-7 py-3 text-sm font-semibold text-slate-100 cursor-wait'
        : 'flex items-center gap-3 rounded-full bg-slate-100 px-7 py-3 text-sm font-semibold text-slate-900 transition-all duration-300 hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-95'}
    >
      {searching ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
      <span>{searching ? 'Searching jobs' : 'Find Work'}</span>
    </button>
  )
}
