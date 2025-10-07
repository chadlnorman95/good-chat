import { useCallback } from 'react';

interface AnalyticsEvent {
  eventType: string;
  eventData?: Record<string, any>;
  sessionId?: string;
}

/**
 * Hook for tracking analytics events from the client side
 */
export function useAnalytics() {
  const trackEvent = useCallback(async (event: AnalyticsEvent) => {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Failed to track analytics event:', error);
      // Don't throw - analytics failures shouldn't break the app
    }
  }, []);

  const trackPageView = useCallback((page: string, metadata?: Record<string, any>) => {
    trackEvent({
      eventType: 'page_view',
      eventData: {
        page,
        ...metadata,
      },
    });
  }, [trackEvent]);

  const trackChatCreated = useCallback((chatId: string, metadata?: Record<string, any>) => {
    trackEvent({
      eventType: 'chat_created',
      eventData: {
        chatId,
        ...metadata,
      },
    });
  }, [trackEvent]);

  const trackMessageSent = useCallback((
    chatId: string, 
    messageLength: number, 
    model?: string,
    metadata?: Record<string, any>
  ) => {
    trackEvent({
      eventType: 'message_sent',
      eventData: {
        chatId,
        messageLength,
        model,
        ...metadata,
      },
    });
  }, [trackEvent]);

  const trackToolUsed = useCallback((
    toolName: string, 
    chatId?: string,
    metadata?: Record<string, any>
  ) => {
    trackEvent({
      eventType: 'tool_used',
      eventData: {
        toolName,
        chatId,
        ...metadata,
      },
    });
  }, [trackEvent]);

  const trackSearchQuery = useCallback((
    query: string, 
    resultsCount: number,
    metadata?: Record<string, any>
  ) => {
    trackEvent({
      eventType: 'search_query',
      eventData: {
        query,
        resultsCount,
        ...metadata,
      },
    });
  }, [trackEvent]);

  const trackFeatureUsed = useCallback((
    featureName: string,
    metadata?: Record<string, any>
  ) => {
    trackEvent({
      eventType: 'feature_used',
      eventData: {
        featureName,
        ...metadata,
      },
    });
  }, [trackEvent]);

  const trackError = useCallback((
    errorType: string,
    errorMessage: string,
    metadata?: Record<string, any>
  ) => {
    trackEvent({
      eventType: 'error_occurred',
      eventData: {
        errorType,
        errorMessage,
        ...metadata,
      },
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackChatCreated,
    trackMessageSent,
    trackToolUsed,
    trackSearchQuery,
    trackFeatureUsed,
    trackError,
  };
}