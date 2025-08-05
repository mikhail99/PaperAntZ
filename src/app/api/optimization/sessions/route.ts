import { NextRequest, NextResponse } from 'next/server';
import { optimizationService } from '@/lib/services/optimization-service';

// GET /api/optimization/sessions - Get user's optimization sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    const result = await optimizationService.getUserOptimizationSessions(
      'demo-user',
      page,
      pageSize
    );

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching optimization sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch optimization sessions' },
      { status: 500 }
    );
  }
}

// POST /api/optimization/sessions - Create a new optimization session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { moduleId, config, promptParameterIds } = body;

    if (!moduleId || !config || !promptParameterIds) {
      return NextResponse.json(
        { success: false, error: 'Module ID, config, and prompt parameter IDs are required' },
        { status: 400 }
      );
    }

    const session = await optimizationService.createOptimizationSession(
      'demo-user',
      moduleId,
      config,
      promptParameterIds
    );

    return NextResponse.json({
      success: true,
      data: session,
      message: 'Optimization session created successfully'
    });
  } catch (error) {
    console.error('Error creating optimization session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create optimization session' },
      { status: 500 }
    );
  }
}