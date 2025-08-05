/**
 * Agent Coordinator - Orchestrates multi-agent research workflows
 */

import { ResearchAgent } from './research-agent';
import { WritingAgent } from './writing-agent';
import { ReflectionAgent } from './reflection-agent';
import { researchService } from '@/lib/services/research-service';
import { getWebSocketServer } from '@/lib/websocket-server';

export class AgentCoordinator {
  private researchAgent: ResearchAgent;
  private writingAgent: WritingAgent;
  private reflectionAgent: ReflectionAgent;

  constructor() {
    this.researchAgent = new ResearchAgent();
    this.writingAgent = new WritingAgent();
    this.reflectionAgent = new ReflectionAgent();
  }

  /**
   * Execute a complete research workflow
   */
  async executeResearchWorkflow(missionId: string, query: string, documentIds: string[]): Promise<any> {
    const wsServer = getWebSocketServer();
    
    try {
      // Phase 1: Research with reflection loops
      const researchResult = await this.executeResearchPhase(missionId, query, documentIds);
      
      // Phase 2: Writing with reflection loops
      const writingResult = await this.executeWritingPhase(missionId, researchResult);
      
      // Return complete workflow result
      return {
        missionId,
        query,
        researchResult,
        writingResult,
        totalExecutionTime: researchResult.executionTime + writingResult.executionTime,
        success: true
      };
      
    } catch (error) {
      console.error('Research workflow failed:', error);
      
      // Notify about failure
      if (wsServer) {
        wsServer.sendMissionUpdate('system', missionId, {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      throw error;
    }
  }

  /**
   * Execute research phase with reflection loops
   */
  private async executeResearchPhase(missionId: string, query: string, documentIds: string[]): Promise<any> {
    const wsServer = getWebSocketServer();
    const startTime = Date.now();
    let findings = [];
    let reflectionCount = 0;
    const maxReflections = 3;

    // Notify about research start
    if (wsServer) {
      wsServer.sendMissionUpdate('system', missionId, {
        phase: 'research',
        status: 'STARTED',
        message: 'Starting research phase...'
      });
    }

    while (reflectionCount < maxReflections) {
      try {
        // Execute research
        const researchExecution = await researchService.createAgentExecution(
          missionId,
          'RESEARCH',
          {
            action: 'execute_research',
            query,
            documentIds,
            iteration: reflectionCount + 1,
            previousFindings: findings
          }
        );

        await researchService.updateAgentExecution(researchExecution.id, 'RUNNING');

        if (wsServer) {
          wsServer.sendAgentUpdate('system', missionId, researchExecution.id, {
            status: 'RUNNING',
            message: `Research iteration ${reflectionCount + 1}`
          });
        }

        // Execute research agent
        const researchResult = await this.researchAgent.executeResearch(query, documentIds);
        findings = [...findings, ...researchResult.findings];

        await researchService.updateAgentExecution(
          researchExecution.id,
          'COMPLETED',
          researchResult,
          (Date.now() - startTime) / 1000
        );

        if (wsServer) {
          wsServer.sendAgentUpdate('system', missionId, researchExecution.id, {
            status: 'COMPLETED',
            result: researchResult
          });
        }

        // Reflection phase
        const reflectionExecution = await researchService.createAgentExecution(
          missionId,
          'REFLECTION',
          {
            action: 'reflect_on_research',
            findings,
            query,
            iteration: reflectionCount + 1
          }
        );

        await researchService.updateAgentExecution(reflectionExecution.id, 'RUNNING');

        if (wsServer) {
          wsServer.sendAgentUpdate('system', missionId, reflectionExecution.id, {
            status: 'RUNNING',
            message: `Reflection iteration ${reflectionCount + 1}`
          });
        }

        // Execute reflection agent
        const reflectionResult = await this.reflectionAgent.reflectOnResearch(findings, query);

        await researchService.updateAgentExecution(
          reflectionExecution.id,
          'COMPLETED',
          reflectionResult,
          (Date.now() - startTime) / 1000
        );

        if (wsServer) {
          wsServer.sendAgentUpdate('system', missionId, reflectionExecution.id, {
            status: 'COMPLETED',
            result: reflectionResult
          });
        }

        // Check if we need more research
        if (reflectionResult.needsImprovement && reflectionCount < maxReflections - 1) {
          // Update query based on reflection feedback
          query = this.updateQueryBasedOnFeedback(query, reflectionResult.suggestions);
          reflectionCount++;
          
          if (wsServer) {
            wsServer.sendMissionUpdate('system', missionId, {
              phase: 'research',
              status: 'CONTINUING',
              message: `Continuing research based on reflection feedback (iteration ${reflectionCount + 1})`,
              suggestions: reflectionResult.suggestions
            });
          }
        } else {
          break; // Research is complete
        }

      } catch (error) {
        console.error('Research iteration failed:', error);
        throw error;
      }
    }

    const executionTime = (Date.now() - startTime) / 1000;

    if (wsServer) {
      wsServer.sendMissionUpdate('system', missionId, {
        phase: 'research',
        status: 'COMPLETED',
        executionTime,
        findingsCount: findings.length,
        message: 'Research phase completed successfully'
      });
    }

    return {
      findings,
      executionTime,
      iterations: reflectionCount + 1
    };
  }

  /**
   * Execute writing phase with reflection loops
   */
  private async executeWritingPhase(missionId: string, researchResult: any): Promise<any> {
    const wsServer = getWebSocketServer();
    const startTime = Date.now();
    let currentContent = '';
    let reflectionCount = 0;
    const maxReflections = 2;

    // Notify about writing start
    if (wsServer) {
      wsServer.sendMissionUpdate('system', missionId, {
        phase: 'writing',
        status: 'STARTED',
        message: 'Starting writing phase...'
      });
    }

    while (reflectionCount < maxReflections) {
      try {
        // Execute writing
        const writingExecution = await researchService.createAgentExecution(
          missionId,
          'WRITING',
          {
            action: 'write_report',
            findings: researchResult.findings,
            previousContent: currentContent,
            iteration: reflectionCount + 1
          }
        );

        await researchService.updateAgentExecution(writingExecution.id, 'RUNNING');

        if (wsServer) {
          wsServer.sendAgentUpdate('system', missionId, writingExecution.id, {
            status: 'RUNNING',
            message: `Writing iteration ${reflectionCount + 1}`
          });
        }

        // Execute writing agent
        const writingResult = await this.writingAgent.writeReport(
          'Research Report',
          researchResult.findings,
          ['Introduction', 'Findings', 'Analysis', 'Conclusion'],
          'academic'
        );

        currentContent = writingResult.content;

        await researchService.updateAgentExecution(
          writingExecution.id,
          'COMPLETED',
          writingResult,
          (Date.now() - startTime) / 1000
        );

        if (wsServer) {
          wsServer.sendAgentUpdate('system', missionId, writingExecution.id, {
            status: 'COMPLETED',
            result: writingResult
          });
        }

        // Reflection phase
        const reflectionExecution = await researchService.createAgentExecution(
          missionId,
          'REFLECTION',
          {
            action: 'reflect_on_writing',
            content: currentContent,
            iteration: reflectionCount + 1
          }
        );

        await researchService.updateAgentExecution(reflectionExecution.id, 'RUNNING');

        if (wsServer) {
          wsServer.sendAgentUpdate('system', missionId, reflectionExecution.id, {
            status: 'RUNNING',
            message: `Writing reflection iteration ${reflectionCount + 1}`
          });
        }

        // Execute reflection agent
        const reflectionResult = await this.reflectionAgent.reflectOnWriting(currentContent);

        await researchService.updateAgentExecution(
          reflectionExecution.id,
          'COMPLETED',
          reflectionResult,
          (Date.now() - startTime) / 1000
        );

        if (wsServer) {
          wsServer.sendAgentUpdate('system', missionId, reflectionExecution.id, {
            status: 'COMPLETED',
            result: reflectionResult
          });
        }

        // Check if we need more writing refinement
        if (reflectionResult.needsRevision && reflectionCount < maxReflections - 1) {
          // Refine content based on reflection feedback
          const refinementResult = await this.writingAgent.refineReport(currentContent, reflectionResult.critique);
          currentContent = refinementResult.refinedContent;
          reflectionCount++;
          
          if (wsServer) {
            wsServer.sendMissionUpdate('system', missionId, {
              phase: 'writing',
              status: 'REFINING',
              message: `Refining writing based on feedback (iteration ${reflectionCount + 1})`,
              improvements: refinementResult.improvements
            });
          }
        } else {
          break; // Writing is complete
        }

      } catch (error) {
        console.error('Writing iteration failed:', error);
        throw error;
      }
    }

    const executionTime = (Date.now() - startTime) / 1000;

    if (wsServer) {
      wsServer.sendMissionUpdate('system', missionId, {
        phase: 'writing',
        status: 'COMPLETED',
        executionTime,
        contentLength: currentContent.length,
        message: 'Writing phase completed successfully'
      });
    }

    return {
      content: currentContent,
      executionTime,
      iterations: reflectionCount + 1
    };
  }

  /**
   * Update research query based on reflection feedback
   */
  private updateQueryBasedOnFeedback(query: string, suggestions: string[]): string {
    // Simple query enhancement based on suggestions
    let enhancedQuery = query;
    
    if (suggestions.some(s => s.includes('recent'))) {
      enhancedQuery += ' (focus on recent developments)';
    }
    
    if (suggestions.some(s => s.includes('quantitative'))) {
      enhancedQuery += ' (include quantitative analysis)';
    }
    
    if (suggestions.some(s => s.includes('alternative'))) {
      enhancedQuery += ' (consider multiple perspectives)';
    }
    
    return enhancedQuery;
  }

  /**
   * Optimize all agent prompts
   */
  async optimizeAllAgents(): Promise<void> {
    console.log('Starting prompt optimization for all agents...');
    
    try {
      // Optimize each agent in parallel
      await Promise.all([
        this.researchAgent.optimizePrompts(),
        this.writingAgent.optimizePrompts(),
        this.reflectionAgent.optimizePrompts()
      ]);
      
      console.log('All agent prompts optimized successfully');
    } catch (error) {
      console.error('Agent optimization failed:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics for all agents
   */
  getAllAgentMetrics() {
    return {
      research: this.researchAgent.getPerformanceMetrics(),
      writing: this.writingAgent.getPerformanceMetrics(),
      reflection: this.reflectionAgent.getPerformanceMetrics()
    };
  }
}