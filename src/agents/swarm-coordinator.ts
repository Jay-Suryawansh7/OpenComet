// Browser-compatible EventEmitter (avoids Node 'events' module dependency)
class EventEmitter {
  private _listeners: Map<string, Array<(...args: unknown[]) => void>> = new Map();
  on(event: string, fn: (...args: unknown[]) => void) { const fns = this._listeners.get(event) || []; fns.push(fn); this._listeners.set(event, fns); return this; }
  emit(event: string, ...args: unknown[]) { (this._listeners.get(event) || []).forEach(fn => fn(...args)); return true; }
  off(event: string, fn: (...args: unknown[]) => void) { const fns = this._listeners.get(event) || []; this._listeners.set(event, fns.filter(f => f !== fn)); return this; }
  removeAllListeners() { this._listeners.clear(); return this; }
}
import {
  AgentId,
  Task,
  TaskResult,
  ConsensusVote,
  ConsensusRequest,
  ConsensusResult,
  Citation,
  createConsensusId,
} from './types';
import { TaskRouter, taskRouter } from './task-router';
import {
  TSAgentExecutor,
  TSResearchAgentExecutor,
  TSCoderAgentExecutor,
  TSBrowserAgentExecutor,
  TSFactCheckerAgentExecutor,
  TSSummarizerAgentExecutor,
} from './ts-agents';

export interface SwarmCoordinatorConfig {
  consensusThreshold?: number;
  consensusTimeout?: number;
  enableParallelExecution?: boolean;
}

export class TSSwarmCoordinator extends EventEmitter {
  private tasks: Map<string, Task> = new Map();
  private results: Map<string, TaskResult> = new Map();
  private consensusRequests: Map<string, ConsensusRequest> = new Map();
  private agentStatus: Map<AgentId, 'idle' | 'busy' | 'error' | 'offline'> = new Map();
  private messageQueue: Array<{ type: string; from: AgentId; payload: unknown; timestamp: number }> = [];
  private router: TaskRouter;
  private agents: Map<AgentId, TSAgentExecutor> = new Map();
  private config: Required<SwarmCoordinatorConfig>;

  constructor(config: SwarmCoordinatorConfig = {}) {
    super();
    this.config = {
      consensusThreshold: config.consensusThreshold ?? 0.7,
      consensusTimeout: config.consensusTimeout ?? 10000,
      enableParallelExecution: config.enableParallelExecution ?? true,
    };
    this.router = taskRouter;
    this.initializeAgents();
    this.initializeStatus();
  }

  private initializeAgents(): void {
    this.agents.set('researcher', new TSResearchAgentExecutor());
    this.agents.set('coder', new TSCoderAgentExecutor());
    this.agents.set('browser', new TSBrowserAgentExecutor());
    this.agents.set('fact-checker', new TSFactCheckerAgentExecutor());
    this.agents.set('summarizer', new TSSummarizerAgentExecutor());
  }

  private initializeStatus(): void {
    const agentIds: AgentId[] = ['researcher', 'coder', 'browser', 'fact-checker', 'summarizer'];
    agentIds.forEach(id => this.agentStatus.set(id, 'idle'));
  }

  async processQuery(query: string): Promise<{
    response: string;
    results: TaskResult[];
    consensus: ConsensusResult;
    citations: Citation[];
    executionTime: number;
  }> {
    const startTime = Date.now();
    this.emit('query:start', { query });

    try {
      const tasks = this.router.decomposeQuery(query);
      tasks.forEach(task => this.tasks.set(task.id, task));

      const dispatchPromises = tasks.map(task => this.dispatchTask(task));
      await Promise.all(dispatchPromises.map(p => p.catch(() => null)));

      await this.waitForResults(tasks.map(t => t.id));

      const consensus = await this.runConsensus(query);

      const response = this.aggregateResponse(consensus);
      const results = Array.from(this.results.values());
      const citations = this.collectCitations(results);

      const executionTime = Date.now() - startTime;

      this.emit('query:complete', { response, results, executionTime });

      return {
        response,
        results,
        consensus,
        citations,
        executionTime,
      };
    } catch (error) {
      this.emit('query:error', { error });
      throw error;
    }
  }

