/**
 * Mock-to-Real API Abstraction Layer
 * Provides easy switching between mock and real API implementations
 */

import { 
  apiClient, 
  type AgentCapability,
  type AgentExecutionRequest,
  type AgentExecutionResponse,
  type ExecutionStatusResponse,
  type WorkflowRequest,
  type WorkflowStatusResponse,
  type Document,
  type DocumentUploadResponse,
  type ChatMessage,
  type ChatSession,
  type OptimizationRequest,
  type OptimizationResult,
  type ApiResponse
} from './client';

// Service interface for dependency injection
export interface AgentService {
  getAgents(): Promise<ApiResponse<AgentCapability[]>>;
  executeAgent(agentId: string, request: AgentExecutionRequest): Promise<ApiResponse<AgentExecutionResponse>>;
  getExecutionStatus(executionId: string): Promise<ApiResponse<ExecutionStatusResponse>>;
  cancelExecution(executionId: string): Promise<ApiResponse<{ execution_id: string; status: string; cancelled_at: string }>>;
}

export interface WorkflowService {
  createWorkflow(request: WorkflowRequest): Promise<ApiResponse<{ workflow_id: string; status: string; websocket_url: string }>>;
  getWorkflowStatus(workflowId: string): Promise<ApiResponse<WorkflowStatusResponse>>;
}

export interface DocumentService {
  getDocuments(): Promise<ApiResponse<Document[]>>;
  getDocument(documentId: string): Promise<ApiResponse<Document>>;
  uploadDocument(file: File, metadata?: Record<string, any>): Promise<ApiResponse<DocumentUploadResponse>>;
}

export interface ChatService {
  createChatSession(agentId?: string, title?: string): Promise<ApiResponse<{ session_id: string; agent_id?: string; title: string }>>;
  sendMessage(sessionId: string, message: string, documentIds?: string[]): Promise<ApiResponse<ChatMessage>>;
  getChatMessages(sessionId: string): Promise<ApiResponse<{ messages: ChatMessage[] }>>;
}

export interface OptimizationService {
  startOptimization(request: OptimizationRequest): Promise<ApiResponse<any>>;
  getOptimizationStatus(optimizationId: string): Promise<ApiResponse<OptimizationResult>>;
}

// Mock implementations
class MockAgentService implements AgentService {
  async getAgents(): Promise<ApiResponse<AgentCapability[]>> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const mockAgents: AgentCapability[] = [
      {
        id: 'planning-agent',
        name: 'Planning Agent',
        description: 'Creates research plans and strategies',
        category: 'planning',
        capabilities: ['plan_creation', 'strategy_development', 'task_breakdown'],
        status: 'active',
        version: '1.0.0',
        configuration: {
          model: 'gpt-4',
          temperature: 0.7,
          max_tokens: 2000
        },
        performance_metrics: {
          total_executions: 150,
          average_execution_time: 2.5,
          success_rate: 0.95
        },
        prompt_templates: {
          planning: 'Create a comprehensive plan for: {task}',
          strategy: 'Develop a strategic approach to: {objective}'
        }
      },
      {
        id: 'research-agent',
        name: 'Research Agent',
        description: 'Conducts research and gathers information',
        category: 'research',
        capabilities: ['information_gathering', 'analysis', 'synthesis'],
        status: 'active',
        version: '1.0.0',
        configuration: {
          model: 'gpt-4',
          temperature: 0.5,
          max_tokens: 3000
        },
        performance_metrics: {
          total_executions: 320,
          average_execution_time: 4.2,
          success_rate: 0.92
        },
        prompt_templates: {
          research: 'Conduct thorough research on: {query}',
          analysis: 'Analyze the following information: {data}'
        }
      },
      {
        id: 'writing-agent',
        name: 'Writing Agent',
        description: 'Generates reports and content',
        category: 'writing',
        capabilities: ['report_generation', 'content_creation', 'editing'],
        status: 'active',
        version: '1.0.0',
        configuration: {
          model: 'gpt-4',
          temperature: 0.8,
          max_tokens: 4000
        },
        performance_metrics: {
          total_executions: 280,
          average_execution_time: 3.8,
          success_rate: 0.94
        },
        prompt_templates: {
          writing: 'Write a comprehensive report about: {topic}',
          editing: 'Edit and improve the following content: {content}'
        }
      },
      {
        id: 'review-agent',
        name: 'Review Agent',
        description: 'Reviews and evaluates content',
        category: 'review',
        capabilities: ['quality_assessment', 'critique', 'improvement_suggestions'],
        status: 'active',
        version: '1.0.0',
        configuration: {
          model: 'gpt-4',
          temperature: 0.3,
          max_tokens: 2500
        },
        performance_metrics: {
          total_executions: 195,
          average_execution_time: 2.1,
          success_rate: 0.97
        },
        prompt_templates: {
          review: 'Review and evaluate the following content: {content}',
          critique: 'Provide constructive criticism for: {work}'
        }
      }
    ];

