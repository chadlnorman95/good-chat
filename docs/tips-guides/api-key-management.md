# API Key Management System

The API Key Management system provides a secure way to store and manage API keys for various AI services and integrations directly through the application interface, eliminating the need to manage environment variables.

## Features

### 🔐 Secure Storage
- **Encrypted Storage**: All API keys are encrypted using AES-256-CBC encryption
- **User Isolation**: Each user's API keys are completely isolated from others
- **Access Control**: Only authenticated users can manage their own keys

### 🎯 Supported Services
- **OpenAI**: GPT-4, GPT-3.5, DALL-E, and other OpenAI models
- **Anthropic**: Claude 3 Opus, Sonnet, and Haiku models
- **Google AI**: Gemini Pro, PaLM, and other Google AI models
- **Groq**: Fast inference for Llama, Mixtral, and Gemma models
- **xAI**: Grok and other xAI models
- **AWS**: S3 storage, Bedrock models, and other AWS services
- **Custom Services**: Support for any custom API endpoint

### 🛠️ Management Features
- **Create/Update/Delete**: Full CRUD operations for API keys
- **Test Functionality**: Validate API keys by making test requests
- **Usage Tracking**: Monitor API key usage and statistics
- **Expiration Management**: Set expiration dates for keys
- **Active/Inactive Toggle**: Enable/disable keys without deletion

## Getting Started

### Adding Your First API Key

1. **Navigate to API Keys**: Click on "API Keys" in the sidebar
2. **Add New Key**: Click the "Add API Key" button
3. **Fill Details**:
   - **Name**: Give your key a descriptive name (e.g., "My OpenAI Key")
   - **Service**: Select the service from the dropdown
   - **API Key**: Enter your actual API key
   - **Description**: Optional description of what you'll use it for
   - **Expiration**: Optional expiration date

4. **Save**: Click "Add API Key" to save securely

### Getting API Keys

#### For OpenAI:
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in to your account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

#### For Anthropic:
1. Visit [Anthropic Console](https://console.anthropic.com/settings/keys)
2. Sign in to your account
3. Click "Create Key"
4. Copy the key (starts with `sk-ant-`)

#### For Google AI:
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIza`)

#### For AWS:
1. Visit [AWS IAM Console](https://console.aws.amazon.com/iam/home#/security_credentials)
2. Go to "Access keys" section
3. Click "Create access key"
4. Copy both Access Key ID and Secret Access Key

## Usage in Code

### Server-Side Usage

```typescript
import { apiKeyProvider } from "lib/api-keys/api-key-provider";

// Get API key for a specific service
const openaiKey = await apiKeyProvider.getOpenAIApiKey(userId);

// Get multiple keys at once
const keys = await apiKeyProvider.getApiKeys(userId, ['openai', 'anthropic']);

// Check if user has required keys
const validation = await apiKeyProvider.validateRequiredKeys(userId, ['openai']);

// Get service configuration
const config = await apiKeyProvider.getServiceConfig(userId, 'openai');
```

### Client-Side Usage

```typescript
import { useApiKeys } from "@/hooks/use-api-keys";

function MyComponent() {
  const { apiKeys, hasApiKey, refreshApiKeys } = useApiKeys();
  
  const hasOpenAI = hasApiKey('openai');
  
  return (
    <div>
      {hasOpenAI ? (
        <p>OpenAI is configured!</p>
      ) : (
        <p>Please add your OpenAI API key</p>
      )}
    </div>
  );
}
```

## Security Best Practices

### 🔒 Encryption
- All API keys are encrypted before storage
- Encryption uses AES-256-CBC with a derived key
- Keys are only decrypted when needed for API calls

### 🛡️ Access Control
- Users can only access their own API keys
- Server-side validation ensures proper authorization
- API endpoints require authentication

### 🔍 Monitoring
- Track API key usage and access patterns
- Monitor for unusual activity
- Set expiration dates for temporary keys

### 🚫 What NOT to Store
- Don't store API keys in:
  - Client-side code
  - Version control systems
  - Plain text files
  - Browser localStorage

## API Endpoints

### Create API Key
```http
POST /api/api-keys
Content-Type: application/json

{
  "name": "My OpenAI Key",
  "service": "openai",
  "value": "sk-...",
  "description": "For GPT-4 usage",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

### Get User's API Keys
```http
GET /api/api-keys
```

### Get Specific API Key
```http
GET /api/api-keys/{id}?includeValue=true
```

### Update API Key
```http
PUT /api/api-keys/{id}
Content-Type: application/json

{
  "name": "Updated Name",
  "isActive": false
}
```

### Delete API Key
```http
DELETE /api/api-keys/{id}
```

### Test API Key
```http
POST /api/api-keys/test
Content-Type: application/json

{
  "keyId": "key_123"
}
```

### Get Usage Statistics
```http
GET /api/api-keys/stats
```

## Integration Examples

### Using with OpenAI
```typescript
import { apiKeyProvider } from "lib/api-keys/api-key-provider";
import OpenAI from "openai";

async function createOpenAIClient(userId: string) {
  const apiKey = await apiKeyProvider.getOpenAIApiKey(userId);
  
  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }
  
  return new OpenAI({ apiKey });
}
```

### Using with S3 Storage
```typescript
import { apiKeyProvider } from "lib/api-keys/api-key-provider";
import { S3Client } from "@aws-sdk/client-s3";

async function createS3Client(userId: string) {
  const credentials = await apiKeyProvider.getAWSCredentials(userId);
  
  if (!credentials.accessKeyId || !credentials.secretAccessKey) {
    throw new Error("AWS credentials not configured");
  }
  
  return new S3Client({
    region: credentials.region || 'us-east-1',
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
  });
}
```

## Troubleshooting

### Common Issues

#### "Invalid API key format"
- Check that your API key matches the expected format for the service
- Ensure there are no extra spaces or characters
- Verify you're using the correct service type

#### "API key test failed"
- Verify the API key is correct and active
- Check if the service has usage limits or restrictions
- Ensure your account has the necessary permissions

#### "Unauthorized" errors
- Make sure you're logged in
- Check that you're trying to access your own API keys
- Verify your session hasn't expired

### Getting Help

1. **Check the UI**: The interface provides helpful hints and validation
2. **Test Your Keys**: Use the built-in test functionality
3. **Review Logs**: Check the browser console for detailed error messages
4. **Service Documentation**: Refer to the specific service's API documentation

## Migration from Environment Variables

If you're currently using environment variables, you can gradually migrate:

1. **Add keys through the UI** while keeping environment variables
2. **Test the new system** with a few API calls
3. **Remove environment variables** once you're confident
4. **Update deployment scripts** to not require the old variables

The system automatically falls back to environment variables if no user key is found, making migration seamless.

## Future Enhancements

- **Team Sharing**: Share API keys within organizations
- **Usage Quotas**: Set spending limits per key
- **Audit Logs**: Detailed logging of key usage
- **Key Rotation**: Automatic key rotation for supported services
- **Backup/Export**: Export encrypted key backups