import { useState, useEffect } from 'react';
import { useMemoryStore } from '@/store/memoryStore';
import { cn } from '@/lib/utils';
import {
  Brain, Search, Trash2, X, Globe, Clock,
  Bookmark, Info
} from 'lucide-react';

interface MemoryPanelProps {
  onClose: () => void;
}

type TabType = 'memories' | 'browsing' | 'settings';

export function MemoryPanel({ onClose }: MemoryPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('memories');
  
  const {
    settings,
    setMemoryEnabled,
    setDecayDays,
    setTrackBrowsing,
    setTrackSearches,
    clearAllMemories,
    clearBrowsingHistory,
    memoryStats,
    loadMemoryStats,
    recentMemories,
    loadRecentMemories,
  } = useMemoryStore();

  useEffect(() => {
    loadMemoryStats();
    loadRecentMemories();
  }, []);

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to delete all memories? This cannot be undone.')) {
      await clearAllMemories();
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'site_visit':
        return <Globe size={14} className="text-cyan-400" />;
      case 'search_query':
        return <Search size={14} className="text-violet-400" />;
      case 'bookmark':
        return <Bookmark size={14} className="text-yellow-400" />;
      case 'interaction':
        return <Clock size={14} className="text-emerald-400" />;
      default:
        return <Brain size={14} className="text-white/40" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[600px] max-h-[80vh] bg-[#1a1b20] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center">
              <Brain size={20} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-white/90">Agent Memory</h2>
              <p className="text-[11px] text-white/40">Context-aware responses powered by memory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/[0.08] transition-colors"
          >
            <X size={18} className="text-white/40" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-4 gap-2">
          {(['memories', 'browsing', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 rounded-lg text-[13px] font-medium transition-all',
                activeTab === tab
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                  : 'text-white/50 hover:text-white/70 hover:bg-white/[0.04]'
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'memories' && memoryStats && (
                <span className="ml-2 text-[11px] opacity-60">({memoryStats.totalMemories})</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'memories' && (
            <div className="space-y-4">
              {/* Stats Card */}
              {memoryStats && (
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-[20px] font-semibold text-white/90">{memoryStats.totalMemories}</div>
                    <div className="text-[10px] text-white/40">Total Memories</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-[20px] font-semibold text-cyan-400">{memoryStats.byType.context || 0}</div>
                    <div className="text-[10px] text-white/40">Context</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-[20px] font-semibold text-violet-400">{memoryStats.byType.fact || 0}</div>
                    <div className="text-[10px] text-white/40">Facts</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-[20px] font-semibold text-yellow-400">{memoryStats.byType.preference || 0}</div>
                    <div className="text-[10px] text-white/40">Preferences</div>
                  </div>
                </div>
              )}

              {/* Info Banner */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                <Info size={16} className="text-cyan-400 mt-0.5 shrink-0" />
                <div className="text-[12px] text-white/60 leading-relaxed">
                  Memory helps the agent provide context-aware responses by remembering your preferences,
                  recent topics, and browsing history.
                </div>
              </div>

              {/* Memory Types Legend */}
              <div className="space-y-2">
                <h3 className="text-[12px] font-medium text-white/50 uppercase tracking-wider">Memory Types</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: 'Context', color: 'cyan', desc: 'Conversation topics and questions' },
                    { type: 'Facts', color: 'violet', desc: 'Extracted factual information' },
                    { type: 'Preferences', color: 'yellow', desc: 'Your stated preferences' },
                    { type: 'Knowledge', color: 'emerald', desc: 'Learned general knowledge' },
                  ].map((item) => (
                    <div key={item.type} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
                      <div className={cn(
                        'w-2 h-2 rounded-full',
                        item.color === 'cyan' && 'bg-cyan-400',
                        item.color === 'violet' && 'bg-violet-400',
                        item.color === 'yellow' && 'bg-yellow-400',
                        item.color === 'emerald' && 'bg-emerald-400'
                      )} />
                      <div>
                        <div className="text-[12px] text-white/70">{item.type}</div>
                        <div className="text-[10px] text-white/30">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'browsing' && (
            <div className="space-y-4">
              {/* Clear History Button */}
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-medium text-white/70">Recent Browsing</h3>
                <button
                  onClick={clearBrowsingHistory}
                  className="text-[12px] text-red-400/70 hover:text-red-400 transition-colors"
                >
                  Clear History
                </button>
              </div>

              {/* Browsing List */}
              {recentMemories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Globe size={40} className="text-white/10 mb-3" />
                  <p className="text-[13px] text-white/40">No browsing history</p>
                  <p className="text-[11px] text-white/25 mt-1">Sites you visit will appear here</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentMemories.slice(0, 20).map((memory) => (
                    <div
                      key={memory.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.04] transition-colors group"
                    >
                      {getTypeIcon(memory.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-white/70 truncate">{memory.content}</p>
                        {memory.url && (
                          <p className="text-[10px] text-white/30 truncate">{memory.url}</p>
                        )}
                      </div>
                      <span className="text-[10px] text-white/30 shrink-0">
                        {formatTime(memory.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Enable Memory */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-medium text-white/80">Enable Memory</div>
                  <div className="text-[11px] text-white/40">Remember context across conversations</div>
                </div>
                <button
                  onClick={() => setMemoryEnabled(!settings.memoryEnabled)}
                  className={cn(
                    'w-12 h-6 rounded-full transition-colors relative',
                    settings.memoryEnabled ? 'bg-cyan-500' : 'bg-white/10'
                  )}
                >
                  <div className={cn(
                    'w-5 h-5 rounded-full bg-white shadow transition-transform absolute top-0.5',
                    settings.memoryEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  )} />
                </button>
              </div>

              {/* Decay Days */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[14px] font-medium text-white/80">Memory Decay</div>
                    <div className="text-[11px] text-white/40">Auto-delete after {settings.decayDays} days</div>
                  </div>
                </div>
                <input
                  type="range"
                  min="7"
                  max="90"
                  value={settings.decayDays}
                  onChange={(e) => setDecayDays(parseInt(e.target.value))}
                  className="w-full h-2 rounded-full bg-white/10 appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-[10px] text-white/30">
                  <span>7 days</span>
                  <span>90 days</span>
                </div>
              </div>

              {/* Tracking Options */}
              <div className="space-y-3">
                <div className="text-[12px] font-medium text-white/50 uppercase tracking-wider">Tracking</div>
                
                <div className="flex items-center justify-between">
                  <div className="text-[13px] text-white/70">Track site visits</div>
                  <button
                    onClick={() => setTrackBrowsing(!settings.trackBrowsing)}
                    className={cn(
                      'w-10 h-5 rounded-full transition-colors relative',
                      settings.trackBrowsing ? 'bg-cyan-500' : 'bg-white/10'
                    )}
                  >
                    <div className={cn(
                      'w-4 h-4 rounded-full bg-white shadow transition-transform absolute top-0.5',
                      settings.trackBrowsing ? 'translate-x-5' : 'translate-x-0.5'
                    )} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-[13px] text-white/70">Track search queries</div>
                  <button
                    onClick={() => setTrackSearches(!settings.trackSearches)}
                    className={cn(
                      'w-10 h-5 rounded-full transition-colors relative',
                      settings.trackSearches ? 'bg-cyan-500' : 'bg-white/10'
                    )}
                  >
                    <div className={cn(
                      'w-4 h-4 rounded-full bg-white shadow transition-transform absolute top-0.5',
                      settings.trackSearches ? 'translate-x-5' : 'translate-x-0.5'
                    )} />
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-4 border-t border-white/[0.06]">
                <button
                  onClick={handleClearAll}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 size={16} />
                  <span className="text-[13px] font-medium">Delete All Memories</span>
                </button>
                <p className="text-[10px] text-white/30 text-center mt-2">
                  This will permanently delete all memories and browsing history
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
