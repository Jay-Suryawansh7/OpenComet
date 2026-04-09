import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ShortcutCategory = 'research' | 'writing' | 'shopping' | 'travel' | 'custom';

export interface QueryShortcut {
  id: string;
  name: string;
  trigger: string;
  prompt: string;
  category: ShortcutCategory;
  icon?: string;
  usageCount: number;
  createdAt: number;
  lastUsed?: number;
}

interface ShortcutsState {
  shortcuts: QueryShortcut[];
  isPickerOpen: boolean;
}

interface ShortcutsActions {
  addShortcut: (shortcut: Omit<QueryShortcut, 'id' | 'usageCount' | 'createdAt'>) => void;
  updateShortcut: (id: string, updates: Partial<QueryShortcut>) => void;
  deleteShortcut: (id: string) => void;
  useShortcut: (id: string) => string | null;
  getShortcutByTrigger: (trigger: string) => QueryShortcut | null;
  setPickerOpen: (open: boolean) => void;
  importShortcuts: (shortcuts: QueryShortcut[]) => void;
  exportShortcuts: () => QueryShortcut[];
}

const DEFAULT_SHORTCUTS: QueryShortcut[] = [
  {
    id: 'default-research',
    name: 'Deep Research',
    trigger: '/research',
    prompt: 'Perform a comprehensive research on the following topic. Include key facts, different perspectives, and relevant sources.\n\nTopic: {query}',
    category: 'research',
    icon: '🔍',
    usageCount: 0,
    createdAt: Date.now(),
  },
  {
    id: 'default-summarize',
    name: 'Quick Summary',
    trigger: '/summarize',
    prompt: 'Give me a concise 3-bullet summary of the following text:\n\n{query}',
    category: 'writing',
    icon: '📝',
    usageCount: 0,
    createdAt: Date.now(),
  },
  {
    id: 'default-translate',
    name: 'Translate',
    trigger: '/translate',
    prompt: 'Translate the following text to English and explain any cultural context or nuances:\n\n{query}',
    category: 'custom',
    icon: '🌐',
    usageCount: 0,
    createdAt: Date.now(),
  },
  {
    id: 'default-factcheck',
    name: 'Fact Check',
    trigger: '/factcheck',
    prompt: 'Fact-check the following claims and identify any inaccuracies or misleading statements:\n\n{query}',
    category: 'research',
    icon: '✓',
    usageCount: 0,
    createdAt: Date.now(),
  },
  {
    id: 'default-compare',
    name: 'Compare',
    trigger: '/compare',
    prompt: 'Compare and contrast the following options. Highlight pros, cons, and key differences:\n\n{query}',
    category: 'research',
    icon: '⚖️',
    usageCount: 0,
    createdAt: Date.now(),
  },
];

export const useShortcutsStore = create<ShortcutsState & ShortcutsActions>()(
  persist(
    (set, get) => ({
      shortcuts: DEFAULT_SHORTCUTS,
      isPickerOpen: false,

      addShortcut: (shortcut) => {
        const newShortcut: QueryShortcut = {
          ...shortcut,
          id: `shortcut-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          usageCount: 0,
          createdAt: Date.now(),
        };
        set((state) => ({
          shortcuts: [...state.shortcuts, newShortcut],
        }));
      },

      updateShortcut: (id, updates) => {
        set((state) => ({
          shortcuts: state.shortcuts.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },

      deleteShortcut: (id) => {
        set((state) => ({
          shortcuts: state.shortcuts.filter((s) => s.id !== id),
        }));
      },

      useShortcut: (id) => {
        const shortcut = get().shortcuts.find((s) => s.id === id);
        if (shortcut) {
          set((state) => ({
            shortcuts: state.shortcuts.map((s) =>
              s.id === id
                ? { ...s, usageCount: s.usageCount + 1, lastUsed: Date.now() }
                : s
            ),
          }));
          return shortcut.prompt;
        }
        return null;
      },

      getShortcutByTrigger: (trigger) => {
        return get().shortcuts.find((s) => s.trigger === trigger) || null;
      },

      setPickerOpen: (open) => set({ isPickerOpen: open }),

      importShortcuts: (shortcuts) => {
        set((state) => ({
          shortcuts: [...state.shortcuts, ...shortcuts],
        }));
      },

      exportShortcuts: () => get().shortcuts,
    }),
    {
      name: 'opencomet-shortcuts',
    }
  )
);
