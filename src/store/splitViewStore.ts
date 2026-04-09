import { create } from 'zustand';

export type SplitOrientation = 'horizontal' | 'vertical';

interface SplitViewState {
  enabled: boolean;
  orientation: SplitOrientation;
  leftTabId: string | null;
  rightTabId: string | null;
  dividerPosition: number;
  isDragging: boolean;
}

interface SplitViewActions {
  enable: (leftTabId: string, rightTabId: string) => void;
  disable: () => void;
  setOrientation: (orientation: SplitOrientation) => void;
  setDividerPosition: (position: number) => void;
  setDragging: (dragging: boolean) => void;
  swapPanes: () => void;
  switchRightTab: (tabId: string) => void;
}

export const useSplitViewStore = create<SplitViewState & SplitViewActions>((set, get) => ({
  enabled: false,
  orientation: 'horizontal',
  leftTabId: null,
  rightTabId: null,
  dividerPosition: 50,
  isDragging: false,

  enable: (leftTabId, rightTabId) => set({
    enabled: true,
    leftTabId,
    rightTabId,
  }),

  disable: () => set({
    enabled: false,
    leftTabId: null,
    rightTabId: null,
    dividerPosition: 50,
  }),

  setOrientation: (orientation) => set({ orientation }),

  setDividerPosition: (position) => set({
    dividerPosition: Math.max(20, Math.min(80, position)),
  }),

  setDragging: (dragging) => set({ isDragging: dragging }),

  swapPanes: () => {
    const { leftTabId, rightTabId } = get();
    set({
      leftTabId: rightTabId,
      rightTabId: leftTabId,
    });
  },

  switchRightTab: (tabId) => set({ rightTabId: tabId }),
}));
