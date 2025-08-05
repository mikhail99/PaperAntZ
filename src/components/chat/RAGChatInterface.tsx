'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Bot, 
  User, 
  FileText, 
  FolderOpen,
  Plus,
  Save,
  Download,
  Trash2,
  Settings,
  Brain,
  BookOpen,
  Clock,
  Copy,
  ExternalLink
} from 'lucide-react';
import { ragChatService, RAGChatSession, RAGChatMessage, RAGChatOptions } from '@/lib/services/rag-chat-service';
import { DocumentGroup } from '@/lib/types';

interface RAGChatInterfaceProps {
  documentGroups?: DocumentGroup[];
}

export default function RAGChatInterface({ documentGroups = [] }: RAGChatInterfaceProps) {
  const [sessions, setSessions] = useState<RAGChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<RAGChatSession | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [chatOptions, setChatOptions] = useState<RAGChatOptions>({
    maxContextResults: 5,
    relevanceThreshold: 0.6,
    includeSources: true,
    searchType: 'hybrid'
  });
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionGroupId, setNewSessionGroupId] = useState<string>('all');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  const loadSessions = () => {
    const loadedSessions = ragChatService.getAllSessions();
    setSessions(loadedSessions);
    
    if (loadedSessions.length > 0 && !currentSession) {
      setCurrentSession(loadedSessions[0]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCreateSession = () => {
    if (!newSessionTitle.trim()) return;

    const session = ragChatService.createSession(
      newSessionTitle,
      newSessionGroupId === 'all' ? undefined : newSessionGroupId,
      chatOptions
    );

    setSessions(prev => [session, ...prev]);
    setCurrentSession(session);
    setIsCreateDialogOpen(false);
    setNewSessionTitle('');
    setNewSessionGroupId('all');
  };

  const handleDeleteSession = (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this chat session?')) return;

    ragChatService.deleteSession(sessionId);
    loadSessions();
    
    if (currentSession?.id === sessionId) {
      setCurrentSession(sessions[0] || null);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !currentSession || loading) return;

    try {
      setLoading(true);
      const { response } = await ragChatService.sendMessage(
        currentSession.id,
        message,
        chatOptions
      );

      setMessage('');
      loadSessions(); // Refresh to get updated messages
      
      // Update current session with new messages
      const updatedSession = ragChatService.getSession(currentSession.id);
      if (updatedSession) {
        setCurrentSession(updatedSession);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const exportSession = (format: 'text' | 'json') => {
    if (!currentSession) return;

    let content: string | null = null;
    let filename: string = '';
    let mimeType: string = '';

    if (format === 'text') {
      content = ragChatService.exportSessionAsText(currentSession.id);
      filename = `${currentSession.title}.txt`;
      mimeType = 'text/plain';
    } else {
      content = ragChatService.exportSessionAsJSON(currentSession.id);
      filename = `${currentSession.title}.json`;
      mimeType = 'application/json';
    }

    if (content) {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Show feedback
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const MessageBubble = ({ message }: { message: RAGChatMessage }) => {
    const isUser = message.role === 'user';
    
    return (
      <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        )}
        
        <div className={`max-w-[70%] ${isUser ? 'order-1' : ''}`}>
          <div className={`rounded-lg px-4 py-3 ${
            isUser 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-900'
          }`}>
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
          
          {message.context?.searchResults && message.context.searchResults.length > 0 && (
            <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Sources</span>
              </div>
              <div className="space-y-1">
                {message.context.searchResults.slice(0, 3).map((result, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-blue-700 truncate flex-1">
                      {result.document.title}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(result.relevance * 100)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">
              {formatTime(message.timestamp)}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => copyToClipboard(message.content)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {isUser && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
          </div>
        )}
      </div>
    );
  };

  const SessionItem = ({ session }: { session: RAGChatSession }) => (
    <Card 
      className={`cursor-pointer transition-all ${
        currentSession?.id === session.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
      }`}
      onClick={() => setCurrentSession(session)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm line-clamp-1">{session.title}</CardTitle>
            <CardDescription className="text-xs">
              {session.messages.length} messages • {formatDate(session.createdAt)}
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteSession(session.id);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      
      {session.documentGroupId && (
        <CardContent className="pt-0">
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <FolderOpen className="h-3 w-3" />
            <span className="truncate">
              {documentGroups.find(g => g.id === session.documentGroupId)?.name || 'Unknown Group'}
            </span>
          </div>
        </CardContent>
      )}
    </Card>
  );

  return (
    <div className="flex h-[calc(100vh-200px)] gap-6">
      {/* Sessions Sidebar */}
      <div className="w-80 flex flex-col border-r">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Chat Sessions</h3>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Chat Session</DialogTitle>
                  <DialogDescription>
                    Start a new conversation with optional document group context
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Session Title</label>
                    <Input
                      value={newSessionTitle}
                      onChange={(e) => setNewSessionTitle(e.target.value)}
                      placeholder="Enter session title"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Document Group (Optional)</label>
                    <Select value={newSessionGroupId} onValueChange={setNewSessionGroupId}>
                      <SelectTrigger>
                        <SelectValue placeholder="All documents" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Documents</SelectItem>
                        {documentGroups.map(group => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSession} disabled={!newSessionTitle.trim()}>
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {sessions.length > 0 && (
            <div className="text-xs text-gray-500">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No chat sessions yet</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  Create your first session
                </Button>
              </div>
            ) : (
              sessions.map(session => (
                <SessionItem key={session.id} session={session} />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 flex flex-col">
        {currentSession ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{currentSession.title}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <span>{currentSession.messages.length} messages</span>
                  <span>Created {formatDate(currentSession.createdAt)}</span>
                  {currentSession.documentGroupId && (
                    <div className="flex items-center gap-1">
                      <FolderOpen className="h-3 w-3" />
                      <span>
                        {documentGroups.find(g => g.id === currentSession.documentGroupId)?.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => exportSession('text')}>
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Chat Options</DialogTitle>
                      <DialogDescription>
                        Configure RAG search behavior for this chat session
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Max Context Results</label>
                        <Select 
                          value={chatOptions.maxContextResults?.toString()} 
                          onValueChange={(value) => setChatOptions(prev => ({ ...prev, maxContextResults: parseInt(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3 Results</SelectItem>
                            <SelectItem value="5">5 Results</SelectItem>
                            <SelectItem value="10">10 Results</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Relevance Threshold</label>
                        <Select 
                          value={chatOptions.relevanceThreshold?.toString()} 
                          onValueChange={(value) => setChatOptions(prev => ({ ...prev, relevanceThreshold: parseFloat(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0.5">50% (Low)</SelectItem>
                            <SelectItem value="0.6">60% (Medium)</SelectItem>
                            <SelectItem value="0.7">70% (High)</SelectItem>
                            <SelectItem value="0.8">80% (Very High)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Search Type</label>
                        <Select 
                          value={chatOptions.searchType} 
                          onValueChange={(value: 'semantic' | 'hybrid') => setChatOptions(prev => ({ ...prev, searchType: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="semantic">Semantic Only</SelectItem>
                            <SelectItem value="hybrid">Hybrid (Recommended)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {}}>
                        Reset to Defaults
                      </Button>
                      <Button onClick={() => {}}>
                        Save Settings
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {currentSession.messages.length === 0 ? (
                  <div className="text-center py-12">
                    <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
                    <p className="text-gray-600 mb-4">
                      Ask questions about your documents and get AI-powered answers with relevant context.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[
                        "What are the key findings?",
                        "Summarize the main points",
                        "What are the recommendations?",
                        "Explain the methodology"
                      ].map((suggestion, index) => (
                        <Button
                          key={index}
                          size="sm"
                          variant="outline"
                          onClick={() => setMessage(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  currentSession.messages.map(message => (
                    <MessageBubble key={message.id} message={message} />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask a question about your documents..."
                  className="resize-none"
                  rows={2}
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!message.trim() || loading}
                  size="icon"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>Press Enter to send, Shift+Enter for new line</span>
                <div className="flex items-center gap-2">
                  <Brain className="h-3 w-3" />
                  <span>RAG-powered responses</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Welcome to RAG Chat</h3>
              <p className="text-gray-600 mb-6">
                Create a chat session to start asking questions about your documents with AI-powered context awareness.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Session
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}