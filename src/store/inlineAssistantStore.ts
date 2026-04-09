import { create } from 'zustand';
import type { InlineState, InlineAction, InlineResult } from '@/types/inline';

interface InlineAssistantActions {
  show: (text: string, x: number, y: number) => void;
  hide: () => void;
  setLoading: (loading: boolean) => void;
  setResult: (result: InlineResult) => void;
  clearResult: () => void;
  setLastAction: (action: InlineAction | null) => void;
}

export const useInlineAssistantStore = create<InlineState & InlineAssistantActions>((set) => ({
  selectedText: '',
  position: { x: 0, y: 0 },
  isVisible: false,
  isLoading: false,
  lastAction: null,
  result: null,

  show: (text, x, y) => set({
    selectedText: text,
    position: { x, y },
    isVisible: true,
    isLoading: false,
    result: null,
    lastAction: null,
  }),

  hide: () => set({
    isVisible: false,
    selectedText: '',
    result: null,
    lastAction: null,
    isLoading: false,
  }),

  setLoading: (loading) => set({ isLoading: loading }),

  setResult: (result) => set({
    result,
    isLoading: false,
    lastAction: result.action,
  }),

  clearResult: () => set({ result: null, lastAction: null }),

  setLastAction: (action) => set({ lastAction: action }),
}));
