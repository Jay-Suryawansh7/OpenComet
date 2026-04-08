import { create } from 'zustand'

export interface SearchResult {
  id: string
  type: 'link' | 'image' | 'video' | 'file'
  title: string
  url: string
  displayUrl: string
  snippet: string
  favicon?: string
  thumbnail?: string
  source: string
  timestamp?: number
  duration?: string        // for videos
  fileType?: string        // for files (pdf, doc, etc.)
  fileSize?: string
  resolution?: string      // for images
}

export interface SearchAssistantResponse {
  summary: string
  sources: { title: string; url: string; favicon?: string }[]
  followUpQuestions: string[]
}

export type SearchTab = 'assistant' | 'links' | 'images' | 'videos' | 'files'

export interface SearchState {
  query: string
  activeTab: SearchTab
  isSearching: boolean
  hasResults: boolean
  
  // Results by type
  assistantResponse: SearchAssistantResponse | null
  linkResults: SearchResult[]
  imageResults: SearchResult[]
  videoResults: SearchResult[]
  fileResults: SearchResult[]
  
  // Actions
  setQuery: (query: string) => void
  setActiveTab: (tab: SearchTab) => void
  performSearch: (query: string) => Promise<void>
  clearResults: () => void
}

// Build assistant response from real scraped results
function buildAssistantResponse(
  query: string,
  links: SearchResult[],
  images: SearchResult[],
  videos: SearchResult[]
): SearchAssistantResponse {
  // Create a summary from the top link snippets
  const topSnippets = links
    .slice(0, 4)
    .map(l => l.snippet)
    .filter(s => s.length > 20)

  let summary = `Here's what I found about "${query}":\n\n`

  if (topSnippets.length > 0) {
    summary += topSnippets.map((s, i) => `• **${links[i].source}**: ${s}`).join('\n\n')
  } else {
    summary += `Found ${links.length} web results`
    if (images.length > 0) summary += `, ${images.length} images`
    if (videos.length > 0) summary += `, ${videos.length} videos`
    summary += '.'
  }

  // Sources from top links
  const sources = links.slice(0, 5).map(l => ({
    title: l.title,
    url: l.url,
    favicon: '🌐',
  }))

  // Follow-up questions based on query
  const followUpQuestions = [
    `What are the latest updates about ${query}?`,
    `${query} explained in detail`,
    `Best resources for ${query}`,
    `Common questions about ${query}`,
  ]

  return { summary, sources, followUpQuestions }
}

// Derive favicon emoji from domain
function domainFavicon(source: string): string {
  const s = source.toLowerCase()
  if (s.includes('wikipedia')) return '🌐'
  if (s.includes('github')) return '⚫'
  if (s.includes('stackoverflow') || s.includes('stackexchange')) return '📋'
  if (s.includes('reddit')) return '🟠'
  if (s.includes('youtube') || s.includes('youtu')) return '🔴'
  if (s.includes('medium')) return '✏️'
  if (s.includes('dev.to')) return '🖤'
  if (s.includes('twitter') || s.includes('x.com')) return '🐦'
  if (s.includes('amazon')) return '📦'
  if (s.includes('apple')) return '🍎'
  if (s.includes('google')) return '🔵'
  if (s.includes('mozilla') || s.includes('mdn')) return '🦊'
  return '🔗'
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  activeTab: 'assistant',
  isSearching: false,
  hasResults: false,
  
  assistantResponse: null,
  linkResults: [],
  imageResults: [],
  videoResults: [],
  fileResults: [],
  
  setQuery: (query) => set({ query }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  performSearch: async (query) => {
    set({ query, isSearching: true, hasResults: false, activeTab: 'assistant' })
    
    try {
      // Try real search scraping via Electron
      if (window.electronAPI?.browser?.searchAndScrape) {
        const scraped = await window.electronAPI.browser.searchAndScrape(query)
        
        if (scraped && !scraped.error) {
          // Transform scraped links into SearchResult format
          const linkResults: SearchResult[] = (scraped.links || []).map((l: any, i: number) => ({
            id: `link-${i}`,
            type: 'link' as const,
            title: l.title || 'Untitled',
            url: l.url,
            displayUrl: l.displayUrl || l.url,
            snippet: l.snippet || '',
            source: l.source || 'web',
            favicon: domainFavicon(l.source || l.displayUrl || ''),
          }))

          // Transform scraped images
          const imageResults: SearchResult[] = (scraped.images || []).map((img: any, i: number) => ({
            id: `img-${i}`,
            type: 'image' as const,
            title: img.title || 'Image',
            url: img.url || img.thumbnail,
            displayUrl: img.source || 'Google Images',
            snippet: img.title || '',
            source: img.source || 'Google Images',
            favicon: '🖼️',
            thumbnail: img.thumbnail || img.url,
          }))

          // Transform scraped videos
          const videoResults: SearchResult[] = (scraped.videos || []).map((v: any, i: number) => ({
            id: `vid-${i}`,
            type: 'video' as const,
            title: v.title || 'Video',
            url: v.url,
            displayUrl: v.source || 'video',
            snippet: v.title || '',
            source: v.source || 'video',
            favicon: domainFavicon(v.source || ''),
            thumbnail: v.thumbnail || '',
            duration: v.duration || '',
          }))

          // Detect file results from links (PDFs, docs, etc.)
          const fileExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.csv', '.txt']
          const fileResults: SearchResult[] = linkResults
            .filter(l => fileExtensions.some(ext => l.url.toLowerCase().includes(ext)))
            .map((l, i) => {
              const urlLower = l.url.toLowerCase()
              let fileType = 'FILE'
              for (const ext of fileExtensions) {
                if (urlLower.includes(ext)) {
                  fileType = ext.replace('.', '').toUpperCase()
                  break
                }
              }
              return {
                ...l,
                id: `file-${i}`,
                type: 'file' as const,
                fileType,
                fileSize: '',
              }
            })

          // Build assistant response from real data
          const assistantResponse = buildAssistantResponse(query, linkResults, imageResults, videoResults)

          set({
            isSearching: false,
            hasResults: true,
            assistantResponse,
            linkResults,
            imageResults,
            videoResults,
            fileResults,
          })
          return
        }
      }

      // Fallback: if Electron API not available (e.g. dev in browser)
      // Use a minimal fallback response
      await new Promise(resolve => setTimeout(resolve, 500))
      
      set({
        isSearching: false,
        hasResults: true,
        assistantResponse: {
          summary: `Search results for "${query}" are only available when running in the Electron app. The browser engine is needed to scrape real search results from Google.`,
          sources: [],
          followUpQuestions: [],
        },
        linkResults: [],
        imageResults: [],
        videoResults: [],
        fileResults: [],
      })
    } catch (err) {
      console.error('Search failed:', err)
      set({
        isSearching: false,
        hasResults: true,
        assistantResponse: {
          summary: `An error occurred while searching for "${query}". Please try again.`,
          sources: [],
          followUpQuestions: [],
        },
        linkResults: [],
        imageResults: [],
        videoResults: [],
        fileResults: [],
      })
    }
  },
  
  clearResults: () => set({
    query: '',
    activeTab: 'assistant',
    isSearching: false,
    hasResults: false,
    assistantResponse: null,
    linkResults: [],
    imageResults: [],
    videoResults: [],
    fileResults: [],
  }),
}))
