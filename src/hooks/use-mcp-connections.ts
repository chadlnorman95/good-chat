"use client";

import { useState, useCallback } from "react";
import { MCPConnectionTemplate, MCPConnectionDiscovery } from "lib/mcp-connections/mcp-connection-service";
import { MCPServerConfig } from "types/mcp";

interface UseMCPConnectionsReturn {
  templates: MCPConnectionTemplate[];
  categories: Array<{ id: string; name: string; icon: string; count: number }>;
  isLoading: boolean;
  error: string | null;
  loadTemplates: (params?: { category?: string; search?: string; popular?: boolean }) => Promise<void>;
  quickConnect: (params: {
    url: string;
    name?: string;
    headers?: Record<string, string>;
    authToken?: string;
    testConnection?: boolean;
  }) => Promise<{
    success: boolean;
    config?: MCPServerConfig;
    error?: string;
    discoveredInfo?: MCPConnectionDiscovery;
  }>;
  testConnection: (config: MCPServerConfig) => Promise<{
    success: boolean;
    error?: string;
    latency?: number;
    serverInfo?: any;
  }>;
  discoverServer: (url: string) => Promise<MCPConnectionDiscovery | null>;
}

export function useMCPConnections(): UseMCPConnectionsReturn {
  const [templates, setTemplates] = useState<MCPConnectionTemplate[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; icon: string; count: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async (params?: { 
    category?: string; 
    search?: string; 
    popular?: boolean 
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.set('category', params.category);
      if (params?.search) searchParams.set('search', params.search);
      if (params?.popular) searchParams.set('popular', 'true');

      const response = await fetch(`/api/mcp-connections/templates?${searchParams}`);
      const data = await response.json();

      if (data.success) {
        setTemplates(data.templates);
        if (data.categories) {
          setCategories(data.categories);
        }
      } else {
        setError(data.error || 'Failed to load templates');
      }
    } catch (err) {
      setError('Failed to load templates');
      console.error('Failed to load MCP templates:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const quickConnect = useCallback(async (params: {
    url: string;
    name?: string;
    headers?: Record<string, string>;
    authToken?: string;
    testConnection?: boolean;
  }) => {
    try {
      const response = await fetch('/api/mcp-connections/quick-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Quick connect failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }, []);

  const testConnection = useCallback(async (config: MCPServerConfig) => {
    try {
      const response = await fetch('/api/mcp-connections/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Test failed',
      };
    }
  }, []);

  const discoverServer = useCallback(async (url: string): Promise<MCPConnectionDiscovery | null> => {
    try {
      const response = await fetch('/api/mcp-connections/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      return data.success ? data.discoveredInfo : null;
    } catch (error) {
      console.error('Server discovery failed:', error);
      return null;
    }
  }, []);

  return {
    templates,
    categories,
    isLoading,
    error,
    loadTemplates,
    quickConnect,
    testConnection,
    discoverServer,
  };
}