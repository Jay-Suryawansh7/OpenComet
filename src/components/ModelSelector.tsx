import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { useSettingsStore } from '@/store'
import { cn } from '@/lib/utils'

export function ModelSelector() {
  const {
    providers, activeProviderId, activeModelId,
    setActiveProvider, setActiveModel,
  } = useSettingsStore()

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium transition-all',
          'text-white/40 hover:text-white/65 hover:bg-white/[0.04]',
          open && 'bg-white/[0.04] text-white/65'
        )}
      >
        <span>Model</span>
        <ChevronDown size={11} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-64 rounded-xl border border-white/[0.08] bg-[#13161c]/95 backdrop-blur-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2">
          {providers.map((provider) => (
            <div key={provider.id}>
              {/* Provider heading */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.04]">
                <span className="text-sm">{provider.icon}</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/30">
                  {provider.name}
                </span>
                {!provider.apiKey && provider.id !== 'ollama' && (
                  <span className="ml-auto text-[10px] text-amber-400/60 font-medium">No key</span>
                )}
              </div>

              {/* Models */}
              {provider.models.map((model) => {
                const isActive =
                  provider.id === activeProviderId && model.id === activeModelId
                return (
                  <button
                    key={model.id}
                    onClick={() => {
                      setActiveProvider(provider.id)
                      setActiveModel(model.id)
                      setOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 px-4 py-2 text-[13px] transition-colors',
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-300'
                        : 'text-white/50 hover:bg-white/[0.04] hover:text-white/75'
                    )}
                  >
                    <span className="flex-1 text-left">{model.name}</span>
                    {isActive && <Check size={14} className="text-cyan-400" />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
