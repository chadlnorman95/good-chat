"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, Calendar, MessageSquare, Hash, Clock, ExternalLink } from "lucide-react";
import { Input } from "ui/input";
import { Button } from "ui/button";
import { Badge } from "ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";
import { Calendar as CalendarComponent } from "ui/calendar";
import { format } from "date-fns";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAnalytics } from "@/hooks/use-analytics";
import { SearchResult } from "lib/search/search-service";
import { cn } from "lib/utils";
import Link from "next/link";
import { Skeleton } from "ui/skeleton";

interface SearchResponse {
  results: SearchResult[];
  query: string;
  type: string;
  total: number;
  hasMore: boolean;
}

interface SearchFilters {
  type: "all" | "chats" | "messages";
  dateFrom?: Date;
  dateTo?: Date;
  projectId?: string;
}

export function SearchInterface() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [filters, setFilters] = useState<SearchFilters>({
    type: (searchParams.get("type") as any) || "all",
    dateFrom: searchParams.get("dateFrom") ? new Date(searchParams.get("dateFrom")!) : undefined,
    dateTo: searchParams.get("dateTo") ? new Date(searchParams.get("dateTo")!) : undefined,
    projectId: searchParams.get("projectId") || undefined,
  });
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedQuery = useDebouncedValue(query, 300);
  const { trackSearchQuery } = useAnalytics();

  // Update URL when search parameters change
  const updateURL = useCallback((newQuery: string, newFilters: SearchFilters) => {
    const params = new URLSearchParams();
    
    if (newQuery) params.set("q", newQuery);
    if (newFilters.type !== "all") params.set("type", newFilters.type);
    if (newFilters.dateFrom) params.set("dateFrom", newFilters.dateFrom.toISOString());
    if (newFilters.dateTo) params.set("dateTo", newFilters.dateTo.toISOString());
    if (newFilters.projectId) params.set("projectId", newFilters.projectId);

    const newURL = params.toString() ? `/search?${params.toString()}` : "/search";
    router.replace(newURL, { scroll: false });
  }, [router]);

  // Perform search
  const performSearch = useCallback(async (
    searchQuery: string,
    searchFilters: SearchFilters,
    searchOffset: number = 0,
    append: boolean = false
  ) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasMore(false);
      return;
    }

    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        type: searchFilters.type,
        limit: "20",
        offset: searchOffset.toString(),
      });

      if (searchFilters.dateFrom) {
        params.set("dateFrom", searchFilters.dateFrom.toISOString());
      }
      if (searchFilters.dateTo) {
        params.set("dateTo", searchFilters.dateTo.toISOString());
      }
      if (searchFilters.projectId) {
        params.set("projectId", searchFilters.projectId);
      }

      const response = await fetch(`/api/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data: SearchResponse = await response.json();
      
      if (append) {
        setResults(prev => [...prev, ...data.results]);
      } else {
        setResults(data.results);
        
        // Track search query (only for new searches, not pagination)
        trackSearchQuery(searchQuery, data.results.length, {
          filters: searchFilters,
          searchType: data.results.length > 0 ? 'successful' : 'no_results',
        });
      }
      
      setHasMore(data.hasMore);
      setOffset(searchOffset + data.results.length);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get search suggestions
  const getSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: "5",
      });

      const response = await fetch(`/api/search/suggestions?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error("Suggestions error:", error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Effect for performing search when query or filters change
  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery, filters, 0, false);
      updateURL(debouncedQuery, filters);
    } else {
      setResults([]);
      setHasMore(false);
    }
  }, [debouncedQuery, filters, performSearch, updateURL]);

  // Effect for getting suggestions
  useEffect(() => {
    getSuggestions(query);
  }, [query, getSuggestions]);

  // Load more results
  const loadMore = useCallback(() => {
    if (hasMore && !isLoading && debouncedQuery) {
      performSearch(debouncedQuery, filters, offset, true);
    }
  }, [hasMore, isLoading, debouncedQuery, filters, offset, performSearch]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    setOffset(0);
  }, [filters]);

  // Clear filters
  const clearFilters = useCallback(() => {
    const clearedFilters: SearchFilters = { type: "all" };
    setFilters(clearedFilters);
    setOffset(0);
  }, []);

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups = {
      chats: results.filter(r => r.type === "chat"),
      messages: results.filter(r => r.type === "message"),
    };
    return groups;
  }, [results]);

  const hasActiveFilters = filters.type !== "all" || filters.dateFrom || filters.dateTo || filters.projectId;

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Search className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Search</h1>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your chats and messages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-4 h-12 text-lg"
            autoFocus
          />
          
          {/* Search Suggestions */}
          {suggestions.length > 0 && query && (
            <Card className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto">
              <CardContent className="p-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-3 py-2 hover:bg-muted rounded-md text-sm"
                    onClick={() => setQuery(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && "bg-muted")}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                !
              </Badge>
            )}
          </Button>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}

          {/* Active filter badges */}
          {filters.type !== "all" && (
            <Badge variant="secondary">
              Type: {filters.type}
            </Badge>
          )}
          {filters.dateFrom && (
            <Badge variant="secondary">
              From: {format(filters.dateFrom, "MMM d, yyyy")}
            </Badge>
          )}
          {filters.dateTo && (
            <Badge variant="secondary">
              To: {format(filters.dateTo, "MMM d, yyyy")}
            </Badge>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Content Type Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content Type</label>
                  <Select
                    value={filters.type}
                    onValueChange={(value: any) => handleFilterChange({ type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="chats">Chats</SelectItem>
                      <SelectItem value="messages">Messages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date From Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {filters.dateFrom ? format(filters.dateFrom, "MMM d, yyyy") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filters.dateFrom}
                        onSelect={(date) => handleFilterChange({ dateFrom: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Date To Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">To Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {filters.dateTo ? format(filters.dateTo, "MMM d, yyyy") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filters.dateTo}
                        onSelect={(date) => handleFilterChange({ dateTo: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Search Results */}
      <div className="flex-1 space-y-4">
        {isLoading && results.length === 0 ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-3 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : results.length > 0 ? (
          <Tabs value={filters.type} onValueChange={(value: any) => handleFilterChange({ type: value })}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                All ({results.length})
              </TabsTrigger>
              <TabsTrigger value="chats">
                <Hash className="h-4 w-4 mr-1" />
                Chats ({groupedResults.chats.length})
              </TabsTrigger>
              <TabsTrigger value="messages">
                <MessageSquare className="h-4 w-4 mr-1" />
                Messages ({groupedResults.messages.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <SearchResultsList results={results} />
            </TabsContent>

            <TabsContent value="chats" className="space-y-4">
              <SearchResultsList results={groupedResults.chats} />
            </TabsContent>

            <TabsContent value="messages" className="space-y-4">
              <SearchResultsList results={groupedResults.messages} />
            </TabsContent>
          </Tabs>
        ) : query && !isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Start searching</h3>
              <p className="text-muted-foreground">
                Enter a search term to find your chats and messages
              </p>
            </CardContent>
          </Card>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Load more results"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchResultsList({ results }: { results: SearchResult[] }) {
  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No results in this category</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((result) => (
        <SearchResultCard key={result.id} result={result} />
      ))}
    </div>
  );
}

function SearchResultCard({ result }: { result: SearchResult }) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(date, "h:mm a");
    } else if (diffInHours < 24 * 7) {
      return format(date, "EEE h:mm a");
    } else {
      return format(date, "MMM d, yyyy");
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              {result.type === "chat" ? (
                <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <Link
                href={result.url}
                className="font-medium hover:underline truncate"
              >
                {result.title}
              </Link>
              <Badge variant="secondary" className="text-xs">
                {result.type}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {result.content}
            </p>
            
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{formatDate(result.createdAt)}</span>
              </div>
              
              {result.metadata?.messageRole && (
                <Badge variant="outline" className="text-xs">
                  {result.metadata.messageRole}
                </Badge>
              )}
              
              {result.metadata?.chatTitle && result.type === "message" && (
                <span className="truncate">
                  in "{result.metadata.chatTitle}"
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <Badge variant="outline" className="text-xs">
              {Math.round(result.score)}%
            </Badge>
            <Link href={result.url}>
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}