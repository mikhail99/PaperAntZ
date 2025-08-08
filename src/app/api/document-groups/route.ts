import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default-user';
    const missionId = searchParams.get('missionId');

    const where: any = { userId };
    if (missionId && missionId !== 'null') {
      where.missionId = missionId;
    }

    try {
      const groups = await db.documentGroup.findMany({
        where,
        include: {
          documents: {
            include: {
              document: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const processedGroups = groups.map(group => ({
        ...group,
        tags: group.tags ? JSON.parse(group.tags) : [],
        documents: group.documents.map(gd => ({
          ...(gd.document as any),
          metadata: (gd.document as any).metadata ? JSON.parse((gd.document as any).metadata) : {},
          embedding: (gd.document as any).embedding ? JSON.parse((gd.document as any).embedding) : null,
          relevanceScore: (gd.document as any).relevanceScore,
          processed: (gd.document as any).processed
        })) as any[]
      }));

      return NextResponse.json(processedGroups, { headers: { 'Cache-Control': 'no-store' } });
    } catch (dbError) {
      console.error('Error accessing database for document groups:', dbError);
      return NextResponse.json(
        { error: 'Database unavailable', code: 'DB_UNAVAILABLE' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }
  } catch (error) {
    console.error('Error fetching document groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document groups' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, userId, missionId, category, tags } = await request.json();

    const group = await db.documentGroup.create({
      data: {
        name,
        description,
        userId: userId || 'default-user',
        missionId: missionId || null,
        category,
        tags: tags ? JSON.stringify(tags) : null
      }
    });

    return NextResponse.json(group);
  } catch (error) {
    console.error('Error creating document group:', error);
    return NextResponse.json(
      { error: 'Failed to create document group' },
      { status: 500 }
    );
  }
}