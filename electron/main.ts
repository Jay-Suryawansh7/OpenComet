import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import log from 'electron-log'
import { spawn, ChildProcess } from 'child_process'
import * as fs from 'fs'

log.transports.file.level = 'info'
log.transports.console.level = 'debug'

log.info('OpenComet starting...')

const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged

let mainWindow: BrowserWindow | null = null
let agentProcess: ChildProcess | null = null

const AGENT_SCRIPT_PATH = isDev 
  ? join(__dirname, '..', 'agent', 'server.py')
  : join(process.resourcesPath || '', 'agent', 'server.py')

function startAgentServer(): boolean {
  if (agentProcess) {
    log.info('Agent server already running')
    return true
  }
  
  try {
    // Check if Python agent exists
    if (!fs.existsSync(AGENT_SCRIPT_PATH)) {
      log.warn(`Agent script not found at: ${AGENT_SCRIPT_PATH}`)
      return false
    }
    
    log.info('Starting agent server...')
    agentProcess = spawn('python3', [AGENT_SCRIPT_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env }
    })
    
    agentProcess.stdout?.on('data', (data) => {
      log.info(`Agent: ${data}`)
    })
    
    agentProcess.stderr?.on('data', (data) => {
      log.error(`Agent error: ${data}`)
    })
    
    agentProcess.on('close', (code) => {
      log.info(`Agent process exited with code: ${code}`)
      agentProcess = null
    })
    
    return true
  } catch (error) {
    log.error('Failed to start agent server:', error)
    return false
  }
}

function stopAgentServer() {
  if (agentProcess) {
    log.info('Stopping agent server...')
    agentProcess.kill()
    agentProcess = null
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
      sandbox: true,
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
  
  // Start the agent server
  startAgentServer()
  
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
  stopAgentServer()
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