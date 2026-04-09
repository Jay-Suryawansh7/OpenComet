import { create } from 'zustand';

interface TabCycleEntry {
  id: string;
  url: string;
  title: string;
  lastAccessed: number;
  isPinned: boolean;
}

interface TabCycleState {
  history: TabCycleEntry[];
  pinnedTabs: Set<string>;
  isPickerOpen: boolean;
}

interface TabCycleActions {
  addToHistory: (tab: { id: string; url: string; title: string }) => void;
  removeFromHistory: (tabId: string) => void;
  pinTab: (tabId: string) => void;
  unpinTab: (tabId: string) => void;
  setPickerOpen: (open: boolean) => void;
  clearHistory: () => void;
  getRecentTabs: (limit?: number) => TabCycleEntry[];
  cycleNext: () => string | null;
  cyclePrevious: () => string | null;
}

const MAX_HISTORY = 20;

export const useTabCycleStore = create<TabCycleState & TabCycleActions>((set, get) => ({
  history: [],
  pinnedTabs: new Set(),
  isPickerOpen: false,

  addToHistory: (tab) => {
    set((state) => {
      const filtered = state.history.filter((t) => t.id !== tab.id);
      const newEntry: TabCycleEntry = {
        ...tab,
        lastAccessed: Date.now(),
        isPinned: state.pinnedTabs.has(tab.id),
      };
      return {
        history: [newEntry, ...filtered].slice(0, MAX_HISTORY),
      };
    });
  },

  removeFromHistory: (tabId) => {
    set((state) => ({
      history: state.history.filter((t) => t.id !== tabId),
    }));
  },

  pinTab: (tabId) => {
    set((state) => {
      const newPinned = new Set(state.pinnedTabs);
      newPinned.add(tabId);
      return {
        pinnedTabs: newPinned,
        history: state.history.map((t) =>
          t.id === tabId ? { ...t, isPinned: true } : t
        ),
      };
    });
  },

  unpinTab: (tabId) => {
    set((state) => {
      const newPinned = new Set(state.pinnedTabs);
      newPinned.delete(tabId);
      return {
        pinnedTabs: newPinned,
        history: state.history.map((t) =>
          t.id === tabId ? { ...t, isPinned: false } : t
        ),
      };
    });
  },

  setPickerOpen: (open) => set({ isPickerOpen: open }),

  clearHistory: () => set({ history: [] }),

  getRecentTabs: (limit = 10) => {
    return get().history.slice(0, limit);
  },

  cycleNext: () => {
    const { history } = get();
    if (history.length <= 1) return null;
    return history[1]?.id || null;
  },

  cyclePrevious: () => {
    const { history } = get();
    if (history.length <= 1) return null;
    return history[0]?.id || null;
  },
}));
