import "server-only";
import { db } from "lib/db/pg";
import { sql } from "drizzle-orm";

export interface KnowledgeDocument {
  id: string;
  userId: string;
  title: string;
  content: string;
  summary?: string;
  tags: string[];
  category?: string;
  sourceType: 'manual' | 'file_upload' | 'chat_export' | 'web_import';
  sourceMetadata?: {
    filename?: string;
    url?: string;
    chatId?: string;
    fileType?: string;
    uploadedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
  accessCount: number;
  isPublic: boolean;
  embedding?: number[]; // For vector search (future enhancement)
}

export interface KnowledgeSearchOptions {
  query: string;
  userId: string;
  category?: string;
  tags?: string[];
  sourceType?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'created' | 'updated' | 'accessed';
  sortOrder?: 'asc' | 'desc';
}

export interface KnowledgeSearchResult {
  document: KnowledgeDocument;
  score: number;
  matchedContent: string;
  highlights: Array<{
    field: string;
    snippet: string;
  }>;
}

/**
 * Knowledge Base Service for managing personal knowledge documents
 */
export class KnowledgeBaseService {
  private static instance: KnowledgeBaseService;

  public static getInstance(): KnowledgeBaseService {
    if (!KnowledgeBaseService.instance) {
      KnowledgeBaseService.instance = new KnowledgeBaseService();
    }
    return KnowledgeBaseService.instance;
  }

  /**
   * Create a new knowledge document
   */
  async createDocument(document: Omit<KnowledgeDocument, 'id' | 'createdAt' | 'updatedAt' | 'accessCount'>): Promise<KnowledgeDocument> {
    try {
      const id = this.generateId();
      const now = new Date();
      
      const newDocument: KnowledgeDocument = {
        ...document,
        id,
        createdAt: now,
        updatedAt: now,
        accessCount: 0,
      };

      // In a real implementation, this would use a proper database table
      // For now, we'll simulate the storage
      console.log('Creating knowledge document:', {
        id: newDocument.id,
        title: newDocument.title,
        userId: newDocument.userId,
        category: newDocument.category,
        tags: newDocument.tags,
        sourceType: newDocument.sourceType,
      });

      return newDocument;
    } catch (error) {
      console.error('Failed to create knowledge document:', error);
      throw new Error('Failed to create document');
    }
  }

  /**
   * Update an existing knowledge document
   */
  async updateDocument(id: string, userId: string, updates: Partial<KnowledgeDocument>): Promise<KnowledgeDocument | null> {
    try {
      // In a real implementation, this would update the database
      console.log('Updating knowledge document:', { id, userId, updates });
      
      // Simulate returning updated document
      const updatedDocument: KnowledgeDocument = {
        id,
        userId,
        title: updates.title || 'Updated Document',
        content: updates.content || '',
        tags: updates.tags || [],
        sourceType: updates.sourceType || 'manual',
        createdAt: new Date(),
        updatedAt: new Date(),
        accessCount: 0,
        isPublic: updates.isPublic || false,
        ...updates,
      };

      return updatedDocument;
    } catch (error) {
      console.error('Failed to update knowledge document:', error);
      throw new Error('Failed to update document');
    }
  }

  /**
   * Delete a knowledge document
   */
  async deleteDocument(id: string, userId: string): Promise<boolean> {
    try {
      // In a real implementation, this would delete from database
      console.log('Deleting knowledge document:', { id, userId });
      return true;
    } catch (error) {
      console.error('Failed to delete knowledge document:', error);
      throw new Error('Failed to delete document');
    }
  }

  /**
   * Get a knowledge document by ID
   */
  async getDocument(id: string, userId: string): Promise<KnowledgeDocument | null> {
    try {
      // In a real implementation, this would query the database
      console.log('Getting knowledge document:', { id, userId });
      
      // Simulate document retrieval
      const document: KnowledgeDocument = {
        id,
        userId,
        title: 'Sample Document',
        content: 'This is sample content for the knowledge document.',
        summary: 'A sample document for demonstration.',
        tags: ['sample', 'demo'],
        category: 'general',
        sourceType: 'manual',
        createdAt: new Date(),
        updatedAt: new Date(),
        accessCount: 1,
        isPublic: false,
      };

      // Update access tracking
      await this.trackAccess(id, userId);

      return document;
    } catch (error) {
      console.error('Failed to get knowledge document:', error);
      return null;
    }
  }

