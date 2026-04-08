import { BaseAgentExecutor } from './base';
import { Task, TaskResult } from '../types';

export class BrowserAgentExecutor extends BaseAgentExecutor {
  readonly agentId = 'browser' as const;
  readonly timeout = 15000;

  private readonly baseUrl: string;

  constructor(baseUrl = 'http://localhost:8765') {
    super();
    this.baseUrl = baseUrl;
  }

  protected async doExecute(task: Task): Promise<TaskResult> {
    const url = this.extractUrl(task.description);

    if (url) {
      return this.navigateAndExtract(url, task);
    }

    return this.searchAndNavigate(task);
  }

  private extractUrl(text: string): string | null {
    const urlRegex = /https?:\/\/[^\s]+/;
    const match = text.match(urlRegex);
    return match ? match[0] : null;
  }

  private async navigateAndExtract(url: string, task: Task): Promise<TaskResult> {
    try {
      const response = await fetch(`${this.baseUrl}/browse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await response.json();

      const content = data.result?.content || data.content || '';

      return {
        taskId: task.id,
        agentId: this.agentId,
        success: response.ok,
        data: {
          url,
          title: data.result?.title || data.title || 'Unknown',
          content: this.truncateContent(content, 3000),
          rawContent: content
        },
        confidence: response.ok ? 0.85 : 0.5,
        reasoning: `Navigated to ${url} and extracted content`,
        citations: [{ url, title: data.title || url, snippet: content.substring(0, 200), timestamp: Date.now() }],
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

  private async searchAndNavigate(task: Task): Promise<TaskResult> {
    return {
      taskId: task.id,
      agentId: this.agentId,
      success: true,
      data: {
        action: 'search',
        query: task.description,
        results: []
      },
      confidence: 0.6,
      reasoning: 'Browser task routed for web search',
      timestamp: Date.now()
    };
  }

  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '... [truncated]';
  }
}
