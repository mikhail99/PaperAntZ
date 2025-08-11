from typing import List, Dict, Optional, Union, Any
from datetime import datetime
from uuid import uuid4
from pydantic import BaseModel, Field, validator

class Tag(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    color: str = "#1890ff"  # Default blue color
    parent_id: Optional[str] = None

class Article(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    title: str
    authors: List[str]
    abstract: str
    publication_date: Union[datetime, str]
    url: Optional[str] = None
    tags: List[str] = []
    favorite: bool = False
    rating: Optional[str] = None  # "accept", "reject", or None
    citation_count: int = 0
    notes: str = ""  # User notes, separate from abstract

    @validator("publication_date", pre=True, always=True)
    def ensure_datetime(cls, v):
        if isinstance(v, datetime):
            return v
        try:
            return datetime.fromisoformat(v)
        except Exception:
            return datetime.now()

class SemanticSearchResult(BaseModel):
    """Structured result from semantic search"""
    id: str
    title: str
    abstract: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    @property
    def authors(self) -> List[str]:
        """Extract authors from metadata"""
        return self.metadata.get('authors', [])
    
    @property
    def publication_date(self) -> Optional[str]:
        """Extract publication date from metadata"""
        return self.metadata.get('publication_date')
    
    @property
    def url(self) -> Optional[str]:
        """Extract URL from metadata"""
        return self.metadata.get('url')
    
    @property
    def relevance_score(self) -> Optional[float]:
        """Extract relevance score from metadata"""
        return self.metadata.get('relevance_score')

class SemanticSearchResponse(BaseModel):
    """Complete response from semantic search"""
    results: List[SemanticSearchResult]
    mode: str = "direct"
    count: int = 0
    
    @validator('count', pre=True, always=True)
    def set_count(cls, v, values):
        """Automatically set count based on results length"""
        if 'results' in values:
            return len(values['results'])
        return v

class Collection(BaseModel):
    name: str
    description: str
    tags: Dict[str, Tag] = {}
    articles: Dict[str, Article] = {}
    archived: bool = False