import { BaseAgentExecutor } from './base';
import { Task, TaskResult, Citation } from '../types';

export class ResearchAgentExecutor extends BaseAgentExecutor {
  readonly agentId = 'researcher' as const;
  readonly timeout = 30000;

  private readonly baseUrl: string;

  constructor(baseUrl = 'http://localhost:8765') {
    super();
    this.baseUrl = baseUrl;
  }

  protected async doExecute(task: Task): Promise<TaskResult> {
    try {
      const response = await fetch(`${this.baseUrl}/tool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'search_web',
          params: { query: task.description }
        })
      });

      if (!response.ok) {
        throw new Error(`Research API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.result || data.response || '';

      const citations = this.extractCitations(content);

      return {
        taskId: task.id,
        agentId: this.agentId,
        success: true,
        data: {
          content,
          summary: this.generateSummary(content),
          sources: citations.length
        },
        confidence: this.calculateConfidence(content, citations),
        reasoning: 'Performed web search and synthesized results',
        citations,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        taskId: task.id,
        agentId: this.agentId,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        confidence: 0,
        timestamp: Date.now()
      };
    }
  }

  private extractCitations(content: string): Citation[] {
    const citations: Citation[] = [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = content.match(urlRegex) || [];

    const uniqueUrls = [...new Set(urls)].slice(0, 5);

    uniqueUrls.forEach((url, index) => {
      citations.push({
        url,
        title: `Source ${index + 1}`,
        snippet: content.substring(0, 200),
        timestamp: Date.now()
      });
    });

    return citations;
  }

  private generateSummary(content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 3).join('. ').trim() + '.';
  }

  private calculateConfidence(content: string, citations: Citation[]): number {
    let confidence = 0.5;

    if (citations.length > 0) confidence += 0.2;
    if (citations.length >= 3) confidence += 0.1;
    if (content.length > 500) confidence += 0.1;
    if (content.includes('verified') || content.includes('source')) confidence += 0.1;

    return Math.min(confidence, 0.95);
  }
}