  private async dispatchTask(task: Task): Promise<TaskResult | null> {
    const agents = this.router.routeTask(task);
    const primaryAgent = agents[0];

    this.agentStatus.set(primaryAgent, 'busy');

    const executor = this.agents.get(primaryAgent);
    if (!executor) {
      console.error(`No executor found for agent: ${primaryAgent}`);
      return null;
    }

    try {
      const result = await executor.execute(task);
      this.results.set(task.id, result);

      this.sendMessage({
        type: 'TASK_RESULT',
        from: primaryAgent,
        payload: { taskId: task.id, result },
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error(`Task ${task.id} failed:`, error);
      const errorResult: TaskResult = {
        taskId: task.id,
        agentId: primaryAgent,
        success: false,
        error: String(error),
        confidence: 0,
        timestamp: Date.now(),
      };
      this.results.set(task.id, errorResult);
      return errorResult;
    } finally {
      this.agentStatus.set(primaryAgent, 'idle');
    }
  }

  private async waitForResults(taskIds: string[], timeout = 30000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const allComplete = taskIds.every(id => this.results.has(id));
      if (allComplete) return;

      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private async runConsensus(topic: string): Promise<ConsensusResult> {
    const relevantResults = Array.from(this.results.values()).filter(r => r.success);

    if (relevantResults.length < 2) {
      return {
        reached: true,
        consensusId: createConsensusId(),
        ratio: 1,
        dissentingAgents: [],
        finalResolution: this.getPrimaryResponse(),
      };
    }

    const consensusId = createConsensusId();
    const request: ConsensusRequest = {
      id: consensusId,
      topic,
      evidence: relevantResults.map(r => ({
        source: r.agentId,
        content: typeof r.data === 'string' ? r.data : JSON.stringify(r.data),
        confidence: r.confidence,
        agentId: r.agentId,
      })),
      votes: [],
      threshold: this.config.consensusThreshold,
      status: 'pending',
      createdAt: Date.now(),
    };

    this.consensusRequests.set(consensusId, request);

    const votes = await this.gatherVotes(request);

    const agreeVotes = votes.filter(v => v.vote === 'agree').length;
    const totalVotes = votes.length;
    const ratio = totalVotes > 0 ? agreeVotes / totalVotes : 0;

    const reached = ratio >= this.config.consensusThreshold;

    request.status = 'resolved';
    request.resolvedAt = Date.now();

    return {
      reached,
      consensusId,
      ratio,
      dissentingAgents: votes.filter(v => v.vote === 'disagree').map(v => v.agentId),
      finalResolution: reached ? this.getPrimaryResponse() : this.getDisputedResponse(votes),
    };
  }

  private async gatherVotes(request: ConsensusRequest): Promise<ConsensusVote[]> {
    const factChecker = this.agents.get('fact-checker');
    if (!factChecker) return [];

    const claims = request.evidence.map(e => e.content.substring(0, 200));

    try {
      const voteTask: Task = {
        id: `vote-${Date.now()}`,
        type: 'verify',
        description: `Verify claims: ${claims.join('; ')}`,
        priority: 'medium',
        dependencies: [],
        createdAt: Date.now(),
      };

      const result = await factChecker.execute(voteTask);

      if (result.success && typeof result.data === 'object') {
        const data = result.data as { status?: string };
        return [{
          agentId: 'fact-checker',
          vote: data.status === 'verified' ? 'agree' : 'disagree',
          reasoning: `Verification: ${data.status || 'unknown'}`,
          confidence: result.confidence,
        }];
      }
    } catch {
      // Ignore voting errors
    }

    return [];
  }

  private aggregateResponse(consensus: ConsensusResult): string {
    const results = Array.from(this.results.values())
      .filter(r => r.success)
      .sort((a, b) => b.confidence - a.confidence);

    const primaryContent = results
      .map(r => {
        if (typeof r.data === 'string') return r.data;
        if (typeof r.data === 'object' && r.data !== null) {
          const data = r.data as Record<string, unknown>;
          return data.content || data.summary || data.aggregatedContent || JSON.stringify(data);
        }
        return '';
      })
      .filter(Boolean)
      .join('\n\n');

    let response = primaryContent || consensus.finalResolution || 'No response generated';

    if (!consensus.reached && consensus.ratio > 0) {
      response += `\n\n**Note:** This response reached ${Math.round(consensus.ratio * 100)}% consensus. Some claims may need verification.`;
    }

    return response;
  }

  private getPrimaryResponse(): string {
    const primaryResult = Array.from(this.results.values())
      .filter(r => r.success)
      .sort((a, b) => b.confidence - a.confidence)[0];

    if (!primaryResult) return 'No response available';

    if (typeof primaryResult.data === 'string') return primaryResult.data;

    const data = primaryResult.data as Record<string, unknown>;
    return String(data.content || data.summary || data.aggregatedContent || JSON.stringify(data));
  }

  private getDisputedResponse(votes: ConsensusVote[]): string {
    const disagreeVotes = votes.filter(v => v.vote === 'disagree');
    if (disagreeVotes.length === 0) return this.getPrimaryResponse();

    return `This response has conflicting viewpoints. ${disagreeVotes.length} source(s) disagree with the majority.`;
  }

  private collectCitations(results: TaskResult[]): Citation[] {
    const citations: Citation[] = [];

    for (const result of results) {
      if (result.citations) {
        citations.push(...result.citations);
      }
    }

    return citations.slice(0, 10);
  }

  private sendMessage(message: { type: string; from: AgentId; payload: unknown; timestamp: number }): void {
    this.messageQueue.push(message);
    this.emit('message', message);
  }

  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  getResult(taskId: string): TaskResult | undefined {
    return this.results.get(taskId);
  }

  getAgentStatus(agentId: AgentId): 'idle' | 'busy' | 'error' | 'offline' {
    return this.agentStatus.get(agentId) || 'offline';
  }

  getAllResults(): TaskResult[] {
    return Array.from(this.results.values());
  }

  getConsensusRequest(id: string): ConsensusRequest | undefined {
    return this.consensusRequests.get(id);
  }

  reset(): void {
    this.tasks.clear();
    this.results.clear();
    this.messageQueue = [];
    this.initializeStatus();
  }
}

export const createSwarmCoordinator = (config?: SwarmCoordinatorConfig): TSSwarmCoordinator => {
  return new TSSwarmCoordinator(config);
};
