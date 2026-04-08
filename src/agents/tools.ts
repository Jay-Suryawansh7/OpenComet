import { AgentId, Citation } from './types';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  execute: (params: Record<string, unknown>) => Promise<ToolResult>;
}

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
  default?: unknown;
}

export interface ToolResult {
  success: boolean;
  content?: string;
  data?: unknown;
  error?: string;
  citations?: Citation[];
}

const PROXY_URL = 'http://localhost:8765';

export class WebSearchTool {
  name = 'web_search';
  description = 'Search the web for information on a topic';
  parameters = {
    query: {
      type: 'string' as const,
      description: 'The search query',
      required: true,
    },
    numResults: {
      type: 'number' as const,
      description: 'Number of results to return',
      required: false,
      default: 5,
    },
  };

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const query = params.query as string;
    const numResults = (params.numResults as number) || 5;

    try {
      const response = await fetch(`${PROXY_URL}/api/tools/web-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, numResults }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Search failed');
      }

      const formattedResults = this.formatResults(data.query, data.results);

      return {
        success: true,
        content: formattedResults,
        citations: data.results.map((r: { url: string; title: string; snippet: string }, i: number) => ({
          url: r.url,
          title: r.title,
          snippet: r.snippet || formattedResults.substring(i * 100, (i + 1) * 100),
          timestamp: Date.now(),
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
      };
    }
  }

  private formatResults(query: string, results: Array<{ title: string; url: string; snippet: string }>): string {
    if (!results || results.length === 0) {
      return `No search results found for "${query}"`;
    }

    const lines = [`Search results for "${query}":\n`];
    
    results.forEach((result, i) => {
      lines.push(`${i + 1}. ${result.title}`);
      lines.push(`   URL: ${result.url}`);
      if (result.snippet) {
        lines.push(`   ${result.snippet}`);
      }
      lines.push('');
    });

    return lines.join('\n');
  }

  toDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      parameters: this.parameters,
      execute: this.execute.bind(this),
    };
  }
}

export class BrowseURLTool {
  name = 'browse_url';
  description = 'Navigate to a URL and extract the page content';
  parameters = {
    url: {
      type: 'string' as const,
      description: 'The URL to navigate to',
      required: true,
    },
    maxLength: {
      type: 'number' as const,
      description: 'Maximum characters to extract',
      required: false,
      default: 5000,
    },
  };

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const url = params.url as string;
    const maxLength = (params.maxLength as number) || 5000;

    try {
      const response = await fetch(`${PROXY_URL}/api/tools/browse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, maxLength }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Browse failed');
      }

      return {
        success: true,
        content: `Title: ${data.title}\n\nURL: ${data.url}\n\nContent:\n${data.content}`,
        data: { title: data.title, url: data.url, content: data.content },
        citations: [{
          url: data.url,
          title: data.title,
          snippet: data.content?.substring(0, 200) || '',
          timestamp: Date.now(),
        }],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to browse URL',
      };
    }
  }

  toDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      parameters: this.parameters,
      execute: this.execute.bind(this),
    };
  }
}

export class ReadFileTool {
  name = 'read_file';
  description = 'Read the contents of a file';
  parameters = {
    path: {
      type: 'string' as const,
      description: 'Path to the file',
      required: true,
    },
  };

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const path = params.path as string;

    try {
      const response = await fetch(path);
      
      if (!response.ok) {
        throw new Error(`Failed to read file: ${response.status}`);
      }

      const content = await response.text();

      return {
        success: true,
        content,
        data: { path, size: content.length },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read file',
      };
    }
  }

  toDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      parameters: this.parameters,
      execute: this.execute.bind(this),
    };
  }
}

export class WriteFileTool {
  name = 'write_file';
  description = 'Write content to a file';
  parameters = {
    path: {
      type: 'string' as const,
      description: 'Path to the file',
      required: true,
    },
    content: {
      type: 'string' as const,
      description: 'Content to write',
      required: true,
    },
  };

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const path = params.path as string;
    const content = params.content as string;

    try {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = path.split('/').pop() || 'file.txt';
      a.click();
      URL.revokeObjectURL(url);

      return {
        success: true,
        content: `Downloaded: ${path}`,
        data: { path, size: content.length },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to write file',
      };
    }
  }

  toDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      parameters: this.parameters,
      execute: this.execute.bind(this),
    };
  }
}

