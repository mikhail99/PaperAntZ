'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Thread } from '@assistant-ui/react'
import { BaseChatProps, ChatMessage, ChatAction } from '@/types/chat'
import { useChat } from '@/lib/chat/context'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  BotIcon, 
  FileTextIcon, 
  SearchIcon, 
  CheckCircleIcon,
  ClockIcon,
  PaperclipIcon,
  SendIcon,
  ThumbsUp,
  ThumbsDown,
  Save as SaveIcon,
  Pin,
  PinOff,
  TargetIcon,
  BrainIcon,
  FileEditIcon,
  UsersIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Agent icon mapping
const getAgentIcon = (iconName: string) => {
  switch (iconName) {
    case 'target':
      return <TargetIcon className="h-4 w-4 text-blue-600" />
    case 'brain':
      return <BrainIcon className="h-4 w-4 text-green-600" />
    case 'file-edit':
      return <FileEditIcon className="h-4 w-4 text-purple-600" />
    case 'users':
      return <UsersIcon className="h-4 w-4 text-orange-600" />
    default:
      return <BotIcon className="h-4 w-4 text-gray-600" />
  }
}

export function BaseChat({
  messages,
  onSendMessage,
  isLoading = false,
  placeholder = "Type a message...",
  showFileUpload = true,
  customActions = [],
  onFileSelect,
  availableFiles = [],
  className,
  onInputChange,
  onKeyDown,
  inputRef,
  value,
  onMessageAction,
}: BaseChatProps) {
  const [inputValue, setInputValue] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const internalInputRef = useRef<HTMLInputElement>(null)
  const finalInputRef = inputRef || internalInputRef

  // Use controlled value if provided, otherwise use internal state
  const currentInputValue = value !== undefined ? value : inputValue

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  React.useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onInputChange?.(newValue)
  }, [onInputChange])

  const handleSendMessage = useCallback(() => {
    if (currentInputValue.trim() || selectedFiles.length > 0) {
      onSendMessage(currentInputValue.trim(), selectedFiles)
      setInputValue('')
      setSelectedFiles([])
    }
  }, [currentInputValue, selectedFiles, onSendMessage])

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files)
      setSelectedFiles(prev => [...prev, ...newFiles])
      onFileSelect?.(newFiles)
    }
  }, [onFileSelect])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    // Call custom key handler first
    onKeyDown?.(e)
    
    // If event was prevented, don't handle it further
    if (e.defaultPrevented) return
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage, onKeyDown])

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const renderMessage = useCallback((message: ChatMessage) => {
    const isUser = message.role === 'user'
    const isAgent = message.role === 'assistant' && (message.agentId || message.agentIcon)
    const liked = (message.metadata as any)?.liked === true
    const disliked = (message.metadata as any)?.disliked === true
    const pinned = (message.metadata as any)?.pinned === true
    
    return (
      <div
        key={message.id}
        className={cn(
          'flex gap-3 p-4',
          isUser ? 'flex-row-reverse' : 'flex-row'
        )}
      >
          <div
          className={cn(
            'flex-1 max-w-[80%] relative',
            isUser ? 'text-right' : 'text-left'
          )}
          style={{ pointerEvents: 'auto' }}
        >
          <div
            className={cn(
              'inline-block p-3 rounded-lg',
              isUser
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
              pinned && 'ring-2 ring-yellow-400',
              liked && 'shadow-[0_0_0_2px_rgba(34,197,94,0.4)]',
              disliked && 'opacity-60'
            )}
            style={{ pointerEvents: 'auto' }}
          >
            {/* Agent info header */}
            {isAgent && (
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full">
                  {message.agentIcon ? getAgentIcon(message.agentIcon) : <BotIcon className="h-3 w-3 text-blue-600" />}
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {message.agentName || 'Agent'}
                </span>
              </div>
            )}
            
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            {isAgent && (
              <div className="mt-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMessageAction?.(message, 'like')}
                >
                  <ThumbsUp className={cn('h-3 w-3 mr-1', liked && 'text-green-600')} /> Like
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMessageAction?.(message, 'dislike')}
                >
                  <ThumbsDown className={cn('h-3 w-3 mr-1', disliked && 'text-red-600')} /> Dislike
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMessageAction?.(message, 'save')}
                >
                  <SaveIcon className="h-3 w-3 mr-1" /> Save
                </Button>
              </div>
            )}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {message.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="text-xs opacity-75 flex items-center gap-1"
                  >
                    <PaperclipIcon className="h-3 w-3" />
                    {attachment.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Include checkbox (acts as pin) for user messages */}
          {isUser && (
            <div className={cn('mt-2 flex items-center gap-2 pointer-events-auto z-10', isUser ? 'justify-end' : 'justify-start')}>
              <Checkbox
                id={`pin-${message.id}`}
                checked={pinned}
                onCheckedChange={(val:any)=> onMessageAction?.(message, val ? 'pin' : 'unpin')}
              />
              <label htmlFor={`pin-${message.id}`} className="text-xs text-gray-600 cursor-pointer select-none">Include in context</label>
            </div>
          )}
          <div className="text-xs opacity-50 mt-1">
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
    )
  }, [])

  return (
    <Card className={cn('w-full h-full flex flex-col', className)}>
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">No messages yet. Start a conversation!</p>
              </div>
            ) : (
              messages.map(renderMessage)
            )}
            {isLoading && (
              <div className="flex gap-3 p-4">
                <div className="flex-1">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 inline-block">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Custom Actions */}
        {customActions.length > 0 && (
          <div className="p-2 border-t flex gap-2">
            {customActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t">
          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="mb-2 space-y-1">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded p-2"
                >
                  <div className="flex items-center gap-2">
                    <PaperclipIcon className="h-4 w-4" />
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* File Upload */}
          {showFileUpload && (
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          )}

          {/* Message Input */}
          <div className="flex gap-2">
            {showFileUpload && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <PaperclipIcon className="h-4 w-4" />
              </Button>
            )}
            <Input
              ref={finalInputRef}
              value={currentInputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || (!currentInputValue.trim() && selectedFiles.length === 0)}
              size="sm"
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}