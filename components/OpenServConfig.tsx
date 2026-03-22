import { Shield, Workflow } from 'lucide-react'

export function OpenServConfig() {
  return (
    <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xl">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400">
            OpenServ MCP config
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tighter text-slate-900 dark:text-slate-100">
            Connect workflow automation
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Configure the MCP endpoint used for job discovery, application sync, and payout tracking.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
          <Workflow className="h-4 w-4 text-slate-500 dark:text-white" />
          Last sync 2m ago
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-[1.1fr_1fr_auto]">
        <label className="space-y-2">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400">
            MCP server URL
          </span>
          <input
            readOnly
            value="https://mcp.openserv.ai/agent-jobs"
            className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none"
          />
        </label>

        <label className="space-y-2">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400">
            API key
          </span>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-950 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
            <Shield className="h-4 w-4 text-emerald-500 dark:text-emerald-400/60" />
            <span>•••••••••••••••••••9F2</span>
          </div>
        </label>

        <div className="flex items-end">
          <button
            type="button"
            className="flex items-center gap-3 rounded-full bg-slate-900 dark:bg-slate-100 px-7 py-3 text-sm font-semibold text-white dark:text-slate-900 transition-all duration-300 hover:bg-slate-700 dark:hover:bg-white hover:shadow-lg hover:scale-[1.02] active:scale-95"
          >
            Connect
          </button>
        </div>
      </div>
    </section>
  )
}
