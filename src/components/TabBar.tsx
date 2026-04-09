import { useState, KeyboardEvent, useEffect, useRef } from 'react'
import { useBrowserStore } from '@/store/browserStore'
import { useSearchStore } from '@/store/searchStore'
import { useAssistantPanelStore } from '@/store/assistantPanelStore'
import { useSplitViewStore } from '@/store/splitViewStore'
import { useTabCycleStore } from '@/store/tabCycleStore'
import { useUIStore } from '@/store'
import { useMemoryStore } from '@/store/memoryStore'
import { cn } from '@/lib/utils'
import {
  X, Plus, Globe, ArrowLeft, ArrowRight, RotateCw,
  Star, Lock, PanelRight,
  Download, MessageSquare, Columns2, Search,
  ChevronDown, Users, SquareStack, Clock, Puzzle, Package, HelpCircle, Settings, ChevronRight,
  Maximize2, Printer, Brain
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { TabCycler } from './TabCycler'
import { DownloadsPanel } from './DownloadsPanel'
import { ZoomControls } from './ZoomControls'
import { MemoryPanel } from './MemoryPanel'

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, newTab, navigate, goBack, goForward, reload, toggleFullscreen, print, agentActive, showFindBar } = useBrowserStore()
  const { performSearch } = useSearchStore()
  const { isOpen: panelOpen, toggle: togglePanel } = useAssistantPanelStore()
  const { enabled: splitEnabled, enable: enableSplit, disable: disableSplit, rightTabId, leftTabId } = useSplitViewStore()
  const { addToHistory, setPickerOpen, isPickerOpen } = useTabCycleStore()
  const { setBrowserScreenshot, activeSection } = useUIStore()
  const { settings, loadMemoryStats } = useMemoryStore()
  const activeTab = tabs.find(t => t.id === activeTabId)
  const [url, setUrl] = useState('')
  const [bookmarked, setBookmarked] = useState(false)
  const [memoryPanelOpen, setMemoryPanelOpen] = useState(false)

  const tabCyclerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeTab) {
      addToHistory({
        id: activeTab.id,
        url: activeTab.url,
        title: activeTab.title,
      })
    }
  }, [activeTabId, activeTab?.url])

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Tab') {
        e.preventDefault()
        setPickerOpen(true)
      }
      if (e.key === 'Escape' && isPickerOpen) {
        setPickerOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPickerOpen, setPickerOpen])

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

  const handleOpenDevTools = () => {
    if (window.electronAPI?.browser?.openDevTools) {
      window.electronAPI.browser.openDevTools()
    }
  }

  const handleToggleSplit = () => {
    if (splitEnabled) {
      disableSplit()
    } else if (activeTabId && tabs.length >= 2) {
      const otherTab = tabs.find(t => t.id !== activeTabId)
      if (otherTab) {
        enableSplit(activeTabId, otherTab.id)
      } else {
        newTab().then(() => {
          const newTabId = tabs.length > 0 ? tabs[tabs.length - 1]?.id : null
          if (activeTabId && newTabId) {
            enableSplit(activeTabId, newTabId)
          }
        })
      }
    }
  }

  const handleNavigate = () => {
    if (!url.trim()) return
    const input = url.trim()
    const isUrl = input.startsWith('http://') || input.startsWith('https://') || (input.includes('.') && !input.includes(' '))

    if (isUrl) {
      const targetUrl = input.startsWith('http') ? input : `https://${input}`
      navigate(targetUrl)
    } else {
      performSearch(input)
    }
    setUrl('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNavigate()
    }
  }

  const handleTabCycleSelect = (tabId: string) => {
    setActiveTab(tabId)
    setPickerOpen(false)
  }

  const isAboutBlank = !activeTab?.url || activeTab.url === 'about:blank' || activeTab.url.includes('about:blank')

  const handleProfileMenuOpenChange = async (open: boolean) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const api = window.electronAPI?.browser as any
    if (!api) return

    if (open) {
      // Check if browser is currently supposed to be visible
      const isBrowserVisible = activeSection === 'search' && !isAboutBlank
      
      if (activeTabId && isBrowserVisible) {
        try {
          const res = await api.screenshot(activeTabId)
          if (res.data) {
            setBrowserScreenshot(res.data)
            // Wait a tick for React to render the image overlay
            setTimeout(() => {
              if (api.setVisibility) api.setVisibility(false)
            }, 10)
          }
        } catch (e) {
          console.error('Failed to capture screenshot', e)
        }
      }
    } else {
      if (api.setVisibility) api.setVisibility(true)
      // Small delay to prevent flashing while BrowserView restores
      setTimeout(() => {
        setBrowserScreenshot(null)
      }, 50)
    }
  }

  const displayUrl = activeTab?.url && activeTab.url !== 'about:blank'
    ? activeTab.url
    : ''

  return (
    <div className="tabbar-chrome" ref={tabCyclerRef}>
      {/* ── Row 1: Tabs ─────────────────────────────────── */}
      <div className="tabbar-row tabbar-row--tabs">
        {/* Custom Window Controls */}
        <div className="mac-window-controls">
          <div 
            className="mac-dot close" 
            onClick={() => window.electronAPI?.closeWindow()}
          >
            <svg viewBox="0 0 10 10"><path d="M2 2 L8 8 M2 8 L8 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
          <div 
            className="mac-dot minimize" 
            onClick={() => window.electronAPI?.minimizeWindow()}
          >
            <svg viewBox="0 0 10 10"><path d="M2 5 L8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
          <div 
            className="mac-dot maximize" 
            onClick={() => window.electronAPI?.maximizeWindow()}
          >
            <svg viewBox="0 0 10 10">
              <path d="M5.5 4.5 L9 1 M9 1 L7 1 M9 1 L9 3 M4.5 5.5 L1 9 M1 9 L3 9 M1 9 L1 7" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabbar-tabs-region relative">
          {isPickerOpen && (
            <div className="absolute top-full left-0 z-50">
              <TabCycler
                onSelect={handleTabCycleSelect}
                onClose={() => setPickerOpen(false)}
              />
            </div>
          )}
          
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                'tabbar-tab',
                tab.id === activeTabId && 'tabbar-tab--active',
                (tab.id === leftTabId || tab.id === rightTabId) && splitEnabled && 'opacity-60'
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tabbar-tab-favicon">
                {tab.isLoading ? (
                  <div className="tabbar-tab-spinner" />
                ) : (
                  <Globe size={12} strokeWidth={1.6} />
                )}
              </span>

              <span className="tabbar-tab-title">
                {tab.title || 'New Tab'}
              </span>

              {tab.id === activeTabId && agentActive && (
                <span className="tabbar-tab-agent-dot" />
              )}

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

          <button
            onClick={() => newTab()}
            className="tabbar-new-tab-btn"
            title="New tab"
          >
            <Plus size={13} strokeWidth={1.8} />
          </button>
        </div>

        {/* Profile Dropdown (far right, in tab row) */}
        <div className="tabbar-row-right select-none ml-1 mr-2 relative z-[60]">
          <DropdownMenu onOpenChange={handleProfileMenuOpenChange}>
            <DropdownMenuTrigger className="flex items-center gap-1.5 hover:bg-white/[0.08] transition-colors rounded-md p-1 outline-none">
              <ChevronDown size={13} className="text-white/40" />
              <div className="w-[22px] h-[22px] rounded-full bg-gradient-to-tr from-cyan-600 via-rose-500 to-violet-600 shadow-inner flex items-center justify-center overflow-hidden border border-white/10" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-[240px] bg-[#1a1b20] border-[#2a2b30] text-white/90 rounded-xl p-1.5 shadow-2xl overflow-hidden font-sans z-[100]">
              <DropdownMenuItem className="py-2.5 px-2.5 hover:bg-white/[0.06] rounded-lg focus:bg-white/[0.06] cursor-pointer group">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-600 via-rose-500 to-violet-600 mr-2 border border-white/10 shrink-0" />
                <div className="flex-1 font-medium text-[13px] text-white/90">Jay</div>
                <div className="text-[12px] text-white/40 flex items-center gap-1 group-hover:text-white/60 transition-colors">
                  Signed in <ChevronRight size={13} className="opacity-70" />
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-white/[0.06] my-1" />
              
              <DropdownMenuItem className="py-1.5 px-2.5 hover:bg-white/[0.06] rounded-md focus:bg-white/[0.06] cursor-pointer text-[13px]">
                <Users size={15} strokeWidth={1.5} className="mr-2 text-white/50" />
                <span className="flex-1 text-white/85">Profiles</span>
                <ChevronRight size={13} className="text-white/30" />
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-white/[0.06] my-1" />
              
              <DropdownMenuItem className="py-1.5 px-2.5 hover:bg-white/[0.06] rounded-md focus:bg-white/[0.06] cursor-pointer text-[13px]">
                <SquareStack size={15} strokeWidth={1.5} className="mr-2 text-white/50" />
                <span className="flex-1 text-white/85">Tabs</span>
                <ChevronRight size={13} className="text-white/30" />
              </DropdownMenuItem>
              <DropdownMenuItem className="py-1.5 px-2.5 hover:bg-white/[0.06] rounded-md focus:bg-white/[0.06] cursor-pointer text-[13px]">
                <Star size={15} strokeWidth={1.5} className="mr-2 text-white/50" />
                <span className="flex-1 text-white/85">Bookmarks</span>
                <ChevronRight size={13} className="text-white/30" />
              </DropdownMenuItem>
              <DropdownMenuItem className="py-1.5 px-2.5 hover:bg-white/[0.06] rounded-md focus:bg-white/[0.06] cursor-pointer text-[13px]">
                <Clock size={15} strokeWidth={1.5} className="mr-2 text-white/50" />
                <span className="flex-1 text-white/85">History</span>
                <ChevronRight size={13} className="text-white/30" />
              </DropdownMenuItem>
              <DropdownMenuItem className="py-1.5 px-2.5 hover:bg-white/[0.06] rounded-md focus:bg-white/[0.06] cursor-pointer text-[13px]">
                <Download size={15} strokeWidth={1.5} className="mr-2 text-white/50" />
                <span className="flex-1 text-white/85">Downloads</span>
                <DropdownMenuShortcut className="text-[12px] text-white/30 font-sans tracking-normal opacity-100">⇧⌘J</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem className="py-1.5 px-2.5 hover:bg-white/[0.06] rounded-md focus:bg-white/[0.06] cursor-pointer text-[13px]">
                <Puzzle size={15} strokeWidth={1.5} className="mr-2 text-white/50" />
                <span className="flex-1 text-white/85">Extensions</span>
                <ChevronRight size={13} className="text-white/30" />
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-white/[0.06] my-1" />
              
              <DropdownMenuItem className="py-1.5 px-2.5 hover:bg-white/[0.06] rounded-md focus:bg-white/[0.06] cursor-pointer text-[13px]">
                <Package size={15} strokeWidth={1.5} className="mr-2 text-white/50" />
                <span className="flex-1 text-white/85">More tools</span>
                <ChevronRight size={13} className="text-white/30" />
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-white/[0.06] my-1" />
              
              <DropdownMenuItem className="py-1.5 px-2.5 hover:bg-white/[0.06] rounded-md focus:bg-white/[0.06] cursor-pointer text-[13px]">
                <HelpCircle size={15} strokeWidth={1.5} className="mr-2 text-white/50" />
                <span className="flex-1 text-white/85">Help</span>
                <ChevronRight size={13} className="text-white/30" />
              </DropdownMenuItem>
              <DropdownMenuItem className="py-1.5 px-2.5 hover:bg-white/[0.06] rounded-md focus:bg-white/[0.06] cursor-pointer text-[13px]">
                <Settings size={15} strokeWidth={1.5} className="mr-2 text-white/50" />
                <span className="flex-1 text-white/85">Settings</span>
                <DropdownMenuShortcut className="text-[12px] text-white/30 font-sans tracking-normal opacity-100">⌘,</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          <button
            className={cn(
              'tabbar-action-btn',
              panelOpen && 'bg-cyan-500/20 text-cyan-400'
            )}
            title="Assistant Panel (Cmd+\)"
            onClick={togglePanel}
          >
            <MessageSquare size={14} strokeWidth={1.6} />
          </button>
          <button
            className={cn(
              'tabbar-action-btn',
              splitEnabled && 'bg-violet-500/20 text-violet-400'
            )}
            title={splitEnabled ? 'Exit Split View' : 'Split View'}
            onClick={handleToggleSplit}
          >
            <Columns2 size={14} strokeWidth={1.6} />
          </button>
          <button
            className="tabbar-action-btn"
            title="Find in page (Cmd+F)"
            onClick={() => showFindBar(true)}
          >
            <Search size={14} strokeWidth={1.6} />
          </button>
          <button className="tabbar-action-btn" title="Bookmark" onClick={handleBookmark}>
            <Star size={14} strokeWidth={1.6} className={bookmarked ? 'text-yellow-400' : ''} />
          </button>
          <button className="tabbar-action-btn" title="Print (Cmd+P)" onClick={print}>
            <Printer size={14} strokeWidth={1.6} />
          </button>
          <button className="tabbar-action-btn" title="Fullscreen" onClick={toggleFullscreen}>
            <Maximize2 size={14} strokeWidth={1.6} />
          </button>
          <ZoomControls />
          <DownloadsPanel />
          <button className="tabbar-action-btn" title="Inspect/DevTools" onClick={handleOpenDevTools}>
            <PanelRight size={14} strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </div>
  )
}
