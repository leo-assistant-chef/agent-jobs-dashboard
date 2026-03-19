/**
 * Extract URLs from a string and return an array of { text, url } objects
 * Deduplicates by URL to avoid showing the same link multiple times
 */
export function extractLinks(text: string): Array<{ text: string; url: string }> {
  const linkMap = new Map<string, string>() // url -> text

  // Match markdown links: [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  let match
  while ((match = markdownLinkRegex.exec(text)) !== null) {
    if (!linkMap.has(match[2])) {
      linkMap.set(match[2], match[1])
    }
  }

  // Match URLs in parentheses: (https://...)
  const parenUrlRegex = /\(https?:\/\/[^\s)]+\)/g
  while ((match = parenUrlRegex.exec(text)) !== null) {
    const url = match[0].slice(1, -1) // Remove parentheses
    if (!linkMap.has(url)) {
      linkMap.set(url, url)
    }
  }

  // Match bare URLs: https://...
  const bareUrlRegex = /(?<![\[\(])https?:\/\/[^\s)]+/g
  while ((match = bareUrlRegex.exec(text)) !== null) {
    const url = match[0]
    if (!linkMap.has(url)) {
      linkMap.set(url, url)
    }
  }

  return Array.from(linkMap).map(([url, text]) => ({ text, url }))
}

/**
 * Simple markdown formatter: bold, italic, links
 * Returns { text, links } for safe rendering
 */
export function parseMarkdown(text: string) {
  const links = extractLinks(text)

  // Remove markdown link syntax but keep for later rendering
  let formatted = text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // [text](url) -> text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // **bold** -> bold
    .replace(/\*([^*]+)\*/g, '$1') // *italic* -> italic
    .replace(/__(.*?)__/g, '$1') // __bold__ -> bold
    .replace(/_([^_]+)_/g, '$1') // _italic_ -> italic

  return { text: formatted, links }
}

/**
 * Get safe absolute URL for links
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
