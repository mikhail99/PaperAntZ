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
import { IdeaMission, mockIdeaMissions, MissionStatus } from '@/lib/types';

export default function IdeaMissionDetail() {
  const params = useParams();
  const router = useRouter();
  const missionId = params.id as string;
  const [mission, setMission] = useState<IdeaMission | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Find the mission from mock data
    const foundMission = mockIdeaMissions.find(m => m.id === missionId);
    if (foundMission) {
      setMission(foundMission);
    }
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
            <TabsTrigger value="development">Development</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
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

          <TabsContent value="development" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Development Timeline</CardTitle>
                <CardDescription>
                  Track the development stages of your idea
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Conceptualization</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Initial idea formation and concept development
                      </p>
                      <span className="text-xs text-gray-500">
                        {mission.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      mission.status === 'RESEARCHING' || mission.status === 'COMPLETED' 
                        ? 'bg-blue-100' 
                        : 'bg-gray-100'
                    }`}>
                      {mission.status === 'RESEARCHING' || mission.status === 'COMPLETED' ? (
                        <Brain className="h-4 w-4 text-blue-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Research & Analysis</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Market research, feasibility analysis, and validation
                      </p>
                      {mission.status === 'RESEARCHING' && (
                        <span className="text-xs text-blue-600">In Progress</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      mission.status === 'COMPLETED' 
                        ? 'bg-green-100' 
                        : 'bg-gray-100'
                    }`}>
                      {mission.status === 'COMPLETED' ? (
                        <FileText className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Prototype Development</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Creating initial prototypes and testing
                      </p>
                    </div>
                  </div>
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
      </div>
    </MainLayout>
  );
}
