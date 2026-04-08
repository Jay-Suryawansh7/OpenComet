export interface TabInfo {
  id: string
  url: string
  title: string
  favicon: string
  isLoading: boolean
}

export interface ElectronAPI {
  getAppInfo: () => Promise<{ version: string; name: string; platform: string }>
  browser: {
    getTabs: () => Promise<{ tabs: TabInfo[]; activeId: string | null }>
    newTab: (url?: string) => Promise<{ tabId: string }>
    closeTab: (tabId: string) => Promise<{ success: boolean }>
    setActiveTab: (tabId: string) => Promise<{ success: boolean }>
    navigate: (tabId: string, url: string) => Promise<{ success: boolean; error?: string }>
    goBack: (tabId: string) => Promise<{ success: boolean }>
    goForward: (tabId: string) => Promise<{ success: boolean }>
    reload: (tabId: string) => Promise<{ success: boolean }>
    screenshot: (tabId: string) => Promise<{ data?: string; error?: string }>
    getPageContent: (tabId: string) => Promise<{ text?: string; url?: string; title?: string; error?: string }>
    search: (query: string) => Promise<{ tabId: string }>
    searchAndScrape: (query: string) => Promise<{ links: any[]; images: any[]; videos: any[]; error?: string }>
    setVisibility: (visible: boolean) => Promise<{ success: boolean }>
    openDevTools: () => Promise<void>
    closeDevTools: () => Promise<void>
    onTabsUpdated: (callback: (data: { tabs: TabInfo[]; activeId: string | null }) => void) => void
  }
  settings: {
    get: () => Promise<'autonomous' | 'confirmation'>
    set: (settings: Record<string, unknown>) => Promise<void>
  }
  minimizeWindow: () => Promise<void>
  maximizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
  platform: string
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
