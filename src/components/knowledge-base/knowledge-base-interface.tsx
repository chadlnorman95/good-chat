"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "ui/card";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { Textarea } from "ui/textarea";
import { Badge } from "ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import { ScrollArea } from "ui/scroll-area";
import { Separator } from "ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "ui/dialog";
import { Label } from "ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
import { 
  Search, 
  Plus, 
  BookOpen, 
  FileText, 
  Tag, 
  Calendar,
  Eye,
  Edit,
  Trash2,
  Filter,
  BarChart3,
  Upload,
  MessageSquare,
  Globe,
  Loader2,
  X
} from "lucide-react";
import { KnowledgeDocument } from "lib/knowledge-base/knowledge-base-service";
import { useAnalytics } from "@/hooks/use-analytics";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "lib/utils";

interface KnowledgeBaseStats {
  totalDocuments: number;
  totalWords: number;
  categoryCounts: Record<string, number>;
  tagCounts: Record<string, number>;
  sourceTypeCounts: Record<string, number>;
  recentActivity: Array<{
    date: string;
    documentsCreated: number;
    documentsUpdated: number;
    documentsAccessed: number;
  }>;
}

export function KnowledgeBaseInterface() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [stats, setStats] = useState<KnowledgeBaseStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeDocument | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const { trackFeatureUsed } = useAnalytics();

  // New document form state
  const [newDocument, setNewDocument] = useState({
    title: "",
    content: "",
    summary: "",
    tags: [] as string[],
    category: "",
    isPublic: false,
  });

  // Load documents and stats
  useEffect(() => {
    loadDocuments();
    loadStats();
  }, []);

  // Search when query changes
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      searchDocuments();
    } else {
      loadDocuments();
    }
  }, [debouncedSearchQuery, selectedCategory, selectedTags]);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: '0',
        sortBy: 'updated',
        sortOrder: 'desc',
      });

      if (selectedCategory) {
        params.append('category', selectedCategory);
      }

      const response = await fetch(`/api/knowledge-base/documents?${params}`);
      const data = await response.json();

      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchDocuments = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        query: debouncedSearchQuery,
        limit: '20',
        offset: '0',
      });

      if (selectedCategory) {
        params.append('category', selectedCategory);
      }

      if (selectedTags.length > 0) {
        params.append('tags', selectedTags.join(','));
      }

      const response = await fetch(`/api/knowledge-base/search?${params}`);
      const data = await response.json();

      if (data.success) {
        setDocuments(data.results.map((r: any) => r.document));
      }
    } catch (error) {
      console.error('Failed to search documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/knowledge-base/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const createDocument = async () => {
    if (!newDocument.title.trim() || !newDocument.content.trim()) {
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/knowledge-base/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDocument),
      });

      const data = await response.json();

      if (data.success) {
        setDocuments(prev => [data.document, ...prev]);
        setNewDocument({
          title: "",
          content: "",
          summary: "",
          tags: [],
          category: "",
          isPublic: false,
        });
        setShowCreateDialog(false);
        
        trackFeatureUsed('knowledge_base_create', {
          category: newDocument.category,
          tagCount: newDocument.tags.length,
          contentLength: newDocument.content.length,
        });
      }
    } catch (error) {
      console.error('Failed to create document:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const response = await fetch(`/api/knowledge-base/documents/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== id));
        if (selectedDocument?.id === id) {
          setSelectedDocument(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !newDocument.tags.includes(tag.trim())) {
      setNewDocument(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()],
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewDocument(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'file_upload':
        return <Upload className="h-3 w-3" />;
      case 'chat_export':
        return <MessageSquare className="h-3 w-3" />;
      case 'web_import':
        return <Globe className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  const categories = stats ? Object.keys(stats.categoryCounts) : [];
  const allTags = stats ? Object.keys(stats.tagCounts) : [];

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">
            Manage your personal knowledge documents and notes
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Stats
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Knowledge Base Statistics</DialogTitle>
              </DialogHeader>
              {stats && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">{stats.totalDocuments}</div>
                        <div className="text-sm text-muted-foreground">Total Documents</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">{stats.totalWords.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Total Words</div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Categories</h4>
                      <div className="space-y-1">
                        {Object.entries(stats.categoryCounts).map(([category, count]) => (
                          <div key={category} className="flex justify-between text-sm">
                            <span className="capitalize">{category}</span>
                            <span>{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Source Types</h4>
                      <div className="space-y-1">
                        {Object.entries(stats.sourceTypeCounts).map(([type, count]) => (
                          <div key={type} className="flex justify-between text-sm">
                            <span className="capitalize">{type.replace('_', ' ')}</span>
                            <span>{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newDocument.title}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter document title..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newDocument.category}
                    onValueChange={(value) => setNewDocument(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="research">Research</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {newDocument.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Add tags (press Enter)..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="summary">Summary (optional)</Label>
                  <Textarea
                    id="summary"
                    value={newDocument.summary}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, summary: e.target.value }))}
                    placeholder="Brief summary of the document..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={newDocument.content}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter document content..."
                    rows={8}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createDocument}
                    disabled={isCreating || !newDocument.title.trim() || !newDocument.content.trim()}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Document'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedTags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                    <button
                      onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Documents List */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">
                Documents ({documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : documents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <BookOpen className="h-8 w-8 mb-2" />
                    <p>No documents found</p>
                    <p className="text-sm">Create your first document to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2 p-4">
                    {documents.map((document) => (
                      <Card
                        key={document.id}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-muted/50",
                          selectedDocument?.id === document.id && "bg-muted"
                        )}
                        onClick={() => setSelectedDocument(document)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                {getSourceIcon(document.sourceType)}
                                <h3 className="font-medium truncate">{document.title}</h3>
                              </div>
                              
                              {document.summary && (
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                  {document.summary}
                                </p>
                              )}
                              
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <span className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {formatDate(document.updatedAt)}
                                </span>
                                <span className="flex items-center">
                                  <Eye className="h-3 w-3 mr-1" />
                                  {document.accessCount}
                                </span>
                                {document.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {document.category}
                                  </Badge>
                                )}
                              </div>
                              
                              {document.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {document.tags.slice(0, 3).map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {document.tags.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{document.tags.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-1 ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Edit functionality would go here
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteDocument(document.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Document Viewer */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedDocument ? 'Document Preview' : 'Select a Document'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDocument ? (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">{selectedDocument.title}</h2>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center">
                          {getSourceIcon(selectedDocument.sourceType)}
                          <span className="ml-1 capitalize">
                            {selectedDocument.sourceType.replace('_', ' ')}
                          </span>
                        </span>
                        <span>Updated {formatDate(selectedDocument.updatedAt)}</span>
                        <span>{selectedDocument.accessCount} views</span>
                      </div>

                      {selectedDocument.category && (
                        <Badge variant="outline" className="mb-2">
                          {selectedDocument.category}
                        </Badge>
                      )}

                      {selectedDocument.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {selectedDocument.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              <Tag className="h-2 w-2 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <Separator />

                    {selectedDocument.summary && (
                      <div>
                        <h4 className="font-medium mb-2">Summary</h4>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                          {selectedDocument.summary}
                        </p>
                      </div>
                    )}

                    <div>
                      <h4 className="font-medium mb-2">Content</h4>
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap text-sm">
                          {selectedDocument.content}
                        </pre>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                  <FileText className="h-12 w-12 mb-4" />
                  <p>Select a document to view its content</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}