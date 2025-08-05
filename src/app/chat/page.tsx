'use client';

import React, { useState, useEffect } from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import RAGChatInterface from '@/components/chat/RAGChatInterface';
import { ChatService } from '@/lib/chat-service';
import { documentService } from '@/lib/services/document-service';
import { ragChatService } from '@/lib/services/rag-chat-service';
import { 
  ChatMessage, 
  ChatSession, 
  DocumentContext, 
  AgentCapability,
  ChatInterfaceConfig 
} from '@/lib/types/chat';
import { DocumentGroup } from '@/lib/types';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Settings, 
  Users, 
  FileText, 
  Plus,
  ArrowLeft,
  Brain,
  Bot
} from 'lucide-react';
import Link from 'next/link';

// Sample data for demonstration
const sampleAgents: AgentCapability[] = [
  {
    id: 'planning_agent',
    name: 'Planning Agent',
    description: 'Helps create structured plans and strategies',
    category: 'planning',
    isActive: true
  },
  {
    id: 'research_agent',
    name: 'Research Agent',
    description: 'Conducts research and gathers information',
    category: 'research',
    isActive: true
  },
  {
    id: 'analysis_agent',
    name: 'Analysis Agent',
    description: 'Analyzes data and provides insights',
    category: 'analysis',
    isActive: true
  },
  {
    id: 'writing_agent',
    name: 'Writing Agent',
    description: 'Helps create and refine written content',
    category: 'writing',
    isActive: true
  },
  {
    id: 'review_agent',
    name: 'Review Agent',
    description: 'Reviews and evaluates work quality',
    category: 'review',
    isActive: true
  }
];

const sampleDocuments: DocumentContext[] = [
  {
    id: 'doc_1',
    title: 'AI Research Methods',
    excerpt: 'Comprehensive guide to AI research methodologies and best practices...',
    relevanceScore: 0.9,
    documentType: 'research'
  },
  {
    id: 'doc_2',
    title: 'Machine Learning Fundamentals',
    excerpt: 'Core concepts and algorithms in machine learning...',
    relevanceScore: 0.8,
    documentType: 'reference'
  },
  {
    id: 'doc_3',
    title: 'Natural Language Processing',
    excerpt: 'Advanced techniques in NLP and text analysis...',
    relevanceScore: 0.7,
    documentType: 'research'
  },
  {
    id: 'doc_4',
    title: 'Research Report Template',
    excerpt: 'Standard template for structuring research reports...',
    relevanceScore: 0.6,
    documentType: 'report'
  },
  {
    id: 'doc_5',
    title: 'Data Analysis Guidelines',
    excerpt: 'Best practices for data analysis and visualization...',
    relevanceScore: 0.8,
    documentType: 'reference'
  }
];

const chatConfig: ChatInterfaceConfig = {
  enableDocumentContext: true,
  maxMessageLength: 2000,
  maxHistoryLength: 100,
  autoSaveInterval: 30,
  enableVoiceInput: false,
  enableMarkdown: true,
  supportedDocumentTypes: ['research', 'report', 'finding', 'reference']
};

export default function ChatPage() {
  const [chatService] = useState(() => new ChatService({
    agents: sampleAgents,
    documents: sampleDocuments,
    config: chatConfig
  }));
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [documentGroups, setDocumentGroups] = useState<DocumentGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load existing sessions and document groups
    loadSessions();
    loadDocumentGroups();
  }, []);

  const loadSessions = async () => {
    try {
      const existingSessions = await chatService.getAllSessions();
      setSessions(existingSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadDocumentGroups = async () => {
    try {
      const groups = await documentService.getUserDocumentGroups('demo-user');
      setDocumentGroups(groups);
    } catch (error) {
      console.error('Error loading document groups:', error);
    }
  };

  const handleSendMessage = async (
    message: string, 
    agentId?: string, 
    documentIds?: string[]
  ) => {
    if (!sessions.length) {
      // Create a new session if none exists
      const newSession = await chatService.createSession(agentId);
      setSessions(prev => [...prev, newSession]);
    }

    const activeSession = sessions[sessions.length - 1];
    setIsLoading(true);

    try {
      await chatService.processMessage(message, activeSession.id, agentId, documentIds);
      
      // Refresh sessions to get updated messages
      const updatedSessions = await chatService.getAllSessions();
      setSessions(updatedSessions);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSession = async (session: ChatSession) => {
    try {
      await chatService.saveSession(session);
      const updatedSessions = await chatService.getAllSessions();
      setSessions(updatedSessions);
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const handleLoadSession = async (sessionId: string) => {
    try {
      await chatService.loadSession(sessionId);
      const updatedSessions = await chatService.getAllSessions();
      setSessions(updatedSessions);
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              
              <div className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Chat Interface</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {sampleAgents.length} Agents Available
              </Badge>
              <Badge variant="outline">
                {sampleDocuments.length} Documents
              </Badge>
              <Badge variant="outline">
                {documentGroups.length} Document Groups
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Info Bar */}
      <div className="border-b bg-muted/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Available Agents:</span>
                <div className="flex gap-1">
                  {sampleAgents.map((agent) => (
                    <Badge key={agent.id} variant="outline" className="text-xs">
                      {agent.name}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">Document Context:</span>
                <Badge variant="secondary" className="text-xs">
                  Enabled
                </Badge>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              {sessions.length} agent session{sessions.length !== 1 ? 's' : ''} • {ragChatService.getChatStats().totalSessions} RAG session{ragChatService.getChatStats().totalSessions !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Type Tabs */}
      <div className="border-b">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="agent-chat" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="agent-chat" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Agent Chat
              </TabsTrigger>
              <TabsTrigger value="rag-chat" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                RAG Chat
              </TabsTrigger>
            </TabsList>

            {/* Agent Chat Interface */}
            <TabsContent value="agent-chat" className="mt-0">
              <div className="flex-1">
                <ChatInterface
                  agents={sampleAgents}
                  documents={sampleDocuments}
                  config={chatConfig}
                  onSendMessage={handleSendMessage}
                  onSaveSession={handleSaveSession}
                  onLoadSession={handleLoadSession}
                />
              </div>
            </TabsContent>

            {/* RAG Chat Interface */}
            <TabsContent value="rag-chat" className="mt-0">
              <div className="flex-1">
                <RAGChatInterface documentGroups={documentGroups} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Collapsible Feature Info */}
      <div className="border-t bg-muted/10">
        <div className="container mx-auto px-4 py-2">
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground list-none">
              <span className="flex items-center gap-2">
                <span>ℹ️ Chat Interface Features</span>
                <span className="group-open:hidden">▼</span>
                <span className="group-open:inline">▲</span>
              </span>
            </summary>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Agent-Specific Chat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Chat with individual agents or coordinate responses across multiple agents for comprehensive insights.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    RAG-Powered Search
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    AI-powered semantic search through your documents with context-aware responses and source citations.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Document Context
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Share documents with agents to provide context and get more relevant, informed responses.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Session Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Maintain multiple chat sessions, save conversations, and export them in various formats.
                  </p>
                </CardContent>
              </Card>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}