  /**
   * Search knowledge documents
   */
  async searchDocuments(options: KnowledgeSearchOptions): Promise<{
    results: KnowledgeSearchResult[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const {
        query,
        userId,
        category,
        tags,
        sourceType,
        limit = 20,
        offset = 0,
        sortBy = 'relevance',
        sortOrder = 'desc'
      } = options;

      console.log('Searching knowledge documents:', options);

      // In a real implementation, this would use full-text search with PostgreSQL
      // or a dedicated search engine like Elasticsearch
      
      // Simulate search results
      const mockResults: KnowledgeSearchResult[] = [
        {
          document: {
            id: '1',
            userId,
            title: 'Machine Learning Basics',
            content: 'Machine learning is a subset of artificial intelligence that focuses on algorithms...',
            summary: 'Introduction to machine learning concepts and algorithms.',
            tags: ['ml', 'ai', 'algorithms'],
            category: 'technology',
            sourceType: 'manual',
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15'),
            accessCount: 5,
            isPublic: false,
          },
          score: 0.95,
          matchedContent: 'Machine learning is a subset of artificial intelligence...',
          highlights: [
            {
              field: 'title',
              snippet: '<mark>Machine Learning</mark> Basics'
            },
            {
              field: 'content',
              snippet: '<mark>Machine learning</mark> is a subset of artificial intelligence...'
            }
          ]
        },
        {
          document: {
            id: '2',
            userId,
            title: 'React Best Practices',
            content: 'React is a popular JavaScript library for building user interfaces...',
            summary: 'Best practices for React development.',
            tags: ['react', 'javascript', 'frontend'],
            category: 'development',
            sourceType: 'file_upload',
            sourceMetadata: {
              filename: 'react-guide.md',
              fileType: 'text/markdown',
              uploadedAt: new Date('2024-01-10'),
            },
            createdAt: new Date('2024-01-10'),
            updatedAt: new Date('2024-01-12'),
            accessCount: 3,
            isPublic: false,
          },
          score: 0.78,
          matchedContent: 'React is a popular JavaScript library...',
          highlights: [
            {
              field: 'title',
              snippet: '<mark>React</mark> Best Practices'
            }
          ]
        }
      ];

      // Filter results based on search criteria
      let filteredResults = mockResults;
      
      if (category) {
        filteredResults = filteredResults.filter(r => r.document.category === category);
      }
      
      if (tags && tags.length > 0) {
        filteredResults = filteredResults.filter(r => 
          tags.some(tag => r.document.tags.includes(tag))
        );
      }
      
      if (sourceType) {
        filteredResults = filteredResults.filter(r => r.document.sourceType === sourceType);
      }

      // Apply pagination
      const paginatedResults = filteredResults.slice(offset, offset + limit);
      
      return {
        results: paginatedResults,
        total: filteredResults.length,
        hasMore: offset + limit < filteredResults.length,
      };
    } catch (error) {
      console.error('Failed to search knowledge documents:', error);
      return {
        results: [],
        total: 0,
        hasMore: false,
      };
    }
  }

  /**
   * Get user's knowledge documents with pagination
   */
  async getUserDocuments(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      category?: string;
      sortBy?: 'created' | 'updated' | 'accessed' | 'title';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{
    documents: KnowledgeDocument[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const {
        limit = 20,
        offset = 0,
        category,
        sortBy = 'updated',
        sortOrder = 'desc'
      } = options;

      console.log('Getting user documents:', { userId, options });

      // Simulate user documents
      const mockDocuments: KnowledgeDocument[] = [
        {
          id: '1',
          userId,
          title: 'Project Notes',
          content: 'Notes about the current project including requirements and progress.',
          summary: 'Project documentation and notes.',
          tags: ['project', 'notes', 'work'],
          category: 'work',
          sourceType: 'manual',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-16'),
          lastAccessedAt: new Date('2024-01-16'),
          accessCount: 8,
          isPublic: false,
        },
        {
          id: '2',
          userId,
          title: 'Learning Resources',
          content: 'Collection of useful learning resources and tutorials.',
          summary: 'Curated learning materials.',
          tags: ['learning', 'resources', 'education'],
          category: 'education',
          sourceType: 'web_import',
          sourceMetadata: {
            url: 'https://example.com/resources',
          },
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-14'),
          lastAccessedAt: new Date('2024-01-15'),
          accessCount: 12,
          isPublic: true,
        },
        {
          id: '3',
          userId,
          title: 'Meeting Summary',
          content: 'Summary of the team meeting held on January 12th.',
          summary: 'Team meeting notes and action items.',
          tags: ['meeting', 'team', 'summary'],
          category: 'work',
          sourceType: 'chat_export',
          sourceMetadata: {
            chatId: 'chat-123',
          },
          createdAt: new Date('2024-01-12'),
          updatedAt: new Date('2024-01-12'),
          lastAccessedAt: new Date('2024-01-13'),
          accessCount: 3,
          isPublic: false,
        }
      ];

      // Filter by category if specified
      let filteredDocuments = mockDocuments;
      if (category) {
        filteredDocuments = filteredDocuments.filter(doc => doc.category === category);
      }

      // Sort documents
      filteredDocuments.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortBy) {
          case 'created':
            aValue = a.createdAt;
            bValue = b.createdAt;
            break;
          case 'updated':
            aValue = a.updatedAt;
            bValue = b.updatedAt;
            break;
          case 'accessed':
            aValue = a.lastAccessedAt || a.createdAt;
            bValue = b.lastAccessedAt || b.createdAt;
            break;
          case 'title':
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          default:
            aValue = a.updatedAt;
            bValue = b.updatedAt;
        }

        if (sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });

      // Apply pagination
      const paginatedDocuments = filteredDocuments.slice(offset, offset + limit);

      return {
        documents: paginatedDocuments,
        total: filteredDocuments.length,
        hasMore: offset + limit < filteredDocuments.length,
      };
    } catch (error) {
      console.error('Failed to get user documents:', error);
      return {
        documents: [],
        total: 0,
        hasMore: false,
      };
    }
  }

