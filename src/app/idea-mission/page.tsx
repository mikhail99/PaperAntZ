'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Users,
  Target,
  Brain,
  Lightbulb,
  FolderOpen
} from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { IdeaMission, MissionStatus } from '@/lib/types';
import { ideaService } from '@/lib/services/idea-service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { documentService } from '@/lib/services/document-service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

export default function IdeaMissionPage() {
  const router = useRouter();
  const [missions, setMissions] = useState<IdeaMission[]>([]);
  const [documentGroups, setDocumentGroups] = useState<any[]>([]);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMission, setNewMission] = useState({
    title: '',
    description: '',
    documentGroupIds: [] as string[],
  });

  useEffect(() => {
    // Load persisted missions
    (async () => {
      try {
        const data = await ideaService.list('demo-user');
        // Map DTO to UI shape (convert dates)
        const missions: IdeaMission[] = data.map(d => ({
          id: d.id,
          title: d.title,
          description: d.description,
          status: (d.status as MissionStatus) || MissionStatus.CREATED,
          documentGroupIds: d.documentGroupIds || [],
          createdAt: new Date(d.createdAt),
          updatedAt: new Date(d.updatedAt),
          completedAt: d.completedAt ? new Date(d.completedAt) : undefined,
        }));
        setMissions(missions);
      } catch (e) {
        console.error('Failed to load idea missions', e);
      }
    })();
    // Load document groups for selection
    (async () => {
      try {
        const response = await documentService.getUserDocumentGroups('demo-user');
        const groups = (response as any).data || response;
        setDocumentGroups(groups || []);
        setGroupsError(null);
      } catch (e) {
        console.error('Failed to load document groups', e);
        setDocumentGroups([]);
        setGroupsError('Document Groups could not be loaded. Ensure the database/backend is running.');
      }
    })();
  }, []);

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

  // Helpers to show linked group names on cards
  const getGroupLabel = (ids: string[] | undefined) => {
    const list = ids || []
    if (list.length === 0) return ''
    const names = list
      .map(id => documentGroups.find(g => g.id === id)?.name)
      .filter(Boolean) as string[]
    if (names.length === 1) return names[0]
    if (names.length > 1) return `${names[0]} +${names.length - 1}`
    // Fallback if names not found
    return `${list.length} group${list.length > 1 ? 's' : ''}`
  }

  const handleExecuteMission = async (missionId: string) => {
    setIsLoading(true);
    // Simulate mission execution
    setTimeout(() => {
      setMissions(prev => prev.map(m => 
        m.id === missionId ? { ...m, status: MissionStatus.RESEARCHING } : m
      ));
      setIsLoading(false);
    }, 2000);
  };

  const handleCreateMission = async () => {
    if (!newMission.title.trim()) return;
    try {
      const created = await ideaService.create({
        userId: 'demo-user',
        title: newMission.title,
        description: newMission.description,
        documentGroupIds: newMission.documentGroupIds,
        documentGroupId: newMission.documentGroupIds[0],
      });
      const mission: IdeaMission = {
        id: created.id,
        title: created.title,
        description: created.description,
        status: (created.status as MissionStatus) || MissionStatus.CREATED,
        documentGroupIds: created.documentGroupIds || [],
        createdAt: new Date(created.createdAt),
        updatedAt: new Date(created.updatedAt),
        completedAt: created.completedAt ? new Date(created.completedAt) : undefined,
      };
      setMissions(prev => [mission, ...prev]);
      setNewMission({ title: '', description: '', documentGroupIds: [] });
      setIsDialogOpen(false);
    } catch (e) {
      console.error('Failed to create idea mission', e);
    }
  };

  const activeMission = missions.find(m => m.status === MissionStatus.RESEARCHING || m.status === MissionStatus.WRITING);

  // RAG-style single-select combobox for document group
  const handleSelectGroup = (groupId: string) => {
    setNewMission(prev => ({ ...prev, documentGroupIds: groupId ? [groupId] : [] }));
  };

  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Idea Mission</h1>
          <p className="text-gray-600">
            Manage and develop your innovative ideas and concepts
          </p>
        </div>

        <Tabs defaultValue="missions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="missions">Ideas</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
          </TabsList>

          <TabsContent value="missions" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Idea Missions</h2>
                <p className="text-gray-600">
                  Your innovative ideas and their development status
                </p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Idea
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Idea Mission</DialogTitle>
                    <DialogDescription>
                      Create a new idea mission to develop your innovative concept.
                    </DialogDescription>
                  </DialogHeader>
                  {groupsError && (
                    <Alert variant="destructive">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      <AlertTitle>Document Groups unavailable</AlertTitle>
                      <AlertDescription>
                        {groupsError}
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="title" className="text-right">
                        Title
                      </Label>
                      <Input
                        id="title"
                        value={newMission.title}
                        onChange={(e) => setNewMission(prev => ({ ...prev, title: e.target.value }))}
                        className="col-span-3"
                        placeholder="Enter idea title"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={newMission.description}
                        onChange={(e) => setNewMission(prev => ({ ...prev, description: e.target.value }))}
                        className="col-span-3"
                        placeholder="Describe your idea"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Document Group</Label>
                      <div className="col-span-3">
                        <Select 
                          value={newMission.documentGroupIds[0] ?? undefined}
                          onValueChange={handleSelectGroup}
                          disabled={!!groupsError}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={groupsError ? 'Unavailable' : 'Select group'} />
                          </SelectTrigger>
                          <SelectContent>
                            {documentGroups.map((group) => (
                              <SelectItem key={group.id} value={group.id}>
                                <div className="flex items-center gap-2">
                                  <FolderOpen className="h-4 w-4 text-gray-500" />
                                  {group.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateMission} disabled={!!groupsError && newMission.documentGroupIds.length === 0}>
                      Create Idea
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {missions.map((mission) => (
                <Card key={mission.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{mission.title}</CardTitle>
                      {getStatusIcon(mission.status)}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {mission.description}
                    </CardDescription>
                    {mission.documentGroupIds && mission.documentGroupIds.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <FolderOpen className="h-3 w-3" />
                          {getGroupLabel(mission.documentGroupIds)}
                        </Badge>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(mission.status)}>
                          {mission.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {mission.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      
                      {mission.documentGroupIds && mission.documentGroupIds.length > 0 && (
                        <div className="text-xs text-gray-600">
                          Linked to {getGroupLabel(mission.documentGroupIds)}
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress:</span>
                          <span className="font-medium">
                            {mission.status === 'COMPLETED' ? '100%' :
                             mission.status === 'RESEARCHING' ? '60%' :
                             mission.status === 'WRITING' ? '85%' : '0%'}
                          </span>
                        </div>
                        <Progress 
                          value={
                            mission.status === 'COMPLETED' ? 100 :
                            mission.status === 'RESEARCHING' ? 60 :
                            mission.status === 'WRITING' ? 85 : 0
                          } 
                        />
                      </div>

                      <Button 
                        className="w-full" 
                        onClick={() => router.push(`/idea-mission/${mission.id}`)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Open
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Active Idea</h2>
              <p className="text-gray-600">
                Real-time progress of currently developing ideas
              </p>
            </div>

            {activeMission ? (
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{activeMission.title}</CardTitle>
                      <Badge className={getStatusColor(activeMission.status)}>
                        {activeMission.status}
                      </Badge>
                    </div>
                    <CardDescription>{activeMission.description}</CardDescription>
                    {activeMission.documentGroupIds && activeMission.documentGroupIds.length > 0 && (
                      <Badge variant="outline" className="w-fit flex items-center gap-1">
                        <FolderOpen className="h-3 w-3" />
                        {activeMission.documentGroupIds.length} group{activeMission.documentGroupIds.length > 1 ? 's' : ''}
                      </Badge>
                    )}
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
                            <Clock className="h-4 w-4 text-blue-600" />
                          </div>
                          <Progress value={60} />
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Prototype Development</span>
                            <AlertCircle className="h-4 w-4 text-gray-400" />
                          </div>
                          <Progress value={0} />
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
                            Analyzing market potential and gathering insights for idea validation...
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Development Status</CardTitle>
                    <CardDescription>Current status of idea development</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          <span className="text-sm font-medium">Conceptualization</span>
                        </div>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4" />
                          <span className="text-sm font-medium">Research</span>
                        </div>
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm font-medium">Prototype</span>
                        </div>
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Lightbulb className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Ideas</h3>
                  <p className="text-gray-600 text-center mb-4">
                    Start developing a new idea to see real-time progress here
                  </p>
                  <Button onClick={() => router.push('/idea-mission')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Start New Idea
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
