import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FilterList {
  id: string;
  name: string;
  enabled: boolean;
  rulesCount: number;
  lastUpdated: number;
}

export interface CustomRule {
  id: string;
  pattern: string;
  type: 'block' | 'allow';
  enabled: boolean;
  createdAt: number;
}

interface AdblockState {
  enabled: boolean;
  filterLists: FilterList[];
  customRules: CustomRule[];
  whitelistedDomains: string[];
  blockedCount: number;
  showStats: boolean;
}

interface AdblockActions {
  setEnabled: (enabled: boolean) => void;
  toggleFilterList: (id: string) => void;
  addCustomRule: (pattern: string, type: 'block' | 'allow') => void;
  removeCustomRule: (id: string) => void;
  toggleCustomRule: (id: string) => void;
  addWhitelistedDomain: (domain: string) => void;
  removeWhitelistedDomain: (domain: string) => void;
  incrementBlockedCount: () => void;
  resetBlockedCount: () => void;
  setShowStats: (show: boolean) => void;
  getAllRules: () => string[];
  isWhitelisted: (url: string) => boolean;
}

const DEFAULT_FILTER_LISTS: FilterList[] = [
  {
    id: 'easylist',
    name: 'EasyList',
    enabled: true,
    rulesCount: 70000,
    lastUpdated: Date.now(),
  },
  {
    id: 'easyprivacy',
    name: 'EasyPrivacy',
    enabled: true,
    rulesCount: 20000,
    lastUpdated: Date.now(),
  },
  {
    id: 'annoyances',
    name: 'Annoyances',
    enabled: false,
    rulesCount: 15000,
    lastUpdated: Date.now(),
  },
];

export const useAdblockStore = create<AdblockState & AdblockActions>()(
  persist(
    (set, get) => ({
      enabled: true,
      filterLists: DEFAULT_FILTER_LISTS,
      customRules: [],
      whitelistedDomains: [],
      blockedCount: 0,
      showStats: true,

      setEnabled: (enabled) => set({ enabled }),

      toggleFilterList: (id) => set((state) => ({
        filterLists: state.filterLists.map((f) =>
          f.id === id ? { ...f, enabled: !f.enabled } : f
        ),
      })),

      addCustomRule: (pattern, type) => set((state) => ({
        customRules: [
          ...state.customRules,
          {
            id: `rule-${Date.now()}`,
            pattern,
            type,
            enabled: true,
            createdAt: Date.now(),
          },
        ],
      })),

      removeCustomRule: (id) => set((state) => ({
        customRules: state.customRules.filter((r) => r.id !== id),
      })),

      toggleCustomRule: (id) => set((state) => ({
        customRules: state.customRules.map((r) =>
          r.id === id ? { ...r, enabled: !r.enabled } : r
        ),
      })),

      addWhitelistedDomain: (domain) => set((state) => {
        const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
        if (state.whitelistedDomains.includes(cleanDomain)) return state;
        return {
          whitelistedDomains: [...state.whitelistedDomains, cleanDomain],
        };
      }),

      removeWhitelistedDomain: (domain) => set((state) => ({
        whitelistedDomains: state.whitelistedDomains.filter((d) => d !== domain),
      })),

      incrementBlockedCount: () => set((state) => ({
        blockedCount: state.blockedCount + 1,
      })),

      resetBlockedCount: () => set({ blockedCount: 0 }),

      setShowStats: (show) => set({ showStats: show }),

      getAllRules: () => {
        const { filterLists, customRules } = get();
        const rules: string[] = [];

        if (filterLists.find((f) => f.id === 'easylist' && f.enabled)) {
          rules.push(...EASYLIST_RULES);
        }
        if (filterLists.find((f) => f.id === 'easyprivacy' && f.enabled)) {
          rules.push(...EASYPRIVACY_RULES);
        }

        customRules
          .filter((r) => r.enabled)
          .forEach((r) => {
            rules.push(r.pattern);
          });

        return rules;
      },

      isWhitelisted: (url) => {
        const { whitelistedDomains } = get();
        try {
          const hostname = new URL(url).hostname;
          return whitelistedDomains.some((d) => hostname.includes(d) || d.includes(hostname));
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'opencomet-adblock',
    }
  )
);

const EASYLIST_RULES = [
  '*://*doubleclick.net*',
  '*://*googlesyndication.com*',
  '*://*googleadservices.com*',
  '*://*adservice.google.com*',
  '*://*ads.*',
  '*://*banner*',
  '*://*adserver*',
  '*://*adsserver*',
  '*://*advertising*',
  '*://*tracking*',
  '*://*beacon*',
  '*://*pixel*',
  '*://*analytics*',
  '*://*metric*',
  '*://facebook.com/plugins/like*',
  '*://connect.facebook.net*',
];

const EASYPRIVACY_RULES = [
  '*://*google-analytics.com*',
  '*://*googletagmanager.com*',
  '*://*hotjar.com*',
  '*://*mixpanel.com*',
  '*://*segment.io*',
  '*://*segment.com*',
  '*://*amplitude.com*',
  '*://*fullstory.com*',
  '*://*crazyegg.com*',
  '*://*mouseflow.com*',
  '*://*inspectlet.com*',
];
