import { create } from 'zustand';
import { AgentId, TaskResult, ConsensusResult, Citation } from '../agents/types';

export type SwarmStatus = 'idle' | 'processing' | 'complete' | 'error';

export interface TaskDisplay {
  id: string;
  type: string;
  description: string;
  agent: AgentId;
  status: 'pending' | 'running' | 'done' | 'failed';
  confidence?: number;
}

interface AgentDisplay {
  id: AgentId;
  name: string;
  status: 'idle' | 'busy' | 'error' | 'offline';
  lastActivity?: number;
}

interface SwarmStoreState {
  status: SwarmStatus;
  currentQuery: string;
  tasks: TaskDisplay[];
  results: Record<string, TaskResult>;
  agents: AgentDisplay[];
  consensus: ConsensusResult | null;
  citations: Citation[];
  executionTime: number;
  error: string | null;

  setStatus: (status: SwarmStatus) => void;
  setCurrentQuery: (query: string) => void;
  addTask: (task: TaskDisplay) => void;
  updateTask: (taskId: string, updates: Partial<TaskDisplay>) => void;
  addResult: (taskId: string, result: TaskResult) => void;
  setAgentStatus: (agentId: AgentId, status: AgentDisplay['status']) => void;
  setConsensus: (consensus: ConsensusResult | null) => void;
  setCitations: (citations: Citation[]) => void;
  setExecutionTime: (time: number) => void;
  setError: (error: string | null) => void;
  resetSwarm: () => void;
}

const initialAgents: AgentDisplay[] = [
  { id: 'researcher', name: 'Research Agent', status: 'idle' },
  { id: 'coder', name: 'Code Agent', status: 'idle' },
  { id: 'browser', name: 'Browser Agent', status: 'idle' },
  { id: 'fact-checker', name: 'Fact Checker', status: 'idle' },
  { id: 'summarizer', name: 'Summarizer', status: 'idle' }
];

export const useSwarmStore = create<SwarmStoreState>((set) => ({
  status: 'idle',
  currentQuery: '',
  tasks: [],
  results: {},
  agents: initialAgents,
  consensus: null,
  citations: [],
  executionTime: 0,
  error: null,

  setStatus: (status) => set({ status }),

  setCurrentQuery: (query) => set({ currentQuery: query }),

  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, task]
  })),

  updateTask: (taskId, updates) => set((state) => ({
    tasks: state.tasks.map(t =>
      t.id === taskId ? { ...t, ...updates } : t
    )
  })),

  addResult: (taskId, result) => set((state) => ({
    results: { ...state.results, [taskId]: result }
  })),

  setAgentStatus: (agentId, status) => set((state) => ({
    agents: state.agents.map(a =>
      a.id === agentId
        ? { ...a, status, lastActivity: Date.now() }
        : a
    )
  })),

  setConsensus: (consensus) => set({ consensus }),

  setCitations: (citations) => set({ citations }),

  setExecutionTime: (time) => set({ executionTime: time }),

  setError: (error) => set({ error, status: error ? 'error' : 'idle' }),

  resetSwarm: () => set({
    status: 'idle',
    currentQuery: '',
    tasks: [],
    results: {},
    agents: initialAgents,
    consensus: null,
    citations: [],
    executionTime: 0,
    error: null
  })
}));

export const selectActiveAgents = (state: SwarmStoreState) =>
  state.agents.filter(a => a.status === 'busy');

export const selectCompletedTasks = (state: SwarmStoreState) =>
  state.tasks.filter(t => t.status === 'done');

export const selectFailedTasks = (state: SwarmStoreState) =>
  state.tasks.filter(t => t.status === 'failed');

export const selectTotalConfidence = (state: SwarmStoreState): number => {
  const results = Object.values(state.results);
  if (results.length === 0) return 0;
  const sum = results.reduce((acc, r) => acc + r.confidence, 0);
  return sum / results.length;
};
