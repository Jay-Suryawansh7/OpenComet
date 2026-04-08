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

  useEffect(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`
    }
  }, [input])

  return (
    <div className="w-full max-w-[640px] mx-auto">
      <div className="relative rounded-2xl border border-white/[0.08] bg-[#161a22]/80 backdrop-blur-xl shadow-[0_2px_40px_-8px_rgba(0,0,0,0.5)] transition-shadow focus-within:shadow-[0_2px_40px_-8px_rgba(34,211,238,0.08)] focus-within:border-white/[0.12]">
        {/* Textarea */}
        <div className="px-4 pt-3.5 pb-1">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type @ for connectors and sources"
            rows={1}
            disabled={isLoading}
            className="w-full resize-none bg-transparent text-[14px] text-white/80 placeholder:text-white/25 focus:outline-none leading-relaxed"
          />
        </div>

        {/* Bottom controls */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-0.5">
          {/* Left — attachment button */}
          <button className="flex h-7 w-7 items-center justify-center rounded-lg text-white/25 transition-colors hover:bg-white/[0.04] hover:text-white/50">
            <Plus size={16} />
          </button>

          {/* Right — model, mic, send */}
          <div className="flex items-center gap-1">
            <ModelSelector />

            <button className="flex h-7 w-7 items-center justify-center rounded-lg text-white/25 transition-colors hover:bg-white/[0.04] hover:text-white/50">
              <Mic size={14} />
            </button>

            <button
              onClick={handleSubmit}
              disabled={isLoading || !input.trim()}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full transition-all',
                input.trim()
                  ? 'bg-cyan-500 text-black shadow-[0_0_16px_rgba(34,211,238,0.25)] hover:bg-cyan-400'
                  : 'bg-white/[0.08] text-white/25'
              )}
            >
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
