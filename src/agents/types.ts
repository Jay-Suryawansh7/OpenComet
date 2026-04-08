export type AgentId =
  | 'coordinator'
  | 'researcher'
  | 'coder'
  | 'browser'
  | 'fact-checker'
  | 'summarizer';

export type TaskType =
  | 'research'
  | 'code'
  | 'browse'
  | 'verify'
  | 'summarize'
  | 'search';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export type AgentStatus = 'idle' | 'busy' | 'error' | 'offline';

export type Vote = 'agree' | 'disagree' | 'abstain';

export interface Citation {
  url: string;
  title: string;
  snippet: string;
  timestamp: number;
}

export interface Agent {
  id: AgentId;
  name: string;
  description: string;
  systemPrompt: string;
  tools: string[];
  capabilities: string[];
  model?: string;
  maxConcurrent?: number;
  timeout?: number;
}

export interface Task {
  id: string;
  type: TaskType;
  description: string;
  assignedAgent?: AgentId;
  priority: 'high' | 'medium' | 'low';
  dependencies: string[];
  context?: Record<string, unknown>;
  status?: TaskStatus;
  createdAt: number;
}

export interface TaskResult {
  taskId: string;
  agentId: AgentId;
  success: boolean;
  data?: unknown;
  error?: string;
  confidence: number;
  reasoning?: string;
  citations?: Citation[];
  timestamp: number;
  executionTime?: number;
}

export interface ConsensusVote {
  agentId: AgentId;
  vote: Vote;
  reasoning: string;
  confidence: number;
  evidence?: string[];
}

export interface ConsensusRequest {
  id: string;
  topic: string;
  evidence: EvidenceItem[];
  votes: ConsensusVote[];
  threshold: number;
  status: 'pending' | 'voting' | 'resolved' | 'timeout';
  createdAt: number;
  resolvedAt?: number;
}

export interface EvidenceItem {
  source: string;
  content: string;
  confidence: number;
  agentId: AgentId;
}

export interface ConsensusResult {
  reached: boolean;
  consensusId: string;
  ratio: number;
  winningOption?: string;
  dissentingAgents: AgentId[];
  finalResolution?: string;
}

export interface SwarmMessage {
  type:
    | 'TASK_DISPATCH'
    | 'TASK_RESULT'
    | 'CONSENSUS_REQUEST'
    | 'CONSENSUS_VOTE'
    | 'CONSENSUS_RESULT'
    | 'DELEGATION'
    | 'STATUS_UPDATE';
  from: AgentId;
  to?: AgentId | 'broadcast';
  payload: unknown;
  timestamp: number;
  id: string;
}

export interface SwarmState {
  tasks: Map<string, Task>;
  results: Map<string, TaskResult>;
  consensusRequests: Map<string, ConsensusRequest>;
  agentStatus: Map<AgentId, AgentStatus>;
  messageQueue: SwarmMessage[];
}

export interface SwarmConfig {
  coordinator: {
    model: string;
    temperature: number;
  };
  agents: Partial<Record<AgentId, AgentConfig>>;
  consensus: {
    threshold: number;
    timeout: number;
    requiredVotes: number;
  };
  memory?: {
    enabled: boolean;
    maxEntries: number;
  };
}

export interface AgentConfig {
  model?: string;
  maxConcurrent: number;
  timeout: number;
}

export interface SwarmResponse {
  success: boolean;
  message: string;
  taskId?: string;
  results?: TaskResult[];
  consensusResult?: ConsensusResult;
  citations?: Citation[];
  executionTime?: number;
}

export function createTaskId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createConsensusId(): string {
  return `consensus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