    return {
      success: true,
      data: mockAgents,
      message: 'Mock agents retrieved successfully'
    };
  }

  async executeAgent(agentId: string, request: AgentExecutionRequest): Promise<ApiResponse<AgentExecutionResponse>> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      data: {
        execution_id: executionId,
        agent_id: agentId,
        status: 'running',
        started_at: new Date().toISOString(),
        estimated_duration: Math.floor(Math.random() * 30) + 10,
        websocket_url: `ws://localhost:8000/ws/executions/${executionId}`
      },
      message: 'Agent execution started'
    };
  }

  async getExecutionStatus(executionId: string): Promise<ApiResponse<ExecutionStatusResponse>> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    const statuses = ['completed', 'running', 'failed'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    if (randomStatus === 'failed') {
      return {
        success: false,
        error: 'Mock execution failed'
      };
    }

    const response: ExecutionStatusResponse = {
      execution_id: executionId,
      agent_id: 'research-agent',
      status: randomStatus,
      started_at: new Date(Date.now() - 5000).toISOString(),
      duration: 5.0,
      result: randomStatus === 'completed' ? {
        output: `Mock research results for execution ${executionId}. This is a simulated response containing research findings and analysis.`,
        findings: [
          {
            topic: 'AI Impact on Healthcare',
            summary: 'Artificial Intelligence is transforming healthcare delivery through improved diagnostics and treatment planning.',
            sources: ['source_1', 'source_2']
          }
        ],
        metadata: {
          tokens_used: 1500,
          cost: 0.045
        }
      } : undefined,
      performance_metrics: {
        execution_time: 5.0,
        memory_usage: '512MB',
        cpu_usage: '45%',
        tokens_used: 1500,
        cost: 0.045
      }
    };

    if (randomStatus === 'completed') {
      response.completed_at = new Date().toISOString();
    }

    return {
      success: true,
      data: response,
      message: 'Execution status retrieved'
    };
  }

  async cancelExecution(executionId: string): Promise<ApiResponse<{ execution_id: string; status: string; cancelled_at: string }>> {
    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      success: true,
      data: {
        execution_id: executionId,
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      },
      message: 'Execution cancelled successfully'
    };
  }
}

class MockWorkflowService implements WorkflowService {
  async createWorkflow(request: WorkflowRequest): Promise<ApiResponse<{ workflow_id: string; status: string; websocket_url: string }>> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      data: {
        workflow_id: workflowId,
        status: 'running',
        websocket_url: `ws://localhost:8000/ws/workflows/${workflowId}`
      },
      message: 'Workflow created successfully'
    };
  }

  async getWorkflowStatus(workflowId: string): Promise<ApiResponse<WorkflowStatusResponse>> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const response: WorkflowStatusResponse = {
      workflow_id: workflowId,
      status: 'completed',
      started_at: new Date(Date.now() - 120000).toISOString(),
      completed_at: new Date().toISOString(),
      total_duration: 120,
      executions: [
        {
          execution_id: 'exec_1',
          agent_id: 'planning-agent',
          status: 'completed',
          result: {
            plan: 'Comprehensive research plan created successfully'
          }
        },
        {
          execution_id: 'exec_2',
          agent_id: 'research-agent',
          status: 'completed',
          result: {
            findings: 'Research completed with 15 relevant sources'
          }
        },
        {
          execution_id: 'exec_3',
          agent_id: 'writing-agent',
          status: 'completed',
          result: {
            report: 'Research report generated successfully'
          }
        },
        {
          execution_id: 'exec_4',
          agent_id: 'review-agent',
          status: 'completed',
          result: {
            review: 'Report reviewed and approved'
          }
        }
      ],
      final_result: {
        report: 'Final comprehensive research report generated through multi-agent collaboration',
        quality_score: 0.85,
        metadata: {
          total_tokens: 5000,
          total_cost: 0.15
        }
      }
    };

    return {
      success: true,
      data: response,
      message: 'Workflow status retrieved'
    };
  }
}

