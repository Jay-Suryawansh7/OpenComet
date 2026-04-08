import { app, BrowserWindow, ipcMain, BrowserView, Menu, MenuItemConstructorOptions, Event } from 'electron'
import { join } from 'path'
import log from 'electron-log'
import { spawn, ChildProcess } from 'child_process'

log.transports.file.level = 'info'
log.transports.console.level = 'debug'

log.info('OpenComet starting...')

const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged

let mainWindow: BrowserWindow | null = null
let proxyProcess: ChildProcess | null = null

const PROXY_SCRIPT_PATH = join(__dirname, '..', 'server', 'proxy-server.js')

interface TabInfo {
  id: string
  url: string
  title: string
  favicon: string
  isLoading: boolean
}

class BrowserViewManager {
  private views: Map<string, BrowserView> = new Map()
  private activeTabId: string | null = null
  private window: BrowserWindow
  public isVisible: boolean = true
  private onUpdate: (tabs: TabInfo[], activeId: string | null) => void

  constructor(window: BrowserWindow, onUpdate: (tabs: TabInfo[], activeId: string | null) => void) {
    this.window = window
    this.onUpdate = onUpdate
  }

  private notify() {
    const tabs = this.getTabs()
    this.onUpdate(tabs, this.activeTabId)
  }

  getTabs(): TabInfo[] {
    return Array.from(this.views.entries()).map(([id, view]) => {
      const wc = view.webContents
      return {
        id,
        url: wc.getURL() || 'about:blank',
        title: wc.getTitle() || 'New Tab',
        favicon: '',
        isLoading: wc.isLoading()
      }
    })
  }

  getActiveTab(): string | null {
    return this.activeTabId
  }

  getActiveView(): BrowserView | null {
    if (!this.activeTabId) return null
    return this.views.get(this.activeTabId) || null
  }

