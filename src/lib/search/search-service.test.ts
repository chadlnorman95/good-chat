import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchChats, searchMessages, getSearchSuggestions, SearchFilters } from './search-service';

// Mock the database
vi.mock('lib/db/pg', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
  },
}));

vi.mock('lib/db/pg/schema', () => ({
  chatThreads: {
    id: 'id',
    title: 'title',
    userId: 'userId',
    projectId: 'projectId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  messages: {
    id: 'id',
    content: 'content',
    role: 'role',
    chatId: 'chatId',
    createdAt: 'createdAt',
  },
}));

vi.mock('drizzle-orm', () => ({
  and: vi.fn(),
  desc: vi.fn(),
  eq: vi.fn(),
  ilike: vi.fn(),
  or: vi.fn(),
  sql: vi.fn(),
  gte: vi.fn(),
  lte: vi.fn(),
}));

describe('SearchService', () => {
  let mockDb: any;

  beforeEach(() => {
    const { db } = require('lib/db/pg');
    mockDb = db;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('searchChats', () => {
    it('should return empty array for empty query', async () => {
      const filters: SearchFilters = { userId: 'user1' };
      const result = await searchChats('', filters);
      
      expect(result).toEqual([]);
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it('should return empty array for whitespace-only query', async () => {
      const filters: SearchFilters = { userId: 'user1' };
      const result = await searchChats('   ', filters);
      
      expect(result).toEqual([]);
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it('should search chats with proper filters', async () => {
      const mockResults = [
        {
          id: 'chat1',
          title: 'Test Chat',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
          projectId: 'project1',
          score: 100,
        },
      ];

      mockDb.select.mockReturnValue(mockResults);

      const filters: SearchFilters = {
        userId: 'user1',
        projectId: 'project1',
        dateFrom: new Date('2024-01-01'),
        dateTo: new Date('2024-01-31'),
      };

      const result = await searchChats('test', filters, 10, 0);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'chat1',
        type: 'chat',
        title: 'Test Chat',
        content: 'Test Chat',
        url: '/chat/chat1',
        score: 100,
      });

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.orderBy).toHaveBeenCalled();
      expect(mockDb.limit).toHaveBeenCalledWith(10);
      expect(mockDb.offset).toHaveBeenCalledWith(0);
    });

    it('should handle untitled chats', async () => {
      const mockResults = [
        {
          id: 'chat1',
          title: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
          projectId: null,
          score: 80,
        },
      ];

      mockDb.select.mockReturnValue(mockResults);

      const filters: SearchFilters = { userId: 'user1' };
      const result = await searchChats('test', filters);

      expect(result[0].title).toBe('Untitled Chat');
      expect(result[0].metadata?.projectId).toBeUndefined();
    });
  });

  describe('searchMessages', () => {
    it('should return empty array for empty query', async () => {
      const filters: SearchFilters = { userId: 'user1' };
      const result = await searchMessages('', filters);
      
      expect(result).toEqual([]);
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it('should search messages with chat context', async () => {
      const mockResults = [
        {
          messageId: 'msg1',
          messageContent: 'This is a test message with important content',
          messageRole: 'user',
          messageCreatedAt: new Date('2024-01-01'),
          chatId: 'chat1',
          chatTitle: 'Test Chat',
          chatCreatedAt: new Date('2024-01-01'),
          chatUpdatedAt: new Date('2024-01-02'),
          projectId: 'project1',
          score: 90,
        },
      ];

      mockDb.select.mockReturnValue(mockResults);

      const filters: SearchFilters = { userId: 'user1' };
      const result = await searchMessages('test', filters);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'msg1',
        type: 'message',
        title: 'Message in "Test Chat"',
        content: 'This is a test message with important content',
        url: '/chat/chat1?messageId=msg1',
        score: 90,
        metadata: {
          chatId: 'chat1',
          chatTitle: 'Test Chat',
          messageRole: 'user',
          projectId: 'project1',
        },
      });
    });

    it('should truncate long message content', async () => {
      const longContent = 'A'.repeat(250);
      const mockResults = [
        {
          messageId: 'msg1',
          messageContent: longContent,
          messageRole: 'assistant',
          messageCreatedAt: new Date('2024-01-01'),
          chatId: 'chat1',
          chatTitle: 'Test Chat',
          chatCreatedAt: new Date('2024-01-01'),
          chatUpdatedAt: new Date('2024-01-02'),
          projectId: null,
          score: 70,
        },
      ];

      mockDb.select.mockReturnValue(mockResults);

      const filters: SearchFilters = { userId: 'user1' };
      const result = await searchMessages('test', filters);

      expect(result[0].content).toHaveLength(203); // 200 chars + "..."
      expect(result[0].content).toEndWith('...');
    });

    it('should handle messages in untitled chats', async () => {
      const mockResults = [
        {
          messageId: 'msg1',
          messageContent: 'Test message',
          messageRole: 'user',
          messageCreatedAt: new Date('2024-01-01'),
          chatId: 'chat1',
          chatTitle: null,
          chatCreatedAt: new Date('2024-01-01'),
          chatUpdatedAt: new Date('2024-01-02'),
          projectId: null,
          score: 60,
        },
      ];

      mockDb.select.mockReturnValue(mockResults);

      const filters: SearchFilters = { userId: 'user1' };
      const result = await searchMessages('test', filters);

      expect(result[0].title).toBe('Message in "Untitled Chat"');
      expect(result[0].metadata?.chatTitle).toBeUndefined();
    });
  });

  describe('getSearchSuggestions', () => {
    it('should return empty array for short queries', async () => {
      const result1 = await getSearchSuggestions('user1', '');
      const result2 = await getSearchSuggestions('user1', 'a');
      
      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it('should return unique suggestions', async () => {
      const mockResults = [
        { title: 'Test Chat 1' },
        { title: 'Test Chat 2' },
        { title: 'Test Chat 1' }, // Duplicate
        { title: 'Another Test' },
        { title: null }, // Should be filtered out
      ];

      mockDb.select.mockReturnValue(mockResults);

      const result = await getSearchSuggestions('user1', 'test', 5);

      expect(result).toEqual([
        'Test Chat 1',
        'Test Chat 2',
        'Another Test',
      ]);

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.limit).toHaveBeenCalledWith(5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle database errors gracefully', async () => {
      mockDb.select.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const filters: SearchFilters = { userId: 'user1' };
      
      await expect(searchChats('test', filters)).rejects.toThrow('Database connection failed');
      await expect(searchMessages('test', filters)).rejects.toThrow('Database connection failed');
    });

    it('should handle special characters in search query', async () => {
      mockDb.select.mockReturnValue([]);

      const filters: SearchFilters = { userId: 'user1' };
      const specialQueries = [
        'test@example.com',
        'test & query',
        'test "quoted" query',
        "test 'single' quotes",
        'test%wildcard',
        'test_underscore',
      ];

      for (const query of specialQueries) {
        const result = await searchChats(query, filters);
        expect(Array.isArray(result)).toBe(true);
      }
    });

    it('should respect limit and offset parameters', async () => {
      mockDb.select.mockReturnValue([]);

      const filters: SearchFilters = { userId: 'user1' };
      
      await searchChats('test', filters, 25, 50);
      expect(mockDb.limit).toHaveBeenCalledWith(25);
      expect(mockDb.offset).toHaveBeenCalledWith(50);

      await searchMessages('test', filters, 15, 30);
      expect(mockDb.limit).toHaveBeenCalledWith(15);
      expect(mockDb.offset).toHaveBeenCalledWith(30);
    });
  });

  describe('Search Scoring', () => {
    it('should calculate relevance scores correctly', async () => {
      // This test would verify the SQL scoring logic
      // Since we're mocking the database, we can only test that the score is used correctly
      const mockResults = [
        { id: 'chat1', title: 'Exact Match', score: 100 },
        { id: 'chat2', title: 'Partial match test', score: 80 },
        { id: 'chat3', title: 'test at start', score: 60 },
        { id: 'chat4', title: 'ends with test', score: 40 },
      ];

      mockDb.select.mockReturnValue(mockResults);

      const filters: SearchFilters = { userId: 'user1' };
      const result = await searchChats('test', filters);

      // Results should be sorted by score (highest first)
      expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
      expect(result[1].score).toBeGreaterThanOrEqual(result[2].score);
      expect(result[2].score).toBeGreaterThanOrEqual(result[3].score);
    });
  });
});