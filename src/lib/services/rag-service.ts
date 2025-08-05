/**
 * RAG (Retrieval-Augmented Generation) Service
 * Handles document processing, vector embeddings, and semantic search
 */

import { db } from '@/lib/db';
import { documentService } from './document-service';
import { Document, DocumentGroup, DocumentChunk } from '@/lib/types';

export interface SearchResult {
  chunk: DocumentChunk;
  document: Document;
  score: number;
  relevance: number;
}

export interface RAGQueryOptions {
  groupId?: string;
  limit?: number;
  threshold?: number;
  filters?: {
    fileType?: string;
    dateRange?: { start: Date; end: Date };
    tags?: string[];
  };
}

export class RAGService {
  private chunkSize: number = 1000; // characters per chunk
  private chunkOverlap: number = 200; // characters overlap between chunks

  /**
   * Process a document for RAG: chunking and embedding generation
   */
  async processDocument(documentId: string): Promise<void> {
    const document = await documentService.getDocument(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    try {
      // Clean and preprocess content
      const cleanedContent = this.preprocessContent(document.content);
      
      // Create chunks
      const chunks = this.createChunks(cleanedContent);
      
      // Generate embeddings for each chunk
      const processedChunks = await this.generateEmbeddings(chunks);
      
      // Save chunks to database
      await this.saveChunks(documentId, processedChunks);
      
      // Mark document as processed
      await documentService.updateDocument(documentId, {
        metadata: {
          ...document.metadata,
          processed: true,
          chunkCount: chunks.length,
          processedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Document processing failed:', error);
      throw error;
    }
  }

  /**
   * Preprocess document content
   */
  private preprocessContent(content: string): string {
    return content
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/\n{3,}/g, '\n\n')  // Normalize multiple newlines
      .trim();
  }

  /**
   * Create overlapping chunks from document content
   */
  private createChunks(content: string): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < content.length) {
      const end = Math.min(start + this.chunkSize, content.length);
      let chunk = content.slice(start, end);

      // Try to end at sentence boundary if possible
      if (end < content.length) {
        const lastSentenceEnd = Math.max(
          chunk.lastIndexOf('.'),
          chunk.lastIndexOf('!'),
          chunk.lastIndexOf('?')
        );
        
        if (lastSentenceEnd > this.chunkSize * 0.7) {
          chunk = chunk.slice(0, lastSentenceEnd + 1);
        }
      }

      chunks.push(chunk);
      start += chunk.length - this.chunkOverlap;
    }

    return chunks.filter(chunk => chunk.trim().length > 50); // Filter out very small chunks
  }

  /**
   * Generate embeddings for chunks (simulated)
   */
  private async generateEmbeddings(chunks: string[]): Promise<Array<{ content: string; embedding: number[] }>> {
    // In a real implementation, this would use OpenAI's embeddings API or similar
    // For now, we'll simulate embedding generation
    
    return chunks.map(chunk => ({
      content: chunk,
      embedding: this.generateSimulatedEmbedding(chunk)
    }));
  }

  /**
   * Generate simulated embedding vector
   */
  private generateSimulatedEmbedding(text: string): number[] {
    const dimensions = 1536; // OpenAI embedding size
    const embedding: number[] = [];
    
    // Create a deterministic but seemingly random embedding based on text content
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Use hash as seed for pseudo-random but deterministic values
    const random = this.seededRandom(hash);
    
    for (let i = 0; i < dimensions; i++) {
      embedding.push(random() * 2 - 1); // Values between -1 and 1
    }
    
    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
  }

  /**
   * Seeded random number generator for deterministic embeddings
   */
  private seededRandom(seed: number): () => number {
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  /**
   * Save chunks to database
   */
  private async saveChunks(documentId: string, chunks: Array<{ content: string; embedding: number[] }>): Promise<void> {
    const chunkData = chunks.map((chunk, index) => ({
      documentId,
      content: chunk.content,
      chunkIndex: index,
      embedding: JSON.stringify(chunk.embedding),
      metadata: JSON.stringify({
        tokenCount: chunk.content.split(' ').length,
        characterCount: chunk.content.length
      })
    }));

    await db.documentChunk.createMany({
      data: chunkData
    });
  }

  /**
   * Perform semantic search using embeddings
   */
  async semanticSearch(query: string, options: RAGQueryOptions = {}): Promise<SearchResult[]> {
    const {
      groupId,
      limit = 10,
      threshold = 0.7,
      filters = {}
    } = options;

    const startTime = Date.now();

    try {
      // Generate query embedding
      const queryEmbedding = this.generateSimulatedEmbedding(query);

      // Build base query
      let whereClause: any = {};
      
      // Filter by document group if specified
      if (groupId) {
        whereClause.document = {
          documentGroups: {
            some: {
              documentGroupId: groupId
            }
          }
        };
      }

      // Apply additional filters
      if (filters.fileType) {
        whereClause.document = {
          ...whereClause.document,
          fileType: filters.fileType
        };
      }

      // Get all chunks with their documents
      const chunks = await db.documentChunk.findMany({
        where: whereClause,
        include: {
          document: true
        }
      });

      // Calculate similarity scores
      const results: SearchResult[] = chunks
        .map(chunk => {
          const chunkEmbedding = JSON.parse(chunk.embedding || '[]');
          const similarity = this.calculateCosineSimilarity(queryEmbedding, chunkEmbedding);
          
          return {
            chunk: {
              ...chunk,
              embedding: chunkEmbedding,
              metadata: JSON.parse(chunk.metadata || '{}')
            },
            document: chunk.document as Document,
            score: similarity,
            relevance: this.calculateRelevanceScore(query, chunk.content, similarity)
          };
        })
        .filter(result => result.score >= threshold)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // Log the query for analytics
      await this.logQuery(query, groupId, filters, results, Date.now() - startTime);

      return results;
    } catch (error) {
      console.error('Semantic search failed:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;

    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Calculate relevance score based on multiple factors
   */
  private calculateRelevanceScore(query: string, content: string, similarity: number): number {
    // Keyword matching score
    const queryWords = query.toLowerCase().split(' ');
    const contentLower = content.toLowerCase();
    
    const keywordMatches = queryWords.filter(word => 
      word.length > 2 && contentLower.includes(word)
    ).length;
    
    const keywordScore = keywordMatches / queryWords.length;
    
    // Combine similarity and keyword scores
    return (similarity * 0.7) + (keywordScore * 0.3);
  }

  /**
   * Log RAG query for analytics
   */
  private async logQuery(
    query: string, 
    groupId: string | undefined, 
    filters: any, 
    results: SearchResult[], 
    executionTime: number
  ): Promise<void> {
    await db.rAGQuery.create({
      data: {
        query,
        groupId,
        filters: JSON.stringify(filters),
        results: JSON.stringify(results.map(r => ({
          documentId: r.document.id,
          score: r.score,
          relevance: r.relevance
        }))),
        executionTime
      }
    });
  }

  /**
   * Get document chunks for a specific document
   */
  async getDocumentChunks(documentId: string): Promise<DocumentChunk[]> {
    const chunks = await db.documentChunk.findMany({
      where: { documentId },
      orderBy: { chunkIndex: 'asc' }
    });

    return chunks.map(chunk => ({
      ...chunk,
      embedding: JSON.parse(chunk.embedding || '[]'),
      metadata: JSON.parse(chunk.metadata || '{}')
    })) as DocumentChunk[];
  }

  /**
   * Reindex all documents in a group
   */
  async reindexGroup(groupId: string): Promise<void> {
    const group = await documentService.getDocumentGroup(groupId);
    if (!group) return;

    // Clear existing chunks for documents in this group
    const documentIds = group.documents.map(doc => doc.id);
    await db.documentChunk.deleteMany({
      where: { documentId: { in: documentIds } }
    });

    // Reprocess each document
    for (const documentId of documentIds) {
      try {
        await this.processDocument(documentId);
      } catch (error) {
        console.error(`Failed to reprocess document ${documentId}:`, error);
      }
    }
  }

  /**
   * Get RAG analytics and statistics
   */
  async getAnalytics(): Promise<{
    totalDocuments: number;
    processedDocuments: number;
    totalChunks: number;
    averageChunksPerDocument: number;
    recentQueries: Array<{
      query: string;
      executionTime: number;
      resultCount: number;
      timestamp: Date;
    }>;
  }> {
    try {
      const response = await fetch('/api/rag/analytics');
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const analytics = await response.json();
      
      const {
        totalDocuments,
        processedDocuments,
        totalChunks,
        recentQueries,
        processingRate
      } = analytics;

      const averageChunksPerDocument = processedDocuments > 0 
        ? totalChunks / processedDocuments 
        : 0;

      const formattedRecentQueries = recentQueries.map(query => ({
        query: query.query,
        executionTime: query.executionTime || 0,
        resultCount: Array.isArray(query.results) ? query.results.length : 0,
        timestamp: new Date(query.createdAt)
      }));

      return {
        totalDocuments,
        processedDocuments,
        totalChunks,
        averageChunksPerDocument,
        processingRate: processingRate || 0,
        recentQueries: formattedRecentQueries
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      
      // Return default analytics on error
      return {
        totalDocuments: 0,
        processedDocuments: 0,
        totalChunks: 0,
        averageChunksPerDocument: 0,
        processingRate: 0,
        recentQueries: []
      };
    }
  }

  /**
   * Hybrid search combining semantic and keyword search
   */
  async hybridSearch(query: string, options: RAGQueryOptions = {}): Promise<SearchResult[]> {
    const [semanticResults, keywordResults] = await Promise.all([
      this.semanticSearch(query, options),
      this.keywordSearch(query, options)
    ]);

    // Combine and deduplicate results
    const combinedMap = new Map<string, SearchResult>();

    // Add semantic results
    semanticResults.forEach(result => {
      combinedMap.set(result.chunk.id, result);
    });

    // Add or merge keyword results
    keywordResults.forEach(result => {
      const existing = combinedMap.get(result.chunk.id);
      if (existing) {
        // Boost score if found by both methods
        existing.score = Math.max(existing.score, result.score) * 1.1;
        existing.relevance = Math.max(existing.relevance, result.relevance);
      } else {
        combinedMap.set(result.chunk.id, result);
      }
    });

    return Array.from(combinedMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, options.limit || 10);
  }

  /**
   * Keyword-based search
   */
  private async keywordSearch(query: string, options: RAGQueryOptions = {}): Promise<SearchResult[]> {
    const { groupId, limit = 10 } = options;
    
    let whereClause: any = {
      OR: [
        { content: { contains: query, mode: 'insensitive' } },
        { document: { title: { contains: query, mode: 'insensitive' } } }
      ]
    };

    if (groupId) {
      whereClause.document = {
        documentGroups: {
          some: {
            documentGroupId: groupId
          }
        }
      };
    }

    const chunks = await db.documentChunk.findMany({
      where: whereClause,
      include: {
        document: true
      },
      take: limit
    });

    return chunks.map(chunk => ({
      chunk: {
        ...chunk,
        embedding: JSON.parse(chunk.embedding || '[]'),
        metadata: JSON.parse(chunk.metadata || '{}')
      },
      document: chunk.document as Document,
      score: 0.6, // Base score for keyword matches
      relevance: this.calculateRelevanceScore(query, chunk.content, 0.6)
    }));
  }
}

export const ragService = new RAGService();