import { ChatFile } from '@/types/chat'

export class FileManager {
  private static instance: FileManager
  private files: Map<string, ChatFile> = new Map()

  static getInstance(): FileManager {
    if (!FileManager.instance) {
      FileManager.instance = new FileManager()
    }
    return FileManager.instance
  }

  // Add a new file
  addFile(file: File, source: 'upload' | 'generated' = 'upload', generatedBy?: string): ChatFile {
    const chatFile: ChatFile = {
      id: this.generateFileId(),
      name: file.name,
      type: file.type,
      size: file.size,
      uploadedAt: new Date(),
      source,
      generatedBy,
    }

    // Store file content if it's text-based
    if (this.isTextFile(file.type)) {
      this.readFileContent(file).then(content => {
        chatFile.content = content
      })
    }

    this.files.set(chatFile.id, chatFile)
    return chatFile
  }

  // Add a generated file from agent output
  addGeneratedFile(
    name: string, 
    content: string, 
    generatedBy: string,
    type: string = 'text/markdown'
  ): ChatFile {
    const chatFile: ChatFile = {
      id: this.generateFileId(),
      name,
      type,
      size: new Blob([content]).size,
      content,
      uploadedAt: new Date(),
      source: 'generated',
      generatedBy,
    }

    this.files.set(chatFile.id, chatFile)
    return chatFile
  }

  // Get all files
  getAllFiles(): ChatFile[] {
    return Array.from(this.files.values())
  }

  // Get files by source
  getFilesBySource(source: 'upload' | 'generated'): ChatFile[] {
    return this.getAllFiles().filter(file => file.source === source)
  }

  // Get file by ID
  getFileById(id: string): ChatFile | undefined {
    return this.files.get(id)
  }

  // Get file by name
  getFileByName(name: string): ChatFile | undefined {
    return this.getAllFiles().find(file => file.name === name)
  }

  // Remove file
  removeFile(id: string): boolean {
    return this.files.delete(id)
  }

  // Clear all files
  clearAll(): void {
    this.files.clear()
  }

  // Search files by name
  searchFiles(query: string): ChatFile[] {
    const lowerQuery = query.toLowerCase()
    return this.getAllFiles().filter(file =>
      file.name.toLowerCase().includes(lowerQuery)
    )
  }

  // Get file statistics
  getStats(): {
    total: number
    uploaded: number
    generated: number
    totalSize: number
  } {
    const files = this.getAllFiles()
    return {
      total: files.length,
      uploaded: files.filter(f => f.source === 'upload').length,
      generated: files.filter(f => f.source === 'generated').length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0)
    }
  }

  // Export file as blob
  exportFile(id: string): Blob | null {
    const file = this.getFileById(id)
    if (!file) return null

    if (file.content) {
      return new Blob([file.content], { type: file.type })
    }
    return null
  }

  // Download file
  downloadFile(id: string): void {
    const file = this.getFileById(id)
    if (!file) return

    const blob = this.exportFile(id)
    if (!blob) return

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Private helper methods
  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private isTextFile(type: string): boolean {
    const textTypes = [
      'text/plain',
      'text/markdown',
      'text/html',
      'text/css',
      'text/javascript',
      'application/json',
      'application/xml',
    ]
    return textTypes.includes(type) || type.startsWith('text/')
  }

  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        resolve(e.target?.result as string)
      }
      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
      reader.readAsText(file)
    })
  }
}

// React hook for file management
import { useState, useEffect, useCallback } from 'react'

export function useFileManager() {
  const [files, setFiles] = useState<ChatFile[]>([])
  const fileManager = FileManager.getInstance()

  const refreshFiles = useCallback(() => {
    setFiles(fileManager.getAllFiles())
  }, [fileManager])

  const addFile = useCallback((file: File, source?: 'upload' | 'generated', generatedBy?: string) => {
    const chatFile = fileManager.addFile(file, source, generatedBy)
    refreshFiles()
    return chatFile
  }, [fileManager, refreshFiles])

  const addGeneratedFile = useCallback((name: string, content: string, generatedBy: string, type?: string) => {
    const chatFile = fileManager.addGeneratedFile(name, content, generatedBy, type)
    refreshFiles()
    return chatFile
  }, [fileManager, refreshFiles])

  const removeFile = useCallback((id: string) => {
    const success = fileManager.removeFile(id)
    if (success) {
      refreshFiles()
    }
    return success
  }, [fileManager, refreshFiles])

  const downloadFile = useCallback((id: string) => {
    fileManager.downloadFile(id)
  }, [fileManager])

  const searchFiles = useCallback((query: string) => {
    return fileManager.searchFiles(query)
  }, [fileManager])

  const getStats = useCallback(() => {
    return fileManager.getStats()
  }, [fileManager])

  // Initialize files on mount
  useEffect(() => {
    refreshFiles()
  }, [refreshFiles])

  return {
    files,
    addFile,
    addGeneratedFile,
    removeFile,
    downloadFile,
    searchFiles,
    getStats,
    refreshFiles,
  }
}