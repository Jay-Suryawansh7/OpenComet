import { useState, useEffect, useCallback } from 'react'
import {
  Search, Monitor, Plus, Clock, Compass, LayoutGrid,
  ChevronLeft, ChevronRight, TrendingUp, Heart, MoreHorizontal,
  Zap, User, Star, Trash2,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'
import {
  useSettingsStore,
  useUIStore,
  useChatStore,
  type SidebarSection,
  type Conversation,
} from '@/store'
import { conversationStorage, settingsStorage } from '@/db/storage'
import { cn } from '@/lib/utils'

const TOP_NAV = [
  { id: 'search' as SidebarSection, label: 'Search', icon: Search },
  { id: 'computer' as SidebarSection, label: 'Computer', icon: Monitor },
]

const MAIN_NAV = [
  { id: 'history' as SidebarSection, label: 'History', icon: Clock },
  { id: 'discover' as SidebarSection, label: 'Discover', icon: Compass },
  { id: 'spaces' as SidebarSection, label: 'Spaces', icon: LayoutGrid },
  { id: 'finance' as SidebarSection, label: 'Finance', icon: TrendingUp },
  { id: 'health' as SidebarSection, label: 'Health', icon: Heart },
]

interface Bookmark {
  id: string
  title: string
  query: string
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

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useSettingsStore()
  const { activeSection, setActiveSection } = useUIStore()
  const { clearMessages, loadConversation, currentConversationId } = useChatStore()
  const [hovering, setHovering] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [convs, savedBookmarks] = await Promise.all([
        conversationStorage.getAll(),
        settingsStorage.get('bookmarks') as Promise<Bookmark[] | undefined>,
      ])
      setConversations(convs)
      setBookmarks(savedBookmarks || [])
    } catch (err) {
      console.error('Failed to load sidebar data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleNewThread = useCallback(async () => {
    clearMessages()
    fetch('http://localhost:8765/clear', { method: 'POST' }).catch(() => {})
    const newConv = await conversationStorage.create('New Conversation')
    await loadConversation(newConv.id)
    await loadData()
  }, [clearMessages, loadConversation, loadData])

  const handleConversationClick = useCallback(async (conv: Conversation) => {
    if (conv.id === currentConversationId) return
    await loadConversation(conv.id)
  }, [currentConversationId, loadConversation])

  const handleDeleteConversation = useCallback(async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation()
    await conversationStorage.delete(convId)
    await loadData()
    if (convId === currentConversationId) {
      const remaining = await conversationStorage.getAll()
      if (remaining.length > 0) {
        await loadConversation(remaining[0].id)
      }
    }
  }, [currentConversationId, loadConversation, loadData])

  const handleRemoveBookmark = useCallback(async (bookmarkId: string) => {
    const updated = bookmarks.filter(b => b.id !== bookmarkId)
    await settingsStorage.set('bookmarks', updated)
    setBookmarks(updated)
  }, [bookmarks])

  const collapsed = sidebarCollapsed

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className={cn(
          'group relative flex h-full flex-col border-r border-white/[0.06] bg-[#0e1117] transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)]',
          collapsed ? 'w-[52px]' : 'w-[220px]'
        )}
      >
        <button
          onClick={toggleSidebar}
          className={cn(
            'absolute -right-3 top-4 z-20 flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-[#161a22] text-white/40 shadow-md transition-all hover:bg-white/10 hover:text-white',
            !hovering && !collapsed && 'opacity-0',
            hovering && 'opacity-100'
          )}
        >
          {collapsed ? <ChevronRight size={10} /> : <ChevronLeft size={10} />}
        </button>

        <nav className="space-y-[1px] px-1.5 pt-2">
          {TOP_NAV.map((item) => (
            <SidebarItem
              key={item.label}
              collapsed={collapsed}
              icon={item.icon}
              label={item.label}
              active={activeSection === item.id}
              onClick={() => setActiveSection(item.id)}
            />
          ))}
        </nav>

        <Separator className="mx-2 my-1.5" />

        <div className="px-1.5">
          <SidebarItem
            collapsed={collapsed}
            icon={Plus}
            label="New thread"
            onClick={handleNewThread}
          />
        </div>

        <nav className="space-y-[1px] px-1.5 mt-0.5">
          {MAIN_NAV.map((item, i) => (
            <SidebarItem
              key={item.label + i}
              collapsed={collapsed}
              icon={item.icon}
              label={item.label}
              active={activeSection === item.id}
              onClick={() => setActiveSection(item.id)}
            />
          ))}
          <SidebarItem
            collapsed={collapsed}
            icon={MoreHorizontal}
            label="More"
            onClick={() => {}}
          />
        </nav>

        {!collapsed && (
          <ScrollArea className="flex-1 mt-1">
            {bookmarks.length > 0 && (
              <>
                <SectionLabel text="Bookmarks" />
                <div className="px-1.5">
                  {bookmarks.map((b) => (
                    <div
                      key={b.id}
                      className="group/bookmark flex w-full items-center gap-1 rounded px-2 py-[3px] text-[11.5px] text-white/35 transition-colors hover:bg-white/[0.04] hover:text-white/55 truncate leading-snug"
                    >
                      <Star size={10} className="shrink-0 text-cyan-400/50" />
                      <span
                        className="flex-1 truncate cursor-pointer"
                        onClick={() => handleConversationClick({
                          id: b.id,
                          title: b.query,
                          createdAt: Date.now(),
                          updatedAt: Date.now(),
                        })}
                      >
                        {b.title}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveBookmark(b.id) }}
                        className="opacity-0 group-hover/bookmark:opacity-100 transition-opacity shrink-0 p-0.5 hover:text-red-400"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            <SectionLabel text="History" />
            <div className="px-1.5 pb-3">
              {loading ? (
                <div className="px-2 py-[3px] text-[11.5px] text-white/20">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="px-2 py-[3px] text-[11.5px] text-white/20">No conversations yet</div>
              ) : (
                conversations.map((conv) => {
                  const isActive = conv.id === currentConversationId
                  return (
                    <div
                      key={conv.id}
                      onClick={() => handleConversationClick(conv)}
                      className={cn(
                        'group/conv flex w-full items-center gap-1 rounded px-2 py-[3px] text-[11.5px] text-white/30 transition-colors truncate leading-snug cursor-pointer',
                        isActive
                          ? 'bg-white/[0.06] text-white/60'
                          : 'hover:bg-white/[0.04] hover:text-white/50'
                      )}
                    >
                      <Clock size={10} className="shrink-0" />
                      <span className="flex-1 truncate">{conv.title || 'New conversation'}</span>
                      <span className="shrink-0 text-[10px] text-white/15">
                        {timeAgo(conv.updatedAt)}
                      </span>
                      <button
                        onClick={(e) => handleDeleteConversation(e, conv.id)}
                        className="opacity-0 group-hover/conv:opacity-100 transition-opacity shrink-0 p-0.5 hover:text-red-400"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>
        )}

        {collapsed && <div className="flex-1" />}

        {!collapsed && (
          <div className="px-2 pb-2">
            <Separator className="mb-2" />
            <button className="flex w-full items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[11px] text-white/40 hover:bg-white/[0.05] transition-colors">
              <Zap size={11} className="text-white/30" />
              <span>Upgrade plan</span>
            </button>
            <div className="flex items-center gap-2 mt-2 px-1">
              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
                <User size={10} className="text-black" />
              </div>
              <span className="text-[11px] text-white/35 truncate">jaysuryawa312…</span>
              <div className="ml-auto flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400/60" />
              </div>
            </div>
          </div>
        )}
      </aside>
    </TooltipProvider>
  )
}

function SidebarItem({
  collapsed, icon: Icon, label, active, onClick,
}: {
  collapsed: boolean
  icon: React.ElementType
  label: string
  active?: boolean
  onClick?: () => void
}) {
  const inner = (
    <button
      onClick={onClick}
      className={cn(
        'group/btn flex w-full items-center gap-2 rounded-md px-2 py-[5px] text-[13px] transition-all duration-100',
        active
          ? 'bg-white/[0.07] text-white/90'
          : 'text-white/45 hover:bg-white/[0.04] hover:text-white/70',
        collapsed && 'justify-center px-0'
      )}
    >
      <Icon
        size={15}
        strokeWidth={active ? 2.2 : 1.8}
        className={cn(
          'shrink-0 transition-colors',
          active ? 'text-cyan-400' : 'text-white/35 group-hover/btn:text-white/50'
        )}
      />
      {!collapsed && <span className="truncate leading-none">{label}</span>}
    </button>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{inner}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    )
  }

  return inner
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div className="px-3 pt-3 pb-0.5">
      <span className="text-[10.5px] font-semibold text-white/20 leading-none">
        {text}
      </span>
    </div>
  )
}
