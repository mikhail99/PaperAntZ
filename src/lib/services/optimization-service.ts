/**
 * Optimization Service - Handles prompt optimization using GEPA
 */

import { db } from '@/lib/db';
import { 
  OptimizationSession,
  PromptParameter,
  GEPAConfig,
  OptimizationStatus,
  ParameterState,
  GenerationStats
} from '@/lib/types';

export class OptimizationService {
  /**
   * Create a new optimization session
   */
  async createOptimizationSession(
    userId: string,
    moduleId: string,
    config: GEPAConfig,
    promptParameterIds: string[]
  ): Promise<OptimizationSession> {
    const session = await db.optimizationSession.create({
      data: {
        userId,
        moduleId,
        config,
        status: OptimizationStatus.CREATED,
        populationSize: config.populationSize,
        generationsCompleted: 0,
        currentGeneration: 0,
        optimizationHistory: []
      }
    });

    // Link prompt parameters to the session
    for (const paramId of promptParameterIds) {
      const param = await db.promptParameter.findUnique({
        where: { id: paramId }
      });

      if (param) {
        await db.optimizationSessionPromptParameter.create({
          data: {
            optimizationSessionId: session.id,
            promptParameterId: paramId,
            initialPrompt: param.value
          }
        });
      }
    }

    return session as OptimizationSession;
  }

