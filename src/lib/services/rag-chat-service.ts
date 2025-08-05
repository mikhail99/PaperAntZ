/**
 * RAG Chat Service - Integrates RAG search with chat functionality
 */

import { ragService, SearchResult } from './rag-service';
import { documentService } from './document-service';
import { DocumentGroup } from '@/lib/types';

export interface RAGChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: {
    searchResults: SearchResult[];
    documentGroupId?: string;
    queryUsed?: string;
  };
}

export interface RAGChatSession {
  id: string;
  title: string;
  messages: RAGChatMessage[];
  documentGroupId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RAGChatOptions {
  documentGroupId?: string;
  maxContextResults?: number;
  relevanceThreshold?: number;
  includeSources?: boolean;
  searchType?: 'semantic' | 'hybrid';
}

export class RAGChatService {
  private sessions: Map<string, RAGChatSession> = new Map();
  private readonly defaultOptions: RAGChatOptions = {
    maxContextResults: 5,
    relevanceThreshold: 0.6,
    includeSources: true,
    searchType: 'hybrid'
  };

  /**
   * Create a new RAG chat session
   */
  createSession(
    title: string, 
    documentGroupId?: string, 
    options?: Partial<RAGChatOptions>
  ): RAGChatSession {
    const sessionId = this.generateSessionId();
    const session: RAGChatSession = {
      id: sessionId,
      title,
      messages: [],
      documentGroupId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.sessions.set(sessionId, session);
    this.saveSessionToStorage(sessionId);
    
    return session;
  }

  /**
   * Get a chat session by ID
   */
  getSession(sessionId: string): RAGChatSession | null {
    return this.sessions.get(sessionId) || this.loadSessionFromStorage(sessionId);
  }

  /**
   * Get all chat sessions
   */
  getAllSessions(): RAGChatSession[] {
    // Load all sessions from storage
    this.loadAllSessionsFromStorage();
    return Array.from(this.sessions.values()).sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  /**
   * Delete a chat session
   */
  deleteSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      localStorage.removeItem(`rag_chat_session_${sessionId}`);
    }
    return deleted;
  }