  createTab(id?: string): string {
    const tabId = id || `tab-${Date.now()}`
    
    const view = new BrowserView({
      webPreferences: {
        partition: 'persist:main',
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        allowRunningInsecureContent: false
      }
    })

    view.webContents.session.setUserAgent(
      view.webContents.session.getUserAgent().replace(/Electron\/\S+\s/, '')
    )

    view.webContents.on('context-menu', (_event, params) => {
      const menuItems: MenuItemConstructorOptions[] = []

      if (params.isEditable) {
        menuItems.push(
          { label: 'Cut', role: 'cut', enabled: params.editFlags.canCut },
          { label: 'Copy', role: 'copy', enabled: params.editFlags.canCopy },
          { label: 'Paste', role: 'paste', enabled: params.editFlags.canPaste },
          { type: 'separator' },
          { label: 'Select All', role: 'selectAll' }
        )
      } else {
        menuItems.push(
          { label: 'Copy', role: 'copy', enabled: params.editFlags.canCopy },
          { type: 'separator' },
          { label: 'Inspect Element', click: () => view.webContents.inspectElement(params.x, params.y) },
          { type: 'separator' },
          { label: 'Open DevTools', click: () => view.webContents.openDevTools() }
        )
      }

      const contextMenu = Menu.buildFromTemplate(menuItems)
      contextMenu.popup()
    })

    view.webContents.on('did-start-loading', () => {
      log.info(`[${tabId}] Loading started`)
      this.notify()
    })

    view.webContents.on('did-stop-loading', () => {
      log.info(`[${tabId}] Loading stopped`)
      this.notify()
    })

    view.webContents.on('did-navigate', (_event, url) => {
      log.info(`[${tabId}] Navigated to: ${url}`)
      this.notify()
    })

    view.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
      log.error(`[${tabId}] Failed to load: ${errorCode} - ${errorDescription} (${validatedURL})`)
      this.notify()
    })

    view.webContents.on('page-title-updated', () => {
      this.notify()
    })

    // ── Intercept new windows and links ──────────────────────────
    // Open in same tab instead of new window
    ;(view.webContents as any).on('new-window', (event: Event, url: string, _frameName: string, disposition: string) => {
      event.preventDefault()
      log.info(`[${tabId}] Intercepted new-window: ${url} (disposition: ${disposition})`)
      if (disposition === 'background-tab' || disposition === 'new-window') {
        // Open in new tab
        const newTabId = this.createTab()
        this.navigate(newTabId, url)
        this.setActiveTab(newTabId)
      } else {
        // Open in same tab
        this.navigate(tabId, url)
      }
    })

    // Also intercept will-navigate for in-page link clicks
    ;(view.webContents as any).on('will-navigate', (_event: Event, url: string) => {
      log.info(`[${tabId}] will-navigate: ${url}`)
      // Allow all navigations - this is just a notification
    })

    // Intercept redirect chains
    ;(view.webContents as any).on('did-navigate-in-page', (_event: Event, url: string, isMainFrame: boolean) => {
      if (isMainFrame) {
        log.info(`[${tabId}] In-page navigation: ${url}`)
        this.notify()
      }
    })

    this.views.set(tabId, view)

    if (!this.activeTabId) {
      this.activeTabId = tabId
      if (this.isVisible) {
        this.window.addBrowserView(view)
        this.positionView(view)
      }
    }

    log.info(`Created tab: ${tabId}`)
    this.notify()
    return tabId
  }

  closeTab(tabId: string): boolean {
    const view = this.views.get(tabId)
    if (!view) return false

    this.window.removeBrowserView(view)
    this.views.delete(tabId)

    if (this.activeTabId === tabId) {
      const remaining = Array.from(this.views.keys())
      if (remaining.length > 0) {
        this.activeTabId = remaining[remaining.length - 1]
        const activeView = this.views.get(this.activeTabId)!
        this.window.addBrowserView(activeView)
        this.positionView(activeView)
      } else {
        this.activeTabId = null
        this.createTab()
      }
    }

    log.info(`Closed tab: ${tabId}`)
    this.notify()
    return true
  }

  setActiveTab(tabId: string): boolean {
    const view = this.views.get(tabId)
    if (!view) return false

    if (this.activeTabId) {
      const oldView = this.views.get(this.activeTabId)
      if (oldView) {
        this.window.removeBrowserView(oldView)
      }
    }

    this.activeTabId = tabId
    if (this.isVisible) {
      this.window.addBrowserView(view)
      this.positionView(view)
    }

    log.info(`Activated tab: ${tabId}`)
    this.notify()
    return true
  }

  setVisibility(visible: boolean) {
    this.isVisible = visible
    log.info(`Setting browser view visibility to: ${visible}`)

    if (this.activeTabId) {
      const view = this.views.get(this.activeTabId)
      if (view) {
        if (visible) {
          this.window.addBrowserView(view)
          this.positionView(view)
        } else {
          this.window.removeBrowserView(view)
        }
      }
    }
  }

  private positionView(view: BrowserView) {
    const [width, height] = this.window.getContentSize()
    const tabBarHeight = 72
    const sidebarWidth = 0
    view.setBounds({
      x: sidebarWidth,
      y: tabBarHeight,
      width: width - sidebarWidth,
      height: height - tabBarHeight
    })
    view.setAutoResize({ width: true, height: true, horizontal: true, vertical: true })
  }

  resizeAll() {
    const view = this.activeTabId ? this.views.get(this.activeTabId) : null
    if (view) {
      this.positionView(view)
    }
  }

  navigate(tabId: string, url: string): Promise<{ success: boolean; error?: string }> {
    const view = this.views.get(tabId)
    if (!view) return Promise.resolve({ success: false, error: 'Tab not found' })

    return new Promise((resolve) => {
      const resolved = url.startsWith('http') ? url : `https://${url}`
      
      const timeout = setTimeout(() => {
        resolve({ success: true })
      }, 10000)

      view.webContents.once('did-finish-load', () => {
        clearTimeout(timeout)
        resolve({ success: true })
      })

      view.webContents.once('did-fail-load', (_event, code, desc) => {
        clearTimeout(timeout)
        resolve({ success: false, error: `${code}: ${desc}` })
      })

      view.webContents.loadURL(resolved).catch((err) => {
        clearTimeout(timeout)
        resolve({ success: false, error: err.message })
      })
    })
  }

  goBack(tabId: string): Promise<boolean> {
    const view = this.views.get(tabId)
    if (!view) return Promise.resolve(false)
    if (!view.webContents.canGoBack()) return Promise.resolve(false)
    view.webContents.goBack()
    return Promise.resolve(true)
  }

  goForward(tabId: string): Promise<boolean> {
    const view = this.views.get(tabId)
    if (!view) return Promise.resolve(false)
    if (!view.webContents.canGoForward()) return Promise.resolve(false)
    view.webContents.goForward()
    return Promise.resolve(true)
  }

  reload(tabId: string): void {
    const view = this.views.get(tabId)
    if (view) view.webContents.reload()
  }

  async screenshot(tabId: string): Promise<{ data?: string; error?: string }> {
    const view = this.views.get(tabId)
    if (!view) return { error: 'Tab not found' }

    try {
      const image = await view.webContents.capturePage({
        x: 0,
        y: 0,
        width: view.getBounds().width,
        height: view.getBounds().height
      })
      return { data: image.toDataURL() }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  async getPageContent(tabId: string): Promise<{ text?: string; url?: string; title?: string; error?: string }> {
    const view = this.views.get(tabId)
    if (!view) return { error: 'Tab not found' }

    const url = view.webContents.getURL()
    const title = view.webContents.getTitle()

    try {
      const result = await view.webContents.executeJavaScript(`
        (function() {
          function getTextContent(el) {
            const clone = el.cloneNode(true);
            const scripts = clone.querySelectorAll('script, style, noscript, iframe');
            scripts.forEach(s => s.remove());
            return clone.innerText || clone.textContent || '';
          }
          
          const body = document.body;
          if (!body) return '';
          
          const mainContent = document.querySelector('article, main, [role="main"], .content, #content, .post, .entry');
          if (mainContent) return getTextContent(mainContent).trim();
          
          return getTextContent(body).trim().substring(0, 5000);
        })()
      `)
      return { text: result, url, title }
    } catch (err: any) {
      return { text: '', url, title, error: err.message }
    }
  }

  async search(query: string): Promise<string> {
    const searchTabId = this.activeTabId || this.createTab()
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`
    await this.navigate(searchTabId, searchUrl)
    return searchTabId
  }

  destroy() {
    for (const [_id, view] of Array.from(this.views.entries())) {
      try {
        this.window.removeBrowserView(view)
      } catch {}
    }
    this.views.clear()
    this.activeTabId = null
  }
}

let viewManager: BrowserViewManager | null = null
let agentMode: 'autonomous' | 'confirmation' = 'autonomous'

function startProxyServer(): boolean {
  if (proxyProcess) {
    log.info('Proxy server already running')
    return true
  }
  
  try {
    if (!isDev) {
      log.info('Production mode - proxy server expected to be bundled')
      return true
    }
    
    log.info('Starting proxy server...')
    proxyProcess = spawn('node', [PROXY_SCRIPT_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PROXY_PORT: '8765' }
    })
    
    proxyProcess.stdout?.on('data', (data) => {
      log.info(`Proxy: ${data}`)
    })
    
    proxyProcess.stderr?.on('data', (data) => {
      log.error(`Proxy error: ${data}`)
    })
    
    proxyProcess.on('close', (code) => {
      log.info(`Proxy process exited with code: ${code}`)
      proxyProcess = null
    })
    
    return true
  } catch (error) {
    log.error('Failed to start proxy server:', error)
    return false
  }
}

function stopProxyServer() {
  if (proxyProcess) {
    log.info('Stopping proxy server...')
    proxyProcess.kill()
    proxyProcess = null
  }
}

function createWindow() {
  log.info('Creating main window...')

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
      allowRunningInsecureContent: false
    },
    show: false,
    backgroundColor: '#1a1a1a'
  })

  mainWindow.on('ready-to-show', () => {
    log.info('Window ready to show')
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    viewManager?.destroy()
    viewManager = null
    mainWindow = null
  })

  mainWindow.on('resize', () => {
    viewManager?.resizeAll()
  })

  viewManager = new BrowserViewManager(mainWindow, (tabs, activeId) => {
    mainWindow?.webContents.send('browser:tabs-updated', { tabs, activeId })
  })

  const defaultTabId = viewManager.createTab()
  viewManager.navigate(defaultTabId, 'about:blank')

  if (isDev) {
    log.info('Loading dev server URL...')
    mainWindow.loadURL('http://localhost:5173')
  } else {
    log.info('Loading production build...')
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    log.error(`Failed to load: ${errorCode} - ${errorDescription}`)
  })
}

function setupIpcHandlers() {
  ipcMain.handle('get-app-info', () => {
    return {
      version: app.getVersion(),
      name: app.getName(),
      platform: process.platform
    }
  })

  ipcMain.handle('browser:getTabs', () => {
    return {
      tabs: viewManager?.getTabs() || [],
      activeId: viewManager?.getActiveTab() || null
    }
  })

  ipcMain.handle('browser:newTab', (_event, url?: string) => {
    const tabId = viewManager?.createTab() || ''
    if (url && tabId) {
      viewManager?.navigate(tabId, url)
    }
    return { tabId }
  })

  ipcMain.handle('browser:closeTab', (_event, tabId: string) => {
    return { success: viewManager?.closeTab(tabId) || false }
  })

  ipcMain.handle('browser:setActiveTab', (_event, tabId: string) => {
    return { success: viewManager?.setActiveTab(tabId) || false }
  })

  ipcMain.handle('browser:navigate', async (_event, tabId: string, url: string) => {
    return viewManager?.navigate(tabId, url) || { success: false, error: 'No browser' }
  })

  ipcMain.handle('browser:goBack', async (_event, tabId: string) => {
    return { success: await viewManager?.goBack(tabId) || false }
  })

  ipcMain.handle('browser:goForward', async (_event, tabId: string) => {
    return { success: await viewManager?.goForward(tabId) || false }
  })

  ipcMain.handle('browser:reload', (_event, tabId: string) => {
    viewManager?.reload(tabId)
    return { success: true }
  })

  ipcMain.handle('browser:screenshot', async (_event, tabId: string) => {
    return viewManager?.screenshot(tabId) || { error: 'No browser' }
  })

  ipcMain.handle('browser:getPageContent', async (_event, tabId: string) => {
    return viewManager?.getPageContent(tabId) || { error: 'No browser' }
  })

  ipcMain.handle('browser:search', async (_event, query: string) => {
    const tabId = await viewManager?.search(query) || ''
    return { tabId }
  })

  ipcMain.handle('browser:setVisibility', (_event, visible: boolean) => {
    if (viewManager) {
      viewManager.setVisibility(visible)
    }
    return { success: true }
  })

  // ── Window controls ─────────────────────────────────────────────
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize()
  })

  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  ipcMain.handle('window:close', () => {
    mainWindow?.close()
  })

  ipcMain.handle('browser:openDevTools', () => {
    if (viewManager) {
      const activeView = viewManager.getActiveView()
      if (activeView) {
        activeView.webContents.openDevTools()
      }
    }
  })

  ipcMain.handle('browser:closeDevTools', () => {
    if (viewManager) {
      const activeView = viewManager.getActiveView()
      if (activeView) {
        activeView.webContents.closeDevTools()
      }
    }
  })

  // ── Real search scraping via hidden BrowserView ────────────────
  ipcMain.handle('browser:searchAndScrape', async (_event, query: string) => {
    if (!mainWindow) return { error: 'No window' }

    const searchView = new BrowserView({
      webPreferences: {
        partition: 'persist:search',
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      }
    })

    // Strip Electron identifier from user agent
    searchView.webContents.session.setUserAgent(
      searchView.webContents.session.getUserAgent().replace(/Electron\/\S+\s/, '')
    )

    // Keep the view hidden (don't add it to the window)
    searchView.setBounds({ x: 0, y: 0, width: 1280, height: 900 })

    try {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en`
      await searchView.webContents.loadURL(searchUrl)

      // Wait a brief moment for dynamic content to render
      await new Promise(resolve => setTimeout(resolve, 2500))

      // Scrape organic link results
      const links = await searchView.webContents.executeJavaScript(`
        (function() {
          const results = [];
          
          // Helper to extract hostname
          const getHost = (href) => {
            try { return new URL(href).hostname; } catch(e) { return ''; }
          };

          // 1. Try standard Google search result blocks
          const searchResults = document.querySelectorAll('#search .g, #rso .g');
          searchResults.forEach((el, i) => {
            if (results.length >= 15) return;
            const linkEl = el.querySelector('a[href]:not([href^="/"])');
            const titleEl = el.querySelector('h3');
            const snippetEl = el.querySelector('[data-sncf], .VwiC3b, [style="-webkit-line-clamp:2"], .lEBKkf, span.aCOpRe');
            
            if (!linkEl || !titleEl) return;
            const url = linkEl.href;
            if (!url || url.startsWith('https://www.google') || url.startsWith('/')) return;
            
            const hostname = getHost(url);
            results.push({
              title: titleEl.innerText || '',
              url: url,
              displayUrl: hostname,
              snippet: snippetEl ? snippetEl.innerText : '',
              source: hostname.replace('www.', '').split('.')[0],
            });
          });

          // 2. Fallback: Find any links wrapping an h3 (very common Google pattern)
          if (results.length === 0) {
            document.querySelectorAll('a[href]').forEach(a => {
              if (results.length >= 15) return;
              const h3 = a.querySelector('h3');
              if (h3) {
                const url = a.href;
                if (!url || url.startsWith('https://www.google') || url.startsWith('/')) return;
                
                // Prevent duplicates
                if (results.some(r => r.url === url)) return;
                
                const hostname = getHost(url);
                
                // Try to find a snippet nearby
                let snippet = '';
                const container = a.closest('div');
                if (container && container.parentElement) {
                  const texts = Array.from(container.parentElement.querySelectorAll('div, span'))
                    .map(el => el.innerText)
                    .filter(t => t && t.length > 40 && !t.includes(h3.innerText));
                  if (texts.length > 0) snippet = texts[0];
                }

                results.push({
                  title: h3.innerText || '',
                  url: url,
                  displayUrl: hostname,
                  snippet: snippet,
                  source: hostname.replace('www.', '').split('.')[0],
                });
              }
            });
          }
          
          return results;
        })()
      `)

      // Scrape image results from the image carousel
      const images = await searchView.webContents.executeJavaScript(`
        (function() {
          const results = [];
          // Google image carousel thumbnails
          const imgEls = document.querySelectorAll('g-scrolling-carousel img, [data-lpage] img, .islir img, [jsname="sTFXNd"] img, g-img img');
          imgEls.forEach((img, i) => {
            if (i >= 20) return;
            const src = img.src || img.getAttribute('data-src') || '';
            if (!src || src.startsWith('data:image/gif') || src.length < 30) return;
            const alt = img.alt || 'Image result';
            const parent = img.closest('a');
            const url = parent ? (parent.href || '') : src;
            results.push({
              title: alt,
              url: url,
              thumbnail: src,
              source: 'Google Images',
            });
          });
          return results;
        })()
      `)

      // Scrape video results
      const videos = await searchView.webContents.executeJavaScript(`
        (function() {
          const results = [];
          // Video carousels and inline video results
          const videoEls = document.querySelectorAll('[data-surl], .RzdJxc, .X5OiLe, video-voyager a');
          videoEls.forEach((el, i) => {
            if (i >= 10) return;
            const a = el.tagName === 'A' ? el : el.querySelector('a[href]');
            if (!a) return;
            const url = a.href;
            if (!url || url.startsWith('/')) return;
            const titleEl = el.querySelector('[aria-label], .fc9yUc, .cHaqb, h3, .DhN8Cf');
            const title = titleEl ? (titleEl.getAttribute('aria-label') || titleEl.innerText || '') : '';
            const durationEl = el.querySelector('.FGpTBd, .J1mWY, [role="text"]');
            const duration = durationEl ? durationEl.innerText : '';
            const thumbEl = el.querySelector('img');
            const thumbnail = thumbEl ? (thumbEl.src || thumbEl.getAttribute('data-src') || '') : '';
            let source = 'Video';
            try { source = new URL(url).hostname.replace('www.', ''); } catch(e) {}
            if (title) {
              results.push({ title, url, duration, thumbnail, source });
            }
          });

          // Also try to get YouTube video results from general search
          if (results.length === 0) {
            document.querySelectorAll('#search a[href*="youtube.com/watch"], #search a[href*="youtu.be"]').forEach((a, i) => {
              if (i >= 8) return;
              const url = a.href;
              const containerG = a.closest('.g') || a.parentElement;
              const titleEl = containerG ? containerG.querySelector('h3') : null;
              const title = titleEl ? titleEl.innerText : 'YouTube Video';
              const thumbEl = containerG ? containerG.querySelector('img') : null;
              const thumbnail = thumbEl ? (thumbEl.src || '') : '';
              results.push({ title, url, duration: '', thumbnail, source: 'youtube.com' });
            });
          }
          return results;
        })()
      `)

      // Destroy the hidden search view
      searchView.webContents.close()

      return { links, images, videos }
    } catch (err: any) {
      log.error('Search scrape failed:', err)
      try { searchView.webContents.close() } catch {}
      return { error: err.message, links: [], images: [], videos: [] }
    }
  })

  ipcMain.handle('settings:get', () => {
    return agentMode
  })

  ipcMain.handle('settings:set', (_event, settings: Record<string, unknown>) => {
    if (settings.agentMode) {
      agentMode = settings.agentMode as 'autonomous' | 'confirmation'
    }
  })
}

app.whenReady().then(() => {
  log.info('App ready')
  
  setupIpcHandlers()
  startProxyServer()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  log.info('All windows closed')
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  log.info('App quitting...')
  stopProxyServer()
})

process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled Rejection:', reason)
})
