import { useState } from 'react'
import { useSearchStore, type SearchTab, type SearchResult, type SearchAssistantResponse } from '@/store/searchStore'
import { useBrowserStore } from '@/store/browserStore'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  Sparkles, Link2, ImageIcon, PlayCircle, FileText,
  ExternalLink, Copy, Share2,
  ThumbsUp, ThumbsDown, RotateCw, ArrowRight, Search,
  Download, Eye, MoreHorizontal
} from 'lucide-react'

const TABS: { id: SearchTab; label: string; icon: React.ElementType }[] = [
  { id: 'assistant', label: 'Assistant', icon: Sparkles },
  { id: 'links', label: 'Links', icon: Link2 },
  { id: 'images', label: 'Images', icon: ImageIcon },
  { id: 'videos', label: 'Videos', icon: PlayCircle },
  { id: 'files', label: 'Files', icon: FileText },
]

export function SearchResultsView() {
  const {
    query, activeTab, setActiveTab, isSearching, hasResults,
    assistantResponse, linkResults, imageResults, videoResults, fileResults,
  } = useSearchStore()

  const handleShare = async () => {
    const text = `${query} - Search results from OpenComet`
    if (navigator.share) {
      await navigator.share({ title: query, text, url: window.location.href })
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(`${text}\n${window.location.href}`)
    }
  }

  // Determine which tabs to show based on available results
  const availableTabs = TABS.filter(tab => {
    if (tab.id === 'assistant') return true
    if (tab.id === 'links') return linkResults.length > 0
    if (tab.id === 'images') return imageResults.length > 0
    if (tab.id === 'videos') return videoResults.length > 0
    if (tab.id === 'files') return fileResults.length > 0
    return false
  })

  if (!hasResults && !isSearching) return null

  return (
    <div className="flex flex-1 flex-col overflow-hidden search-results-view">
      {/* Tab navigation bar */}
      <div className="search-tabs-bar">
        <div className="search-tabs-inner">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'search-tab-trigger',
                activeTab === tab.id && 'active'
              )}
            >
              <tab.icon size={13} />
              <span>{tab.label}</span>
              {tab.id === 'links' && linkResults.length > 0 && (
                <span className="search-tab-count">{linkResults.length}</span>
              )}
              {tab.id === 'images' && imageResults.length > 0 && (
                <span className="search-tab-count">{imageResults.length}</span>
              )}
              {tab.id === 'videos' && videoResults.length > 0 && (
                <span className="search-tab-count">{videoResults.length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="search-tabs-actions">
          <button className="search-action-btn" title="Share" onClick={handleShare}>
            <Share2 size={13} />
          </button>
          <button className="search-action-btn" title="More" onClick={() => {}}>
            <MoreHorizontal size={13} />
          </button>
        </div>
      </div>

      {/* Search query header */}
      <div className="search-query-header">
        <Search size={14} className="text-white/25" />
        <span>Search results for: <strong className="text-white/70">{query}</strong></span>
      </div>

      {/* Loading state */}
      {isSearching && <SearchLoadingSkeleton />}

      {/* Tab content */}
      {!isSearching && hasResults && (
        <ScrollArea className="flex-1">
          <div className="search-content-area">
            {activeTab === 'assistant' && assistantResponse && (
              <AssistantTab response={assistantResponse} />
            )}
            {activeTab === 'links' && (
              <LinksTab results={linkResults} />
            )}
            {activeTab === 'images' && (
              <ImagesTab results={imageResults} />
            )}
            {activeTab === 'videos' && (
              <VideosTab results={videoResults} />
            )}
            {activeTab === 'files' && (
              <FilesTab results={fileResults} />
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

/* ── Loading skeleton ──────────────────────────────────────── */
function SearchLoadingSkeleton() {
  return (
    <div className="search-content-area">
      <div className="search-skeleton-container">
        {/* Source pills skeleton */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="search-skeleton-pill animate-shimmer" />
          ))}
        </div>

        {/* Text lines skeleton */}
        <div className="space-y-3">
          {[100, 95, 80, 90, 70, 85, 60].map((w, i) => (
            <div
              key={i}
              className="search-skeleton-line animate-shimmer"
              style={{ width: `${w}%`, animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>

        {/* Result cards skeleton */}
        <div className="mt-8 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="search-skeleton-card animate-shimmer" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Assistant Tab ─────────────────────────────────────────── */
function AssistantTab({ response }: { response: SearchAssistantResponse }) {
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)

  const handleCopy = () => {
    navigator.clipboard.writeText(response.summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type)
  }

  const handleRewrite = () => {
    console.log('Rewrite requested')
  }

  return (
    <div className="assistant-tab">
      {/* Source citations row */}
      <div className="assistant-sources">
        <span className="assistant-sources-label">Sources</span>
        <div className="assistant-sources-list">
          {response.sources.map((src, i) => (
            <a
              key={i}
              href={src.url}
              onClick={(e) => {
                e.preventDefault()
                useBrowserStore.getState().navigate(src.url)
                useSearchStore.getState().clearResults()
              }}
              className="assistant-source-chip"
            >
              <span className="assistant-source-favicon">{src.favicon}</span>
              <span className="assistant-source-title">{src.title}</span>
              <ExternalLink size={9} className="assistant-source-arrow" />
            </a>
          ))}
        </div>
      </div>

      {/* AI Answer */}
      <div className="assistant-answer">
        <div className="assistant-answer-header">
          <div className="assistant-answer-badge">
            <Sparkles size={12} />
            <span>Answer</span>
          </div>
        </div>

        <div className="assistant-answer-body">
          {response.summary.split('\n').map((line, i) => {
            if (!line.trim()) return <br key={i} />
            if (line.startsWith('•')) {
              const parts = line.slice(2)
              return (
                <div key={i} className="assistant-bullet">
                  <span className="assistant-bullet-dot" />
                  <span dangerouslySetInnerHTML={{
                    __html: parts.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white/80">$1</strong>')
                  }} />
                </div>
              )
            }
            return <p key={i} className="assistant-paragraph">{line}</p>
          })}
        </div>

        {/* Answer actions */}
        <div className="assistant-answer-actions">
          <button onClick={handleCopy} className="assistant-action-btn">
            <Copy size={12} />
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button onClick={() => handleFeedback('up')} className={cn('assistant-action-btn', feedback === 'up' && 'text-green-400')}>
            <ThumbsUp size={12} />
          </button>
          <button onClick={() => handleFeedback('down')} className={cn('assistant-action-btn', feedback === 'down' && 'text-red-400')}>
            <ThumbsDown size={12} />
          </button>
          <button onClick={handleRewrite} className="assistant-action-btn">
            <RotateCw size={12} />
            <span>Rewrite</span>
          </button>
        </div>
      </div>

      {/* Follow-up suggestions */}
      <div className="assistant-followups">
        <span className="assistant-followups-label">Related</span>
        <div className="assistant-followups-list">
          {response.followUpQuestions.map((q, i) => (
            <button key={i} className="assistant-followup-chip">
              <Search size={11} className="shrink-0" />
              <span>{q}</span>
              <ArrowRight size={11} className="shrink-0 ml-auto" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Links Tab ─────────────────────────────────────────────── */
function LinksTab({ results }: { results: SearchResult[] }) {
  return (
    <div className="links-tab">
      {results.map((result) => (
        <a
          key={result.id}
          href={result.url}
          onClick={(e) => {
            e.preventDefault()
            useBrowserStore.getState().navigate(result.url)
            useSearchStore.getState().clearResults()
          }}
          className="link-result-card"
        >
          <div className="link-result-main">
            {/* Site info row */}
            <div className="link-result-site">
              <span className="link-result-favicon">{result.favicon}</span>
              <div className="link-result-site-info">
                <span className="link-result-source">{result.source}</span>
                <span className="link-result-url">{result.displayUrl}</span>
              </div>
            </div>

            {/* Title */}
            <h3 className="link-result-title">{result.title}</h3>

            {/* Snippet */}
            <p className="link-result-snippet">{result.snippet}</p>
          </div>

          {/* Thumbnail if available */}
          {result.thumbnail && (
            <div className="link-result-thumb">
              <img
                src={result.thumbnail}
                alt={result.title}
                className="link-result-thumb-img"
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          )}
        </a>
      ))}
    </div>
  )
}

/* ── Images Tab ────────────────────────────────────────────── */
function ImagesTab({ results }: { results: SearchResult[] }) {
  const [selectedImage, setSelectedImage] = useState<SearchResult | null>(null)

  return (
    <div className="images-tab">
      <div className="images-grid">
        {results.map((result) => (
          <div
            key={result.id}
            className="image-result-card"
            onClick={() => setSelectedImage(result)}
          >
            <div className="image-result-thumb">
              <img
                src={result.thumbnail}
                alt={result.title}
                className="image-result-img"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" fill="%23161a22"><rect width="200" height="150"/><text x="100" y="80" text-anchor="middle" fill="%23ffffff30" font-size="12">Image</text></svg>')}`
                }}
              />
              <div className="image-result-overlay">
                <Eye size={16} />
              </div>
            </div>
            <div className="image-result-meta">
              <span className="image-result-favicon">{result.favicon}</span>
              <span className="image-result-source">{result.source}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Image lightbox */}
      {selectedImage && (
        <div
          className="image-lightbox"
          onClick={() => setSelectedImage(null)}
        >
          <div className="image-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage.url}
              alt={selectedImage.title}
              className="image-lightbox-img"
            />
            <div className="image-lightbox-info">
              <h3>{selectedImage.title}</h3>
              <p>{selectedImage.source} · {selectedImage.resolution}</p>
              <a 
                href={selectedImage.url} 
                onClick={(e) => {
                  e.preventDefault()
                  useBrowserStore.getState().navigate(selectedImage.url)
                  useSearchStore.getState().clearResults()
                }}
                className="image-lightbox-link"
              >
                <ExternalLink size={12} />
                Open original
              </a>
            </div>
            <button className="image-lightbox-close" onClick={() => setSelectedImage(null)}>×</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Videos Tab ────────────────────────────────────────────── */
function VideosTab({ results }: { results: SearchResult[] }) {
  return (
    <div className="videos-tab">
      <div className="videos-grid">
        {results.map((result) => (
          <a
            key={result.id}
            href={result.url}
            onClick={(e) => {
              e.preventDefault()
              useBrowserStore.getState().navigate(result.url)
              useSearchStore.getState().clearResults()
            }}
            className="video-result-card"
          >
            <div className="video-result-thumb">
              <img
                src={result.thumbnail}
                alt={result.title}
                className="video-result-img"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" fill="%23161a22"><rect width="320" height="180"/><text x="160" y="95" text-anchor="middle" fill="%23ffffff30" font-size="14">▶ Video</text></svg>')}`
                }}
              />
              <div className="video-play-btn">
                <PlayCircle size={32} />
              </div>
              {result.duration && (
                <span className="video-duration">{result.duration}</span>
              )}
            </div>
            <div className="video-result-info">
              <div className="video-result-meta-row">
                <span className="video-result-favicon">{result.favicon}</span>
                <span className="video-result-source">{result.source}</span>
              </div>
              <h3 className="video-result-title">{result.title}</h3>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

/* ── Files Tab ─────────────────────────────────────────────── */
function FilesTab({ results }: { results: SearchResult[] }) {
  const fileTypeColors: Record<string, string> = {
    PDF: 'file-type-pdf',
    DOCX: 'file-type-doc',
    XLSX: 'file-type-xls',
    PPTX: 'file-type-ppt',
  }

  return (
    <div className="files-tab">
      {results.map((result) => (
        <a
          key={result.id}
          href={result.url}
          onClick={(e) => {
            e.preventDefault()
            useBrowserStore.getState().navigate(result.url)
            useSearchStore.getState().clearResults()
          }}
          className="file-result-card"
        >
          <div className={cn('file-type-badge', fileTypeColors[result.fileType || ''] || 'file-type-default')}>
            {result.fileType}
          </div>
          <div className="file-result-info">
            <h3 className="file-result-title">{result.title}</h3>
            <div className="file-result-meta">
              <span className="file-result-favicon">{result.favicon}</span>
              <span>{result.source}</span>
              <span className="file-result-separator">·</span>
              <span>{result.fileSize}</span>
            </div>
          </div>
          <div className="file-result-actions">
            <Download size={14} />
          </div>
        </a>
      ))}
    </div>
  )
}
