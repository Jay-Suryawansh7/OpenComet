import { db, Memory, BrowserMemory } from '../db/index';
import { messageStorage } from '../db/storage';

export interface MemoryContext {
  facts: string;
  preferences: string;
  recentContext: string;
  browsingHistory: string;
}

export interface MemoryStats {
  totalMemories: number;
  byType: Record<string, number>;
  avgImportance: number;
  oldestMemory: number;
  newestMemory: number;
}

class MemoryService {
  private sessionId: string;
  private memoryEnabled: boolean = true;
  private memoryDecayDays: number = 30;
  private maxMemories: number = 1000;

  constructor() {
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  setEnabled(enabled: boolean) {
    this.memoryEnabled = enabled;
  }

  setDecayDays(days: number) {
    this.memoryDecayDays = days;
  }

  setMaxMemories(max: number) {
    this.maxMemories = max;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  async createMemory(
    type: Memory['type'],
    content: string,
    tags: string[] = [],
    importance: number = 5,
    relevance: number = 5,
    source?: string,
    conversationId?: string
  ): Promise<Memory> {
    if (!this.memoryEnabled) {
      throw new Error('Memory is disabled');
    }

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
      accessCount: 0,
      expiresAt: now + (this.memoryDecayDays * 24 * 60 * 60 * 1000)
    };

    await db.memories.add(memory);
    await this.enforceMemoryLimit();
    
    return memory;
  }

  async getContextForQuery(query: string, limit: number = 10): Promise<Memory[]> {
    if (!this.memoryEnabled) return [];

    const queryLower = query.toLowerCase();
    const words = queryLower.split(/\s+/).filter(w => w.length > 2);
    
    const all = await db.memories.toArray();
    
    const scored = all.map(memory => {
      let score = 0;
      
      const contentLower = memory.content.toLowerCase();
      const tagsLower = memory.tags.map(t => t.toLowerCase());
      
      for (const word of words) {
        if (contentLower.includes(word)) score += 2;
        if (tagsLower.some(t => t.includes(word))) score += 3;
      }
      
      const recency = Math.max(0, 1 - (Date.now() - memory.accessedAt) / (7 * 24 * 60 * 60 * 1000));
      score += recency * 3;
      
      score += (memory.importance / 10) * 2;
      score += (memory.relevance / 10) * 2;
      score += Math.min(memory.accessCount / 10, 1);
      
      if (memory.expiresAt && memory.expiresAt < Date.now()) {
        score *= 0.3;
      }
      
      return { memory, score };
    });

    scored.sort((a, b) => b.score - a.score);
    
    return scored.slice(0, limit).map(s => s.memory);
  }

  async getContextForConversation(conversationId: string): Promise<Memory[]> {
    if (!this.memoryEnabled) return [];

    const memories = await db.memories
      .where('conversationId')
      .equals(conversationId)
      .toArray();

    const sessionMemories = await db.memories
      .filter(m => !m.conversationId && m.type === 'context')
      .limit(5)
      .toArray();

    return [...memories, ...sessionMemories];
  }

  async getUserPreferences(): Promise<Memory[]> {
    if (!this.memoryEnabled) return [];

    return db.memories
      .where('type')
      .equals('preference')
      .toArray();
  }

  async getRecentMemories(limit: number = 20): Promise<Memory[]> {
    return db.memories
      .orderBy('accessedAt')
      .reverse()
      .limit(limit)
      .toArray();
  }

  async buildMemoryContext(query: string, conversationId?: string): Promise<MemoryContext> {
    const memories = await this.getContextForQuery(query, 10);
    const conversationMemories = conversationId 
      ? await this.getContextForConversation(conversationId) 
      : [];
    const preferences = await this.getUserPreferences();
    const browsingMemories = await this.getRecentBrowsingMemories(5);

    const allMemories = [...memories, ...conversationMemories];
    
    const facts = allMemories
      .filter(m => m.type === 'fact')
      .map(m => `- ${m.content}`)
      .join('\n');

    const pref = preferences
      .map(m => `- ${m.content}`)
      .join('\n');

    const context = allMemories
      .filter(m => m.type === 'context')
      .map(m => `- ${m.content}`)
      .join('\n');

    const browsing = browsingMemories
      .map(m => `- ${m.content} (${m.url || 'no url'})`)
      .join('\n');

    for (const memory of allMemories) {
      await this.accessMemory(memory.id);
    }

    return {
      facts: facts || 'No relevant facts stored.',
      preferences: pref || 'No preferences stored.',
      recentContext: context || 'No recent context.',
      browsingHistory: browsing || 'No browsing history.'
    };
  }

  formatMemoryContext(context: MemoryContext): string {
    const parts: string[] = [];

    if (context.recentContext !== 'No recent context.') {
      parts.push(`**Recent Context:**\n${context.recentContext}`);
    }

    if (context.preferences !== 'No preferences stored.') {
      parts.push(`**Known Preferences:**\n${context.preferences}`);
    }

    if (context.facts !== 'No relevant facts stored.') {
      parts.push(`**Relevant Facts:**\n${context.facts}`);
    }

    if (context.browsingHistory !== 'No browsing history.') {
      parts.push(`**Recent Browsing:**\n${context.browsingHistory}`);
    }

    return parts.length > 0 
      ? `\n\n**Memory Context:**\n${parts.join('\n\n')}`
      : '';
  }

  async createFromMessage(
    role: 'user' | 'assistant',
    content: string,
    conversationId: string
  ): Promise<void> {
    if (!this.memoryEnabled || content.length < 20) return;

    const isUser = role === 'user';
    const contentPreview = content.substring(0, 200);

    await this.createMemory(
      'context',
      isUser 
        ? `User asked about: ${contentPreview}...`
        : `Agent responded about: ${contentPreview}...`,
      ['conversation', conversationId, isUser ? 'user' : 'assistant'],
      3,
      3,
      undefined,
      conversationId
    );
  }

  async extractAndStoreFacts(content: string, source?: string): Promise<Memory[]> {
    const facts: Memory[] = [];
    
    const factPatterns = [
      /(?:I prefer|I like|my favorite|I'm interested in)[:\s]+(.+)/gi,
      /(?:I'm|my|I am)[:\s]*(?:a|an|doing|working|interested in|looking for)[:\s]+(.+)/gi,
      /(?:hate|don't like|dislike|avoid)[:\s]+(.+)/gi,
    ];

    for (const pattern of factPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          const fact = await this.createMemory(
            'preference',
            match[1].trim(),
            ['extracted', 'preference'],
            4,
            4,
            source
          );
          facts.push(fact);
        }
      }
    }

    return facts;
  }

  async consolidateConversation(conversationId: string): Promise<void> {
    const messages = await messageStorage.getByConversation(conversationId);
    
    if (messages.length < 4) return;

    const userMessages = messages.filter(m => m.role === 'user');

    if (userMessages.length > 0) {
      const lastTopic = userMessages[userMessages.length - 1].content;
      
      await this.createMemory(
        'context',
        `Conversation about: ${lastTopic.substring(0, 150)}...`,
        ['consolidated', conversationId],
        5,
        3,
        undefined,
        conversationId
      );
    }

    await this.runMemoryDecay();
  }

  async accessMemory(id: string): Promise<void> {
    const memory = await db.memories.get(id);
    if (memory) {
      await db.memories.update(id, {
        accessedAt: Date.now(),
        accessCount: memory.accessCount + 1
      });
    }
  }

  async runMemoryDecay(): Promise<number> {
    const threshold = Date.now() - (this.memoryDecayDays * 24 * 60 * 60 * 1000);
    
    const oldMemories = await db.memories
      .filter(m => m.createdAt < threshold && m.accessCount === 0)
      .toArray();

    const ids = oldMemories.map(m => m.id);
    await db.memories.bulkDelete(ids);

    for (const memory of oldMemories) {
      if (memory.importance > 3) {
        await db.memories.update(memory.id, {
          relevance: Math.max(1, memory.relevance - 1)
        });
      }
    }

    return ids.length;
  }

  async forget(memoryId: string): Promise<void> {
    await db.memories.delete(memoryId);
  }

  async clearAllMemories(): Promise<void> {
    await db.memories.clear();
  }

  async getStats(): Promise<MemoryStats> {
    const all = await db.memories.toArray();
    
    const byType: Record<string, number> = {};
    for (const memory of all) {
      byType[memory.type] = (byType[memory.type] || 0) + 1;
    }

    const avgImportance = all.length > 0
      ? all.reduce((sum, m) => sum + m.importance, 0) / all.length
      : 0;

    const oldest = all.length > 0
      ? Math.min(...all.map(m => m.createdAt))
      : Date.now();

    const newest = all.length > 0
      ? Math.max(...all.map(m => m.createdAt))
      : Date.now();

    return {
      totalMemories: all.length,
      byType,
      avgImportance,
      oldestMemory: oldest,
      newestMemory: newest
    };
  }

  private async enforceMemoryLimit(): Promise<void> {
    const count = await db.memories.count();
    
    if (count > this.maxMemories) {
      const toDelete = count - this.maxMemories;
      const oldest = await db.memories
        .orderBy('createdAt')
        .limit(toDelete)
        .toArray();

      const ids = oldest.map(m => m.id);
      await db.memories.bulkDelete(ids);
    }
  }

  async searchMemories(query: string): Promise<Memory[]> {
    const lowerQuery = query.toLowerCase();
    
    const all = await db.memories.toArray();
    return all.filter(m => 
      m.content.toLowerCase().includes(lowerQuery) ||
      m.tags.some(t => t.toLowerCase().includes(lowerQuery))
    );
  }

  async getByType(type: Memory['type']): Promise<Memory[]> {
    return db.memories.where('type').equals(type).toArray();
  }

  async getFacts(): Promise<Memory[]> {
    return this.getByType('fact');
  }

  async getKnowledge(): Promise<Memory[]> {
    return this.getByType('knowledge');
  }

  async createBrowsingMemory(
    type: BrowserMemory['type'],
    content: string,
    url?: string,
    metadata?: Record<string, unknown>
  ): Promise<BrowserMemory> {
    const memory: BrowserMemory = {
      id: `browsemem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      url,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      metadata
    };

    await db.browserMemories.add(memory);
    
    await this.createMemory(
      'browsing',
      `Visited: ${content}`,
      ['browsing', type, this.extractDomain(url)],
      3,
      2,
      url
    );

    return memory;
  }

  async getRecentBrowsingMemories(limit: number = 20): Promise<BrowserMemory[]> {
    return db.browserMemories
      .where('sessionId')
      .equals(this.sessionId)
      .reverse()
      .limit(limit)
      .toArray();
  }

  async getBrowsingHistory(limit: number = 50): Promise<BrowserMemory[]> {
    return db.browserMemories
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray();
  }

  async clearBrowsingHistory(): Promise<void> {
    await db.browserMemories.clear();
  }

  private extractDomain(url?: string): string {
    if (!url) return 'unknown';
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }

  async recordSiteVisit(url: string, title: string): Promise<void> {
    await this.createBrowsingMemory('site_visit', title, url, {
      action: 'visit'
    });
  }

  async recordSearchQuery(query: string): Promise<void> {
    await this.createBrowsingMemory('search_query', query, undefined, {
      action: 'search'
    });
  }

  async recordInteraction(element: string, action: string, url: string): Promise<void> {
    await this.createBrowsingMemory('interaction', `${action} on ${element}`, url, {
      element,
      action
    });
  }

  async recordBookmark(url: string, title: string): Promise<void> {
    await this.createBrowsingMemory('bookmark', title, url, {
      action: 'bookmark'
    });
  }
}

export const memoryService = new MemoryService();

export default memoryService;
