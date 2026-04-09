import { useState, useRef, useEffect } from 'react';
import { useAssistantPanelStore } from '@/store/assistantPanelStore';
import { usePageContext } from '@/hooks/usePageContext';
import { useChatStore } from '@/store';
import { useBrowserStore } from '@/store/browserStore';
import { useAgent } from '@/hooks/useAgent';
import { cn } from '@/lib/utils';
import type { Tab } from '@/store/browserStore';
import {
  X, Globe, Loader2, Send, MessageSquare,
  RefreshCw, Hash
} from 'lucide-react';

export function AssistantPanel() {
  const { isOpen, width, toggle, currentPageTitle, currentPageUrl, isLoadingContext } = useAssistantPanelStore();
  const { pageContent, refreshContext } = usePageContext();
  const { messages, addMessage, isLoading } = useChatStore();
  const { sendMessage } = useAgent();
  const [input, setInput] = useState('');
  const [showTabMention, setShowTabMention] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { tabs } = useBrowserStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');

    await addMessage({ role: 'user', content: userMessage });

    let enhancedMessage = userMessage;
    if (userMessage.includes('@tab')) {
      const tabContext = tabs
        .filter((t: Tab) => t.id !== useBrowserStore.getState().activeTabId)
        .slice(0, 3)
        .map((t: Tab) => `Tab: "${t.title}" (${t.url})`)
        .join('\n');
      enhancedMessage = userMessage.replace('@tab', `\nContext from open tabs:\n${tabContext}\n\nQuestion: ${userMessage.replace('@tab', '')}`);
    }

    if (pageContent) {
      const contextPrompt = `Page Context:\nTitle: ${pageContent.title}\nURL: ${pageContent.url}\nContent: ${pageContent.text.substring(0, 2000)}\n\n${enhancedMessage}`;
      await sendMessage(contextPrompt);
    } else {
      await sendMessage(enhancedMessage);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (e.target.value.includes('@tab') || e.target.value.includes('@')) {
      setShowTabMention(true);
    } else {
      setShowTabMention(false);
    }
  };

  const insertTabMention = (tabId: string) => {
    const tab = tabs.find((t: Tab) => t.id === tabId);
    if (tab) {
      setInput(prev => prev.replace(/@\w*$/, `@${tab.title} `));
    }
    setShowTabMention(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="flex flex-col border-l border-white/[0.06] bg-[#0e1117] shrink-0"
      style={{ width }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-cyan-400" />
          <span className="text-[13px] font-medium text-white/80">Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={refreshContext}
            className="p-1 rounded hover:bg-white/[0.06] text-white/40 hover:text-white/60 transition-colors"
            title="Refresh context"
          >
            <RefreshCw size={12} className={isLoadingContext ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={toggle}
            className="p-1 rounded hover:bg-white/[0.06] text-white/40 hover:text-white/60 transition-colors"
            title="Close panel"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Page Context Indicator */}
      {currentPageUrl && currentPageUrl !== 'about:blank' && (
        <div className="px-3 py-2 border-b border-white/[0.04] bg-white/[0.02]">
          <div className="flex items-center gap-2 text-[11px] text-white/40">
            <Globe size={10} />
            <span className="truncate flex-1" title={currentPageTitle || currentPageUrl}>
              {currentPageTitle || currentPageUrl}
            </span>
          </div>
          {pageContent && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/[0.1] text-[10px] text-cyan-400/60">
                Page context loaded
              </span>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-10 h-10 rounded-full bg-cyan-500/[0.1] flex items-center justify-center mb-3">
              <MessageSquare size={18} className="text-cyan-400/60" />
            </div>
            <p className="text-[12px] text-white/40 mb-1">Ask about this page</p>
            <p className="text-[11px] text-white/25 max-w-[200px]">
              Use @tab to reference other open tabs
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              'rounded-lg px-3 py-2 text-[12px] leading-relaxed',
              msg.role === 'user'
                ? 'bg-cyan-500/[0.1] text-white/80 ml-4'
                : 'bg-white/[0.04] text-white/70 mr-2'
            )}
          >
            {msg.content}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-[12px] text-white/40 px-3 py-2">
            <Loader2 size={12} className="animate-spin text-cyan-400" />
            <span>Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Tab Mention Popup */}
      {showTabMention && tabs.length > 1 && (
        <div className="px-3 py-2 border-t border-white/[0.06] bg-white/[0.03]">
          <div className="flex items-center gap-1 mb-2">
            <Hash size={10} className="text-cyan-400" />
            <span className="text-[10px] text-white/40 uppercase tracking-wide">Mention a tab</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {tabs
              .filter((t: Tab) => t.id !== useBrowserStore.getState().activeTabId)
              .slice(0, 4)
              .map((tab: Tab) => (
                <button
                  key={tab.id}
                  onClick={() => insertTabMention(tab.id)}
                  className="px-2 py-1 rounded bg-white/[0.06] hover:bg-white/[0.1] text-[11px] text-white/60 truncate max-w-[120px]"
                  title={tab.url}
                >
                  {tab.title}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/[0.06]">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this page..."
            className="w-full resize-none rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-2 pr-10 text-[12px] text-white/80 placeholder:text-white/30 focus:outline-none focus:border-cyan-500/30 focus:bg-white/[0.06] transition-colors"
            rows={2}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 p-1.5 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={12} className="text-cyan-400" />
          </button>
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-white/25">
          <span>Press Enter to send</span>
          <span>•</span>
          <span>Type @tab to reference tabs</span>
        </div>
      </form>
    </div>
  );
}
