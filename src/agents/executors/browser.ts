import { BaseAgentExecutor } from './base';
import { Task, TaskResult } from '../types';
import { cdpNavigate, cdpSearch, cdpScreenshot, cdpGetPageContent } from '../tools/cdp-tools';
import { useBrowserStore } from '@/store/browserStore';

export class BrowserAgentExecutor extends BaseAgentExecutor {
  readonly agentId = 'browser' as const;
  readonly timeout = 30000;

  protected async doExecute(task: Task): Promise<TaskResult> {
    const description = task.description.toLowerCase();

    const isSearch = description.includes('search') || 
                     description.includes('find') || 
                     description.includes('look up') ||
                     description.includes('research');

    const isScreenshot = description.includes('screenshot') || 
                         description.includes('capture') ||
                         description.includes('image of');

    const isExtract = description.includes('read') || 
                      description.includes('extract') ||
                      description.includes('get content');

    try {
      if (isScreenshot) {
        return this.executeScreenshot(task);
      }

      if (isExtract) {
        return this.executeExtract(task);
      }

      if (isSearch) {
        return this.executeSearch(task);
      }

      const url = this.extractUrl(task.description);
      if (url) {
        return this.executeNavigate(task, url);
      }

      return this.executeSearch(task);
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

  private extractUrl(text: string): string | null {
    const urlRegex = /https?:\/\/[^\s]+/;
    const match = text.match(urlRegex);
    return match ? match[0] : null;
  }

  private async executeNavigate(task: Task, url: string): Promise<TaskResult> {
    const result = await cdpNavigate(url);

    if (!result.success) {
      return {
        taskId: task.id,
        agentId: this.agentId,
        success: false,
        error: result.error || 'Navigation failed',
        confidence: 0,
        timestamp: Date.now()
      };
    }

    const contentResult = await cdpGetPageContent();
    const pageContent = contentResult.success ? (contentResult.data as { text?: string })?.text : '';

    useBrowserStore.getState().setAgentActive(false);

    return {
      taskId: task.id,
      agentId: this.agentId,
      success: true,
      data: {
        action: 'navigate',
        url,
        title: (contentResult.data as { title?: string })?.title || url,
        content: pageContent ? this.truncateContent(pageContent, 3000) : `Navigated to ${url}`
      },
      confidence: 0.85,
      reasoning: `Navigated to ${url}`,
      citations: [{ url, title: (contentResult.data as { title?: string })?.title || url, snippet: pageContent?.substring(0, 200) || '', timestamp: Date.now() }],
      timestamp: Date.now()
    };
  }

  private async executeSearch(task: Task): Promise<TaskResult> {
    const query = task.description
      .replace(/search\s*(for|of|about)?/gi, '')
      .replace(/find\s*(for|of|about)?/gi, '')
      .replace(/look\s*up/gi, '')
      .trim();

    const result = await cdpSearch(query);

    if (!result.success) {
      return {
        taskId: task.id,
        agentId: this.agentId,
        success: false,
        error: result.error || 'Search failed',
        confidence: 0,
        timestamp: Date.now()
      };
    }

    await new Promise(resolve => setTimeout(resolve, 1500));

    const contentResult = await cdpGetPageContent();
    const pageContent = contentResult.success ? (contentResult.data as { text?: string })?.text : '';

    useBrowserStore.getState().setAgentActive(false);

    return {
      taskId: task.id,
      agentId: this.agentId,
      success: true,
      data: {
        action: 'search',
        query,
        url: (contentResult.data as { url?: string })?.url || '',
        title: (contentResult.data as { title?: string })?.title || `Search: ${query}`,
        content: pageContent ? this.truncateContent(pageContent, 3000) : `Searched for "${query}"`
      },
      confidence: 0.8,
      reasoning: `Searched for "${query}" and retrieved results`,
      citations: [],
      timestamp: Date.now()
    };
  }

  private async executeScreenshot(task: Task): Promise<TaskResult> {
    const result = await cdpScreenshot();

    if (!result.success) {
      return {
        taskId: task.id,
        agentId: this.agentId,
        success: false,
        error: result.error || 'Screenshot failed',
        confidence: 0,
        timestamp: Date.now()
      };
    }

    const screenshotData = (result.data as { screenshot?: string })?.screenshot;

    useBrowserStore.getState().setAgentActive(false);

    return {
      taskId: task.id,
      agentId: this.agentId,
      success: true,
      data: {
        action: 'screenshot',
        screenshot: screenshotData
      },
      confidence: 1,
      reasoning: 'Captured screenshot of the current page',
      timestamp: Date.now()
    };
  }

  private async executeExtract(task: Task): Promise<TaskResult> {
    const result = await cdpGetPageContent();

    if (!result.success) {
      return {
        taskId: task.id,
        agentId: this.agentId,
        success: false,
        error: result.error || 'Failed to extract content',
        confidence: 0,
        timestamp: Date.now()
      };
    }

    const pageData = result.data as { text?: string; url?: string; title?: string } | undefined;

    useBrowserStore.getState().setAgentActive(false);

    return {
      taskId: task.id,
      agentId: this.agentId,
      success: true,
      data: {
        action: 'extract',
        url: pageData?.url || '',
        title: pageData?.title || '',
        content: pageData?.text ? this.truncateContent(pageData.text, 5000) : ''
      },
      confidence: 0.9,
      reasoning: 'Extracted content from the current page',
      citations: pageData?.url ? [{ url: pageData.url, title: pageData.title || pageData.url, snippet: pageData.text?.substring(0, 200) || '', timestamp: Date.now() }] : [],
      timestamp: Date.now()
    };
  }

  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '... [truncated]';
  }
}
