export type InlineAction =
  | 'summarize'
  | 'fact_check'
  | 'define'
  | 'translate'
  | 'rephrase';

export interface InlineResult {
  action: InlineAction;
  originalText: string;
  result: string;
  timestamp: number;
}

export interface InlineState {
  selectedText: string;
  position: { x: number; y: number };
  isVisible: boolean;
  isLoading: boolean;
  lastAction: InlineAction | null;
  result: InlineResult | null;
}

export interface PageContent {
  url: string;
  title: string;
  headings: string[];
  text: string;
  links: { text: string; url: string }[];
}

export interface AssistantPanelState {
  isOpen: boolean;
  width: number;
  currentPageUrl: string | null;
  currentPageTitle: string | null;
  pageContent: PageContent | null;
  isLoadingContext: boolean;
}

export const INLINE_ACTION_LABELS: Record<InlineAction, string> = {
  summarize: 'Summarize',
  fact_check: 'Fact Check',
  define: 'Define',
  translate: 'Translate',
  rephrase: 'Rephrase',
};

export const INLINE_ACTION_ICONS: Record<InlineAction, string> = {
  summarize: '📝',
  fact_check: '✓',
  define: '📖',
  translate: '🌐',
  rephrase: '✏️',
};
