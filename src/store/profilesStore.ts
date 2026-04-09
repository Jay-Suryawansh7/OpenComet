import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BrowserProfile {
  id: string;
  name: string;
  avatar: string;
  color: string;
  partition: string;
  createdAt: number;
  lastUsed: number;
}

interface ProfilesState {
  profiles: BrowserProfile[];
  activeProfileId: string | null;
  isSwitching: boolean;
}

interface ProfilesActions {
  createProfile: (name: string, avatar?: string, color?: string) => BrowserProfile;
  deleteProfile: (id: string) => void;
  updateProfile: (id: string, updates: Partial<BrowserProfile>) => void;
  setActiveProfile: (id: string) => void;
  getActiveProfile: () => BrowserProfile | null;
  switchProfile: (id: string) => Promise<void>;
}

const DEFAULT_PROFILES: BrowserProfile[] = [
  {
    id: 'default',
    name: 'Default',
    avatar: '👤',
    color: '#06b6d4',
    partition: 'persist:default',
    createdAt: Date.now(),
    lastUsed: Date.now(),
  },
];

const AVATAR_OPTIONS = ['👤', '💼', '🎨', '🎮', '🎵', '📚', '✈️', '💰', '🔬', '🎬', '🏠', '💼'];
const COLOR_OPTIONS = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#6366f1'];

export const useProfilesStore = create<ProfilesState & ProfilesActions>()(
  persist(
    (set, get) => ({
      profiles: DEFAULT_PROFILES,
      activeProfileId: 'default',
      isSwitching: false,

      createProfile: (name, avatar = '👤', color = '#06b6d4') => {
        const id = `profile-${Date.now()}`;
        const partition = `persist:${id}`;
        const newProfile: BrowserProfile = {
          id,
          name,
          avatar,
          color,
          partition,
          createdAt: Date.now(),
          lastUsed: Date.now(),
        };
        set((state) => ({
          profiles: [...state.profiles, newProfile],
        }));
        return newProfile;
      },

      deleteProfile: (id) => set((state) => {
        if (state.profiles.length <= 1) return state;
        const newProfiles = state.profiles.filter((p) => p.id !== id);
        const newActiveId = state.activeProfileId === id ? newProfiles[0]?.id || null : state.activeProfileId;
        return {
          profiles: newProfiles,
          activeProfileId: newActiveId,
        };
      }),

      updateProfile: (id, updates) => set((state) => ({
        profiles: state.profiles.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      })),

      setActiveProfile: (id) => {
        set((state) => ({
          activeProfileId: id,
          profiles: state.profiles.map((p) =>
            p.id === id ? { ...p, lastUsed: Date.now() } : p
          ),
        }));
      },

      getActiveProfile: () => {
        const { profiles, activeProfileId } = get();
        return profiles.find((p) => p.id === activeProfileId) || null;
      },

      switchProfile: async (id) => {
        set({ isSwitching: true });
        set((state) => ({
          activeProfileId: id,
          profiles: state.profiles.map((p) =>
            p.id === id ? { ...p, lastUsed: Date.now() } : p
          ),
        }));
        await new Promise((resolve) => setTimeout(resolve, 500));
        set({ isSwitching: false });
      },
    }),
    {
      name: 'opencomet-profiles',
    }
  )
);

export { AVATAR_OPTIONS, COLOR_OPTIONS };
