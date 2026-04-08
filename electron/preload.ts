import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // Agent communication
  sendToAgent: (message: string) => ipcRenderer.invoke('agent:send', message),
  onAgentResponse: (callback: (response: string) => void) => {
    ipcRenderer.on('agent:response', (_event, response) => callback(response))
  },
  
  // Browser control
  navigateTo: (url: string) => ipcRenderer.invoke('browser:navigate', url),
  getBrowserState: () => ipcRenderer.invoke('browser:state'),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings: Record<string, unknown>) => ipcRenderer.invoke('settings:set', settings),
  
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  
  // Platform info
  platform: process.platform
})

declare global {
  interface Window {
    electronAPI: {
      getAppInfo: () => Promise<{ version: string; name: string; platform: string }>
      sendToAgent: (message: string) => Promise<string>
      onAgentResponse: (callback: (response: string) => void) => void
      navigateTo: (url: string) => Promise<{ success: boolean; error?: string }>
      getBrowserState: () => Promise<{ url: string; title: string }>
      getSettings: () => Promise<Record<string, unknown>>
      setSettings: (settings: Record<string, unknown>) => Promise<void>
      minimizeWindow: () => Promise<void>
      maximizeWindow: () => Promise<void>
      closeWindow: () => Promise<void>
      platform: string
    }
  }
}