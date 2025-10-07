import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  trackEvent, 
  getUsageStats, 
  getUserStats, 
  getChatActivity,
  trackToolUsage,
  trackModelUsage,
  trackSearchQuery,
  generateAnalyticsReport
} from './analytics-service';

// Mock the database
vi.mock('lib/db/pg', () => ({
  db: {
    execute: vi.fn(),
  },
}));

vi.mock('drizzle-orm', () => ({
  sql: vi.fn((strings, ...values) => ({ strings, values })),
}));

describe('AnalyticsService', () => {
  let mockDb: any;

  beforeEach(() => {
    const { db } = require('lib/db/pg');
    mockDb = db;
    
    // Mock console.log and console.error to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('trackEvent', () => {
    it('should log event without throwing', async () => {
      const event = {
        userId: 'user1',
        eventType: 'test_event',
        eventData: { key: 'value' },
      };

      await expect(trackEvent(event)).resolves.not.toThrow();
      expect(console.log).toHaveBeenCalledWith('Analytics Event:', expect.objectContaining({
        type: 'test_event',
        user: 'user1',
        data: { key: 'value' },
      }));
    });

    it('should handle errors gracefully', async () => {
      const event = {
        userId: 'user1',
        eventType: 'test_event',
      };

      // Mock console.log to throw an error
      vi.spyOn(console, 'log').mockImplementation(() => {
        throw new Error('Logging failed');
      });

      await expect(trackEvent(event)).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalledWith('Failed to track analytics event:', expect.any(Error));
    });
  });

  describe('getUsageStats', () => {
    it('should return usage statistics', async () => {
      const mockChatStats = {
        total_chats: 100,
        total_messages: 500,
        avg_messages_per_chat: 5,
      };

      const mockModelStats = [
        { model: 'gpt-4', count: 50 },
        { model: 'claude-3', count: 30 },
      ];

      const mockToolStats = [
        { tool_name: 'web_search', count: 25 },
        { tool_name: 'code_execution', count: 15 },
      ];

      const mockActiveUsers = {
        daily_active: 10,
        weekly_active: 25,
        monthly_active: 50,
      };

      mockDb.execute
        .mockResolvedValueOnce([mockChatStats])
        .mockResolvedValueOnce(mockModelStats)
        .mockResolvedValueOnce(mockToolStats)
        .mockResolvedValueOnce([mockActiveUsers]);

      const result = await getUsageStats('week');

      expect(result).toEqual({
        totalChats: 100,
        totalMessages: 500,
        totalTokensUsed: 0,
        averageMessagesPerChat: 5,
        mostUsedModels: [
          { model: 'gpt-4', count: 50 },
          { model: 'claude-3', count: 30 },
        ],
        mostUsedTools: [
          { tool: 'web_search', count: 25 },
          { tool: 'code_execution', count: 15 },
        ],
        dailyActiveUsers: 10,
        weeklyActiveUsers: 25,
        monthlyActiveUsers: 50,
      });

      expect(mockDb.execute).toHaveBeenCalledTimes(4);
    });

    it('should handle database errors gracefully', async () => {
      mockDb.execute.mockRejectedValue(new Error('Database error'));

      const result = await getUsageStats();

      expect(result).toEqual({
        totalChats: 0,
        totalMessages: 0,
        totalTokensUsed: 0,
        averageMessagesPerChat: 0,
        mostUsedModels: [],
        mostUsedTools: [],
        dailyActiveUsers: 0,
        weeklyActiveUsers: 0,
        monthlyActiveUsers: 0,
      });

      expect(console.error).toHaveBeenCalledWith('Failed to get usage stats:', expect.any(Error));
    });
  });

  describe('getUserStats', () => {
    it('should return user-specific statistics', async () => {
      const mockUserBasicStats = {
        total_chats: 20,
        total_messages: 100,
        last_active_at: '2024-01-15T10:00:00Z',
        joined_at: '2024-01-01T10:00:00Z',
      };

      const mockUserModelStats = [
        { model: 'gpt-4', count: 15 },
        { model: 'claude-3', count: 5 },
      ];

      const mockUserToolStats = [
        { tool_name: 'web_search', count: 10 },
      ];

      mockDb.execute
        .mockResolvedValueOnce([mockUserBasicStats])
        .mockResolvedValueOnce(mockUserModelStats)
        .mockResolvedValueOnce(mockUserToolStats);

      const result = await getUserStats('user1', 'month');

      expect(result).toEqual({
        userId: 'user1',
        totalChats: 20,
        totalMessages: 100,
        totalTokensUsed: 0,
        favoriteModels: [
          { model: 'gpt-4', count: 15 },
          { model: 'claude-3', count: 5 },
        ],
        mostUsedTools: [
          { tool: 'web_search', count: 10 },
        ],
        averageSessionDuration: 0,
        lastActiveAt: new Date('2024-01-15T10:00:00Z'),
        joinedAt: new Date('2024-01-01T10:00:00Z'),
      });

      expect(mockDb.execute).toHaveBeenCalledTimes(3);
    });

    it('should handle database errors gracefully', async () => {
      mockDb.execute.mockRejectedValue(new Error('Database error'));

      const result = await getUserStats('user1');

      expect(result.userId).toBe('user1');
      expect(result.totalChats).toBe(0);
      expect(result.totalMessages).toBe(0);
      expect(console.error).toHaveBeenCalledWith('Failed to get user stats:', expect.any(Error));
    });
  });

  describe('getChatActivity', () => {
    it('should return chat activity data', async () => {
      const mockActivity = [
        { date: '2024-01-15', chats: 5, messages: 25 },
        { date: '2024-01-14', chats: 3, messages: 15 },
      ];

      mockDb.execute.mockResolvedValue(mockActivity);

      const result = await getChatActivity('user1', 'week');

      expect(result).toEqual([
        { date: '2024-01-15', chats: 5, messages: 25 },
        { date: '2024-01-14', chats: 3, messages: 15 },
      ]);

      expect(mockDb.execute).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors gracefully', async () => {
      mockDb.execute.mockRejectedValue(new Error('Database error'));

      const result = await getChatActivity('user1');

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Failed to get chat activity:', expect.any(Error));
    });
  });

  describe('tracking functions', () => {
    it('should track tool usage', async () => {
      await trackToolUsage('user1', 'web_search', { query: 'test' });

      expect(console.log).toHaveBeenCalledWith('Analytics Event:', expect.objectContaining({
        type: 'tool_usage',
        user: 'user1',
        data: {
          toolName: 'web_search',
          query: 'test',
        },
      }));
    });

    it('should track model usage', async () => {
      await trackModelUsage('user1', 'gpt-4', 100, { temperature: 0.7 });

      expect(console.log).toHaveBeenCalledWith('Analytics Event:', expect.objectContaining({
        type: 'model_usage',
        user: 'user1',
        data: {
          model: 'gpt-4',
          tokensUsed: 100,
          temperature: 0.7,
        },
      }));
    });

    it('should track search queries', async () => {
      await trackSearchQuery('user1', 'test query', 5, { filters: 'chat' });

      expect(console.log).toHaveBeenCalledWith('Analytics Event:', expect.objectContaining({
        type: 'search_query',
        user: 'user1',
        data: {
          query: 'test query',
          resultsCount: 5,
          filters: 'chat',
        },
      }));
    });
  });

  describe('generateAnalyticsReport', () => {
    it('should generate comprehensive analytics report', async () => {
      // Mock all the required data
      const mockUsageStats = {
        totalChats: 100,
        totalMessages: 500,
        totalTokensUsed: 0,
        averageMessagesPerChat: 5,
        mostUsedModels: [],
        mostUsedTools: [],
        dailyActiveUsers: 10,
        weeklyActiveUsers: 25,
        monthlyActiveUsers: 50,
      };

      const mockUserStats = {
        userId: 'user1',
        totalChats: 20,
        totalMessages: 100,
        totalTokensUsed: 0,
        favoriteModels: [],
        mostUsedTools: [],
        averageSessionDuration: 0,
        lastActiveAt: new Date(),
        joinedAt: new Date(),
      };

      const mockActivity = [
        { date: '2024-01-15', chats: 5, messages: 25 },
      ];

      // Mock the database calls for all functions
      mockDb.execute
        // getUsageStats calls
        .mockResolvedValueOnce([{ total_chats: 100, total_messages: 500, avg_messages_per_chat: 5 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ daily_active: 10, weekly_active: 25, monthly_active: 50 }])
        // getUserStats calls
        .mockResolvedValueOnce([{ 
          total_chats: 20, 
          total_messages: 100, 
          last_active_at: new Date().toISOString(),
          joined_at: new Date().toISOString()
        }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        // getChatActivity call
        .mockResolvedValueOnce(mockActivity);

      const result = await generateAnalyticsReport('user1', 'week');

      expect(result).toHaveProperty('usageStats');
      expect(result).toHaveProperty('userStats');
      expect(result).toHaveProperty('chatActivity');
      expect(result).toHaveProperty('popularSearchTerms');

      expect(result.usageStats.totalChats).toBe(100);
      expect(result.userStats?.userId).toBe('user1');
      expect(result.chatActivity).toHaveLength(1);
      expect(result.popularSearchTerms).toEqual([]);
    });
  });

  describe('timeframe handling', () => {
    it('should handle different timeframes correctly', async () => {
      mockDb.execute.mockResolvedValue([]);

      await getChatActivity('user1', 'day');
      await getChatActivity('user1', 'week');
      await getChatActivity('user1', 'month');

      expect(mockDb.execute).toHaveBeenCalledTimes(3);
    });
  });

  describe('edge cases', () => {
    it('should handle null/undefined values in database results', async () => {
      const mockStatsWithNulls = {
        total_chats: null,
        total_messages: undefined,
        avg_messages_per_chat: 0,
      };

      mockDb.execute
        .mockResolvedValueOnce([mockStatsWithNulls])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ daily_active: null, weekly_active: 0, monthly_active: undefined }]);

      const result = await getUsageStats();

      expect(result.totalChats).toBe(0);
      expect(result.totalMessages).toBe(0);
      expect(result.dailyActiveUsers).toBe(0);
      expect(result.weeklyActiveUsers).toBe(0);
      expect(result.monthlyActiveUsers).toBe(0);
    });

    it('should handle empty database results', async () => {
      mockDb.execute.mockResolvedValue([]);

      const result = await getUsageStats();

      expect(result.totalChats).toBe(0);
      expect(result.mostUsedModels).toEqual([]);
      expect(result.mostUsedTools).toEqual([]);
    });
  });
});