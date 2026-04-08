// ═══════════════════════════════════════════════════════════════════
// OpenComet Local Database Schemas
// All data stored locally using IndexedDB - no cloud storage
// ═══════════════════════════════════════════════════════════════════

import Dexie, { Table } from 'dexie';

// ═══════════════════════════════════════════════════════════════════
// Model Interfaces
// ═══════════════════════════════════════════════════════════════════

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, unknown>;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number;
  agentId?: string;
  modelId?: string;
  tokensUsed?: number;
  metadata?: Record<string, unknown>;
}

export interface Task {
  id: string;
  conversationId: string;
  type: 'research' | 'code' | 'browse' | 'verify' | 'summarize' | 'search';
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  agentId?: string;
  priority: 'high' | 'medium' | 'low';
  input: string;
  output?: string;
  error?: string;
  confidence?: number;
  citations?: Citation[];
  createdAt: number;
  completedAt?: number;
  executionTime?: number;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  type: 'researcher' | 'coder' | 'browser' | 'fact-checker' | 'summarizer';
  status: 'idle' | 'busy' | 'error' | 'offline';
  modelId?: string;
  capabilities: string[];
  tools: string[];
  systemPrompt?: string;
  createdAt: number;
  lastUsedAt?: number;
  totalTasks: number;
  successRate: number;
}

export interface AgentExecution {
  id: string;
  agentId: string;
  taskId: string;
  conversationId: string;
  status: 'running' | 'completed' | 'failed';
  input: string;
  output?: string;
  error?: string;
  startedAt: number;
  completedAt?: number;
  executionTime?: number;
}

export interface Memory {
  id: string;
  type: 'fact' | 'preference' | 'context' | 'knowledge';
  content: string;
  source?: string;
  importance: number;
  tags: string[];
  createdAt: number;
  accessedAt: number;
  accessCount: number;
}

export interface Citation {
  id: string;
  taskId: string;
  url: string;
  title: string;
  snippet: string;
  accessedAt: number;
}

export interface Provider {
  id: string;
  name: string;
  icon: string;
  apiKeyLabel: string;
  apiKey?: string;
  baseUrl: string;
  isEnabled: boolean;
  models: ProviderModel[];
}

export interface ProviderModel {
  id: string;
  providerId: string;
  name: string;
  isEnabled: boolean;
}

export interface Settings {
  id: string;
  key: string;
  value: unknown;
  updatedAt: number;
}

export interface AppStats {
  id: string;
  totalConversations: number;
  totalMessages: number;
  totalTasks: number;
  totalAgentExecutions: number;
  totalTokensUsed: number;
  avgResponseTime: number;
  lastUpdated: number;
}

// ═══════════════════════════════════════════════════════════════════
// Database Class
// ═══════════════════════════════════════════════════════════════════

export class OpenCometDB extends Dexie {
  conversations!: Table<Conversation>;
  messages!: Table<Message>;
  tasks!: Table<Task>;
  agents!: Table<Agent>;
  executions!: Table<AgentExecution>;
  memories!: Table<Memory>;
  citations!: Table<Citation>;
  providers!: Table<Provider>;
  settings!: Table<Settings>;
  stats!: Table<AppStats>;

