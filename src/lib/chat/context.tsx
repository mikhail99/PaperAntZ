'use client'

import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { ChatMessage, ChatFile, ChatSession, AgentType } from '@/types/chat'

interface ChatState {
  messages: ChatMessage[]
  files: ChatFile[]
  isLoading: boolean
  currentAgent: AgentType | null
  session: ChatSession | null
}

type ChatAction =
  | { type: 'ADD_MESSAGE'; message: ChatMessage }
  | { type: 'SET_MESSAGES'; messages: ChatMessage[] }
  | { type: 'ADD_FILE'; file: ChatFile }
  | { type: 'SET_FILES'; files: ChatFile[] }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_AGENT'; agent: AgentType | null }
  | { type: 'SET_SESSION'; session: ChatSession }
  | { type: 'CLEAR_CHAT' }

const initialState: ChatState = {
  messages: [],
  files: [],
  isLoading: false,
  currentAgent: null,
  session: null,
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.message],
        updatedAt: new Date(),
      }
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.messages,
      }
    case 'ADD_FILE':
      return {
        ...state,
        files: [...state.files, action.file],
      }
    case 'SET_FILES':
      return {
        ...state,
        files: action.files,
      }
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.loading,
      }
    case 'SET_AGENT':
      return {
        ...state,
        currentAgent: action.agent,
      }
    case 'SET_SESSION':
      return {
        ...state,
        session: action.session,
      }
    case 'CLEAR_CHAT':
      return initialState
    default:
      return state
  }
}

interface ChatContextValue extends ChatState {
  sendMessage: (message: string, attachments?: File[]) => void
  addFile: (file: ChatFile) => void
  setFiles: (files: ChatFile[]) => void
  setLoading: (loading: boolean) => void
  selectAgent: (agent: AgentType | null) => void
  setSession: (session: ChatSession) => void
  clearChat: () => void
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState)

  const sendMessage = useCallback((message: string, attachments?: File[]) => {
    const chatMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
      attachments: attachments?.map(file => ({
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: file.type,
        size: file.size,
      })),
    }
    dispatch({ type: 'ADD_MESSAGE', message: chatMessage })
  }, [])

  const addFile = useCallback((file: ChatFile) => {
    dispatch({ type: 'ADD_FILE', file })
  }, [])

  const setFiles = useCallback((files: ChatFile[]) => {
    dispatch({ type: 'SET_FILES', files })
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', loading })
  }, [])

  const selectAgent = useCallback((agent: AgentType | null) => {
    dispatch({ type: 'SET_AGENT', agent })
  }, [])

  const setSession = useCallback((session: ChatSession) => {
    dispatch({ type: 'SET_SESSION', session })
  }, [])

  const clearChat = useCallback(() => {
    dispatch({ type: 'CLEAR_CHAT' })
  }, [])

  const value: ChatContextValue = {
    ...state,
    sendMessage,
    addFile,
    setFiles,
    setLoading,
    selectAgent,
    setSession,
    clearChat,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}