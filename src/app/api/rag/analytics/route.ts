import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const [
      totalDocuments,
      processedDocuments,
      totalChunks,
      recentQueries
    ] = await Promise.all([
      db.document.count(),
      db.document.count({ where: { processed: true } }),
      db.documentChunk.count(),
      db.rAGQuery.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          query: true,
          executionTime: true,
          results: true,
          createdAt: true
        }
      })
    ]);

    const analytics = {
      totalDocuments,
      processedDocuments,
      totalChunks,
      processingRate: totalDocuments > 0 ? (processedDocuments / totalDocuments) * 100 : 0,
      recentQueries: recentQueries.map(query => ({
        ...query,
        results: query.results ? JSON.parse(query.results as string) : null
      }))
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching RAG analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}