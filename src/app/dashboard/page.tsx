'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Zap, 
  BarChart3, 
  Clock, 
  TrendingUp,
  Plus,
  Play,
  MessageSquare
} from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { ResearchMission, OptimizationSession, mockMissions, mockOptimizations } from '@/lib/types';

export default function Dashboard() {
  const router = useRouter();
  const [recentMissions, setRecentMissions] = useState<ResearchMission[]>([]);
  const [recentOptimizations, setRecentOptimizations] = useState<OptimizationSession[]>([]);

  useEffect(() => {
    // Use mock data
    setRecentMissions(mockMissions.slice(0, 2));
    setRecentOptimizations(mockOptimizations.slice(0, 2));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'RESEARCHING':
      case 'RUNNING':
        return 'bg-blue-100 text-blue-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    totalMissions: mockMissions.length,
    completedMissions: mockMissions.filter(m => m.status === 'COMPLETED').length,
    totalOptimizations: mockOptimizations.length,
    completedOptimizations: mockOptimizations.filter(o => o.status === 'COMPLETED').length,
  };

  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Welcome to your AI Research Assistant
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Research Missions</CardTitle>
              <FileText className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMissions}</div>
              <p className="text-xs text-gray-600">
                {stats.completedMissions} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Optimizations</CardTitle>
              <Zap className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOptimizations}</div>
              <p className="text-xs text-gray-600">
                {stats.completedOptimizations} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((stats.completedMissions / stats.totalMissions) * 100)}%
              </div>
              <p className="text-xs text-gray-600">
                Mission completion
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Clock className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-gray-600">
                Currently running
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Research Missions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Missions</CardTitle>
                  <CardDescription>Your latest research activities</CardDescription>
                </div>
                <Button size="sm" onClick={() => router.push('/research')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentMissions.map((mission) => (
                  <div key={mission.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{mission.title}</h4>
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {mission.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getStatusColor(mission.status)}>
                          {mission.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {mission.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {mission.status === 'CREATED' && (
                      <Button size="sm" variant="outline">
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Optimizations */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Optimizations</CardTitle>
                  <CardDescription>Recent optimization sessions</CardDescription>
                </div>
                <Button size="sm" onClick={() => router.push('/optimization')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOptimizations.map((session) => (
                  <div key={session.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{session.moduleId}</h4>
                      <Badge className={getStatusColor(session.status)}>
                        {session.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Best Fitness:</span>
                        <span className="font-medium">{session.bestFitness?.toFixed(3) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Generations:</span>
                        <span className="font-medium">{session.generationsCompleted}/5</span>
                      </div>
                      {session.status === 'RUNNING' && (
                        <Progress value={(session.generationsCompleted / 5) * 100} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Test Button */}
            <div className="mb-4">
              <button 
                onClick={() => alert('Test button works!')}
                style={{padding: '10px', background: 'blue', color: 'white', border: 'none', borderRadius: '5px'}}
              >
                Test Button (Native HTML)
              </button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-4">
              <Button className="h-20 flex-col" variant="outline" onClick={() => {
                console.log('Start Research button clicked');
                router.push('/research');
              }}>
                <FileText className="h-6 w-6 mb-2" />
                Start Research
              </Button>
              <Button className="h-20 flex-col" variant="outline" onClick={() => {
                console.log('Optimize Prompts button clicked');
                router.push('/optimization');
              }}>
                <Zap className="h-6 w-6 mb-2" />
                Optimize Prompts
              </Button>
              <Button className="h-20 flex-col" variant="outline" onClick={() => {
                console.log('Chat with Agents button clicked');
                router.push('/chat');
              }}>
                <MessageSquare className="h-6 w-6 mb-2" />
                Chat with Agents
              </Button>
              <Button className="h-20 flex-col" variant="outline" onClick={() => {
                console.log('View Progress button clicked');
                router.push('/dashboard');
              }}>
                <BarChart3 className="h-6 w-6 mb-2" />
                View Progress
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}