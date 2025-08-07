export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  attachments?: ChatAttachment[]
  metadata?: Record<string, any>
  agentId?: string
  agentName?: string
  agentIcon?: string
}

export interface ChatAttachment {
  id: string
  name: string
  type: string
  size: number
  url?: string
  content?: string
}

export interface ChatFile {
  id: string
  name: string
  type: string
  size: number
  url?: string
  content?: string
  uploadedAt: Date
  source: 'upload' | 'generated'
  generatedBy?: string // Agent name if generated
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  files: ChatFile[]
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, any>
}

export interface AgentType {
  id: string
  name: string
  description: string
  color: string
  icon: string
}

export interface AgentExecution {
  id: string
  agentId: string
  message: string
  files: string[] // file IDs
  output: string
  outputFiles: string[] // generated file IDs
  timestamp: Date
  duration: number
}

export interface ChatAction {
  id: string
  label: string
  icon?: string
  onClick: () => void
  disabled?: boolean
}

export interface FileSuggestion {
  file: ChatFile
  matchScore: number
}

export interface BaseChatProps {
  messages: ChatMessage[]
  onSendMessage: (message: string, attachments?: File[]) => void
  isLoading?: boolean
  placeholder?: string
  showFileUpload?: boolean
  customActions?: ChatAction[]
  onFileSelect?: (files: File[]) => void
  availableFiles?: ChatFile[]
  className?: string
  onInputChange?: (value: string) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  inputRef?: React.RefObject<HTMLInputElement>
  value?: string
}

export interface AgentChatProps extends Omit<BaseChatProps, 'onSendMessage'> {
  agents: AgentType[]
  selectedAgent: AgentType | null
  onAgentSelect: (agent: AgentType) => void
  onAgentExecute: (agent: AgentType, message: string, files: File[]) => void
  generatedFiles: ChatFile[]
}

export interface DocumentChatProps extends Omit<BaseChatProps, 'onSendMessage'> {
  document: any
  onDocumentUpdate: (updates: Partial<any>) => void
  contextFiles: ChatFile[]
}