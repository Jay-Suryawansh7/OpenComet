import { LLMClient, LLMMessage, createLLMClient } from './llm-client';
import { AgentId, Task, TaskResult, Citation } from './types';
import { ToolDefinition, ToolResult, getToolsForAgent, executeTool } from './tools';
import { AGENT_REGISTRY } from './registry';

export interface AgentExecutorConfig {
  llmClient?: LLMClient;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export abstract class TSAgentExecutor {
  abstract readonly agentId: AgentId;
  abstract readonly systemPrompt: string;
  abstract readonly tools: string[];

  protected llm: LLMClient;
  protected timeout: number;
  protected availableTools: ToolDefinition[] = [];

  constructor(config: AgentExecutorConfig = {}) {
    this.llm = config.llmClient || createLLMClient();
    this.timeout = config.timeout || 30000;
  }

  protected initializeTools(): void {
    this.availableTools = this.tools.map(name => ({
      name,
      description: '',
      parameters: {},
      execute: () => Promise.resolve({ success: true })
    }));
  }

  abstract execute(task: Task): Promise<TaskResult>;

  protected async callLLM(
    messages: LLMMessage[],
    _tools?: ToolDefinition[]
  ): Promise<{ content: string; toolCalls?: Array<{ name: string; args: Record<string, unknown> }> }> {
    const response = await Promise.race([
      this.llm.complete(messages),
      this.createTimeout()
    ]) as { content: string };

    return { content: response.content };
  }

  protected async callLLMWithTools(
    messages: LLMMessage[],
    toolDefs: ToolDefinition[]
  ): Promise<{ content: string; toolCalls?: Array<{ name: string; args: Record<string, unknown> }> }> {
    const systemWithTools = this.buildToolSystemPrompt(toolDefs);
    const allMessages: LLMMessage[] = [
      { role: 'system', content: systemWithTools },
      ...messages
    ];

    const response = await Promise.race([
      this.llm.complete(allMessages),
      this.createTimeout()
    ]) as { content: string };

    const toolCalls = this.extractToolCalls(response.content);

    if (toolCalls.length > 0) {
      for (const call of toolCalls) {
        const result = await executeTool(call.name, call.args);
        messages.push({ role: 'assistant', content: response.content });
        messages.push({
          role: 'user',
          content: `Tool ${call.name} result: ${JSON.stringify(result)}`
        });
      }

      const followUp = await this.llm.complete(messages);
      return { content: followUp.content };
    }

    return { content: response.content };
  }

  protected buildToolSystemPrompt(tools: ToolDefinition[]): string {
    const toolDefs = tools.map(t => {
      const params = Object.entries(t.parameters)
        .map(([name, param]) => `  - ${name} (${param.type}): ${param.description}`)
        .join('\n');
      
      return `${t.name}: ${t.description}\n${params}`;
    }).join('\n\n');

    return `${this.systemPrompt}\n\nAvailable Tools:\n${toolDefs}\n\nUse tools when needed by outputting JSON in this format:\n{"tool": "tool_name", "args": {"param": "value"}}`;
  }

  protected extractToolCalls(content: string): Array<{ name: string; args: Record<string, unknown> }> {
    const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
    const jsonMatches = content.match(/\{[^}]*"tool"[^}]*\}/g);

