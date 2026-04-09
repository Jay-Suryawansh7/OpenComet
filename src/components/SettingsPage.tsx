import { useState } from 'react';
import { ProviderSettings } from '@/components/ProviderSettings';
import { AdblockSettings } from '@/components/AdblockSettings';
import { ProfileEditor } from '@/components/ProfileSettings';
import { PrivacySettings } from '@/components/PrivacySettings';
import { ExtensionsPanel } from '@/components/ExtensionsPanel';
import { useUIStore } from '@/store';
import { cn } from '@/lib/utils';
import {
  Settings2, Bot, Shield, User, Lock, Puzzle,
  ChevronLeft
} from 'lucide-react';

type SettingsTab = 'provider' | 'adblock' | 'profiles' | 'privacy' | 'extensions';

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'provider', label: 'Provider', icon: <Bot size={16} /> },
  { id: 'adblock', label: 'Adblock', icon: <Shield size={16} /> },
  { id: 'profiles', label: 'Profiles', icon: <User size={16} /> },
  { id: 'privacy', label: 'Privacy', icon: <Lock size={16} /> },
  { id: 'extensions', label: 'Extensions', icon: <Puzzle size={16} /> },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('provider');
  const { setActiveSection } = useUIStore();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4 px-6 pt-6 pb-4">
        <button
          onClick={() => setActiveSection('search')}
          className="flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white/60 transition-colors"
        >
          <ChevronLeft size={16} />
          Back
        </button>
        <div className="flex items-center gap-2">
          <Settings2 size={20} className="text-cyan-400" />
          <h2 className="text-lg font-semibold text-white/90">Settings</h2>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <nav className="w-[200px] shrink-0 border-r border-white/[0.06] pr-4 pl-6 pb-6">
          <div className="space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors text-left',
                  activeTab === tab.id
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04] border border-transparent'
                )}
              >
                <span className={cn(activeTab === tab.id ? 'text-cyan-400' : 'text-white/30')}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'provider' && <ProviderSettings />}
          {activeTab === 'adblock' && <AdblockSettings />}
          {activeTab === 'profiles' && <ProfileEditor />}
          {activeTab === 'privacy' && <PrivacySettings />}
          {activeTab === 'extensions' && <ExtensionsPanel />}
        </main>
      </div>
    </div>
  );
}
