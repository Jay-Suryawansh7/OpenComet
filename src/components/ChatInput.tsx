import { useState, useRef, useEffect } from 'react'
import { Plus, Mic, ArrowRight } from 'lucide-react'
import { ModelSelector } from '@/components/ModelSelector'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSubmit: (message: string) => void
  isLoading: boolean
}

export function ChatInput({ onSubmit, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return
    onSubmit(input.trim())
    setInput('')
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`
    }
  }, [input])

  return (
    <div className="w-full max-w-[680px] mx-auto">
      <div className="relative rounded-2xl border border-white/[0.08] bg-[#161a22]/90 backdrop-blur-xl shadow-[0_0_60px_-10px_rgba(34,211,238,0.06)] transition-shadow focus-within:shadow-[0_0_60px_-10px_rgba(34,211,238,0.12)] focus-within:border-white/[0.12]">
        {/* Top row — textarea */}
        <div className="px-4 pt-4 pb-1">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type / for search modes and shortcuts"
            rows={1}
            disabled={isLoading}
            className="w-full resize-none bg-transparent text-[15px] text-white/85 placeholder:text-white/25 focus:outline-none leading-relaxed"
          />
        </div>

        {/* Bottom bar — model selector + actions */}
        <div className="flex items-center justify-between px-3 pb-3 pt-1">
          <div className="flex items-center gap-1">
            <button className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/5 hover:text-white/60">
              <Plus size={18} />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <ModelSelector />

            <button className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/5 hover:text-white/60">
              <Mic size={16} />
            </button>

            <button
              onClick={handleSubmit}
              disabled={isLoading || !input.trim()}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                input.trim()
                  ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:bg-cyan-400'
                  : 'bg-white/10 text-white/30'
              )}
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
