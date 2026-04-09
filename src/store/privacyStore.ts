import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AssistantPermission {
  id: string;
  name: string;
  description: string;
  type: 'page_context' | 'history' | 'bookmarks' | 'clipboard' | 'location';
  enabled: boolean;
  requiresApproval: boolean;
}

export interface ConnectedService {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  permissions: string[];
  lastSync?: number;
}

export interface DataRetentionPolicy {
  historyDays: number;
  cacheDays: number;
  cookiesDays: number;
  clearOnExit: boolean;
}

interface PrivacyState {
  assistantPermissions: AssistantPermission[];
  connectedServices: ConnectedService[];
  dataRetention: DataRetentionPolicy;
  browsingDataSettings: {
    clearHistory: boolean;
    clearCache: boolean;
    clearCookies: boolean;
    clearDownloads: boolean;
  };
}

interface PrivacyActions {
  togglePermission: (id: string) => void;
  setPermissionApproval: (id: string, requiresApproval: boolean) => void;
  connectService: (id: string) => void;
  disconnectService: (id: string) => void;
  updateDataRetention: (updates: Partial<DataRetentionPolicy>) => void;
  updateBrowsingDataSettings: (updates: Partial<PrivacyState['browsingDataSettings']>) => void;
  clearAllData: (types: ('history' | 'cache' | 'cookies' | 'downloads')[]) => Promise<void>;
  exportData: () => Promise<string>;
}

const DEFAULT_PERMISSIONS: AssistantPermission[] = [
  {
    id: 'page_context',
    name: 'Page Context',
    description: 'Allow assistant to read page content for Q&A',
    type: 'page_context',
    enabled: true,
    requiresApproval: false,
  },
  {
    id: 'history',
    name: 'Browsing History',
    description: 'Access browsing history for context',
    type: 'history',
    enabled: false,
    requiresApproval: true,
  },
  {
    id: 'bookmarks',
    name: 'Bookmarks',
    description: 'Read and modify bookmarks',
    type: 'bookmarks',
    enabled: false,
    requiresApproval: true,
  },
  {
    id: 'clipboard',
    name: 'Clipboard',
    description: 'Read clipboard for paste functionality',
    type: 'clipboard',
    enabled: true,
    requiresApproval: false,
  },
];

const DEFAULT_CONNECTED_SERVICES: ConnectedService[] = [
  {
    id: 'google',
    name: 'Google',
    icon: '🔍',
    connected: false,
    permissions: ['Search', 'Drive'],
  },
  {
    id: 'notion',
    name: 'Notion',
    icon: '📝',
    connected: false,
    permissions: ['Read pages', 'Write pages'],
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: '💬',
    connected: false,
    permissions: ['Send messages', 'Read channels'],
  },
  {
    id: 'gmail',
    name: 'Gmail',
    icon: '📧',
    connected: false,
    permissions: ['Read emails', 'Send emails'],
  },
];

export const usePrivacyStore = create<PrivacyState & PrivacyActions>()(
  persist(
    (set, get) => ({
      assistantPermissions: DEFAULT_PERMISSIONS,
      connectedServices: DEFAULT_CONNECTED_SERVICES,
      dataRetention: {
        historyDays: 90,
        cacheDays: 30,
        cookiesDays: 30,
        clearOnExit: false,
      },
      browsingDataSettings: {
        clearHistory: false,
        clearCache: false,
        clearCookies: false,
        clearDownloads: false,
      },

      togglePermission: (id) => set((state) => ({
        assistantPermissions: state.assistantPermissions.map((p) =>
          p.id === id ? { ...p, enabled: !p.enabled } : p
        ),
      })),

      setPermissionApproval: (id, requiresApproval) => set((state) => ({
        assistantPermissions: state.assistantPermissions.map((p) =>
          p.id === id ? { ...p, requiresApproval } : p
        ),
      })),

      connectService: (id) => set((state) => ({
        connectedServices: state.connectedServices.map((s) =>
          s.id === id ? { ...s, connected: true, lastSync: Date.now() } : s
        ),
      })),

      disconnectService: (id) => set((state) => ({
        connectedServices: state.connectedServices.map((s) =>
          s.id === id ? { ...s, connected: false, lastSync: undefined } : s
        ),
      })),

      updateDataRetention: (updates) => set((state) => ({
        dataRetention: { ...state.dataRetention, ...updates },
      })),

      updateBrowsingDataSettings: (updates) => set((state) => ({
        browsingDataSettings: { ...state.browsingDataSettings, ...updates },
      })),

      clearAllData: async (types) => {
        // const { browsingDataSettings } = get();
        
        if (types.includes('history')) {
          localStorage.removeItem('opencomet-history');
        }
        if (types.includes('cache')) {
          localStorage.removeItem('opencomet-cache');
          if (window.electronAPI) {
            // Clear webview cache if available
          }
        }
        if (types.includes('cookies')) {
          // Clear cookies via Electron
        }
        if (types.includes('downloads')) {
          localStorage.removeItem('opencomet-downloads');
        }

        set({
          browsingDataSettings: {
            clearHistory: false,
            clearCache: false,
            clearCookies: false,
            clearDownloads: false,
          },
        });
      },

      exportData: async () => {
        const state = get();
        const exportData = {
          assistantPermissions: state.assistantPermissions,
          connectedServices: state.connectedServices,
          dataRetention: state.dataRetention,
          exportedAt: Date.now(),
        };
        return JSON.stringify(exportData, null, 2);
      },
    }),
    {
      name: 'opencomet-privacy',
    }
  )
);
