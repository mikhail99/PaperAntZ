"""
Document management endpoints
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks, Body
from typing import List, Optional, Dict, Any
import json

from api.v1.models import (
    DocumentListResponse, DocumentUploadResponse, DocumentResponse,
    Document, DocumentSearchResponse, DocumentSearchResult
)
from core.services.document import document_service
from core.collections_manager import CollectionsManager
from core.services.paperqa_service import paperqa_service
from utils.helpers import create_success_response, create_error_response

router = APIRouter()

@router.get("/documents", response_model=DocumentListResponse)
async def get_documents():
    """Get all available documents"""
    try:
        documents = await document_service.get_all_documents()
        
        return DocumentListResponse(
            success=True,
            message="Documents retrieved successfully",
            data=documents
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve documents: {str(e)}"
        )

@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: str):
    """Get specific document details"""
    try:
        document = await document_service.get_document(document_id)
        
        if not document:
            raise HTTPException(
                status_code=404,
                detail=f"Document '{document_id}' not found"
            )
        
        return DocumentResponse(
            success=True,
            message=f"Document '{document_id}' retrieved successfully",
            data=document
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve document: {str(e)}"
        )

@router.post("/documents/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    metadata: str = Form(None)
):
    """Upload a new document"""
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="No filename provided"
            )
        
        # Parse metadata if provided
        metadata_dict = {}
        if metadata:
            try:
                metadata_dict = json.loads(metadata)
            except json.JSONDecodeError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid metadata JSON format"
                )
        
        # Read file content
        file_content = await file.read()
        
        # Upload document
        response = await document_service.upload_document(
            file_content=file_content,
            filename=file.filename,
            metadata=metadata_dict
        )
        
        return DocumentUploadResponse(
            success=True,
            message="Document uploaded and processed successfully",
            data=response
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload document: {str(e)}"
        )

@router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document"""
    try:
        success = await document_service.delete_document(document_id)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"Document '{document_id}' not found"
            )
        
        return create_success_response(
            data={"document_id": document_id},
            message=f"Document '{document_id}' deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete document: {str(e)}"
        )

@router.get("/documents/search/{query}")
async def search_documents(query: str):
    """Search documents by content or metadata"""
    try:
        if not query or not query.strip():
            raise HTTPException(
                status_code=400,
                detail="Search query cannot be empty"
            )
        
        documents = await document_service.search_documents(query.strip())
        
        return DocumentListResponse(
            success=True,
            message=f"Found {len(documents)} documents matching '{query}'",
            data=documents
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to search documents: {str(e)}"
        )

@router.get("/documents/stats")
async def get_document_stats():
    """Get document storage statistics"""
    try:
        stats = document_service.get_storage_stats()
        
        return create_success_response(
            data=stats,
            message="Document statistics retrieved successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get document statistics: {str(e)}"
        )

@router.post("/documents/cleanup")
async def cleanup_documents(
    background_tasks: BackgroundTasks,
    max_age_hours: int = 24
):
    """Clean up old documents"""
    try:
        # Run cleanup in background
        background_tasks.add_task(
            document_service.cleanup_old_documents,
            max_age_hours
        )
        
        return create_success_response(
            data={"max_age_hours": max_age_hours},
            message=f"Document cleanup initiated for documents older than {max_age_hours} hours"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initiate document cleanup: {str(e)}"
        )

@router.get("/documents/{document_id}/download")
async def download_document(document_id: str):
    """Download a document file"""
    try:
        document = await document_service.get_document(document_id)
        
        if not document:
            raise HTTPException(
                status_code=404,
                detail=f"Document '{document_id}' not found"
            )
        
        from fastapi.responses import FileResponse
        from pathlib import Path
        
        file_path = Path(document_service.upload_dir) / f"{document_id}.{document.type}"
        
        if not file_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Document file not found"
            )
        
        return FileResponse(
            path=str(file_path),
            filename=f"{document.title}.{document.type}",
            media_type='application/octet-stream'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to download document: {str(e)}"
        )

@router.get("/documents/{document_id}/content")
async def get_document_content(document_id: str):
    """Get document text content"""
    try:
        document = await document_service.get_document(document_id)
        
        if not document:
            raise HTTPException(
                status_code=404,
                detail=f"Document '{document_id}' not found"
            )
        
        if not document.content:
            raise HTTPException(
                status_code=404,
                detail=f"Document '{document_id}' has no extractable text content"
            )
        
        return create_success_response(
            data={
                "document_id": document_id,
                "title": document.title,
                "content": document.content,
                "content_length": len(document.content),
                "word_count": document.metadata.word_count
            },
            message="Document content retrieved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get document content: {str(e)}"
        )


# Initialize CollectionsManager for RAG functionality
collections_manager = CollectionsManager()

@router.get("/document-groups")
async def get_document_groups():
    """Get all document groups (collections) for RAG"""
    try:
        collections = collections_manager.get_all_collections(include_archived=False)
        
        # Format for frontend
        groups = []
        for collection in collections:
            groups.append({
                "id": collection.name,
                "name": collection.name,
                "description": collection.description,
                "article_count": len(collection.articles),
                "tags": [tag.name for tag in collection.tags.values()]
            })
        
        return create_success_response(
            data=groups,
            message="Document groups retrieved successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve document groups: {str(e)}"
        )

@router.get("/document-groups/{group_id}/search")
async def search_documents_in_group(group_id: str, query: str, limit: int = 10):
    """RAG search: Find relevant papers in a document group"""
    try:
        # Search for relevant articles using semantic similarity
        articles = collections_manager.search_articles(
            collection_name=group_id,
            query=query,
            limit=limit
        )
        
        # Format results for RAG context
        search_results = []
        for article in articles:
            search_results.append({
                "id": article.id,
                "title": article.title,
                "authors": article.authors,
                "abstract": article.abstract,
                "url": article.url,
                "publication_date": article.publication_date,
                "relevance_score": 1.0,  # ChromaDB doesn't provide score directly
                "excerpt": article.abstract[:300] + "..." if len(article.abstract) > 300 else article.abstract
            })
        
        return create_success_response(
            data={
                "query": query,
                "group_id": group_id,
                "results": search_results,
                "total_found": len(search_results)
            },
            message=f"Found {len(search_results)} relevant papers"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"RAG search failed: {str(e)}"
        )

@router.post("/document-groups")
async def create_document_group(name: str, description: str = ""):
    """Create a new document group (collection) for organizing papers"""
    try:
        collection = collections_manager.create_collection(name=name, description=description)
        
        return create_success_response(
            data={
                "id": collection.name,
                "name": collection.name,
                "description": collection.description,
                "article_count": 0
            },
            message=f"Document group '{name}' created successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create document group: {str(e)}"
        )

@router.post("/document-groups/{group_id}/paperqa")
async def paperqa_query(group_id: str, question: str = Body(..., embed=True)):
    """PaperQA: Comprehensive document analysis and question answering"""
    try:
        # Use PaperQA service for detailed analysis
        result = await paperqa_service.query_documents(
            collection_name=group_id,
            question=question
        )
        
        if result.get("error"):
            raise HTTPException(
                status_code=400,
                detail=result["error"]
            )
        
        return create_success_response(
            data={
                "question": question,
                "group_id": group_id,
                "answer": result["answer_text"],
                "context": result.get("context", []),
                "sources_used": len(result.get("context", []))
            },
            message="PaperQA analysis completed successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"PaperQA query failed: {str(e)}"
        )