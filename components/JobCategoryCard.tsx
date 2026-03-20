'use client'

import { useState } from 'react'
import { JobListingItem } from './JobListingItem'

interface JobCategoryCardProps {
  emoji: string
  title: string
  items: string[]
  className?: string
}

export function JobCategoryCard({
  emoji,
  title,
  items,
  className = '',
}: JobCategoryCardProps) {
  const [showMore, setShowMore] = useState(false)
  const INITIAL_DISPLAY = 3

  const displayedItems = showMore ? items : items.slice(0, INITIAL_DISPLAY)
  const hasMore = items.length > INITIAL_DISPLAY

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/5 p-6 ${className}`}>
      {/* Category Heading */}
      <h3 className="text-sm font-semibold tracking-[0.2em] uppercase text-slate-400">
        {emoji} {title}
      </h3>

      {/* Job listings */}
      <div className="mt-4 space-y-3">
        {displayedItems.map((item, idx) => (
          <JobListingItem key={idx} text={item} />
        ))}
      </div>

      {/* Load More button */}
      {hasMore && (
        <button
          onClick={() => setShowMore(!showMore)}
          className="mt-4 w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-slate-400 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06] hover:text-slate-300"
        >
          {showMore
            ? `Show less (${INITIAL_DISPLAY}/${items.length})`
            : `Load more (${INITIAL_DISPLAY}/${items.length})`}
        </button>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <p className="mt-4 text-xs text-slate-500">No jobs in this category</p>
      )}
    </div>
  )
}
