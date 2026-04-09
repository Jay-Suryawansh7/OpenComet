import { useBrowserStore } from '@/store/browserStore'
import { ZoomIn } from 'lucide-react'

export function ZoomControls() {
  const { zoomLevel, zoomIn, zoomOut, resetZoom } = useBrowserStore()

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={zoomOut}
        className="p-1.5 rounded hover:bg-white/[0.08] transition-colors"
        title="Zoom out (Cmd+-)"
      >
        <ZoomIn size={14} className="text-white/50 rotate-180" />
      </button>
      
      <button
        onClick={resetZoom}
        className="px-1.5 py-1 rounded hover:bg-white/[0.08] transition-colors min-w-[48px]"
        title="Reset zoom (Cmd+0)"
      >
        <span className="text-[11px] text-white/50 font-medium">{zoomLevel}%</span>
      </button>
      
      <button
        onClick={zoomIn}
        className="p-1.5 rounded hover:bg-white/[0.08] transition-colors"
        title="Zoom in (Cmd++)"
      >
        <ZoomIn size={14} className="text-white/50" />
      </button>
    </div>
  )
}
