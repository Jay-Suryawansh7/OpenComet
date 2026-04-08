import { 
  TSSwarmCoordinator, 
  createSwarmCoordinator,
} from '../agents/swarm-coordinator';
import { 
  AgentId,
  TaskResult,
  ConsensusResult,
  Citation
} from '../agents/types';
import { 
  conversationStorage, 
  messageStorage, 
  taskStorage, 
  citationStorage,
  memoryStorage,
  settingsStorage 
} from './storage';

export interface AgentResponse {
  conversationId: string;
  messageId: string;
  response: string;
  results: TaskResult[];
  consensus: ConsensusResult;
  citations: Citation[];
  executionTime: number;
}

export interface AgentState {
  status: 'idle' | 'thinking' | 'browsing' | 'ready' | 'error';
  activeAgents: AgentId[];
  currentTask?: string;
  message?: string;
}

type AgentStateListener = (state: AgentState) => void;

class AgentService {
  private coordinator: TSSwarmCoordinator | null = null;
  private currentConversationId: string | null = null;
  private stateListeners: Set<AgentStateListener> = new Set();
  private currentState: AgentState = { status: 'idle', activeAgents: [] };

  private updateState(updates: Partial<AgentState>): void {
    this.currentState = { ...this.currentState, ...updates };
    this.stateListeners.forEach(listener => listener(this.currentState));
  }

  subscribe(listener: AgentStateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  getState(): AgentState {
    return this.currentState;
  }

  private async initialize(): Promise<void> {
    if (!this.coordinator) {
      this.coordinator = createSwarmCoordinator({
        consensusThreshold: 0.7,
        consensusTimeout: 10000,
        enableParallelExecution: true
      });
      
      this.coordinator.on('query:start', (data: unknown) => {
        const queryData = data as { query: string };
        this.updateState({ 
          status: 'thinking', 
          message: `Processing: ${queryData.query.substring(0, 50)}...` 
        });
      });
      
      this.coordinator.on('query:complete', () => {
        this.updateState({ status: 'ready', message: undefined });
      });
      
      this.coordinator.on('query:error', (data: unknown) => {
        const errorData = data as { error: string };
        this.updateState({ 
          status: 'error', 
          message: errorData.error 
        });
      });
    }
  }

  async startConversation(title?: string): Promise<string> {
    await this.initialize();
    
    const conversation = await conversationStorage.create(title || 'New Conversation');
    this.currentConversationId = conversation.id;
    
    return conversation.id;
  }

  async sendMessage(content: string): Promise<AgentResponse | null> {
    if (!this.currentConversationId) {
      await this.startConversation();
    }
    
    const conversationId = this.currentConversationId!;
    const startTime = Date.now();
    
    this.updateState({ 
      status: 'thinking', 
      message: 'Processing your request...',
      activeAgents: []
    });

    try {
      await messageStorage.create(conversationId, 'user', content, {
        modelId: await settingsStorage.get('activeModelId') as string
      });

      await this.initialize();
      
      if (!this.coordinator) {
        throw new Error('Failed to initialize agent coordinator');
      }

      this.updateState({ status: 'thinking', message: 'Running agent swarm...' });

      const result = await this.coordinator.processQuery(content);

      const responseContent = this.formatResponse(result.response, result.consensus, result.citations);
      
      const assistantMessage = await messageStorage.create(
        conversationId, 
        'assistant', 
        responseContent,
        {
          modelId: await settingsStorage.get('activeModelId') as string,
          agentId: 'swarm',
          tokensUsed: Math.floor(responseContent.length / 4)
        }
      );

      for (const taskResult of result.results) {
        const task = await taskStorage.get(taskResult.taskId);
        if (task) {
          await taskStorage.updateStatus(
            taskResult.taskId,
            taskResult.success ? 'completed' : 'failed',
            typeof taskResult.data === 'string' ? taskResult.data : JSON.stringify(taskResult.data),
            taskResult.error
          );
        }

        if (taskResult.citations) {
          for (const citation of taskResult.citations) {
            await citationStorage.create(
              taskResult.taskId,
              citation.url,
              citation.title,
              citation.snippet
            );
          }
        }
      }

      await memoryStorage.create(
        'context',
        `User asked: ${content.substring(0, 100)}...`,
        ['conversation', conversationId],
        3
      );

      const executionTime = Date.now() - startTime;
      
      this.updateState({ 
        status: 'ready', 
        activeAgents: [],
        message: undefined
      });

      return {
        conversationId,
        messageId: assistantMessage.id,
        response: responseContent,
        results: result.results,
        consensus: result.consensus,
        citations: result.citations,
        executionTime
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await messageStorage.create(conversationId, 'system', `Error: ${errorMessage}`);
      
      this.updateState({ 
        status: 'error', 
        message: errorMessage,
        activeAgents: []
      });

      return null;
    }
  }

  private formatResponse(response: string, consensus: ConsensusResult, citations: Citation[]): string {
    let formatted = response;

    if (consensus && !consensus.reached && consensus.ratio > 0) {
      formatted += `\n\n⚠️ Consensus: ${Math.round(consensus.ratio * 100)}% - Some claims may need verification`;
    }

    if (citations && citations.length > 0) {
      formatted += `\n\n**Sources:**\n`;
      citations.slice(0, 5).forEach((c, i) => {
        formatted += `${i + 1}. [${c.title}](${c.url})\n`;
      });
    }

    return formatted;
  }

  async getConversations() {
    return conversationStorage.getAll();
  }

  async getConversation(id: string) {
    return conversationStorage.get(id);
  }

  async getMessages(conversationId: string) {
    return messageStorage.getByConversation(conversationId);
  }

  async deleteConversation(id: string) {
    await conversationStorage.delete(id);
    if (this.currentConversationId === id) {
      this.currentConversationId = null;
    }
  }

  async updateConversation(id: string, title: string) {
    await conversationStorage.update(id, { title });
  }

  async getAgentStatus(): Promise<Record<string, 'idle' | 'busy' | 'error' | 'offline'>> {
    if (!this.coordinator) {
      return {
        coordinator: 'offline',
        researcher: 'offline',
        coder: 'offline',
        browser: 'offline',
        'fact-checker': 'offline',
        summarizer: 'offline'
      };
    }

    const agentIds: AgentId[] = ['researcher', 'coder', 'browser', 'fact-checker', 'summarizer'];
    const status: Record<string, 'idle' | 'busy' | 'error' | 'offline'> = {};
    
    for (const agent of agentIds) {
      status[agent] = this.coordinator.getAgentStatus(agent);
    }

    return status;
  }

  async getMemories(limit: number = 20) {
    return memoryStorage.getRelevant(limit);
  }

  async searchMemories(query: string) {
    return memoryStorage.search(query);
  }

  async getStats() {
    return (await import('./storage')).statsStorage.get();
  }

  async reset(): Promise<void> {
    if (this.coordinator) {
      this.coordinator.reset();
    }
    this.currentConversationId = null;
    this.updateState({ status: 'idle', activeAgents: [], message: undefined });
  }
}

export const agentService = new AgentService();

export default agentService;