import { create } from 'zustand'

export interface Tab {
  id: string
  url: string
  title: string
  favicon: string
  isLoading: boolean
}

export interface VisitedSite {
  id: string
  url: string
  title: string
  screenshot?: string
  timestamp: number
  summary?: string
}

export interface Download {
  id: string
  url: string
  filename: string
  totalBytes: number
  receivedBytes: number
  status: 'pending' | 'downloading' | 'completed' | 'failed'
  startTime: number
  endTime?: number
  error?: string
}

export interface BrowserState {
  tabs: Tab[]
  activeTabId: string | null
  agentMode: 'autonomous' | 'confirmation'
  agentActive: boolean
  visitedSites: VisitedSite[]
  isInitialized: boolean
  zoomLevel: number
  downloads: Download[]
  isFindVisible: boolean
  findQuery: string
  findMatches: number
  findIndex: number

  initialize: () => Promise<void>
  setTabs: (tabs: Tab[], activeId: string | null) => void
  setActiveTab: (tabId: string) => Promise<void>
  newTab: (url?: string) => Promise<void>
  closeTab: (tabId: string) => Promise<void>
  navigate: (url: string) => Promise<void>
  goBack: () => Promise<void>
  goForward: () => Promise<void>
  reload: () => Promise<void>
  stop: () => Promise<void>
  setAgentMode: (mode: 'autonomous' | 'confirmation') => void
  setAgentActive: (active: boolean) => void
  addVisitedSite: (site: Omit<VisitedSite, 'id' | 'timestamp'>) => void
  clearVisitedSites: () => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  setZoomLevel: (level: number) => void
  toggleFullscreen: () => void
  print: () => void
  findNext: () => void
  findPrevious: () => void
  showFindBar: (show: boolean) => void
  setFindQuery: (query: string) => void
  setFindMatches: (matches: number, index: number) => void
  addDownload: (download: Omit<Download, 'id' | 'startTime'>) => void
  updateDownload: (id: string, update: Partial<Download>) => void
  removeDownload: (id: string) => void
  clearDownloads: () => void
}

export const useBrowserStore = create<BrowserState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  agentMode: 'autonomous',
  agentActive: false,
  visitedSites: [],
  isInitialized: false,
  zoomLevel: 100,
  downloads: [],
  isFindVisible: false,
  findQuery: '',
  findMatches: 0,
  findIndex: 0,

  initialize: async () => {
    if (get().isInitialized) return

    if (window.electronAPI?.browser) {
      const { tabs, activeId } = await window.electronAPI.browser.getTabs()
      const mode = await window.electronAPI.settings.get()

      set({
        tabs,
        activeTabId: activeId,
        agentMode: mode || 'autonomous',
        isInitialized: true
      })

      window.electronAPI.browser.onTabsUpdated(({ tabs, activeId }) => {
        set({ tabs, activeTabId: activeId })
      })
    } else {
      set({ isInitialized: true })
    }
  },

  setTabs: (tabs, activeId) => set({ tabs, activeTabId: activeId }),

  setActiveTab: async (tabId) => {
    if (window.electronAPI?.browser) {
      await window.electronAPI.browser.setActiveTab(tabId)
      set({ activeTabId: tabId })
    }
  },

  newTab: async (url) => {
    if (window.electronAPI?.browser) {
      const { tabId } = await window.electronAPI.browser.newTab(url)
      set({ activeTabId: tabId })
    }
  },

  closeTab: async (tabId) => {
    if (window.electronAPI?.browser) {
      await window.electronAPI.browser.closeTab(tabId)
    }
  },

  navigate: async (url) => {
    const { activeTabId } = get()
    if (window.electronAPI?.browser && activeTabId) {
      await window.electronAPI.browser.navigate(activeTabId, url)
    }
  },

  goBack: async () => {
    const { activeTabId } = get()
    if (window.electronAPI?.browser && activeTabId) {
      await window.electronAPI.browser.goBack(activeTabId)
    }
  },

  goForward: async () => {
    const { activeTabId } = get()
    if (window.electronAPI?.browser && activeTabId) {
      await window.electronAPI.browser.goForward(activeTabId)
    }
  },

  reload: async () => {
    const { activeTabId } = get()
    if (window.electronAPI?.browser && activeTabId) {
      await window.electronAPI.browser.reload(activeTabId)
    }
  },

  stop: async () => {
    const { activeTabId } = get()
    if (window.electronAPI?.browser && activeTabId) {
      await window.electronAPI.browser.stop(activeTabId)
    }
  },

  setAgentMode: (mode) => {
    set({ agentMode: mode })
    if (window.electronAPI?.settings) {
      window.electronAPI.settings.set({ agentMode: mode })
    }
  },

  setAgentActive: (active) => set({ agentActive: active }),

  addVisitedSite: (site) => {
    const visited: VisitedSite = {
      ...site,
      id: `site-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now()
    }
    set((state) => ({
      visitedSites: [visited, ...state.visitedSites].slice(0, 10)
    }))
  },

  clearVisitedSites: () => set({ visitedSites: [] }),

  zoomIn: () => {
    const { zoomLevel } = get()
    const newLevel = Math.min(zoomLevel + 10, 300)
    set({ zoomLevel: newLevel })
    if (window.electronAPI?.browser) {
      window.electronAPI.browser.setZoomLevel(newLevel / 100)
    }
  },

  zoomOut: () => {
    const { zoomLevel } = get()
    const newLevel = Math.max(zoomLevel - 10, 25)
    set({ zoomLevel: newLevel })
    if (window.electronAPI?.browser) {
      window.electronAPI.browser.setZoomLevel(newLevel / 100)
    }
  },

  resetZoom: () => {
    set({ zoomLevel: 100 })
    if (window.electronAPI?.browser) {
      window.electronAPI.browser.setZoomLevel(1)
    }
  },

  setZoomLevel: (level) => {
    set({ zoomLevel: level })
    if (window.electronAPI?.browser) {
      window.electronAPI.browser.setZoomLevel(level / 100)
    }
  },

  toggleFullscreen: () => {
    if (window.electronAPI?.browser) {
      window.electronAPI.browser.toggleFullscreen()
    }
  },

  print: () => {
    if (window.electronAPI?.browser) {
      window.electronAPI.browser.print()
    }
  },

  findNext: () => {
    const { findQuery } = get()
    if (window.electronAPI?.browser && findQuery) {
      window.electronAPI.browser.findNext()
    }
  },

  findPrevious: () => {
    const { findQuery } = get()
    if (window.electronAPI?.browser && findQuery) {
      window.electronAPI.browser.findPrevious()
    }
  },

  showFindBar: (show) => set({ isFindVisible: show, findQuery: show ? '' : '', findMatches: 0, findIndex: 0 }),

  setFindQuery: (query) => {
    set({ findQuery: query })
    if (window.electronAPI?.browser && query) {
      window.electronAPI.browser.find(query)
    } else if (!query) {
      set({ findMatches: 0, findIndex: 0 })
    }
  },

  setFindMatches: (matches, index) => set({ findMatches: matches, findIndex: index }),

  addDownload: (download) => {
    const newDownload: Download = {
      ...download,
      id: `dl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      startTime: Date.now()
    }
    set((state) => ({ downloads: [newDownload, ...state.downloads] }))
  },

  updateDownload: (id, update) => {
    set((state) => ({
      downloads: state.downloads.map((d) =>
        d.id === id ? { ...d, ...update } : d
      )
    }))
  },

  removeDownload: (id) => {
    set((state) => ({ downloads: state.downloads.filter((d) => d.id !== id) }))
  },

  clearDownloads: () => set({ downloads: [] })
}))
