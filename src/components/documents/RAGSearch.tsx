'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Brain, 
  FileText, 
  BookOpen, 
  Target,
  Clock,
  TrendingUp,
  Filter,
  Sparkles,
  Copy,
  ExternalLink
} from 'lucide-react';
import { ragService, SearchResult, RAGQueryOptions } from '@/lib/services/rag-service';
import { DocumentGroup, Document } from '@/lib/types';

interface RAGSearchProps {
  documentGroups?: DocumentGroup[];
  onResultSelect?: (result: SearchResult) => void;
}

export default function RAGSearch({ documentGroups = [], onResultSelect }: RAGSearchProps) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [searchType, setSearchType] = useState<'semantic' | 'hybrid'>('hybrid');
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  // Search options
  const [searchOptions, setSearchOptions] = useState<RAGQueryOptions>({
    limit: 10,
    threshold: 0.5,
    filters: {}
  });

  useEffect(() => {
    loadAnalytics();
    loadSearchHistory();
  }, []);

  const loadAnalytics = async () => {
    try {
      const analyticsData = await ragService.getAnalytics();
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load RAG analytics:', error);
    }
  };

  const loadSearchHistory = () => {
    // Load from localStorage
    const history = localStorage.getItem('ragSearchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  };

  const saveToHistory = (query: string) => {
    const newHistory = [query, ...searchHistory.filter(q => q !== query)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('ragSearchHistory', JSON.stringify(newHistory));
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      saveToHistory(query);

      const options: RAGQueryOptions = {
        ...searchOptions,
        groupId: selectedGroup === 'all' ? undefined : selectedGroup
      };

      let results: SearchResult[];
      if (searchType === 'semantic') {
        results = await ragService.semanticSearch(query, options);
      } else {
        results = await ragService.hybridSearch(query, options);
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSearch();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Show toast or feedback
    });
  };

  const formatRelevanceScore = (score: number) => {
    return Math.round(score * 100);
  };

  const ResultCard = ({ result }: { result: SearchResult }) => {
    const isPaperQA = result.chunk.metadata?.analysis_type === 'paperqa';
    const isExpanded = expandedResults.has(result.chunk.id);
    const content = result.chunk.content;
    const shouldTruncate = isPaperQA && content.length > 500 && !isExpanded;
    const displayContent = shouldTruncate ? content.substring(0, 500) + '...' : content;

    return (
    <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => onResultSelect?.(result)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {result.document.fileType}
              </Badge>
              <Badge 
                variant={result.relevance > 0.7 ? "default" : result.relevance > 0.5 ? "secondary" : "destructive"}
                className="text-xs"
              >
                {formatRelevanceScore(result.relevance)}% relevant
              </Badge>
            </div>
            <CardTitle className="text-base line-clamp-2">{result.document.title}</CardTitle>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(result.chunk.content);
            }}>
              <Copy className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={(e) => {
              e.stopPropagation();
              window.open(`/documents/${result.document.id}`, '_blank');
            }}>
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className={`text-sm text-gray-600 ${isPaperQA ? '' : 'line-clamp-3'}`}>
            {displayContent}
            {shouldTruncate && (
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-blue-600 mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedResults(prev => new Set([...prev, result.chunk.id]));
                }}
              >
                Show more
              </Button>
            )}
            {isPaperQA && isExpanded && content.length > 500 && (
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-blue-600 mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedResults(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(result.chunk.id);
                    return newSet;
                  });
                }}
              >
                Show less
              </Button>
            )}
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <span>Score: {formatRelevanceScore(result.score)}%</span>
              <span>Chunk #{result.chunk.chunkIndex + 1}</span>
              <span>{result.chunk.metadata?.tokenCount || 0} tokens</span>
            </div>
            <span>{new Date(result.document.createdAt).toLocaleDateString()}</span>
          </div>
          
          {result.chunk.metadata && Object.keys(result.chunk.metadata).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(result.chunk.metadata)
                .filter(([key, value]) => typeof value === 'string' && value.length < 20)
                .map(([key, value]) => (
                  <Badge key={key} variant="outline" className="text-xs">
                    {key}: {value}
                  </Badge>
                ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">RAG Search</h2>
          <p className="text-gray-600">Search your documents using AI-powered semantic understanding</p>
        </div>
        
        {analytics && (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{analytics.totalDocuments} docs</span>
            </div>
            <div className="flex items-center gap-1">
              <Brain className="h-4 w-4" />
              <span>{analytics.processedDocuments} processed</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              <span>{analytics.totalChunks} chunks</span>
            </div>
          </div>
        )}
      </div>

      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Query
          </CardTitle>
          <CardDescription>
            Enter your question or search terms to find relevant document chunks
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Query Input */}
          <div className="relative">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="What would you like to find in your documents? (Press Ctrl+Enter to search)"
              className="min-h-[100px] resize-none"
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              Ctrl+Enter to search
            </div>
          </div>

          {/* Search Options */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Document Group</label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="All groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {documentGroups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Search Type</label>
              <Select value={searchType} onValueChange={(value: 'semantic' | 'hybrid') => setSearchType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semantic">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Semantic Only
                    </div>
                  </SelectItem>
                  <SelectItem value="hybrid">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Hybrid (Semantic + Keyword)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Results Limit</label>
              <Select value={searchOptions.limit?.toString()} onValueChange={(value) => 
                setSearchOptions(prev => ({ ...prev, limit: parseInt(value) }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Results</SelectItem>
                  <SelectItem value="10">10 Results</SelectItem>
                  <SelectItem value="20">20 Results</SelectItem>
                  <SelectItem value="50">50 Results</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Button */}
          <Button 
            onClick={handleSearch} 
            disabled={!query.trim() || loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search Documents
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Search History */}
      {searchHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((historyQuery, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery(historyQuery);
                    setTimeout(() => handleSearch(), 100);
                  }}
                >
                  {historyQuery}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Search Results
                <Badge variant="secondary">{searchResults.length}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <TrendingUp className="h-4 w-4" />
                Avg relevance: {formatRelevanceScore(
                  searchResults.reduce((sum, r) => sum + r.relevance, 0) / searchResults.length
                )}%
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.map((result, index) => (
                <ResultCard key={`${result.chunk.id}-${index}`} result={result} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {query && searchResults.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No results found</h3>
            <p className="text-gray-600 text-center">
              Try adjusting your search terms, selecting a different document group, or lowering the relevance threshold.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Analytics */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              RAG Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{analytics.totalDocuments}</div>
                <div className="text-sm text-gray-600">Total Documents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analytics.processedDocuments}</div>
                <div className="text-sm text-gray-600">Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{analytics.totalChunks}</div>
                <div className="text-sm text-gray-600">Document Chunks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {analytics.averageChunksPerDocument.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Avg Chunks/Doc</div>
              </div>
            </div>
            
            {analytics.recentQueries.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">Recent Queries</h4>
                <div className="space-y-2">
                  {analytics.recentQueries.slice(0, 5).map((query: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1">{query.query}</span>
                      <div className="flex items-center gap-3 text-gray-500">
                        <span>{query.resultCount} results</span>
                        <span>{query.executionTime}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}