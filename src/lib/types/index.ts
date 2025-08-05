/**
 * Type definitions for the AI Research Assistant frontend
 */

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  RESEARCHER = 'RESEARCHER'
}

export interface ResearchMission {
  id: string;
  title: string;
  description?: string;
  status: MissionStatus;
  userId: string;
  config: MissionConfig;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface MissionConfig {
  documentGroupIds?: string[];
  optimizationEnabled?: boolean;
  maxIterations?: number;
  qualityThreshold?: number;
}

export enum MissionStatus {
  CREATED = 'CREATED',
  PLANNING = 'PLANNING',
  RESEARCHING = 'RESEARCHING',
  WRITING = 'WRITING',
  REVIEWING = 'REVIEWING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export interface AgentExecution {
  id: string;
  missionId: string;
  agentType: AgentType;
  status: ExecutionStatus;
  input_data: any;
  output_data?: any;
  execution_time?: number;
  error_message?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export enum AgentType {
  PLANNING = 'PLANNING',
  RESEARCH = 'RESEARCH',
  REFLECTION = 'REFLECTION',
  WRITING = 'WRITING',
  COORDINATION = 'COORDINATION'
}

export enum ExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export interface Document {
  id: string;
  title: string;
  content: string;
  source: string;
  fileType: string;
  fileSize: number;
  metadata?: any;
  embedding?: number[];
  relevanceScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentGroup {
  id: string;
  name: string;
  description?: string;
  missionId?: string;
  userId: string;
  category?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  documents?: Document[];
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  embedding?: number[];
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResearchReport {
  id: string;
  missionId: string;
  title: string;
  content: string;
  summary?: string;
  references?: any;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  findings?: ResearchFinding[];
}

export interface ResearchFinding {
  id: string;
  reportId: string;
  documentId?: string;
  content: string;
  relevanceScore: number;
  confidence: number;
  sourceExcerpts: string[];
  analysisNotes?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptParameter {
  id: string;
  name: string;
  value: string;
  modulePath: string;
  state: ParameterState;
  optimizationHistory: OptimizationRecord[];
  performanceMetrics: PerformanceMetrics;
  createdAt: Date;
  updatedAt: Date;
  metadata?: any;
}

export enum ParameterState {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  FROZEN = 'FROZEN',
  ARCHIVED = 'ARCHIVED'
}

export interface OptimizationRecord {
  parameterName: string;
  oldPrompt: string;
  newPrompt: string;
  performanceChange: number;
  timestamp: Date;
  optimizationMethod: string;
  metadata?: any;
}

export interface PerformanceMetrics {
  accuracy?: number;
  relevance?: number;
  completeness?: number;
  coherence?: number;
  efficiency?: number;
  userSatisfaction?: number;
  cost?: number;
  executionTime?: number;
  customMetrics?: Record<string, number>;
}

export interface OptimizationSession {
  id: string;
  userId: string;
  moduleId: string;
  config: GEPAConfig;
  status: OptimizationStatus;
  bestFitness?: number;
  generationsCompleted: number;
  currentGeneration: number;
  populationSize: number;
  optimizationHistory: GenerationStats[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface GEPAConfig {
  populationSize: number;
  generations: number;
  mutationRate: number;
  crossoverRate: number;
  tournamentSize: number;
  elitismCount: number;
  reflectionModel: string;
  maxPromptLength: number;
  budget: number;
  convergenceThreshold: number;
  maxIterations: number;
}

export enum OptimizationStatus {
  CREATED = 'CREATED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export interface GenerationStats {
  generation: number;
  bestFitness: number;
  avgFitness: number;
  populationSize: number;
}

// WebSocket Event Types
export interface WebSocketEvent {
  type: string;
  payload: any;
  timestamp: Date;
}

export interface MissionUpdateEvent {
  type: 'MISSION_CREATED' | 'MISSION_STATUS_UPDATE' | 'AGENT_EXECUTION_UPDATE' | 'MISSION_COMPLETED';
  missionId: string;
  data: any;
}

export interface OptimizationUpdateEvent {
  type: 'OPTIMIZATION_STARTED' | 'GENERATION_COMPLETED' | 'OPTIMIZATION_COMPLETED';
  sessionId: string;
  data: any;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Form Types
export interface CreateMissionForm {
  title: string;
  description?: string;
  documentGroupIds?: string[];
  config?: MissionConfig;
}

export interface UploadDocumentForm {
  file: File;
  title?: string;
  metadata?: any;
}

export interface CreateOptimizationSessionForm {
  moduleId: string;
  config: GEPAConfig;
  promptParameterIds: string[];
}

// UI Component Types
export interface ChartDataPoint {
  x: string | number | Date;
  y: number;
}

export interface ProgressStep {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp?: Date;
}