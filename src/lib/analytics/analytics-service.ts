import "server-only";
import { db } from "lib/db/pg";
import { sql } from "drizzle-orm";

export interface AnalyticsEvent {
  userId: string;
  eventType: string;
  eventData?: Record<string, any>;
  timestamp?: Date;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface UsageStats {
  totalChats: number;
  totalMessages: number;
  totalTokensUsed: number;
  averageMessagesPerChat: number;
  mostUsedModels: Array<{ model: string; count: number }>;
  mostUsedTools: Array<{ tool: string; count: number }>;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
}

export interface UserStats {
  userId: string;
  totalChats: number;
  totalMessages: number;
  totalTokensUsed: number;
  favoriteModels: Array<{ model: string; count: number }>;
  mostUsedTools: Array<{ tool: string; count: number }>;
  averageSessionDuration: number;
  lastActiveAt: Date;
  joinedAt: Date;
}

/**
 * Analytics service for tracking usage patterns and generating insights
 */

/**
 * Track an analytics event
 */
export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  try {
    // For now, we'll use a simple approach with existing tables
    // In a production system, you'd want a dedicated analytics_events table
    
    // Store basic event tracking in a simple format
    // This could be extended to use a proper analytics database like ClickHouse
    
    console.log('Analytics Event:', {
      type: event.eventType,
      user: event.userId,
      data: event.eventData,
      timestamp: event.timestamp || new Date(),
    });
    
    // TODO: Implement proper event storage
    // await db.insert(analyticsEvents).values({
    //   userId: event.userId,
    //   eventType: event.eventType,
    //   eventData: event.eventData,
    //   timestamp: event.timestamp || new Date(),
    //   sessionId: event.sessionId,
    //   userAgent: event.userAgent,
    //   ipAddress: event.ipAddress,
    // });
    
  } catch (error) {
    console.error('Failed to track analytics event:', error);
    // Don't throw - analytics failures shouldn't break the app
  }
}

/**
 * Get overall usage statistics
 */
export async function getUsageStats(timeframe: 'day' | 'week' | 'month' | 'all' = 'all'): Promise<UsageStats> {
  try {
    const timeCondition = getTimeCondition(timeframe);
    
    // Get basic chat and message counts
    const [chatStats] = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT ct.id) as total_chats,
        COUNT(m.id) as total_messages,
        COALESCE(AVG(message_counts.msg_count), 0) as avg_messages_per_chat
      FROM chat_threads ct
      LEFT JOIN messages m ON ct.id = m.chat_id
      LEFT JOIN (
        SELECT chat_id, COUNT(*) as msg_count
        FROM messages
        ${timeCondition ? sql`WHERE created_at >= ${timeCondition}` : sql``}
        GROUP BY chat_id
      ) message_counts ON ct.id = message_counts.chat_id
      ${timeCondition ? sql`WHERE ct.created_at >= ${timeCondition}` : sql``}
    `);

    // Get model usage stats
    const modelStats = await db.execute(sql`
      SELECT 
        model,
        COUNT(*) as count
      FROM messages
      WHERE model IS NOT NULL
      ${timeCondition ? sql`AND created_at >= ${timeCondition}` : sql``}
      GROUP BY model
      ORDER BY count DESC
      LIMIT 10
    `);

    // Get tool usage stats (from message content analysis)
    const toolStats = await db.execute(sql`
      SELECT 
        tool_name,
        COUNT(*) as count
      FROM (
        SELECT 
          CASE 
            WHEN content LIKE '%@web%' THEN 'web_search'
            WHEN content LIKE '%@code%' THEN 'code_execution'
            WHEN content LIKE '%@file%' THEN 'file_processing'
            WHEN content LIKE '%@image%' THEN 'image_generation'
            ELSE 'unknown'
          END as tool_name
        FROM messages
        WHERE role = 'user' 
        AND (content LIKE '%@%')
        ${timeCondition ? sql`AND created_at >= ${timeCondition}` : sql``}
      ) tool_usage
      WHERE tool_name != 'unknown'
      GROUP BY tool_name
      ORDER BY count DESC
      LIMIT 10
    `);

    // Get active user counts
    const [activeUsers] = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN user_id END) as daily_active,
        COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN user_id END) as weekly_active,
        COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN user_id END) as monthly_active
      FROM chat_threads
    `);

    return {
      totalChats: Number(chatStats.total_chats) || 0,
      totalMessages: Number(chatStats.total_messages) || 0,
      totalTokensUsed: 0, // TODO: Implement token tracking
      averageMessagesPerChat: Number(chatStats.avg_messages_per_chat) || 0,
      mostUsedModels: modelStats.map(row => ({
        model: row.model as string,
        count: Number(row.count),
      })),
      mostUsedTools: toolStats.map(row => ({
        tool: row.tool_name as string,
        count: Number(row.count),
      })),
      dailyActiveUsers: Number(activeUsers.daily_active) || 0,
      weeklyActiveUsers: Number(activeUsers.weekly_active) || 0,
      monthlyActiveUsers: Number(activeUsers.monthly_active) || 0,
    };
    
  } catch (error) {
    console.error('Failed to get usage stats:', error);
    return {
      totalChats: 0,
      totalMessages: 0,
      totalTokensUsed: 0,
      averageMessagesPerChat: 0,
      mostUsedModels: [],
      mostUsedTools: [],
      dailyActiveUsers: 0,
      weeklyActiveUsers: 0,
      monthlyActiveUsers: 0,
    };
  }
}

