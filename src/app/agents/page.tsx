'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AgentType } from '@/types/chat'
import { TargetIcon, BrainIcon, FileEditIcon, UsersIcon, ArrowLeft } from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'

const AGENTS: AgentType[] = [
  { id: 'planning', name: 'Planning Agent', description: 'Shapes idea development plan', color: 'blue', icon: 'target' },
  { id: 'research', name: 'Research Agent', description: 'Analyzes market and feasibility', color: 'green', icon: 'brain' },
  { id: 'writing', name: 'Writing Agent', description: 'Drafts reports and sections', color: 'purple', icon: 'file-edit' },
  { id: 'review', name: 'Review Agent', description: 'Reviews and refines outputs', color: 'orange', icon: 'users' },
]

const iconFor = (icon: string) => {
  switch (icon) {
    case 'target': return <TargetIcon className="h-6 w-6 text-blue-600" />
    case 'brain': return <BrainIcon className="h-6 w-6 text-green-600" />
    case 'file-edit': return <FileEditIcon className="h-6 w-6 text-purple-600" />
    case 'users': return <UsersIcon className="h-6 w-6 text-orange-600" />
    default: return <TargetIcon className="h-6 w-6" />
  }
}

export default function AgentsPage() {
  const router = useRouter()

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Agents Marketplace</h1>
            <p className="text-gray-600">Discover, customize, and pick agents for your workflows</p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((a) => (
            <Card key={a.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center gap-3">
                {iconFor(a.icon)}
                <div>
                  <CardTitle className="text-lg">{a.name}</CardTitle>
                  <p className="text-sm text-gray-600">{a.description}</p>
                </div>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                <Button onClick={() => {
                  localStorage.setItem('agent_selected', JSON.stringify(a))
                  router.back()
                }}>Use</Button>
                <Button variant="outline" onClick={() => {
                  localStorage.setItem('agent_customize_target', a.id)
                  router.back()
                }}>Customize</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  )
}


