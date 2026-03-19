import { CheckCircle2, Clock3, Search, Send, Zap } from "lucide-react";

import type { JobStatus } from "@/app/data/mock-jobs";

type JobPipelineProps = {
  counts: Record<JobStatus, number>;
};

type Stage = {
  key: JobStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  state: "idle" | "active" | "completed";
};

const stages: Stage[] = [
  { key: "found", label: "Found", icon: Search, state: "completed" },
  { key: "applied", label: "Applied", icon: Send, state: "completed" },
  { key: "in_progress", label: "In Progress", icon: Zap, state: "active" },
  {
    key: "awaiting_payment",
    label: "Awaiting Payment",
    icon: Clock3,
    state: "idle",
  },
  { key: "paid", label: "Paid", icon: CheckCircle2, state: "idle" },
];

const nodeClasses = {
  idle: "flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-900 text-slate-500",
  active:
    "flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.15)] ring-4 ring-white/5",
  completed:
    "flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-slate-900 text-slate-300",
};

export function JobPipeline({ counts }: JobPipelineProps) {
  return (
    <section className="flex w-full flex-col gap-8 rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl md:px-16">
      {/* TODO: Disabled temporarily for now */}
      {/* <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-400">
            Delivery pipeline
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tighter text-slate-100">
            Work moving from discovery to payout
          </h2>
        </div>
        <p className="max-w-xl text-sm text-slate-400">
          Keep live visibility on sourcing, applications, active execution, and paid-out work.
        </p>
      </div> */}

      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const activeLine =
            stage.state === "completed"
              ? "from-white/40 to-white/20"
              : "from-white/10 to-transparent";

          return (
            <div key={stage.key} className="flex flex-1 items-center gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <div className="relative">
                  <div className={nodeClasses[stage.state]}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border border-white/10 bg-slate-950 px-1 text-[10px] font-semibold text-slate-200">
                    {counts[stage.key]}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-200">
                    {stage.label}
                  </p>
                  <p className="text-xs text-slate-500">
                    {stage.state === "active"
                      ? "Current focus"
                      : stage.state === "completed"
                        ? "Stage moving"
                        : "Queued next"}
                  </p>
                </div>
              </div>

              {index < stages.length - 1 ? (
                <div
                  className={`hidden h-[1px] flex-1 bg-gradient-to-r ${activeLine} md:block`}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
