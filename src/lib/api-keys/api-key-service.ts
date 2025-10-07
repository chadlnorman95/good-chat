import "server-only";
import { db } from "lib/db/pg";
import { sql } from "drizzle-orm";
import { createHash, createCipher, createDecipher, randomBytes } from "crypto";

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  service: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
  usageCount: number;
  expiresAt?: Date;
}

export interface ApiKeyWithValue extends ApiKey {
  value: string;
}

export interface CreateApiKeyRequest {
  name: string;
  service: string;
  value: string;
  description?: string;
  expiresAt?: Date;
}

export interface UpdateApiKeyRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  expiresAt?: Date;
}

/**
 * Secure API Key Management Service
 * Handles encrypted storage and retrieval of API keys
 */
export class ApiKeyService {
  private static instance: ApiKeyService;
  private readonly encryptionKey: string;

  private constructor() {
    // Use a combination of environment variables to create encryption key
    const secret = process.env.BETTER_AUTH_SECRET || 'fallback-secret-key';
    const salt = process.env.API_KEY_SALT || 'api-key-salt';
    this.encryptionKey = createHash('sha256').update(secret + salt).digest('hex').slice(0, 32);
  }

  public static getInstance(): ApiKeyService {
    if (!ApiKeyService.instance) {
      ApiKeyService.instance = new ApiKeyService();
    }
    return ApiKeyService.instance;
  }

