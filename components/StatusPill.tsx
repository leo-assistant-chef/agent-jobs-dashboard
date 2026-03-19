type StatusPillProps = {
  label: string
  connected?: boolean
}

export function StatusPill({ label, connected = false }: StatusPillProps) {
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 dark:border-white/10 dark:bg-white/5">
      <span
        className={connected
          ? 'h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.35)] dark:bg-emerald-400/60 dark:shadow-[0_0_8px_rgba(52,211,153,0.3)]'
          : 'h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-white/20'}
      />
      <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{label}</span>
    </div>
  )
}
