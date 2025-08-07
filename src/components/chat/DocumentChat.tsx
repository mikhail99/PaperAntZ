'use client'

import React, { useState, useCallback } from 'react'
import { BaseChat } from './BaseChat'
import { DocumentChatProps, ChatMessage } from '@/types/chat'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  FileTextIcon, 
  MessageSquareIcon, 
  HistoryIcon,
  DownloadIcon,
  ShareIcon,
  EditIcon,
  EyeIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function DocumentChat({
  messages,
  onSendMessage,
  onDocumentUpdate,
  document,
  contextFiles = [],
  isLoading = false,
  placeholder = "Ask about this document...",
  showFileUpload = true,
  className,
}: DocumentChatProps) {
  const [activeTab, setActiveTab] = useState('chat')
  const [documentContent, setDocumentContent] = useState(document?.content || '')
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<{ line: number; content: string }[]>([])

  // Handle document content changes
  const handleContentChange = useCallback((content: string) => {
    setDocumentContent(content)
    onDocumentUpdate({ content })
  }, [onDocumentUpdate])

  // Save document changes
  const handleSaveDocument = useCallback(() => {
    onDocumentUpdate({ content: documentContent })
    setIsEditing(false)
  }, [documentContent, onDocumentUpdate])

  // Search within document
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term)
    if (!term || !documentContent) {
      setSearchResults([])
      return
    }

    const lines = documentContent.split('\n')
    const results: { line: number; content: string }[] = []
    
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(term.toLowerCase())) {
        results.push({
          line: index + 1,
          content: line.trim()
        })
      }
    })
    
    setSearchResults(results)
  }, [documentContent])

  // Handle message send with document context
  const handleSendMessage = useCallback((message: string, attachments?: File[]) => {
    // Add document context to the message
    const enhancedMessage = `Regarding the document "${document.title}": ${message}`
    onSendMessage(enhancedMessage, attachments)
  }, [document.title, onSendMessage])

  // Render document content with syntax highlighting
  const renderDocumentContent = () => {
    if (!documentContent) {
      return (
        <div className="text-center text-gray-500 py-8">
          <FileTextIcon className="h-12 w-12 mx-auto mb-4" />
          <p>No document content available</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {/* Document Header */}
        <div className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{document.title}</h2>
              <p className="text-sm text-gray-500">
                Last modified: {new Date(document.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <EditIcon className="h-4 w-4 mr-2" />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
              <Button variant="outline" size="sm">
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <ShareIcon className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Document Content */}
        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={documentContent}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full h-96 p-4 border rounded-lg font-mono text-sm resize-none"
              placeholder="Enter document content..."
            />
            <div className="flex gap-2">
              <Button onClick={handleSaveDocument}>
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {documentContent}
              </pre>
            </div>
          </ScrollArea>
        )}
      </div>
    )
  }

  // Render chat interface
  const renderChatInterface = () => {
    return (
      <div className="h-full flex flex-col">
        {/* Document Context Header */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileTextIcon className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-medium">{document.title}</h3>
                <p className="text-sm text-gray-500">
                  Chatting about this document ({documentContent?.length || 0} characters)
                </p>
              </div>
            </div>
            
            {/* Context Files */}
            {contextFiles.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">Context Files:</p>
                <div className="flex gap-2 flex-wrap">
                  {contextFiles.map((file) => (
                    <Badge key={file.id} variant="outline" className="text-xs">
                      {file.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Component */}
        <div className="flex-1">
          <BaseChat
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            placeholder={placeholder}
            showFileUpload={showFileUpload}
            className="h-full"
          />
        </div>
      </div>
    )
  }

  // Render search results
  const renderSearchResults = () => {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search in document..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1"
          />
          <Button variant="outline" onClick={() => handleSearch(searchTerm)}>
            Search
          </Button>
        </div>

        {searchResults.length > 0 ? (
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {searchResults.map((result, index) => (
                <Card key={index}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs">
                        Line {result.line}
                      </Badge>
                      <p className="text-sm flex-1">{result.content}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        ) : searchTerm ? (
          <div className="text-center text-gray-500 py-8">
            <p>No results found for "{searchTerm}"</p>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>Enter a search term to find content in this document</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('w-full h-full flex flex-col', className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquareIcon className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="document" className="flex items-center gap-2">
            <EyeIcon className="h-4 w-4" />
            Document
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <HistoryIcon className="h-4 w-4" />
            Search
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 mt-4">
          <TabsContent value="chat" className="h-full mt-0">
            {renderChatInterface()}
          </TabsContent>

          <TabsContent value="document" className="h-full mt-0">
            {renderDocumentContent()}
          </TabsContent>

          <TabsContent value="search" className="h-full mt-0">
            {renderSearchResults()}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}