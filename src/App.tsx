import { useEffect, useRef, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { ChatInput } from '@/components/ChatInput'
import { SuggestionCards } from '@/components/SuggestionCards'
import { ProviderSettings } from '@/components/ProviderSettings'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useChatStore, useUIStore, useAgentMonitorStore, useSettingsStore } from '@/store'
import { useAgent } from '@/hooks/useAgent'
import { cn } from '@/lib/utils'
import { Sparkles, Settings2, Zap, Activity, Clock, Compass, LayoutGrid, Trash2 } from 'lucide-react'

function App() {
  const { messages, isLoading } = useChatStore()
  const { sendMessage, error } = useAgent()
  const { activeSection } = useUIStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const init = async () => {
      const { initialize } = useChatStore.getState()
      const { loadSettings } = useSettingsStore.getState()
      await initialize()
      await loadSettings()
    }
    init()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (content: string) => {
    await sendMessage(content)
  }

  const showingChat = messages.length > 0 || isLoading

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0d1017]">
      {/* ── Browser chrome — full width ──────────────────── */}
      <BrowserChrome />

      {/* ── Body — sidebar + content ─────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="relative flex flex-1 flex-col overflow-hidden">
          {activeSection === 'settings' ? (
            <ProviderSettings />
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
          ) : (
            <>
              <ShieldBar />

              {showingChat ? (
                <ChatView
                  messages={messages}
                  isLoading={isLoading}
                  onSubmit={handleSubmit}
                  messagesEndRef={messagesEndRef}
                  error={error}
                />
              ) : (
                <HomeView onSubmit={handleSubmit} isLoading={isLoading} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Browser chrome top bar
   ═══════════════════════════════════════════════════════════ */
function BrowserChrome() {
  return (
    <div className="flex items-center h-[34px] shrink-0 border-b border-white/[0.06] bg-[#111419] px-2.5 gap-2 z-20">
      {/* Nav arrows */}
      <div className="flex items-center gap-0">
        <NavBtn><ChevronSVG dir="left" /></NavBtn>
        <NavBtn><ChevronSVG dir="right" /></NavBtn>
      </div>

      {/* Refresh */}
      <NavBtn>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
          <path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
        </svg>
      </NavBtn>

      {/* Lock */}
      <NavBtn>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </NavBtn>

      {/* URL bar area */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {/* Colored favicon/icon */}
        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-gradient-to-br from-cyan-400 to-teal-500">
          <Zap size={8} className="text-black" />
        </div>
        <span className="text-[12.5px] text-white/30 truncate select-none">
          Ask anything or navigate…
        </span>
      </div>

      {/* Right toolbar icons */}
      <div className="flex items-center gap-0">
        {/* Camera/eye */}
        <NavBtn>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
        </NavBtn>

        {/* Link */}
        <NavBtn>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        </NavBtn>

        {/* Screenshot */}
        <NavBtn>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </NavBtn>

        {/* Share */}
        <NavBtn>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
        </NavBtn>

        {/* List */}
        <NavBtn>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
        </NavBtn>

        {/* Chart */}
        <NavBtn>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        </NavBtn>
      </div>

      {/* Divider */}
      <div className="h-3.5 w-[1px] bg-white/[0.08]" />

      {/* Assistant pill */}
      <button className="flex items-center gap-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.05] px-2.5 py-[3px] transition-all">
        <div className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-violet-400 to-cyan-400 flex items-center justify-center">
          <Sparkles size={7} className="text-white" />
        </div>
        <span className="text-[11.5px] font-medium text-white/55">Assistant</span>
      </button>
    </div>
  )
}

/* ── Shield badge bar ────────────────────────────────────── */
function ShieldBar() {
  const { agentStates } = useAgentMonitorStore()
  const activeAgents = Object.entries(agentStates).filter(([_, status]) => status === 'busy')
  
  return (
    <div className="relative flex items-center justify-center h-[30px] shrink-0 border-b border-white/[0.03] bg-[#0d1017]">
      {/* Agent status indicators */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-full bg-cyan-500/[0.06] border border-cyan-500/[0.08] px-2.5 py-[2px]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-cyan-400">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[11px] font-medium text-cyan-400/60">
            {activeAgents.length > 0 
              ? `${activeAgents.length} agent${activeAgents.length > 1 ? 's' : ''} active`
              : 'Swarm Ready'
            }
          </span>
        </div>

        {/* Active agent pills */}
        {activeAgents.slice(0, 3).map(([agent]) => (
          <div key={agent} className="flex items-center gap-1 rounded-full bg-violet-500/[0.06] border border-violet-500/[0.08] px-2 py-[1px]">
            <Activity size={9} className="text-violet-400 animate-pulse" />
            <span className="text-[10px] font-medium text-violet-400/60 capitalize">{agent}</span>
          </div>
        ))}
      </div>

      {/* Right icon */}
      <button className="absolute right-3 text-white/15 hover:text-white/30 transition-colors">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      </button>
    </div>
  )
}

/* ── Home (empty state) ──────────────────────────────────── */
function HomeView({ onSubmit, isLoading }: { onSubmit: (msg: string) => void; isLoading: boolean }) {
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
          <button className="flex items-center gap-1.5 text-[12.5px] text-white/30 hover:text-white/50 transition-colors">
            <Zap size={13} className="text-cyan-500/40" />
            Try Assistant
          </button>
          <button className="flex items-center gap-1.5 text-[12.5px] text-white/30 hover:text-white/50 transition-colors">
            <Settings2 size={13} className="text-white/20" />
            Customize
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Chat message view ───────────────────────────────────── */
function ChatView({
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

function SpacesPanel() {
  const { setActiveSection } = useUIStore()
  
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <LayoutGrid size={16} className="text-cyan-400" />
          <h2 className="text-sm font-medium text-white/80">Spaces</h2>
        </div>
        <button onClick={() => setActiveSection('search')} className="text-[12px] text-white/30 hover:text-white/60 transition-colors">
          Back to chat
        </button>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-6 py-4">
          <p className="text-[12px] text-white/30 mb-4">Your agent workspaces</p>
          <div className="text-[13px] text-white/30 py-8 text-center">
            No spaces yet — start a conversation to create one
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

/* ── Tiny helpers ─────────────────────────────────────────── */
function NavBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="flex h-[24px] w-[24px] items-center justify-center rounded text-white/20 hover:text-white/45 hover:bg-white/[0.04] transition-all">
      {children}
    </button>
  )
}

function ChevronSVG({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {dir === 'left' ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
    </svg>
  )
}

export default App