  /**
   * Get an optimization session by ID
   */
  async getOptimizationSession(sessionId: string): Promise<OptimizationSession | null> {
    const session = await db.optimizationSession.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        promptParameters: {
          include: {
            promptParameter: true
          }
        }
      }
    });

    if (!session) return null;

    return {
      ...session,
      config: session.config as GEPAConfig,
      optimizationHistory: session.optimizationHistory as GenerationStats[]
    } as OptimizationSession;
  }

  /**
   * Get all optimization sessions for a user
   */
  async getUserOptimizationSessions(
    userId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ sessions: OptimizationSession[], total: number }> {
    const skip = (page - 1) * pageSize;

    const [sessions, total] = await Promise.all([
      db.optimizationSession.findMany({
        where: { userId },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          promptParameters: {
            include: {
              promptParameter: true
            }
          }
        }
      }),
      db.optimizationSession.count({
        where: { userId }
      })
    ]);

    const formattedSessions = sessions.map(session => ({
      ...session,
      config: session.config as GEPAConfig,
      optimizationHistory: session.optimizationHistory as GenerationStats[]
    })) as OptimizationSession[];

    return {
      sessions: formattedSessions,
      total
    };
  }

  /**
   * Update optimization session status
   */
  async updateOptimizationSessionStatus(
    sessionId: string,
    status: OptimizationStatus,
    bestFitness?: number,
    generationsCompleted?: number,
    currentGeneration?: number
  ): Promise<OptimizationSession> {
    const updateData: any = { status };
    
    if (bestFitness !== undefined) updateData.bestFitness = bestFitness;
    if (generationsCompleted !== undefined) updateData.generationsCompleted = generationsCompleted;
    if (currentGeneration !== undefined) updateData.currentGeneration = currentGeneration;
    
    if (status === OptimizationStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    const session = await db.optimizationSession.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        user: true,
        promptParameters: {
          include: {
            promptParameter: true
          }
        }
      }
    });

    return {
      ...session,
      config: session.config as GEPAConfig,
      optimizationHistory: session.optimizationHistory as GenerationStats[]
    } as OptimizationSession;
  }

  /**
   * Add generation statistics to optimization history
   */
  async addGenerationStats(
    sessionId: string,
    generationStats: GenerationStats
  ): Promise<void> {
    const session = await db.optimizationSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) throw new Error('Optimization session not found');

    const history = (session.optimizationHistory as any[]) || [];
    history.push(generationStats);

    await db.optimizationSession.update({
      where: { id: sessionId },
      data: {
        optimizationHistory: history
      }
    });
  }

  /**
   * Get prompt parameters for optimization
   */
  async getOptimizableParameters(): Promise<PromptParameter[]> {
    const parameters = await db.promptParameter.findMany({
      where: {
        state: ParameterState.ACTIVE
      },
      orderBy: { createdAt: 'desc' }
    });

    return parameters as PromptParameter[];
  }

  /**
   * Get a prompt parameter by ID
   */
  async getPromptParameter(parameterId: string): Promise<PromptParameter | null> {
    const parameter = await db.promptParameter.findUnique({
      where: { id: parameterId }
    });

    if (!parameter) return null;

    return {
      ...parameter,
      optimizationHistory: parameter.optimizationHistory as any[],
      performanceMetrics: parameter.performanceMetrics as any
    } as PromptParameter;
  }

  /**
   * Update a prompt parameter
   */
  async updatePromptParameter(
    parameterId: string,
    updates: {
      value?: string;
      state?: ParameterState;
      performanceMetrics?: any;
      optimizationHistory?: any[];
    }
  ): Promise<PromptParameter> {
    const parameter = await db.promptParameter.update({
      where: { id: parameterId },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });

    return {
      ...parameter,
      optimizationHistory: parameter.optimizationHistory as any[],
      performanceMetrics: parameter.performanceMetrics as any
    } as PromptParameter;
  }

  /**
   * Execute optimization session (run GEPA optimization)
   */
  async executeOptimization(sessionId: string): Promise<void> {
    try {
      // Get session details
      const session = await this.getOptimizationSession(sessionId);
      if (!session) throw new Error('Optimization session not found');

      // Update status to running
      await this.updateOptimizationSessionStatus(
        sessionId,
        OptimizationStatus.RUNNING
      );

      const config = session.config as GEPAConfig;
      let bestFitness = -Infinity;
      const optimizationHistory: GenerationStats[] = [];

      // Optimization loop
      for (let generation = 0; generation < config.generations; generation++) {
        console.log(`Running generation ${generation + 1}/${config.generations}`);

        // Simulate population evaluation
        const populationFitness = this.simulatePopulationEvaluation(config.populationSize);
        
        // Calculate statistics
        const currentBestFitness = Math.max(...populationFitness);
        const avgFitness = populationFitness.reduce((a, b) => a + b, 0) / populationFitness.length;

        // Update best fitness
        if (currentBestFitness > bestFitness) {
          bestFitness = currentBestFitness;
        }

        // Record generation stats
        const generationStats: GenerationStats = {
          generation,
          bestFitness: currentBestFitness,
          avgFitness,
          populationSize: config.populationSize
        };

        optimizationHistory.push(generationStats);
        await this.addGenerationStats(sessionId, generationStats);

        // Update session progress
        await this.updateOptimizationSessionStatus(
          sessionId,
          OptimizationStatus.RUNNING,
          bestFitness,
          generation + 1,
          generation + 1
        );

        // Check convergence (simplified)
        if (generation > 0 && Math.abs(currentBestFitness - bestFitness) < config.convergenceThreshold) {
          console.log('Convergence reached');
          break;
        }

        // Simulate delay between generations
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Update final prompt parameters with best results
      await this.updateOptimizedParameters(sessionId, bestFitness);

      // Mark session as completed
      await this.updateOptimizationSessionStatus(
        sessionId,
        OptimizationStatus.COMPLETED,
        bestFitness,
        config.generations,
        config.generations
      );

    } catch (error) {
      console.error('Optimization execution failed:', error);
      await this.updateOptimizationSessionStatus(
        sessionId,
        OptimizationStatus.FAILED
      );
      throw error;
    }
  }

  /**
   * Simulate population evaluation for demo purposes
   */
  private simulatePopulationEvaluation(populationSize: number): number[] {
    // In a real implementation, this would run the actual GEPA optimization
    // For now, we'll simulate fitness scores with some improvement over time
    const baseFitness = 0.5 + Math.random() * 0.3;
    const improvement = Math.random() * 0.1;
    
    return Array.from({ length: populationSize }, () => 
      Math.min(0.95, baseFitness + improvement + Math.random() * 0.1)
    );
  }

  /**
   * Update optimized parameters with final results
   */
  private async updateOptimizedParameters(sessionId: string, bestFitness: number): Promise<void> {
    const session = await this.getOptimizationSession(sessionId);
    if (!session) return;

    for (const sessionParam of session.promptParameters || []) {
      const param = sessionParam.promptParameter;
      if (!param) continue;

      // Simulate prompt improvement
      const improvedPrompt = this.improvePrompt(param.value, bestFitness);
      
      // Update the parameter
      await this.updatePromptParameter(param.id, {
        value: improvedPrompt,
        performanceMetrics: {
          ...param.performanceMetrics,
          accuracy: bestFitness,
          relevance: bestFitness * 0.9
        }
      });

      // Update session parameter link
      await db.optimizationSessionPromptParameter.update({
        where: { 
          id: sessionParam.id 
        },
        data: {
          finalPrompt: improvedPrompt,
          fitnessImprovement: bestFitness - 0.5 // Assuming baseline of 0.5
        }
      });
    }
  }

  /**
   * Simulate prompt improvement based on fitness
   */
  private improvePrompt(originalPrompt: string, fitness: number): string {
    // In a real implementation, this would use the actual GEPA reflection model
    const improvements = [
      "Be more specific and detailed in your instructions.",
      "Include examples to clarify your expectations.",
      "Structure your response with clear headings.",
      "Focus on accuracy and provide evidence for claims.",
      "Consider multiple perspectives before concluding."
    ];

    const selectedImprovements = improvements
      .slice(0, Math.floor(fitness * improvements.length))
      .join(' ');

    return `${originalPrompt}\n\n${selectedImprovements}`;
  }

  /**
   * Get optimization statistics and analytics
   */
  async getOptimizationAnalytics(userId: string): Promise<{
    totalSessions: number;
    completedSessions: number;
    averageImprovement: number;
    bestPerformingParameters: PromptParameter[];
    recentActivity: OptimizationSession[];
  }> {
    const [
      totalSessions,
      completedSessions,
      allSessions,
      parameters
    ] = await Promise.all([
      db.optimizationSession.count({
        where: { userId }
      }),
      db.optimizationSession.count({
        where: { 
          userId,
          status: OptimizationStatus.COMPLETED 
        }
      }),
      db.optimizationSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          promptParameters: {
            include: {
              promptParameter: true
            }
          }
        }
      }),
      db.promptParameter.findMany({
        where: {
          state: ParameterState.ACTIVE
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
      })
    ]);

    // Calculate average improvement (simplified)
    const completedSessionData = await db.optimizationSession.findMany({
      where: { 
        userId,
        status: OptimizationStatus.COMPLETED 
      },
      select: { bestFitness: true }
    });

    const averageImprovement = completedSessionData.length > 0
      ? completedSessionData.reduce((sum, session) => sum + (session.bestFitness || 0), 0) / completedSessionData.length
      : 0;

    const recentActivity = allSessions.map(session => ({
      ...session,
      config: session.config as GEPAConfig,
      optimizationHistory: session.optimizationHistory as GenerationStats[]
    })) as OptimizationSession[];

    const bestPerformingParameters = parameters as PromptParameter[];

    return {
      totalSessions,
      completedSessions,
      averageImprovement,
      bestPerformingParameters,
      recentActivity
    };
  }
}

export const optimizationService = new OptimizationService();