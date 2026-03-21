'use client'

import { useState } from 'react'
import { Bot, ChevronDown, ChevronUp, Copy, Check, Terminal } from 'lucide-react'

interface AgentsMdViewerProps {
  content: string
}

function highlightMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/```([\s\S]*?)```/g, '<span class="block bg-black/20 dark:bg-black/40 rounded-md px-3 py-2 my-1 text-slate-500 dark:text-slate-400 border border-white/5">$1</span>')
    .replace(/`([^`\n]+)`/g, '<span class="bg-black/20 dark:bg-black/40 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[0.8em]">$1</span>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-800 dark:text-slate-100">$1</strong>')
    .replace(/^(#{1,6})\s+(.+)$/gm, '<span class="text-emerald-500 dark:text-emerald-400 font-bold">$1 $2</span>')
    .replace(/^[-*]\s+(.+)$/gm, '<span class="text-slate-400 dark:text-slate-500">• </span>$1')
}

export function AgentsMdViewer({ content }: AgentsMdViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = content
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const charCount = content.length.toLocaleString()
  const previewLines = content.split('\n').slice(0, 4).join('\n')

  return (
    <section className="mt-12 mb-10 px-4 sm:px-0">
      {/* Section heading */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Bot className="h-4 w-4 text-emerald-500" />
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            AGENTS.md — Instructions for your agent
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            For Agents
          </span>
        </div>
      </div>

      {/* Card */}
      <div className="relative rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm overflow-hidden shadow-sm">

        {/* Emerald gradient top line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />

        {/* Terminal header row */}
        <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-3 border-b border-slate-200/60 dark:border-white/[0.06]">
          <div className="flex items-center gap-2 min-w-0">
            <Terminal className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              {'>'} cat AGENTS.md<span className="animate-pulse ml-0.5">_</span>
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono tabular-nums hidden sm:block">
              {charCount} chars
            </span>
            {/* Copy button */}
            <div className="relative">
              {!copied && (
                <span className="absolute inset-0 rounded-lg border border-emerald-500/40 animate-ping opacity-30 pointer-events-none" />
              )}
              <button
                type="button"
                onClick={handleCopy}
                className={`relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${
                  copied
                    ? 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Toggle button */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-start justify-between gap-4 px-5 py-3.5 text-left hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors group"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              See AGENTS.md details
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Copy the full content to your clipboard and paste it to your agent
            </p>
          </div>
          <div className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
            {isExpanded
              ? <ChevronUp className="h-4 w-4" />
              : <ChevronDown className="h-4 w-4" />
            }
          </div>
        </button>

        {/* Preview when collapsed */}
        {!isExpanded && (
          <div className="relative mx-5 mb-4 rounded-lg overflow-hidden border border-slate-200/60 dark:border-white/5">
            <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed font-mono text-slate-500 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 max-h-[4.5rem] overflow-hidden">
              {previewLines}
            </pre>
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-50 dark:from-slate-900 to-transparent pointer-events-none" />
          </div>
        )}

        {/* Expanded content */}
        {isExpanded && (
          <div className="border-t border-slate-200/60 dark:border-white/[0.06]">
            <div className="p-5 max-h-[640px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/10">
              <pre
                className="whitespace-pre-wrap break-words text-xs leading-relaxed font-mono text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200/60 dark:border-white/5"
                dangerouslySetInnerHTML={{ __html: highlightMarkdown(content) }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
