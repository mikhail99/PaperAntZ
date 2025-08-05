import { NextRequest, NextResponse } from 'next/server';
import { documentService } from '@/lib/services/document-service';

// GET /api/documents - Get all documents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || undefined;

    const result = await documentService.getAllDocuments(page, pageSize, search);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST /api/documents - Create a new document
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const metadata = formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : undefined;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File is required' },
        { status: 400 }
      );
    }

    // Convert file to text (simplified - in production, use proper file processing)
    const content = await file.text();
    const documentTitle = title || file.name;
    const source = file.name;
    const fileType = file.type;
    const fileSize = file.size;

    const document = await documentService.createDocument(
      documentTitle,
      content,
      source,
      fileType,
      fileSize,
      metadata
    );

    // Process document content asynchronously
    documentService.processDocumentContent(document.id).catch(error => {
      console.error('Document processing failed:', error);
    });

    return NextResponse.json({
      success: true,
      data: document,
      message: 'Document uploaded successfully'
    });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create document' },
      { status: 500 }
    );
  }
}