import { db, Conversation, Message, Task, Agent, AgentExecution, Memory, Citation, Provider, AppStats } from './index';

// ═══════════════════════════════════════════════════════════════════
// Conversations
// ═══════════════════════════════════════════════════════════════════

export const conversationStorage = {
  async create(title: string = 'New Conversation'): Promise<Conversation> {
    const now = Date.now();
    const conversation: Conversation = {
      id: `conv-${now}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      createdAt: now,
      updatedAt: now
    };
    await db.conversations.add(conversation);
    await updateStats('totalConversations', 1);
    return conversation;
  },

  async getAll(): Promise<Conversation[]> {
    return db.conversations.orderBy('updatedAt').reverse().toArray();
  },

  async get(id: string): Promise<Conversation | undefined> {
    return db.conversations.get(id);
  },

  async update(id: string, updates: Partial<Conversation>): Promise<void> {
    await db.conversations.update(id, { ...updates, updatedAt: Date.now() });
  },

  async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.conversations, db.messages, db.tasks], async () => {
      await db.conversations.delete(id);
      await db.messages.where('conversationId').equals(id).delete();
      await db.tasks.where('conversationId').equals(id).delete();
    });
  },

  async search(query: string): Promise<Conversation[]> {
    const lowerQuery = query.toLowerCase();
    const all = await db.conversations.toArray();
    return all.filter(c => c.title.toLowerCase().includes(lowerQuery));
  }
};

// ═══════════════════════════════════════════════════════════════════
// Messages
// ═══════════════════════════════════════════════════════════════════

export const messageStorage = {
  async create(conversationId: string, role: Message['role'], content: string, metadata?: Message['metadata']): Promise<Message> {
    const message: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      role,
      content,
      timestamp: Date.now(),
      metadata
    };
    await db.messages.add(message);
    await db.conversations.update(conversationId, { updatedAt: Date.now() });
    await updateStats('totalMessages', 1);
    return message;
  },

  async getByConversation(conversationId: string): Promise<Message[]> {
    return db.messages.where('conversationId').equals(conversationId).sortBy('timestamp');
  },

  async get(id: string): Promise<Message | undefined> {
    return db.messages.get(id);
  },

  async update(id: string, updates: Partial<Message>): Promise<void> {
    await db.messages.update(id, updates);
  },

  async delete(id: string): Promise<void> {
    await db.messages.delete(id);
  },

  async getRecent(limit: number = 50): Promise<Message[]> {
    return db.messages.orderBy('timestamp').reverse().limit(limit).toArray();
  }
};

// ═══════════════════════════════════════════════════════════════════
// Tasks
// ═══════════════════════════════════════════════════════════════════

export const taskStorage = {
  async create(conversationId: string, type: Task['type'], description: string, input: string, priority: Task['priority'] = 'medium'): Promise<Task> {
    const task: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      type,
      description,
      status: 'pending',
      priority,
      input,
      createdAt: Date.now()
    };
    await db.tasks.add(task);
    return task;
  },

  async getByConversation(conversationId: string): Promise<Task[]> {
    return db.tasks.where('conversationId').equals(conversationId).toArray();
  },

  async get(id: string): Promise<Task | undefined> {
    return db.tasks.get(id);
  },

  async update(id: string, updates: Partial<Task>): Promise<void> {
    await db.tasks.update(id, updates);
  },

  async updateStatus(id: string, status: Task['status'], output?: string, error?: string): Promise<void> {
    const update: Partial<Task> = { status };
    if (status === 'completed' || status === 'failed') {
      update.completedAt = Date.now();
      if (output) update.output = output;
      if (error) update.error = error;
    }
    await db.tasks.update(id, update);
  },

  async delete(id: string): Promise<void> {
    await db.tasks.delete(id);
  },

  async getActive(): Promise<Task[]> {
    return db.tasks.where('status').anyOf(['pending', 'in_progress']).toArray();
  }
};

// ═══════════════════════════════════════════════════════════════════
// Agents
// ═══════════════════════════════════════════════════════════════════

export const agentStorage = {
  async getAll(): Promise<Agent[]> {
    return db.agents.toArray();
  },

  async get(id: string): Promise<Agent | undefined> {
    return db.agents.get(id);
  },

  async updateStatus(id: string, status: Agent['status']): Promise<void> {
    await db.agents.update(id, { status, lastUsedAt: Date.now() });
  },

  async updateStats(id: string): Promise<void> {
    const agent = await db.agents.get(id);
    if (agent) {
      const executions = await db.executions.where('agentId').equals(id).toArray();
      const completed = executions.filter(e => e.status === 'completed').length;
      const successRate = executions.length > 0 ? completed / executions.length : 0;
      await db.agents.update(id, { 
        totalTasks: executions.length, 
        successRate,
        lastUsedAt: Date.now() 
      });
    }
  },

  async getByType(type: Agent['type']): Promise<Agent | undefined> {
    return db.agents.where('type').equals(type).first();
  }
};

// ═══════════════════════════════════════════════════════════════════
// Agent Executions
// ═══════════════════════════════════════════════════════════════════

export const executionStorage = {
  async create(agentId: string, taskId: string, conversationId: string, input: string): Promise<AgentExecution> {
    const execution: AgentExecution = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      taskId,
      conversationId,
      status: 'running',
      input,
      startedAt: Date.now()
    };
    await db.executions.add(execution);
    await updateStats('totalAgentExecutions', 1);
    return execution;
  },

  async complete(id: string, output: string): Promise<void> {
    const now = Date.now();
    const execution = await db.executions.get(id);
    if (execution) {
      await db.executions.update(id, {
        status: 'completed',
        output,
        completedAt: now,
        executionTime: now - execution.startedAt
      });
      await agentStorage.updateStats(execution.agentId);
    }
  },

  async fail(id: string, error: string): Promise<void> {
    const now = Date.now();
    const execution = await db.executions.get(id);
    if (execution) {
      await db.executions.update(id, {
        status: 'failed',
        error,
        completedAt: now,
        executionTime: now - execution.startedAt
      });
      await agentStorage.updateStats(execution.agentId);
    }
  },

  async getByAgent(agentId: string): Promise<AgentExecution[]> {
    return db.executions.where('agentId').equals(agentId).reverse().sortBy('startedAt');
  },

  async getByConversation(conversationId: string): Promise<AgentExecution[]> {
    return db.executions.where('conversationId').equals(conversationId).toArray();
  }
};

// ═══════════════════════════════════════════════════════════════════
// Memories
// ═══════════════════════════════════════════════════════════════════

export const memoryStorage = {
  async create(type: Memory['type'], content: string, tags: string[] = [], importance: number = 5, relevance: number = 5, source?: string, conversationId?: string): Promise<Memory> {
    const now = Date.now();
    const memory: Memory = {
      id: `mem-${now}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      source,
      importance,
      relevance,
      tags,
      conversationId,
      createdAt: now,
      accessedAt: now,
      accessCount: 0
    };
    await db.memories.add(memory);
    return memory;
  },

  async getAll(): Promise<Memory[]> {
    return db.memories.orderBy('importance').reverse().toArray();
  },

  async getByType(type: Memory['type']): Promise<Memory[]> {
    return db.memories.where('type').equals(type).toArray();
  },

  async search(query: string): Promise<Memory[]> {
    const all = await db.memories.toArray();
    const lowerQuery = query.toLowerCase();
    return all.filter(m => 
      m.content.toLowerCase().includes(lowerQuery) || 
      m.tags.some(t => t.toLowerCase().includes(lowerQuery))
    );
  },

  async getRelevant(limit: number = 10): Promise<Memory[]> {
    const all = await db.memories.orderBy('importance').reverse().toArray();
    return all.slice(0, limit);
  },

  async access(id: string): Promise<void> {
    const memory = await db.memories.get(id);
    if (memory) {
      await db.memories.update(id, { 
        accessedAt: Date.now(), 
        accessCount: memory.accessCount + 1 
      });
    }
  },

  async update(id: string, updates: Partial<Memory>): Promise<void> {
    await db.memories.update(id, updates);
  },

  async delete(id: string): Promise<void> {
    await db.memories.delete(id);
  },

  async prune(lowImportanceThreshold: number = 2): Promise<number> {
    const lowImportance = await db.memories.where('importance').below(lowImportanceThreshold).toArray();
    const oldMemories = await db.memories.filter(m => m.accessCount === 0 && Date.now() - m.createdAt > 30 * 24 * 60 * 60 * 1000).toArray();
    const toDelete = [...lowImportance, ...oldMemories];
    const ids = toDelete.map(m => m.id);
    await db.memories.bulkDelete(ids);
    return ids.length;
  }
};

