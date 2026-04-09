import { useState } from 'react';
import { useAdblockStore } from '@/store/adblockStore';
import { cn } from '@/lib/utils';
import {
  Shield, ShieldCheck, Plus, Trash2, X
} from 'lucide-react';

export function AdblockSettings() {
  const {
    enabled,
    filterLists,
    customRules,
    whitelistedDomains,
    blockedCount,
    showStats,
    setEnabled,
    toggleFilterList,
    addCustomRule,
    removeCustomRule,
    toggleCustomRule,
    addWhitelistedDomain,
    removeWhitelistedDomain,
    resetBlockedCount,
  } = useAdblockStore();

  const [newRule, setNewRule] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [activeTab, setActiveTab] = useState<'filters' | 'rules' | 'whitelist'>('filters');

  const handleAddRule = () => {
    if (newRule.trim()) {
      addCustomRule(newRule.trim(), 'block');
      setNewRule('');
    }
  };

  const handleAddDomain = () => {
    if (newDomain.trim()) {
      addWhitelistedDomain(newDomain.trim());
      setNewDomain('');
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            enabled ? 'bg-emerald-500/20' : 'bg-white/5'
          )}>
            {enabled ? (
              <ShieldCheck size={20} className="text-emerald-400" />
            ) : (
              <Shield size={20} className="text-white/40" />
            )}
          </div>
          <div>
            <h2 className="text-[16px] font-semibold text-white/90">Adblock</h2>
            <p className="text-[12px] text-white/40">
              {enabled ? `${blockedCount} ads blocked` : 'Disabled'}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setEnabled(!enabled)}
          className={cn(
            'relative w-12 h-6 rounded-full transition-colors',
            enabled ? 'bg-emerald-500' : 'bg-white/10'
          )}
        >
          <div
            className={cn(
              'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
              enabled ? 'translate-x-7' : 'translate-x-1'
            )}
          />
        </button>
      </div>

      {/* Stats bar */}
      {showStats && enabled && blockedCount > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] mb-4">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-emerald-400" />
            <span className="text-[13px] text-white/70">
              <span className="font-semibold text-emerald-400">{blockedCount.toLocaleString()}</span> ads blocked
            </span>
          </div>
          <button
            onClick={resetBlockedCount}
            className="text-[11px] text-white/30 hover:text-white/50 transition-colors"
          >
            Reset
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/[0.02] rounded-xl mb-4">
        {(['filters', 'rules', 'whitelist'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors',
              activeTab === tab
                ? 'bg-white/[0.08] text-white/90'
                : 'text-white/40 hover:text-white/60'
            )}
          >
            {tab === 'filters' ? 'Filter Lists' : tab === 'rules' ? 'Custom Rules' : 'Whitelist'}
          </button>
        ))}
      </div>

      {/* Filter Lists */}
      {activeTab === 'filters' && (
        <div className="space-y-2">
          {filterLists.map((filter) => (
            <div
              key={filter.id}
              className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleFilterList(filter.id)}
                  className={cn(
                    'w-5 h-5 rounded border flex items-center justify-center transition-colors',
                    filter.enabled
                      ? 'bg-cyan-500 border-cyan-500'
                      : 'border-white/20 hover:border-white/40'
                  )}
                >
                  {filter.enabled && <Shield size={12} className="text-black" />}
                </button>
                <div>
                  <p className="text-[13px] font-medium text-white/80">{filter.name}</p>
                  <p className="text-[11px] text-white/40">{filter.rulesCount.toLocaleString()} rules</p>
                </div>
              </div>
              <button
                onClick={() => toggleFilterList(filter.id)}
                className={cn(
                  'px-2 py-1 rounded text-[10px] font-medium transition-colors',
                  filter.enabled
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-white/5 text-white/40'
                )}
              >
                {filter.enabled ? 'Active' : 'Off'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Custom Rules */}
      {activeTab === 'rules' && (
        <div className="space-y-3">
          {/* Add rule */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
              placeholder="Enter URL pattern to block..."
              className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[12px] text-white/80 placeholder:text-white/30 focus:outline-none focus:border-cyan-500/30"
            />
            <button
              onClick={handleAddRule}
              disabled={!newRule.trim()}
              className="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 disabled:opacity-50 text-[12px] text-cyan-400 rounded-lg transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Rules list */}
          <div className="space-y-1">
            {customRules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <button
                    onClick={() => toggleCustomRule(rule.id)}
                    className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                      rule.enabled
                        ? 'bg-red-500 border-red-500'
                        : 'border-white/20'
                    )}
                  >
                    {rule.enabled && <X size={10} className="text-white" />}
                  </button>
                  <code className="text-[11px] text-white/60 truncate">{rule.pattern}</code>
                </div>
                <button
                  onClick={() => removeCustomRule(rule.id)}
                  className="p-1 text-white/30 hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {customRules.length === 0 && (
              <p className="text-[12px] text-white/30 text-center py-4">
                No custom rules. Add patterns like *://*ads* to block ad domains.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Whitelist */}
      {activeTab === 'whitelist' && (
        <div className="space-y-3">
          {/* Add domain */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
              placeholder="Enter domain to whitelist..."
              className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[12px] text-white/80 placeholder:text-white/30 focus:outline-none focus:border-cyan-500/30"
            />
            <button
              onClick={handleAddDomain}
              disabled={!newDomain.trim()}
              className="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 disabled:opacity-50 text-[12px] text-cyan-400 rounded-lg transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Domains list */}
          <div className="space-y-1">
            {whitelistedDomains.map((domain) => (
              <div
                key={domain}
                className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]"
              >
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-emerald-400/60 shrink-0" />
                  <span className="text-[12px] text-white/60">{domain}</span>
                </div>
                <button
                  onClick={() => removeWhitelistedDomain(domain)}
                  className="p-1 text-white/30 hover:text-red-400 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {whitelistedDomains.length === 0 && (
              <p className="text-[12px] text-white/30 text-center py-4">
                No whitelisted domains. Add domains to disable adblock on specific sites.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
