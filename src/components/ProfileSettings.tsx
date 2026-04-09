import { useState } from 'react';
import { useProfilesStore, AVATAR_OPTIONS, COLOR_OPTIONS, type BrowserProfile } from '@/store/profilesStore';
import { cn } from '@/lib/utils';
import {
  User, Plus, Trash2, Check, X, Palette, Crown
} from 'lucide-react';

interface ProfileSwitcherProps {
  onClose: () => void;
}

export function ProfileSwitcher({ onClose }: ProfileSwitcherProps) {
  const { profiles, activeProfileId, switchProfile } = useProfilesStore();

  const handleSelect = async (id: string) => {
    await switchProfile(id);
    onClose();
  };

  return (
    <div className="bg-[#1a1d24] border border-white/[0.1] rounded-xl overflow-hidden w-[320px]">
      <div className="p-3 border-b border-white/[0.06]">
        <h3 className="text-[14px] font-medium text-white/80">Profiles</h3>
        <p className="text-[11px] text-white/40 mt-0.5">Switch between browsing profiles</p>
      </div>

      <div className="max-h-[300px] overflow-y-auto p-2">
        {profiles.map((profile) => (
          <button
            key={profile.id}
            onClick={() => handleSelect(profile.id)}
            className={cn(
              'w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left',
              profile.id === activeProfileId
                ? 'bg-cyan-500/10 border border-cyan-500/20'
                : 'hover:bg-white/[0.04] border border-transparent'
            )}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[16px] shrink-0"
              style={{ backgroundColor: `${profile.color}20` }}
            >
              {profile.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-white/80 truncate">
                  {profile.name}
                </span>
                {profile.id === activeProfileId && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                    Active
                  </span>
                )}
              </div>
              <span className="text-[10px] text-white/40">
                Last used {formatTime(profile.lastUsed)}
              </span>
            </div>
            {profile.id === activeProfileId && (
              <Check size={14} className="text-cyan-400 shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ProfileEditor() {
  const { profiles, createProfile, deleteProfile, updateProfile, activeProfileId } = useProfilesStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATAR_OPTIONS[0]);
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [isCreating, setIsCreating] = useState(false);

  const activeProfile = profiles.find(p => p.id === activeProfileId);

  const handleCreate = () => {
    if (name.trim()) {
      createProfile(name.trim(), avatar, color);
      setName('');
      setAvatar(AVATAR_OPTIONS[0]);
      setColor(COLOR_OPTIONS[0]);
      setIsCreating(false);
    }
  };

  const handleUpdate = (id: string) => {
    if (name.trim()) {
      updateProfile(id, { name: name.trim(), avatar, color });
      setEditingId(null);
      setName('');
    }
  };

  const handleDelete = (id: string) => {
    if (profiles.length > 1) {
      deleteProfile(id);
    }
  };

  const startEditing = (profile: BrowserProfile) => {
    setEditingId(profile.id);
    setName(profile.name);
    setAvatar(profile.avatar);
    setColor(profile.color);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <User size={20} className="text-violet-400" />
        </div>
        <div>
          <h2 className="text-[16px] font-semibold text-white/90">Profiles</h2>
          <p className="text-[12px] text-white/40">
            Manage separate browsing environments
          </p>
        </div>
      </div>

      {/* Current profile */}
      {activeProfile && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-[24px]"
              style={{ backgroundColor: `${activeProfile.color}30` }}
            >
              {activeProfile.avatar}
            </div>
            <div>
              <p className="text-[14px] font-medium text-white/90">{activeProfile.name}</p>
              <p className="text-[11px] text-white/40">Current profile</p>
            </div>
            <Crown size={16} className="text-amber-400 ml-auto" />
          </div>
        </div>
      )}

      {/* Create new */}
      {isCreating && (
        <div className="mb-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <h4 className="text-[13px] font-medium text-white/80 mb-3">New Profile</h4>
          
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-white/50 mb-1 block">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Profile name..."
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[12px] text-white/80 placeholder:text-white/30 focus:outline-none focus:border-cyan-500/30"
              />
            </div>

            <div>
              <label className="text-[11px] text-white/50 mb-1 block">Avatar</label>
              <div className="flex gap-1 flex-wrap">
                {AVATAR_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAvatar(opt)}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-[16px] transition-colors',
                      avatar === opt
                        ? 'bg-white/[0.1] ring-2 ring-cyan-500/50'
                        : 'hover:bg-white/[0.06]'
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] text-white/50 mb-1 block">Color</label>
              <div className="flex gap-1 flex-wrap">
                {COLOR_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setColor(opt)}
                    className={cn(
                      'w-8 h-8 rounded-lg transition-colors',
                      color === opt
                        ? 'ring-2 ring-white/50'
                        : 'hover:scale-110'
                    )}
                    style={{ backgroundColor: opt }}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 text-[12px] text-white/60 hover:text-white/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim()}
                className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 disabled:opacity-50 text-[12px] text-cyan-400 rounded-lg transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profiles list */}
      <div className="space-y-2">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]"
          >
            {editingId === profile.id ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-2 py-1 bg-white/[0.04] border border-white/[0.08] rounded text-[12px] text-white/80 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => handleUpdate(profile.id)}
                  className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="p-1.5 text-white/40 hover:bg-white/5 rounded transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[20px] shrink-0"
                  style={{ backgroundColor: `${profile.color}20` }}
                >
                  {profile.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-white/80 truncate">
                    {profile.name}
                  </p>
                  <p className="text-[10px] text-white/40">
                    {profile.id === activeProfileId ? 'Active' : `Last used ${formatTime(profile.lastUsed)}`}
                  </p>
                </div>
                <button
                  onClick={() => startEditing(profile)}
                  className="p-1.5 text-white/40 hover:text-white/60 hover:bg-white/[0.04] rounded transition-colors"
                >
                  <Palette size={14} />
                </button>
                {profiles.length > 1 && (
                  <button
                    onClick={() => handleDelete(profile.id)}
                    className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {!isCreating && (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full flex items-center justify-center gap-2 mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] text-[12px] text-white/60 hover:text-white/80 transition-colors"
        >
          <Plus size={14} />
          Add new profile
        </button>
      )}
    </div>
  );
}

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
