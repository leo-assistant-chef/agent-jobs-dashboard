'use client'

import { parseMarkdown, isValidUrl, extractLinks } from '@/lib/markdown'

interface JobListingItemProps {
  text: string
  className?: string
}

export function JobListingItem({ text, className = '' }: JobListingItemProps) {
  const links = extractLinks(text)
  const { text: cleanText } = parseMarkdown(text)

  // If there are links, render them as separate clickable items
  if (links.length > 0) {
    const validLinks = links.filter((link) => isValidUrl(link.url))

    if (validLinks.length === 0) {
      return <div className={`text-sm leading-6 ${className}`}>{cleanText}</div>
    }

    return (
      <div className={`space-y-2.5 ${className}`}>
        {/* Job title/description */}
        <div className="text-sm leading-6">{cleanText}</div>

        {/* Links - wrap horizontally */}
        <div className="flex flex-wrap gap-1.5">
          {validLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-slate-300 transition-all duration-200 hover:border-white/30 hover:bg-white/[0.08]"
            >
              <span className="max-w-[200px] truncate">{link.url}</span>
              <svg
                className="h-3 w-3 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          ))}
        </div>
      </div>
    )
  }

  // No links, just render text with basic markdown
  return <div className={`text-sm leading-6 ${className}`}>{cleanText}</div>
}
