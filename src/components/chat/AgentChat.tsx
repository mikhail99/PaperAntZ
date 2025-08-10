'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { BaseChat } from './BaseChat'
import { AgentChatProps, AgentType, ChatFile, FileSuggestion, FileContext, ChatMessage } from '@/types/chat'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Label } from '@/components/ui/label'
import { agentService } from '@/lib/services/agent-service'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  BotIcon, 
  FileTextIcon, 
  SearchIcon, 
  CheckCircleIcon,
  ClockIcon,
  PaperclipIcon,
  FileIcon,
  ImageIcon,
  FileCodeIcon,
  FileAudioIcon,
  FileVideoIcon,
  TargetIcon,
  BrainIcon,
  FileEditIcon,
  UsersIcon,
  Pencil,
  Trash2,
  Download
} from 'lucide-react'
import { cn } from '@/lib/utils'

const AGENT_TYPES: AgentType[] = [
  {
    id: 'planning',
    name: 'Planning Agent',
    description: 'Creates research plans and outlines',
    color: 'blue',
    icon: 'target'
  },
  {
    id: 'research',
    name: 'Research Agent',
    description: 'Conducts in-depth research and analysis',
    color: 'green',
    icon: 'brain'
  },
  {
    id: 'writing',
    name: 'Writing Agent',
    description: 'Writes and drafts research reports',
    color: 'purple',
    icon: 'file-edit'
  },
  {
    id: 'review',
    name: 'Review Agent',
    description: 'Reviews and refines final reports',
    color: 'orange',
    icon: 'users'
  },
  {
    id: 'semantic',
    name: 'Semantic Search',
    description: 'Retrieve ranked snippets from selected document group',
    color: 'cyan',
    icon: 'search'
  },
  {
    id: 'hybrid',
    name: 'Hybrid (PaperQA)',
    description: 'Synthesize answers using PaperQA over the group',
    color: 'teal',
    icon: 'search'
  }
]

// File type icons mapping
const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
    case 'webp':
      return <ImageIcon className="h-4 w-4" />
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
      return <FileVideoIcon className="h-4 w-4" />
    case 'mp3':
    case 'wav':
    case 'flac':
    case 'aac':
      return <FileAudioIcon className="h-4 w-4" />
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
    case 'py':
    case 'java':
    case 'cpp':
    case 'c':
    case 'html':
    case 'css':
    case 'json':
    case 'xml':
    case 'md':
      return <FileCodeIcon className="h-4 w-4" />
    default:
      return <FileIcon className="h-4 w-4" />
  }
}

// Enhanced search function with fuzzy matching
const calculateMatchScore = (fileName: string, searchTerm: string): number => {
  if (!searchTerm) return 1
  
  const fileNameLower = fileName.toLowerCase()
  const searchLower = searchTerm.toLowerCase()
  
  // Exact match gets highest score
  if (fileNameLower === searchLower) return 10
  
  // Starts with search term
  if (fileNameLower.startsWith(searchLower)) return 8
  
  // Contains search term
  if (fileNameLower.includes(searchLower)) return 6
  
  // Fuzzy matching - check if all characters in search term appear in order
  let searchIndex = 0
  for (let i = 0; i < fileNameLower.length && searchIndex < searchLower.length; i++) {
    if (fileNameLower[i] === searchLower[searchIndex]) {
      searchIndex++
    }
  }
  
  if (searchIndex === searchLower.length) return 4
  
  return 0
}

// Agent icon mapping
const getAgentIcon = (iconName: string) => {
  switch (iconName) {
    case 'target':
      return <TargetIcon className="h-5 w-5 text-blue-600" />
    case 'brain':
      return <BrainIcon className="h-5 w-5 text-green-600" />
    case 'file-edit':
      return <FileEditIcon className="h-5 w-5 text-purple-600" />
    case 'users':
      return <UsersIcon className="h-5 w-5 text-orange-600" />
    case 'search':
      return <SearchIcon className="h-5 w-5 text-cyan-600" />
    default:
      return <BotIcon className="h-5 w-5 text-gray-600" />
  }
}

