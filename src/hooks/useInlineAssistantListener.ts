import { useEffect } from 'react';
import { useInlineAssistantStore } from '@/store/inlineAssistantStore';

export function useInlineAssistantListener() {
  const { show } = useInlineAssistantStore();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'INLINE_ASSISTANT_SELECTION') {
        const { text, x, y } = event.data;
        if (text && typeof text === 'string' && text.length > 10) {
          show(text, x, y);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [show]);
}
