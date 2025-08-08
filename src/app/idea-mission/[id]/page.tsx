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
import { AgentType, ChatMessage, ChatFile } from '@/types/chat';
import { IdeaMission, MissionStatus } from '@/lib/types';
import { ideaService } from '@/lib/services/idea-service';
import { ideaAgentService } from '@/lib/services/idea-agent-service';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
  const [isChatLoading, setIsChatLoading] = useState(false);
  const { files, addFile, addGeneratedFile } = useFileManager();
  const { toast } = useToast();
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveTarget, setSaveTarget] = useState<ChatMessage | null>(null);
  const [saveName, setSaveName] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState('note');
  const [addContent, setAddContent] = useState('');

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
  ];

  const handleAgentSelect = (agent: AgentType) => setSelectedAgent(agent);

  const handleAgentExecute = async (agent: AgentType, message: string, filesInput: File[]) => {
    setIsChatLoading(true);
    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: message, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);

    try {
      if (agent.id === 'planning') {
        const exec = await ideaAgentService.executePlanning(missionId, {
          userId: 'demo-user',
          message,
          history: messages.map(m => ({ id: m.id, role: m.role, content: m.content })),
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
                  onMessageAction={async (message, action) => {
                    try {
                      if (message.role !== 'assistant') return;
                      if (!mission) return;
                      if (action === 'like' || action === 'dislike') {
                        await ideaAgentService.submitFeedback(missionId, message.id, { userId: 'demo-user', rating: action === 'like' ? 'up' : 'down' });
                        toast({ title: 'Feedback sent', description: action === 'like' ? 'Marked as helpful' : 'Marked as not helpful' });
                      }
                      if (action === 'save') {
                        setSaveTarget(message);
                        const defaultName = mission.title.replace(/\s+/g, '-').toLowerCase();
                        setSaveName(defaultName);
                        setSaveOpen(true);
                      }
                    } catch (e) {
                      console.error('action failed', e);
                      toast({ title: 'Action failed', description: String(e) });
                    }
                  }}
                  placeholder="Select an agent and type instructions... Use @ to reference files"
                  className="h-full border-0 rounded-none"
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
                  const added = addGeneratedFile(fileName, saveTarget.content, saveTarget.agentName || 'Agent');
                  setGeneratedFiles(prev => [added, ...prev]);
                  setAvailableFiles(prev => [added, ...prev]);
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
                  const added = addGeneratedFile(fileName, addContent, 'External');
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
      </div>
    </MainLayout>
    </ChatProvider>
  );
}
