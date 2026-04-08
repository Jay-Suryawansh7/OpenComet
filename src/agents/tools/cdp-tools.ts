import { useBrowserStore } from '@/store/browserStore'

export interface ToolResult {
  success: boolean
  data?: unknown
  error?: string
}

export async function cdpNavigate(url: string): Promise<ToolResult> {
  try {
    const store = useBrowserStore.getState()
    const activeTabId = store.activeTabId

    if (!activeTabId || !window.electronAPI?.browser) {
      await store.navigate(url)
      return { success: true, data: { message: 'Navigating to ' + url } }
    }

    const result = await window.electronAPI.browser.navigate(activeTabId, url)
    if (result.success) {
      store.addVisitedSite({ url, title: '' })
    }
    return result
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function cdpSearch(query: string): Promise<ToolResult> {
  try {
    const store = useBrowserStore.getState()

    if (!window.electronAPI?.browser) {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`
      await store.navigate(searchUrl)
      return { success: true, data: { message: 'Searching: ' + query } }
    }

    const { tabId } = await window.electronAPI.browser.search(query)
    const tabs = store.tabs
    const tab = tabs.find(t => t.id === tabId)
    if (tab) {
      store.addVisitedSite({ url: tab.url, title: query })
    }
    return { success: true, data: { tabId, query } }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function cdpScreenshot(): Promise<ToolResult> {
  try {
    const store = useBrowserStore.getState()
    const activeTabId = store.activeTabId

    if (!activeTabId || !window.electronAPI?.browser) {
      return { success: false, error: 'No active browser tab' }
    }

    const result = await window.electronAPI.browser.screenshot(activeTabId)
    if (result.data) {
      return { success: true, data: { screenshot: result.data } }
    }
    return { success: false, error: result.error || 'Failed to capture screenshot' }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function cdpGetPageContent(): Promise<ToolResult> {
  try {
    const store = useBrowserStore.getState()
    const activeTabId = store.activeTabId

    if (!activeTabId || !window.electronAPI?.browser) {
      return { success: false, error: 'No active browser tab' }
    }

    const result = await window.electronAPI.browser.getPageContent(activeTabId)
    if (result.error) {
      return { success: false, error: result.error }
    }

    return {
      success: true,
      data: {
        text: result.text,
        url: result.url,
        title: result.title
      }
    }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function cdpGetTabs(): Promise<ToolResult> {
  try {
    const store = useBrowserStore.getState()
    return { success: true, data: { tabs: store.tabs } }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function cdpNewTab(url?: string): Promise<ToolResult> {
  try {
    const store = useBrowserStore.getState()
    await store.newTab(url)
    return { success: true, data: { message: url ? 'Opened ' + url : 'New tab created' } }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function cdpCloseTab(tabId?: string): Promise<ToolResult> {
  try {
    const store = useBrowserStore.getState()
    const targetTabId = tabId || store.activeTabId
    if (!targetTabId) {
      return { success: false, error: 'No tab specified' }
    }
    await store.closeTab(targetTabId)
    return { success: true, data: { message: 'Tab closed' } }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function cdpGoBack(): Promise<ToolResult> {
  try {
    const store = useBrowserStore.getState()
    await store.goBack()
    return { success: true, data: { message: 'Navigated back' } }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function cdpGoForward(): Promise<ToolResult> {
  try {
    const store = useBrowserStore.getState()
    await store.goForward()
    return { success: true, data: { message: 'Navigated forward' } }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function cdpReload(): Promise<ToolResult> {
  try {
    const store = useBrowserStore.getState()
    await store.reload()
    return { success: true, data: { message: 'Page reloaded' } }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export function cdpTools() {
  return {
    cdp_navigate: {
      description: 'Navigate to a URL or search query. Use this when user asks to visit a website, search for something, or browse a specific page.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL or search query to navigate to' }
        },
        required: ['url']
      }
    },
    cdp_screenshot: {
      description: 'Capture a screenshot of the current browser page. Returns base64 image data.',
      parameters: {
        type: 'object',
        properties: {}
      }
    },
    cdp_get_page_content: {
      description: 'Extract the visible text content from the current page. Useful for reading articles, getting information, or summarizing page content.',
      parameters: {
        type: 'object',
        properties: {}
      }
    },
    cdp_search: {
      description: 'Search the web using Google and open results. Use this for research queries, looking up information, or finding relevant websites.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' }
        },
        required: ['query']
      }
    },
    cdp_get_tabs: {
      description: 'Get list of all open browser tabs.',
      parameters: {
        type: 'object',
        properties: {}
      }
    },
    cdp_new_tab: {
      description: 'Open a new browser tab, optionally at a specific URL.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Optional URL to open in new tab' }
        }
      }
    },
    cdp_close_tab: {
      description: 'Close a browser tab by ID, or the active tab if no ID provided.',
      parameters: {
        type: 'object',
        properties: {
          tabId: { type: 'string', description: 'Tab ID to close (optional, defaults to active tab)' }
        }
      }
    },
    cdp_go_back: {
      description: 'Navigate back in browser history.',
      parameters: {
        type: 'object',
        properties: {}
      }
    },
    cdp_go_forward: {
      description: 'Navigate forward in browser history.',
      parameters: {
        type: 'object',
        properties: {}
      }
    },
    cdp_reload: {
      description: 'Reload the current page.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  }
}
