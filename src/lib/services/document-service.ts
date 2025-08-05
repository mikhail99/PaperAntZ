/**
 * Document Service - Handles document management and processing
 */

import { db } from '@/lib/db';
import { 
  Document, 
  DocumentGroup,
  DocumentGroupDocument
} from '@/lib/types';

export interface DocumentGroupDocument {
  documentGroupId: string;
  documentId: string;
  addedAt: Date;
  addedBy?: string;
  relevanceScore?: number;
}

export class DocumentService {
  /**
   * Upload and create a new document
   */
  async createDocument(
    title: string,
    content: string,
    source: string,
    fileType: string,
    fileSize: number,
    metadata?: any
  ): Promise<Document> {
    const document = await db.document.create({
      data: {
        title,
        content,
        source,
        fileType,
        fileSize,
        metadata: metadata ? JSON.stringify(metadata) : null,
      }
    });

    return {
      ...document,
      metadata: metadata || {},
      embedding: null,
      relevanceScore: null,
      processed: false
    } as Document;
  }

  /**
   * Get a document by ID
   */
  async getDocument(documentId: string): Promise<Document | null> {
    const document = await db.document.findUnique({
      where: { id: documentId }
    });

    if (!document) return null;

    return {
      ...document,
      metadata: document.metadata ? JSON.parse(document.metadata) : {},
      embedding: document.embedding ? JSON.parse(document.embedding) : null,
      relevanceScore: document.relevanceScore,
      processed: document.processed
    } as Document;
  }

