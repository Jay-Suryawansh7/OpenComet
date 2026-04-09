import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { memoryService } from '../services/memory-service';

export interface BrowsingMemory {
  id: string;
  type: 'site_visit' | 'search_query' | 'interaction' | 'bookmark';
  content: string;
  url?: string;
  timestamp: number;
}

export interface MemorySettings {
  memoryEnabled: boolean;
  decayDays: number;
  maxMemories: number;
  trackBrowsing: boolean;
  trackSearches: boolean;
  trackInteractions: boolean;
}

export interface MemoryStats {
  totalMemories: number;
  byType: Record<string, number>;
  avgImportance: number;
}

interface MemoryStore {
  settings: MemorySettings;
  recentMemories: BrowsingMemory[];
  memoryStats: MemoryStats | null;
  isLoading: boolean;

  setMemoryEnabled: (enabled: boolean) => void;
  setDecayDays: (days: number) => void;
  setMaxMemories: (max: number) => void;
  setTrackBrowsing: (track: boolean) => void;
  setTrackSearches: (track: boolean) => void;
  setTrackInteractions: (track: boolean) => void;
  
  recordSiteVisit: (url: string, title: string) => Promise<void>;
  recordSearchQuery: (query: string) => Promise<void>;
  recordInteraction: (element: string, action: string, url: string) => Promise<void>;
  recordBookmark: (url: string, title: string) => Promise<void>;
  
  loadRecentMemories: () => Promise<void>;
  loadMemoryStats: () => Promise<void>;
  clearAllMemories: () => Promise<void>;
  clearBrowsingHistory: () => Promise<void>;
  runMemoryDecay: () => Promise<void>;
}

export const useMemoryStore = create<MemoryStore>()(
  persist(
    (set, get) => ({
      settings: {
        memoryEnabled: true,
        decayDays: 30,
        maxMemories: 1000,
        trackBrowsing: true,
        trackSearches: true,
        trackInteractions: false,
      },
      recentMemories: [],
      memoryStats: null,
      isLoading: false,

      setMemoryEnabled: (enabled) => {
        memoryService.setEnabled(enabled);
        set((state) => ({ settings: { ...state.settings, memoryEnabled: enabled } }));
      },

      setDecayDays: (days) => {
        memoryService.setDecayDays(days);
        set((state) => ({ settings: { ...state.settings, decayDays: days } }));
      },

      setMaxMemories: (max) => {
        memoryService.setMaxMemories(max);
        set((state) => ({ settings: { ...state.settings, maxMemories: max } }));
      },

      setTrackBrowsing: (track) => {
        set((state) => ({ settings: { ...state.settings, trackBrowsing: track } }));
      },

      setTrackSearches: (track) => {
        set((state) => ({ settings: { ...state.settings, trackSearches: track } }));
      },

      setTrackInteractions: (track) => {
        set((state) => ({ settings: { ...state.settings, trackInteractions: track } }));
      },

      recordSiteVisit: async (url, title) => {
        if (!get().settings.trackBrowsing) return;
        await memoryService.recordSiteVisit(url, title);
        get().loadRecentMemories();
      },

      recordSearchQuery: async (query) => {
        if (!get().settings.trackSearches) return;
        await memoryService.recordSearchQuery(query);
        get().loadRecentMemories();
      },

      recordInteraction: async (element, action, url) => {
        if (!get().settings.trackInteractions) return;
        await memoryService.recordInteraction(element, action, url);
        get().loadRecentMemories();
      },

      recordBookmark: async (url, title) => {
        await memoryService.recordBookmark(url, title);
        get().loadRecentMemories();
      },

      loadRecentMemories: async () => {
        const memories = await memoryService.getRecentBrowsingMemories(50);
        set({ recentMemories: memories as unknown as BrowsingMemory[] });
      },

      loadMemoryStats: async () => {
        const stats = await memoryService.getStats();
        set({ memoryStats: stats });
      },

      clearAllMemories: async () => {
        await memoryService.clearAllMemories();
        await memoryService.clearBrowsingHistory();
        set({ recentMemories: [], memoryStats: null });
      },

      clearBrowsingHistory: async () => {
        await memoryService.clearBrowsingHistory();
        get().loadRecentMemories();
      },

      runMemoryDecay: async () => {
        await memoryService.runMemoryDecay();
        get().loadMemoryStats();
      },
    }),
    {
      name: 'opencomet-memory-settings',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);

export default useMemoryStore;
