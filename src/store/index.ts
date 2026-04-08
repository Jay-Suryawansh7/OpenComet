import { create } from 'zustand';
import { initializeDatabase, Provider } from '@/db';
import { settingsStorage, providerStorage, conversationStorage, messageStorage } from '@/db/storage';
import { agentService, AgentState } from '@/db/agent-service';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number;
  agentId?: string;
  modelId?: string;
  metadata?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface ChatState {
  messages: Message[];
  currentConversationId: string | null;
  isLoading: boolean;
  agentStatus: 'idle' | 'thinking' | 'browsing' | 'ready' | 'error';
  currentUrl: string;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setAgentStatus: (status: 'idle' | 'thinking' | 'browsing' | 'ready' | 'error') => void;
  setCurrentUrl: (url: string) => void;
  sendMessage: (content: string) => Promise<string | null>;
  loadConversation: (id: string) => Promise<void>;
  loadConversations: () => Promise<Conversation[]>;
  createConversation: (title?: string) => Promise<string>;
  deleteConversation: (id: string) => Promise<void>;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  currentConversationId: null,
  isLoading: false,
  agentStatus: 'idle',
  currentUrl: '',
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) return;
    
    try {
      await initializeDatabase();
      
      const conversations = await conversationStorage.getAll();
      if (conversations.length > 0) {
        const lastConv = conversations[0];
        const msgs = await messageStorage.getByConversation(lastConv.id);
        set({ 
          currentConversationId: lastConv.id,
          messages: msgs.map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
            agentId: m.agentId,
            modelId: m.modelId,
            metadata: m.metadata
          })),
          isInitialized: true 
        });
      } else {
        const newConv = await conversationStorage.create('New Conversation');
        set({ 
          currentConversationId: newConv.id,
          isInitialized: true 
        });
      }
    } catch (error) {
      console.error('Failed to initialize:', error);
      set({ isInitialized: true });
    }
  },

  addMessage: async (message) => {
    const { currentConversationId } = get();
    if (!currentConversationId) return;
    
    const storedMsg = await messageStorage.create(
      currentConversationId,
      message.role,
      message.content,
      message.metadata
    );
    
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: storedMsg.id,
          role: storedMsg.role,
          content: storedMsg.content,
          timestamp: storedMsg.timestamp,
          agentId: storedMsg.agentId,
          modelId: storedMsg.modelId,
          metadata: storedMsg.metadata
        }
      ]
    }));
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setAgentStatus: (status) => set({ agentStatus: status }),
  setCurrentUrl: (url) => set({ currentUrl: url }),

  sendMessage: async (content: string) => {
    const { addMessage, setLoading, setAgentStatus } = get();
    
    await addMessage({ role: 'user', content });
    setLoading(true);
    setAgentStatus('thinking');
    
    try {
      const result = await agentService.sendMessage(content);
      
      if (result) {
        await addMessage({ 
          role: 'assistant', 
          content: result.response,
          metadata: {
            executionTime: result.executionTime,
            citations: result.citations.length
          }
        });
        setAgentStatus('ready');
        return result.response;
      } else {
        setAgentStatus('error');
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await addMessage({ role: 'system', content: `Error: ${errorMessage}` });
      setAgentStatus('idle');
      return null;
    } finally {
      setLoading(false);
    }
  },

  loadConversation: async (id: string) => {
    const msgs = await messageStorage.getByConversation(id);
    set({ 
      currentConversationId: id,
      messages: msgs.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        agentId: m.agentId,
        modelId: m.modelId,
        metadata: m.metadata
      }))
    });
  },

  loadConversations: async () => {
    return conversationStorage.getAll();
  },

  createConversation: async (title?: string) => {
    const conv = await conversationStorage.create(title || 'New Conversation');
    set({ 
      currentConversationId: conv.id,
      messages: []
    });
    return conv.id;
  },

  deleteConversation: async (id: string) => {
    await conversationStorage.delete(id);
    const { currentConversationId } = get();
    if (currentConversationId === id) {
      const convs = await conversationStorage.getAll();
      if (convs.length > 0) {
        await get().loadConversation(convs[0].id);
      } else {
        const newConv = await conversationStorage.create('New Conversation');
        set({ currentConversationId: newConv.id, messages: [] });
      }
    }
  },

  clearMessages: () => set({ messages: [] })
}));

export interface ProviderModel {
  id: string;
  providerId: string;
  name: string;
  isEnabled: boolean;
}

