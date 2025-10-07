import "server-only";
import { apiKeyService } from "./api-key-service";

/**
 * API Key Provider - Helper for retrieving API keys in server components
 * This provides a clean interface for other services to get API keys
 */
export class ApiKeyProvider {
  private static instance: ApiKeyProvider;

  private constructor() {}

  public static getInstance(): ApiKeyProvider {
    if (!ApiKeyProvider.instance) {
      ApiKeyProvider.instance = new ApiKeyProvider();
    }
    return ApiKeyProvider.instance;
  }

  /**
   * Get API key for a specific service and user
   * Falls back to environment variables if no user key is found
   */
  async getApiKey(userId: string, service: string): Promise<string | null> {
    try {
      // First try to get from user's stored keys
      const userApiKey = await apiKeyService.getApiKeyByService(userId, service);
      if (userApiKey) {
        return userApiKey;
      }

      // Fallback to environment variables
      return this.getEnvironmentApiKey(service);
    } catch (error) {
      console.error(`Failed to get API key for service ${service}:`, error);
      
      // Fallback to environment variables on error
      return this.getEnvironmentApiKey(service);
    }
  }

  /**
   * Get API key from environment variables (fallback)
   */
  private getEnvironmentApiKey(service: string): string | null {
    const envKeyMap: Record<string, string> = {
      'openai': 'OPENAI_API_KEY',
      'anthropic': 'ANTHROPIC_API_KEY',
      'google': 'GOOGLE_API_KEY',
      'groq': 'GROQ_API_KEY',
      'xai': 'XAI_API_KEY',
      'aws': 'AWS_ACCESS_KEY_ID',
      'aws_secret': 'AWS_SECRET_ACCESS_KEY',
      'aws_region': 'AWS_REGION',
    };

    const envVar = envKeyMap[service];
    if (!envVar) {
      return null;
    }

    return process.env[envVar] || null;
  }

  /**
   * Check if user has API key for service
   */
  async hasApiKey(userId: string, service: string): Promise<boolean> {
    try {
      const apiKey = await this.getApiKey(userId, service);
      return apiKey !== null;
    } catch (error) {
      console.error(`Failed to check API key for service ${service}:`, error);
      return false;
    }
  }

  /**
   * Get multiple API keys at once
   */
  async getApiKeys(userId: string, services: string[]): Promise<Record<string, string | null>> {
    const results: Record<string, string | null> = {};
    
    await Promise.all(
      services.map(async (service) => {
        results[service] = await this.getApiKey(userId, service);
      })
    );

    return results;
  }

  /**
   * Get OpenAI API key (convenience method)
   */
  async getOpenAIApiKey(userId: string): Promise<string | null> {
    return this.getApiKey(userId, 'openai');
  }

  /**
   * Get Anthropic API key (convenience method)
   */
  async getAnthropicApiKey(userId: string): Promise<string | null> {
    return this.getApiKey(userId, 'anthropic');
  }

  /**
   * Get Google API key (convenience method)
   */
  async getGoogleApiKey(userId: string): Promise<string | null> {
    return this.getApiKey(userId, 'google');
  }

  /**
   * Get AWS credentials (convenience method)
   */
  async getAWSCredentials(userId: string): Promise<{
    accessKeyId: string | null;
    secretAccessKey: string | null;
    region: string | null;
  }> {
    const [accessKeyId, secretAccessKey, region] = await Promise.all([
      this.getApiKey(userId, 'aws'),
      this.getApiKey(userId, 'aws_secret'),
      this.getApiKey(userId, 'aws_region'),
    ]);

    return {
      accessKeyId,
      secretAccessKey,
      region,
    };
  }

  /**
   * Validate that required API keys are available
   */
  async validateRequiredKeys(userId: string, requiredServices: string[]): Promise<{
    isValid: boolean;
    missingServices: string[];
    availableServices: string[];
  }> {
    const results = await this.getApiKeys(userId, requiredServices);
    
    const missingServices: string[] = [];
    const availableServices: string[] = [];

    for (const [service, apiKey] of Object.entries(results)) {
      if (apiKey) {
        availableServices.push(service);
      } else {
        missingServices.push(service);
      }
    }

    return {
      isValid: missingServices.length === 0,
      missingServices,
      availableServices,
    };
  }

  /**
   * Get API configuration for a service
   */
  async getServiceConfig(userId: string, service: string): Promise<{
    apiKey: string | null;
    baseUrl?: string;
    headers?: Record<string, string>;
  }> {
    const apiKey = await this.getApiKey(userId, service);
    
    // Service-specific configurations
    const configs: Record<string, any> = {
      'openai': {
        baseUrl: 'https://api.openai.com/v1',
        headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {},
      },
      'anthropic': {
        baseUrl: 'https://api.anthropic.com/v1',
        headers: apiKey ? { 
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        } : {},
      },
      'google': {
        baseUrl: 'https://generativelanguage.googleapis.com/v1',
        headers: {},
      },
      'groq': {
        baseUrl: 'https://api.groq.com/openai/v1',
        headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {},
      },
      'xai': {
        baseUrl: 'https://api.x.ai/v1',
        headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {},
      },
    };

    const config = configs[service] || { headers: {} };
    
    return {
      apiKey,
      ...config,
    };
  }
}

// Export singleton instance
export const apiKeyProvider = ApiKeyProvider.getInstance();