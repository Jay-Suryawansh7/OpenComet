import { useEffect, useCallback } from 'react';
import { useAssistantPanelStore } from '@/store/assistantPanelStore';
import { useBrowserStore } from '@/store/browserStore';
import type { PageContent } from '@/types/inline';

export function usePageContext() {
  const { setPageContext, setLoadingContext, currentPageUrl, pageContent } = useAssistantPanelStore();
  const { activeTabId, tabs } = useBrowserStore();

  const activeTab = tabs.find(t => t.id === activeTabId);

  const extractPageContent = useCallback(async () => {
    if (!window.electronAPI?.browser?.getPageContent || !activeTabId) return;

    setLoadingContext(true);

    try {
      const result = await window.electronAPI.browser.getPageContent(activeTabId);
      
      if (result.text && !result.error) {
        const content: PageContent = {
          url: result.url || activeTab?.url || '',
          title: result.title || '',
          headings: extractHeadings(result.text),
          text: result.text.substring(0, 3000),
          links: [],
        };

        const url = activeTab?.url || result.url || '';
        const title = result.title || activeTab?.title || '';
        
        setPageContext(url, title, content);
      } else {
        setPageContext(activeTab?.url || '', activeTab?.title || '', null);
      }
    } catch (error) {
      console.error('Failed to extract page content:', error);
      setPageContext(activeTab?.url || '', activeTab?.title || '', null);
    }
  }, [activeTabId, activeTab?.url, activeTab?.title, setPageContext, setLoadingContext]);

  useEffect(() => {
    if (activeTab?.url && activeTab.url !== 'about:blank') {
      const timer = setTimeout(extractPageContent, 500);
      return () => clearTimeout(timer);
    }
  }, [activeTab?.url, extractPageContent]);

  return {
    currentUrl: currentPageUrl,
    currentTitle: useAssistantPanelStore.getState().currentPageTitle || null,
    pageContent,
    refreshContext: extractPageContent,
  };
}

function extractHeadings(text: string): string[] {
  const lines = text.split('\n').filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 0 && trimmed.length < 200;
  });
  return lines.slice(0, 10);
}
