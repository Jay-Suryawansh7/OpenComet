import { create } from 'zustand';
import type { AssistantPanelState, PageContent } from '@/types/inline';

interface AssistantPanelActions {
  setOpen: (open: boolean) => void;
  toggle: () => void;
  setWidth: (width: number) => void;
  setPageContext: (url: string, title: string, content: PageContent | null) => void;
  setLoadingContext: (loading: boolean) => void;
  clearContext: () => void;
}

export const useAssistantPanelStore = create<AssistantPanelState & AssistantPanelActions>((set) => ({
  isOpen: false,
  width: 360,
  currentPageUrl: null,
  currentPageTitle: null,
  pageContent: null,
  isLoadingContext: false,

  setOpen: (open) => set({ isOpen: open }),

  toggle: () => set((state) => ({ isOpen: !state.isOpen })),

  setWidth: (width) => set({ width: Math.max(280, Math.min(600, width)) }),

  setPageContext: (url, title, content) => set({
    currentPageUrl: url,
    currentPageTitle: title,
    pageContent: content,
    isLoadingContext: false,
  }),

  setLoadingContext: (loading) => set({ isLoadingContext: loading }),

  clearContext: () => set({
    currentPageUrl: null,
    currentPageTitle: null,
    pageContent: null,
    isLoadingContext: false,
  }),
}));
