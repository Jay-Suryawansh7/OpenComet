import { useEffect, useRef, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { ChatInput } from '@/components/ChatInput'
import { SuggestionCards } from '@/components/SuggestionCards'
import { SettingsPage } from '@/components/SettingsPage'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TabBar } from '@/components/TabBar'
import { SearchResultsView } from '@/components/SearchResultsView'
import { AssistantPanel } from '@/components/AssistantPanel'
import { InlineAssistantPopup } from '@/components/InlineAssistantPopup'
import { FindBar } from '@/components/FindBar'
import { SplitViewControls } from '@/components/SplitView'
import { useChatStore, useUIStore, useAgentMonitorStore, useSettingsStore } from '@/store'
import { useBrowserStore } from '@/store/browserStore'
import { useSearchStore } from '@/store/searchStore'
import { useAssistantPanelStore } from '@/store/assistantPanelStore'
import { useInlineAssistantListener } from '@/hooks/useInlineAssistantListener'
import { useAgent } from '@/hooks/useAgent'
import { cn } from '@/lib/utils'
import {
  Settings2, Zap, Activity, Clock, Compass, LayoutGrid, Trash2,
  TrendingUp, Heart, BarChart3, DollarSign, LineChart, Newspaper,
  Pill, Apple, Dna, Thermometer, Wind, Search,
  Plus, ArrowRight, Globe, Bot, Pause, ExternalLink
} from 'lucide-react'

