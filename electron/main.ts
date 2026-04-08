import { app, BrowserWindow, ipcMain } from 'electron'
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
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
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
    mainWindow = null
  })

  if (isDev) {
    log.info('Loading dev server URL...')
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    log.info('Loading production build...')
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    log.error(`Failed to load: ${errorCode} - ${errorDescription}`)
  })
}

app.whenReady().then(() => {
  log.info('App ready')
  
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

ipcMain.handle('get-app-info', () => {
  return {
    version: app.getVersion(),
    name: app.getName(),
    platform: process.platform
  }
})

process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled Rejection:', reason)
})