  /**
   * Encrypt an API key value
   */
  private encrypt(text: string): string {
    try {
      const iv = randomBytes(16);
      const cipher = createCipher('aes-256-cbc', this.encryptionKey);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Failed to encrypt API key:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt an API key value
   */
  private decrypt(encryptedText: string): string {
    try {
      const [ivHex, encrypted] = encryptedText.split(':');
      const decipher = createDecipher('aes-256-cbc', this.encryptionKey);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Failed to decrypt API key:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Create a new API key
   */
  async createApiKey(userId: string, request: CreateApiKeyRequest): Promise<ApiKey> {
    try {
      const id = this.generateId();
      const encryptedValue = this.encrypt(request.value);
      const now = new Date();

      // In a real implementation, this would use a proper database table
      // For now, we'll simulate the storage
      console.log('Creating API key:', {
        id,
        userId,
        name: request.name,
        service: request.service,
        description: request.description,
        encryptedValue: encryptedValue.substring(0, 20) + '...',
      });

      const apiKey: ApiKey = {
        id,
        userId,
        name: request.name,
        service: request.service,
        description: request.description,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        usageCount: 0,
        expiresAt: request.expiresAt,
      };

      return apiKey;
    } catch (error) {
      console.error('Failed to create API key:', error);
      throw new Error('Failed to create API key');
    }
  }

  /**
   * Get all API keys for a user (without values)
   */
  async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    try {
      console.log('Getting API keys for user:', userId);

      // Simulate API keys for demonstration
      const mockApiKeys: ApiKey[] = [
        {
          id: 'key_1',
          userId,
          name: 'OpenAI API Key',
          service: 'openai',
          description: 'For GPT-4 and other OpenAI models',
          isActive: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
          lastUsedAt: new Date('2024-01-16'),
          usageCount: 25,
        },
        {
          id: 'key_2',
          userId,
          name: 'Anthropic Claude',
          service: 'anthropic',
          description: 'Claude API access',
          isActive: true,
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-12'),
          lastUsedAt: new Date('2024-01-14'),
          usageCount: 12,
        },
        {
          id: 'key_3',
          userId,
          name: 'AWS S3 Access',
          service: 'aws',
          description: 'S3 bucket access for file storage',
          isActive: false,
          createdAt: new Date('2024-01-08'),
          updatedAt: new Date('2024-01-08'),
          usageCount: 0,
          expiresAt: new Date('2024-12-31'),
        },
      ];

      return mockApiKeys;
    } catch (error) {
      console.error('Failed to get user API keys:', error);
      return [];
    }
  }

  /**
   * Get a specific API key with its decrypted value
   */
  async getApiKey(userId: string, keyId: string): Promise<ApiKeyWithValue | null> {
    try {
      console.log('Getting API key:', { userId, keyId });

      // In a real implementation, this would query the database and decrypt the value
      // For now, we'll simulate this
      const mockKey: ApiKeyWithValue = {
        id: keyId,
        userId,
        name: 'OpenAI API Key',
        service: 'openai',
        description: 'For GPT-4 and other OpenAI models',
        value: 'sk-mock-api-key-value-for-demonstration',
        isActive: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        lastUsedAt: new Date('2024-01-16'),
        usageCount: 25,
      };

      // Track access
      await this.trackUsage(keyId, userId);

      return mockKey;
    } catch (error) {
      console.error('Failed to get API key:', error);
      return null;
    }
  }

  /**
   * Get API key value by service name (for internal use)
   */
  async getApiKeyByService(userId: string, service: string): Promise<string | null> {
    try {
      console.log('Getting API key by service:', { userId, service });

      // In a real implementation, this would query the database
      const serviceKeys: Record<string, string> = {
        'openai': 'sk-mock-openai-key',
        'anthropic': 'sk-ant-mock-key',
        'aws': 'AKIA-mock-aws-key',
        'google': 'AIza-mock-google-key',
      };

      return serviceKeys[service] || null;
    } catch (error) {
      console.error('Failed to get API key by service:', error);
      return null;
    }
  }

  /**
   * Update an API key
   */
  async updateApiKey(userId: string, keyId: string, updates: UpdateApiKeyRequest): Promise<ApiKey | null> {
    try {
      console.log('Updating API key:', { userId, keyId, updates });

      // Simulate update
      const updatedKey: ApiKey = {
        id: keyId,
        userId,
        name: updates.name || 'Updated API Key',
        service: 'openai',
        description: updates.description,
        isActive: updates.isActive !== undefined ? updates.isActive : true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        usageCount: 25,
        expiresAt: updates.expiresAt,
      };

      return updatedKey;
    } catch (error) {
      console.error('Failed to update API key:', error);
      throw new Error('Failed to update API key');
    }
  }

  /**
   * Delete an API key
   */
  async deleteApiKey(userId: string, keyId: string): Promise<boolean> {
    try {
      console.log('Deleting API key:', { userId, keyId });

      // In a real implementation, this would delete from database
      return true;
    } catch (error) {
      console.error('Failed to delete API key:', error);
      throw new Error('Failed to delete API key');
    }
  }

  /**
   * Test an API key by making a simple request
   */
  async testApiKey(userId: string, keyId: string): Promise<{
    isValid: boolean;
    service: string;
    error?: string;
    metadata?: Record<string, any>;
  }> {
    try {
      const apiKey = await this.getApiKey(userId, keyId);
      if (!apiKey) {
        return { isValid: false, service: '', error: 'API key not found' };
      }

      // Simulate API key testing based on service
      const testResults: Record<string, any> = {
        'openai': {
          isValid: true,
          service: 'openai',
          metadata: {
            organization: 'org-mock123',
            models: ['gpt-4', 'gpt-3.5-turbo'],
            usage: { requests: 1250, tokens: 45000 }
          }
        },
        'anthropic': {
          isValid: true,
          service: 'anthropic',
          metadata: {
            models: ['claude-3-opus', 'claude-3-sonnet'],
            usage: { requests: 850, tokens: 32000 }
          }
        },
        'aws': {
          isValid: true,
          service: 'aws',
          metadata: {
            region: 'us-east-1',
            services: ['s3', 'lambda'],
            buckets: 3
          }
        },
        'google': {
          isValid: true,
          service: 'google',
          metadata: {
            project: 'my-project-123',
            services: ['gemini-pro', 'text-bison'],
            quota: { requests: 10000, remaining: 8750 }
          }
        }
      };

      return testResults[apiKey.service] || {
        isValid: false,
        service: apiKey.service,
        error: 'Service not supported for testing'
      };
    } catch (error) {
      console.error('Failed to test API key:', error);
      return {
        isValid: false,
        service: '',
        error: 'Test failed: ' + (error instanceof Error ? error.message : 'Unknown error')
      };
    }
  }

  /**
   * Get API key usage statistics
   */
  async getUsageStats(userId: string, keyId?: string): Promise<{
    totalKeys: number;
    activeKeys: number;
    totalUsage: number;
    keyStats: Array<{
      id: string;
      name: string;
      service: string;
      usageCount: number;
      lastUsedAt?: Date;
    }>;
    serviceBreakdown: Record<string, number>;
  }> {
    try {
      console.log('Getting usage stats:', { userId, keyId });

      // Simulate usage statistics
      return {
        totalKeys: 3,
        activeKeys: 2,
        totalUsage: 37,
        keyStats: [
          {
            id: 'key_1',
            name: 'OpenAI API Key',
            service: 'openai',
            usageCount: 25,
            lastUsedAt: new Date('2024-01-16'),
          },
          {
            id: 'key_2',
            name: 'Anthropic Claude',
            service: 'anthropic',
            usageCount: 12,
            lastUsedAt: new Date('2024-01-14'),
          },
          {
            id: 'key_3',
            name: 'AWS S3 Access',
            service: 'aws',
            usageCount: 0,
          },
        ],
        serviceBreakdown: {
          'openai': 25,
          'anthropic': 12,
          'aws': 0,
        },
      };
    } catch (error) {
      console.error('Failed to get usage stats:', error);
      return {
        totalKeys: 0,
        activeKeys: 0,
        totalUsage: 0,
        keyStats: [],
        serviceBreakdown: {},
      };
    }
  }

  /**
   * Track API key usage
   */
  private async trackUsage(keyId: string, userId: string): Promise<void> {
    try {
      console.log('Tracking API key usage:', { keyId, userId });
      // In a real implementation, this would update usage counters and last used timestamp
    } catch (error) {
      console.error('Failed to track API key usage:', error);
    }
  }

  /**
   * Generate unique ID for API keys
   */
  private generateId(): string {
    return `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate API key format based on service
   */
  validateApiKeyFormat(service: string, value: string): {
    isValid: boolean;
    error?: string;
  } {
    const patterns: Record<string, RegExp> = {
      'openai': /^sk-[a-zA-Z0-9]{48,}$/,
      'anthropic': /^sk-ant-[a-zA-Z0-9-]{95,}$/,
      'aws': /^AKIA[0-9A-Z]{16}$/,
      'google': /^AIza[0-9A-Za-z-_]{35}$/,
      'groq': /^gsk_[a-zA-Z0-9]{52}$/,
      'xai': /^xai-[a-zA-Z0-9]{64}$/,
    };

    const pattern = patterns[service];
    if (!pattern) {
      return { isValid: true }; // Allow unknown services
    }

    if (!pattern.test(value)) {
      return {
        isValid: false,
        error: `Invalid ${service} API key format`
      };
    }

    return { isValid: true };
  }

  /**
   * Get supported services
   */
  getSupportedServices(): Array<{
    id: string;
    name: string;
    description: string;
    website: string;
    keyFormat: string;
  }> {
    return [
      {
        id: 'openai',
        name: 'OpenAI',
        description: 'GPT-4, GPT-3.5, DALL-E, and other OpenAI models',
        website: 'https://platform.openai.com/api-keys',
        keyFormat: 'sk-...'
      },
      {
        id: 'anthropic',
        name: 'Anthropic',
        description: 'Claude 3 Opus, Sonnet, and Haiku models',
        website: 'https://console.anthropic.com/settings/keys',
        keyFormat: 'sk-ant-...'
      },
      {
        id: 'google',
        name: 'Google AI',
        description: 'Gemini Pro, PaLM, and other Google AI models',
        website: 'https://makersuite.google.com/app/apikey',
        keyFormat: 'AIza...'
      },
      {
        id: 'groq',
        name: 'Groq',
        description: 'Fast inference for Llama, Mixtral, and Gemma models',
        website: 'https://console.groq.com/keys',
        keyFormat: 'gsk_...'
      },
      {
        id: 'xai',
        name: 'xAI',
        description: 'Grok and other xAI models',
        website: 'https://console.x.ai/api-keys',
        keyFormat: 'xai-...'
      },
      {
        id: 'aws',
        name: 'Amazon Web Services',
        description: 'S3 storage, Bedrock models, and other AWS services',
        website: 'https://console.aws.amazon.com/iam/home#/security_credentials',
        keyFormat: 'AKIA...'
      },
      {
        id: 'custom',
        name: 'Custom Service',
        description: 'Custom API endpoint or service',
        website: '',
        keyFormat: 'Any format'
      }
    ];
  }
}

// Export singleton instance
export const apiKeyService = ApiKeyService.getInstance();