import { useEffect, useCallback, useRef } from 'react';
import { useInlineAssistantStore } from '@/store/inlineAssistantStore';

export function useTextSelection() {
  const { show, hide, isVisible, selectedText } = useInlineAssistantStore();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLDivElement | null>(null);

  const handleSelection = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim() || '';

      if (text.length > 10 && text.length < 5000) {
        const range = selection?.getRangeAt(0);
        if (range) {
          const rect = range.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.bottom + 8;
          show(text, x, y);
        }
      } else if (isVisible && text.length === 0) {
        hide();
      }
    }, 100);
  }, [show, hide, isVisible]);

  useEffect(() => {
    document.addEventListener('mouseup', handleSelection);

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (buttonRef.current && !buttonRef.current.contains(target)) {
        if (!window.getSelection()?.toString().trim()) {
          hide();
        }
      }
    };

    document.addEventListener('mousedown', handleClick);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('mousedown', handleClick);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [handleSelection, hide]);

  return {
    isVisible,
    selectedText,
    buttonRef,
  };
}
