export interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  agentId?: string; // For agent-specific messages
  agentName?: string;
  documentContext?: DocumentContext[];
  metadata?: Record<string, any>;
}

export interface DocumentContext {
  id: string;
  title: string;
  excerpt: string;
  relevanceScore: number;
  documentType: 'research' | 'report' | 'finding' | 'reference';
}

export interface ChatSession {
  id: string;
  title: string;
  agentId?: string; // For agent-specific sessions
  agentName?: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  documentContexts: DocumentContext[];
  metadata?: Record<string, any>;
}

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  category: 'planning' | 'research' | 'analysis' | 'writing' | 'review';
  isActive: boolean;
}

export interface ChatInterfaceConfig {
  enableDocumentContext: boolean;
  maxMessageLength: number;
  maxHistoryLength: number;
  autoSaveInterval: number;
  enableVoiceInput: boolean;
  enableMarkdown: boolean;
  supportedDocumentTypes: string[];
}