'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  FileText, 
  Zap, 
  Library,
  ArrowRight,
  Sparkles,
  MessageSquare
} from 'lucide-react';

export default function Home() {
  const router = useRouter();

  const features = [
    {
      icon: FileText,
      title: 'Research Missions',
      description: 'Create and manage research projects with AI agents',
      action: () => router.push('/research')
    },
    {
      icon: Library,
      title: 'Document Library',
      description: 'Organize and analyze your research documents',
      action: () => router.push('/documents')
    },
    {
      icon: BarChart3,
      title: 'Dashboard',
      description: 'Track performance and gain insights from your research',
      action: () => router.push('/dashboard')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Sparkles className="h-12 w-12 text-blue-600 mr-4" />
            <h1 className="text-5xl font-bold tracking-tight text-gray-900">
              AI Research Assistant
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Advanced research platform powered by GEPA (Genetic-Evolutionary Prompt Architecture) 
            and intelligent multi-agent systems. Optimize prompts, automate research, and generate 
            comprehensive reports with AI.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => {
              console.log('Get Started button clicked');
              router.push('/dashboard');
            }}>
              Get Started
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => {
              console.log('Learn More button clicked');
            }}>
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {
              console.log(`${feature.title} card clicked`);
              feature.action();
            }}>
              <CardHeader className="text-center">
                <feature.icon className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Capabilities Section */}
        <div className="grid gap-12 lg:grid-cols-2 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                GEPA Optimization
              </CardTitle>
              <CardDescription>
                Genetic-Evolutionary Prompt Architecture for continuous improvement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Natural language reflection-based optimization</li>
                <li>• Population-based genetic algorithms</li>
                <li>• Multi-objective fitness evaluation</li>
                <li>• Real-time performance tracking</li>
                <li>• Automated prompt improvement cycles</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Multi-Agent Research
              </CardTitle>
              <CardDescription>
                Collaborative AI agents for comprehensive research workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Planning agents for research strategy</li>
                <li>• Research agents for information gathering</li>
                <li>• Reflection agents for quality assurance</li>
                <li>• Writing agents for report generation</li>
                <li>• Coordination agents for workflow management</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="grid gap-6 md:grid-cols-4 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">85%</div>
            <div className="text-sm text-gray-600">Average Performance Improvement</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">35x</div>
            <div className="text-sm text-gray-600">Faster Optimization</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">4+</div>
            <div className="text-sm text-gray-600">Specialized AI Agents</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
            <div className="text-sm text-gray-600">Research Automation</div>
          </div>
        </div>
      </div>
    </div>
  );
}