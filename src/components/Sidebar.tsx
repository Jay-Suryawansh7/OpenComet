import { useState } from 'react'
import {
  Search, Monitor, Plus, Clock, Compass, LayoutGrid,
  ChevronLeft, ChevronRight, Heart, Bookmark,
  Settings, ChevronsUpDown, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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

const NAV_ITEMS: { id: SidebarSection; label: string; icon: React.ElementType }[] = [
  { id: 'search', label: 'Search', icon: Search },
  { id: 'computer', label: 'Computer', icon: Monitor },
]

const SECONDARY_ITEMS: { id: SidebarSection; label: string; icon: React.ElementType }[] = [
  { id: 'history', label: 'History', icon: Clock },
  { id: 'discover', label: 'Discover', icon: Compass },
  { id: 'spaces', label: 'Spaces', icon: LayoutGrid },
]

const BOOKMARKS = [
  'Summarise my inbox',
  'Research latest AI papers',
  'Compare flight prices',
]

const HISTORY = [
  'meta scaler',
  'how i can publish a app to..',
  'ryanstephan/ll-agents',
  'npm opencomet',
  'agent os architecture',
  'opencomet npm package',
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
          'group relative flex h-full flex-col border-r border-white/[0.06] bg-[#0c0e12] transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)]',
          collapsed ? 'w-[52px]' : 'w-[240px]'
        )}
      >
        {/* Collapse toggle — floats on the edge */}
        <button
          onClick={toggleSidebar}
          className={cn(
            'absolute -right-3 top-5 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#161a22] text-white/50 shadow-lg transition-all hover:bg-white/10 hover:text-white',
            !hovering && !collapsed && 'opacity-0',
            hovering && 'opacity-100'
          )}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Logo */}
        <div className={cn('flex items-center gap-2.5 px-3 pt-4 pb-1', collapsed && 'justify-center')}>
          <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-teal-600 shadow-[0_0_12px_rgba(34,211,238,0.35)]">
            <Zap size={14} strokeWidth={2.5} className="text-black" />
          </div>
          {!collapsed && (
            <span className="text-[15px] font-semibold tracking-tight text-white/90">
              OpenComet
            </span>
          )}
        </div>

        <div className="px-2 pt-3">
          {/* New Thread */}
          <SidebarButton
            collapsed={collapsed}
            icon={Plus}
            label="New thread"
            onClick={() => {
              clearMessages()
              fetch('http://localhost:8765/clear', { method: 'POST' }).catch(() => {})
            }}
            accent
          />
        </div>

        <Separator className="mx-3 my-2" />

        {/* Primary nav */}
        <nav className="space-y-0.5 px-2">
          {NAV_ITEMS.map((item) => (
            <SidebarButton
              key={item.id}
              collapsed={collapsed}
              icon={item.icon}
              label={item.label}
              active={activeSection === item.id}
              onClick={() => setActiveSection(item.id)}
            />
          ))}
        </nav>

        <Separator className="mx-3 my-2" />

        {/* Secondary nav */}
        <nav className="space-y-0.5 px-2">
          {SECONDARY_ITEMS.map((item) => (
            <SidebarButton
              key={item.id}
              collapsed={collapsed}
              icon={item.icon}
              label={item.label}
              active={activeSection === item.id}
              onClick={() => setActiveSection(item.id)}
            />
          ))}
        </nav>

        {/* Scrollable middle — bookmarks & history */}
        {!collapsed && (
          <ScrollArea className="flex-1 mt-2 px-2">
            {/* Bookmarks */}
            <SidebarHeading text="Bookmarks" />
            <div className="space-y-0.5">
              {BOOKMARKS.map((b) => (
                <button
                  key={b}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-white/45 transition-colors hover:bg-white/5 hover:text-white/70 truncate"
                >
                  <Bookmark size={13} className="shrink-0 text-white/25" />
                  <span className="truncate">{b}</span>
                </button>
              ))}
            </div>

            <SidebarHeading text="History" />
            <div className="space-y-0.5 pb-4">
              {HISTORY.map((h) => (
                <button
                  key={h}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-white/40 transition-colors hover:bg-white/5 hover:text-white/65 truncate"
                >
                  <span className="truncate">{h}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}

        {collapsed && <div className="flex-1" />}

        {/* Bottom section */}
        <div className="px-2 pb-3">
          <Separator className="mx-1 mb-2" />
          <SidebarButton
            collapsed={collapsed}
            icon={Settings}
            label="Settings"
            active={activeSection === 'settings'}
            onClick={() => setActiveSection('settings')}
          />
          {!collapsed && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-500/15 px-3 py-2">
              <Heart size={14} className="text-cyan-400" />
              <span className="text-[12px] text-white/50">Open Source</span>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}

/* ── Reusable sub-components ──────────────────────────────── */

function SidebarButton({
  collapsed, icon: Icon, label, active, onClick, accent,
}: {
  collapsed: boolean
  icon: React.ElementType
  label: string
  active?: boolean
  onClick?: () => void
  accent?: boolean
}) {
  const inner = (
    <button
      onClick={onClick}
      className={cn(
        'group/btn flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium transition-all duration-150',
        active
          ? 'bg-white/[0.08] text-white shadow-sm'
          : 'text-white/50 hover:bg-white/[0.04] hover:text-white/80',
        accent && !active && 'text-cyan-400/80 hover:text-cyan-300',
        collapsed && 'justify-center px-0'
      )}
    >
      <Icon
        size={16}
        className={cn(
          'shrink-0 transition-colors',
          active ? 'text-cyan-400' : accent ? 'text-cyan-400/70' : 'text-white/40 group-hover/btn:text-white/60'
        )}
      />
      {!collapsed && <span className="truncate">{label}</span>}
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

function SidebarHeading({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 px-2 pt-4 pb-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-white/25">
        {text}
      </span>
    </div>
  )
}
