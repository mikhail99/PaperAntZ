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
  Zap, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  BarChart3,
  Settings,
  Target
} from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { OptimizationSession, PromptParameter, mockOptimizations, mockParameters, OptimizationStatus } from '@/lib/types';

export default function OptimizationLab() {
  const router = useRouter();
  const [sessions, setSessions] = useState<OptimizationSession[]>([]);
  const [parameters, setParameters] = useState<PromptParameter[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    // Use mock data
    setSessions(mockOptimizations);
    setParameters(mockParameters);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'RUNNING':
        return 'bg-blue-100 text-blue-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'RUNNING':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleStartOptimization = async (sessionId: string) => {
    setIsOptimizing(true);
    // Simulate optimization start
    setTimeout(() => {
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, status: OptimizationStatus.RUNNING } : s
      ));
      setIsOptimizing(false);
    }, 2000);
  };

  const activeSession = sessions.find(s => s.status === OptimizationStatus.RUNNING);

  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Prompt Optimization Lab</h1>
          <p className="text-gray-600">
            Optimize your AI prompts using genetic-evolutionary algorithms
          </p>
        </div>

        <Tabs defaultValue="sessions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Optimization Sessions</h2>
                <p className="text-gray-600">
                  Track and manage your prompt optimization sessions
                </p>
              </div>
              <Button onClick={() => router.push('/optimization')}>
                <Plus className="h-4 w-4 mr-2" />
                New Session
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {sessions.map((session) => (
                <Card key={session.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{session.moduleId}</CardTitle>
                      {getStatusIcon(session.status)}
                    </div>
                    <CardDescription>
                      GEPA Optimization Session
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(session.status)}>
                          {session.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {session.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Best Fitness:</span>
                          <span className="font-medium">
                            {session.bestFitness?.toFixed(3) || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Progress:</span>
                          <span className="font-medium">
                            {session.generationsCompleted}/5
                          </span>
                        </div>
                        {session.status === 'RUNNING' && (
                          <Progress value={(session.generationsCompleted / 5) * 100} />
                        )}
                      </div>

                      {session.status === 'CREATED' && (
                        <Button 
                          className="w-full" 
                          onClick={() => handleStartOptimization(session.id)}
                          disabled={isOptimizing}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Optimization
                        </Button>
                      )}
                      
                      {session.status === 'COMPLETED' && (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => console.log('View results for session:', session.id)}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View Results
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="parameters" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Prompt Parameters</h2>
              <p className="text-gray-600">
                Manage and optimize your AI prompt parameters
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {parameters.map((parameter) => (
                <Card key={parameter.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{parameter.name}</CardTitle>
                      <Badge 
                        className={
                          parameter.state === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }
                      >
                        {parameter.state}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {parameter.module}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Current Prompt</h4>
                        <p className="text-xs text-gray-600 line-clamp-3">
                          {parameter.value}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" onClick={() => console.log('Optimize parameter:', parameter.id)}>
                          <Zap className="h-3 w-3 mr-1" />
                          Optimize
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => console.log('Settings for parameter:', parameter.id)}>
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}