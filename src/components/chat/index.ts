export { BaseChat } from './BaseChat'
export { AgentChat } from './AgentChat'
export { DocumentChat } from './DocumentChat'
export { ChatProvider, useChat } from '@/lib/chat/context'
export { useFileManager } from '@/lib/chat/fileManager'
export type {
  ChatMessage,
  ChatAttachment,
  ChatFile,
  ChatSession,
  AgentType,
  AgentExecution,
  ChatAction,
  FileSuggestion,
  BaseChatProps,
  AgentChatProps,
  DocumentChatProps
} from '@/types/chat'