  constructor() {
    super('OpenCometDB');
    
    this.version(1).stores({
      conversations: 'id, title, createdAt, updatedAt',
      messages: 'id, conversationId, role, timestamp, [conversationId+timestamp]',
      tasks: 'id, conversationId, type, status, agentId, createdAt, [conversationId+createdAt]',
      agents: 'id, type, status, lastUsedAt',
      executions: 'id, agentId, taskId, conversationId, status, startedAt, [agentId+startedAt]',
      memories: 'id, type, importance, createdAt, accessedAt, *tags',
      citations: 'id, taskId, url, accessedAt',
      providers: 'id, name',
      settings: 'id, key',
      stats: 'id'
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
// Singleton Instance
// ═══════════════════════════════════════════════════════════════════

export const db = new OpenCometDB();

// ═══════════════════════════════════════════════════════════════════
// Database Initialization
// ═══════════════════════════════════════════════════════════════════

export async function initializeDatabase(): Promise<void> {
  try {
    await db.open();
    
    const conversationCount = await db.conversations.count();
    if (conversationCount === 0) {
      await seedDefaultData();
    }
    
    console.log('OpenCometDB initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

async function seedDefaultData(): Promise<void> {
  const now = Date.now();
  
  // Default agents
  const defaultAgents: Agent[] = [
    {
      id: 'researcher',
      name: 'Research Agent',
      description: 'Deep research and information gathering',
      type: 'researcher',
      status: 'idle',
      capabilities: ['web_search', 'content_analysis', 'source_verification'],
      tools: ['search', 'fetch', 'analyze'],
      systemPrompt: 'You are a research agent. Find accurate information from reliable sources.',
      createdAt: now,
      totalTasks: 0,
      successRate: 0
    },
    {
      id: 'coder',
      name: 'Code Agent',
      description: 'Code execution and debugging',
      type: 'coder',
      status: 'idle',
      capabilities: ['code_execution', 'debugging', 'code_review'],
      tools: ['execute_code', 'debug', 'review'],
      systemPrompt: 'You are a coding agent. Write and execute code accurately.',
      createdAt: now,
      totalTasks: 0,
      successRate: 0
    },
    {
      id: 'browser',
      name: 'Browser Agent',
      description: 'Web browsing and interaction',
      type: 'browser',
      status: 'idle',
      capabilities: ['web_navigation', 'screenshot', 'form_filling'],
      tools: ['navigate', 'click', 'type', 'screenshot'],
      systemPrompt: 'You are a browser automation agent. Navigate and interact with web pages.',
      createdAt: now,
      totalTasks: 0,
      successRate: 0
    },
    {
      id: 'fact-checker',
      name: 'Fact Checker Agent',
      description: 'Verify claims and information',
      type: 'fact-checker',
      status: 'idle',
      capabilities: ['fact_verification', 'claim_analysis', 'source_validation'],
      tools: ['verify', 'check', 'validate'],
      systemPrompt: 'You are a fact-checking agent. Verify information accuracy.',
      createdAt: now,
      totalTasks: 0,
      successRate: 0
    },
    {
      id: 'summarizer',
      name: 'Summarizer Agent',
      description: 'Content summarization and extraction',
      type: 'summarizer',
      status: 'idle',
      capabilities: ['summarization', 'key_extraction', 'formatting'],
      tools: ['summarize', 'extract', 'format'],
      systemPrompt: 'You are a summarization agent. Create concise, accurate summaries.',
      createdAt: now,
      totalTasks: 0,
      successRate: 0
    }
  ];
  
  // Default providers
  const defaultProviders: Provider[] = [
    {
      id: 'openai',
      name: 'OpenAI',
      icon: '⬡',
      apiKeyLabel: 'OpenAI API Key',
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      isEnabled: true,
      models: [
        { id: 'gpt-4o', providerId: 'openai', name: 'GPT-4o', isEnabled: true },
        { id: 'gpt-4o-mini', providerId: 'openai', name: 'GPT-4o Mini', isEnabled: true },
        { id: 'gpt-4-turbo', providerId: 'openai', name: 'GPT-4 Turbo', isEnabled: true },
        { id: 'gpt-3.5-turbo', providerId: 'openai', name: 'GPT-3.5 Turbo', isEnabled: true }
      ]
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      icon: '◈',
      apiKeyLabel: 'Anthropic API Key',
      apiKey: '',
      baseUrl: 'https://api.anthropic.com',
      isEnabled: true,
      models: [
        { id: 'claude-sonnet-4-20250514', providerId: 'anthropic', name: 'Claude Sonnet 4', isEnabled: true },
        { id: 'claude-3-5-sonnet-20241022', providerId: 'anthropic', name: 'Claude 3.5 Sonnet', isEnabled: true },
        { id: 'claude-3-haiku-20240307', providerId: 'anthropic', name: 'Claude 3 Haiku', isEnabled: true }
      ]
    },
    {
      id: 'google',
      name: 'Google AI',
      icon: '◇',
      apiKeyLabel: 'Gemini API Key',
      apiKey: '',
      baseUrl: 'https://generativelanguage.googleapis.com',
      isEnabled: true,
      models: [
        { id: 'gemini-2.0-flash', providerId: 'google', name: 'Gemini 2.0 Flash', isEnabled: true },
        { id: 'gemini-1.5-pro', providerId: 'google', name: 'Gemini 1.5 Pro', isEnabled: true }
      ]
    },
    {
      id: 'nvidia',
      name: 'NVIDIA NIM',
      icon: '▲',
      apiKeyLabel: 'NVIDIA API Key',
      apiKey: '',
      baseUrl: 'https://integrate.api.nvidia.com/v1',
      isEnabled: true,
      models: [
        { id: 'meta/llama-3.1-405b-instruct', providerId: 'nvidia', name: 'Llama 3.1 405B', isEnabled: true },
        { id: 'meta/llama-3.1-70b-instruct', providerId: 'nvidia', name: 'Llama 3.1 70B', isEnabled: true }
      ]
    },
    {
      id: 'ollama',
      name: 'Ollama (Local)',
      icon: '⊙',
      apiKeyLabel: 'Not required',
      apiKey: '',
      baseUrl: 'http://localhost:11434',
      isEnabled: true,
      models: [
        { id: 'llama3', providerId: 'ollama', name: 'Llama 3', isEnabled: true },
        { id: 'mistral', providerId: 'ollama', name: 'Mistral', isEnabled: true },
        { id: 'codellama', providerId: 'ollama', name: 'Code Llama', isEnabled: true }
      ]
    }
  ];
  
  // Default settings
  const defaultSettings: Settings[] = [
    { id: 'activeProvider', key: 'activeProviderId', value: 'openai', updatedAt: now },
    { id: 'activeModel', key: 'activeModelId', value: 'gpt-4o', updatedAt: now },
    { id: 'temperature', key: 'temperature', value: 0.7, updatedAt: now },
    { id: 'agentServerUrl', key: 'agentServerUrl', value: 'http://localhost:8765', updatedAt: now },
    { id: 'sidebarCollapsed', key: 'sidebarCollapsed', value: false, updatedAt: now }
  ];
  
  // App stats
  const defaultStats: AppStats = {
    id: 'main',
    totalConversations: 0,
    totalMessages: 0,
    totalTasks: 0,
    totalAgentExecutions: 0,
    totalTokensUsed: 0,
    avgResponseTime: 0,
    lastUpdated: now
  };
  
  try {
    await db.agents.bulkPut(defaultAgents);
  } catch (e) { /* already seeded */ }
  try {
    await db.providers.bulkPut(defaultProviders);
  } catch (e) { /* already seeded */ }
  try {
    await db.settings.bulkPut(defaultSettings);
  } catch (e) { /* already seeded */ }
  try {
    await db.stats.put(defaultStats);
  } catch (e) { /* already seeded */ }
}

export default db;