// ═══════════════════════════════════════════════════════════════════
// Citations
// ═══════════════════════════════════════════════════════════════════

export const citationStorage = {
  async create(taskId: string, url: string, title: string, snippet: string): Promise<Citation> {
    const citation: Citation = {
      id: `cite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      url,
      title,
      snippet,
      accessedAt: Date.now()
    };
    await db.citations.add(citation);
    return citation;
  },

  async getByTask(taskId: string): Promise<Citation[]> {
    return db.citations.where('taskId').equals(taskId).toArray();
  },

  async getRecent(limit: number = 50): Promise<Citation[]> {
    return db.citations.orderBy('accessedAt').reverse().limit(limit).toArray();
  }
};

// ═══════════════════════════════════════════════════════════════════
// Providers
// ═══════════════════════════════════════════════════════════════════

export const providerStorage = {
  async getAll(): Promise<Provider[]> {
    return db.providers.toArray();
  },

  async get(id: string): Promise<Provider | undefined> {
    return db.providers.get(id);
  },

  async update(id: string, updates: Partial<Provider>): Promise<void> {
    await db.providers.update(id, updates);
  },

  async updateApiKey(id: string, apiKey: string): Promise<void> {
    await db.providers.update(id, { apiKey });
  },

  async toggleEnabled(id: string): Promise<void> {
    const provider = await db.providers.get(id);
    if (provider) {
      await db.providers.update(id, { isEnabled: !provider.isEnabled });
    }
  }
};

// ═══════════════════════════════════════════════════════════════════
// Settings
// ═══════════════════════════════════════════════════════════════════

export const settingsStorage = {
  async get(key: string): Promise<unknown> {
    const setting = await db.settings.where('key').equals(key).first();
    return setting?.value;
  },

  async set(key: string, value: unknown): Promise<void> {
    const existing = await db.settings.where('key').equals(key).first();
    if (existing) {
      await db.settings.update(existing.id, { value, updatedAt: Date.now() });
    } else {
      await db.settings.add({
        id: `set-${key}`,
        key,
        value,
        updatedAt: Date.now()
      });
    }
  },

  async getAll(): Promise<Record<string, unknown>> {
    const settings = await db.settings.toArray();
    return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
  },

  async reset(): Promise<void> {
    await db.settings.clear();
  }
};

// ═══════════════════════════════════════════════════════════════════
// Stats
// ═══════════════════════════════════════════════════════════════════

async function updateStats(field: keyof AppStats, increment: number = 1): Promise<void> {
  const stats = await db.stats.get('main');
  if (stats) {
    const current = (stats[field] as number) || 0;
    await db.stats.update('main', { [field]: current + increment, lastUpdated: Date.now() });
  }
}

export const statsStorage = {
  async get(): Promise<AppStats | undefined> {
    return db.stats.get('main');
  },

  async update(updates: Partial<AppStats>): Promise<void> {
    await db.stats.update('main', { ...updates, lastUpdated: Date.now() });
  },

  async recordResponseTime(ms: number): Promise<void> {
    const stats = await db.stats.get('main');
    if (stats) {
      const totalResponses = stats.totalMessages || 1;
      const newAvg = ((stats.avgResponseTime || 0) * (totalResponses - 1) + ms) / totalResponses;
      await db.stats.update('main', { avgResponseTime: newAvg, lastUpdated: Date.now() });
    }
  },

  async reset(): Promise<void> {
    await db.stats.update('main', {
      totalConversations: 0,
      totalMessages: 0,
      totalTasks: 0,
      totalAgentExecutions: 0,
      totalTokensUsed: 0,
      avgResponseTime: 0,
      lastUpdated: Date.now()
    });
  }
};

export default {
  conversations: conversationStorage,
  messages: messageStorage,
  tasks: taskStorage,
  agents: agentStorage,
  executions: executionStorage,
  memories: memoryStorage,
  citations: citationStorage,
  providers: providerStorage,
  settings: settingsStorage,
  stats: statsStorage
};