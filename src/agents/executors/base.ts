import { AgentId, Task, TaskResult } from '../types';

export interface AgentExecutor {
  readonly agentId: AgentId;
  execute(task: Task): Promise<TaskResult>;
  healthCheck?(): Promise<boolean>;
}

export abstract class BaseAgentExecutor implements AgentExecutor {
  abstract readonly agentId: AgentId;
  abstract readonly timeout: number;

  protected abstract doExecute(task: Task): Promise<TaskResult>;

  async execute(task: Task): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      const result = await Promise.race([
        this.doExecute(task),
        this.createTimeoutPromise()
      ]);

      return {
        ...result,
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

  async healthCheck(): Promise<boolean> {
    try {
      const testTask: Task = {
        id: 'health-check',
        type: 'search',
        description: 'Health check',
        priority: 'low',
        dependencies: [],
        createdAt: Date.now()
      };
      const result = await this.execute(testTask);
      return result.success;
    } catch {
      return false;
    }
  }

  private createTimeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Task timed out after ${this.timeout}ms`));
      }, this.timeout);
    });
  }
}