class MockDocumentService implements DocumentService {
  async getDocuments(): Promise<ApiResponse<Document[]>> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const mockDocuments: Document[] = [
      {
        id: 'doc_1',
        title: 'AI in Healthcare Research Paper',
        type: 'pdf',
        size: 2048576,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        content: 'This is a comprehensive research paper on artificial intelligence applications in healthcare...',
        metadata: {
          author: 'Dr. John Smith',
          pages: 15,
          word_count: 3500,
          extraction_confidence: 0.95
        }
      },
      {
        id: 'doc_2',
        title: 'Machine Learning in Medical Diagnosis',
        type: 'pdf',
        size: 1536000,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        content: 'An in-depth analysis of machine learning algorithms used in medical diagnosis...',
        metadata: {
          author: 'Dr. Sarah Johnson',
          pages: 12,
          word_count: 2800,
          extraction_confidence: 0.92
        }
      }
    ];

    return {
      success: true,
      data: mockDocuments,
      message: 'Documents retrieved successfully'
    };
  }

  async getDocument(documentId: string): Promise<ApiResponse<Document>> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const mockDocument: Document = {
      id: documentId,
      title: 'AI in Healthcare Research Paper',
      type: 'pdf',
      size: 2048576,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      content: 'This is a comprehensive research paper on artificial intelligence applications in healthcare. The paper explores various AI technologies and their impact on healthcare delivery, diagnostics, treatment planning, and patient outcomes. Key findings include improved diagnostic accuracy, reduced treatment costs, and enhanced patient care through AI-powered solutions.',
      metadata: {
        author: 'Dr. John Smith',
        pages: 15,
        word_count: 3500,
        extraction_confidence: 0.95
      }
    };

    return {
      success: true,
      data: mockDocument,
      message: 'Document retrieved successfully'
    };
  }

  async uploadDocument(file: File, metadata?: Record<string, any>): Promise<ApiResponse<DocumentUploadResponse>> {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      data: {
        document_id: documentId,
        title: file.name,
        status: 'processed',
        extracted_text: 'Extracted text content from the uploaded document...',
        metadata: {
          author: metadata?.author || 'Unknown',
          pages: Math.floor(Math.random() * 20) + 1,
          word_count: Math.floor(Math.random() * 5000) + 1000,
          extraction_confidence: 0.95
        }
      },
      message: 'Document uploaded and processed successfully'
    };
  }
}

class MockChatService implements ChatService {
  async createChatSession(agentId?: string, title?: string): Promise<ApiResponse<{ session_id: string; agent_id?: string; title: string }>> {
    await new Promise(resolve => setTimeout(resolve, 100));

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      data: {
        session_id: sessionId,
        agent_id: agentId,
        title: title || 'New Chat Session'
      },
      message: 'Chat session created successfully'
    };
  }

  async sendMessage(sessionId: string, message: string, documentIds?: string[]): Promise<ApiResponse<ChatMessage>> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockMessage: ChatMessage = {
      message_id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      session_id: sessionId,
      role: 'agent',
      content: `I understand you're asking about: "${message}". As an AI assistant, I can help you with this request. Let me provide you with a comprehensive response based on the available information and context.`,
      timestamp: new Date().toISOString(),
      agent_id: 'research-agent',
      document_context: documentIds?.map(id => ({
        id,
        title: `Document ${id}`,
        relevance_score: Math.random() * 0.5 + 0.5
      })) || []
    };

    return {
      success: true,
      data: mockMessage,
      message: 'Message sent and response received'
    };
  }

  async getChatMessages(sessionId: string): Promise<ApiResponse<{ messages: ChatMessage[] }>> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const mockMessages: ChatMessage[] = [
      {
        message_id: 'msg_1',
        session_id: sessionId,
        role: 'user',
        content: 'Hello, I need help with my research on AI in healthcare.',
        timestamp: new Date(Date.now() - 60000).toISOString()
      },
      {
        message_id: 'msg_2',
        session_id: sessionId,
        role: 'agent',
        content: 'I\'d be happy to help you with your research on AI in healthcare. This is a fascinating field with many applications. What specific aspect would you like to focus on?',
        timestamp: new Date(Date.now() - 55000).toISOString(),
        agent_id: 'research-agent'
      }
    ];

    return {
      success: true,
      data: {
        messages: mockMessages
      },
      message: 'Chat messages retrieved successfully'
    };
  }
}

class MockOptimizationService implements OptimizationService {
  async startOptimization(request: OptimizationRequest): Promise<ApiResponse<any>> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const optimizationId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      data: {
        optimization_id: optimizationId,
        agent_id: request.agent_id,
        status: 'running',
        started_at: new Date().toISOString(),
        config: request.config || {}
      },
      message: 'Optimization session started'
    };
  }

  async getOptimizationStatus(optimizationId: string): Promise<ApiResponse<OptimizationResult>> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response: OptimizationResult = {
      optimization_id: optimizationId,
      agent_id: 'research-agent',
      status: 'completed',
      started_at: new Date(Date.now() - 300000).toISOString(),
      completed_at: new Date().toISOString(),
      results: {
        best_prompt: 'Optimized prompt: Conduct comprehensive research on {query} with focus on recent developments and practical applications.',
        improvement_score: 0.25,
        generations_completed: 5,
        final_population: [
          {
            prompt: 'Conduct thorough research on: {query}',
            fitness_score: 0.75
          },
          {
            prompt: 'Research and analyze: {query}',
            fitness_score: 0.82
          },
          {
            prompt: 'Conduct comprehensive research on {query} with focus on recent developments and practical applications.',
            fitness_score: 0.95
          }
        ]
      }
    };

    return {
      success: true,
      data: response,
      message: 'Optimization status retrieved'
    };
  }
}