export interface SettingsState {
  providers: Provider[];
  activeProviderId: string;
  activeModelId: string;
  temperature: number;
  agentServerUrl: string;
  sidebarCollapsed: boolean;
  isLoading: boolean;

  loadSettings: () => Promise<void>;
  setActiveProvider: (id: string) => Promise<void>;
  setActiveModel: (id: string) => Promise<void>;
  updateProviderKey: (providerId: string, key: string) => Promise<void>;
  setTemperature: (temp: number) => Promise<void>;
  setAgentServerUrl: (url: string) => Promise<void>;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => Promise<void>;
  getActiveProvider: () => Provider | undefined;
  getActiveModel: () => ProviderModel | undefined;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  providers: [],
  activeProviderId: 'openai',
  activeModelId: 'gpt-4o',
  temperature: 0.7,
  agentServerUrl: 'http://localhost:8765',
  sidebarCollapsed: false,
  isLoading: true,

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const providers = await providerStorage.getAll();
      const activeProviderId = await settingsStorage.get('activeProviderId') as string || 'openai';
      const activeModelId = await settingsStorage.get('activeModelId') as string || 'gpt-4o';
      const temperature = await settingsStorage.get('temperature') as number || 0.7;
      const agentServerUrl = await settingsStorage.get('agentServerUrl') as string || 'http://localhost:8765';
      const sidebarCollapsed = await settingsStorage.get('sidebarCollapsed') as boolean || false;
      
      set({ 
        providers,
        activeProviderId,
        activeModelId,
        temperature,
        agentServerUrl,
        sidebarCollapsed,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ isLoading: false });
    }
  },

  setActiveProvider: async (id) => {
    const provider = get().providers.find((p) => p.id === id);
    await settingsStorage.set('activeProviderId', id);
    set({
      activeProviderId: id,
      activeModelId: provider?.models[0]?.id || ''
    });
  },

  setActiveModel: async (id) => {
    await settingsStorage.set('activeModelId', id);
    set({ activeModelId: id });
  },

  updateProviderKey: async (providerId, key) => {
    await providerStorage.updateApiKey(providerId, key);
    set((state) => ({
      providers: state.providers.map((p) =>
        p.id === providerId ? { ...p, apiKey: key } : p
      )
    }));
  },

  setTemperature: async (temp) => {
    await settingsStorage.set('temperature', temp);
    set({ temperature: temp });
  },

  setAgentServerUrl: async (url) => {
    await settingsStorage.set('agentServerUrl', url);
    set({ agentServerUrl: url });
  },

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  setSidebarCollapsed: async (collapsed) => {
    await settingsStorage.set('sidebarCollapsed', collapsed);
    set({ sidebarCollapsed: collapsed });
  },

  getActiveProvider: () => {
    const state = get();
    return state.providers.find((p) => p.id === state.activeProviderId);
  },

  getActiveModel: () => {
    const state = get();
    const provider = state.providers.find((p) => p.id === state.activeProviderId);
    return provider?.models.find((m) => m.id === state.activeModelId);
  }
}));

export type SidebarSection = 'search' | 'computer' | 'history' | 'discover' | 'spaces' | 'settings';

export interface UIState {
  activeSection: SidebarSection;
  setActiveSection: (section: SidebarSection) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeSection: 'search',
  setActiveSection: (section) => set({ activeSection: section })
}));

export interface AgentMonitorState {
  agentStates: Record<string, 'idle' | 'busy' | 'error' | 'offline'>;
  currentTask?: string;
  subscribe: (listener: (state: AgentState) => void) => () => void;
  refreshStatus: () => Promise<void>;
}

export const useAgentMonitorStore = create<AgentMonitorState>((set, get) => ({
  agentStates: {
    coordinator: 'offline',
    researcher: 'offline',
    coder: 'offline',
    browser: 'offline',
    'fact-checker': 'offline',
    summarizer: 'offline'
  },
  currentTask: undefined,

  subscribe: (listener) => {
    return agentService.subscribe((state) => {
      set({ 
        currentTask: state.message,
        agentStates: {
          ...get().agentStates,
          ...Object.fromEntries(state.activeAgents.map(a => [a, 'busy'])),
          ...(state.status === 'idle' ? {} : { coordinator: state.status === 'error' ? 'error' : 'busy' })
        }
      });
      listener(state);
    });
  },

  refreshStatus: async () => {
    try {
      const status = await agentService.getAgentStatus();
      set({ agentStates: status });
    } catch (error) {
      console.error('Failed to refresh agent status:', error);
    }
  }
}));