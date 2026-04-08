import { useEffect, useRef } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { ChatInput } from '@/components/ChatInput'
import { SuggestionCards } from '@/components/SuggestionCards'
import { ProviderSettings } from '@/components/ProviderSettings'
import { useChatStore, useUIStore } from '@/store'
import { useAgent } from '@/hooks/useAgent'
import { cn } from '@/lib/utils'
import { Zap, Sparkles } from 'lucide-react'

function App() {
  const { messages, isLoading } = useChatStore()
  const { sendMessage, error } = useAgent()
  const { activeSection } = useUIStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (content: string) => {
    await sendMessage(content)
  }

  const showingChat = messages.length > 0

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0a0c10]">
      {/* ── Full-width browser chrome ─────────────────────── */}
      <BrowserTopBar />

      {/* ── Body: sidebar + content ──────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="relative flex flex-1 flex-col overflow-hidden">
          {activeSection === 'settings' ? (
            <ProviderSettings />
          ) : (
            <>
              {/* Sub-toolbar: ad shield badge centered in content area */}
              <ContentToolbar />

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
   Full-width browser chrome bar (above sidebar + content)
   ═══════════════════════════════════════════════════════════ */
function BrowserTopBar() {
  return (
    <div className="flex items-center h-10 shrink-0 border-b border-white/[0.06] bg-[#111318] px-3 gap-3 z-20">
      {/* Navigation arrows */}
      <div className="flex items-center gap-0.5">
        <NavButton>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </NavButton>
        <NavButton>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </NavButton>
      </div>

      {/* Refresh */}
      <NavButton>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
          <path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
        </svg>
      </NavButton>

      {/* Lock / secure icon */}
      <NavButton>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </NavButton>

      {/* URL / omnibar */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-[13px] text-white/30 truncate cursor-text select-none">
          Ask anything or navigate…
        </span>
      </div>

      {/* ── Right-side toolbar icons ──────────────────────── */}
      <div className="flex items-center gap-0.5">
        {/* Edit / compose */}
        <NavButton>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </NavButton>

        {/* Screenshot / camera */}
        <NavButton>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </NavButton>

        {/* Share / external */}
        <NavButton>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </NavButton>

        {/* List / menu */}
        <NavButton>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </NavButton>

        {/* Bar chart / stats */}
        <NavButton>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </NavButton>
      </div>

      {/* Divider */}
      <div className="h-4 w-[1px] bg-white/[0.08] mx-1" />

      {/* Assistant pill */}
      <button className="flex items-center gap-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.09] border border-white/[0.06] px-3 py-1 transition-all">
        <div className="h-4 w-4 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-[0_0_8px_rgba(34,211,238,0.3)]">
          <Sparkles size={9} className="text-black" />
        </div>
        <span className="text-[12px] font-medium text-white/60">Assistant</span>
      </button>
    </div>
  )
}

/* ── Content sub-toolbar (shield badge centered) ──────────── */
function ContentToolbar() {
  return (
    <div className="flex items-center justify-center h-9 shrink-0 border-b border-white/[0.04] bg-[#0c0e12]">
      {/* Ad shield badge */}
      <div className="flex items-center gap-1.5 rounded-full bg-cyan-500/8 border border-cyan-500/12 px-3 py-1">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-cyan-400">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-[11px] font-medium text-cyan-400/70">45.3K ads and trackers blocked</span>
      </div>

      {/* Right-side floating icon */}
      <button className="absolute right-4 p-1.5 rounded-lg text-white/20 hover:text-white/40 hover:bg-white/5 transition-all">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      </button>
    </div>
  )
}

/* ── Home (empty state) ──────────────────────────────────── */
function HomeView({ onSubmit, isLoading }: { onSubmit: (msg: string) => void; isLoading: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient background orbs */}
      <div className="ambient-glow bg-cyan-500/10 top-1/4 left-1/3" />
      <div className="ambient-glow bg-teal-500/8 bottom-1/4 right-1/4" style={{ animationDelay: '-5s' }} />

      <div className="relative z-10 flex flex-col items-center gap-8 w-full px-6">
        <ChatInput onSubmit={onSubmit} isLoading={isLoading} />
        <SuggestionCards onSelect={onSubmit} />

        <div className="flex items-center gap-6 mt-4">
          <button className="flex items-center gap-2 text-[13px] text-white/30 hover:text-white/50 transition-colors">
            <Zap size={14} className="text-cyan-500/50" />
            Try Assistant
          </button>
          <button className="flex items-center gap-2 text-[13px] text-white/30 hover:text-white/50 transition-colors">
            <Sparkles size={14} className="text-white/20" />
            Customise
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
        <div className="max-w-[680px] mx-auto space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed',
                  message.role === 'user'
                    ? 'bg-cyan-500/15 text-white/85 border border-cyan-500/10'
                    : message.role === 'system'
                    ? 'bg-red-500/10 text-red-300/80 border border-red-500/10'
                    : 'bg-white/[0.04] text-white/70 border border-white/[0.05]'
                )}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-white/[0.04] border border-white/[0.05] px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="typing-dot h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    <span className="typing-dot h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    <span className="typing-dot h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  </div>
                  <span className="text-[13px] text-white/30">Thinking…</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="shrink-0 px-6 pb-6 pt-2 bg-gradient-to-t from-[#0a0c10] via-[#0a0c10] to-transparent">
        <ChatInput onSubmit={onSubmit} isLoading={isLoading} />
        {error && (
          <div className="max-w-[680px] mx-auto mt-2 text-[13px] text-red-400/70">{error}</div>
        )}
      </div>
    </div>
  )
}

/* ── Reusable nav button ──────────────────────────────────── */
function NavButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="flex h-7 w-7 items-center justify-center rounded-md text-white/25 hover:text-white/50 hover:bg-white/[0.04] transition-all">
      {children}
    </button>
  )
}

export default App