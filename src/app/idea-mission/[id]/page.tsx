'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Play, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Brain,
  Lightbulb,
  FolderOpen,
  Target,
  Users,
  BarChart3
} from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { AgentChat, ChatProvider, useFileManager } from '@/components/chat';
import { AgentType, ChatMessage, ChatFile, FileContext } from '@/types/chat';
import { IdeaMission, MissionStatus } from '@/lib/types';
import { ideaService } from '@/lib/services/idea-service';
import { ideaAgentService } from '@/lib/services/idea-agent-service';
import { agentService } from '@/lib/services/agent-service';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import React from 'react';

export default function IdeaMissionDetail() {
  const params = useParams();
  const router = useRouter();
  const missionId = params.id as string;
  const [mission, setMission] = useState<IdeaMission | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Chat state (reuse research chat UX)
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);
  const [availableFiles, setAvailableFiles] = useState<ChatFile[]>([]);
  const [generatedFiles, setGeneratedFiles] = useState<ChatFile[]>([]);
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const { files, addFile, addGeneratedFile } = useFileManager();
  const { toast } = useToast();
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveTarget, setSaveTarget] = useState<ChatMessage | null>(null);
  const [saveName, setSaveName] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState('note');
  const [addContent, setAddContent] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNewName, setEditNewName] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [editPreview, setEditPreview] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await ideaService.get(missionId);
        const mapped: IdeaMission = {
          id: data.id,
          title: data.title,
          description: data.description,
          status: (data.status as MissionStatus) || MissionStatus.CREATED,
          documentGroupIds: data.documentGroupIds || [],
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
          completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
        };
        setMission(mapped);

        // Load chat history
        const chat = await ideaAgentService.getChat(missionId);
        const mappedChat: ChatMessage[] = (chat || []).map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp || Date.now()),
          agentId: m.agentId,
          agentName: m.agentName,
          agentIcon: m.agentIcon,
          metadata: m.metadata,
        }));
        setMessages(mappedChat);

        // Load artifacts to show under Available Files
        const arts = await ideaAgentService.listArtifacts(missionId);
        setArtifacts(arts);
        // For now we don't fetch artifact file contents; present as downloadable items.
        const mappedArtifacts: ChatFile[] = (arts || []).map((a: any) => ({
          id: a.id,
          name: a.name,
          type: 'text/markdown',
          size: a.size || 0,
          uploadedAt: new Date(a.createdAt),
          source: 'generated',
          generatedBy: a.agent || 'Agent',
          content: undefined,
          metadata: a.metadata || {},
          url: a.downloadUrl,
        }));
        setGeneratedFiles(mappedArtifacts);
        setAvailableFiles(prev => [...prev, ...mappedArtifacts]);

        // Load persisted file context (selection + prompts) and seed local UI state
        try {
          const contexts = await ideaAgentService.getFileContext(missionId);
          // Map to fileId -> { selected, prompt }
          const ctxMap: Record<string, { selected: boolean; prompt: string }> = {}
          contexts.forEach((c: any) => { ctxMap[c.id] = { selected: !!c.selected, prompt: c.prompt || '' } })
          // Attach to window for AgentChat to optionally read (simple approach without lifting state fully)
          ;(window as any).__seedFileContext = ctxMap
        } catch {}

        // Load mission-scoped agent presets (for future advanced UI)
        try {
          const presets = await agentService.listMissionPresets(missionId)
          ;(window as any).__missionAgentPresets = presets
        } catch {}
      } catch (e) {
        console.error('Failed to load idea mission', e);
        setMission(null);
      }
    })();
  }, [missionId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'RUNNING':
      case 'RESEARCHING':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  // Agents (reuse names/icons from research)
  const agents: AgentType[] = [
    { id: 'planning', name: 'Planning Agent', description: 'Shapes idea development plan', color: 'blue', icon: 'target' },
    { id: 'research', name: 'Research Agent', description: 'Analyzes market and feasibility', color: 'green', icon: 'brain' },
    { id: 'writing', name: 'Writing Agent', description: 'Drafts the idea report', color: 'purple', icon: 'file-edit' },
    { id: 'review', name: 'Review Agent', description: 'Reviews and refines outputs', color: 'orange', icon: 'users' },
    { id: 'semantic', name: 'Semantic Search', description: 'Retrieve ranked snippets from selected group', color: 'cyan', icon: 'search' },
    { id: 'hybrid', name: 'Hybrid (PaperQA)', description: 'Synthesize answers using PaperQA', color: 'teal', icon: 'search' },
  ];

  const handleAgentSelect = (agent: AgentType) => setSelectedAgent(agent);

  const handleAgentExecute = async (agent: AgentType, message: string, filesInput: FileContext[], historyForRun?: ChatMessage[]) => {
    setIsChatLoading(true);
    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: message, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);

    try {
      if (agent.id === 'planning') {
        const exec = await ideaAgentService.executePlanning(missionId, {
          userId: 'demo-user',
          message,
          history: (historyForRun || messages).map(m => ({ id: m.id, role: m.role, content: m.content })),
          files: filesInput,
          documentGroupIds: mission?.documentGroupIds || [],
        });

        const agentMessage: ChatMessage = {
          id: exec.messageId,
          role: 'assistant',
          content: exec.answer,
          timestamp: new Date(),
          agentId: agent.id,
          agentName: agent.name,
          agentIcon: agent.icon,
        };
        setMessages(prev => [...prev, agentMessage]);
      } else if (agent.id === 'semantic') {
        const groupId = (mission?.documentGroupIds || [])[0]
        if (!groupId) throw new Error('Select a Document Group for Semantic Search')
        const params = new URLSearchParams({ query: message, limit: '10' })
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
        const res = await fetch(`${apiBase}/document-groups/${groupId}/search?${params.toString()}`)
        if (!res.ok) throw new Error('Semantic search failed')
        const data = await res.json()
        const items = (data?.data?.results || []) as any[]
        const md = ['### Semantic Search Results', '', ...items.slice(0,10).map((r:any, i:number)=>`${i+1}. [${r.title||'Untitled'}](${r.url||'#'}) — ${(r.abstract||'').slice(0,220)}`)].join('\n')
        const agentMessage: ChatMessage = { id: (Date.now()+1).toString(), role: 'assistant', content: md, timestamp: new Date(), agentId: agent.id, agentName: agent.name, agentIcon: agent.icon }
        setMessages(prev => [...prev, agentMessage])
      } else if (agent.id === 'hybrid') {
        const groupId = (mission?.documentGroupIds || [])[0]
        if (!groupId) throw new Error('Select a Document Group for Hybrid search')
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
        const res = await fetch(`${apiBase}/document-groups/${groupId}/paperqa`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ question: message }) })
        if (!res.ok) throw new Error('Hybrid (PaperQA) failed')
        const data = await res.json()
        const md = data?.data?.answer || 'No answer.'
        const agentMessage: ChatMessage = { id: (Date.now()+2).toString(), role: 'assistant', content: md, timestamp: new Date(), agentId: agent.id, agentName: agent.name, agentIcon: agent.icon }
        setMessages(prev => [...prev, agentMessage])
      } else {
        // Fallback: echo
        const agentMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `${agent.name} processed: ${message}`,
          timestamp: new Date(),
          agentId: agent.id,
          agentName: agent.name,
          agentIcon: agent.icon,
        };
        setMessages(prev => [...prev, agentMessage]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleFileSelect = (newFiles: File[]) => {
    const chatFiles = newFiles.map(f => addFile(f, 'upload'));
    setAvailableFiles(prev => [...prev, ...chatFiles]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'RUNNING':
      case 'RESEARCHING':
        return 'bg-blue-100 text-blue-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExecuteMission = async () => {
    if (!mission) return;
    
    setIsLoading(true);
    // Simulate mission execution
    setTimeout(() => {
      setMission(prev => prev ? { ...prev, status: MissionStatus.RESEARCHING } : null);
      setIsLoading(false);
    }, 2000);
  };

  if (!mission) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Idea Mission Not Found</h3>
              <p className="text-gray-600 text-center mb-4">
                The idea mission you're looking for doesn't exist.
              </p>
              <Button onClick={() => router.push('/idea-mission')}>
                Back to Ideas
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <ChatProvider>
    <MainLayout>
      <div className="p-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{mission.title}</h1>
              <p className="text-gray-600 mt-2">{mission.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(mission.status)}
              <Badge className={getStatusColor(mission.status)}>
                {mission.status}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Created: {mission.createdAt.toLocaleDateString()}</span>
            <span>Updated: {mission.updatedAt.toLocaleDateString()}</span>
            {mission.completedAt && (
              <span>Completed: {mission.completedAt.toLocaleDateString()}</span>
            )}
          </div>

          {mission.documentGroupIds && mission.documentGroupIds.length > 0 && (
            <div className="mt-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <FolderOpen className="h-3 w-3" />
                {mission.documentGroupIds.length} linked group{mission.documentGroupIds.length > 1 ? 's' : ''}
              </Badge>
            </div>
          )}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="agent-chat">Agent Chat</TabsTrigger>
            <TabsTrigger value="report">Idea Report</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Idea Overview</CardTitle>
                  <CardDescription>
                    Comprehensive view of your idea and its development progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-2">Development Progress</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Conceptualization</span>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <Progress value={100} />
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Research & Analysis</span>
                          {mission.status === 'RESEARCHING' ? (
                            <Clock className="h-4 w-4 text-blue-600" />
                          ) : mission.status === 'COMPLETED' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <Progress 
                          value={
                            mission.status === 'COMPLETED' ? 100 :
                            mission.status === 'RESEARCHING' ? 60 : 0
                          } 
                        />
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Prototype Development</span>
                          {mission.status === 'COMPLETED' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <Progress 
                          value={mission.status === 'COMPLETED' ? 100 : 0} 
                        />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Current Activity</h4>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900">Idea Development Agent</span>
                        </div>
                        <p className="text-sm text-blue-800">
                          {mission.status === 'COMPLETED' 
                            ? 'Idea development completed successfully!'
                            : mission.status === 'RESEARCHING'
                            ? 'Analyzing market potential and gathering insights for idea validation...'
                            : 'Ready to start development process...'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Manage your idea development</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(mission.status === 'CREATED' || mission.status === 'PLANNING') ? (
                    <Button 
                      className="w-full" 
                      onClick={handleExecuteMission}
                      disabled={isLoading}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Development
                    </Button>
                  ) : mission.status === 'RESEARCHING' ? (
                    <Button variant="outline" className="w-full">
                      <Clock className="h-4 w-4 mr-2" />
                      In Progress
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Completed
                    </Button>
                  )}

                  <Button variant="outline" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>

                  <Button variant="outline" className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Share Idea
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="agent-chat" className="space-y-6">
            <Card className="h-[calc(100vh-12rem)]">
              <CardHeader className="pb-4">
                <CardTitle>Agent Chat</CardTitle>
                <CardDescription>Work with agents to develop this idea</CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-8rem)]">
                <AgentChat
                  messages={messages}
                  agents={agents}
                  selectedAgent={selectedAgent}
                  onAgentSelect={handleAgentSelect}
                  onAgentExecute={handleAgentExecute}
                  availableFiles={[...files, ...generatedFiles, ...availableFiles]}
                  generatedFiles={generatedFiles}
                  isLoading={isChatLoading}
                  onFileSelect={handleFileSelect}
                  onAddTextFile={() => setAddOpen(true)}
                  onFileRename={async (fileId, newName) => {
                    try {
                      const updated = await ideaAgentService.renameArtifact(missionId, fileId, newName);
                      setArtifacts(prev => prev.map(a => a.id === fileId ? updated : a));
                      setGeneratedFiles(prev => prev.map(f => f.id === fileId ? { ...f, name: updated.name } : f));
                      setAvailableFiles(prev => prev.map(f => f.id === fileId ? { ...f, name: updated.name } : f));
                      toast({ title: 'Renamed', description: updated.name });
                    } catch (e) {
                      toast({ title: 'Rename failed', description: String(e) });
                    }
                  }}
                  onFileDelete={async (fileId) => {
                    try {
                      await ideaAgentService.deleteArtifact(missionId, fileId);
                      setArtifacts(prev => prev.filter(a => a.id !== fileId));
                      setGeneratedFiles(prev => prev.filter(f => f.id !== fileId));
                      setAvailableFiles(prev => prev.filter(f => f.id !== fileId));
                      toast({ title: 'Deleted' });
                    } catch (e) {
                      toast({ title: 'Delete failed', description: String(e) });
                    }
                  }}
                  onFileStar={async (fileId, starred) => {
                    try {
                      const updated = await ideaAgentService.toggleStar(missionId, fileId, starred);
                      setArtifacts(prev => prev.map(a => a.id === fileId ? updated : a));
                      setGeneratedFiles(prev => prev.map(f => f.id === fileId ? { ...f, metadata: { ...(f.metadata||{}), starred } } : f));
                      setAvailableFiles(prev => prev.map(f => f.id === fileId ? { ...f, metadata: { ...(f.metadata||{}), starred } } : f));
                    } catch (e) {
                      toast({ title: 'Update failed', description: String(e) });
                    }
                  }}
                  starredIds={artifacts.filter((a:any)=>a?.metadata?.starred).map((a:any)=>a.id)}
                  onFileEdit={async (fileId) => {
                    const f = [...generatedFiles, ...availableFiles].find(x => x.id === fileId)
                    setEditId(fileId)
                    setEditName(f?.name || '')
                    setEditNewName((f?.name || '').replace(/\.[^/.]+$/, ''))
                    // Prefer in-memory content; if missing but we have a URL, fetch it
                    let content = (f as any)?.content || ''
                    try {
                      if (!content && f?.url) {
                        // Build absolute URL to backend if needed
                        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
                        const backendOrigin = apiBase.replace(/\/api\/v1$/, '')
                        const url = f.url.startsWith('http') ? f.url : `${backendOrigin}${f.url}`
                        const res = await fetch(url)
                        if (res.ok) content = await res.text()
                      }
                    } catch { /* ignore */ }
                    setEditContent(content)
                    // load persisted prompt if available
                    const seed = (window as any).__seedFileContext || {}
                    setEditPrompt(seed[fileId]?.prompt || '')
                    setEditPreview(false)
                    setEditOpen(true)
                  }}
                  onFileContextChange={async (items) => {
                    try {
                      await ideaAgentService.putFileContext(missionId, items)
                      // keep in window seed for subsequent edits
                      const seed: any = {}
                      items.forEach((i) => { seed[i.id] = { selected: i.selected, prompt: i.prompt || '' } })
                      ;(window as any).__seedFileContext = seed
                    } catch {}
                  }}
                  onMessageAction={async (message, action) => {
                    try {
                      if (!mission) return;
                      if (action === 'like' || action === 'dislike') {
                        // Optimistic UI update for color feedback
                        setMessages(prev => prev.map(m => m.id === message.id ? { ...m, metadata: { ...(m.metadata||{}), liked: action==='like', disliked: action==='dislike' } } : m))
                        if (message.role === 'assistant') {
                          await ideaAgentService.submitFeedback(missionId, message.id, { userId: 'demo-user', rating: action === 'like' ? 'up' : 'down' });
                          toast({ title: 'Feedback sent', description: action === 'like' ? 'Marked as helpful' : 'Marked as not helpful' });
                        }
                      }
                      if (action === 'save') {
                        setSaveTarget(message);
                        const defaultName = mission.title.replace(/\s+/g, '-').toLowerCase();
                        setSaveName(defaultName);
                        setSaveOpen(true);
                      }
                      if (action === 'pin') {
                        setMessages(prev => prev.map(m => m.id === message.id ? { ...m, metadata: { ...(m.metadata||{}), pinned: true } } : m))
                      }
                      if (action === 'unpin') {
                        setMessages(prev => prev.map(m => m.id === message.id ? { ...m, metadata: { ...(m.metadata||{}), pinned: false } } : m))
                      }
                    } catch (e) {
                      console.error('action failed', e);
                      toast({ title: 'Action failed', description: String(e) });
                    }
                  }}
                  placeholder="Select an agent and type instructions... Use @ to reference files"
                  className="h-full border-0 rounded-none"
                  // Persist selection + prompts whenever user toggles checkbox or edits prompt
                  onInputChange={async () => {
                    try {
                      const seed = (window as any).__seedFileContext || {}
                      const items = Object.entries(seed).map(([id, cfg]: any) => ({ id, name: (generatedFiles.find(f=>f.id===id)||availableFiles.find(f=>f.id===id))?.name || id, prompt: cfg.prompt || '', selected: !!cfg.selected }))
                      await ideaAgentService.putFileContext(missionId, items)
                    } catch {}
                  }}
                />
                <div className="p-3 border-t flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>Add Text File</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="report" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Idea Report</CardTitle>
                <CardDescription>Drafts and outputs generated for this idea</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-700">
                  {generatedFiles.length === 0 ? (
                    <div className="text-gray-500">No report files yet. Use Agent Chat to generate content.</div>
                  ) : (
                    generatedFiles.map((f) => (
                      <div key={f.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="truncate">{f.name}</div>
                        <Button size="sm" variant="outline" onClick={() => {
                          const blob = new Blob([f.content], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url; a.download = f.name; a.click(); URL.revokeObjectURL(url);
                        }}>Download</Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Development Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {mission.status === 'COMPLETED' && mission.completedAt
                      ? Math.ceil((mission.completedAt.getTime() - mission.createdAt.getTime()) / (1000 * 60 * 60 * 24))
                      : Math.ceil((new Date().getTime() - mission.createdAt.getTime()) / (1000 * 60 * 60 * 24))
                    } days
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Since creation
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Progress</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {mission.status === 'COMPLETED' ? '100%' :
                     mission.status === 'RESEARCHING' ? '60%' :
                     mission.status === 'WRITING' ? '85%' : '0%'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Development complete
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Document Groups</CardTitle>
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {mission.documentGroupIds?.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Linked groups
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Save dialog */}
        <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save response as file</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <label className="text-sm">Filename (without extension)</label>
              <Input value={saveName} onChange={(e) => setSaveName(e.target.value)} />
              <label className="text-sm">Per-file prompt</label>
              <Input value={editPrompt} onChange={(e)=>setEditPrompt(e.target.value)} placeholder="Optional per-file prompt" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSaveOpen(false)}>Cancel</Button>
              <Button onClick={async () => {
                if (!saveTarget || !mission) return;
                try {
                  const res = await ideaAgentService.saveMessage(missionId, saveTarget.id, {
                    userId: 'demo-user',
                    content: saveTarget.content,
                    format: 'markdown',
                    filenameHint: saveName || mission.title.replace(/\s+/g, '-').toLowerCase(),
                    metadata: { agentId: saveTarget.agentId, agentName: saveTarget.agentName },
                  });
                  const artifact = res.artifact;
                  const fileName = artifact?.name || `${saveName || 'idea-plan'}.md`;
                  const added = addGeneratedFile(fileName, saveTarget.content, saveTarget.agentName || 'Agent', 'text/markdown', artifact?.id, artifact?.downloadUrl);
                  setGeneratedFiles(prev => [added, ...prev]);
                  setAvailableFiles(prev => [added, ...prev]);
                  // store prompt selection
                  const seed = (window as any).__seedFileContext || {}
                  if (artifact?.id) seed[artifact.id] = { selected: true, prompt: editPrompt }
                  ;(window as any).__seedFileContext = seed
                  const items = Object.entries(seed).map(([id, cfg]: any) => ({ id, name: (generatedFiles.find(f=>f.id===id)||availableFiles.find(f=>f.id===id))?.name || id, prompt: cfg.prompt || '', selected: !!cfg.selected }))
                  await ideaAgentService.putFileContext(missionId, items)
                  toast({ title: 'Saved', description: `${fileName} added to Available Files` });
                } catch (e) {
                  console.error(e);
                  toast({ title: 'Save failed', description: String(e) });
                } finally {
                  setSaveOpen(false);
                  setSaveTarget(null);
                }
              }}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add external text file */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Add text file to Available Files</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <label className="text-sm">Filename (without extension)</label>
              <Input value={addName} onChange={(e) => setAddName(e.target.value)} />
              <label className="text-sm">Content</label>
              <Textarea value={addContent} onChange={(e) => setAddContent(e.target.value)} rows={10} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={async () => {
                try {
                  const res = await ideaAgentService.addTextArtifact(missionId, { userId: 'demo-user', name: addName, content: addContent, format: 'markdown' });
                  const artifact = res.artifact;
                  const fileName = artifact?.name || `${addName}.md`;
                  const added = addGeneratedFile(fileName, addContent, 'External', 'text/markdown', artifact?.id, artifact?.downloadUrl);
                  setGeneratedFiles(prev => [added, ...prev]);
                  setAvailableFiles(prev => [added, ...prev]);
                  toast({ title: 'Added', description: `${fileName} added to Available Files` });
                } catch (e) {
                  toast({ title: 'Add failed', description: String(e) });
                } finally {
                  setAddOpen(false);
                  setAddName('note');
                  setAddContent('');
                }
              }}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit artifact (Markdown) */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Edit file: {editName}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-auto pr-1">
              <div>
                <label className="text-sm">Filename (without extension)</label>
                <Input value={editNewName} onChange={(e)=>setEditNewName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm">Per-file prompt</label>
                <Input value={editPrompt} onChange={(e)=>setEditPrompt(e.target.value)} placeholder="Optional per-file prompt" />
              </div>
              <div className="flex items-center gap-2">
                <Button variant={editPreview ? 'outline' : 'default'} size="sm" onClick={()=>setEditPreview(false)}>Edit</Button>
                <Button variant={editPreview ? 'default' : 'outline'} size="sm" onClick={()=>setEditPreview(true)}>Preview</Button>
              </div>
              {!editPreview ? (
                <Textarea value={editContent} onChange={(e)=>setEditContent(e.target.value)} className="flex-1 min-h-[300px] font-mono text-sm" />
              ) : (
                <div className="prose prose-sm max-w-none p-4 border rounded bg-white overflow-auto">
                  {React.createElement(require('react-markdown').default, { 
                    // @ts-ignore
                    components: {
                      h1: (props: any) => <h1 className="text-2xl font-bold mb-3" {...props} />,
                      h2: (props: any) => <h2 className="text-xl font-semibold mt-4 mb-2" {...props} />,
                      h3: (props: any) => <h3 className="text-lg font-semibold mt-3 mb-2" {...props} />,
                      p: (props: any) => <p className="mb-2 leading-6" {...props} />,
                      ul: (props: any) => <ul className="list-disc pl-5 space-y-1 mb-2" {...props} />,
                      ol: (props: any) => <ol className="list-decimal pl-5 space-y-1 mb-2" {...props} />,
                      li: (props: any) => <li className="leading-6" {...props} />,
                      strong: (props: any) => <strong className="font-semibold" {...props} />,
                      code: (props: any) => <code className="bg-gray-100 px-1 rounded" {...props} />,
                    }
                  }, editContent || '')}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={()=>setEditOpen(false)}>Cancel</Button>
              <Button onClick={async ()=>{
                if (!editId) return;
                try {
                  // If the name changed, rename first
                  if (editNewName && (editNewName + (editName.match(/\.[^/.]+$/)?.[0] || '')) !== editName) {
                    const updated = await ideaAgentService.renameArtifact(missionId, editId, editNewName)
                    setEditName(updated.name)
                    setGeneratedFiles(prev => prev.map(f => f.id === editId ? { ...f, name: updated.name } : f))
                    setAvailableFiles(prev => prev.map(f => f.id === editId ? { ...f, name: updated.name } : f))
                  }
                  const updated = await ideaAgentService.editArtifactContent(missionId, editId, editContent)
                  setArtifacts(prev => prev.map(a => a.id === editId ? updated : a))
                  setGeneratedFiles(prev => prev.map(f => f.id === editId ? { ...f, content: editContent, name: updated.name } : f))
                  setAvailableFiles(prev => prev.map(f => f.id === editId ? { ...f, content: editContent, name: updated.name } : f))
                  // persist prompt alongside selection state (assume selected=true if edited here)
                  const seed = (window as any).__seedFileContext || {}
                  seed[editId] = { selected: true, prompt: editPrompt }
                  ;(window as any).__seedFileContext = seed
                  const items = Object.entries(seed).map(([id, cfg]: any) => ({ id, name: (generatedFiles.find(f=>f.id===id)||availableFiles.find(f=>f.id===id))?.name || id, prompt: cfg.prompt || '', selected: !!cfg.selected }))
                  await ideaAgentService.putFileContext(missionId, items)
                  toast({ title: 'Saved', description: 'Content updated' })
                } catch (e) {
                  toast({ title: 'Save failed', description: String(e) })
                } finally {
                  setEditOpen(false)
                }
              }}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
    </ChatProvider>
  );
}
