import { useState } from 'react'
import { useBrowserStore, type Download } from '@/store/browserStore'
import { cn } from '@/lib/utils'
import { Download as DownloadIcon, X, CheckCircle, AlertCircle, Clock, Trash2 } from 'lucide-react'

export function DownloadsPanel() {
  const { downloads, removeDownload, clearDownloads } = useBrowserStore()
  const [isOpen, setIsOpen] = useState(false)

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp
    const seconds = Math.floor(diff / 1000)
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return new Date(timestamp).toLocaleDateString()
  }

  const getStatusIcon = (status: Download['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-emerald-400" />
      case 'failed':
        return <AlertCircle size={16} className="text-red-400" />
      case 'downloading':
        return <Clock size={16} className="text-cyan-400 animate-pulse" />
      default:
        return <Clock size={16} className="text-white/30" />
    }
  }

  const activeDownloads = downloads.filter(d => d.status === 'downloading' || d.status === 'pending')
  const completedDownloads = downloads.filter(d => d.status === 'completed' || d.status === 'failed')

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'tabbar-action-btn relative',
          activeDownloads.length > 0 && 'text-cyan-400'
        )}
        title="Downloads"
      >
        <DownloadIcon size={14} strokeWidth={1.6} />
        {activeDownloads.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-[9px] font-bold text-black flex items-center justify-center">
            {activeDownloads.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="fixed top-[80px] right-4 z-50 w-[360px] bg-[#1a1b20] border border-white/[0.12] rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <h3 className="text-[14px] font-medium text-white/90">Downloads</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-white/[0.08] transition-colors"
              >
                <X size={14} className="text-white/40" />
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {downloads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <DownloadIcon size={32} className="text-white/20 mb-3" />
                  <p className="text-[13px] text-white/40">No downloads yet</p>
                  <p className="text-[11px] text-white/25 mt-1">Files you download will appear here</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {activeDownloads.map((download) => (
                    <div
                      key={download.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                        {getStatusIcon(download.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-white/80 truncate">{download.filename}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {download.status === 'downloading' && (
                            <>
                              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-cyan-500 rounded-full transition-all"
                                  style={{ width: `${(download.receivedBytes / download.totalBytes) * 100}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-white/40 shrink-0">
                                {formatBytes(download.receivedBytes)} / {formatBytes(download.totalBytes)}
                              </span>
                            </>
                          )}
                          {download.status === 'pending' && (
                            <span className="text-[11px] text-white/40">Waiting...</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeDownload(download.id)}
                        className="p-1 rounded hover:bg-white/[0.08] transition-colors shrink-0"
                      >
                        <X size={12} className="text-white/30" />
                      </button>
                    </div>
                  ))}

                  {completedDownloads.length > 0 && (
                    <>
                      <div className="text-[10px] text-white/30 uppercase tracking-wider px-2 pt-3 pb-1">
                        Completed
                      </div>
                      {completedDownloads.map((download) => (
                        <div
                          key={download.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.04] transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                            {getStatusIcon(download.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] text-white/70 truncate">{download.filename}</p>
                            <p className="text-[10px] text-white/40 mt-0.5">
                              {formatBytes(download.totalBytes)} • {formatTime(download.startTime)}
                            </p>
                          </div>
                          <button
                            onClick={() => removeDownload(download.id)}
                            className="p-1 rounded hover:bg-white/[0.08] transition-colors shrink-0"
                          >
                            <Trash2 size={12} className="text-white/30" />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {downloads.length > 0 && (
              <div className="px-4 py-3 border-t border-white/[0.06]">
                <button
                  onClick={clearDownloads}
                  className="text-[12px] text-white/40 hover:text-white/60 transition-colors"
                >
                  Clear all downloads
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
