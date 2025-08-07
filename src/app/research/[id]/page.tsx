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
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Users,
  Target,
  Brain,
  Download,
  Share,
  Edit,
  MessageSquare,
  Zap
} from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { ResearchMission, mockMissions, MissionStatus } from '@/lib/types';
import { createMockResearchReport, ResearchReport, ReportStatus } from '@/lib/types/research-report';
import { AgentChat, ChatProvider, useFileManager } from '@/components/chat';
import { AgentType, ChatMessage, ChatFile } from '@/types/chat';

export default function MissionDetails() {
  const params = useParams();
  const router = useRouter();
  const [mission, setMission] = useState<ResearchMission | null>(null);
  const [researchReport, setResearchReport] = useState<ResearchReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);
  const [availableFiles, setAvailableFiles] = useState<ChatFile[]>([]);
  const [generatedFiles, setGeneratedFiles] = useState<ChatFile[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const { files, addFile, addGeneratedFile } = useFileManager();

  useEffect(() => {
    // Find mission by ID from mock data
    const missionId = params.id as string;
    const foundMission = mockMissions.find(m => m.id === missionId);
    
    if (foundMission) {
      setMission(foundMission);
      // Generate mock research report for completed missions
      if (foundMission.status === MissionStatus.COMPLETED) {
        setResearchReport(createMockResearchReport(missionId));
      }
    }
    setIsLoading(false);
  }, [params.id]);

  // Agent definitions
  const agents: AgentType[] = [
    {
      id: 'planning',
      name: 'Planning Agent',
      description: 'Creates research plans and outlines',
      color: 'blue',
      icon: 'target'
    },
    {
      id: 'research',
      name: 'Research Agent',
      description: 'Conducts in-depth research and analysis',
      color: 'green',
      icon: 'brain'
    },
    {
      id: 'writing',
      name: 'Writing Agent',
      description: 'Writes and drafts research reports',
      color: 'purple',
      icon: 'file-edit'
    },
    {
      id: 'review',
      name: 'Review Agent',
      description: 'Reviews and refines final reports',
      color: 'orange',
      icon: 'users'
    }
  ];

  // Chat handlers
  const handleAgentSelect = (agent: AgentType) => {
    setSelectedAgent(agent);
  };

  const handleAgentExecute = async (agent: AgentType, message: string, files: File[]) => {
    setIsChatLoading(true);
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Simulate agent execution (in real implementation, this would call your backend)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock response based on agent type
      let response = '';
      let generatedFileName = '';
      
      switch (agent.id) {
        case 'planning':
          response = `I've created a comprehensive research plan based on your request: "${message}".\n\nThe plan includes:\n1. Research objectives and scope\n2. Methodology approach\n3. Timeline and milestones\n4. Resource requirements\n\nThe plan has been saved and is ready for your review.`;
          generatedFileName = `planning-output-${Date.now()}.md`;
          break;
        case 'research':
          response = `Research completed for the specified task. I've analyzed the available resources and gathered relevant information.\n\nKey findings:\n- Identified 15 relevant sources\n- Extracted key insights and data points\n- Organized information by thematic categories\n\nThe research data has been compiled and is ready for the writing phase.`;
          generatedFileName = `research-output-${Date.now()}.md`;
          break;
        case 'writing':
          response = `Draft report has been generated based on the research findings. The document includes:\n\n- Executive summary\n- Introduction and background\n- Methodology\n- Results and analysis\n- Conclusions and recommendations\n\nThe draft maintains academic standards and follows the requested structure.`;
          generatedFileName = `writing-output-${Date.now()}.md`;
          break;
        case 'review':
          response = `Review completed. I've checked the document for:\n\n✓ Content accuracy and completeness\n✓ Logical flow and structure\n✓ Grammar and style consistency\n✓ Citation formatting\n✓ Overall coherence\n\nThe document has been refined and is ready for final submission.`;
          generatedFileName = `review-output-${Date.now()}.md`;
          break;
      }

      // Add agent response
      const agentMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        agentId: agent.id,
        agentName: agent.name,
        agentIcon: agent.icon,
        metadata: {
          agentId: agent.id,
          agentName: agent.name,
        }
      };
      setMessages(prev => [...prev, agentMessage]);

      // Create generated file
      const generatedContent = `# ${generatedFileName}\n\nGenerated by ${agent.name}\n\n${response}\n\n---\nGenerated at: ${new Date().toISOString()}`;
      const generatedFile = addGeneratedFile(generatedFileName, generatedContent, agent.name);
      setGeneratedFiles(prev => [...prev, generatedFile]);

    } catch (error) {
      console.error('Agent execution failed:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
        agentId: agent.id,
        agentName: agent.name,
        agentIcon: agent.icon,
        metadata: {
          agentId: agent.id,
          agentName: agent.name,
          error: true,
        }
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleFileSelect = (files: File[]) => {
    // Add files to available files
    const newChatFiles = files.map(file => addFile(file, 'upload'));
    setAvailableFiles(prev => [...prev, ...newChatFiles]);
  };

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

  const getProgressValue = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 100;
      case 'RESEARCHING':
        return 60;
      case 'WRITING':
        return 85;
      case 'PLANNING':
        return 25;
      default:
        return 0;
    }
  };

  // Export functions
  const exportToMarkdown = (report: ResearchReport) => {
    let markdown = `# ${report.title}\n\n`;
    markdown += `**Abstract:** ${report.abstract}\n\n`;
    
    // Add key findings
    if (report.keyFindings.length > 0) {
      markdown += `## Key Findings\n\n`;
      report.keyFindings.forEach(finding => {
        markdown += `- ${finding}\n`;
      });
      markdown += `\n`;
    }
    
    // Add sections
    report.sections.forEach(section => {
      markdown += `## ${section.title}\n\n`;
      markdown += `${section.content}\n\n`;
      
      // Add subsections
      if (section.subsections) {
        section.subsections.forEach(subsection => {
          markdown += `### ${subsection.title}\n\n`;
          markdown += `${subsection.content}\n\n`;
        });
      }
    });
    
    // Add references
    if (report.references.length > 0) {
      markdown += `## References\n\n`;
      report.references.forEach(ref => {
        markdown += `${ref.authors.join(', ')} (${ref.year}). ${ref.title}. ${ref.source}.\n\n`;
      });
    }
    
    // Create and download file
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = (report: ResearchReport) => {
    // For now, we'll create a simple HTML-based PDF export
    // In a real implementation, you'd use a library like jsPDF or Puppeteer
    alert('PDF export would be implemented here with a library like jsPDF or Puppeteer');
  };

  const formatReadingTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min read`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m read`;
  };

  const renderSection = (section: any, level: number = 1) => {
    const HeadingTag = level === 1 ? 'h3' : level === 2 ? 'h4' : 'h5';
    
    return (
      <div key={section.id} className={`mb-6 ${level > 1 ? 'ml-6' : ''}`}>
        <HeadingTag className="text-lg font-semibold mb-2">{section.title}</HeadingTag>
        <p className="text-gray-700 mb-3 leading-relaxed">{section.content}</p>
        
        {section.keyFindings && section.keyFindings.length > 0 && (
          <div className="mb-3">
            <h5 className="font-medium text-sm text-gray-800 mb-2">Key Findings:</h5>
            <ul className="list-disc list-inside space-y-1">
              {section.keyFindings.map((finding: string, index: number) => (
                <li key={index} className="text-sm text-gray-600">{finding}</li>
              ))}
            </ul>
          </div>
        )}
        
        {section.subsections && section.subsections.map((subsection: any) => (
          <div key={subsection.id}>
            {renderSection(subsection, level + 1)}
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Loading mission details...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!mission) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <XCircle className="h-8 w-8 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Mission Not Found</h3>
              <p className="text-gray-600 mb-4">The requested mission could not be found.</p>
              <Button onClick={() => router.push('/research')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Missions
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <ChatProvider>
      <MainLayout>
        <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" onClick={() => router.push('/research')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Missions
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{mission.title}</h1>
              <p className="text-gray-600">{mission.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(mission.status)}
              <Badge className={getStatusColor(mission.status)}>
                {mission.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <Target className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getProgressValue(mission.status)}%</div>
              <Progress value={getProgressValue(mission.status)} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Created</CardTitle>
              <Clock className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{mission.createdAt.toLocaleDateString()}</div>
              <p className="text-xs text-gray-600">
                {mission.createdAt.toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
              <Brain className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{mission.updatedAt.toLocaleDateString()}</div>
              <p className="text-xs text-gray-600">
                {mission.updatedAt.toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agents</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-gray-600">
                Active agents
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="agent-chat">Agent Chat</TabsTrigger>
            <TabsTrigger value="prompt-opt">Prompt Opt</TabsTrigger>
            <TabsTrigger value="report">Research Report</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mission Overview</CardTitle>
                <CardDescription>
                  Summary and key information about this research mission
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-gray-600">{mission.description}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Mission Configuration</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-sm text-gray-700">
                        {mission.config || 'Default configuration'}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Timeline</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Created:</span>
                        <span>{mission.createdAt.toLocaleString()}</span>
                      </div>
                      {mission.updatedAt !== mission.createdAt && (
                        <div className="flex justify-between text-sm">
                          <span>Last Updated:</span>
                          <span>{mission.updatedAt.toLocaleString()}</span>
                        </div>
                      )}
                      {mission.completedAt && (
                        <div className="flex justify-between text-sm">
                          <span>Completed:</span>
                          <span>{mission.completedAt.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mission Progress</CardTitle>
                <CardDescription>
                  Detailed progress tracking for each phase of the mission
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2">Overall Progress</h4>
                    <Progress value={getProgressValue(mission.status)} />
                    <p className="text-sm text-gray-600 mt-2">
                      {getProgressValue(mission.status)}% complete
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-4">Phase Progress</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Planning</span>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <Progress value={mission.status !== MissionStatus.CREATED ? 100 : 0} />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Research</span>
                          {mission.status === MissionStatus.RESEARCHING ? (
                            <Clock className="h-4 w-4 text-blue-600" />
                          ) : mission.status === MissionStatus.COMPLETED || mission.status === MissionStatus.WRITING ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <Progress 
                          value={
                            mission.status === MissionStatus.RESEARCHING ? 60 :
                            mission.status === MissionStatus.WRITING || mission.status === MissionStatus.COMPLETED ? 100 : 0
                          } 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Writing</span>
                          {mission.status === MissionStatus.WRITING ? (
                            <Clock className="h-4 w-4 text-blue-600" />
                          ) : mission.status === MissionStatus.COMPLETED ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <Progress 
                          value={
                            mission.status === MissionStatus.WRITING ? 85 :
                            mission.status === MissionStatus.COMPLETED ? 100 : 0
                          } 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Review</span>
                          {mission.status === MissionStatus.COMPLETED ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <Progress value={mission.status === MissionStatus.COMPLETED ? 100 : 0} />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Agent Status</CardTitle>
                <CardDescription>
                  Current status and activity of all AI agents working on this mission
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Target className="h-5 w-5" />
                      <div>
                        <div className="font-medium">Planning Agent</div>
                        <div className="text-sm text-gray-600">Creates research strategy</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {mission.status !== MissionStatus.CREATED ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <Badge className={
                        mission.status !== MissionStatus.CREATED 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }>
                        {mission.status !== MissionStatus.CREATED ? 'Completed' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Brain className="h-5 w-5" />
                      <div>
                        <div className="font-medium">Research Agent</div>
                        <div className="text-sm text-gray-600">Gathers and analyzes information</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {mission.status === MissionStatus.RESEARCHING ? (
                        <Clock className="h-4 w-4 text-blue-600" />
                      ) : mission.status === MissionStatus.WRITING || mission.status === MissionStatus.COMPLETED ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <Badge className={
                        mission.status === MissionStatus.RESEARCHING 
                          ? 'bg-blue-100 text-blue-800' 
                          : mission.status === MissionStatus.WRITING || mission.status === MissionStatus.COMPLETED 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }>
                        {mission.status === MissionStatus.RESEARCHING ? 'Active' :
                         mission.status === MissionStatus.WRITING || mission.status === MissionStatus.COMPLETED ? 'Completed' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5" />
                      <div>
                        <div className="font-medium">Writing Agent</div>
                        <div className="text-sm text-gray-600">Generates reports and documentation</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {mission.status === MissionStatus.WRITING ? (
                        <Clock className="h-4 w-4 text-blue-600" />
                      ) : mission.status === MissionStatus.COMPLETED ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <Badge className={
                        mission.status === MissionStatus.WRITING 
                          ? 'bg-blue-100 text-blue-800' 
                          : mission.status === MissionStatus.COMPLETED 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }>
                        {mission.status === MissionStatus.WRITING ? 'Active' :
                         mission.status === MissionStatus.COMPLETED ? 'Completed' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5" />
                      <div>
                        <div className="font-medium">Reflection Agent</div>
                        <div className="text-sm text-gray-600">Reviews and ensures quality</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {mission.status === MissionStatus.COMPLETED ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <Badge className={
                        mission.status === MissionStatus.COMPLETED 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }>
                        {mission.status === MissionStatus.COMPLETED ? 'Completed' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agent-chat" className="space-y-6">
            <Card className="h-[calc(100vh-12rem)]">
              <CardHeader className="pb-4">
                <CardTitle>Agent Chat</CardTitle>
                <CardDescription>
                  Control AI agents step-by-step to build your research report
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-8rem)]">
                <AgentChat
                  messages={messages}
                  agents={agents}
                  selectedAgent={selectedAgent}
                  onAgentSelect={handleAgentSelect}
                  onAgentExecute={handleAgentExecute}
                  availableFiles={[...files, ...availableFiles]}
                  generatedFiles={generatedFiles}
                  isLoading={isChatLoading}
                  onFileSelect={handleFileSelect}
                  placeholder="Select an agent and type instructions... Use @ to reference files"
                  className="h-full border-0 rounded-none"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prompt-opt" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Prompt Optimization</CardTitle>
                <CardDescription>
                  Optimize AI prompts using genetic-evolutionary algorithms for this mission
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Prompt Optimization</h3>
                    <p className="text-gray-600 mb-4">
                      Use GEPA to optimize prompts for better research results
                    </p>
                    <Button>Start Optimization</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="report" className="space-y-6">
            {researchReport ? (
              <div className="space-y-6">
                {/* Report Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl">{researchReport.title}</CardTitle>
                        <CardDescription className="mt-2">
                          Comprehensive research report generated by AI agents
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => exportToMarkdown(researchReport)}>
                          <Download className="h-4 w-4 mr-2" />
                          Export MD
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => exportToPDF(researchReport)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Export PDF
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{researchReport.metadata.wordCount.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">Words</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{formatReadingTime(researchReport.metadata.readingTime)}</div>
                        <div className="text-sm text-gray-600">Reading Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{researchReport.sections.length}</div>
                        <div className="text-sm text-gray-600">Sections</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className={
                        researchReport.status === ReportStatus.FINAL ? 'bg-green-100 text-green-800' :
                        researchReport.status === ReportStatus.DRAFT ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }>
                        {researchReport.status}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        Last updated: {researchReport.updatedAt.toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Abstract */}
                <Card>
                  <CardHeader>
                    <CardTitle>Abstract</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">{researchReport.abstract}</p>
                  </CardContent>
                </Card>

                {/* Key Findings */}
                {researchReport.keyFindings.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Key Findings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {researchReport.keyFindings.map((finding, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700">{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Data Points */}
                {researchReport.dataPoints.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Key Data Points</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {researchReport.dataPoints.map((dataPoint) => (
                          <div key={dataPoint.id} className="p-4 border rounded-lg">
                            <div className="text-2xl font-bold text-blue-600 mb-1">
                              {dataPoint.value}{dataPoint.unit && ` ${dataPoint.unit}`}
                            </div>
                            <div className="text-sm font-medium text-gray-800 mb-1">{dataPoint.label}</div>
                            <div className="text-xs text-gray-600">{dataPoint.source}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Report Sections */}
                <Card>
                  <CardHeader>
                    <CardTitle>Report Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      {researchReport.sections.map((section) => renderSection(section))}
                    </div>
                  </CardContent>
                </Card>

                {/* References */}
                {researchReport.references.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>References</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {researchReport.references.map((reference) => (
                          <div key={reference.id} className="text-sm">
                            <span className="font-medium">{reference.authors.join(', ')} </span>
                            <span>({reference.year}). </span>
                            <span className="italic">{reference.title}. </span>
                            <span>{reference.source}.</span>
                            {reference.publisher && <span> {reference.publisher}.</span>}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quality Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Report Quality Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <div className="text-sm font-medium text-gray-800 mb-1">Coherence</div>
                        <div className="flex items-center gap-2">
                          <Progress value={researchReport.metadata.qualityMetrics.coherence * 100} className="flex-1" />
                          <span className="text-sm text-gray-600">{Math.round(researchReport.metadata.qualityMetrics.coherence * 100)}%</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800 mb-1">Completeness</div>
                        <div className="flex items-center gap-2">
                          <Progress value={researchReport.metadata.qualityMetrics.completeness * 100} className="flex-1" />
                          <span className="text-sm text-gray-600">{Math.round(researchReport.metadata.qualityMetrics.completeness * 100)}%</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800 mb-1">Accuracy</div>
                        <div className="flex items-center gap-2">
                          <Progress value={researchReport.metadata.qualityMetrics.accuracy * 100} className="flex-1" />
                          <span className="text-sm text-gray-600">{Math.round(researchReport.metadata.qualityMetrics.accuracy * 100)}%</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800 mb-1">Relevance</div>
                        <div className="flex items-center gap-2">
                          <Progress value={researchReport.metadata.qualityMetrics.relevance * 100} className="flex-1" />
                          <span className="text-sm text-gray-600">{Math.round(researchReport.metadata.qualityMetrics.relevance * 100)}%</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800 mb-1">Clarity</div>
                        <div className="flex items-center gap-2">
                          <Progress value={researchReport.metadata.qualityMetrics.clarity * 100} className="flex-1" />
                          <span className="text-sm text-gray-600">{Math.round(researchReport.metadata.qualityMetrics.clarity * 100)}%</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800 mb-1">Structure</div>
                        <div className="flex items-center gap-2">
                          <Progress value={researchReport.metadata.qualityMetrics.structure * 100} className="flex-1" />
                          <span className="text-sm text-gray-600">{Math.round(researchReport.metadata.qualityMetrics.structure * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Research Report Available</h3>
                  <p className="text-gray-600 text-center mb-4">
                    {mission?.status === MissionStatus.COMPLETED 
                      ? 'The research report is being generated...' 
                      : 'Research reports are available once missions are completed.'
                    }
                  </p>
                  {mission?.status !== MissionStatus.COMPLETED && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Mission In Progress
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mission Results</CardTitle>
                <CardDescription>
                  Research findings, reports, and outputs from this mission
                </CardDescription>
              </CardHeader>
              <CardContent>
                {mission.status === MissionStatus.COMPLETED ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800">Mission Completed Successfully</span>
                      </div>
                      <p className="text-sm text-green-700">
                        This research mission has been completed and all outputs are ready for review.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Generated Reports</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm font-medium">Research Report</span>
                          </div>
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm font-medium">Executive Summary</span>
                          </div>
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Key Findings</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li>• Comprehensive analysis of research topic completed</li>
                          <li>• Multiple sources analyzed and synthesized</li>
                          <li>• Key insights and recommendations generated</li>
                          <li>• Quality assurance and review completed</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Mission in Progress</h3>
                    <p className="text-gray-600">
                      Results will be available once the mission is completed.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
    </ChatProvider>
  );
}