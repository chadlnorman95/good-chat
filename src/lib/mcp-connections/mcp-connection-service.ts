import "server-only";
import { MCPServerConfig, MCPRemoteConfig, MCPStdioConfig } from "types/mcp";
import { MCPDiscoveryUtils } from "./mcp-discovery-utils";
import { z } from "zod";

export interface MCPConnectionTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  website?: string;
  documentation?: string;
  config: MCPServerConfig;
  setupInstructions?: string[];
  requiredEnvVars?: string[];
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  isPopular?: boolean;
}

export interface MCPConnectionDiscovery {
  url: string;
  name?: string;
  description?: string;
  tools?: string[];
  capabilities?: string[];
  authRequired?: boolean;
  healthCheck?: boolean;
}

export interface QuickConnectRequest {
  url: string;
  name?: string;
  headers?: Record<string, string>;
  authToken?: string;
  testConnection?: boolean;
}

export interface MCPConnectionValidation {
  isValid: boolean;
  error?: string;
  suggestions?: string[];
  discoveredInfo?: MCPConnectionDiscovery;
}

/**
 * Enhanced MCP Connection Service
 * Provides easy ways to connect to MCP servers via URLs and APIs
 */
export class MCPConnectionService {
  private static instance: MCPConnectionService;

  private constructor() {}

  public static getInstance(): MCPConnectionService {
    if (!MCPConnectionService.instance) {
      MCPConnectionService.instance = new MCPConnectionService();
    }
    return MCPConnectionService.instance;
  }

  /**
   * Get popular MCP connection templates
   */
  getPopularTemplates(): MCPConnectionTemplate[] {
    return [
      {
        id: 'github-mcp',
        name: 'GitHub MCP',
        description: 'Connect to GitHub repositories, issues, and pull requests',
        category: 'Development',
        icon: '🐙',
        website: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
        documentation: 'https://modelcontextprotocol.io/servers/github',
        config: {
          url: 'https://github-mcp-server.example.com/sse',
          headers: {}
        } as MCPRemoteConfig,
        setupInstructions: [
          'Get a GitHub Personal Access Token from https://github.com/settings/tokens',
          'Set the GITHUB_PERSONAL_ACCESS_TOKEN environment variable',
          'Configure repository access permissions'
        ],
        requiredEnvVars: ['GITHUB_PERSONAL_ACCESS_TOKEN'],
        tags: ['github', 'git', 'development', 'repositories'],
        difficulty: 'easy',
        isPopular: true,
      },
      {
        id: 'filesystem-mcp',
        name: 'Filesystem MCP',
        description: 'Access and manipulate files and directories',
        category: 'System',
        icon: '📁',
        website: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
        documentation: 'https://modelcontextprotocol.io/servers/filesystem',
        config: {
          url: 'https://filesystem-mcp-server.example.com/sse',
          headers: {}
        } as MCPRemoteConfig,
        setupInstructions: [
          'Configure allowed directories for security',
          'Set appropriate file permissions',
          'Consider read-only mode for safety'
        ],
        requiredEnvVars: [],
        tags: ['filesystem', 'files', 'directories', 'system'],
        difficulty: 'medium',
        isPopular: true,
      },
      {
        id: 'postgres-mcp',
        name: 'PostgreSQL MCP',
        description: 'Query and manage PostgreSQL databases',
        category: 'Database',
        icon: '🐘',
        website: 'https://github.com/modelcontextprotocol/servers/tree/main/src/postgres',
        documentation: 'https://modelcontextprotocol.io/servers/postgres',
        config: {
          url: 'https://postgres-mcp-server.example.com/sse',
          headers: {}
        } as MCPRemoteConfig,
        setupInstructions: [
          'Set up PostgreSQL connection string',
          'Configure database permissions',
          'Test connection with read-only user first'
        ],
        requiredEnvVars: ['POSTGRES_CONNECTION_STRING'],
        tags: ['postgresql', 'database', 'sql', 'data'],
        difficulty: 'medium',
        isPopular: true,
      },
      {
        id: 'slack-mcp',
        name: 'Slack MCP',
        description: 'Send messages and interact with Slack workspaces',
        category: 'Communication',
        icon: '💬',
        website: 'https://github.com/modelcontextprotocol/servers/tree/main/src/slack',
        documentation: 'https://modelcontextprotocol.io/servers/slack',
        config: {
          url: 'https://slack-mcp-server.example.com/sse',
          headers: {}
        } as MCPRemoteConfig,
        setupInstructions: [
          'Create a Slack app at https://api.slack.com/apps',
          'Get Bot User OAuth Token',
          'Install app to your workspace',
          'Configure required scopes'
        ],
        requiredEnvVars: ['SLACK_BOT_TOKEN'],
        tags: ['slack', 'communication', 'messaging', 'team'],
        difficulty: 'medium',
        isPopular: true,
      },
      {
        id: 'web-search-mcp',
        name: 'Web Search MCP',
        description: 'Search the web using various search engines',
        category: 'Search',
        icon: '🔍',
        website: 'https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search',
        documentation: 'https://modelcontextprotocol.io/servers/brave-search',
        config: {
          url: 'https://web-search-mcp-server.example.com/sse',
          headers: {}
        } as MCPRemoteConfig,
        setupInstructions: [
          'Get API key from search provider (Brave, Google, etc.)',
          'Configure search parameters and filters',
          'Set rate limiting if needed'
        ],
        requiredEnvVars: ['BRAVE_SEARCH_API_KEY'],
        tags: ['search', 'web', 'brave', 'google', 'internet'],
        difficulty: 'easy',
        isPopular: true,
      },
      {
        id: 'custom-api-mcp',
        name: 'Custom API MCP',
        description: 'Connect to any custom MCP server via URL',
        category: 'Custom',
        icon: '🔗',
        config: {
          url: '',
          headers: {}
        } as MCPRemoteConfig,
        setupInstructions: [
          'Enter your MCP server URL',
          'Add any required headers or authentication',
          'Test the connection'
        ],
        requiredEnvVars: [],
        tags: ['custom', 'api', 'url', 'generic'],
        difficulty: 'easy',
        isPopular: false,
      }
    ];
  }

