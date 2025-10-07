"use client";

import { useState, useEffect, useCallback } from "react";
import { ApiKey } from "lib/api-keys/api-key-service";

interface UseApiKeysReturn {
  apiKeys: ApiKey[];
  isLoading: boolean;
  error: string | null;
  refreshApiKeys: () => Promise<void>;
  getApiKeyByService: (service: string) => ApiKey | null;
  getActiveApiKeys: () => ApiKey[];
  hasApiKey: (service: string) => boolean;
}

export function useApiKeys(): UseApiKeysReturn {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshApiKeys = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/api-keys');
      const data = await response.json();

      if (data.success) {
        setApiKeys(data.apiKeys);
      } else {
        setError(data.error || 'Failed to load API keys');
      }
    } catch (err) {
      setError('Failed to load API keys');
      console.error('Failed to load API keys:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getApiKeyByService = useCallback((service: string): ApiKey | null => {
    return apiKeys.find(key => key.service === service && key.isActive) || null;
  }, [apiKeys]);

  const getActiveApiKeys = useCallback((): ApiKey[] => {
    return apiKeys.filter(key => key.isActive);
  }, [apiKeys]);

  const hasApiKey = useCallback((service: string): boolean => {
    return apiKeys.some(key => key.service === service && key.isActive);
  }, [apiKeys]);

  useEffect(() => {
    refreshApiKeys();
  }, [refreshApiKeys]);

  return {
    apiKeys,
    isLoading,
    error,
    refreshApiKeys,
    getApiKeyByService,
    getActiveApiKeys,
    hasApiKey,
  };
}