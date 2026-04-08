import { BaseAgentExecutor } from './base';
import { Task, TaskResult, TaskResult as AggregatedResult } from '../types';

export class SummarizerExecutor extends BaseAgentExecutor {
  readonly agentId = 'summarizer' as const;
  readonly timeout = 15000;

  protected async doExecute(task: Task): Promise<TaskResult> {
    const results = task.context?.results as AggregatedResult[] | undefined;

    if (!results || results.length === 0) {
      return this.summarizeText(task);
    }

    return this.aggregateResults(task, results);
  }

  private summarizeText(task: Task): TaskResult {
    const content = task.description;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);

    const summary = sentences.length > 0
      ? sentences.slice(0, 3).join('. ').trim() + '.'
      : content.substring(0, 200);

    return {
      taskId: task.id,
      agentId: this.agentId,
      success: true,
      data: {
        summary,
        originalLength: content.length,
        summaryLength: summary.length,
        compressionRatio: content.length > 0 ? summary.length / content.length : 1
      },
      confidence: 0.7,
      reasoning: 'Generated summary from text',
      timestamp: Date.now()
    };
  }

  private aggregateResults(task: Task, results: AggregatedResult[]): TaskResult {
    const successfulResults = results.filter(r => r.success);

    if (successfulResults.length === 0) {
      return {
        taskId: task.id,
        agentId: this.agentId,
        success: false,
        error: 'No successful results to aggregate',
        confidence: 0,
        timestamp: Date.now()
      };
    }

    const aggregatedContent = successfulResults
      .map(r => {
        const content = typeof r.data === 'string' ? r.data : JSON.stringify(r.data);
        return content;
      })
      .join('\n\n---\n\n');

    const averageConfidence =
      successfulResults.reduce((sum, r) => sum + r.confidence, 0) / successfulResults.length;

    const allCitations = successfulResults.flatMap(r => r.citations || []);

    return {
      taskId: task.id,
      agentId: this.agentId,
      success: true,
      data: {
        aggregatedContent,
        sourceCount: successfulResults.length,
        sources: allCitations.slice(0, 5)
      },
      confidence: averageConfidence,
      reasoning: `Aggregated ${successfulResults.length} results from different agents`,
      citations: allCitations,
      timestamp: Date.now()
    };
  }

  formatResponse(
    content: string,
    format: 'brief' | 'detailed' | 'bullets' = 'detailed',
    citations?: { url: string; title: string }[]
  ): string {
    let formatted = content;

    if (format === 'brief') {
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
      formatted = sentences.slice(0, 2).join('. ').trim() + '.';
    } else if (format === 'bullets') {
      const points = content.split('\n').filter(l => l.trim().length > 10);
      formatted = points.map(p => `• ${p.trim()}`).join('\n');
    }

    if (citations && citations.length > 0) {
      formatted += '\n\n**Sources:**\n';
      citations.forEach((c, i) => {
        formatted += `${i + 1}. [${c.title}](${c.url})\n`;
      });
    }

    return formatted;
  }
}
