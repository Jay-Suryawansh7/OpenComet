import { useState, useRef } from 'react';
import { useExtensionsStore, type Extension } from '@/store/extensionsStore';
import { cn } from '@/lib/utils';
import {
  Puzzle, Plus, Trash2, Power, PowerOff, FolderOpen,
  AlertCircle, CheckCircle, Shield, RefreshCw
} from 'lucide-react';

export function ExtensionsPanel() {
  const {
    extensions,
    isLoading,
    error,
    loadExtension,
    enableExtension,
    disableExtension,
    removeExtension,
  } = useExtensionsStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadUnpacked = async () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const path = (file as unknown as { path?: string }).path;
      if (path) {
        await loadExtension(path);
      }
    }
    e.target.value = '';
  };

  const getPermissionColor = (perm: string): string => {
    if (perm.includes('http') || perm.includes('<all_urls>')) return 'text-red-400/60';
    if (perm.includes('storage') || perm.includes('cookies')) return 'text-orange-400/60';
    if (perm.includes('tabs')) return 'text-yellow-400/60';
    return 'text-white/40';
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Puzzle size={20} className="text-violet-400" />
          </div>
          <div>
            <h2 className="text-[16px] font-semibold text-white/90">Extensions</h2>
            <p className="text-[12px] text-white/40">
              {extensions.length} extension{extensions.length !== 1 ? 's' : ''} installed
            </p>
          </div>
        </div>

        <button
          onClick={handleLoadUnpacked}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 disabled:opacity-50 text-[12px] text-cyan-400 rounded-lg transition-colors"
        >
          {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
          Load unpacked
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <p className="text-[12px] text-red-400">{error}</p>
        </div>
      )}

      {extensions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.02] flex items-center justify-center mb-4">
            <Puzzle size={28} className="text-white/20" />
          </div>
          <p className="text-[14px] text-white/50 mb-1">No extensions installed</p>
          <p className="text-[12px] text-white/30 mb-4">
            Load unpacked extensions to extend functionality
          </p>
          <button
            onClick={handleLoadUnpacked}
            className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.06] text-[12px] text-white/60 rounded-lg transition-colors"
          >
            <FolderOpen size={14} />
            Select extension folder
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {extensions.map((ext) => (
            <ExtensionCard
              key={ext.id}
              extension={ext}
              onToggle={() => ext.enabled ? disableExtension(ext.id) : enableExtension(ext.id)}
              onRemove={() => removeExtension(ext.id)}
              getPermissionColor={getPermissionColor}
            />
          ))}
        </div>
      )}

      <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
        <h4 className="text-[12px] font-medium text-white/60 mb-2">About Chrome Extensions</h4>
        <p className="text-[11px] text-white/40 leading-relaxed">
          OpenComet supports Chrome extension manifest v2 and v3. Extensions must be loaded as unpacked 
          from a local folder. Only extensions from trusted sources should be installed.
        </p>
      </div>
    </div>
  );
}

interface ExtensionCardProps {
  extension: Extension;
  onToggle: () => void;
  onRemove: () => void;
  getPermissionColor: (perm: string) => string;
}

function ExtensionCard({ extension, onToggle, onRemove, getPermissionColor }: ExtensionCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn(
      'rounded-xl border transition-colors overflow-hidden',
      extension.enabled
        ? 'bg-white/[0.02] border-white/[0.06]'
        : 'bg-white/[0.01] border-white/[0.04] opacity-60'
    )}>
      <div className="flex items-center gap-3 p-3">
        <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center text-[20px] shrink-0 overflow-hidden">
          {extension.icon ? (
            <img src={extension.icon} alt="" className="w-full h-full object-cover" />
          ) : (
            <Puzzle size={18} className="text-white/30" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-medium text-white/80 truncate">
              {extension.name}
            </p>
            {extension.enabled ? (
              <CheckCircle size={12} className="text-emerald-400 shrink-0" />
            ) : (
              <PowerOff size={12} className="text-white/30 shrink-0" />
            )}
          </div>
          <p className="text-[10px] text-white/40">v{extension.version}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn(
              'p-1.5 rounded transition-colors',
              expanded
                ? 'bg-white/[0.08] text-white/60'
                : 'text-white/30 hover:text-white/50 hover:bg-white/[0.04]'
            )}
            title={expanded ? 'Hide details' : 'Show details'}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={cn('transition-transform', expanded && 'rotate-180')}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <button
            onClick={onToggle}
            className={cn(
              'p-1.5 rounded transition-colors',
              extension.enabled
                ? 'text-emerald-400 hover:bg-emerald-500/10'
                : 'text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10'
            )}
            title={extension.enabled ? 'Disable' : 'Enable'}
          >
            {extension.enabled ? <Power size={14} /> : <PowerOff size={14} />}
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
            title="Remove"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-white/[0.04]">
          {extension.description && (
            <p className="text-[11px] text-white/50 mt-2 mb-3">
              {extension.description}
            </p>
          )}

          {extension.permissions && extension.permissions.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] uppercase tracking-wide text-white/30 mb-1 flex items-center gap-1">
                <Shield size={10} />
                Permissions
              </p>
              <div className="flex flex-wrap gap-1">
                {extension.permissions.map((perm) => (
                  <span
                    key={perm}
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] bg-white/[0.04]',
                      getPermissionColor(perm)
                    )}
                    title={perm}
                  >
                    {perm.length > 20 ? `${perm.substring(0, 20)}...` : perm}
                  </span>
                ))}
              </div>
            </div>
          )}

          {extension.path && (
            <p className="text-[10px] text-white/30 truncate">
              Path: {extension.path}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
