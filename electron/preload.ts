import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),

  browser: {
    getTabs: () => ipcRenderer.invoke('browser:getTabs'),
    newTab: (url?: string) => ipcRenderer.invoke('browser:newTab', url),
    closeTab: (tabId: string) => ipcRenderer.invoke('browser:closeTab', tabId),
    setActiveTab: (tabId: string) => ipcRenderer.invoke('browser:setActiveTab', tabId),
    navigate: (tabId: string, url: string) => ipcRenderer.invoke('browser:navigate', tabId, url),
    goBack: (tabId: string) => ipcRenderer.invoke('browser:goBack', tabId),
    goForward: (tabId: string) => ipcRenderer.invoke('browser:goForward', tabId),
    reload: (tabId: string) => ipcRenderer.invoke('browser:reload', tabId),
    screenshot: (tabId: string) => ipcRenderer.invoke('browser:screenshot', tabId),
    getPageContent: (tabId: string) => ipcRenderer.invoke('browser:getPageContent', tabId),
    search: (query: string) => ipcRenderer.invoke('browser:search', query),
    searchAndScrape: (query: string) => ipcRenderer.invoke('browser:searchAndScrape', query),
    setVisibility: (visible: boolean) => ipcRenderer.invoke('browser:setVisibility', visible),
    openDevTools: () => ipcRenderer.invoke('browser:openDevTools'),
    closeDevTools: () => ipcRenderer.invoke('browser:closeDevTools'),
    onTabsUpdated: (callback: (data: { tabs: any[]; activeId: string | null }) => void) => {
      ipcRenderer.on('browser:tabs-updated', (_event, data) => callback(data))
    }
  },

  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (settings: Record<string, unknown>) => ipcRenderer.invoke('settings:set', settings)
  },

  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),

  platform: process.platform
})

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
    onTabsUpdated: (callback: (data: { tabs: any[]; activeId: string | null }) => void) => void
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

export interface TabInfo {
  id: string
  url: string
  title: string
  favicon: string
  isLoading: boolean
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
