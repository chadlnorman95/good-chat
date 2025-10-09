import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { KnowledgeBaseService } from './knowledge-base-service';

describe('KnowledgeBaseService', () => {
  let knowledgeBaseService: KnowledgeBaseService;

  beforeEach(() => {
    knowledgeBaseService = KnowledgeBaseService.getInstance();
    
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = KnowledgeBaseService.getInstance();
      const instance2 = KnowledgeBaseService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('createDocument', () => {
    it('should create a new knowledge document', async () => {
      const documentData = {
        userId: 'user123',
        title: 'Test Document',
        content: 'This is test content for the document.',
        summary: 'A test document',
        tags: ['test', 'document'],
        category: 'testing',
        sourceType: 'manual' as const,
        isPublic: false,
      };

      const result = await knowledgeBaseService.createDocument(documentData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.title).toBe(documentData.title);
      expect(result.content).toBe(documentData.content);
      expect(result.userId).toBe(documentData.userId);
      expect(result.tags).toEqual(documentData.tags);
      expect(result.category).toBe(documentData.category);
      expect(result.sourceType).toBe(documentData.sourceType);
      expect(result.isPublic).toBe(documentData.isPublic);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.accessCount).toBe(0);
    });

    it('should generate unique IDs for documents', async () => {
      const documentData = {
        userId: 'user123',
        title: 'Test Document',
        content: 'Test content',
        tags: [],
        sourceType: 'manual' as const,
        isPublic: false,
      };

      const doc1 = await knowledgeBaseService.createDocument(documentData);
      const doc2 = await knowledgeBaseService.createDocument({
        ...documentData,
        title: 'Another Document',
      });

      expect(doc1.id).not.toBe(doc2.id);
      expect(doc1.id).toMatch(/^kb_\d+_[a-z0-9]+$/);
      expect(doc2.id).toMatch(/^kb_\d+_[a-z0-9]+$/);
    });

    it('should handle errors gracefully', async () => {
      // Mock console.log to throw an error
      vi.spyOn(console, 'log').mockImplementation(() => {
        throw new Error('Logging failed');
      });

      const documentData = {
        userId: 'user123',
        title: 'Test Document',
        content: 'Test content',
        tags: [],
        sourceType: 'manual' as const,
        isPublic: false,
      };

      await expect(knowledgeBaseService.createDocument(documentData))
        .rejects.toThrow('Failed to create document');
    });
  });

  describe('updateDocument', () => {
    it('should update an existing document', async () => {
      const updates = {
        title: 'Updated Title',
        content: 'Updated content',
        tags: ['updated', 'test'],
      };

      const result = await knowledgeBaseService.updateDocument(
        'doc123',
        'user123',
        updates
      );

      expect(result).toBeDefined();
      expect(result!.id).toBe('doc123');
      expect(result!.userId).toBe('user123');
      expect(result!.title).toBe(updates.title);
      expect(result!.content).toBe(updates.content);
      expect(result!.tags).toEqual(updates.tags);
    });

    it('should handle update errors gracefully', async () => {
      // Mock console.log to throw an error
      vi.spyOn(console, 'log').mockImplementation(() => {
        throw new Error('Update failed');
      });

      await expect(knowledgeBaseService.updateDocument('doc123', 'user123', {}))
        .rejects.toThrow('Failed to update document');
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document successfully', async () => {
      const result = await knowledgeBaseService.deleteDocument('doc123', 'user123');
      expect(result).toBe(true);
    });

    it('should handle delete errors gracefully', async () => {
      // Mock console.log to throw an error
      vi.spyOn(console, 'log').mockImplementation(() => {
        throw new Error('Delete failed');
      });

      await expect(knowledgeBaseService.deleteDocument('doc123', 'user123'))
        .rejects.toThrow('Failed to delete document');
    });
  });

  describe('getDocument', () => {
    it('should retrieve a document by ID', async () => {
      const result = await knowledgeBaseService.getDocument('doc123', 'user123');

      expect(result).toBeDefined();
      expect(result!.id).toBe('doc123');
      expect(result!.userId).toBe('user123');
      expect(result!.title).toBeDefined();
      expect(result!.content).toBeDefined();
      expect(result!.accessCount).toBeGreaterThan(0);
    });

    it('should handle retrieval errors gracefully', async () => {
      // Mock console.log to throw an error
      vi.spyOn(console, 'log').mockImplementation(() => {
        throw new Error('Retrieval failed');
      });

      const result = await knowledgeBaseService.getDocument('doc123', 'user123');
      expect(result).toBeNull();
    });
  });

  describe('searchDocuments', () => {
    it('should search documents with basic query', async () => {
      const searchOptions = {
        query: 'machine learning',
        userId: 'user123',
        limit: 10,
        offset: 0,
      };

      const result = await knowledgeBaseService.searchDocuments(searchOptions);

      expect(result).toBeDefined();
      expect(result.results).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.hasMore).toBeDefined();

      if (result.results.length > 0) {
        const firstResult = result.results[0];
        expect(firstResult.document).toBeDefined();
        expect(firstResult.score).toBeGreaterThan(0);
        expect(firstResult.matchedContent).toBeDefined();
        expect(firstResult.highlights).toBeInstanceOf(Array);
      }
    });

    it('should filter by category', async () => {
      const searchOptions = {
        query: 'test',
        userId: 'user123',
        category: 'technology',
      };

      const result = await knowledgeBaseService.searchDocuments(searchOptions);

      expect(result).toBeDefined();
      // In the mock implementation, filtering by category should work
      result.results.forEach(r => {
        expect(r.document.category).toBe('technology');
      });
    });

    it('should filter by tags', async () => {
      const searchOptions = {
        query: 'test',
        userId: 'user123',
        tags: ['ml', 'ai'],
      };

      const result = await knowledgeBaseService.searchDocuments(searchOptions);

      expect(result).toBeDefined();
      // In the mock implementation, filtering by tags should work
      result.results.forEach(r => {
        expect(r.document.tags.some(tag => ['ml', 'ai'].includes(tag))).toBe(true);
      });
    });

    it('should handle search errors gracefully', async () => {
      // Mock console.log to throw an error
      vi.spyOn(console, 'log').mockImplementation(() => {
        throw new Error('Search failed');
      });

      const searchOptions = {
        query: 'test',
        userId: 'user123',
      };

      const result = await knowledgeBaseService.searchDocuments(searchOptions);

      expect(result.results).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('getUserDocuments', () => {
    it('should get user documents with default options', async () => {
      const result = await knowledgeBaseService.getUserDocuments('user123');

      expect(result).toBeDefined();
      expect(result.documents).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.hasMore).toBeDefined();

      if (result.documents.length > 0) {
        result.documents.forEach(doc => {
          expect(doc.userId).toBe('user123');
          expect(doc.id).toBeDefined();
          expect(doc.title).toBeDefined();
          expect(doc.content).toBeDefined();
        });
      }
    });

    it('should filter by category', async () => {
      const result = await knowledgeBaseService.getUserDocuments('user123', {
        category: 'work',
      });

      expect(result).toBeDefined();
      result.documents.forEach(doc => {
        expect(doc.category).toBe('work');
      });
    });

    it('should sort documents correctly', async () => {
      const result = await knowledgeBaseService.getUserDocuments('user123', {
        sortBy: 'title',
        sortOrder: 'asc',
      });

      expect(result).toBeDefined();
      if (result.documents.length > 1) {
        for (let i = 1; i < result.documents.length; i++) {
          expect(result.documents[i].title.toLowerCase())
            .toBeGreaterThanOrEqual(result.documents[i - 1].title.toLowerCase());
        }
      }
    });

    it('should handle pagination', async () => {
      const result = await knowledgeBaseService.getUserDocuments('user123', {
        limit: 1,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result.documents.length).toBeLessThanOrEqual(1);
    });

    it('should handle errors gracefully', async () => {
      // Mock console.log to throw an error
      vi.spyOn(console, 'log').mockImplementation(() => {
        throw new Error('Get documents failed');
      });

      const result = await knowledgeBaseService.getUserDocuments('user123');

      expect(result.documents).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      const result = await knowledgeBaseService.getUserStats('user123');

      expect(result).toBeDefined();
      expect(result.totalDocuments).toBeGreaterThanOrEqual(0);
      expect(result.totalWords).toBeGreaterThanOrEqual(0);
      expect(result.categoryCounts).toBeDefined();
      expect(result.tagCounts).toBeDefined();
      expect(result.sourceTypeCounts).toBeDefined();
      expect(result.recentActivity).toBeInstanceOf(Array);

      if (result.recentActivity.length > 0) {
        result.recentActivity.forEach(activity => {
          expect(activity.date).toBeDefined();
          expect(activity.documentsCreated).toBeGreaterThanOrEqual(0);
          expect(activity.documentsUpdated).toBeGreaterThanOrEqual(0);
          expect(activity.documentsAccessed).toBeGreaterThanOrEqual(0);
        });
      }
    });

    it('should handle stats errors gracefully', async () => {
      // Mock console.log to throw an error
      vi.spyOn(console, 'log').mockImplementation(() => {
        throw new Error('Stats failed');
      });

      const result = await knowledgeBaseService.getUserStats('user123');

      expect(result.totalDocuments).toBe(0);
      expect(result.totalWords).toBe(0);
      expect(result.categoryCounts).toEqual({});
      expect(result.tagCounts).toEqual({});
      expect(result.sourceTypeCounts).toEqual({});
      expect(result.recentActivity).toEqual([]);
    });
  });

  describe('importFromChat', () => {
    it('should import document from chat', async () => {
      const result = await knowledgeBaseService.importFromChat(
        'user123',
        'chat456',
        'Chat Summary',
        'This is a summary of our chat conversation.',
        ['chat', 'summary'],
        'work'
      );

      expect(result).toBeDefined();
      expect(result.title).toBe('Chat Summary');
      expect(result.content).toBe('This is a summary of our chat conversation.');
      expect(result.tags).toEqual(['chat', 'summary']);
      expect(result.category).toBe('work');
      expect(result.sourceType).toBe('chat_export');
      expect(result.sourceMetadata?.chatId).toBe('chat456');
    });
  });

  describe('importFromFile', () => {
    it('should import document from file', async () => {
      const result = await knowledgeBaseService.importFromFile(
        'user123',
        'document.pdf',
        'This is the extracted content from the PDF file.',
        'PDF document summary',
        ['pdf', 'document'],
        'research',
        'application/pdf'
      );

      expect(result).toBeDefined();
      expect(result.title).toBe('document.pdf');
      expect(result.content).toBe('This is the extracted content from the PDF file.');
      expect(result.summary).toBe('PDF document summary');
      expect(result.tags).toEqual(['pdf', 'document']);
      expect(result.category).toBe('research');
      expect(result.sourceType).toBe('file_upload');
      expect(result.sourceMetadata?.filename).toBe('document.pdf');
      expect(result.sourceMetadata?.fileType).toBe('application/pdf');
    });
  });

  describe('suggestTags', () => {
    it('should suggest tags based on content', async () => {
      const content = 'This document discusses machine learning algorithms and artificial intelligence. ' +
                     'Machine learning is a powerful tool for data analysis and pattern recognition. ' +
                     'Artificial intelligence applications are growing rapidly in various industries.';

      const result = await knowledgeBaseService.suggestTags(content);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(5);
      
      // Should suggest relevant words
      expect(result).toContain('machine');
      expect(result).toContain('learning');
    });

    it('should exclude existing tags from suggestions', async () => {
      const content = 'Machine learning and artificial intelligence are important topics.';
      const existingTags = ['machine', 'learning'];

      const result = await knowledgeBaseService.suggestTags(content, existingTags);

      expect(result).toBeInstanceOf(Array);
      expect(result).not.toContain('machine');
      expect(result).not.toContain('learning');
    });

    it('should handle empty content', async () => {
      const result = await knowledgeBaseService.suggestTags('');
      expect(result).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      // Mock the word processing to throw an error
      const originalReplace = String.prototype.replace;
      String.prototype.replace = vi.fn().mockImplementation(() => {
        throw new Error('Processing failed');
      });

      const result = await knowledgeBaseService.suggestTags('test content');
      expect(result).toEqual([]);

      // Restore original method
      String.prototype.replace = originalReplace;
    });
  });

  describe('edge cases', () => {
    it('should handle very long content', async () => {
      const longContent = 'A'.repeat(100000);
      
      const documentData = {
        userId: 'user123',
        title: 'Long Document',
        content: longContent,
        tags: [],
        sourceType: 'manual' as const,
        isPublic: false,
      };

      const result = await knowledgeBaseService.createDocument(documentData);
      expect(result.content).toBe(longContent);
    });

    it('should handle special characters in titles and content', async () => {
      const specialContent = 'Content with émojis 🚀 and spëcial çharacters!';
      
      const documentData = {
        userId: 'user123',
        title: 'Spëcial Tïtle 🎉',
        content: specialContent,
        tags: ['spëcial', 'émoji'],
        sourceType: 'manual' as const,
        isPublic: false,
      };

      const result = await knowledgeBaseService.createDocument(documentData);
      expect(result.title).toBe('Spëcial Tïtle 🎉');
      expect(result.content).toBe(specialContent);
      expect(result.tags).toEqual(['spëcial', 'émoji']);
    });

    it('should handle empty search queries', async () => {
      const result = await knowledgeBaseService.searchDocuments({
        query: '',
        userId: 'user123',
      });

      expect(result).toBeDefined();
      expect(result.results).toBeInstanceOf(Array);
    });

    it('should handle invalid user IDs', async () => {
      const result = await knowledgeBaseService.getUserDocuments('');
      expect(result.documents).toEqual([]);
    });
  });
});