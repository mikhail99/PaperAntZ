import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  ChatMessage, 
  ChatSession, 
  DocumentContext, 
  AgentCapability,
  ChatInterfaceConfig 
} from '@/lib/types/chat';
import { 
  Send, 
  Paperclip, 
  Mic, 
  FileText, 
  Brain, 
  Target, 
  BookOpen, 
  Edit3, 
  Eye,
  Plus,
  Save,
  Download,
  Trash2,
  Clock,
  User,
  Bot,
  Users
} from 'lucide-react';

interface ChatInterfaceProps {
  agents: AgentCapability[];
  documents: DocumentContext[];
  config: ChatInterfaceConfig;
  onSendMessage: (message: string, agentId?: string, documentIds?: string[]) => Promise<void>;
  onLoadSession?: (sessionId: string) => Promise<void>;
  onSaveSession?: (session: ChatSession) => Promise<void>;
  className?: string;
}

export function ChatInterface({
  agents,
  documents,
  config,
  onSendMessage,
  onLoadSession,
  onSaveSession,
  className = ""
}: ChatInterfaceProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [messageInput, setMessageInput] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize with a new session
  useEffect(() => {
    if (!activeSession && sessions.length === 0) {
      createNewSession();
    }
  }, [activeSession, sessions]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages]);

  // Auto-save functionality
  useEffect(() => {
    if (!activeSession) return;
    
    const interval = setInterval(() => {
      if (activeSession.messages.length > 0) {
        saveCurrentSession();
      }
    }, config.autoSaveInterval * 1000);

    return () => clearInterval(interval);
  }, [activeSession, config.autoSaveInterval]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createNewSession = (agentId?: string) => {
    const agent = agents.find(a => a.id === agentId);
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: agent ? `Chat with ${agent.name}` : 'New Chat',
      agentId: agent?.id,
      agentName: agent?.name,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      documentContexts: []
    };
    
    setSessions(prev => [...prev, newSession]);
    setActiveSession(newSession);
    setSelectedAgent(agentId || '');
    setSelectedDocuments([]);
  };

  const saveCurrentSession = async () => {
    if (!activeSession || !onSaveSession) return;
    
    const updatedSession = {
      ...activeSession,
      updatedAt: new Date()
    };
    
    setActiveSession(updatedSession);
    await onSaveSession(updatedSession);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeSession || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: messageInput,
      timestamp: new Date(),
      documentContext: selectedDocuments.map(docId => 
        documents.find(d => d.id === docId)
      ).filter(Boolean) as DocumentContext[]
    };

    // Update session with user message
    const updatedSession = {
      ...activeSession,
      messages: [...activeSession.messages, userMessage],
      updatedAt: new Date()
    };
    setActiveSession(updatedSession);
    setMessageInput('');
    setIsLoading(true);

    try {
      await onSendMessage(
        messageInput,
        selectedAgent || undefined,
        selectedDocuments.length > 0 ? selectedDocuments : undefined
      );
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: ChatMessage = {
        id: `msg_error_${Date.now()}`,
        role: 'system',
        content: 'Sorry, there was an error processing your message. Please try again.',
        timestamp: new Date()
      };
      setActiveSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, errorMessage],
        updatedAt: new Date()
      } : null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const addDocumentToContext = (documentId: string) => {
    if (!selectedDocuments.includes(documentId)) {
      setSelectedDocuments(prev => [...prev, documentId]);
    }
  };

  const removeDocumentFromContext = (documentId: string) => {
    setSelectedDocuments(prev => prev.filter(id => id !== documentId));
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getAgentIcon = (category: string) => {
    switch (category) {
      case 'planning': return <Target className="h-4 w-4" />;
      case 'research': return <BookOpen className="h-4 w-4" />;
      case 'analysis': return <Brain className="h-4 w-4" />;
      case 'writing': return <Edit3 className="h-4 w-4" />;
      case 'review': return <Eye className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getAgentColor = (category: string) => {
    switch (category) {
      case 'planning': return 'bg-blue-500';
      case 'research': return 'bg-green-500';
      case 'analysis': return 'bg-purple-500';
      case 'writing': return 'bg-orange-500';
      case 'review': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={`flex h-full ${className}`}>
      {/* Sidebar */}
      <div className="w-80 border-r bg-muted/10 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Chat Sessions</h2>
            <Button
              size="sm"
              onClick={() => createNewSession()}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <Select value={selectedAgent} onValueChange={(value) => createNewSession(value === 'general' ? '' : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select agent to chat with" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>General Chat</span>
                </div>
              </SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  <div className="flex items-center gap-2">
                    {getAgentIcon(agent.category)}
                    <span>{agent.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className={`cursor-pointer transition-colors ${
                  activeSession?.id === session.id ? 'border-primary' : 'hover:bg-muted/50'
                }`}
                onClick={() => setActiveSession(session)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-sm truncate">{session.title}</h3>
                    {session.agentId && (
                      <Badge variant="secondary" className="text-xs">
                        {session.agentName}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{session.messages.length} messages</span>
                    <span>{formatTimestamp(session.updatedAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {activeSession?.agentId && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={getAgentColor(
                      agents.find(a => a.id === activeSession.agentId)?.category || ''
                    )}>
                      {getAgentIcon(agents.find(a => a.id === activeSession.agentId)?.category || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="font-semibold">{activeSession.agentName}</h1>
                    <p className="text-sm text-muted-foreground">
                      {agents.find(a => a.id === activeSession.agentId)?.description}
                    </p>
                  </div>
                </div>
              )}
              {!activeSession?.agentId && (
                <div>
                  <h1 className="font-semibold">General Chat</h1>
                  <p className="text-sm text-muted-foreground">Chat with all agents</p>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {activeSession && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={saveCurrentSession}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Document Context Bar */}
        {config.enableDocumentContext && selectedDocuments.length > 0 && (
          <div className="border-b p-3 bg-muted/20">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">Document Context:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedDocuments.map((docId) => {
                const doc = documents.find(d => d.id === docId);
                return doc ? (
                  <Badge key={docId} variant="secondary" className="text-xs">
                    {doc.title}
                    <button
                      onClick={() => removeDocumentFromContext(docId)}
                      className="ml-2 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          {activeSession && (
            <div className="space-y-4">
              {activeSession.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role !== 'user' && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback className={
                        message.agentId 
                          ? getAgentColor(agents.find(a => a.id === message.agentId)?.category || '')
                          : 'bg-gray-500'
                      }>
                        {message.role === 'agent' ? (
                          getAgentIcon(agents.find(a => a.id === message.agentId)?.category || '')
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.agentName && (
                      <div className="text-xs font-medium mb-1">
                        {message.agentName}
                      </div>
                    )}
                    
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </div>
                    
                    {message.documentContext && message.documentContext.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <div className="text-xs opacity-70 mb-1">Referenced documents:</div>
                        <div className="flex flex-wrap gap-1">
                          {message.documentContext.map((doc) => (
                            <Badge key={doc.id} variant="outline" className="text-xs">
                              {doc.title}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs opacity-70 mt-1">
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                  
                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gray-500">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-sm">Thinking...</div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          {config.enableDocumentContext && (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Paperclip className="h-4 w-4" />
                <span className="text-sm font-medium">Add documents to context:</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {documents
                  .filter(doc => !selectedDocuments.includes(doc.id))
                  .slice(0, 5)
                  .map((doc) => (
                    <Button
                      key={doc.id}
                      size="sm"
                      variant="outline"
                      onClick={() => addDocumentToContext(doc.id)}
                      className="text-xs h-7"
                    >
                      {doc.title}
                    </Button>
                  ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={
                selectedAgent
                  ? `Message ${agents.find(a => a.id === selectedAgent)?.name}...`
                  : "Type your message..."
              }
              className="flex-1 resize-none"
              rows={2}
              maxLength={config.maxMessageLength}
            />
            
            <div className="flex flex-col gap-2">
              {config.enableVoiceInput && (
                <Button size="sm" variant="outline" className="h-9 w-9 p-0">
                  <Mic className="h-4 w-4" />
                </Button>
              )}
              
              <Button
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || isLoading}
                className="h-9 w-9 p-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground mt-2">
            {messageInput.length}/{config.maxMessageLength} characters
          </div>
        </div>
      </div>
    </div>
  );
}