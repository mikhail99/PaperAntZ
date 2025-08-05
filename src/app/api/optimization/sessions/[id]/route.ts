import { NextRequest, NextResponse } from 'next/server';
import { optimizationService } from '@/lib/services/optimization-service';

interface RouteParams {
  params: { id: string };
}

// GET /api/optimization/sessions/[id] - Get a specific optimization session
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const optimizationSession = await optimizationService.getOptimizationSession(params.id);
    
    if (!optimizationSession) {
      return NextResponse.json(
        { success: false, error: 'Optimization session not found' },
        { status: 404 }
      );
    }

    // Check if user owns the session (simplified for demo)
    if (optimizationSession.userId !== 'demo-user') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: optimizationSession
    });
  } catch (error) {
    console.error('Error fetching optimization session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch optimization session' },
      { status: 500 }
    );
  }
}

// POST /api/optimization/sessions/[id]/execute - Execute optimization session
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const optimizationSession = await optimizationService.getOptimizationSession(params.id);
    
    if (!optimizationSession) {
      return NextResponse.json(
        { success: false, error: 'Optimization session not found' },
        { status: 404 }
      );
    }

    // Check if user owns the session (simplified for demo)
    if (optimizationSession.userId !== 'demo-user') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Execute the optimization asynchronously
    optimizationService.executeOptimization(params.id).catch(error => {
      console.error('Optimization execution failed:', error);
    });

    return NextResponse.json({
      success: true,
      message: 'Optimization session execution started'
    });
  } catch (error) {
    console.error('Error executing optimization session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to execute optimization session' },
      { status: 500 }
    );
  }
}