  /**
   * Get all documents
   */
  async getAllDocuments(
    page: number = 1,
    pageSize: number = 20,
    search?: string
  ): Promise<{ documents: Document[], total: number }> {
    const skip = (page - 1) * pageSize;

    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } }
          ]
        }
      : {};

    const [documents, total] = await Promise.all([
      db.document.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      db.document.count({ where })
    ]);

    const processedDocuments = documents.map(doc => ({
      ...doc,
      metadata: doc.metadata ? JSON.parse(doc.metadata) : {},
      embedding: doc.embedding ? JSON.parse(doc.embedding) : null,
      relevanceScore: doc.relevanceScore,
      processed: doc.processed
    })) as Document[];

    return {
      documents: processedDocuments,
      total
    };
  }

  /**
   * Update a document
   */
  async updateDocument(
    documentId: string,
    updates: {
      title?: string;
      content?: string;
      metadata?: any;
      relevanceScore?: number;
      embedding?: number[];
      processed?: boolean;
    }
  ): Promise<Document> {
    const updateData: any = { ...updates };
    
    if (updates.metadata) {
      updateData.metadata = JSON.stringify(updates.metadata);
    }
    
    if (updates.embedding) {
      updateData.embedding = JSON.stringify(updates.embedding);
    }

    const document = await db.document.update({
      where: { id: documentId },
      data: updateData
    });

    return {
      ...document,
      metadata: updates.metadata || (document.metadata ? JSON.parse(document.metadata) : {}),
      embedding: updates.embedding || (document.embedding ? JSON.parse(document.embedding) : null),
      relevanceScore: updates.relevanceScore || document.relevanceScore,
      processed: updates.processed || document.processed
    } as Document;
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<void> {
    await db.document.delete({
      where: { id: documentId }
    });
  }

  /**
   * Create a document group
   */
  async createDocumentGroup(
    name: string,
    userId: string,
    description?: string,
    missionId?: string,
    category?: string,
    tags?: string[]
  ): Promise<DocumentGroup> {
    const group = await db.documentGroup.create({
      data: {
        name,
        userId,
        description,
        missionId,
        category,
        tags: tags ? JSON.stringify(tags) : null
      }
    });

    return {
      ...group,
      tags: tags || [],
      documents: []
    } as DocumentGroup;
  }

  /**
   * Get a document group by ID
   */
  async getDocumentGroup(groupId: string): Promise<DocumentGroup | null> {
    const group = await db.documentGroup.findUnique({
      where: { id: groupId },
      include: {
        documents: {
          include: {
            document: true
          }
        }
      }
    });

    if (!group) return null;

    return {
      ...group,
      tags: group.tags ? JSON.parse(group.tags) : [],
      documents: group.documents.map(gd => ({
        ...(gd.document as any),
        metadata: (gd.document as any).metadata ? JSON.parse((gd.document as any).metadata) : {},
        embedding: (gd.document as any).embedding ? JSON.parse((gd.document as any).embedding) : null,
        relevanceScore: (gd.document as any).relevanceScore,
        processed: (gd.document as any).processed
      })) as Document[]
    } as DocumentGroup;
  }

  /**
   * Get document groups for a user
   */
  async getUserDocumentGroups(
    userId: string,
    missionId?: string
  ): Promise<DocumentGroup[]> {
    // Build query parameters
    const params = new URLSearchParams({
      userId,
    });
    
    if (missionId) {
      params.append('missionId', missionId);
    }

    const response = await fetch(`/api/document-groups?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch document groups');
    }
    
    return response.json();
  }

  /**
   * Add a document to a group
   */
  async addDocumentToGroup(
    groupId: string,
    documentId: string,
    addedBy?: string
  ): Promise<DocumentGroupDocument> {
    const link = await db.documentGroupDocument.create({
      data: {
        documentGroupId: groupId,
        documentId,
        addedBy
      }
    });

    return link as DocumentGroupDocument;
  }

  /**
   * Remove a document from a group
   */
  async removeDocumentFromGroup(
    groupId: string,
    documentId: string
  ): Promise<void> {
    await db.documentGroupDocument.delete({
      where: {
        documentGroupId_documentId: {
          documentGroupId: groupId,
          documentId
        }
      }
    });
  }

  /**
   * Search documents within a group
   */
  async searchDocumentsInGroup(
    groupId: string,
    query: string,
    limit: number = 10
  ): Promise<Document[]> {
    const group = await db.documentGroup.findUnique({
      where: { id: groupId },
      include: {
        documents: {
          include: {
            document: true
          }
        }
      }
    });

    if (!group) return [];

    const documents = group.documents
      .map(gd => ({
        ...(gd.document as any),
        metadata: (gd.document as any).metadata ? JSON.parse((gd.document as any).metadata) : {},
        embedding: (gd.document as any).embedding ? JSON.parse((gd.document as any).embedding) : null,
        relevanceScore: (gd.document as any).relevanceScore,
        processed: (gd.document as any).processed
      }) as Document)
      .filter(doc => 
        doc.title.toLowerCase().includes(query.toLowerCase()) ||
        doc.content.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit);

    return documents;
  }

  /**
   * Get documents by category
   */
  async getDocumentsByCategory(category: string): Promise<Document[]> {
    const groups = await db.documentGroup.findMany({
      where: { category },
      include: {
        documents: {
          include: {
            document: true
          }
        }
      }
    });

    const documents = groups.flatMap(group =>
      group.documents.map(gd => ({
        ...(gd.document as any),
        metadata: (gd.document as any).metadata ? JSON.parse((gd.document as any).metadata) : {},
        embedding: (gd.document as any).embedding ? JSON.parse((gd.document as any).embedding) : null,
        relevanceScore: (gd.document as any).relevanceScore,
        processed: (gd.document as any).processed
      })) as Document
    );

    return documents;
  }

  /**
   * Get document groups by category
   */
  async getGroupsByCategory(userId: string): Promise<Record<string, DocumentGroup[]>> {
    const groups = await this.getUserDocumentGroups(userId);
    
    const categorized: Record<string, DocumentGroup[]> = {};
    
    groups.forEach(group => {
      const category = group.category || 'uncategorized';
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(group);
    });

    return categorized;
  }

  /**
   * Update document group
   */
  async updateDocumentGroup(
    groupId: string,
    updates: {
      name?: string;
      description?: string;
      category?: string;
      tags?: string[];
    }
  ): Promise<DocumentGroup> {
    const updateData: any = { ...updates };
    
    if (updates.tags) {
      updateData.tags = JSON.stringify(updates.tags);
    }

    const group = await db.documentGroup.update({
      where: { id: groupId },
      data: updateData,
      include: {
        documents: {
          include: {
            document: true
          }
        }
      }
    });

    return {
      ...group,
      tags: updates.tags || (group.tags ? JSON.parse(group.tags) : []),
      documents: group.documents.map(gd => ({
        ...(gd.document as any),
        metadata: (gd.document as any).metadata ? JSON.parse((gd.document as any).metadata) : {},
        embedding: (gd.document as any).embedding ? JSON.parse((gd.document as any).embedding) : null,
        relevanceScore: (gd.document as any).relevanceScore,
        processed: (gd.document as any).processed
      })) as Document[]
    } as DocumentGroup;
  }

  /**
   * Delete a document group
   */
  async deleteDocumentGroup(groupId: string): Promise<void> {
    await db.documentGroup.delete({
      where: { id: groupId }
    });
  }

  /**
   * Process document content (extract text, generate embeddings, etc.)
   */
  async processDocumentContent(documentId: string): Promise<void> {
    const document = await this.getDocument(documentId);
    if (!document) throw new Error('Document not found');

    try {
      // In a real implementation, this would:
      // 1. Extract text from different file formats (PDF, DOCX, etc.)
      // 2. Clean and preprocess the text
      // 3. Generate embeddings using a model like OpenAI's embeddings
      // 4. Extract metadata and structure
      
      // For now, we'll simulate the processing
      const processedContent = this.simulateTextProcessing(document.content);
      const embedding = this.simulateEmbeddingGeneration(processedContent);
      const metadata = {
        ...document.metadata,
        processed: true,
        wordCount: processedContent.split(' ').length,
        characterCount: processedContent.length,
        processedAt: new Date().toISOString()
      };

      await this.updateDocument(documentId, {
        content: processedContent,
        embedding,
        metadata,
        processed: true
      });

    } catch (error) {
      console.error('Document processing failed:', error);
      throw error;
    }
  }

  /**
   * Simulate text processing
   */
  private simulateTextProcessing(content: string): string {
    // In a real implementation, this would:
    // - Extract text from PDF, DOCX, etc.
    // - Clean formatting and normalize text
    // - Remove irrelevant content
    // - Structure the content
    
    // For simulation, just return the content with some basic processing
    return content
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .trim();
  }

  /**
   * Simulate embedding generation
   */
  private simulateEmbeddingGeneration(content: string): number[] {
    // In a real implementation, this would use a proper embedding model
    // For simulation, generate a random 1536-dimensional vector (OpenAI embedding size)
    const dimensions = 1536;
    const embedding: number[] = [];
    
    for (let i = 0; i < dimensions; i++) {
      // Generate random values between -1 and 1
      embedding.push(Math.random() * 2 - 1);
    }
    
    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
  }

  /**
   * Get document statistics
   */
  async getDocumentStatistics(): Promise<{
    totalDocuments: number;
    totalSize: number;
    fileTypeDistribution: Record<string, number>;
    recentUploads: Document[];
    processedDocuments: number;
  }> {
    const [
      totalDocuments,
      documents,
      recentUploads,
      processedDocuments
    ] = await Promise.all([
      db.document.count(),
      db.document.findMany({
        select: {
          fileType: true,
          fileSize: true
        }
      }),
      db.document.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      db.document.count({ where: { processed: true } })
    ]);

    const totalSize = documents.reduce((sum, doc) => sum + doc.fileSize, 0);
    
    const fileTypeDistribution = documents.reduce((acc, doc) => {
      acc[doc.fileType] = (acc[doc.fileType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const formattedRecentUploads = recentUploads.map(doc => ({
      ...doc,
      metadata: doc.metadata ? JSON.parse(doc.metadata) : {},
      embedding: doc.embedding ? JSON.parse(doc.embedding) : null,
      relevanceScore: doc.relevanceScore,
      processed: doc.processed
    })) as Document[];

    return {
      totalDocuments,
      totalSize,
      fileTypeDistribution,
      recentUploads: formattedRecentUploads,
      processedDocuments
    };
  }

  /**
   * Get documents by relevance score
   */
  async getDocumentsByRelevance(
    groupId?: string,
    limit: number = 10
  ): Promise<Document[]> {
    const where = groupId
      ? {
          documents: {
            some: {
              documentGroupId: groupId
            }
          }
        }
      : {};

    const documents = await db.document.findMany({
      where,
      orderBy: { relevanceScore: 'desc' },
      take: limit
    });

    return documents.map(doc => ({
      ...doc,
      metadata: doc.metadata ? JSON.parse(doc.metadata) : {},
      embedding: doc.embedding ? JSON.parse(doc.embedding) : null,
      relevanceScore: doc.relevanceScore,
      processed: doc.processed
    })) as Document[];
  }

  /**
   * Update relevance scores for documents based on usage
   */
  async updateDocumentRelevanceScores(): Promise<void> {
    // In a real implementation, this would:
    // 1. Analyze how often documents are accessed in research
    // 2. Consider user feedback and ratings
    // 3. Update scores based on search result rankings
    
    // For simulation, we'll just add some random variation to existing scores
    const documents = await db.document.findMany({
      where: {
        relevanceScore: { not: null }
      }
    });

    for (const document of documents) {
      const currentScore = document.relevanceScore || 0.5;
      const variation = (Math.random() - 0.5) * 0.1; // ±0.05 variation
      const newScore = Math.max(0, Math.min(1, currentScore + variation));
      
      await this.updateDocument(document.id, {
        relevanceScore: newScore
      });
    }
  }
}

export const documentService = new DocumentService();