  /**
   * Send a message and get RAG-powered response
   */
  async sendMessage(
    sessionId: string, 
    message: string, 
    options?: Partial<RAGChatOptions>
  ): Promise<{ response: string; context?: SearchResult[] }> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Add user message
    const userMessage: RAGChatMessage = {
      id: this.generateMessageId(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    session.messages.push(userMessage);

    // Get RAG context
    const context = await this.getRAGContext(message, {
      ...this.defaultOptions,
      ...options,
      documentGroupId: options?.documentGroupId || session.documentGroupId
    });

    // Generate response using context
    const response = await this.generateResponse(message, context);

    // Add assistant message
    const assistantMessage: RAGChatMessage = {
      id: this.generateMessageId(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      context: {
        searchResults: context,
        documentGroupId: session.documentGroupId,
        queryUsed: message
      }
    };
    session.messages.push(assistantMessage);
    session.updatedAt = new Date();

    // Save session
    this.saveSessionToStorage(sessionId);

    return { response, context };
  }

  /**
   * Get RAG context for a query
   */
  private async getRAGContext(
    query: string, 
    options: RAGChatOptions
  ): Promise<SearchResult[]> {
    try {
      const searchOptions = {
        groupId: options.documentGroupId,
        limit: options.maxContextResults,
        threshold: options.relevanceThreshold
      };

      let results: SearchResult[];
      if (options.searchType === 'semantic') {
        results = await ragService.semanticSearch(query, searchOptions);
      } else {
        results = await ragService.hybridSearch(query, searchOptions);
      }

      return results;
    } catch (error) {
      console.error('Failed to get RAG context:', error);
      return [];
    }
  }

  /**
   * Generate response using RAG context
   */
  private async generateResponse(query: string, context: SearchResult[]): Promise<string> {
    if (context.length === 0) {
      return "I don't have any relevant information in the documents to answer your question. Try uploading more documents or rephrasing your question.";
    }

    // In a real implementation, this would use an LLM API
    // For now, we'll simulate a response based on the context
    
    const contextText = context
      .slice(0, 3) // Use top 3 results
      .map(result => result.chunk.content)
      .join('\n\n');

    // Simulate LLM response generation
    const response = this.simulateLLMResponse(query, contextText, context);

    return response;
  }

  /**
   * Simulate LLM response generation
   */
  private simulateLLMResponse(query: string, contextText: string, searchResults: SearchResult[]): string {
    // Simple response generation based on query patterns
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('summary') || lowerQuery.includes('summarize')) {
      return this.generateSummaryResponse(contextText, searchResults);
    } else if (lowerQuery.includes('what') || lowerQuery.includes('who') || lowerQuery.includes('when') || lowerQuery.includes('where')) {
      return this.generateFactualResponse(query, contextText, searchResults);
    } else if (lowerQuery.includes('how') || lowerQuery.includes('explain')) {
      return this.generateExplanatoryResponse(query, contextText, searchResults);
    } else if (lowerQuery.includes('compare') || lowerQuery.includes('difference')) {
      return this.generateComparativeResponse(query, contextText, searchResults);
    } else {
      return this.generateGeneralResponse(query, contextText, searchResults);
    }
  }

  private generateSummaryResponse(contextText: string, searchResults: SearchResult[]): string {
    const sources = searchResults.map(r => r.document.title).slice(0, 3);
    
    return `Based on the documents provided, here's a summary of the key information:\n\n${contextText.substring(0, 300)}...\n\nThis summary is derived from: ${sources.join(', ')}.`;
  }

  private generateFactualResponse(query: string, contextText: string, searchResults: SearchResult[]): string {
    const relevantChunk = searchResults[0];
    if (!relevantChunk) {
      return "I couldn't find specific information to answer your question in the available documents.";
    }

    return `Based on the document "${relevantChunk.document.title}":\n\n${relevantChunk.chunk.content.substring(0, 400)}...\n\nThis information appears most relevant to your question about "${query}".`;
  }

  private generateExplanatoryResponse(query: string, contextText: string, searchResults: SearchResult[]): string {
    const sources = searchResults.slice(0, 2).map(r => r.document.title);
    
    return `To explain "${query}", I found relevant information across multiple documents:\n\n${contextText.substring(0, 500)}...\n\nThis explanation is based on information from: ${sources.join(' and ')}.`;
  }

  private generateComparativeResponse(query: string, contextText: string, searchResults: SearchResult[]): string {
    if (searchResults.length < 2) {
      return "I need information from at least two documents to make a comparison. Currently, I only found relevant information in one document.";
    }

    const doc1 = searchResults[0];
    const doc2 = searchResults[1];

    return `Comparing information from the documents:\n\nFrom "${doc1.document.title}":\n${doc1.chunk.content.substring(0, 200)}...\n\nFrom "${doc2.document.title}":\n${doc2.chunk.content.substring(0, 200)}...\n\nThese documents provide different perspectives on your query.`;
  }

  private generateGeneralResponse(query: string, contextText: string, searchResults: SearchResult[]): string {
    const topResults = searchResults.slice(0, 3);
    const sources = topResults.map(r => r.document.title);
    
    let response = `I found relevant information in the documents regarding "${query}":\n\n`;
    
    topResults.forEach((result, index) => {
      response += `${index + 1}. From "${result.document.title}":\n${result.chunk.content.substring(0, 250)}...\n\n`;
    });

    response += `This information comes from: ${sources.join(', ')}.`;
    return response;
  }

  /**
   * Get document group info for session
   */
  async getDocumentGroupInfo(groupId?: string): Promise<{ name: string; documentCount: number } | null> {
    if (!groupId) return null;

    try {
      const group = await documentService.getDocumentGroup(groupId);
      if (!group) return null;

      return {
        name: group.name,
        documentCount: group.documents?.length || 0
      };
    } catch (error) {
      console.error('Failed to get document group info:', error);
      return null;
    }
  }

  /**
   * Get chat statistics
   */
  getChatStats(): {
    totalSessions: number;
    totalMessages: number;
    averageMessagesPerSession: number;
    sessionsWithDocumentGroup: number;
  } {
    const sessions = this.getAllSessions();
    const totalMessages = sessions.reduce((sum, session) => sum + session.messages.length, 0);
    const sessionsWithGroup = sessions.filter(s => s.documentGroupId).length;

    return {
      totalSessions: sessions.length,
      totalMessages,
      averageMessagesPerSession: sessions.length > 0 ? totalMessages / sessions.length : 0,
      sessionsWithDocumentGroup
    };
  }

  /**
   * Export session as text
   */
  exportSessionAsText(sessionId: string): string | null {
    const session = this.getSession(sessionId);
    if (!session) return null;

    let exportText = `Chat Session: ${session.title}\n`;
    exportText += `Created: ${session.createdAt.toLocaleString()}\n`;
    exportText += `Messages: ${session.messages.length}\n\n`;

    if (session.documentGroupId) {
      const groupInfo = this.getDocumentGroupInfo(session.documentGroupId);
      if (groupInfo) {
        exportText += `Document Group: ${groupInfo.name} (${groupInfo.documentCount} documents)\n\n`;
      }
    }

    session.messages.forEach(message => {
      exportText += `${message.role.toUpperCase()} - ${message.timestamp.toLocaleString()}\n`;
      exportText += `${message.content}\n\n`;

      if (message.context?.searchResults && message.context.searchResults.length > 0) {
        exportText += `Sources:\n`;
        message.context.searchResults.forEach((result, index) => {
          exportText += `${index + 1}. ${result.document.title} (Relevance: ${Math.round(result.relevance * 100)}%)\n`;
        });
        exportText += '\n';
      }
    });

    return exportText;
  }

  /**
   * Export session as JSON
   */
  exportSessionAsJSON(sessionId: string): string | null {
    const session = this.getSession(sessionId);
    if (!session) return null;

    return JSON.stringify(session, null, 2);
  }

  // Helper methods
  private generateSessionId(): string {
    return `rag_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveSessionToStorage(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      localStorage.setItem(`rag_chat_session_${sessionId}`, JSON.stringify(session));
    }
  }

  private loadSessionFromStorage(sessionId: string): RAGChatSession | null {
    const stored = localStorage.getItem(`rag_chat_session_${sessionId}`);
    if (stored) {
      try {
        const session = JSON.parse(stored);
        // Convert date strings back to Date objects
        session.createdAt = new Date(session.createdAt);
        session.updatedAt = new Date(session.updatedAt);
        session.messages.forEach((msg: any) => {
          msg.timestamp = new Date(msg.timestamp);
        });
        this.sessions.set(sessionId, session);
        return session;
      } catch (error) {
        console.error('Failed to load session from storage:', error);
      }
    }
    return null;
  }

  private loadAllSessionsFromStorage(): void {
    // Clear current sessions
    this.sessions.clear();
    
    // Load all sessions from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('rag_chat_session_')) {
        const sessionId = key.replace('rag_chat_session_', '');
        this.loadSessionFromStorage(sessionId);
      }
    }
  }
}

export const ragChatService = new RAGChatService();