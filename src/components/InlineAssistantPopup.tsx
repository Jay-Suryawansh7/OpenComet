import { useEffect, useRef, useCallback, useState } from 'react';
import { useInlineAssistantStore } from '@/store/inlineAssistantStore';
import { useChatStore } from '@/store';
import { useAgent } from '@/hooks/useAgent';
import { INLINE_ACTION_LABELS } from '@/types/inline';
import type { InlineAction } from '@/types/inline';
import {
  Loader2, Copy, ArrowRight, Check,
  FileText, ShieldCheck, BookOpen, Languages, PenTool
} from 'lucide-react';

const ACTION_ICONS: Record<InlineAction, React.ReactNode> = {
  summarize: <FileText size={12} />,
  fact_check: <ShieldCheck size={12} />,
  define: <BookOpen size={12} />,
  translate: <Languages size={12} />,
  rephrase: <PenTool size={12} />,
};

const ALL_ACTIONS: InlineAction[] = ['summarize', 'fact_check', 'define', 'translate', 'rephrase'];

export function InlineAssistantPopup() {
  const {
    isVisible,
    isLoading,
    selectedText,
    position,
    result,
    hide,
    setLoading,
    setResult,
    clearResult
  } = useInlineAssistantStore();
  
  const { addMessage } = useChatStore();
  const { sendMessage } = useAgent();
  const popupRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useLocalStorageState(false, 'inline-copied');

  const handleAction = useCallback(async (action: InlineAction) => {
    if (!selectedText || isLoading) return;

    setLoading(true);
    clearResult();

    try {
      let prompt = '';
      switch (action) {
        case 'summarize':
          prompt = `Summarize the following text concisely:\n\n${selectedText}`;
          break;
        case 'fact_check':
          prompt = `Fact-check the following claims and identify any inaccuracies:\n\n${selectedText}`;
          break;
        case 'define':
          prompt = `Define and explain the key terms in the following text:\n\n${selectedText}`;
          break;
        case 'translate':
          prompt = `Translate the following text to English (if not already) and explain any cultural context:\n\n${selectedText}`;
          break;
        case 'rephrase':
          prompt = `Rephrase the following text in a clearer, more professional tone:\n\n${selectedText}`;
          break;
      }

      const response = await sendMessage(prompt);

      setResult({
        action,
        originalText: selectedText,
        result: response || 'No response received.',
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Inline action failed:', error);
      setResult({
        action,
        originalText: selectedText,
        result: 'An error occurred. Please try again.',
        timestamp: Date.now()
      });
    }
  }, [selectedText, isLoading, sendMessage, setLoading, setResult, clearResult]);

  const handleCopy = useCallback(() => {
    if (result?.result) {
      navigator.clipboard.writeText(result.result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result?.result, setCopied]);

  const handleSendToPanel = useCallback(() => {
    if (result?.result) {
      addMessage({ role: 'user', content: selectedText });
      addMessage({ role: 'assistant', content: result.result });
    }
    hide();
  }, [result?.result, selectedText, addMessage, hide]);

  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (!target.closest('.inline-assistant-btn')) {
          hide();
        }
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        hide();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, hide]);

  if (!isVisible) return null;

  const popupStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(position.x, window.innerWidth - 320),
    top: Math.min(position.y, window.innerHeight - 200),
    transform: 'translateX(-50%)',
    zIndex: 999999,
  };

  return (
    <div
      ref={popupRef}
      style={popupStyle}
      className="animate-in fade-in zoom-in-95 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-[#1a1d24] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden min-w-[280px] max-w-[360px]">
        {/* Actions Row */}
        <div className="flex items-center gap-1 p-2 border-b border-white/[0.06]">
          {ALL_ACTIONS.map((action) => (
            <button
              key={action}
              onClick={() => handleAction(action)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] text-white/70 hover:text-white transition-colors disabled:opacity-50"
              title={INLINE_ACTION_LABELS[action]}
            >
              {ACTION_ICONS[action]}
              <span className="hidden sm:inline">{INLINE_ACTION_LABELS[action]}</span>
            </button>
          ))}
        </div>

        {/* Selected Text Preview */}
        <div className="px-3 py-2 border-b border-white/[0.04] bg-white/[0.02]">
          <p className="text-[10px] text-white/30 uppercase tracking-wide mb-1">Selected</p>
          <p className="text-[11px] text-white/50 line-clamp-2">
            {selectedText.length > 150 ? `${selectedText.substring(0, 150)}...` : selectedText}
          </p>
        </div>

        {/* Result Area */}
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-6">
            <Loader2 size={14} className="animate-spin text-cyan-400" />
            <span className="text-[11px] text-white/40">Processing...</span>
          </div>
        ) : result ? (
          <div className="p-3">
            <p className="text-[10px] text-cyan-400/60 uppercase tracking-wide mb-2">
              {INLINE_ACTION_LABELS[result.action]}
            </p>
            <p className="text-[12px] text-white/80 leading-relaxed whitespace-pre-wrap max-h-[200px] overflow-y-auto">
              {result.result}
            </p>
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/[0.06]">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-[11px] text-white/60 transition-colors"
              >
                {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleSendToPanel}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-[11px] text-cyan-400 transition-colors"
              >
                <ArrowRight size={10} />
                Send to Panel
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function useLocalStorageState<T>(defaultValue: T, key: string): [T, (value: T) => void] {
  const [state, setState] = useState(defaultValue);

  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      try {
        setState(JSON.parse(stored));
      } catch {
        setState(stored as unknown as T);
      }
    }
  }, [key]);

  const setValue = useCallback((value: T) => {
    setState(value);
    localStorage.setItem(key, JSON.stringify(value));
  }, [key]);

  return [state, setValue];
}
