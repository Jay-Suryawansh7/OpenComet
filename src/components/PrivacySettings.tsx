import { useState } from 'react';
import { usePrivacyStore, type AssistantPermission } from '@/store/privacyStore';
import { cn } from '@/lib/utils';
import {
  Shield, Lock, Eye, Clock, Bookmark, Clipboard,
  Key, AlertTriangle, CheckCircle
} from 'lucide-react';

const PERMISSION_ICONS: Record<AssistantPermission['type'], React.ReactNode> = {
  page_context: <Eye size={16} />,
  history: <Clock size={16} />,
  bookmarks: <Bookmark size={16} />,
  clipboard: <Clipboard size={16} />,
  location: <Key size={16} />,
};

export function PrivacySettings() {
  const [activeSection, setActiveSection] = useState<'permissions' | 'services' | 'data'>('permissions');

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
          <Shield size={20} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-[16px] font-semibold text-white/90">Privacy & Security</h2>
          <p className="text-[12px] text-white/40">
            Control how OpenComet accesses your data
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-1 p-1 bg-white/[0.02] rounded-xl mb-6">
        {([
          { id: 'permissions', label: 'Permissions', icon: <Lock size={14} /> },
          { id: 'services', label: 'Services', icon: <Key size={14} /> },
          { id: 'data', label: 'Data', icon: <Clock size={14} /> },
        ] as const).map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors',
              activeSection === section.id
                ? 'bg-white/[0.08] text-white/90'
                : 'text-white/40 hover:text-white/60'
            )}
          >
            {section.icon}
            {section.label}
          </button>
        ))}
      </div>

      {activeSection === 'permissions' && <PermissionsSection />}
      {activeSection === 'services' && <ServicesSection />}
      {activeSection === 'data' && <DataManagementSection />}
    </div>
  );
}

