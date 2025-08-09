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
  metadata?: Record<string, any>
}

export interface FileContext {
  id: string
  name: string
  prompt?: string
  url?: string
}

export interface FileSelectionState {
  id: string
  name: string
  selected: boolean
  prompt?: string
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
  baseType?: string // if this is a mission-scoped preset, reference the base agent id
  temperature?: number
  systemPrompt?: string
  styleLevel?: number // 0-100, brief->verbose
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
  onMessageAction?: (message: ChatMessage, action: 'like' | 'dislike' | 'save') => void
}

export interface AgentChatProps extends Omit<BaseChatProps, 'onSendMessage'> {
  agents: AgentType[]
  selectedAgent: AgentType | null
  onAgentSelect: (agent: AgentType) => void
  onAgentExecute: (agent: AgentType, message: string, files: FileContext[]) => void
  generatedFiles: ChatFile[]
  onFileRename?: (fileId: string, newName: string) => void
  onFileDelete?: (fileId: string) => void
  onAddTextFile?: () => void
  onFileEdit?: (fileId: string) => void
  onFileContextChange?: (items: FileSelectionState[]) => void
}

export interface DocumentChatProps extends Omit<BaseChatProps, 'onSendMessage'> {
  document: any
  onDocumentUpdate: (updates: Partial<any>) => void
  contextFiles: ChatFile[]
}