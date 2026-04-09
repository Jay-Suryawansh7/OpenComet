import { useState, useEffect, useRef, useMemo } from 'react';
import { useTabCycleStore } from '@/store/tabCycleStore';
import { cn } from '@/lib/utils';
import {
  Search, Pin, PinOff, Clock, Globe, X, ChevronRight
} from 'lucide-react';

interface TabCyclerProps {
  onSelect: (tabId: string) => void;
  onClose: () => void;
}

export function TabCycler({ onSelect, onClose }: TabCyclerProps) {
  const { history, pinTab, unpinTab, removeFromHistory, clearHistory } = useTabCycleStore();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredTabs = useMemo(() => {
    if (!search.trim()) return history;
    const q = search.toLowerCase();
    return history.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.url.toLowerCase().includes(q)
    );
  }, [history, search]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredTabs.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredTabs[selectedIndex]) {
          onSelect(filteredTabs[selectedIndex].id);
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  const handleTabClick = (tabId: string) => {
    onSelect(tabId);
  };

  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[400px] bg-[#1a1d24] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden">
      {/* Search */}
      <div className="p-3 border-b border-white/[0.06]">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tabs..."
            className="w-full pl-9 pr-8 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[12px] text-white/80 placeholder:text-white/30 focus:outline-none focus:border-cyan-500/30"
          />
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/30 hover:text-white/50 transition-colors"
              title="Clear history"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs list */}
      <div className="max-h-[300px] overflow-y-auto">
        {filteredTabs.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[12px] text-white/40">No tabs found</p>
            {history.length === 0 && (
              <p className="text-[11px] text-white/25 mt-1">Your recent tabs will appear here</p>
            )}
          </div>
        ) : (
          <div className="p-1">
            {filteredTabs.map((tab, index) => (
              <div
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                  index === selectedIndex
                    ? 'bg-cyan-500/10 border border-cyan-500/20'
                    : 'hover:bg-white/[0.04] border border-transparent'
                )}
              >
                <Globe size={14} className="text-white/40 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-white/80 truncate">
                    {tab.title || 'Untitled'}
                  </p>
                  <p className="text-[11px] text-white/40 truncate">
                    {tab.url}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] text-white/30 flex items-center gap-1">
                    <Clock size={10} />
                    {formatTime(tab.lastAccessed)}
                  </span>
                  {tab.isPinned ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        unpinTab(tab.id);
                      }}
                      className="p-1 text-amber-400/60 hover:text-amber-400 transition-colors"
                    >
                      <PinOff size={12} />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        pinTab(tab.id);
                      }}
                      className="p-1 text-white/30 hover:text-amber-400/60 transition-colors"
                    >
                      <Pin size={12} />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromHistory(tab.id);
                    }}
                    className="p-1 text-white/30 hover:text-red-400/60 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
                {index === selectedIndex && (
                  <ChevronRight size={14} className="text-cyan-400 shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center justify-between text-[10px] text-white/30">
          <span>{filteredTabs.length} tab{filteredTabs.length !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white/[0.06] rounded">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white/[0.06] rounded">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white/[0.06] rounded">Esc</kbd>
              Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