/**
 * Get user-specific statistics
 */
export async function getUserStats(userId: string, timeframe: 'day' | 'week' | 'month' | 'all' = 'all'): Promise<UserStats> {
  try {
    const timeCondition = getTimeCondition(timeframe);
    
    // Get basic user stats
    const [userBasicStats] = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT ct.id) as total_chats,
        COUNT(m.id) as total_messages,
        MAX(ct.updated_at) as last_active_at,
        MIN(ct.created_at) as joined_at
      FROM chat_threads ct
      LEFT JOIN messages m ON ct.id = m.chat_id
      WHERE ct.user_id = ${userId}
      ${timeCondition ? sql`AND ct.created_at >= ${timeCondition}` : sql``}
    `);

    // Get user's favorite models
    const userModelStats = await db.execute(sql`
      SELECT 
        model,
        COUNT(*) as count
      FROM messages m
      JOIN chat_threads ct ON m.chat_id = ct.id
      WHERE ct.user_id = ${userId}
      AND m.model IS NOT NULL
      ${timeCondition ? sql`AND m.created_at >= ${timeCondition}` : sql``}
      GROUP BY model
      ORDER BY count DESC
      LIMIT 5
    `);

    // Get user's tool usage
    const userToolStats = await db.execute(sql`
      SELECT 
        tool_name,
        COUNT(*) as count
      FROM (
        SELECT 
          CASE 
            WHEN m.content LIKE '%@web%' THEN 'web_search'
            WHEN m.content LIKE '%@code%' THEN 'code_execution'
            WHEN m.content LIKE '%@file%' THEN 'file_processing'
            WHEN m.content LIKE '%@image%' THEN 'image_generation'
            ELSE 'unknown'
          END as tool_name
        FROM messages m
        JOIN chat_threads ct ON m.chat_id = ct.id
        WHERE ct.user_id = ${userId}
        AND m.role = 'user' 
        AND (m.content LIKE '%@%')
        ${timeCondition ? sql`AND m.created_at >= ${timeCondition}` : sql``}
      ) tool_usage
      WHERE tool_name != 'unknown'
      GROUP BY tool_name
      ORDER BY count DESC
      LIMIT 5
    `);

    return {
      userId,
      totalChats: Number(userBasicStats.total_chats) || 0,
      totalMessages: Number(userBasicStats.total_messages) || 0,
      totalTokensUsed: 0, // TODO: Implement token tracking
      favoriteModels: userModelStats.map(row => ({
        model: row.model as string,
        count: Number(row.count),
      })),
      mostUsedTools: userToolStats.map(row => ({
        tool: row.tool_name as string,
        count: Number(row.count),
      })),
      averageSessionDuration: 0, // TODO: Implement session tracking
      lastActiveAt: new Date(userBasicStats.last_active_at) || new Date(),
      joinedAt: new Date(userBasicStats.joined_at) || new Date(),
    };
    
  } catch (error) {
    console.error('Failed to get user stats:', error);
    return {
      userId,
      totalChats: 0,
      totalMessages: 0,
      totalTokensUsed: 0,
      favoriteModels: [],
      mostUsedTools: [],
      averageSessionDuration: 0,
      lastActiveAt: new Date(),
      joinedAt: new Date(),
    };
  }
}

/**
 * Get chat activity over time
 */
export async function getChatActivity(
  userId?: string,
  timeframe: 'day' | 'week' | 'month' = 'week'
): Promise<Array<{ date: string; chats: number; messages: number }>> {
  try {
    const timeCondition = getTimeCondition(timeframe);
    const userCondition = userId ? sql`AND ct.user_id = ${userId}` : sql``;
    
    const activity = await db.execute(sql`
      SELECT 
        DATE(ct.created_at) as date,
        COUNT(DISTINCT ct.id) as chats,
        COUNT(m.id) as messages
      FROM chat_threads ct
      LEFT JOIN messages m ON ct.id = m.chat_id
      WHERE ct.created_at >= ${timeCondition}
      ${userCondition}
      GROUP BY DATE(ct.created_at)
      ORDER BY date DESC
      LIMIT 30
    `);

    return activity.map(row => ({
      date: row.date as string,
      chats: Number(row.chats),
      messages: Number(row.messages),
    }));
    
  } catch (error) {
    console.error('Failed to get chat activity:', error);
    return [];
  }
}

/**
 * Get popular search terms (requires search logging)
 */
export async function getPopularSearchTerms(limit: number = 10): Promise<Array<{ term: string; count: number }>> {
  // This would require implementing search term logging
  // For now, return empty array
  return [];
}

/**
 * Track tool usage
 */
export async function trackToolUsage(
  userId: string,
  toolName: string,
  metadata?: Record<string, any>
): Promise<void> {
  await trackEvent({
    userId,
    eventType: 'tool_usage',
    eventData: {
      toolName,
      ...metadata,
    },
  });
}

/**
 * Track model usage
 */
export async function trackModelUsage(
  userId: string,
  model: string,
  tokensUsed?: number,
  metadata?: Record<string, any>
): Promise<void> {
  await trackEvent({
    userId,
    eventType: 'model_usage',
    eventData: {
      model,
      tokensUsed,
      ...metadata,
    },
  });
}

/**
 * Track search queries
 */
export async function trackSearchQuery(
  userId: string,
  query: string,
  resultsCount: number,
  metadata?: Record<string, any>
): Promise<void> {
  await trackEvent({
    userId,
    eventType: 'search_query',
    eventData: {
      query,
      resultsCount,
      ...metadata,
    },
  });
}

/**
 * Helper function to get time condition for queries
 */
function getTimeCondition(timeframe: 'day' | 'week' | 'month' | 'all'): Date | null {
  const now = new Date();
  
  switch (timeframe) {
    case 'day':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'all':
    default:
      return null;
  }
}

/**
 * Generate analytics report
 */
export async function generateAnalyticsReport(
  userId?: string,
  timeframe: 'day' | 'week' | 'month' | 'all' = 'week'
): Promise<{
  usageStats: UsageStats;
  userStats?: UserStats;
  chatActivity: Array<{ date: string; chats: number; messages: number }>;
  popularSearchTerms: Array<{ term: string; count: number }>;
}> {
  const [usageStats, userStats, chatActivity, popularSearchTerms] = await Promise.all([
    getUsageStats(timeframe),
    userId ? getUserStats(userId, timeframe) : Promise.resolve(undefined),
    getChatActivity(userId, timeframe),
    getPopularSearchTerms(10),
  ]);

  return {
    usageStats,
    userStats,
    chatActivity,
    popularSearchTerms,
  };
}