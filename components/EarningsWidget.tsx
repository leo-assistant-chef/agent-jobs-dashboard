type EarningsWidgetProps = {
  totalPaid: number
  pendingAmount: number
  availableAmount: number
  totalJobs: number
}

export function EarningsWidget({
  totalPaid,
  pendingAmount,
  availableAmount,
  totalJobs,
}: EarningsWidgetProps) {
  return (
    <aside className="sticky top-6">
      <div className="relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/5 blur-[100px]" />

        <div className="relative space-y-8">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-400">
              Earnings overview
            </p>
            <p className="mt-4 text-5xl font-mono font-light tracking-tighter text-slate-100">
              {totalPaid.toLocaleString()}
            </p>
            <p className="mt-2 text-sm font-medium text-blue-400/70">USDC settled</p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-400">
                Pending
              </p>
              <p className="mt-2 text-2xl font-medium tracking-tight text-slate-100">
                {pendingAmount.toLocaleString()} <span className="text-sm text-slate-400">USDC</span>
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-400">
                Available
              </p>
              <p className="mt-2 text-2xl font-medium tracking-tight text-slate-100">
                {availableAmount.toLocaleString()} <span className="text-sm text-slate-400">USDC</span>
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-400">
                Total jobs
              </p>
              <p className="mt-2 text-2xl font-medium tracking-tight text-slate-100">{totalJobs}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
