import { BaseAgentExecutor } from './base';
import { Task, TaskResult, ConsensusVote, Vote } from '../types';

export class FactCheckerExecutor extends BaseAgentExecutor {
  readonly agentId = 'fact-checker' as const;
  readonly timeout = 20000;

  private readonly baseUrl: string;

  constructor(baseUrl = 'http://localhost:8765') {
    super();
    this.baseUrl = baseUrl;
  }

  protected async doExecute(task: Task): Promise<TaskResult> {
    if (task.type === 'verify') {
      return this.verifyClaim(task);
    }

    return this.crossReference(task);
  }

  async verifyWithEvidence(claims: string[]): Promise<ConsensusVote> {
    let agreeCount = 0;
    let disagreeCount = 0;
    const evidence: string[] = [];

    for (const claim of claims) {
      const result = await this.performVerification(claim);

      if (result.verified) {
        agreeCount++;
      } else if (result.disputed) {
        disagreeCount++;
      }

      evidence.push(...result.evidence);
    }

    const total = claims.length;
    const agreeRatio = agreeCount / total;
    const disagreeRatio = disagreeCount / total;

    let vote: Vote = 'abstain';
    if (agreeRatio > 0.7) vote = 'agree';
    else if (disagreeRatio > 0.5) vote = 'disagree';

    return {
      agentId: this.agentId,
      vote,
      reasoning: this.generateReasoning(agreeCount, disagreeCount, total),
      confidence: Math.max(agreeRatio, disagreeRatio),
      evidence
    };
  }

  private async verifyClaim(task: Task): Promise<TaskResult> {
    const claim = task.description.replace(/verify|check|confirm/i, '').trim();

    try {
      const response = await fetch(`${this.baseUrl}/tool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'search_web',
          params: { query: claim }
        })
      });

      const data = await response.json();
      const content = data.result || '';

      const verification = this.analyzeClaim(claim, content);

      return {
        taskId: task.id,
        agentId: this.agentId,
        success: true,
        data: {
          claim,
          status: verification.status,
          confidence: verification.confidence,
          evidence: verification.evidence,
          sources: verification.sources
        },
        confidence: verification.confidence,
        reasoning: verification.reasoning,
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

  private async crossReference(task: Task): Promise<TaskResult> {
    return {
      taskId: task.id,
      agentId: this.agentId,
      success: true,
      data: {
        claims: [task.description],
        verification: 'pending'
      },
      confidence: 0.5,
      reasoning: 'Cross-reference task initiated',
      timestamp: Date.now()
    };
  }

  private async performVerification(claim: string): Promise<{
    verified: boolean;
    disputed: boolean;
    evidence: string[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/tool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'search_web',
          params: { query: claim }
        })
      });

      const data = await response.json();
      const content = data.result || '';

      const verification = this.analyzeClaim(claim, content);

      return {
        verified: verification.status === 'verified',
        disputed: verification.status === 'disputed',
        evidence: verification.evidence
      };
    } catch {
      return { verified: false, disputed: false, evidence: [] };
    }
  }

  private analyzeClaim(_claim: string, content: string): {
    status: 'verified' | 'unverified' | 'disputed';
    confidence: number;
    evidence: string[];
    sources: string[];
    reasoning: string;
  } {
    const contentLower = content.toLowerCase();

    const supportivePhrases = ['confirmed', 'verified', 'true', 'correct', 'according to', 'stated'];
    const contradictoryPhrases = ['false', 'disputed', 'unproven', 'denied', 'incorrect', 'myth'];

    const supportive = supportivePhrases.filter(p => contentLower.includes(p)).length;
    const contradictory = contradictoryPhrases.filter(p => contentLower.includes(p)).length;

    if (supportive > contradictory && supportive >= 2) {
      return {
        status: 'verified',
        confidence: 0.8,
        evidence: [content.substring(0, 500)],
        sources: this.extractUrls(content),
        reasoning: `Found ${supportive} supporting sources`
      };
    }

    if (contradictory > supportive) {
      return {
        status: 'disputed',
        confidence: 0.7,
        evidence: [content.substring(0, 500)],
        sources: this.extractUrls(content),
        reasoning: `Found contradictory evidence`
      };
    }

    return {
      status: 'unverified',
      confidence: 0.4,
      evidence: [content.substring(0, 500)],
      sources: this.extractUrls(content),
      reasoning: 'Insufficient evidence to verify'
    };
  }

  private extractUrls(content: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return content.match(urlRegex)?.slice(0, 3) || [];
  }

  private generateReasoning(agree: number, disagree: number, total: number): string {
    if (agree === total) return 'All sources confirm the claim';
    if (disagree > agree) return 'Multiple sources contradict the claim';
    if (agree > 0) return `${agree} of ${total} sources support the claim`;
    return 'Unable to verify claim with available sources';
  }
}