  /**
   * Get knowledge base statistics for a user
   */
  async getUserStats(userId: string): Promise<{
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
  }> {
    try {
      console.log('Getting knowledge base stats for user:', userId);

      // Simulate statistics
      return {
        totalDocuments: 15,
        totalWords: 12500,
        categoryCounts: {
          'work': 8,
          'education': 4,
          'personal': 2,
          'technology': 1,
        },
        tagCounts: {
          'project': 5,
          'notes': 4,
          'learning': 3,
          'meeting': 2,
          'resources': 2,
        },
        sourceTypeCounts: {
          'manual': 10,
          'file_upload': 3,
          'chat_export': 1,
          'web_import': 1,
        },
        recentActivity: [
          {
            date: '2024-01-16',
            documentsCreated: 1,
            documentsUpdated: 2,
            documentsAccessed: 5,
          },
          {
            date: '2024-01-15',
            documentsCreated: 0,
            documentsUpdated: 1,
            documentsAccessed: 8,
          },
          {
            date: '2024-01-14',
            documentsCreated: 2,
            documentsUpdated: 0,
            documentsAccessed: 3,
          },
        ],
      };
    } catch (error) {
      console.error('Failed to get knowledge base stats:', error);
      return {
        totalDocuments: 0,
        totalWords: 0,
        categoryCounts: {},
        tagCounts: {},
        sourceTypeCounts: {},
        recentActivity: [],
      };
    }
  }

  /**
   * Import document from chat conversation
   */
  async importFromChat(
    userId: string,
    chatId: string,
    title: string,
    content: string,
    tags: string[] = [],
    category?: string
  ): Promise<KnowledgeDocument> {
    return this.createDocument({
      userId,
      title,
      content,
      tags,
      category,
      sourceType: 'chat_export',
      sourceMetadata: {
        chatId,
      },
      isPublic: false,
    });
  }

  /**
   * Import document from file processing result
   */
  async importFromFile(
    userId: string,
    filename: string,
    content: string,
    summary?: string,
    tags: string[] = [],
    category?: string,
    fileType?: string
  ): Promise<KnowledgeDocument> {
    return this.createDocument({
      userId,
      title: filename,
      content,
      summary,
      tags,
      category,
      sourceType: 'file_upload',
      sourceMetadata: {
        filename,
        fileType,
        uploadedAt: new Date(),
      },
      isPublic: false,
    });
  }

  /**
   * Get suggested tags based on content
   */
  async suggestTags(content: string, existingTags: string[] = []): Promise<string[]> {
    try {
      // Simple tag suggestion based on common words
      const words = content
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3);

      const wordCount = new Map<string, number>();
      words.forEach(word => {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      });

      // Get top words that aren't already tags
      const suggestions = Array.from(wordCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word)
        .filter(word => !existingTags.includes(word));

      return suggestions;
    } catch (error) {
      console.error('Failed to suggest tags:', error);
      return [];
    }
  }

  /**
   * Track document access
   */
  private async trackAccess(documentId: string, userId: string): Promise<void> {
    try {
      // In a real implementation, this would update access tracking in the database
      console.log('Tracking document access:', { documentId, userId });
    } catch (error) {
      console.error('Failed to track document access:', error);
    }
  }

  /**
   * Generate unique ID for documents
   */
  private generateId(): string {
    return `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const knowledgeBaseService = KnowledgeBaseService.getInstance();