export class ExecuteCodeTool {
  name = 'execute_code';
  description = 'Execute JavaScript code in a sandboxed environment';
  parameters = {
    code: {
      type: 'string' as const,
      description: 'The JavaScript code to execute',
      required: true,
    },
    language: {
      type: 'string' as const,
      description: 'Programming language (javascript)',
      required: false,
      default: 'javascript',
    },
  };

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const code = params.code as string;
    const language = (params.language as string) || 'javascript';

    if (language !== 'javascript' && language !== 'js') {
      return {
        success: false,
        error: `Language ${language} not supported. Use JavaScript.`,
      };
    }

    try {
      const logs = [] as string[];
      const originalLog = console.log;
      const originalError = console.error;
      
      console.log = (...args) => {
        logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
      };
      console.error = (...args) => {
        logs.push('[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      };

      let result;
      try {
        result = eval(code);
      } finally {
        console.log = originalLog;
        console.error = originalError;
      }

      const output = logs.length > 0 ? logs.join('\n') : '';
      const resultStr = result !== undefined ? String(result) : '';

      return {
        success: true,
        content: output + (resultStr ? `\n=> ${resultStr}` : ''),
        data: { language, output, result: resultStr },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Code execution failed',
      };
    }
  }

  toDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      parameters: this.parameters,
      execute: this.execute.bind(this),
    };
  }
}

export class SystemInfoTool {
  name = 'system_info';
  description = 'Get system information';
  parameters = {};

  async execute(_params: Record<string, unknown>): Promise<ToolResult> {
    return {
      success: true,
      content: `System Information:
- Platform: ${navigator.platform}
- User Agent: ${navigator.userAgent}
- Language: ${navigator.language}
- Screen: ${window.screen.width}x${window.screen.height}
- Memory: ${(navigator as unknown as { deviceMemory?: number }).deviceMemory || 'Unknown'} GB
- Online: ${navigator.onLine}
- Timestamp: ${new Date().toISOString()}`,
      data: {
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        language: navigator.language,
        online: navigator.onLine,
      },
    };
  }

  toDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      parameters: this.parameters,
      execute: this.execute.bind(this),
    };
  }
}

export class CalculatorTool {
  name = 'calculate';
  description = 'Perform mathematical calculations';
  parameters = {
    expression: {
      type: 'string' as const,
      description: 'Mathematical expression to evaluate',
      required: true,
    },
  };

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const expression = params.expression as string;

    try {
      const sanitized = expression.replace(/[^0-9+\-*/.()%^ ]/g, '');
      const result = this.evaluate(sanitized);
      
      return {
        success: true,
        content: `${expression} = ${result}`,
        data: { expression, result },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Calculation failed',
      };
    }
  }

  private evaluate(expr: string): number {
    const tokens = expr.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) throw new Error('Empty expression');
    
    let result = parseFloat(tokens[0]);
    for (let i = 1; i < tokens.length; i += 2) {
      const op = tokens[i];
      const num = parseFloat(tokens[i + 1]);
      if (isNaN(num)) throw new Error(`Invalid number: ${tokens[i + 1]}`);
      
      switch (op) {
        case '+': result += num; break;
        case '-': result -= num; break;
        case '*': result *= num; break;
        case '/': result /= num; break;
        case '%': result %= num; break;
        default: throw new Error(`Unknown operator: ${op}`);
      }
    }
    return result;
  }

  toDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      parameters: this.parameters,
      execute: this.execute.bind(this),
    };
  }
}

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  web_search: new WebSearchTool().toDefinition(),
  browse_url: new BrowseURLTool().toDefinition(),
  read_file: new ReadFileTool().toDefinition(),
  write_file: new WriteFileTool().toDefinition(),
  execute_code: new ExecuteCodeTool().toDefinition(),
  system_info: new SystemInfoTool().toDefinition(),
  calculate: new CalculatorTool().toDefinition(),
};

export const getTool = (name: string): ToolDefinition | undefined => TOOL_REGISTRY[name];

export const executeTool = async (name: string, params: Record<string, unknown>): Promise<ToolResult> => {
  const tool = getTool(name);
  if (!tool) {
    return { success: false, error: `Unknown tool: ${name}` };
  }
  return tool.execute(params);
};

export const getToolsForAgent = (agentId: AgentId): string[] => {
  const agentTools: Record<AgentId, string[]> = {
    coordinator: ['web_search', 'browse_url', 'system_info'],
    researcher: ['web_search', 'browse_url'],
    coder: ['read_file', 'write_file', 'execute_code', 'calculate'],
    browser: ['browse_url', 'web_search'],
    'fact-checker': ['web_search', 'browse_url'],
    summarizer: [],
  };
  return agentTools[agentId] || [];
};
