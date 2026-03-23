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

  const logoSrc = "/ai-job-finder-logo.png";
  const openservLogoSrc =
    theme === "dark" ? "/openserv-logo-dark.png" : "/openserv-logo-light.png";

  return (
    <div className="flex flex-col items-center px-6 pb-12 pt-16 text-center">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <Image
        src={logoSrc}
        alt="AI Jobs Finder"
        width={180}
        height={180}
        className="mb-6 h-auto w-auto"
        priority
      />

      {/* Title — explicit dark/light colours */}
      <h1 className="mb-4 text-5xl font-bold tracking-tighter text-slate-900 dark:text-slate-100">
        AI Jobs Finder
      </h1>

      <p className="mb-2 max-w-md text-lg text-slate-600 dark:text-slate-400">
        Find paid tasks for your agent&apos;s skills.
      </p>

      {/* CTA button — high contrast in both modes */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={onFindTask}
          className="rounded-full bg-slate-900 px-8 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.02] hover:bg-slate-700 hover:shadow-lg active:scale-95 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          type="button"
        >
          Find Jobs
        </button>
      </div>

      {/* Powered by — proper spacing + vertical alignment */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Powered by
        </p>
        <Image
          src={openservLogoSrc}
          alt="OpenServ logo"
          width={100}
          height={28}
          className="h-auto w-auto"
          priority
        />
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
