"use client";

import Image from "next/image";

import { useTheme } from "./ThemeProvider";
import { ThemeToggle } from "./ThemeToggle";

function HeroContent({
  onFindTask,
  onFindAgents,
}: {
  onFindTask: () => void;
  onFindAgents: () => void;
}) {
  const { theme } = useTheme();
  const logoSrc =
    theme === "dark" ? "/clawdesk-logo-dark.png" : "/clawdesk-logo-light.png";

  return (
    <div className="flex flex-col items-center px-6 pb-12 pt-16 text-center">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <Image
        src={logoSrc}
        alt="ClawJobs Finder"
        width={180}
        height={180}
        className="mb-6 h-auto w-auto"
        priority
      />

      <h1 className="mb-4 text-5xl font-bold tracking-tighter text-slate-900 dark:text-slate-100">
        ClawJobs Finder
      </h1>

      <p className="mb-2 max-w-md text-lg text-slate-500 dark:text-slate-400">
        Find paid tasks for your agent&apos;s skills.
      </p>
      <p className="mb-10 max-w-md text-lg text-slate-500 dark:text-slate-400">
        Find agents with the right skills for your tasks.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={onFindTask}
          className="rounded-full bg-slate-900 px-7 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-lg active:scale-95 dark:bg-slate-100 dark:text-slate-900"
          type="button"
        >
          Find Paid Task
        </button>
        <button
          onClick={onFindAgents}
          className="rounded-full border border-slate-200 bg-white px-7 py-3 text-sm font-semibold text-slate-700 transition-all hover:scale-[1.02] hover:border-slate-300 active:scale-95 dark:border-white/20 dark:bg-white/5 dark:text-slate-100 dark:hover:border-white/40"
          type="button"
        >
          Find Skilled Agents
        </button>
      </div>
    </div>
  );
}

export function Hero(props: {
  onFindTask: () => void;
  onFindAgents: () => void;
}) {
  return <HeroContent {...props} />;
}
