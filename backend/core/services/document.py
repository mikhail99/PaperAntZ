"""
Document management service for handling file uploads and text extraction
"""

import os
import uuid
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path
import json

from api.v1.models import Document, DocumentMetadata, DocumentUploadResponse
from utils.config import settings
from utils.helpers import generate_id, get_timestamp, sanitize_filename, calculate_file_size, AsyncMockDelay

class DocumentService:
    """Service for managing documents and file uploads"""
    
    def __init__(self):
        self.documents: Dict[str, Document] = {}
        self.upload_dir = Path(settings.upload_dir)
        self.upload_dir.mkdir(exist_ok=True)
        
        # Supported file types and their handlers
        self.file_handlers = {
            '.txt': self._extract_text_from_txt,
            '.pdf': self._extract_text_from_pdf,
            '.doc': self._extract_text_from_doc,
            '.docx': self._extract_text_from_docx
        }
    
    async def upload_document(self, file_content: bytes, filename: str, metadata: Dict[str, Any] = None) -> DocumentUploadResponse:
        """Upload and process a document"""
        try:
            # Generate document ID
            document_id = generate_id("doc")
            
            # Sanitize filename
            safe_filename = sanitize_filename(filename)
            
            # Determine file extension
            file_ext = Path(safe_filename).suffix.lower()
            
            # Validate file type
            if file_ext not in settings.allowed_extensions:
                raise ValueError(f"File type {file_ext} not supported. Allowed types: {', '.join(settings.allowed_extensions)}")
            
            # Validate file size
            if len(file_content) > settings.max_file_size:
                raise ValueError(f"File size {calculate_file_size(len(file_content))} exceeds maximum allowed size {calculate_file_size(settings.max_file_size)}")
            
            # Save file
            file_path = self.upload_dir / f"{document_id}{file_ext}"
            with open(file_path, 'wb') as f:
                f.write(file_content)
            
            # Extract text content
            extracted_text = await self._extract_text(file_path, file_ext)
            
            # Create document metadata
            doc_metadata = DocumentMetadata(
                author=metadata.get('author') if metadata else None,
                pages=self._estimate_pages(file_content, file_ext),
                word_count=len(extracted_text.split()) if extracted_text else 0,
                extraction_confidence=0.95 if extracted_text else 0.0
            )
            
            # Create document record
            document = Document(
                id=document_id,
                title=Path(safe_filename).stem,
                type=file_ext.replace('.', ''),
                size=len(file_content),
                created_at=datetime.now(),
                content=extracted_text,
                metadata=doc_metadata
            )
            
            # Store document
            self.documents[document_id] = document
            
            # Create response
            response = DocumentUploadResponse(
                document_id=document_id,
                title=document.title,
                status="processed",
                extracted_text=extracted_text[:500] + "..." if extracted_text and len(extracted_text) > 500 else extracted_text,
                metadata=doc_metadata
            )
            
            return response
            
        except Exception as e:
            raise Exception(f"Failed to upload document: {str(e)}")
    
    async def get_document(self, document_id: str) -> Optional[Document]:
        """Get document by ID"""
        return self.documents.get(document_id)
    
    async def get_all_documents(self) -> List[Document]:
        """Get all documents"""
        return list(self.documents.values())
    
    async def delete_document(self, document_id: str) -> bool:
        """Delete a document"""
        try:
            if document_id not in self.documents:
                return False
            
            document = self.documents[document_id]
            
            # Delete file from disk
            file_path = self.upload_dir / f"{document_id}.{document.type}"
            if file_path.exists():
                file_path.unlink()
            
            # Remove from storage
            del self.documents[document_id]
            
            return True
            
        except Exception as e:
            print(f"Error deleting document {document_id}: {e}")
            return False
    
    async def search_documents(self, query: str) -> List[Document]:
        """Search documents by content or metadata"""
        query_lower = query.lower()
        results = []
        
        for document in self.documents.values():
            # Search in title
            if query_lower in document.title.lower():
                results.append(document)
                continue
            
            # Search in content
            if document.content and query_lower in document.content.lower():
                results.append(document)
                continue
            
            # Search in metadata
            if (document.metadata.author and query_lower in document.metadata.author.lower()):
                results.append(document)
        
        return results
    
    async def _extract_text(self, file_path: Path, file_ext: str) -> str:
        """Extract text from document based on file type"""
        await AsyncMockDelay.delay(0.5)  # Simulate processing time
        
        handler = self.file_handlers.get(file_ext)
        if handler:
            return await handler(file_path)
        else:
            return f"Text extraction not supported for {file_ext} files"
    
    async def _extract_text_from_txt(self, file_path: Path) -> str:
        """Extract text from TXT file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except UnicodeDecodeError:
            # Try with different encoding
            with open(file_path, 'r', encoding='latin-1') as f:
                return f.read()
    
    async def _extract_text_from_pdf(self, file_path: Path) -> str:
        """Extract text from PDF file (mock implementation)"""
        # In a real implementation, this would use PyPDF2 or similar
        await AsyncMockDelay.delay(1.0)  # PDF processing takes longer
        
        # Mock extracted text
        return f"""This is a mock PDF document extracted from {file_path.name}.
        