    if (jsonMatches) {
      for (const match of jsonMatches) {
        try {
          const parsed = JSON.parse(match);
          if (parsed.tool && parsed.args) {
            calls.push({ name: parsed.tool, args: parsed.args });
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }

    return calls;
  }

  protected createTimeout(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Agent timed out after ${this.timeout}ms`)), this.timeout);
    });
  }

  protected extractCitations(content: string): Citation[] {
    const citations: Citation[] = [];
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = content.match(urlRegex) || [];

    const uniqueUrls = [...new Set(urls)].slice(0, 5);

    uniqueUrls.forEach((url, index) => {
      citations.push({
        url,
        title: `Source ${index + 1}`,
        snippet: content.substring(0, 200),
        timestamp: Date.now(),
      });
    });

    return citations;
  }

  protected calculateConfidence(content: string, citations: Citation[]): number {
    let confidence = 0.5;

    if (citations.length > 0) confidence += 0.2;
    if (citations.length >= 3) confidence += 0.1;
    if (content.length > 500) confidence += 0.1;
    if (content.includes('verified') || content.includes('source')) confidence += 0.1;

    return Math.min(confidence, 0.95);
  }

  protected buildMessages(task: Task): LLMMessage[] {
    return [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: task.description }
    ];
  }
}

export class TSResearchAgentExecutor extends TSAgentExecutor {
  readonly agentId: AgentId = 'researcher';
  readonly systemPrompt = AGENT_REGISTRY.researcher.systemPrompt;
  readonly tools = getToolsForAgent('researcher');

  async execute(task: Task): Promise<TaskResult> {
    const startTime = Date.now();

    try {

      let webResults = '';
      const searchTool = this.tools.find(t => t.includes('search'));
      if (searchTool) {
        const searchResult = await executeTool(searchTool, { query: task.description, numResults: 5 });
        webResults = searchResult.content || '';
      }

      const messages = this.buildMessages(task);
      if (webResults) {
        messages.push({ role: 'system', content: `Web search results:\n${webResults}` });
      }

      const { content } = await this.callLLM(messages);
      const citations = this.extractCitations(content + webResults);
      const confidence = this.calculateConfidence(content, citations);

      return {
        taskId: task.id,
        agentId: this.agentId,
        success: true,
        data: { content, sources: webResults, summary: content.substring(0, 200) },
        confidence,
        reasoning: 'Performed web research and synthesized results',
        citations,
        timestamp: Date.now(),
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        taskId: task.id,
        agentId: this.agentId,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        confidence: 0,
        timestamp: Date.now(),
        executionTime: Date.now() - startTime
      };
    }
  }
}

export class TSCoderAgentExecutor extends TSAgentExecutor {
  readonly agentId: AgentId = 'coder';
  readonly systemPrompt = AGENT_REGISTRY.coder.systemPrompt;
  readonly tools = getToolsForAgent('coder');

  async execute(task: Task): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      const codeTask = this.detectCodeTask(task.description);
      let content: string;
      let executionResult: ToolResult | null = null;

      if (codeTask.action === 'execute' && codeTask.code) {
        const executeToolName = this.tools.find(t => t.includes('execute'));
        if (executeToolName) {
          executionResult = await executeTool(executeToolName, {
            code: codeTask.code,
            language: codeTask.language
          });
          content = `Generated and executed code:\n\n\`\`\`${codeTask.language}\n${codeTask.code}\n\`\`\`\n\nOutput:\n${executionResult.content || 'No output'}`;
        } else {
          content = `Generated code:\n\n\`\`\`${codeTask.language}\n${codeTask.code}\n\`\`\``;
        }
      } else {
        const messages = this.buildMessages(task);
        const { content: llmContent } = await this.callLLM(messages);
        content = llmContent;
      }

      return {
        taskId: task.id,
        agentId: this.agentId,
        success: true,
        data: {
          content,
          language: codeTask.language,
          executionOutput: executionResult?.content
        },
        confidence: 0.85,
        reasoning: 'Generated and/or executed code',
        timestamp: Date.now(),
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        taskId: task.id,
        agentId: this.agentId,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        confidence: 0,
        timestamp: Date.now(),
        executionTime: Date.now() - startTime
      };
    }
  }

  private detectCodeTask(description: string): {
    action: 'generate' | 'execute' | 'analyze';
    language: string;
    code?: string;
  } {
    const execMatch = description.match(/run|execute|in python|in javascript/i);
    const langMatch = description.match(/\b(python|javascript|typescript|java|rust|go)\b/i);
    const language = langMatch ? langMatch[1].toLowerCase() : 'python';
    const codeBlockMatch = description.match(/```[\s\S]*?```/);

    if (execMatch && codeBlockMatch) {
      return { action: 'execute', language, code: codeBlockMatch[0].replace(/```\w*\n?/g, '') };
    }

    return { action: 'generate', language };
  }
}

export class TSBrowserAgentExecutor extends TSAgentExecutor {
  readonly agentId: AgentId = 'browser';
  readonly systemPrompt = AGENT_REGISTRY.browser.systemPrompt;
  readonly tools = getToolsForAgent('browser');

  async execute(task: Task): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      const url = this.extractUrl(task.description);
      let content: string;
      let pageTitle = '';
      let citations: Citation[] = [];

      if (url) {
        const browseTool = this.tools.find(t => t.includes('browse') || t.includes('url'));
        if (browseTool) {
          const result = await executeTool(browseTool, { url, maxLength: 3000 });
          content = result.content || '';
          const data = result.data as { title?: string } | undefined;
          pageTitle = data?.title || '';
          citations = result.citations || [];
        } else {
          content = `Would navigate to: ${url}`;
        }
      } else {
        const messages = this.buildMessages(task);
        const { content: llmContent } = await this.callLLM(messages);
        content = llmContent;
      }

      return {
        taskId: task.id,
        agentId: this.agentId,
        success: true,
        data: { url, title: pageTitle, content },
        confidence: url ? 0.85 : 0.6,
        reasoning: url ? `Navigated to ${url}` : 'No URL found, provided guidance',
        citations,
        timestamp: Date.now(),
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        taskId: task.id,
        agentId: this.agentId,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        confidence: 0,
        timestamp: Date.now(),
        executionTime: Date.now() - startTime
      };
    }
  }

  private extractUrl(text: string): string | null {
    const urlRegex = /https?:\/\/[^\s]+/;
    const match = text.match(urlRegex);
    return match ? match[0] : null;
  }
}

export class TSFactCheckerAgentExecutor extends TSAgentExecutor {
  readonly agentId: AgentId = 'fact-checker';
  readonly systemPrompt = AGENT_REGISTRY['fact-checker'].systemPrompt;
  readonly tools = getToolsForAgent('fact-checker');

  async execute(task: Task): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      const claim = task.description.replace(/verify|check|confirm/i, '').trim();
      let searchResults = '';

      const searchTool = this.tools.find(t => t.includes('search'));
      if (searchTool) {
        const result = await executeTool(searchTool, { query: claim, numResults: 3 });
        searchResults = result.content || '';
      }

      const verificationPrompt = `Verify this claim: "${claim}"

Based on the following search results:
${searchResults}

Format your response as:
VERIFICATION: [Verified/Unverified/Disputed]
CONFIDENCE: [0-100%]
EVIDENCE: [Supporting or contradicting sources]`;

      const messages: LLMMessage[] = [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: verificationPrompt }
      ];

      const { content } = await this.callLLM(messages);

      let status = 'unverified';
      let confidence = 0.5;

      if (content.toLowerCase().includes('verified')) {
        status = 'verified';
        confidence = 0.8;
      } else if (content.toLowerCase().includes('disputed')) {
        status = 'disputed';
        confidence = 0.6;
      }

      return {
        taskId: task.id,
        agentId: this.agentId,
        success: true,
        data: { claim, status, analysis: content },
        confidence,
        reasoning: `Verification complete: ${status}`,
        timestamp: Date.now(),
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        taskId: task.id,
        agentId: this.agentId,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        confidence: 0,
        timestamp: Date.now(),
        executionTime: Date.now() - startTime
      };
    }
  }
}

export class TSSummarizerAgentExecutor extends TSAgentExecutor {
  readonly agentId: AgentId = 'summarizer';
  readonly systemPrompt = AGENT_REGISTRY.summarizer.systemPrompt;
  readonly tools = getToolsForAgent('summarizer');

  async execute(task: Task): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      const messages = this.buildMessages(task);
      const { content } = await this.callLLM(messages);

      return {
        taskId: task.id,
        agentId: this.agentId,
        success: true,
        data: {
          content,
          originalLength: task.description.length,
          summaryLength: content.length
        },
        confidence: 0.75,
        reasoning: 'Generated summary from content',
        timestamp: Date.now(),
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        taskId: task.id,
        agentId: this.agentId,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        confidence: 0,
        timestamp: Date.now(),
        executionTime: Date.now() - startTime
      };
    }
  }
}

export const createAgentExecutor = (agentId: AgentId, config?: AgentExecutorConfig): TSAgentExecutor => {
  switch (agentId) {
    case 'researcher':
      return new TSResearchAgentExecutor(config);
    case 'coder':
      return new TSCoderAgentExecutor(config);
    case 'browser':
      return new TSBrowserAgentExecutor(config);
    case 'fact-checker':
      return new TSFactCheckerAgentExecutor(config);
    case 'summarizer':
      return new TSSummarizerAgentExecutor(config);
    default:
      return new TSResearchAgentExecutor(config);
  }
};
