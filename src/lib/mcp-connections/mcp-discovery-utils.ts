import "server-only";

export interface MCPEndpointInfo {
  url: string;
  type: 'sse' | 'websocket' | 'http' | 'unknown';
  isLikelyMCP: boolean;
  confidence: number;
  discoveredFeatures: string[];
  suggestedName?: string;
}

/**
 * MCP Discovery Utilities
 * Helper functions for discovering and validating MCP endpoints
 */
export class MCPDiscoveryUtils {
  
  /**
   * Analyze a URL to determine if it's likely an MCP endpoint
   */
  static analyzeUrl(url: string): MCPEndpointInfo {
    try {
      const parsedUrl = new URL(url);
      const path = parsedUrl.pathname.toLowerCase();
      const hostname = parsedUrl.hostname.toLowerCase();
      
      let type: MCPEndpointInfo['type'] = 'unknown';
      let confidence = 0;
      const discoveredFeatures: string[] = [];
      
      // Determine endpoint type based on URL patterns
      if (path.includes('/sse') || path.endsWith('/sse')) {
        type = 'sse';
        confidence += 40;
        discoveredFeatures.push('Server-Sent Events endpoint');
      } else if (parsedUrl.protocol === 'wss:' || parsedUrl.protocol === 'ws:') {
        type = 'websocket';
        confidence += 35;
        discoveredFeatures.push('WebSocket endpoint');
      } else if (path.includes('/mcp') || path.includes('/stream')) {
        type = 'http';
        confidence += 30;
        discoveredFeatures.push('HTTP streaming endpoint');
      }
      
      // Check for MCP-related keywords in URL
      const mcpKeywords = ['mcp', 'model-context', 'context-protocol', 'tools', 'agents'];
      mcpKeywords.forEach(keyword => {
        if (hostname.includes(keyword) || path.includes(keyword)) {
          confidence += 15;
          discoveredFeatures.push(`Contains MCP keyword: ${keyword}`);
        }
      });
      
      // Check for common MCP service patterns
      const servicePatterns = [
        { pattern: 'github', name: 'GitHub MCP Server' },
        { pattern: 'filesystem', name: 'Filesystem MCP Server' },
        { pattern: 'postgres', name: 'PostgreSQL MCP Server' },
        { pattern: 'slack', name: 'Slack MCP Server' },
        { pattern: 'search', name: 'Search MCP Server' },
        { pattern: 'database', name: 'Database MCP Server' },
        { pattern: 'api', name: 'API MCP Server' },
      ];
      
      let suggestedName: string | undefined;
      servicePatterns.forEach(({ pattern, name }) => {
        if (hostname.includes(pattern) || path.includes(pattern)) {
          confidence += 10;
          discoveredFeatures.push(`Detected service: ${pattern}`);
          if (!suggestedName) {
            suggestedName = name;
          }
        }
      });
      
      // Check for secure connection
      if (parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'wss:') {
        confidence += 5;
        discoveredFeatures.push('Secure connection (HTTPS/WSS)');
      }
      
      // Generate suggested name if not found
      if (!suggestedName) {
        const hostParts = hostname.split('.');
        if (hostParts.length > 0) {
          suggestedName = hostParts[0]
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase()) + ' MCP Server';
        }
      }
      
      const isLikelyMCP = confidence >= 25;
      
      return {
        url,
        type,
        isLikelyMCP,
        confidence: Math.min(confidence, 100),
        discoveredFeatures,
        suggestedName,
      };
      
    } catch (error) {
      return {
        url,
        type: 'unknown',
        isLikelyMCP: false,
        confidence: 0,
        discoveredFeatures: ['Invalid URL format'],
      };
    }
  }
  
  /**
   * Generate common MCP endpoint variations for a base URL
   */
  static generateEndpointVariations(baseUrl: string): string[] {
    try {
      const parsedUrl = new URL(baseUrl);
      const base = `${parsedUrl.protocol}//${parsedUrl.host}`;
      
      const variations = [
        baseUrl, // Original URL
        `${base}/sse`,
        `${base}/mcp`,
        `${base}/stream`,
        `${base}/api/mcp`,
        `${base}/api/sse`,
        `${base}/v1/sse`,
        `${base}/v1/mcp`,
      ];
      
      // Add WebSocket variations if HTTP
      if (parsedUrl.protocol === 'https:') {
        const wsBase = base.replace('https:', 'wss:');
        variations.push(
          `${wsBase}/ws`,
          `${wsBase}/websocket`,
          `${wsBase}/mcp/ws`
        );
      } else if (parsedUrl.protocol === 'http:') {
        const wsBase = base.replace('http:', 'ws:');
        variations.push(
          `${wsBase}/ws`,
          `${wsBase}/websocket`,
          `${wsBase}/mcp/ws`
        );
      }
      
      // Remove duplicates and return
      return [...new Set(variations)];
      
    } catch (error) {
      return [baseUrl];
    }
  }
  
  /**
   * Validate MCP server response format
   */
  static validateMCPResponse(response: any): {
    isValid: boolean;
    version?: string;
    capabilities?: string[];
    tools?: string[];
    errors?: string[];
  } {
    const errors: string[] = [];
    let isValid = true;
    
    try {
      // Check for basic MCP response structure
      if (!response || typeof response !== 'object') {
        errors.push('Response is not a valid object');
        isValid = false;
      }
      
      // Check for MCP protocol indicators
      const hasProtocolInfo = response.protocolVersion || response.serverInfo || response.capabilities;
      if (!hasProtocolInfo) {
        errors.push('Missing MCP protocol information');
        isValid = false;
      }
      
      // Extract information
      const version = response.protocolVersion || response.version;
      const capabilities = response.capabilities || [];
      const tools = response.tools || [];
      
      return {
        isValid,
        version,
        capabilities: Array.isArray(capabilities) ? capabilities : [],
        tools: Array.isArray(tools) ? tools.map((t: any) => t.name || t) : [],
        errors: errors.length > 0 ? errors : undefined,
      };
      
    } catch (error) {
      return {
        isValid: false,
        errors: ['Failed to parse response'],
      };
    }
  }
  
  /**
   * Generate connection suggestions based on URL analysis
   */
  static generateConnectionSuggestions(url: string): {
    suggestions: string[];
    warnings: string[];
    recommendations: string[];
  } {
    const analysis = this.analyzeUrl(url);
    const suggestions: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    // Security suggestions
    if (!url.startsWith('https://') && !url.startsWith('wss://')) {
      warnings.push('Consider using HTTPS/WSS for secure connections');
      suggestions.push('Try the HTTPS version of this URL');
    }
    
    // Endpoint suggestions
    if (!analysis.isLikelyMCP) {
      suggestions.push('This URL may not be an MCP endpoint');
      suggestions.push('Try adding /sse, /mcp, or /stream to the URL');
      
      const variations = this.generateEndpointVariations(url);
      recommendations.push(`Try these variations: ${variations.slice(1, 4).join(', ')}`);
    }
    
    // Authentication suggestions
    if (analysis.discoveredFeatures.some(f => f.includes('github'))) {
      recommendations.push('You may need a GitHub Personal Access Token');
    } else if (analysis.discoveredFeatures.some(f => f.includes('database'))) {
      recommendations.push('You may need database connection credentials');
    } else if (analysis.discoveredFeatures.some(f => f.includes('api'))) {
      recommendations.push('You may need an API key or authentication token');
    }
    
    // General recommendations
    if (analysis.confidence < 50) {
      recommendations.push('Test the connection to verify it works');
      recommendations.push('Check the server documentation for the correct endpoint');
    }
    
    return {
      suggestions,
      warnings,
      recommendations,
    };
  }
  
  /**
   * Extract server information from common MCP server patterns
   */
  static extractServerInfo(url: string): {
    name?: string;
    description?: string;
    category?: string;
    icon?: string;
    tags?: string[];
  } {
    const hostname = new URL(url).hostname.toLowerCase();
    const path = new URL(url).pathname.toLowerCase();
    
    // GitHub patterns
    if (hostname.includes('github') || path.includes('github')) {
      return {
        name: 'GitHub MCP Server',
        description: 'Connect to GitHub repositories, issues, and pull requests',
        category: 'Development',
        icon: '🐙',
        tags: ['github', 'git', 'development', 'repositories'],
      };
    }
    
    // Database patterns
    if (hostname.includes('postgres') || path.includes('postgres')) {
      return {
        name: 'PostgreSQL MCP Server',
        description: 'Query and manage PostgreSQL databases',
        category: 'Database',
        icon: '🐘',
        tags: ['postgresql', 'database', 'sql', 'data'],
      };
    }
    
    // Filesystem patterns
    if (hostname.includes('filesystem') || hostname.includes('files') || path.includes('fs')) {
      return {
        name: 'Filesystem MCP Server',
        description: 'Access and manipulate files and directories',
        category: 'System',
        icon: '📁',
        tags: ['filesystem', 'files', 'directories', 'system'],
      };
    }
    
    // Slack patterns
    if (hostname.includes('slack') || path.includes('slack')) {
      return {
        name: 'Slack MCP Server',
        description: 'Send messages and interact with Slack workspaces',
        category: 'Communication',
        icon: '💬',
        tags: ['slack', 'communication', 'messaging', 'team'],
      };
    }
    
    // Search patterns
    if (hostname.includes('search') || hostname.includes('brave') || path.includes('search')) {
      return {
        name: 'Web Search MCP Server',
        description: 'Search the web using various search engines',
        category: 'Search',
        icon: '🔍',
        tags: ['search', 'web', 'internet', 'brave'],
      };
    }
    
    // Default fallback
    return {
      name: 'Custom MCP Server',
      description: 'Custom MCP server connection',
      category: 'Custom',
      icon: '🔗',
      tags: ['custom', 'api'],
    };
  }
}