// Map generatedBy text to an agent icon
const getAgentIconByGenerator = (generatedBy?: string) => {
  if (!generatedBy) return <BotIcon className="h-3.5 w-3.5 text-gray-500" />
  const name = generatedBy.toLowerCase()
  if (name.includes('planning')) return <TargetIcon className="h-3.5 w-3.5 text-blue-600" />
  if (name.includes('research')) return <BrainIcon className="h-3.5 w-3.5 text-green-600" />
  if (name.includes('writing')) return <FileEditIcon className="h-3.5 w-3.5 text-purple-600" />
  if (name.includes('review')) return <UsersIcon className="h-3.5 w-3.5 text-orange-600" />
  return <BotIcon className="h-3.5 w-3.5 text-gray-500" />
}

export function AgentChat({
  messages,
  onAgentSelect,
  onAgentExecute,
  selectedAgent,
  agents = AGENT_TYPES,
  availableFiles = [],
  generatedFiles = [],
  isLoading = false,
  placeholder = "Select an agent and type instructions... Use @ to reference files",
  className,
  onMessageAction,
  onFileRename,
  onFileDelete,
  onFileStar,
  starredIds = [],
  onAddTextFile,
  onFileEdit,
}: AgentChatProps) {
  const [inputValue, setInputValue] = useState('')
  const [fileSearchTerm, setFileSearchTerm] = useState('')
  const [showFileSuggestions, setShowFileSuggestions] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Record<string, { selected: boolean; prompt: string }>>({})
  // expose current selected file context for parent persistence if needed
  const buildContextItems = useCallback(() => {
    const fileMap = new Map<string, ChatFile>()
    availableFiles.forEach(f => fileMap.set(f.id, f))
    generatedFiles.forEach(f => fileMap.set(f.id, f))
    return Object.entries(selectedFiles).map(([id, cfg]) => ({
      id,
      name: fileMap.get(id)?.name || id,
      prompt: cfg.prompt,
      selected: !!cfg.selected,
    }))
  }, [availableFiles, generatedFiles, selectedFiles])

  // Parent handles persistence via its own callback; we avoid referencing it here to prevent runtime issues
  const [executedAgents, setExecutedAgents] = useState<Set<string>>(new Set())
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const [showParams, setShowParams] = useState(false)
  const [draftAgent, setDraftAgent] = useState<AgentType | null>(null)
  // Mission presets are used only to prefill prompt values for fixed agents
  const [missionPresets, setMissionPresets] = useState<any[]>([])
  const [pinnedMessageIds, setPinnedMessageIds] = useState<Set<string>>(new Set())
  const [lastN, setLastN] = useState<number>(6)
  const [showContextTray, setShowContextTray] = useState(false)

  // Enhanced file filtering with better search
  const filteredFiles = useMemo(() => {
    // Combine files and remove duplicates based on ID
    const fileMap = new Map()
    
    // Add available files first
    availableFiles.forEach(file => {
      fileMap.set(file.id, file)
    })
    
    // Add generated files, overwriting if same ID exists
    generatedFiles.forEach(file => {
      fileMap.set(file.id, file)
    })
    
    const allFiles = Array.from(fileMap.values())
    
    if (!fileSearchTerm) return allFiles
    return allFiles.filter(file =>
      calculateMatchScore(file.name, fileSearchTerm) > 0
    )
  }, [availableFiles, generatedFiles, fileSearchTerm])

  // Enhanced file suggestions with better scoring and sorting
  const fileSuggestions: FileSuggestion[] = useMemo(() => {
    return filteredFiles
      .map(file => ({
        file,
        matchScore: calculateMatchScore(file.name, fileSearchTerm)
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10) // Limit to top 10 results
  }, [filteredFiles, fileSearchTerm])

  // Parse file references from message
  const parseFileReferences = useCallback((message: string): string[] => {
    const references = message.match(/@([^\s@]+)/g) || []
    return references.map(ref => ref.substring(1)) // Remove @
  }, [])

  // Enhanced input change handler with better @ detection
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value)
    
    // Show file suggestions when user types @
    const atSymbolIndex = value.lastIndexOf('@')
    if (atSymbolIndex !== -1) {
      const searchTerm = value.slice(atSymbolIndex + 1)
      setFileSearchTerm(searchTerm)
      setShowFileSuggestions(true)
      setSelectedSuggestionIndex(0) // Reset selection
    } else {
      setShowFileSuggestions(false)
      setFileSearchTerm('')
      setSelectedSuggestionIndex(0)
    }
  }, [])

  // Enhanced file reference insertion
  const insertFileReference = useCallback((fileName: string) => {
    const atSymbolIndex = inputValue.lastIndexOf('@')
    const beforeAt = inputValue.slice(0, atSymbolIndex)
    const newValue = `${beforeAt}@${fileName} `
    setInputValue(newValue)
    setShowFileSuggestions(false)
    setFileSearchTerm('')
    setSelectedSuggestionIndex(0)
    
    // Focus back to input
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }, [inputValue])

  // Keyboard navigation for suggestions
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showFileSuggestions && fileSuggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedSuggestionIndex(prev => 
            prev < fileSuggestions.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedSuggestionIndex(prev => 
            prev > 0 ? prev - 1 : fileSuggestions.length - 1
          )
          break
        case 'Enter':
          e.preventDefault()
          if (fileSuggestions[selectedSuggestionIndex]) {
            insertFileReference(fileSuggestions[selectedSuggestionIndex].file.name)
          }
          break
        case 'Escape':
          e.preventDefault()
          setShowFileSuggestions(false)
          setFileSearchTerm('')
          setSelectedSuggestionIndex(0)
          break
        case 'Tab':
          e.preventDefault()
          if (fileSuggestions[selectedSuggestionIndex]) {
            insertFileReference(fileSuggestions[selectedSuggestionIndex].file.name)
          }
          break
      }
    }
  }, [showFileSuggestions, fileSuggestions, selectedSuggestionIndex, insertFileReference])

  // Scroll selected suggestion into view
  useEffect(() => {
    if (showFileSuggestions && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.querySelector(`[data-index="${selectedSuggestionIndex}"]`)
      if (selectedElement) {
        selectedElement.scrollIntoView({ 
          block: 'nearest',
          behavior: 'smooth'
        })
      }
    }
  }, [selectedSuggestionIndex, showFileSuggestions])

  // Seed selection/prompt state from parent if available (persisted context)
  useEffect(() => {
    const seed = (window as any).__seedFileContext
    if (seed && Object.keys(selectedFiles).length === 0) {
      setSelectedFiles(seed)
    }
  }, [])

  // Load mission presets
  const loadPresets = useCallback(async () => {
    try {
      const parts = window.location.pathname.split('/')
      const idx = parts.indexOf('idea-mission')
      const missionId = idx >= 0 ? parts[idx + 1] : ''
      if (missionId) {
        const list = await agentService.listMissionPresets(missionId)
        setMissionPresets(list)
      }
    } catch {}
  }, [])

  useEffect(() => {
    loadPresets()
  }, [loadPresets])

  // Handle agent execution
  const handleExecuteAgent = useCallback(() => {
    if (!selectedAgent || !inputValue.trim()) return

    // Build file contexts from selected checkboxes
    const contexts: FileContext[] = []
    const fileMap = new Map<string, ChatFile>()
    availableFiles.forEach(f => fileMap.set(f.id, f))
    generatedFiles.forEach(f => fileMap.set(f.id, f))
    for (const [fid, cfg] of Object.entries(selectedFiles)) {
      if (cfg?.selected) {
        const f = fileMap.get(fid)
        if (f) contexts.push({ id: fid, name: f.name, prompt: cfg.prompt, url: f.url })
      }
    }

    // Build history according to policy: last N (exclude disliked), plus pinned user messages
    const lastMessages = messages.slice(-lastN)
    const filteredLast = lastMessages.filter(m => !(m.metadata && m.metadata.disliked))
    const pinned = messages.filter(m => pinnedMessageIds.has(m.id) && m.role === 'user')
    const pairEntries: [string, ChatMessage][] = [
      ...(filteredLast as ChatMessage[]).map((m)=>[m.id, m] as [string, ChatMessage]),
      ...(pinned as ChatMessage[]).map((m)=>[m.id, m] as [string, ChatMessage])
    ]
    const history = Array.from(new Map<string, ChatMessage>(pairEntries).values()) as ChatMessage[]

    onAgentExecute(selectedAgent, inputValue, contexts, history)
    
    // Mark agent as executed
    setExecutedAgents(prev => new Set([...prev, selectedAgent.id]))
    
    // Clear input
    setInputValue('')
    setSelectedFiles({} as any)
  }, [selectedAgent, inputValue, availableFiles, parseFileReferences, onAgentExecute, messages, lastN, pinnedMessageIds])

  // Handle message send (delegates to agent execution)
  const handleSendMessage = useCallback((message: string, attachments?: File[]) => {
    if (!selectedAgent) {
      // Attempt to read last selected agent from marketplace
      try {
        const raw = localStorage.getItem('agent_selected')
        if (raw) {
          const a = JSON.parse(raw)
          onAgentSelect(a)
        }
      } catch {}
      return
    }
    
    const referencedFiles = parseFileReferences(message)
    const filesToPass: FileContext[] = availableFiles
      .filter(file => referencedFiles.includes(file.name))
      .map(file => ({ id: file.id, name: file.name, url: file.url }))
    // Default to lastN-based history if handleExecuteAgent didn't build it
    const lastMessages = messages.slice(-lastN)
    const filteredLast = lastMessages.filter(m => !(m as any)?.metadata?.disliked)
    onAgentExecute(selectedAgent, message, filesToPass, filteredLast as any)
    
    // Mark agent as executed
    setExecutedAgents(prev => new Set([...prev, selectedAgent.id]))
    
    // Clear input after sending
    setInputValue('')
  }, [selectedAgent, availableFiles, parseFileReferences, onAgentExecute, messages, lastN])

  return (
    <div className={cn('flex h-full gap-4', className)}>
      {/* Agent Selection Panel */}
      <Card className="w-80 flex-shrink-0 overflow-hidden">
        <CardContent className="p-4 h-full flex flex-col">
          <h3 className="font-semibold mb-4">Agents</h3>
          <Button variant="outline" size="sm" className="mb-3" onClick={() => {
            window.location.assign('/agents')
          }}>Browse marketplace</Button>
          
          {/* Fixed agents with original card look and inline Edit */}
          <ScrollArea className="flex-1 h-0">
            <div className="space-y-2">
              {AGENT_TYPES.map((a) => {
                const isSelected = selectedAgent?.id === a.id
                return (
                  <div
                    key={a.id}
                    className={cn(
                      'w-full h-auto p-3 border rounded-lg cursor-pointer transition-colors',
                      isSelected ? 'border-blue-400 bg-blue-50/60' : 'hover:bg-gray-50 dark:hover:bg-gray-900/10'
                    )}
                    onClick={() => onAgentSelect(a)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e)=>{ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAgentSelect(a) } }}
                  > 
                    <div className="flex items-center gap-3 w-full">
                      <div className="text-2xl">{getAgentIcon(a.icon)}</div>
                      <button className="flex-1 text-left" onClick={(e)=>{ e.stopPropagation(); onAgentSelect(a) }}>
                        <div className="font-medium">{a.name}</div>
                        <div className="text-xs opacity-70">{a.description}</div>
                      </button>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" title="Edit" onClick={(e) => { e.stopPropagation();
                          // Prefill prompt from mission preset if present
                          const preset = missionPresets.find((p:any)=> (p.agentType === a.id) || (p.id === `preset_${a.id}`))
                          setDraftAgent({ ...a, systemPrompt: preset?.systemPrompt || '' })
                          setShowParams(true)
                        }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>

          {/* Mission presets section removed; shown above with original styling */}

          {/* Selected Agent Info */}
          {selectedAgent && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{getAgentIcon(selectedAgent.icon)}</span>
                <span className="font-medium">{selectedAgent.name}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedAgent.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Team Mode removed for MVP */}
        {/* File Context Panel */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center gap-2">
                <PaperclipIcon className="h-4 w-4" />
                Available Files ({(() => {
                  const ids = new Set<string>()
                  availableFiles.forEach(f => ids.add(f.id))
                  generatedFiles.forEach(f => ids.add(f.id))
                  return ids.size
                })()})
              </h4>
              {onAddTextFile && (
                <Button variant="outline" size="sm" onClick={onAddTextFile}>Add Text File</Button>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {/* Use the same deduplication logic for display */}
              {(() => {
                const fileMap = new Map()
                
                // Add available files first
                availableFiles.forEach(file => {
                  fileMap.set(file.id, { ...file, displayType: 'available' })
                })
                
                // Add generated files, overwriting if same ID exists
                generatedFiles.forEach(file => {
                  fileMap.set(file.id, { ...file, displayType: 'generated' })
                })
                
                return Array.from(fileMap.values()).map((file) => {
                  return (
                    <div
                      key={file.id}
                    className={cn(
                      'relative p-2 border rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                        file.displayType === 'generated' && 'bg-blue-50/30 border-blue-200 dark:bg-blue-900/10',
                      selectedFiles[file.id]?.selected && 'bg-blue-50 border-blue-200 dark:bg-blue-900/20'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!selectedFiles[file.id]?.selected}
                          onChange={(e) => {
                            const checked = e.target.checked
                            setSelectedFiles(prev => ({
                              ...prev,
                              [file.id]: { selected: checked, prompt: prev[file.id]?.prompt || '' }
                            }))
                          }}
                        />
                        {file.displayType === 'generated' ? (
                          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-50">
                            {getAgentIconByGenerator(file.generatedBy)}
                          </span>
                        ) : (
                          getFileIcon(file.name)
                        )}
                        <span className="truncate font-medium" title={file.name}>{file.name}</span>
                        <div className="ml-auto inline-flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e)=>{e.preventDefault(); e.stopPropagation(); onFileEdit?.(file.id)}}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e)=>{e.preventDefault(); e.stopPropagation();}}>
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700" onClick={(e)=>{e.preventDefault(); e.stopPropagation(); if (onFileDelete && window.confirm('Delete this file?')) onFileDelete(file.id)}}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{file.displayType === 'generated' ? 'Agent output' : 'Uploaded'}{file.uploadedAt ? ` · ${file.uploadedAt.toLocaleDateString()}` : ''}</span>
                      </div>
                      {/* Per-file prompt moved to Edit dialog */}
                    </div>
                  )
                })
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <div className="flex-1 relative">
          <BaseChat
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            placeholder={placeholder}
            showFileUpload={false}
            className="h-full"
            onInputChange={handleInputChange}
            onKeyDown={handleKeyDown}
            inputRef={inputRef}
            value={inputValue}
            onMessageAction={(message, action) => {
              if (action === 'pin') {
                setPinnedMessageIds(prev => new Set(prev).add(message.id))
                onMessageAction?.(message, action)
              } else if (action === 'unpin') {
                setPinnedMessageIds(prev => { const n = new Set(prev); n.delete(message.id); return n })
                onMessageAction?.(message, action)
              } else {
                onMessageAction?.(message, action)
              }
            }}
          />

          {/* Enhanced File Suggestions Dropdown */}
          {showFileSuggestions && fileSuggestions.length > 0 && (
            <Card className="absolute bottom-20 left-4 right-4 z-20 shadow-xl border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <SearchIcon className="h-4 w-4 text-blue-600" />
                  <Input
                    value={fileSearchTerm}
                    onChange={(e) => setFileSearchTerm(e.target.value)}
                    placeholder="Search files..."
                    className="flex-1 h-8 text-sm border-0 focus-visible:ring-0 bg-transparent"
                    autoFocus
                  />
                  <Badge variant="outline" className="text-xs">
                    {fileSuggestions.length} files
                  </Badge>
                </div>
                <ScrollArea className="max-h-48" ref={suggestionsRef}>
                  <div className="space-y-1">
                    {fileSuggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.file.id}
                        data-index={index}
                        className={cn(
                          'p-2 rounded-md cursor-pointer transition-colors flex items-center gap-3',
                          index === selectedSuggestionIndex 
                            ? 'bg-blue-100 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-700' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        )}
                        onClick={() => insertFileReference(suggestion.file.name)}
                      >
                        <div className="flex-shrink-0 text-blue-600">
                          {getFileIcon(suggestion.file.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {suggestion.file.name}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span>{suggestion.file.source === 'generated' ? 'Generated' : 'Uploaded'}</span>
                            <span>•</span>
                            <span>{(suggestion.file.size / 1024).toFixed(1)} KB</span>
                            {suggestion.file.generatedBy && (
                              <>
                                <span>•</span>
                                <span>by {suggestion.file.generatedBy}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {index === selectedSuggestionIndex && (
                          <div className="flex-shrink-0">
                            <Badge variant="secondary" className="text-xs">
                              Enter to select
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
                  Use ↑↓ to navigate, Enter to select, Esc to close
                </div>
              </CardContent>
            </Card>
          )}

          {/* Execute Agent Button */}
          {selectedAgent && (
            <div className="absolute bottom-4 right-4">
              <Button
                onClick={handleExecuteAgent}
                disabled={!inputValue.trim() || isLoading}
                className="shadow-lg"
              >
                <BotIcon className="h-4 w-4 mr-2" />
                Run {selectedAgent.name}
              </Button>
            </div>
          )}
        </div>
      </div>
      {/* Context tray trigger */}
      <div className="fixed bottom-4 left-4 z-20">
        <Button variant="outline" size="sm" onClick={()=>setShowContextTray(v=>!v)}>Context</Button>
      </div>
      {showContextTray && (
        <Card className="fixed bottom-16 left-4 right-4 md:left-1/4 md:right-1/4 z-30 shadow-xl">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">Context to send</div>
              <div className="flex items-center gap-2">
                <span className="text-xs">Last N</span>
                <input type="range" min={1} max={20} value={lastN} onChange={(e)=>setLastN(parseInt(e.target.value))} />
              </div>
            </div>
            <div className="text-xs text-gray-500">Pinned messages outside N are included. Disliked are excluded.</div>
            <div className="mt-2">
              <div className="font-semibold text-sm mb-1">Messages</div>
              <div className="space-y-1 max-h-40 overflow-auto">
                {(() => {
                  const lastMessages = messages.slice(-lastN).filter(m => !(m.metadata && m.metadata.disliked))
                  const pinned = messages.filter(m => pinnedMessageIds.has(m.id) && m.role === 'user')
                  const pairEntries2: [string, ChatMessage][] = [
                    ...(lastMessages as ChatMessage[]).map((m)=>[m.id, m] as [string, ChatMessage]),
                    ...(pinned as ChatMessage[]).map((m)=>[m.id, m] as [string, ChatMessage])
                  ]
                  const list = Array.from(new Map<string, ChatMessage>(pairEntries2).values()) as ChatMessage[]
                  return list.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 text-sm">
                      <span className="px-1 rounded bg-gray-100">{m.role}</span>
                      <span className="truncate">{m.content.slice(0,80)}</span>
                      {pinnedMessageIds.has(m.id) && <span className="text-[10px] px-1 rounded bg-yellow-100">Pinned</span>}
                    </div>
                  ))
                })()}
              </div>
            </div>
            <div className="mt-2">
              <div className="font-semibold text-sm mb-1">Files (checked)</div>
              <div className="text-xs text-gray-600">Edit prompts via Edit on files.</div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={()=>setShowContextTray(false)}>Close</Button>
            </div>
          </CardContent>
        </Card>
      )}
          {/* Parameters Drawer (prompt-only for MVP) */}
      <Drawer open={showParams} onOpenChange={setShowParams}>
        <DrawerContent className="sm:max-w-md">
          <DrawerHeader>
                <DrawerTitle>Edit system prompt</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-3">
            <div>
              <Label className="text-xs">System Prompt</Label>
              <textarea className="w-full border px-2 py-1 rounded text-sm h-28" value={draftAgent?.systemPrompt || ''} onChange={(e)=>setDraftAgent(prev=>prev?{...prev, systemPrompt:e.target.value}:prev)} />
            </div>
          </div>
          <DrawerFooter>
            <div className="flex gap-2">
              <Button variant="outline" onClick={()=>setShowParams(false)}>Cancel</Button>
              <Button onClick={async ()=>{ if (draftAgent) {
                try {
                      const parts = window.location.pathname.split('/')
                      const mIdx = parts.indexOf('idea-mission')
                      const missionId = mIdx >= 0 ? parts[mIdx + 1] : ''
                      if (missionId) {
                        const body = { id: `preset_${draftAgent.id}`, name: draftAgent.name, agentType: draftAgent.id, icon: draftAgent.icon, temperature: 0.7, systemPrompt: draftAgent.systemPrompt ?? '', styleLevel: 50 }
                        await agentService.saveMissionPreset(missionId, body)
                      }
                } catch {}
                    onAgentSelect(draftAgent); setShowParams(false)
              } }}>Save</Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}