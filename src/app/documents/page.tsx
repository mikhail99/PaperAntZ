'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  FileText, 
  Download,
  Upload,
  Trash2,
  Eye,
  FolderOpen,
  Brain,
  Database,
  BarChart3
} from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { Document, mockDocuments } from '@/lib/types';
import { documentService } from '@/lib/services/document-service';
import DocumentGroupsManager from '@/components/documents/DocumentGroupsManager';
import RAGSearch from '@/components/documents/RAGSearch';

export default function DocumentLibrary() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentGroups, setDocumentGroups] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDocuments();
    loadDocumentGroups();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      // Use mock data for now
      setDocuments(mockDocuments);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentGroups = async () => {
    try {
      const response = await documentService.getUserDocumentGroups('demo-user');
      // Extract the data array from the backend response
      const groups = response.data || response;
      setDocumentGroups(groups);
    } catch (error) {
      console.error('Failed to load document groups:', error);
      // Set empty array as fallback
      setDocumentGroups([]);
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Document Library</h1>
          <p className="text-gray-600">
            Manage documents, create groups, and search with AI-powered RAG
          </p>
        </div>

        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Groups
            </TabsTrigger>
            <TabsTrigger value="rag-search" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              RAG Search
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            {/* Search and Upload */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => console.log('Upload document clicked')}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                  <FileText className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{documents.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Size</CardTitle>
                  <Download className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatFileSize(documents.reduce((total, doc) => total + doc.fileSize, 0))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">File Types</CardTitle>
                  <FileText className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Set(documents.map(doc => doc.fileType)).size}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Documents Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDocuments.map((document) => (
                <Card key={document.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg line-clamp-1">{document.title}</CardTitle>
                      <Badge variant="outline">{document.fileType}</Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {document.source}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {document.content}
                        </p>
                      </div>
                      
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>{formatFileSize(document.fileSize)}</span>
                        <span>{document.createdAt.toLocaleDateString()}</span>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => console.log('View document:', document.id)}>
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => console.log('Download document:', document.id)}>
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => console.log('Delete document:', document.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredDocuments.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No documents found</h3>
                  <p className="text-gray-600 text-center mb-4">
                    {searchTerm ? 'No documents match your search.' : 'Upload some documents to get started.'}
                  </p>
                  <Button onClick={() => console.log('Upload document from empty state')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups">
            <DocumentGroupsManager 
              onGroupSelect={setSelectedGroupId}
              selectedGroupId={selectedGroupId}
            />
          </TabsContent>

          {/* RAG Search Tab */}
          <TabsContent value="rag-search">
            <RAGSearch 
              documentGroups={documentGroups}
              onResultSelect={(result) => console.log('Selected result:', result)}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Document Processing Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Document Processing
                  </CardTitle>
                  <CardDescription>
                    Status of document processing for RAG
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{documents.length}</div>
                      <div className="text-sm text-blue-800">Total Documents</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {documents.filter(d => (d as any).processed).length}
                      </div>
                      <div className="text-sm text-green-800">Processed</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processing Progress</span>
                      <span>
                        {Math.round((documents.filter(d => (d as any).processed).length / documents.length) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(documents.filter(d => (d as any).processed).length / documents.length) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Document Groups Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Document Groups
                  </CardTitle>
                  <CardDescription>
                    Organization and categorization statistics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{documentGroups.length}</div>
                      <div className="text-sm text-purple-800">Total Groups</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {documentGroups.reduce((total, group) => total + (group.documents?.length || 0), 0)}
                      </div>
                      <div className="text-sm text-orange-800">Documents in Groups</div>
                    </div>
                  </div>

                  {documentGroups.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Groups by Category</h4>
                      {Object.entries(
                        documentGroups.reduce((acc, group) => {
                          const category = group.category || 'uncategorized';
                          acc[category] = (acc[category] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([category, count]) => (
                        <div key={category} className="flex justify-between text-sm">
                          <span className="capitalize">{category}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* File Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>File Type Distribution</CardTitle>
                <CardDescription>
                  Breakdown of documents by file type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {Object.entries(
                    documents.reduce((acc, doc) => {
                      acc[doc.fileType] = (acc[doc.fileType] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([fileType, count]) => (
                    <div key={fileType} className="text-center p-4 border rounded-lg">
                      <div className="text-xl font-bold">{count}</div>
                      <div className="text-sm text-gray-600 uppercase">{fileType}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}