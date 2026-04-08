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
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleAttachment = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setInput((prev) => prev + `\n[Attached file: ${file.name}]\n`)
      }
      reader.readAsText(file)
    }
    e.target.value = ''
  }

  const handleMic = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported. Please use Chrome.')
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SpeechRecognition() as any
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.onresult = (event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => {
      const transcript = event.results[0][0].transcript
      setInput((prev) => prev + transcript)
    }
    recognition.onerror = () => {
      console.log('Speech recognition error')
    }
    recognition.start()
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
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept=".txt,.md,.json,.csv,.js,.ts,.py,.html,.css"
      />
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
          <button onClick={handleAttachment} className="flex h-7 w-7 items-center justify-center rounded-lg text-white/25 transition-colors hover:bg-white/[0.04] hover:text-white/50">
            <Plus size={16} />
          </button>

          {/* Right — model, mic, send */}
          <div className="flex items-center gap-1">
            <ModelSelector />

            <button onClick={handleMic} className="flex h-7 w-7 items-center justify-center rounded-lg text-white/25 transition-colors hover:bg-white/[0.04] hover:text-white/50">
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