// Real implementations (delegates to apiClient)
class RealAgentService implements AgentService {
  async getAgents(): Promise<ApiResponse<AgentCapability[]>> {
    return apiClient.getAgents();
  }

  async executeAgent(agentId: string, request: AgentExecutionRequest): Promise<ApiResponse<AgentExecutionResponse>> {
    return apiClient.executeAgent(agentId, request);
  }

  async getExecutionStatus(executionId: string): Promise<ApiResponse<ExecutionStatusResponse>> {
    return apiClient.getExecutionStatus(executionId);
  }

  async cancelExecution(executionId: string): Promise<ApiResponse<{ execution_id: string; status: string; cancelled_at: string }>> {
    return apiClient.cancelExecution(executionId);
  }
}

class RealWorkflowService implements WorkflowService {
  async createWorkflow(request: WorkflowRequest): Promise<ApiResponse<{ workflow_id: string; status: string; websocket_url: string }>> {
    return apiClient.createWorkflow(request);
  }

  async getWorkflowStatus(workflowId: string): Promise<ApiResponse<WorkflowStatusResponse>> {
    return apiClient.getWorkflowStatus(workflowId);
  }
}

class RealDocumentService implements DocumentService {
  async getDocuments(): Promise<ApiResponse<Document[]>> {
    return apiClient.getDocuments();
  }

  async getDocument(documentId: string): Promise<ApiResponse<Document>> {
    return apiClient.getDocument(documentId);
  }

  async uploadDocument(file: File, metadata?: Record<string, any>): Promise<ApiResponse<DocumentUploadResponse>> {
    return apiClient.uploadDocument(file, metadata);
  }
}

class RealChatService implements ChatService {
  async createChatSession(agentId?: string, title?: string): Promise<ApiResponse<{ session_id: string; agent_id?: string; title: string }>> {
    return apiClient.createChatSession(agentId, title);
  }

  async sendMessage(sessionId: string, message: string, documentIds?: string[]): Promise<ApiResponse<ChatMessage>> {
    return apiClient.sendMessage(sessionId, message, documentIds);
  }

  async getChatMessages(sessionId: string): Promise<ApiResponse<{ messages: ChatMessage[] }>> {
    return apiClient.getChatMessages(sessionId);
  }
}

class RealOptimizationService implements OptimizationService {
  async startOptimization(request: OptimizationRequest): Promise<ApiResponse<any>> {
    return apiClient.startOptimization(request);
  }

  async getOptimizationStatus(optimizationId: string): Promise<ApiResponse<OptimizationResult>> {
    return apiClient.getOptimizationStatus(optimizationId);
  }
}

// Service factory
export class ServiceFactory {
  private static useMock: boolean = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

  static setUseMock(useMock: boolean) {
    this.useMock = useMock;
  }

  static createAgentService(): AgentService {
    return this.useMock ? new MockAgentService() : new RealAgentService();
  }

  static createWorkflowService(): WorkflowService {
    return this.useMock ? new MockWorkflowService() : new RealWorkflowService();
  }

  static createDocumentService(): DocumentService {
    return this.useMock ? new MockDocumentService() : new RealDocumentService();
  }

  static createChatService(): ChatService {
    return this.useMock ? new MockChatService() : new RealChatService();
  }

  static createOptimizationService(): OptimizationService {
    return this.useMock ? new MockOptimizationService() : new RealOptimizationService();
  }

  // Create all services as a single object for easy injection
  static createServices() {
    return {
      agent: this.createAgentService(),
      workflow: this.createWorkflowService(),
      document: this.createDocumentService(),
      chat: this.createChatService(),
      optimization: this.createOptimizationService()
    };
  }
}

// Default service instances
export const services = ServiceFactory.createServices();

// Export individual service creators for custom use
export {
  MockAgentService,
  MockWorkflowService,
  MockDocumentService,
  MockChatService,
  MockOptimizationService,
  RealAgentService,
  RealWorkflowService,
  RealDocumentService,
  RealChatService,
  RealOptimizationService
};