import "server-only";
import { db } from "lib/db/pg";
import { chatThreads, messages } from "lib/db/pg/schema";
import { and, desc, eq, ilike, or, sql, gte, lte } from "drizzle-orm";
import { fuzzySearch } from "lib/fuzzy-search";

export interface SearchFilters {
  userId: string;
  projectId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface SearchResult {
  id: string;
  type: "chat" | "message";
  title: string;
  content: string;
  url: string;
  score: number;
  createdAt: Date;
  updatedAt?: Date;
  metadata?: {
    chatId?: string;
    chatTitle?: string;
    messageRole?: "user" | "assistant" | "system";
    projectId?: string;
    projectName?: string;
  };
}

/**
 * Enhanced search functionality with multiple search strategies:
 * 1. Full-text search using PostgreSQL's built-in capabilities
 * 2. Fuzzy search for typo tolerance
 * 3. Semantic search (can be extended with vector embeddings)
 */

export async function searchChats(
  query: string,
  filters: SearchFilters,
  limit: number = 20,
  offset: number = 0
): Promise<SearchResult[]> {
  const searchTerms = query.trim().toLowerCase();
  
  if (!searchTerms) {
    return [];
  }

  // Build where conditions
  const whereConditions = [
    eq(chatThreads.userId, filters.userId),
  ];

  if (filters.projectId) {
    whereConditions.push(eq(chatThreads.projectId, filters.projectId));
  }

  if (filters.dateFrom) {
    whereConditions.push(gte(chatThreads.createdAt, filters.dateFrom));
  }

  if (filters.dateTo) {
    whereConditions.push(lte(chatThreads.createdAt, filters.dateTo));
  }

  // Full-text search query
  const fullTextResults = await db
    .select({
      id: chatThreads.id,
      title: chatThreads.title,
      createdAt: chatThreads.createdAt,
      updatedAt: chatThreads.updatedAt,
      projectId: chatThreads.projectId,
      // Calculate relevance score based on title match
      score: sql<number>`
        CASE 
          WHEN LOWER(${chatThreads.title}) LIKE ${`%${searchTerms}%`} THEN 100
          WHEN LOWER(${chatThreads.title}) LIKE ${`${searchTerms}%`} THEN 80
          WHEN LOWER(${chatThreads.title}) LIKE ${`%${searchTerms}`} THEN 60
          ELSE 40
        END
      `.as('score'),
    })
    .from(chatThreads)
    .where(
      and(
        ...whereConditions,
        or(
          ilike(chatThreads.title, `%${searchTerms}%`),
          // Add more searchable fields as needed
        )
      )
    )
    .orderBy(desc(sql`score`), desc(chatThreads.updatedAt))
    .limit(limit)
    .offset(offset);

  // Convert to SearchResult format
  const results: SearchResult[] = fullTextResults.map((chat) => ({
    id: chat.id,
    type: "chat" as const,
    title: chat.title || "Untitled Chat",
    content: chat.title || "",
    url: `/chat/${chat.id}`,
    score: chat.score,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    metadata: {
      projectId: chat.projectId || undefined,
    },
  }));

  // Apply fuzzy search for additional results if we have fewer than requested
  if (results.length < limit) {
    const fuzzySearchItems = results.map(r => ({
      id: r.id,
      label: r.title,
    }));

    const fuzzyResults = fuzzySearch(fuzzySearchItems, query);
    
    // Merge and deduplicate results
    const existingIds = new Set(results.map(r => r.id));
    const additionalResults = fuzzyResults
      .filter(item => !existingIds.has(item.id))
      .slice(0, limit - results.length);

    // Convert fuzzy results back to SearchResult format
    for (const fuzzyItem of additionalResults) {
      const originalResult = results.find(r => r.id === fuzzyItem.id);
      if (originalResult) {
        results.push({
          ...originalResult,
          score: originalResult.score * 0.8, // Slightly lower score for fuzzy matches
        });
      }
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

export async function searchMessages(
  query: string,
  filters: SearchFilters,
  limit: number = 20,
  offset: number = 0
): Promise<SearchResult[]> {
  const searchTerms = query.trim().toLowerCase();
  
  if (!searchTerms) {
    return [];
  }

  // Build where conditions
  const whereConditions = [
    eq(chatThreads.userId, filters.userId),
  ];

  if (filters.projectId) {
    whereConditions.push(eq(chatThreads.projectId, filters.projectId));
  }

  if (filters.dateFrom) {
    whereConditions.push(gte(messages.createdAt, filters.dateFrom));
  }

  if (filters.dateTo) {
    whereConditions.push(lte(messages.createdAt, filters.dateTo));
  }

  // Search messages with chat context
  const messageResults = await db
    .select({
      messageId: messages.id,
      messageContent: messages.content,
      messageRole: messages.role,
      messageCreatedAt: messages.createdAt,
      chatId: chatThreads.id,
      chatTitle: chatThreads.title,
      chatCreatedAt: chatThreads.createdAt,
      chatUpdatedAt: chatThreads.updatedAt,
      projectId: chatThreads.projectId,
      // Calculate relevance score
      score: sql<number>`
        CASE 
          WHEN LOWER(${messages.content}) LIKE ${`%${searchTerms}%`} THEN 
            CASE 
              WHEN LOWER(${messages.content}) LIKE ${`${searchTerms}%`} THEN 90
              WHEN LOWER(${messages.content}) LIKE ${`%${searchTerms}`} THEN 70
              ELSE 50
            END
          ELSE 30
        END
      `.as('score'),
    })
    .from(messages)
    .innerJoin(chatThreads, eq(messages.chatId, chatThreads.id))
    .where(
      and(
        ...whereConditions,
        ilike(messages.content, `%${searchTerms}%`),
        // Only search user and assistant messages, not system messages
        or(
          eq(messages.role, "user"),
          eq(messages.role, "assistant")
        )
      )
    )
    .orderBy(desc(sql`score`), desc(messages.createdAt))
    .limit(limit)
    .offset(offset);

  // Convert to SearchResult format
  const results: SearchResult[] = messageResults.map((msg) => {
    // Truncate long messages for preview
    const truncatedContent = msg.messageContent.length > 200 
      ? msg.messageContent.substring(0, 200) + "..."
      : msg.messageContent;

    return {
      id: msg.messageId,
      type: "message" as const,
      title: `Message in "${msg.chatTitle || "Untitled Chat"}"`,
      content: truncatedContent,
      url: `/chat/${msg.chatId}?messageId=${msg.messageId}`,
      score: msg.score,
      createdAt: msg.messageCreatedAt,
      metadata: {
        chatId: msg.chatId,
        chatTitle: msg.chatTitle || undefined,
        messageRole: msg.messageRole as "user" | "assistant",
        projectId: msg.projectId || undefined,
      },
    };
  });

  return results;
}

/**
 * Advanced search with semantic capabilities
 * This can be extended to use vector embeddings for semantic search
 */
export async function semanticSearch(
  query: string,
  filters: SearchFilters,
  limit: number = 20,
  offset: number = 0
): Promise<SearchResult[]> {
  // For now, this combines both chat and message search
  // In the future, this could use vector embeddings for true semantic search
  
  const [chatResults, messageResults] = await Promise.all([
    searchChats(query, filters, Math.ceil(limit / 2), 0),
    searchMessages(query, filters, Math.ceil(limit / 2), 0),
  ]);

  // Combine and sort by relevance
  const combinedResults = [...chatResults, ...messageResults]
    .sort((a, b) => b.score - a.score)
    .slice(offset, offset + limit);

  return combinedResults;
}

/**
 * Get search suggestions based on user's chat history
 */
export async function getSearchSuggestions(
  userId: string,
  query: string,
  limit: number = 5
): Promise<string[]> {
  if (!query || query.length < 2) {
    return [];
  }

  const suggestions = await db
    .select({
      title: chatThreads.title,
    })
    .from(chatThreads)
    .where(
      and(
        eq(chatThreads.userId, userId),
        ilike(chatThreads.title, `%${query}%`)
      )
    )
    .orderBy(desc(chatThreads.updatedAt))
    .limit(limit);

  return suggestions
    .map(s => s.title)
    .filter(Boolean)
    .filter((title, index, arr) => arr.indexOf(title) === index); // Remove duplicates
}

/**
 * Get popular search terms (can be used for search analytics)
 */
export async function getPopularSearchTerms(
  userId: string,
  limit: number = 10
): Promise<{ term: string; count: number }[]> {
  // This would require a search_logs table to track search queries
  // For now, return empty array - can be implemented later
  return [];
}

/**
 * Index content for better search performance
 * This can be called when new chats/messages are created
 */
export async function indexContent(
  contentId: string,
  contentType: "chat" | "message",
  content: string
): Promise<void> {
  // This could create search indexes, generate embeddings, etc.
  // For now, we rely on PostgreSQL's built-in text search
  // Future implementation could include:
  // - Vector embeddings generation
  // - Full-text search indexes
  // - Search analytics tracking
}

/**
 * Clean up search indexes
 */
export async function cleanupSearchIndexes(): Promise<void> {
  // Clean up orphaned search indexes, old embeddings, etc.
  // Implementation depends on the indexing strategy used
}