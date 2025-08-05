/**
 * Simplified type definitions for the AI Research Assistant
 */

export interface ResearchMission {
  id: string;
  title: string;
  description?: string;
  status: MissionStatus;
  config?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export enum MissionStatus {
  CREATED = 'CREATED',
  PLANNING = 'PLANNING',
  RESEARCHING = 'RESEARCHING',
  WRITING = 'WRITING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface Document {
  id: string;
  title: string;
  content: string;
  source: string;
  fileType: string;
  fileSize: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptParameter {
  id: string;
  name: string;
  value: string;
  module: string;
  state: ParameterState;
  createdAt: Date;
  updatedAt: Date;
}

export enum ParameterState {
  ACTIVE = 'ACTIVE',
  FROZEN = 'FROZEN'
}

export interface OptimizationSession {
  id: string;
  moduleId: string;
  config?: string;
  status: OptimizationStatus;
  bestFitness?: number;
  generationsCompleted: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export enum OptimizationStatus {
  CREATED = 'CREATED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

// Simple GEPA Config
export interface GEPAConfig {
  populationSize: number;
  generations: number;
  mutationRate: number;
  crossoverRate: number;
}

// Mock data for development
export const mockMissions: ResearchMission[] = [
  {
    id: '1',
    title: 'AI Ethics in Healthcare',
    description: 'Exploring ethical implications of AI in medical diagnosis',
    status: MissionStatus.COMPLETED,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    title: 'Climate Change Impact Analysis',
    description: 'Comprehensive analysis of climate change effects',
    status: MissionStatus.RESEARCHING,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: '3',
    title: 'Future of Renewable Energy',
    description: 'Research on emerging renewable energy technologies',
    status: MissionStatus.PLANNING,
    createdAt: new Date(Date.now() - 10 * 60 * 1000),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000),
  },
];

export const mockDocuments: Document[] = [
  {
    id: '1',
    title: 'AI Ethics Guidelines',
    content: 'Ethical guidelines for AI development and deployment...',
    source: 'research-paper.pdf',
    fileType: 'pdf',
    fileSize: 1024000,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    title: 'Climate Change Report',
    content: 'Comprehensive report on global climate change...',
    source: 'climate-report.pdf',
    fileType: 'pdf',
    fileSize: 2048000,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
];

export const mockParameters: PromptParameter[] = [
  {
    id: '1',
    name: 'research_prompt',
    value: 'Analyze the following text and extract key insights...',
    module: 'ResearchAgent',
    state: ParameterState.ACTIVE,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    name: 'writing_prompt',
    value: 'Write a comprehensive report based on the research findings...',
    module: 'WritingAgent',
    state: ParameterState.ACTIVE,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    name: 'reflection_prompt',
    value: 'Critically analyze the following research output...',
    module: 'ReflectionAgent',
    state: ParameterState.FROZEN,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
];

export const mockOptimizations: OptimizationSession[] = [
  {
    id: '1',
    moduleId: 'research-agent',
    config: JSON.stringify({
      populationSize: 10,
      generations: 5,
      mutationRate: 0.3,
      crossoverRate: 0.7,
    }),
    status: OptimizationStatus.COMPLETED,
    bestFitness: 0.85,
    generationsCompleted: 5,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    id: '2',
    moduleId: 'writing-agent',
    config: JSON.stringify({
      populationSize: 8,
      generations: 4,
      mutationRate: 0.4,
      crossoverRate: 0.6,
    }),
    status: OptimizationStatus.RUNNING,
    bestFitness: 0.71,
    generationsCompleted: 2,
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000),
  },
];

// Current user (simplified - no authentication)
export const currentUser = {
  id: 'demo-user',
  name: 'Researcher',
  email: 'researcher@demo.com',
};