function App() {
  const { messages, isLoading } = useChatStore()
  const { sendMessage, error } = useAgent()
  const { activeSection, browserScreenshot } = useUIStore()
  const { toggle: togglePanel } = useAssistantPanelStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLElement>(null)
  const { hasResults: hasSearchResults, isSearching, performSearch } = useSearchStore()

  const { initialize: initBrowser, tabs, activeTabId } = useBrowserStore()
  
  const activeTab = tabs.find(t => t.id === activeTabId)
  const isAboutBlank = !activeTab?.url || activeTab.url === 'about:blank' || activeTab.url.includes('about:blank')

  // Keyboard shortcuts for browser
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const mod = isMac ? e.metaKey : e.ctrlKey

      // Cmd/Ctrl+\ to toggle assistant panel
      if (mod && e.key === '\\') {
        e.preventDefault()
        togglePanel()
      }

      // Cmd+T - New tab
      if (mod && e.key === 't') {
        e.preventDefault()
        useBrowserStore.getState().newTab()
      }

      // Cmd+W - Close tab
      if (mod && e.key === 'w') {
        e.preventDefault()
        const { activeTabId, tabs } = useBrowserStore.getState()
        if (activeTabId && tabs.length > 1) {
          useBrowserStore.getState().closeTab(activeTabId)
        }
      }

      // Cmd+Shift+] - Next tab
      if (mod && e.shiftKey && e.key === ']') {
        e.preventDefault()
        const { tabs, activeTabId } = useBrowserStore.getState()
        if (tabs.length > 1 && activeTabId) {
          const idx = tabs.findIndex(t => t.id === activeTabId)
          const nextIdx = (idx + 1) % tabs.length
          useBrowserStore.getState().setActiveTab(tabs[nextIdx].id)
        }
      }

      // Cmd+Shift+[ - Previous tab
      if (mod && e.shiftKey && e.key === '[') {
        e.preventDefault()
        const { tabs, activeTabId } = useBrowserStore.getState()
        if (tabs.length > 1 && activeTabId) {
          const idx = tabs.findIndex(t => t.id === activeTabId)
          const prevIdx = idx === 0 ? tabs.length - 1 : idx - 1
          useBrowserStore.getState().setActiveTab(tabs[prevIdx].id)
        }
      }

      // Cmd+L - Focus address bar
      if (mod && e.key === 'l') {
        e.preventDefault()
        const urlInput = document.querySelector('.tabbar-url-input') as HTMLInputElement
        if (urlInput) {
          urlInput.focus()
          urlInput.select()
        }
      }

      // Cmd+P - Print
      if (mod && e.key === 'p') {
        e.preventDefault()
        useBrowserStore.getState().print()
      }

      // Cmd++ - Zoom in
      if (mod && (e.key === '+' || e.key === '=')) {
        e.preventDefault()
        useBrowserStore.getState().zoomIn()
      }

      // Cmd+- - Zoom out
      if (mod && e.key === '-') {
        e.preventDefault()
        useBrowserStore.getState().zoomOut()
      }

      // Cmd+0 - Reset zoom
      if (mod && e.key === '0') {
        e.preventDefault()
        useBrowserStore.getState().resetZoom()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePanel])

  // Listen for inline assistant messages from content script
  useInlineAssistantListener()

  useEffect(() => {
    const init = async () => {
      const { initialize } = useChatStore.getState()
      const { loadSettings } = useSettingsStore.getState()
      await initialize()
      await loadSettings()
      await initBrowser()
    }
    init()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (content: string) => {
    // Trigger both the search results view and the agent
    performSearch(content)
    useBrowserStore.getState().setAgentActive(true)
    await sendMessage(content)
  }

  const showingChat = messages.length > 0 || isLoading || hasSearchResults || isSearching
  const isBrowserVisible = activeSection === 'search' && !showingChat && !isAboutBlank

  useEffect(() => {
    if (window.electronAPI?.browser?.setVisibility) {
      window.electronAPI.browser.setVisibility(isBrowserVisible)
    }
    // Clear custom bounds when browser is hidden, use default positioning
    if (!isBrowserVisible) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const api = window.electronAPI?.browser as any
      if (api?.clearBounds) {
        api.clearBounds()
      }
    }
  }, [isBrowserVisible])

  // Perfectly track the physical layout of the main area so the BrowserView 
  // exactly snaps inside it even when zooming or toggling sidebars!
  useEffect(() => {
    if (!mainRef.current || !isBrowserVisible) return

    const updateBounds = () => {
      if (!mainRef.current) return
      
      // Get the position relative to the window
      const rect = mainRef.current.getBoundingClientRect()
      const margin = 8 // Inset padding for the Site Window Border
      
      // Calculate bounds relative to window content area
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const api = window.electronAPI?.browser as any
      if (api?.setBounds) {
        api.setBounds({
          x: Math.round(rect.left) + margin,
          y: Math.round(rect.top) + margin,
          width: Math.round(rect.width) - (margin * 2),
          height: Math.round(rect.height) - (margin * 2)
        })
      }
    }

    const observer = new ResizeObserver(() => {
      updateBounds()
    })

    // Listen for window resize to update bounds
    const handleResize = () => {
      updateBounds()
    }
    window.addEventListener('resize', handleResize)

    // Small delay to ensure DOM has updated after visibility change
    const timeoutId = setTimeout(updateBounds, 100)
    
    observer.observe(mainRef.current)
    return () => {
      clearTimeout(timeoutId)
      observer.disconnect()
      window.removeEventListener('resize', handleResize)
    }
  }, [isBrowserVisible])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0d1017]">
      {/* ── Browser tabs — full width ──────────────────── */}
      <TabBar />

      {/* ── Body — sidebar + content ─────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {!isBrowserVisible && <Sidebar />}

        <main ref={mainRef} className="relative flex flex-1 flex-col overflow-hidden">
          {/* Inline Assistant Popup */}
          <InlineAssistantPopup />
          {/* Find in Page Bar */}
          <FindBar />
          {/* Screenshot Overlay Mask when Dropdown is open */}
          {browserScreenshot && isBrowserVisible && (
            <img 
              src={browserScreenshot} 
              alt="Browser Mask" 
              className="absolute pointer-events-none z-0 left-[8px] top-[8px] w-[calc(100%-16px)] h-[calc(100%-16px)] object-cover rounded-[12px]" 
            />
          )}

          {/* Site Window Border that exactly frames the BrowserView (mostly hidden now) */}
          {isBrowserVisible && (
            <div className="absolute top-[8px] bottom-[8px] left-[8px] right-[8px] rounded-[12px] pointer-events-none z-50 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]" />
          )}
          {/* Split View Controls */}
          <SplitViewControls />

          {activeSection === 'settings' ? (
            <SettingsPage />
          ) : activeSection === 'history' ? (
            <HistoryPanel onSelect={(id) => {
              const { loadConversation } = useChatStore.getState()
              loadConversation(id)
              useUIStore.getState().setActiveSection('search')
            }} />
          ) : activeSection === 'discover' ? (
            <DiscoverPanel />
          ) : activeSection === 'spaces' ? (
            <SpacesPanel />
          ) : activeSection === 'finance' ? (
            <FinancePanel />
          ) : activeSection === 'health' ? (
            <HealthPanel />
          ) : (
            <>
              <AgentModeBar />
              {showingChat ? (
                (hasSearchResults || isSearching) ? (
                  <div className="flex flex-1 flex-col overflow-hidden">
                    <SearchResultsView />
                    {/* Bottom input */}
                    <div className="shrink-0 px-6 pb-5 pt-2 bg-gradient-to-t from-[#0d1017] via-[#0d1017] to-transparent">
                      <ChatInput onSubmit={handleSubmit} isLoading={isLoading} />
                      {error && (
                        <div className="max-w-[640px] mx-auto mt-2 text-[12px] text-red-400/60">{error}</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <ChatContainer
                    messages={messages}
                    isLoading={isLoading}
                    onSubmit={handleSubmit}
                    messagesEndRef={messagesEndRef}
                    error={error}
                  />
                )
              ) : (
                <HomeView onSubmit={handleSubmit} isLoading={isLoading} />
              )}
            </>
          )}
        </main>

        {/* Assistant Panel - right side */}
        <AssistantPanel />
      </div>
    </div>
  )
}

