import { NextRequest, NextResponse } from 'next/server';
import { researchService } from '@/lib/services/research-service';

// GET /api/research/missions - Get user's research missions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    const result = await researchService.getUserMissions('demo-user', page, pageSize);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching research missions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch research missions' },
      { status: 500 }
    );
  }
}

// POST /api/research/missions - Create a new research mission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, config } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    const mission = await researchService.createMission(
      'demo-user',
      title,
      description,
      config
    );

    return NextResponse.json({
      success: true,
      data: mission,
      message: 'Research mission created successfully'
    });
  } catch (error) {
    console.error('Error creating research mission:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create research mission' },
      { status: 500 }
    );
  }
}