import { useState, KeyboardEvent } from 'react'
import { useBrowserStore } from '@/store/browserStore'
import { useSearchStore } from '@/store/searchStore'
import { useUIStore } from '@/store'
import { cn } from '@/lib/utils'
import {
  X, Plus, Globe, ArrowLeft, ArrowRight, RotateCw,
  Star, Share, Lock, Sparkles, PanelRight, Grid3X3,
  Download
} from 'lucide-react'

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, newTab, navigate, goBack, goForward, reload, agentActive } = useBrowserStore()
  const { performSearch } = useSearchStore()
  const { setActiveSection } = useUIStore()
  const activeTab = tabs.find(t => t.id === activeTabId)
  const [url, setUrl] = useState('')
  const [bookmarked, setBookmarked] = useState(false)

  const handleBookmark = () => {
    if (activeTab?.url && activeTab.url !== 'about:blank') {
      const bookmark = { url: activeTab.url, title: activeTab.title || activeTab.url }
      const saved = localStorage.getItem('bookmarks')
      const bookmarks = saved ? JSON.parse(saved) : []
      const exists = bookmarks.some((b: { url: string }) => b.url === bookmark.url)
      if (!exists) {
        bookmarks.push(bookmark)
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks))
      }
      setBookmarked(!exists)
    }
  }

  const handleShare = async () => {
    if (activeTab?.url && activeTab.url !== 'about:blank') {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(activeTab.url)
      }
    }
  }

  const handleAssistant = () => {
    setActiveSection('search')
  }

  const handleOpenDevTools = () => {
    if (window.electronAPI?.browser?.openDevTools) {
      window.electronAPI.browser.openDevTools()
    }
  }

  const handleNavigate = () => {
    if (!url.trim()) return
    const input = url.trim()
    const isUrl = input.startsWith('http://') || input.startsWith('https://') || (input.includes('.') && !input.includes(' '))

    if (isUrl) {
      // It's a URL — navigate the visible browser tab
      const targetUrl = input.startsWith('http') ? input : `https://${input}`
      navigate(targetUrl)
    } else {
      // It's a search query — keep results inside the app, no popup
      performSearch(input)
    }
    setUrl('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNavigate()
    }
  }

  // Get display URL for the address bar
  const displayUrl = activeTab?.url && activeTab.url !== 'about:blank'
    ? activeTab.url
    : ''

  return (
    <div className="tabbar-chrome">
      {/* ── Row 1: Tabs ─────────────────────────────────── */}
      <div className="tabbar-row tabbar-row--tabs">
        {/* macOS traffic-light spacer */}
        <div className="tabbar-traffic-spacer" />

        {/* Tabs */}
        <div className="tabbar-tabs-region">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                'tabbar-tab',
                tab.id === activeTabId && 'tabbar-tab--active'
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              {/* Favicon */}
              <span className="tabbar-tab-favicon">
                {tab.isLoading ? (
                  <div className="tabbar-tab-spinner" />
                ) : (
                  <Globe size={12} strokeWidth={1.6} />
                )}
              </span>

              {/* Title */}
              <span className="tabbar-tab-title">
                {tab.title || 'New Tab'}
              </span>

              {/* Agent active indicator */}
              {tab.id === activeTabId && agentActive && (
                <span className="tabbar-tab-agent-dot" />
              )}

              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  closeTab(tab.id)
                }}
                className="tabbar-tab-close"
              >
                <X size={10} strokeWidth={2} />
              </button>
            </div>
          ))}

          {/* New tab button */}
          <button
            onClick={() => newTab()}
            className="tabbar-new-tab-btn"
            title="New tab"
          >
            <Plus size={13} strokeWidth={1.8} />
          </button>
        </div>

        {/* Assistant pill (far right, in tab row) */}
        <div className="tabbar-row-right">
          <button className="tabbar-assistant-btn" onClick={handleAssistant}>
            <Sparkles size={12} strokeWidth={1.8} />
            <span>Assistant</span>
          </button>
        </div>
      </div>

      {/* ── Row 2: Navigation + URL bar + Actions ──────── */}
      <div className="tabbar-row tabbar-row--nav">
        {/* Navigation controls */}
        <div className="tabbar-nav-controls">
          <button
            onClick={() => goBack()}
            className="tabbar-nav-btn"
            title="Go back"
          >
            <ArrowLeft size={13} strokeWidth={1.8} />
          </button>
          <button
            onClick={() => goForward()}
            className="tabbar-nav-btn"
            title="Go forward"
          >
            <ArrowRight size={13} strokeWidth={1.8} />
          </button>
          <button
            onClick={() => reload()}
            className="tabbar-nav-btn"
            title="Reload"
          >
            <RotateCw size={12} strokeWidth={1.8} />
          </button>
        </div>

        {/* URL / Search bar (full width) */}
        <div className="tabbar-url-bar">
          <Lock size={11} strokeWidth={2} className="tabbar-url-lock" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={displayUrl || 'Search or enter URL...'}
            className="tabbar-url-input"
          />
        </div>

        {/* Action buttons */}
        <div className="tabbar-action-group">
          <button className="tabbar-action-btn" title="Bookmark" onClick={handleBookmark}>
            <Star size={14} strokeWidth={1.6} className={bookmarked ? 'text-yellow-400' : ''} />
          </button>
          <button className="tabbar-action-btn" title="Downloads" onClick={() => {}}>
            <Download size={14} strokeWidth={1.6} />
          </button>
          <button className="tabbar-action-btn" title="Extensions" onClick={() => {}}>
            <Grid3X3 size={14} strokeWidth={1.6} />
          </button>
          <button className="tabbar-action-btn" title="Share" onClick={handleShare}>
            <Share size={14} strokeWidth={1.6} />
          </button>
          <button className="tabbar-action-btn" title="Inspect/DevTools" onClick={handleOpenDevTools}>
            <PanelRight size={14} strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </div>
  )
}
