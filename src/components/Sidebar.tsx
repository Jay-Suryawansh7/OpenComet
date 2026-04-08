import { useState } from 'react'
import {
  Search, Monitor, Plus, Clock, Compass, LayoutGrid,
  ChevronLeft, ChevronRight, TrendingUp, Heart, MoreHorizontal,
  Zap, User,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'
import { useSettingsStore, useUIStore, useChatStore, type SidebarSection } from '@/store'
import { cn } from '@/lib/utils'

/* ── Sidebar navigation structure matching reference ─────── */

const TOP_NAV = [
  { id: 'search' as SidebarSection, label: 'Search', icon: Search },
  { id: 'computer' as SidebarSection, label: 'Computer', icon: Monitor },
]

const MAIN_NAV = [
  { id: 'history' as SidebarSection, label: 'History', icon: Clock },
  { id: 'discover' as SidebarSection, label: 'Discover', icon: Compass },
  { id: 'spaces' as SidebarSection, label: 'Spaces', icon: LayoutGrid },
  { id: 'settings' as SidebarSection, label: 'Finance', icon: TrendingUp },
  { id: 'settings' as SidebarSection, label: 'Health', icon: Heart },
]

const BOOKMARKS = [
  'do one thing list down all..',
]

const HISTORY_ITEMS = [
  'deepagents',
  'meta scaler',
  'how i can publish a app t..',
  'ryanstephan/ll-agents g..',
  'rayan stephan github',
  'npm',
  'agent os',
  'lil agents',
  'trim-safe npm',
  'koolur npm',
  'koolur npm',
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useSettingsStore()
  const { activeSection, setActiveSection } = useUIStore()
  const { clearMessages } = useChatStore()
  const [hovering, setHovering] = useState(false)

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
        {/* Collapse toggle */}
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

        {/* Top nav — Search, Computer */}
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

        {/* New thread */}
        <div className="px-1.5">
          <SidebarItem
            collapsed={collapsed}
            icon={Plus}
            label="New thread"
            onClick={() => {
              clearMessages()
              fetch('http://localhost:8765/clear', { method: 'POST' }).catch(() => {})
            }}
          />
        </div>

        {/* Main nav — History, Discover, Spaces, Finance, Health */}
        <nav className="space-y-[1px] px-1.5 mt-0.5">
          {MAIN_NAV.map((item, i) => (
            <SidebarItem
              key={item.label + i}
              collapsed={collapsed}
              icon={item.icon}
              label={item.label}
              onClick={() => {}}
            />
          ))}
          {/* More button */}
          <SidebarItem
            collapsed={collapsed}
            icon={MoreHorizontal}
            label="More"
            onClick={() => {}}
          />
        </nav>

        {/* Scrollable middle — bookmarks & history */}
        {!collapsed && (
          <ScrollArea className="flex-1 mt-1">
            {/* Bookmarks */}
            <SectionLabel text="Bookmarks" />
            <div className="px-1.5">
              {BOOKMARKS.map((b) => (
                <button
                  key={b}
                  className="flex w-full items-center rounded px-2 py-[3px] text-[11.5px] text-white/35 transition-colors hover:bg-white/[0.04] hover:text-white/55 truncate leading-snug"
                >
                  <span className="truncate">{b}</span>
                </button>
              ))}
            </div>

            <SectionLabel text="History" />
            <div className="px-1.5 pb-3">
              {HISTORY_ITEMS.map((h, i) => (
                <button
                  key={h + i}
                  className="flex w-full items-center rounded px-2 py-[3px] text-[11.5px] text-white/30 transition-colors hover:bg-white/[0.04] hover:text-white/50 truncate leading-snug"
                >
                  <span className="truncate">{h}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}

        {collapsed && <div className="flex-1" />}

        {/* Bottom — Upgrade + User */}
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

/* ── Sidebar nav item ─────────────────────────────────────── */
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

/* ── Section label ────────────────────────────────────────── */
function SectionLabel({ text }: { text: string }) {
  return (
    <div className="px-3 pt-3 pb-0.5">
      <span className="text-[10.5px] font-semibold text-white/20 leading-none">
        {text}
      </span>
    </div>
  )
}
