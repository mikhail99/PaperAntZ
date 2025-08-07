/**
 * API Client for AI Research Assistant Backend
 * Provides type-safe access to all backend endpoints
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  category: 'planning' | 'research' | 'writing' | 'review' | 'analysis';
  capabilities: string[];
  status: 'active' | 'inactive' | 'maintenance';
  version: string;
  configuration?: Record<string, any>;
  performance_metrics?: Record<string, any>;
  prompt_templates?: Record<string, string>;
}

export interface AgentExecutionRequest {
  task: string;
  context?: {
    documents?: string[];
    previous_results?: any;
    session_id?: string;
  };
  configuration?: {
    temperature?: number;
    max_tokens?: number;
    model?: string;
  };
}

export interface AgentExecutionResponse {
  execution_id: string;
  agent_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  estimated_duration?: number;
  websocket_url?: string;
}

export interface ExecutionResult {
  output: string;
  findings?: Array<{
    topic: string;
    summary: string;
    sources?: string[];
  }>;
  metadata?: {
    tokens_used?: number;
    cost?: number;
  };
}

export interface PerformanceMetrics {
  execution_time: number;
  memory_usage: string;
  cpu_usage: string;
  tokens_used?: number;
  cost?: number;
}

export interface ExecutionStatusResponse {
  execution_id: string;
  agent_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  duration?: number;
  result?: ExecutionResult;
  performance_metrics?: PerformanceMetrics;
}

export interface WorkflowStep {
  id: string;
  agent_id: string;
  task: string;
  depends_on: string[];
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  execution_id?: string;
}

export interface WorkflowRequest {
  name: string;
  description: string;
  agents: WorkflowStep[];
  context?: {
    documents?: string[];
    requirements?: {
      length?: string;
      style?: string;
    };
  };
}

export interface WorkflowStatusResponse {
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  total_duration?: number;
  executions: Array<{
    execution_id: string;
    agent_id: string;
    status: string;
    result?: any;
  }>;
  final_result?: {
    report?: string;
    quality_score?: number;
    metadata?: {
      total_tokens?: number;
      total_cost?: number;
    };
  };
}

export interface DocumentMetadata {
  author?: string;
  pages?: number;
  word_count?: number;
  extraction_confidence?: number;
}

export interface Document {
  id: string;
  title: string;
  type: string;
  size: number;
  created_at: string;
  content?: string;
  metadata: DocumentMetadata;
}

export interface DocumentUploadResponse {
  document_id: string;
  title: string;
  status: string;
  extracted_text?: string;
  metadata: DocumentMetadata;
}

export interface ChatMessage {
  message_id: string;
  session_id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  agent_id?: string;
  document_context?: Array<{
    id: string;
    title: string;
    relevance_score: number;
  }>;
}

export interface ChatSession {
  session_id: string;
  agent_id?: string;
  title: string;
  created_at: string;
  status: string;
  messages: ChatMessage[];
}

export interface OptimizationRequest {
  agent_id: string;
  optimization_type: 'prompt_optimization' | 'parameter_tuning';
  config?: {
    population_size?: number;
    generations?: number;
    mutation_rate?: number;
  };
}

export interface OptimizationResponse {
  optimization_id: string;
  agent_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  config: Record<string, any>;
}

export interface OptimizationResult {
  optimization_id: string;
  agent_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  results?: {
    best_prompt?: string;
    improvement_score?: number;
    generations_completed?: number;
    final_population?: Array<{
      prompt: string;
      fitness_score: number;
    }>;
  };
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1') {
    this.baseUrl = baseUrl;
  }

  // Authentication
  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private getHeaders(): Record<string, string> {
    const headers = { ...this.defaultHeaders };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<{
    status: string;
    timestamp: string;
    version: string;
    services: Record<string, string>;
  }>> {
    return this.request('/health');
  }

  // Agent Management
  async getAgents(): Promise<ApiResponse<AgentCapability[]>> {
    return this.request('/agents');
  }

  async getAgent(agentId: string): Promise<ApiResponse<AgentCapability>> {
    return this.request(`/agents/${agentId}`);
  }

  async executeAgent(
    agentId: string,
    request: AgentExecutionRequest
  ): Promise<ApiResponse<AgentExecutionResponse>> {
    return this.request(`/agents/${agentId}/execute`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getExecutionStatus(
    executionId: string
  ): Promise<ApiResponse<ExecutionStatusResponse>> {
    return this.request(`/executions/${executionId}`);
  }

  async cancelExecution(
    executionId: string
  ): Promise<ApiResponse<{ execution_id: string; status: string; cancelled_at: string }>> {
    return this.request(`/executions/${executionId}/cancel`, {
      method: 'POST',
    });
  }

  // Workflow Management
  async createWorkflow(
    request: WorkflowRequest
  ): Promise<ApiResponse<{ workflow_id: string; status: string; websocket_url: string }>> {
    return this.request('/orchestration/workflows', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getWorkflowStatus(
    workflowId: string
  ): Promise<ApiResponse<WorkflowStatusResponse>> {
    return this.request(`/orchestration/workflows/${workflowId}`);
  }

  // Document Management
  async getDocuments(): Promise<ApiResponse<Document[]>> {
    return this.request('/documents');
  }

  async getDocument(documentId: string): Promise<ApiResponse<Document>> {
    return this.request(`/documents/${documentId}`);
  }

  async uploadDocument(
    file: File,
    metadata?: Record<string, any>
  ): Promise<ApiResponse<DocumentUploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const response = await fetch(`${this.baseUrl}/documents/upload`, {
      method: 'POST',
      headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {},
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message,
    };
  }

  // Chat Management
  async createChatSession(
    agentId?: string,
    title?: string
  ): Promise<ApiResponse<{ session_id: string; agent_id?: string; title: string }>> {
    return this.request('/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ agent_id: agentId, title }),
    });
  }

  async sendMessage(
    sessionId: string,
    message: string,
    documentIds?: string[]
  ): Promise<ApiResponse<ChatMessage>> {
    return this.request(`/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        document_ids: documentIds,
      }),
    });
  }

  async getChatMessages(
    sessionId: string
  ): Promise<ApiResponse<{ messages: ChatMessage[] }>> {
    return this.request(`/chat/sessions/${sessionId}/messages`);
  }

  // Optimization Management
  async startOptimization(
    request: OptimizationRequest
  ): Promise<ApiResponse<OptimizationResponse>> {
    return this.request('/optimization/sessions', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getOptimizationStatus(
    optimizationId: string
  ): Promise<ApiResponse<OptimizationResult>> {
    return this.request(`/optimization/sessions/${optimizationId}`);
  }

  // WebSocket connection helper
  createWebSocketConnection(url: string): WebSocket {
    const fullUrl = url.startsWith('ws://') || url.startsWith('wss://') 
      ? url 
      : `${this.baseUrl.replace('http', 'ws')}${url}`;
    
    return new WebSocket(fullUrl);
  }
}

// Singleton instance
export const apiClient = new ApiClient();

// Export types for use in components
export type {
  AgentCapability,
  AgentExecutionRequest,
  AgentExecutionResponse,
  ExecutionResult,
  PerformanceMetrics,
  ExecutionStatusResponse,
  WorkflowStep,
  WorkflowRequest,
  WorkflowStatusResponse,
  DocumentMetadata,
  Document,
  DocumentUploadResponse,
  ChatMessage,
  ChatSession,
  OptimizationRequest,
  OptimizationResponse,
  OptimizationResult,
};