function PermissionsSection() {
  const { assistantPermissions, togglePermission, setPermissionApproval } = usePrivacyStore();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Lock size={14} className="text-white/40" />
        <h3 className="text-[13px] font-medium text-white/70">Assistant Permissions</h3>
      </div>

      {assistantPermissions.map((permission) => (
        <div
          key={permission.id}
          className={cn(
            'p-4 rounded-xl border transition-colors',
            permission.enabled
              ? 'bg-white/[0.02] border-white/[0.06]'
              : 'bg-white/[0.01] border-white/[0.04]'
          )}
        >
          <div className="flex items-start gap-3">
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
              permission.enabled ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/30'
            )}>
              {PERMISSION_ICONS[permission.type]}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-[13px] font-medium text-white/80">
                  {permission.name}
                </h4>
                {permission.enabled ? (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                    Active
                  </span>
                ) : (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/30">
                    Off
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/40 mt-0.5">
                {permission.description}
              </p>

              {permission.enabled && permission.requiresApproval && (
                <div className="flex items-center gap-2 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permission.requiresApproval}
                      onChange={(e) => setPermissionApproval(permission.id, e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/20"
                    />
                    <span className="text-[11px] text-white/50">
                      Require approval before access
                    </span>
                  </label>
                </div>
              )}
            </div>

            <button
              onClick={() => togglePermission(permission.id)}
              className={cn(
                'relative w-10 h-6 rounded-full transition-colors shrink-0',
                permission.enabled ? 'bg-cyan-500' : 'bg-white/10'
              )}
            >
              <div
                className={cn(
                  'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
                  permission.enabled ? 'translate-x-5' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </div>
      ))}

      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 mt-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[12px] font-medium text-amber-400/80">
              Local-first Privacy
            </p>
            <p className="text-[11px] text-white/40 mt-1">
              Your browsing data stays on your device by default. OpenComet only sends 
              minimal context to our servers when needed to complete requests.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServicesSection() {
  const { connectedServices, connectService, disconnectService } = usePrivacyStore();
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (id: string) => {
    setConnecting(id);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    connectService(id);
    setConnecting(null);
  };

  const handleDisconnect = async (id: string) => {
    disconnectService(id);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Key size={14} className="text-white/40" />
        <h3 className="text-[13px] font-medium text-white/70">Connected Services</h3>
      </div>

      {connectedServices.map((service) => (
        <div
          key={service.id}
          className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]"
        >
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-[20px] shrink-0">
            {service.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-[13px] font-medium text-white/80">
                {service.name}
              </h4>
              {service.connected && (
                <CheckCircle size={12} className="text-emerald-400" />
              )}
            </div>
            <p className="text-[10px] text-white/40 mt-0.5">
              {service.permissions.join(', ')}
            </p>
          </div>

          {service.connected ? (
            <button
              onClick={() => handleDisconnect(service.id)}
              className="px-3 py-1.5 text-[11px] text-red-400/80 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={() => handleConnect(service.id)}
              disabled={connecting === service.id}
              className="px-3 py-1.5 text-[11px] text-cyan-400/80 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors disabled:opacity-50"
            >
              {connecting === service.id ? 'Connecting...' : 'Connect'}
            </button>
          )}
        </div>
      ))}

      <p className="text-[11px] text-white/30 text-center mt-4">
        Connect services to enable assistant actions like sending emails or syncing notes.
      </p>
    </div>
  );
}

function DataManagementSection() {
  const {
    dataRetention,
    browsingDataSettings,
    updateDataRetention,
    updateBrowsingDataSettings,
    clearAllData,
  } = usePrivacyStore();

  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  const handleClearData = async () => {
    const types: ('history' | 'cache' | 'cookies' | 'downloads')[] = [];
    if (browsingDataSettings.clearHistory) types.push('history');
    if (browsingDataSettings.clearCache) types.push('cache');
    if (browsingDataSettings.clearCookies) types.push('cookies');
    if (browsingDataSettings.clearDownloads) types.push('downloads');

    if (types.length === 0) return;

    setClearing(true);
    await clearAllData(types);
    setClearing(false);
    setCleared(true);
    setTimeout(() => setCleared(false), 3000);
  };

  const retentionOptions = [
    { value: 7, label: '7 days' },
    { value: 30, label: '30 days' },
    { value: 90, label: '90 days' },
    { value: 365, label: '1 year' },
    { value: -1, label: 'Forever' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={14} className="text-white/40" />
        <h3 className="text-[13px] font-medium text-white/70">Data Retention</h3>
      </div>

      {[
        { key: 'historyDays', label: 'Keep browsing history' },
        { key: 'cacheDays', label: 'Cache expiration' },
        { key: 'cookiesDays', label: 'Cookies expiration' },
      ].map((item) => (
        <div key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <span className="text-[12px] text-white/70">{item.label}</span>
          <select
            value={dataRetention[item.key as keyof typeof dataRetention] as number}
            onChange={(e) => updateDataRetention({ [item.key]: parseInt(e.target.value) })}
            className="px-2 py-1 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[11px] text-white/70 focus:outline-none focus:border-cyan-500/30"
          >
            {retentionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      ))}

      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={dataRetention.clearOnExit}
            onChange={(e) => updateDataRetention({ clearOnExit: e.target.checked })}
            className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/20"
          />
          <span className="text-[12px] text-white/70">
            Clear data when closing OpenComet
          </span>
        </label>
      </div>

      {/* Clear Data */}
      <div className="mt-6 pt-6 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={14} className="text-white/40" />
          <h3 className="text-[13px] font-medium text-white/70">Clear Browsing Data</h3>
        </div>

        <div className="space-y-2 mb-4">
          {([
            { key: 'clearHistory', label: 'Browsing history' },
            { key: 'clearCache', label: 'Cache' },
            { key: 'clearCookies', label: 'Cookies' },
            { key: 'clearDownloads', label: 'Download history' },
          ] as const).map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              <input
                type="checkbox"
                checked={browsingDataSettings[item.key]}
                onChange={(e) => updateBrowsingDataSettings({ [item.key]: e.target.checked })}
                className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/20"
              />
              <span className="text-[12px] text-white/70">{item.label}</span>
            </label>
          ))}
        </div>

        <button
          onClick={handleClearData}
          disabled={clearing || !Object.values(browsingDataSettings).some(Boolean)}
          className={cn(
            'w-full py-2.5 rounded-xl text-[12px] font-medium transition-colors',
            cleared
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {cleared ? '✓ Data cleared!' : clearing ? 'Clearing...' : 'Clear selected data'}
        </button>
      </div>
    </div>
  );
}
