import { Task, TaskType, AgentId, createTaskId } from './types';

interface RoutingRule {
  agents: AgentId[];
  requiresVerification?: boolean;
  alwaysInclude?: boolean;
}

export class TaskRouter {
  private routingRules: Map<TaskType, RoutingRule> = new Map([
    ['research', { agents: ['researcher'], requiresVerification: true }],
    ['search', { agents: ['researcher', 'browser'] }],
    ['code', { agents: ['coder'] }],
    ['browse', { agents: ['browser'] }],
    ['verify', { agents: ['fact-checker'] }],
    ['summarize', { agents: ['summarizer'] }]
  ]);

  routeTask(task: Task): AgentId[] {
    const rule = this.routingRules.get(task.type);
    const agents = rule?.agents || ['coordinator'];

    const result: AgentId[] = [...agents];

    if (rule?.requiresVerification && task.priority === 'high') {
      result.push('fact-checker');
    }

    return result;
  }

  decomposeQuery(query: string): Task[] {
    const tasks: Task[] = [];
    const baseId = createTaskId();
    const types = this.detectTaskTypes(query);

    const dependencyChain: string[] = [];

    for (const type of types) {
      const taskId = `${baseId}-${type}`;
      const task = this.createTask(taskId, type, query, dependencyChain);
      tasks.push(task);
      dependencyChain.push(taskId);
    }

    if (tasks.length > 1) {
      tasks.push(
        this.createTask(
          `${baseId}-aggregate`,
          'summarize',
          'Aggregate and synthesize all results',
          dependencyChain
        )
      );
    }

    return tasks;
  }

  private detectTaskTypes(query: string): TaskType[] {
    const types: TaskType[] = [];
    const lowerQuery = query.toLowerCase();

    if (this.isCodeRequest(lowerQuery)) {
      types.push('code');
    }

    if (this.needsResearch(lowerQuery)) {
      types.push('search');
    }

    if (this.needsBrowsing(lowerQuery)) {
      types.push('browse');
    }

    if (this.needsVerification(lowerQuery)) {
      types.push('verify');
    }

    if (types.length === 0) {
      types.push('search');
    }

    return types;
  }

  private createTask(
    id: string,
    type: TaskType,
    description: string,
    dependencies: string[]
  ): Task {
    const agents = this.routeTask({ id, type, description, dependencies } as Task);
    const priority = this.determinePriority(type, description);

    return {
      id,
      type,
      description,
      assignedAgent: agents[0],
      priority,
      dependencies,
      status: 'pending',
      createdAt: Date.now()
    };
  }

  private determinePriority(type: TaskType, description: string): 'high' | 'medium' | 'low' {
    const urgentKeywords = ['urgent', 'asap', 'immediately', 'emergency', 'critical'];
    const hasUrgent = urgentKeywords.some(k => description.toLowerCase().includes(k));
    if (hasUrgent) return 'high';

    switch (type) {
      case 'code':
        return 'high';
      case 'verify':
        return 'medium';
      case 'summarize':
        return 'low';
      default:
        return 'medium';
    }
  }

  private isCodeRequest(query: string): boolean {
    const keywords = [
      'code', 'function', 'implement', 'python', 'javascript', 'typescript',
      'java', 'rust', 'go', 'api', 'program', 'script', 'debug', 'fix bug',
      'write code', 'generate code', 'class', 'algorithm', 'database',
      'sql', 'react', 'node', 'framework', 'library'
    ];
    return keywords.some(k => query.includes(k));
  }

  private needsResearch(query: string): boolean {
    const keywords = [
      'what', 'why', 'how', 'explain', 'tell me', 'find', 'search',
      'research', 'information', 'about', 'definition', 'meaning',
      'history', 'who is', 'what is', 'learn', 'understand'
    ];
    return keywords.some(k => query.includes(k));
  }

  private needsBrowsing(query: string): boolean {
    const keywords = [
      'website', 'page', 'browse', 'visit', 'http', 'www', '.com', '.org',
      'open', 'go to', 'navigate to', 'check out', 'read', 'article'
    ];
    return keywords.some(k => query.includes(k));
  }

  private needsVerification(query: string): boolean {
    const keywords = [
      'verify', 'confirm', 'check if', 'true or false', 'fact', 'accurate',
      'reliable', 'source', 'citation', 'proof', 'evidence', 'claim'
    ];
    return keywords.some(k => query.includes(k));
  }

  getOptimalAgentForTask(type: TaskType): AgentId {
    const rule = this.routingRules.get(type);
    return rule?.agents[0] || 'coordinator';
  }

  estimateTaskComplexity(task: Task): 'simple' | 'moderate' | 'complex' {
    const wordCount = task.description.split(' ').length;

    if (wordCount < 10) return 'simple';
    if (wordCount < 50) return 'moderate';
    
    const complexKeywords = ['analyze', 'compare', 'evaluate', 'research deep', 'comprehensive'];
    if (complexKeywords.some(k => task.description.toLowerCase().includes(k))) {
      return 'complex';
    }

    return wordCount < 100 ? 'moderate' : 'complex';
  }
}

export const taskRouter = new TaskRouter();
