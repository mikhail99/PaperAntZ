/**
 * Research Service - Handles research mission management and execution
 */

import { db } from '@/lib/db';
import { 
  ResearchMission, 
  AgentExecution, 
  ResearchReport, 
  DocumentGroup,
  AgentType,
  ExecutionStatus,
  MissionStatus,
  MissionConfig 
} from '@/lib/types';

export class ResearchService {
  /**
   * Create a new research mission
   */
  async createMission(
    userId: string, 
    title: string, 
    description?: string, 
    config?: MissionConfig
  ): Promise<ResearchMission> {
    const mission = await db.researchMission.create({
      data: {
        title,
        description,
        userId,
        config: config || {},
        status: MissionStatus.CREATED,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        }
      }
    });

    return mission as ResearchMission;
  }

  /**
   * Get a research mission by ID
   */
  async getMission(missionId: string): Promise<ResearchMission | null> {
    const mission = await db.researchMission.findUnique({
      where: { id: missionId },
      include: {
        user: true,
        agentExecutions: {
          orderBy: { createdAt: 'desc' }
        },
        researchReports: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        documentGroups: {
          include: {
            documents: true
          }
        }
      }
    });

    return mission as ResearchMission | null;
  }

  /**
   * Get all missions for a user
   */
  async getUserMissions(
    userId: string, 
    page: number = 1, 
    pageSize: number = 10
  ): Promise<{ missions: ResearchMission[], total: number }> {
    const skip = (page - 1) * pageSize;
    
    const [missions, total] = await Promise.all([
      db.researchMission.findMany({
        where: { userId },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          agentExecutions: {
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          researchReports: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      }),
      db.researchMission.count({
        where: { userId }
      })
    ]);

    return {
      missions: missions as ResearchMission[],
      total
    };
  }

  /**
   * Update mission status
   */
  async updateMissionStatus(
    missionId: string, 
    status: MissionStatus
  ): Promise<ResearchMission> {
    const updateData: any = { status };
    
    if (status === MissionStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    const mission = await db.researchMission.update({
      where: { id: missionId },
      data: updateData,
      include: {
        user: true,
        agentExecutions: true,
        researchReports: true
      }
    });

    return mission as ResearchMission;
  }

  /**
   * Create an agent execution
   */
  async createAgentExecution(
    missionId: string,
    agentType: AgentType,
    inputData: any
  ): Promise<AgentExecution> {
    const execution = await db.agentExecution.create({
      data: {
        missionId,
        agentType,
        status: ExecutionStatus.PENDING,
        input_data: inputData,
      }
    });

    return execution as AgentExecution;
  }

  /**
   * Update agent execution status and result
   */
  async updateAgentExecution(
    executionId: string,
    status: ExecutionStatus,
    outputData?: any,
    executionTime?: number,
    errorMessage?: string
  ): Promise<AgentExecution> {
    const execution = await db.agentExecution.update({
      where: { id: executionId },
      data: {
        status,
        output_data: outputData,
        execution_time: executionTime,
        error_message: errorMessage,
      }
    });

    return execution as AgentExecution;
  }

  /**
   * Get agent executions for a mission
   */
  async getMissionExecutions(missionId: string): Promise<AgentExecution[]> {
    const executions = await db.agentExecution.findMany({
      where: { missionId },
      orderBy: { createdAt: 'desc' }
    });

    return executions as AgentExecution[];
  }

  /**
   * Create a research report
   */
  async createResearchReport(
    missionId: string,
    title: string,
    content: string,
    summary?: string,
    references?: any
  ): Promise<ResearchReport> {
    const report = await db.researchReport.create({
      data: {
        missionId,
        title,
        content,
        summary,
        references,
      }
    });

    return report as ResearchReport;
  }

  /**
   * Get the latest research report for a mission
   */
  async getLatestReport(missionId: string): Promise<ResearchReport | null> {
    const report = await db.researchReport.findFirst({
      where: { missionId },
      orderBy: { createdAt: 'desc' },
      include: {
        findings: true
      }
    });

    return report as ResearchReport | null;
  }

  /**
   * Execute a research mission (orchestrate the agent workflow)
   */
  async executeMission(missionId: string): Promise<void> {
    try {
      // Update mission status to planning
      await this.updateMissionStatus(missionId, MissionStatus.PLANNING);

      // Step 1: Planning Agent
      const planningResult = await this.executePlanningAgent(missionId);
      
      // Step 2: Research Agent (with reflection loops)
      await this.executeResearchAgent(missionId, planningResult);
      
      // Step 3: Writing Agent (with reflection loops)
      await this.executeWritingAgent(missionId);
      
      // Step 4: Complete mission
      await this.updateMissionStatus(missionId, MissionStatus.COMPLETED);
      
    } catch (error) {
      console.error('Mission execution failed:', error);
      await this.updateMissionStatus(missionId, MissionStatus.FAILED);
      throw error;
    }
  }

  /**
   * Execute the planning agent
   */
  private async executePlanningAgent(missionId: string): Promise<any> {
    const execution = await this.createAgentExecution(
      missionId,
      AgentType.PLANNING,
      { action: 'create_research_plan' }
    );

    await this.updateAgentExecution(execution.id, ExecutionStatus.RUNNING);

    try {
      // Simulate planning agent work
      // In a real implementation, this would use DSPy with optimized prompts
      const plan = {
        outline: [
          'Introduction',
          'Literature Review',
          'Methodology',
          'Analysis',
          'Results',
          'Discussion',
          'Conclusion'
        ],
        researchQuestions: [
          'What are the key findings in this area?',
          'What methodologies are commonly used?',
          'What are the current limitations?'
        ],
        estimatedDuration: '2-3 hours'
      };

      await this.updateAgentExecution(
        execution.id,
        ExecutionStatus.COMPLETED,
        plan,
        5.2 // execution time in seconds
      );

      return plan;
    } catch (error) {
      await this.updateAgentExecution(
        execution.id,
        ExecutionStatus.FAILED,
        undefined,
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  /**
   * Execute the research agent with reflection loops
   */
  private async executeResearchAgent(missionId: string, plan: any): Promise<any> {
    let findings = [];
    let reflectionCount = 0;
    const maxReflections = 3;

    while (reflectionCount < maxReflections) {
      const execution = await this.createAgentExecution(
        missionId,
        AgentType.RESEARCH,
        { 
          action: 'gather_information',
          plan,
          previousFindings: findings,
          iteration: reflectionCount + 1
        }
      );

      await this.updateAgentExecution(execution.id, ExecutionStatus.RUNNING);

      try {
        // Simulate research agent work
        const researchResult = {
          findings: [
            {
              content: 'Key finding from research iteration ' + (reflectionCount + 1),
              sources: ['Document 1', 'Document 2'],
              confidence: 0.8 + (reflectionCount * 0.05)
            }
          ],
          gaps: reflectionCount < 2 ? ['More specific data needed'] : []
        };

        findings.push(...researchResult.findings);

        await this.updateAgentExecution(
          execution.id,
          ExecutionStatus.COMPLETED,
          researchResult,
          8.5
        );

        // Reflection step
        if (researchResult.gaps.length > 0) {
          const reflectionExecution = await this.createAgentExecution(
            missionId,
            AgentType.REFLECTION,
            {
              action: 'reflect_on_research',
              findings: findings,
              gaps: researchResult.gaps
            }
          );

          await this.updateAgentExecution(reflectionExecution.id, ExecutionStatus.RUNNING);

          const reflectionResult = {
            feedback: 'Research needs more specific information',
            suggestions: ['Focus on quantitative data', 'Include more recent sources'],
            confidence: 0.7
          };

          await this.updateAgentExecution(
            reflectionExecution.id,
            ExecutionStatus.COMPLETED,
            reflectionResult,
            3.2
          );

          reflectionCount++;
        } else {
          break; // No gaps found, research is complete
        }
      } catch (error) {
        await this.updateAgentExecution(
          execution.id,
          ExecutionStatus.FAILED,
          undefined,
          undefined,
          error instanceof Error ? error.message : 'Unknown error'
        );
        throw error;
      }
    }

    return { findings, iterations: reflectionCount + 1 };
  }

  /**
   * Execute the writing agent with reflection loops
   */
  private async executeWritingAgent(missionId: string): Promise<any> {
    let draft = '';
    let reflectionCount = 0;
    const maxReflections = 2;

    while (reflectionCount < maxReflections) {
      const execution = await this.createAgentExecution(
        missionId,
        AgentType.WRITING,
        { 
          action: 'write_report',
          previousDraft: draft,
          iteration: reflectionCount + 1
        }
      );

      await this.updateAgentExecution(execution.id, ExecutionStatus.RUNNING);

      try {
        // Simulate writing agent work
        const currentDraft = draft || `# Research Report\n\n## Introduction\nThis is the initial draft...`;
        const improvedDraft = currentDraft + `\n\n## Section ${reflectionCount + 1}\nImproved content based on reflection...`;

        await this.updateAgentExecution(
          execution.id,
          ExecutionStatus.COMPLETED,
          { draft: improvedDraft },
          12.3
        );

        // Reflection step
        const reflectionExecution = await this.createAgentExecution(
          missionId,
          AgentType.REFLECTION,
          {
            action: 'reflect_on_writing',
            draft: improvedDraft
          }
        );

        await this.updateAgentExecution(reflectionExecution.id, ExecutionStatus.RUNNING);

        const reflectionResult = {
          feedback: reflectionCount === 0 ? 'Good structure, needs more analysis' : 'Well-written and comprehensive',
          suggestions: reflectionCount === 0 ? ['Add deeper analysis', 'Include more examples'] : [],
          quality: 0.6 + (reflectionCount * 0.2)
        };

        await this.updateAgentExecution(
          reflectionExecution.id,
          ExecutionStatus.COMPLETED,
          reflectionResult,
          4.1
        );

        draft = improvedDraft;
        reflectionCount++;

        if (reflectionResult.suggestions.length === 0) {
          break; // No more suggestions, writing is complete
        }
      } catch (error) {
        await this.updateAgentExecution(
          execution.id,
          ExecutionStatus.FAILED,
          undefined,
          undefined,
          error instanceof Error ? error.message : 'Unknown error'
        );
        throw error;
      }
    }

    // Create final research report
    await this.createResearchReport(
      missionId,
      'Research Report',
      draft,
      'Comprehensive research analysis with findings and conclusions'
    );

    return { finalDraft: draft, iterations: reflectionCount + 1 };
  }
}

export const researchService = new ResearchService();