  /**
   * Get connection templates by category
   */
  getTemplatesByCategory(category: string): MCPConnectionTemplate[] {
    return this.getPopularTemplates().filter(template => 
      template.category.toLowerCase() === category.toLowerCase()
    );
  }

  /**
   * Search connection templates
   */
  searchTemplates(query: string): MCPConnectionTemplate[] {
    const searchTerm = query.toLowerCase();
    return this.getPopularTemplates().filter(template =>
      template.name.toLowerCase().includes(searchTerm) ||
      template.description.toLowerCase().includes(searchTerm) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Quick connect to an MCP server via URL
   */
  async quickConnect(request: QuickConnectRequest): Promise<{
    success: boolean;
    config?: MCPServerConfig;
    error?: string;
    discoveredInfo?: MCPConnectionDiscovery;
  }> {
    try {
      console.log('Quick connecting to MCP server:', request.url);

      // Validate URL format
      const validation = this.validateUrl(request.url);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Create config
      const config: MCPRemoteConfig = {
        url: request.url,
        headers: {
          ...request.headers,
          ...(request.authToken && { 'Authorization': `Bearer ${request.authToken}` }),
        },
      };

      // Test connection if requested
      if (request.testConnection) {
        const testResult = await this.testConnection(config);
        if (!testResult.success) {
          return {
            success: false,
            error: testResult.error,
            config,
          };
        }
      }

      // Try to discover server info
      const discoveredInfo = await this.discoverServerInfo(request.url);

      return {
        success: true,
        config,
        discoveredInfo,
      };

    } catch (error) {
      console.error('Quick connect failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  /**
   * Discover information about an MCP server
   */
  async discoverServerInfo(url: string): Promise<MCPConnectionDiscovery | null> {
    try {
      console.log('Discovering MCP server info:', url);

      // Use discovery utilities to analyze the URL
      const analysis = MCPDiscoveryUtils.analyzeUrl(url);
      const serverInfo = MCPDiscoveryUtils.extractServerInfo(url);
      const suggestions = MCPDiscoveryUtils.generateConnectionSuggestions(url);

      const discovery: MCPConnectionDiscovery = {
        url,
        name: analysis.suggestedName || serverInfo.name || this.extractServerNameFromUrl(url),
        description: serverInfo.description || 'Discovered MCP server',
        tools: ['example_tool_1', 'example_tool_2'], // In real implementation, would probe server
        capabilities: analysis.discoveredFeatures,
        authRequired: suggestions.recommendations.some(r => r.includes('token') || r.includes('key')),
        healthCheck: analysis.isLikelyMCP,
      };

      return discovery;

    } catch (error) {
      console.error('Server discovery failed:', error);
      return null;
    }
  }

  /**
   * Test connection to an MCP server
   */
  async testConnection(config: MCPServerConfig): Promise<{
    success: boolean;
    error?: string;
    latency?: number;
    serverInfo?: any;
  }> {
    try {
      console.log('Testing MCP connection:', config);

      const startTime = Date.now();

      // In a real implementation, this would create a temporary MCP client
      // and attempt to connect to test the configuration
      
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 500));

      const latency = Date.now() - startTime;

      // Simulate successful connection
      return {
        success: true,
        latency,
        serverInfo: {
          name: 'Test MCP Server',
          version: '1.0.0',
          capabilities: ['tools', 'resources'],
          tools: ['test_tool'],
        },
      };

    } catch (error) {
      console.error('Connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }

  /**
   * Validate MCP server URL
   */
  validateUrl(url: string): MCPConnectionValidation {
    try {
      const parsedUrl = new URL(url);
      
      // Check protocol
      if (!['http:', 'https:', 'ws:', 'wss:'].includes(parsedUrl.protocol)) {
        return {
          isValid: false,
          error: 'URL must use HTTP, HTTPS, WS, or WSS protocol',
          suggestions: ['Use https:// for secure connections', 'Use wss:// for WebSocket connections'],
        };
      }

      // Use discovery utilities for enhanced validation
      const analysis = MCPDiscoveryUtils.analyzeUrl(url);
      const connectionSuggestions = MCPDiscoveryUtils.generateConnectionSuggestions(url);

      if (!analysis.isLikelyMCP) {
        return {
          isValid: true, // Still allow connection attempt
          suggestions: [
            ...connectionSuggestions.suggestions,
            ...connectionSuggestions.recommendations,
          ],
        };
      }

      return { 
        isValid: true,
        suggestions: connectionSuggestions.recommendations.length > 0 ? connectionSuggestions.recommendations : undefined,
      };

    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid URL format',
        suggestions: ['Enter a complete URL including protocol (https://)', 'Check for typos in the URL'],
      };
    }
  }

  /**
   * Generate MCP config from template
   */
  generateConfigFromTemplate(templateId: string, customizations: Record<string, any> = {}): MCPServerConfig | null {
    const template = this.getPopularTemplates().find(t => t.id === templateId);
    if (!template) {
      return null;
    }

    const config = { ...template.config };

    // Apply customizations
    if ('url' in config && customizations.url) {
      config.url = customizations.url;
    }

    if ('headers' in config && customizations.headers) {
      config.headers = { ...config.headers, ...customizations.headers };
    }

    if ('command' in config && customizations.command) {
      config.command = customizations.command;
    }

    if ('args' in config && customizations.args) {
      config.args = customizations.args;
    }

    if ('env' in config && customizations.env) {
      config.env = { ...config.env, ...customizations.env };
    }

    return config;
  }

  /**
   * Get connection categories
   */
  getCategories(): Array<{ id: string; name: string; icon: string; count: number }> {
    const templates = this.getPopularTemplates();
    const categoryMap = new Map<string, { name: string; icon: string; count: number }>();

    templates.forEach(template => {
      const category = template.category;
      if (categoryMap.has(category)) {
        categoryMap.get(category)!.count++;
      } else {
        categoryMap.set(category, {
          name: category,
          icon: this.getCategoryIcon(category),
          count: 1,
        });
      }
    });

    return Array.from(categoryMap.entries()).map(([id, data]) => ({
      id,
      ...data,
    }));
  }

  /**
   * Import MCP config from various formats
   */
  async importConfig(configData: string, format: 'json' | 'yaml' | 'url'): Promise<{
    success: boolean;
    configs?: MCPServerConfig[];
    error?: string;
  }> {
    try {
      console.log('Importing MCP config:', { format });

      switch (format) {
        case 'json':
          const jsonConfig = JSON.parse(configData);
          return {
            success: true,
            configs: Array.isArray(jsonConfig) ? jsonConfig : [jsonConfig],
          };

        case 'url':
          const quickConnectResult = await this.quickConnect({ url: configData });
          if (quickConnectResult.success && quickConnectResult.config) {
            return {
              success: true,
              configs: [quickConnectResult.config],
            };
          } else {
            return {
              success: false,
              error: quickConnectResult.error,
            };
          }

        case 'yaml':
          // In a real implementation, you'd use a YAML parser
          return {
            success: false,
            error: 'YAML import not yet implemented',
          };

        default:
          return {
            success: false,
            error: 'Unsupported format',
          };
      }

    } catch (error) {
      console.error('Config import failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Import failed',
      };
    }
  }

  /**
   * Export MCP configs
   */
  exportConfigs(configs: MCPServerConfig[], format: 'json' | 'yaml'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(configs, null, 2);
      case 'yaml':
        // In a real implementation, you'd use a YAML serializer
        return '# YAML export not yet implemented';
      default:
        throw new Error('Unsupported export format');
    }
  }

  /**
   * Helper methods
   */
  private extractServerNameFromUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;
      
      // Extract meaningful name from hostname
      const parts = hostname.split('.');
      if (parts.length > 2) {
        return parts[0].replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
      
      return hostname.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    } catch {
      return 'Unknown Server';
    }
  }

  private getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'Development': '💻',
      'Database': '🗄️',
      'Communication': '💬',
      'Search': '🔍',
      'System': '⚙️',
      'Custom': '🔗',
      'AI': '🤖',
      'Analytics': '📊',
      'Security': '🔒',
      'Media': '🎬',
    };
    return icons[category] || '📦';
  }
}

// Export singleton instance
export const mcpConnectionService = MCPConnectionService.getInstance();