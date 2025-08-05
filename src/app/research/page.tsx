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
  Brain
} from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { ResearchMission, mockMissions, MissionStatus } from '@/lib/types';

export default function ResearchWorkspace() {
  const router = useRouter();
  const [missions, setMissions] = useState<ResearchMission[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Use mock data
    setMissions(mockMissions);
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

  const activeMission = missions.find(m => m.status === MissionStatus.RESEARCHING || m.status === MissionStatus.WRITING);

  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Research Workspace</h1>
          <p className="text-gray-600">
            Manage and execute your research missions
          </p>
        </div>

        <Tabs defaultValue="missions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="missions">Missions</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
          </TabsList>

          <TabsContent value="missions" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Research Missions</h2>
                <p className="text-gray-600">
                  Your research projects and their current status
                </p>
              </div>
              <Button onClick={() => router.push('/research')}>
                <Plus className="h-4 w-4 mr-2" />
                New Mission
              </Button>
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

                      {(mission.status === 'CREATED' || mission.status === 'PLANNING') ? (
                        <Button 
                          className="w-full" 
                          onClick={() => handleExecuteMission(mission.id)}
                          disabled={isLoading}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Execute Mission
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => router.push(`/research/${mission.id}`)}
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Active Mission</h2>
              <p className="text-gray-600">
                Real-time progress of currently running research missions
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
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium mb-2">Research Progress</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Planning</span>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                          <Progress value={100} />
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Research</span>
                            <Clock className="h-4 w-4 text-blue-600" />
                          </div>
                          <Progress value={60} />
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Writing</span>
                            <AlertCircle className="h-4 w-4 text-gray-400" />
                          </div>
                          <Progress value={0} />
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Current Activity</h4>
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Brain className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-900">Research Agent</span>
                          </div>
                          <p className="text-sm text-blue-800">
                            Gathering information from document sources and analyzing key findings...
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Agent Status</CardTitle>
                    <CardDescription>Current status of all agents</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          <span className="text-sm font-medium">Planning</span>
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
                          <span className="text-sm font-medium">Writing</span>
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
                  <Clock className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Missions</h3>
                  <p className="text-gray-600 text-center mb-4">
                    Start a new research mission to see real-time progress here
                  </p>
                  <Button onClick={() => router.push('/research')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Start New Mission
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