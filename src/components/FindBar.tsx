import { useState, useEffect, useRef } from 'react'
import { useBrowserStore } from '@/store/browserStore'
import { cn } from '@/lib/utils'
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react'

export function FindBar() {
  const { isFindVisible, showFindBar, findQuery, setFindQuery, findMatches, findIndex, findNext, findPrevious } = useBrowserStore()
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isFindVisible && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isFindVisible])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        showFindBar(true)
      }
      if (e.key === 'Escape' && isFindVisible) {
        showFindBar(false)
      }
      if (e.key === 'Enter') {
        if (e.shiftKey) {
          findPrevious()
        } else {
          findNext()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFindVisible, showFindBar, findNext, findPrevious])

  const handleInputChange = (value: string) => {
    setInputValue(value)
    setFindQuery(value)
  }

  const handleClose = () => {
    showFindBar(false)
    setInputValue('')
    if (window.electronAPI?.browser?.stopFind) {
      window.electronAPI.browser.stopFind()
    }
  }

  if (!isFindVisible) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-3 py-2 bg-[#1a1b20] border border-white/[0.12] rounded-xl shadow-2xl">
      <Search size={14} className="text-white/40 shrink-0" />
      
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder="Find in page..."
        className="w-[280px] bg-transparent text-[13px] text-white/90 placeholder:text-white/30 outline-none"
      />
      
      {findQuery && (
        <div className="flex items-center gap-1 text-[11px] text-white/50">
          <span className="font-medium text-white/70">
            {findMatches > 0 ? findIndex + 1 : 0}
          </span>
          <span>/</span>
          <span>{findMatches}</span>
        </div>
      )}
      
      <div className="flex items-center gap-1">
        <button
          onClick={findPrevious}
          disabled={!findQuery}
          className={cn(
            'p-1 rounded hover:bg-white/[0.08] transition-colors',
            !findQuery && 'opacity-40 cursor-not-allowed'
          )}
          title="Previous (Shift+Enter)"
        >
          <ChevronUp size={14} className="text-white/60" />
        </button>
        <button
          onClick={findNext}
          disabled={!findQuery}
          className={cn(
            'p-1 rounded hover:bg-white/[0.08] transition-colors',
            !findQuery && 'opacity-40 cursor-not-allowed'
          )}
          title="Next (Enter)"
        >
          <ChevronDown size={14} className="text-white/60" />
        </button>
      </div>
      
      <button
        onClick={handleClose}
        className="p-1 rounded hover:bg-white/[0.08] transition-colors ml-1"
        title="Close (Esc)"
      >
        <X size={14} className="text-white/40" />
      </button>
    </div>
  )
}
