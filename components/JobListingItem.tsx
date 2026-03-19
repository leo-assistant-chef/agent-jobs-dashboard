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
    return (
      <div className={`space-y-2 ${className}`}>
        {/* Job title/description */}
        <div className="text-sm leading-6">{cleanText}</div>

        {/* Links */}
        <div className="flex flex-wrap gap-2">
          {links.map((link, idx) => {
            if (!isValidUrl(link.url)) return null

            return (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:border-white/40 hover:bg-white/10"
              >
                <span className="truncate">{link.url}</span>
                <svg
                  className="h-3.5 w-3.5 flex-shrink-0"
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
            )
          })}
        </div>
      </div>
    )
  }

  // No links, just render text with basic markdown
  return <div className={`text-sm leading-6 ${className}`}>{cleanText}</div>
}