The document contains multiple pages of text content. In a real implementation, 
this would use libraries like PyPDF2, pdfplumber, or similar to extract the actual 
text content from the PDF file.

Key features that would be implemented:
- Text extraction from each page
- Preservation of formatting where possible
- Handling of different PDF encodings
- Image text extraction (OCR)
- Metadata extraction

For now, this is simulated text content that would typically be extracted from 
a PDF document containing research papers, reports, or other textual content.
The actual implementation would depend on the specific requirements and the 
complexity of the PDF files being processed."""
    
    async def _extract_text_from_doc(self, file_path: Path) -> str:
        """Extract text from DOC file (mock implementation)"""
        await AsyncMockDelay.delay(0.8)
        
        return f"""Mock DOC document content from {file_path.name}.

In a real implementation, this would use libraries like python-docx or similar 
to extract text content from Microsoft Word documents (.doc files).

The extraction process would handle:
- Text paragraphs and formatting
- Tables and structured content
- Headers and footers
- Document metadata
- Embedded objects

This simulated content represents what would typically be extracted from a 
Word document containing research data, reports, or other textual information."""
    
    async def _extract_text_from_docx(self, file_path: Path) -> str:
        """Extract text from DOCX file (mock implementation)"""
        await AsyncMockDelay.delay(0.8)
        
        return f"""Mock DOCX document content from {file_path.name}.

In a real implementation, this would use the python-docx library to extract 
text content from modern Microsoft Word documents (.docx files).

The extraction would include:
- All text paragraphs in order
- Basic formatting information
- Table contents
- Document structure
- Metadata and properties

This simulated text represents the type of content that would be extracted 
from a DOCX file, which could include research papers, reports, 
documentation, or other textual documents."""
    
    def _estimate_pages(self, file_content: bytes, file_ext: str) -> Optional[int]:
        """Estimate number of pages in document"""
        # Simple estimation based on file size and type
        if file_ext == '.txt':
            # Rough estimate: 3000 characters per page
            return max(1, len(file_content) // 3000)
        elif file_ext in ['.pdf', '.doc', '.docx']:
            # Rough estimate based on file size
            size_kb = len(file_content) / 1024
            return max(1, int(size_kb / 20))  # Assume 20KB per page
        
        return None
    
    def get_storage_stats(self) -> Dict[str, Any]:
        """Get document storage statistics"""
        total_documents = len(self.documents)
        total_size = sum(doc.size for doc in self.documents.values())
        
        file_type_counts = {}
        for doc in self.documents.values():
            file_type_counts[doc.type] = file_type_counts.get(doc.type, 0) + 1
        
        return {
            "total_documents": total_documents,
            "total_size_bytes": total_size,
            "total_size_human": calculate_file_size(total_size),
            "file_type_distribution": file_type_counts,
            "storage_directory": str(self.upload_dir),
            "max_file_size": settings.max_file_size,
            "max_file_size_human": calculate_file_size(settings.max_file_size)
        }
    
    def cleanup_old_documents(self, max_age_hours: int = 24) -> int:
        """Clean up old documents"""
        cutoff_time = datetime.now().timestamp() - (max_age_hours * 3600)
        
        documents_to_remove = []
        for doc_id, document in self.documents.items():
            if document.created_at.timestamp() < cutoff_time:
                documents_to_remove.append(doc_id)
        
        removed_count = 0
        for doc_id in documents_to_remove:
            if asyncio.run(self.delete_document(doc_id)):
                removed_count += 1
        
        return removed_count

# Global document service instance
document_service = DocumentService()