/* ── Agent mode toggle bar ─────────────────────────────────── */
function AgentModeBar() {
  const { agentMode, setAgentMode, agentActive } = useBrowserStore()
  const { agentStates } = useAgentMonitorStore()
  const activeAgents = Object.entries(agentStates).filter(([_, status]) => status === 'busy')

  return (
    <div className="relative flex items-center justify-between h-[30px] shrink-0 border-b border-white/[0.03] bg-[#0d1017] px-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-full bg-cyan-500/[0.06] border border-cyan-500/[0.08] px-2.5 py-[2px]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-cyan-400">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[11px] font-medium text-cyan-400/60">
            {activeAgents.length > 0 
              ? `${activeAgents.length} agent${activeAgents.length > 1 ? 's' : ''} active`
              : agentActive ? 'Agent browsing...' : 'Swarm Ready'
            }
          </span>
        </div>

        {activeAgents.slice(0, 3).map(([agent]) => (
          <div key={agent} className="flex items-center gap-1 rounded-full bg-violet-500/[0.06] border border-violet-500/[0.08] px-2 py-[1px]">
            <Activity size={9} className="text-violet-400 animate-pulse" />
            <span className="text-[10px] font-medium text-violet-400/60 capitalize">{agent}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => setAgentMode(agentMode === 'autonomous' ? 'confirmation' : 'autonomous')}
        className={cn(
          'flex items-center gap-1.5 rounded-full px-2.5 py-[3px] border transition-all text-[11px] font-medium',
          agentMode === 'autonomous'
            ? 'bg-cyan-500/[0.06] border-cyan-500/[0.15] text-cyan-400/70 hover:bg-cyan-500/[0.1]'
            : 'bg-amber-500/[0.06] border-amber-500/[0.15] text-amber-400/70 hover:bg-amber-500/[0.1]'
        )}
      >
        {agentMode === 'autonomous' ? (
          <>
            <Bot size={10} />
            Auto
          </>
        ) : (
          <>
            <Pause size={10} />
            Confirm
          </>
        )}
      </button>
    </div>
  )
}

/* ── Home (empty state) ──────────────────────────────────── */
function HomeView({ onSubmit, isLoading }: { onSubmit: (msg: string) => void; isLoading: boolean }) {
  const { setActiveSection } = useUIStore()

  const handleTryAssistant = () => {
    onSubmit('Help me with my tasks')
  }

  const handleCustomize = () => {
    setActiveSection('settings')
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient glow */}
      <div className="ambient-glow bg-cyan-500/[0.06] top-1/4 left-1/3" />
      <div className="ambient-glow bg-teal-500/[0.04] bottom-1/4 right-1/4" style={{ animationDelay: '-5s' }} />

      <div className="relative z-10 flex flex-col items-center gap-6 w-full px-6">
        <ChatInput onSubmit={onSubmit} isLoading={isLoading} />
        <SuggestionCards onSelect={onSubmit} />

        {/* Bottom actions */}
        <div className="flex items-center gap-5 mt-3">
          <button onClick={handleTryAssistant} className="flex items-center gap-1.5 text-[12.5px] text-white/30 hover:text-white/50 transition-colors">
            <Zap size={13} className="text-cyan-500/40" />
            Try Assistant
          </button>
          <button onClick={handleCustomize} className="flex items-center gap-1.5 text-[12.5px] text-white/30 hover:text-white/50 transition-colors">
            <Settings2 size={13} className="text-white/20" />
            Customize
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Chat container with reference cards ─────────────────── */
function ChatContainer({
  messages,
  isLoading,
  onSubmit,
  messagesEndRef,
  error,
}: {
  messages: { id: string; role: string; content: string }[]
  isLoading: boolean
  onSubmit: (msg: string) => void
  messagesEndRef: React.RefObject<HTMLDivElement>
  error: string | null
}) {
  const { visitedSites } = useBrowserStore()
  const hasMessages = messages.length > 0

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-[640px] mx-auto space-y-5">
          {messages.map((message) => (
            <div key={message.id} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed',
                  message.role === 'user'
                    ? 'bg-cyan-500/12 text-white/80 border border-cyan-500/8'
                    : message.role === 'system'
                    ? 'bg-red-500/8 text-red-300/70 border border-red-500/8'
                    : 'bg-white/[0.03] text-white/65 border border-white/[0.04]'
                )}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.04] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="typing-dot h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    <span className="typing-dot h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    <span className="typing-dot h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  </div>
                  <span className="text-[12px] text-white/25">Thinking…</span>
                </div>
              </div>
            </div>
          )}

          {hasMessages && visitedSites.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="text-[11px] text-white/25 uppercase tracking-wider px-1">Visited Sites</div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {visitedSites.map((site) => {
                  const getHostname = (url: string) => {
                    try { return new URL(url).hostname } catch { return url }
                  }
                  return (
                    <a
                      key={site.id}
                      href={site.url}
                      onClick={(e) => {
                        e.preventDefault()
                        useBrowserStore.getState().navigate(site.url)
                        useUIStore.getState().setActiveSection('search')
                        useSearchStore.getState().clearResults()
                      }}
                      className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all shrink-0 min-w-0 max-w-[200px] group"
                    >
                      <Globe size={12} className="shrink-0 text-cyan-400/50" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] text-white/60 truncate group-hover:text-white/80 transition-colors">
                          {site.title || getHostname(site.url)}
                        </div>
                        <div className="text-[10px] text-white/25 truncate">
                          {getHostname(site.url)}
                        </div>
                      </div>
                      <ExternalLink size={10} className="shrink-0 text-white/20 group-hover:text-white/40 transition-colors" />
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="shrink-0 px-6 pb-5 pt-2 bg-gradient-to-t from-[#0d1017] via-[#0d1017] to-transparent">
        <ChatInput onSubmit={onSubmit} isLoading={isLoading} />
        {error && (
          <div className="max-w-[640px] mx-auto mt-2 text-[12px] text-red-400/60">{error}</div>
        )}
      </div>
    </div>
  )
}

/* ── Section Panels ──────────────────────────────────────── */
function HistoryPanel({ onSelect }: { onSelect: (id: string) => void }) {
  const { loadConversations, deleteConversation, currentConversationId } = useChatStore()
  const { setActiveSection } = useUIStore()
  const [conversations, setConversations] = useState<Array<{ id: string; title: string; createdAt: number; updatedAt: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConversations().then(setConversations).finally(() => setLoading(false))
  }, [loadConversations])

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-cyan-400" />
          <h2 className="text-sm font-medium text-white/80">History</h2>
        </div>
        <button
          onClick={() => setActiveSection('search')}
          className="text-[12px] text-white/30 hover:text-white/60 transition-colors"
        >
          Back to chat
        </button>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-2">
          {loading ? (
            <div className="text-[13px] text-white/30 px-2 py-4 text-center">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="text-[13px] text-white/30 px-2 py-4 text-center">No conversations yet</div>
          ) : conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => { onSelect(conv.id); setActiveSection('search') }}
              className={cn(
                'flex items-center justify-between rounded-lg px-3 py-2.5 cursor-pointer transition-colors group',
                conv.id === currentConversationId
                  ? 'bg-cyan-500/10 border border-cyan-500/15'
                  : 'hover:bg-white/[0.04] border border-transparent'
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-white/70 truncate">{conv.title || 'New conversation'}</div>
                <div className="text-[11px] text-white/25 mt-0.5">
                  {new Date(conv.updatedAt).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id).then(loadConversations).then(setConversations) }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-white/[0.06] rounded"
              >
                <Trash2 size={13} className="text-white/30 hover:text-red-400" />
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

function DiscoverPanel() {
  const { setActiveSection } = useUIStore()
  const trending = [
    { topic: 'AI Agents', desc: 'Autonomous agents that complete multi-step tasks', icon: '🤖' },
    { topic: 'RAG Systems', desc: 'Retrieval-augmented generation for accurate answers', icon: '📚' },
    { topic: 'Swarm Intelligence', desc: 'Multiple agents collaborating on complex tasks', icon: '🐝' },
    { topic: 'Code Generation', desc: 'AI-powered code completion and refactoring', icon: '💻' },
    { topic: 'Multimodal AI', desc: 'Understanding images, audio, and video', icon: '👁️' },
  ]
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Compass size={16} className="text-cyan-400" />
          <h2 className="text-sm font-medium text-white/80">Discover</h2>
        </div>
        <button onClick={() => setActiveSection('search')} className="text-[12px] text-white/30 hover:text-white/60 transition-colors">
          Back to chat
        </button>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-6 py-4 space-y-3">
          <p className="text-[12px] text-white/30 mb-4">Explore trending agent capabilities</p>
          {trending.map((t) => (
            <div key={t.topic} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors cursor-pointer">
              <span className="text-2xl">{t.icon}</span>
              <div>
                <div className="text-[14px] font-medium text-white/80">{t.topic}</div>
                <div className="text-[12px] text-white/35 mt-0.5">{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

/* ── Finance Panel ─────────────────────────────────────────── */
function FinancePanel() {
  const { setActiveSection } = useUIStore()
  const [markets] = useState([
    { symbol: 'SPY', name: 'S&P 500', price: 523.45, change: +1.24, changePct: +0.24 },
    { symbol: 'QQQ', name: 'Nasdaq', price: 448.32, change: -2.18, changePct: -0.48 },
    { symbol: 'BTC', name: 'Bitcoin', price: 67450.00, change: +1240.50, changePct: +1.87 },
    { symbol: 'ETH', name: 'Ethereum', price: 3520.80, change: -45.20, changePct: -1.27 },
    { symbol: 'AAPL', name: 'Apple', price: 189.30, change: +1.85, changePct: +0.99 },
    { symbol: 'NVDA', name: 'NVIDIA', price: 875.40, change: +22.10, changePct: +2.59 },
  ])

  const actions = [
    { icon: Search, label: 'Research a stock', desc: 'Deep dive into any company or ticker' },
    { icon: BarChart3, label: 'Analyze portfolio', desc: 'Get AI-powered portfolio analysis' },
    { icon: DollarSign, label: 'Track expenses', desc: 'Categorize and analyze spending' },
    { icon: Newspaper, label: 'Financial news', desc: 'Summarize market news and trends' },
    { icon: LineChart, label: 'Compare assets', desc: 'Side-by-side asset performance' },
    { icon: TrendingUp, label: 'Get investment ideas', desc: 'Discover opportunities with AI agents' },
  ]

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-green-400" />
          <h2 className="text-sm font-medium text-white/80">Finance</h2>
        </div>
        <button onClick={() => setActiveSection('search')} className="text-[12px] text-white/30 hover:text-white/60 transition-colors">
          Back to chat
        </button>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-6 py-4 space-y-5">
          {/* Portfolio Summary */}
          <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-green-500/[0.03] to-transparent p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-wider text-white/30 font-medium">Portfolio Value</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">Live</span>
            </div>
            <div className="text-3xl font-semibold text-white/90">$124,582.40</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp size={14} className="text-green-400" />
              <span className="text-[13px] text-green-400">+$2,847.20</span>
              <span className="text-[11px] text-green-400/60">(+$1,240.50 today)</span>
            </div>
          </div>

          {/* Market Overview */}
          <div>
            <div className="text-[11px] uppercase tracking-wider text-white/25 font-medium mb-2 px-1">Market Overview</div>
            <div className="grid grid-cols-2 gap-2">
              {markets.map((m) => (
                <div key={m.symbol} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
                  <div>
                    <div className="text-[12px] font-medium text-white/70">{m.symbol}</div>
                    <div className="text-[10px] text-white/30">{m.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] font-mono text-white/80">${m.price.toLocaleString()}</div>
                    <div className={cn('text-[10px] font-mono', m.change >= 0 ? 'text-green-400' : 'text-red-400')}>
                      {m.change >= 0 ? '+' : ''}{m.change.toFixed(2)} ({m.change >= 0 ? '+' : ''}{m.changePct.toFixed(2)}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <div className="text-[11px] uppercase tracking-wider text-white/25 font-medium mb-2 px-1">Quick Actions</div>
            <div className="grid grid-cols-2 gap-2">
              {actions.map((a) => (
                <button
                  key={a.label}
                  onClick={() => setActiveSection('search')}
                  className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/10 group-hover:bg-green-500/15 transition-colors">
                    <a.icon size={14} className="text-green-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-medium text-white/70 group-hover:text-white/90 transition-colors">{a.label}</div>
                    <div className="text-[10px] text-white/30 mt-0.5 leading-tight">{a.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Conversations */}
          <div>
            <div className="text-[11px] uppercase tracking-wider text-white/25 font-medium mb-2 px-1">Recent Finance Chats</div>
            <div className="space-y-1.5">
              {['Analyzing NVDA earnings report', 'Portfolio rebalancing strategy', 'Bitcoin market analysis Q2'].map((t, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSection('search')}
                  className="flex w-full items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.01] px-3 py-2.5 hover:bg-white/[0.03] hover:border-white/[0.07] transition-all text-left group"
                >
                  <DollarSign size={12} className="shrink-0 text-green-400/50" />
                  <span className="flex-1 text-[12px] text-white/45 group-hover:text-white/65 transition-colors truncate">{t}</span>
                  <ArrowRight size={12} className="shrink-0 text-white/20 group-hover:text-white/40 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

/* ── Health Panel ─────────────────────────────────────────── */
function HealthPanel() {
  const { setActiveSection } = useUIStore()
  const [vitals] = useState({
    steps: { value: 8432, goal: 10000, unit: 'steps' },
    sleep: { value: 7.4, goal: 8, unit: 'hrs' },
    water: { value: 5, goal: 8, unit: 'glasses' },
    calories: { value: 1840, goal: 2200, unit: 'kcal' },
    heartRate: { value: 68, unit: 'bpm' },
    stress: { value: 'Low', level: 2 },
  })

  const quickActions = [
    { icon: Search, label: 'Research symptoms', desc: 'AI-powered health research' },
    { icon: Pill, label: 'Medication tracker', desc: 'Track and reminders' },
    { icon: Apple, label: 'Nutrition analysis', desc: 'Analyze diet and nutrition' },
    { icon: Dna, label: 'Health insights', desc: 'Personalized AI insights' },
    { icon: Thermometer, label: 'Symptom checker', desc: 'Check symptoms safely' },
    { icon: Wind, label: 'Breathing exercises', desc: 'Guided relaxation' },
  ]

  const progressColor = (current: number, goal: number) => {
    const pct = (current / goal) * 100
    if (pct >= 100) return 'bg-green-400'
    if (pct >= 70) return 'bg-cyan-400'
    if (pct >= 40) return 'bg-amber-400'
    return 'bg-red-400'
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Heart size={16} className="text-rose-400" />
          <h2 className="text-sm font-medium text-white/80">Health</h2>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400/70 ml-1">Beta</span>
        </div>
        <button onClick={() => setActiveSection('search')} className="text-[12px] text-white/30 hover:text-white/60 transition-colors">
          Back to chat
        </button>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-6 py-4 space-y-5">
          {/* Vitals Grid */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Steps', value: vitals.steps.value.toLocaleString(), goal: `${vitals.steps.goal.toLocaleString()}`, color: progressColor(vitals.steps.value, vitals.steps.goal), icon: Activity },
              { label: 'Sleep', value: `${vitals.sleep.value}h`, goal: `${vitals.sleep.goal}h`, color: progressColor(vitals.sleep.value, vitals.sleep.goal), icon: Activity },
              { label: 'Water', value: `${vitals.water.value}/${vitals.water.goal}`, goal: 'glasses', color: progressColor(vitals.water.value, vitals.water.goal), icon: Wind },
              { label: 'Calories', value: vitals.calories.value.toLocaleString(), goal: `${vitals.calories.goal}`, color: progressColor(vitals.calories.value, vitals.calories.goal), icon: Apple },
              { label: 'Heart Rate', value: vitals.heartRate.value, goal: vitals.heartRate.unit, color: 'bg-cyan-400', icon: Heart },
              { label: 'Stress', value: vitals.stress.value, goal: '', color: 'bg-cyan-400', icon: Activity },
            ].map((v) => (
              <div key={v.label} className="flex flex-col rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-wider text-white/25 font-medium">{v.label}</span>
                  <v.icon size={12} className="text-white/20" />
                </div>
                <div className="text-[18px] font-semibold text-white/90">{v.value}</div>
                {v.goal && (
                  <div className="text-[10px] text-white/25 mt-0.5">of {v.goal}</div>
                )}
                {v.label !== 'Heart Rate' && v.label !== 'Stress' && (
                  <div className="mt-2 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', v.color)}
                      style={{ width: `${Math.min((parseInt(String(v.value).replace(/,/g, '')) / parseInt(String(v.goal).replace(/,/g, ''))) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div>
            <div className="text-[11px] uppercase tracking-wider text-white/25 font-medium mb-2 px-1">Quick Actions</div>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((a) => (
                <button
                  key={a.label}
                  onClick={() => setActiveSection('search')}
                  className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 group-hover:bg-rose-500/15 transition-colors">
                    <a.icon size={14} className="text-rose-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-medium text-white/70 group-hover:text-white/90 transition-colors">{a.label}</div>
                    <div className="text-[10px] text-white/30 mt-0.5 leading-tight">{a.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Wellness Tips */}
          <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/[0.03] p-4">
            <div className="text-[12px] font-medium text-cyan-300/80 mb-2 flex items-center gap-1.5">
              <Activity size={14} />
              AI Wellness Insight
            </div>
            <p className="text-[12px] text-white/50 leading-relaxed">
              Based on your activity patterns, consider adding a 10-minute walk after meals. This can help regulate blood sugar levels and improve overall cardiovascular health.
            </p>
            <button className="mt-3 text-[11px] text-cyan-400/60 hover:text-cyan-400 transition-colors">
              Get personalized insights →
            </button>
          </div>

          {/* Recent Health Conversations */}
          <div>
            <div className="text-[11px] uppercase tracking-wider text-white/25 font-medium mb-2 px-1">Recent Health Chats</div>
            <div className="space-y-1.5">
              {['Sleep quality analysis this week', 'Macronutrient breakdown check', 'Exercise routine optimization'].map((t, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSection('search')}
                  className="flex w-full items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.01] px-3 py-2.5 hover:bg-white/[0.03] hover:border-white/[0.07] transition-all text-left group"
                >
                  <Heart size={12} className="shrink-0 text-rose-400/50" />
                  <span className="flex-1 text-[12px] text-white/45 group-hover:text-white/65 transition-colors truncate">{t}</span>
                  <ArrowRight size={12} className="shrink-0 text-white/20 group-hover:text-white/40 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

/* ── Spaces Panel ─────────────────────────────────────────── */
function SpacesPanel() {
  const { setActiveSection } = useUIStore()
  const { loadConversation } = useChatStore()
  const [spaces, setSpaces] = useState([
    {
      id: 'space-1',
      name: 'Deep Research',
      description: 'Multi-agent research swarm for in-depth analysis',
      agents: ['researcher', 'fact-checker', 'summarizer'],
      color: 'cyan',
      convCount: 12,
      lastUsed: Date.now() - 3600000,
    },
    {
      id: 'space-2',
      name: 'Code Assistant',
      description: 'Coding agents for development and debugging',
      agents: ['coder', 'browser'],
      color: 'violet',
      convCount: 8,
      lastUsed: Date.now() - 86400000,
    },
    {
      id: 'space-3',
      name: 'Quick Chat',
      description: 'Fast single-agent responses',
      agents: ['researcher'],
      color: 'amber',
      convCount: 24,
      lastUsed: Date.now() - 1800000,
    },
  ])
  const [showCreate, setShowCreate] = useState(false)
  const [newSpace, setNewSpace] = useState<{ name: string; description: string; agents: string[] }>({ name: '', description: '', agents: [] })

  const agentOptions = [
    { id: 'researcher', label: 'Researcher', desc: 'Web search & analysis' },
    { id: 'coder', label: 'Coder', desc: 'Code execution & review' },
    { id: 'browser', label: 'Browser', desc: 'Web interaction' },
    { id: 'fact-checker', label: 'Fact Checker', desc: 'Verify claims' },
    { id: 'summarizer', label: 'Summarizer', desc: 'Content summarization' },
  ]

  const colorMap: Record<string, string> = {
    cyan: 'bg-cyan-500/10 border-cyan-500/20 hover:bg-cyan-500/15',
    violet: 'bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/15',
    amber: 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15',
    green: 'bg-green-500/10 border-green-500/20 hover:bg-green-500/15',
    rose: 'bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/15',
  }

  const agentColorMap: Record<string, string> = {
    researcher: 'bg-cyan-500/10 text-cyan-400',
    coder: 'bg-violet-500/10 text-violet-400',
    browser: 'bg-green-500/10 text-green-400',
    'fact-checker': 'bg-amber-500/10 text-amber-400',
    summarizer: 'bg-rose-500/10 text-rose-400',
  }

  const handleCreateSpace = () => {
    if (!newSpace.name.trim()) return
    const colors = ['cyan', 'violet', 'amber', 'green', 'rose']
    const space = {
      id: `space-${Date.now()}`,
      name: newSpace.name,
      description: newSpace.description,
      agents: ['researcher'] as string[],
      color: colors[Math.floor(Math.random() * colors.length)],
      convCount: 0,
      lastUsed: Date.now(),
    }
    setSpaces([space, ...spaces])
    setNewSpace({ name: '', description: '', agents: [] })
    setShowCreate(false)
  }

  const handleOpenSpace = (space: typeof spaces[0]) => {
    loadConversation(space.id)
    setActiveSection('search')
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <LayoutGrid size={16} className="text-violet-400" />
          <h2 className="text-sm font-medium text-white/80">Spaces</h2>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 text-[12px] text-cyan-400/70 hover:text-cyan-400 transition-colors">
          <Plus size={14} />
          New Space
        </button>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-6 py-4 space-y-3">
          {spaces.map((space) => (
            <div
              key={space.id}
              className={cn(
                'rounded-xl border p-4 transition-all cursor-pointer group',
                colorMap[space.color] || colorMap.cyan
              )}
              onClick={() => handleOpenSpace(space)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-[14px] font-medium text-white/80 group-hover:text-white transition-colors">{space.name}</h3>
                  <p className="text-[11px] text-white/35 mt-0.5">{space.description}</p>
                </div>
                <ArrowRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors mt-1" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {space.agents.map((agent) => (
                  <span
                    key={agent}
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full font-medium capitalize',
                      agentColorMap[agent] || 'bg-white/10 text-white/40'
                    )}
                  >
                    {agent}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-3 pt-2 border-t border-white/[0.04]">
                <span className="text-[10px] text-white/25">{space.convCount} conversations</span>
                <span className="text-[10px] text-white/25">Last used {timeAgo(space.lastUsed)}</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Create Space Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#13161c] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-medium text-white/90 mb-1">Create New Space</h3>
            <p className="text-[12px] text-white/30 mb-5">Configure a custom agent workspace</p>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-white/30 font-medium mb-1.5 block">Name</label>
                <input
                  type="text"
                  value={newSpace.name}
                  onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })}
                  placeholder="e.g. Code Review, Research Bot"
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-[13px] text-white/80 placeholder:text-white/20 focus:outline-none focus:border-cyan-500/30 transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-white/30 font-medium mb-1.5 block">Description</label>
                <textarea
                  value={newSpace.description}
                  onChange={(e) => setNewSpace({ ...newSpace, description: e.target.value })}
                  placeholder="What this space is for..."
                  rows={2}
                  className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-[13px] text-white/80 placeholder:text-white/20 focus:outline-none focus:border-cyan-500/30 transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-white/30 font-medium mb-1.5 block">Agents</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {agentOptions.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => {
                        const current = newSpace.agents || []
                        const updated = current.includes(agent.id)
                          ? current.filter((a: string) => a !== agent.id)
                          : [...current, agent.id]
                        setNewSpace({ ...newSpace, agents: updated })
                      }}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all text-[12px]',
                        (newSpace.agents || []).includes(agent.id)
                          ? 'border-cyan-500/30 bg-cyan-500/10 text-white/80'
                          : 'border-white/[0.06] bg-white/[0.02] text-white/40 hover:text-white/60 hover:border-white/[0.1]'
                      )}
                    >
                      <div className={cn('h-1.5 w-1.5 rounded-full', (newSpace.agents || []).includes(agent.id) ? 'bg-cyan-400' : 'bg-white/20')} />
                      <span className="font-medium">{agent.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-[13px] text-white/50 hover:text-white/70 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSpace}
                disabled={!newSpace.name.trim()}
                className="flex-1 rounded-lg bg-cyan-500 px-4 py-2.5 text-[13px] font-medium text-black hover:bg-cyan-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Create Space
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default App