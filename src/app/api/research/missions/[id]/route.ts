import { NextRequest, NextResponse } from 'next/server';
import { researchService } from '@/lib/services/research-service';

interface RouteParams {
  params: { id: string };
}

// GET /api/research/missions/[id] - Get a specific research mission
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const mission = await researchService.getMission(params.id);
    
    if (!mission) {
      return NextResponse.json(
        { success: false, error: 'Mission not found' },
        { status: 404 }
      );
    }

    // Check if user owns the mission (simplified for demo)
    if (mission.userId !== 'demo-user') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: mission
    });
  } catch (error) {
    console.error('Error fetching research mission:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch research mission' },
      { status: 500 }
    );
  }
}

// POST /api/research/missions/[id]/execute - Execute a research mission
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const mission = await researchService.getMission(params.id);
    
    if (!mission) {
      return NextResponse.json(
        { success: false, error: 'Mission not found' },
        { status: 404 }
      );
    }

    // Check if user owns the mission (simplified for demo)
    if (mission.userId !== 'demo-user') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Execute the mission asynchronously
    researchService.executeMission(params.id).catch(error => {
      console.error('Mission execution failed:', error);
    });

    return NextResponse.json({
      success: true,
      message: 'Research mission execution started'
    });
  } catch (error) {
    console.error('Error executing research mission:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to execute research mission' },
      { status: 500 }
    );
  }
}