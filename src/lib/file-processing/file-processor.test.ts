import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileProcessor } from './file-processor';

describe('FileProcessor', () => {
  let fileProcessor: FileProcessor;

  beforeEach(() => {
    fileProcessor = FileProcessor.getInstance();
    
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = FileProcessor.getInstance();
      const instance2 = FileProcessor.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('processFile', () => {
    it('should process a plain text file', async () => {
      const textContent = 'Hello, this is a test file with some content.';
      const buffer = Buffer.from(textContent, 'utf8');
      
      const result = await fileProcessor.processFile(buffer, 'test.txt', {
        extractText: true,
        generateSummary: false,
        extractKeywords: false,
      });

      expect(result.text).toBe(textContent);
      expect(result.metadata.filename).toBe('test.txt');
      expect(result.metadata.mimeType).toBe('text/plain');
      expect(result.metadata.size).toBe(buffer.length);
      expect(result.metadata.checksum).toBeDefined();
    });

    it('should process a JSON file', async () => {
      const jsonContent = JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        settings: {
          theme: 'dark',
          notifications: true
        }
      });
      const buffer = Buffer.from(jsonContent, 'utf8');
      
      const result = await fileProcessor.processFile(buffer, 'data.json', {
        extractText: true,
      });

      expect(result.text).toContain('Test User');
      expect(result.text).toContain('test@example.com');
      expect(result.metadata.mimeType).toBe('application/json');
    });

    it('should process an HTML file', async () => {
      const htmlContent = `
        <html>
          <head><title>Test Page</title></head>
          <body>
            <h1>Welcome</h1>
            <p>This is a test paragraph with <strong>bold text</strong>.</p>
            <script>console.log('test');</script>
          </body>
        </html>
      `;
      const buffer = Buffer.from(htmlContent, 'utf8');
      
      const result = await fileProcessor.processFile(buffer, 'page.html', {
        extractText: true,
      });

      expect(result.text).toContain('Welcome');
      expect(result.text).toContain('This is a test paragraph');
      expect(result.text).not.toContain('<h1>');
      expect(result.text).not.toContain('console.log');
      expect(result.metadata.mimeType).toBe('text/html');
    });

    it('should extract keywords from text', async () => {
      const textContent = 'Machine learning algorithms are powerful tools for data analysis. ' +
                          'These algorithms can process large datasets and identify patterns. ' +
                          'Data scientists use machine learning for predictive modeling.';
      const buffer = Buffer.from(textContent, 'utf8');
      
      const result = await fileProcessor.processFile(buffer, 'ml-article.txt', {
        extractText: true,
        extractKeywords: true,
      });

      expect(result.keywords).toBeDefined();
      expect(result.keywords!.length).toBeGreaterThan(0);
      expect(result.keywords).toContain('machine');
      expect(result.keywords).toContain('learning');
      expect(result.keywords).toContain('algorithms');
    });

    it('should detect entities in text', async () => {
      const textContent = 'Contact John Doe at john.doe@example.com or visit https://example.com for more information.';
      const buffer = Buffer.from(textContent, 'utf8');
      
      const result = await fileProcessor.processFile(buffer, 'contact.txt', {
        extractText: true,
        detectEntities: true,
      });

      expect(result.entities).toBeDefined();
      expect(result.entities!.length).toBeGreaterThan(0);
      
      const emailEntity = result.entities!.find(e => e.type === 'EMAIL');
      const urlEntity = result.entities!.find(e => e.type === 'URL');
      
      expect(emailEntity).toBeDefined();
      expect(emailEntity!.text).toBe('john.doe@example.com');
      expect(urlEntity).toBeDefined();
      expect(urlEntity!.text).toBe('https://example.com');
    });

    it('should generate summary for long text', async () => {
      const longText = 'This is the first sentence of a long document. ' +
                      'The second sentence provides more context about the topic. ' +
                      'The third sentence adds additional details and information. ' +
                      'This continues for many more sentences to create a substantial amount of text content. ' +
                      'The document covers various aspects of the subject matter in great detail.';
      const buffer = Buffer.from(longText, 'utf8');
      
      const result = await fileProcessor.processFile(buffer, 'long-doc.txt', {
        extractText: true,
        generateSummary: true,
      });

      expect(result.summary).toBeDefined();
      expect(result.summary!.length).toBeGreaterThan(0);
      expect(result.summary!.length).toBeLessThan(longText.length);
    });

    it('should handle binary files gracefully', async () => {
      // Create a buffer with binary data
      const binaryBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]); // PNG header
      
      const result = await fileProcessor.processFile(binaryBuffer, 'image.png', {
        extractText: true,
      });

      expect(result.metadata.mimeType).toBe('image/png');
      expect(result.metadata.size).toBe(binaryBuffer.length);
      // Text extraction should not crash, but may return undefined or empty
      expect(result.text).toBeDefined();
    });

    it('should respect maxTextLength option', async () => {
      const longText = 'A'.repeat(1000);
      const buffer = Buffer.from(longText, 'utf8');
      
      const result = await fileProcessor.processFile(buffer, 'long.txt', {
        extractText: true,
        maxTextLength: 100,
      });

      expect(result.text!.length).toBeLessThanOrEqual(103); // 100 + "..."
      expect(result.text).toEndWith('...');
    });

    it('should handle processing errors gracefully', async () => {
      const buffer = Buffer.from('test content', 'utf8');
      
      // Mock a method to throw an error
      const originalExtractText = (fileProcessor as any).extractText;
      (fileProcessor as any).extractText = vi.fn().mockRejectedValue(new Error('Processing failed'));
      
      const result = await fileProcessor.processFile(buffer, 'test.txt', {
        extractText: true,
      });

      // Should still return basic metadata even if processing fails
      expect(result.metadata).toBeDefined();
      expect(result.metadata.filename).toBe('test.txt');
      expect(result.text).toBeUndefined();
      
      // Restore original method
      (fileProcessor as any).extractText = originalExtractText;
    });

    it('should detect MIME types correctly', async () => {
      const testCases = [
        { filename: 'test.txt', expected: 'text/plain' },
        { filename: 'data.json', expected: 'application/json' },
        { filename: 'page.html', expected: 'text/html' },
        { filename: 'styles.css', expected: 'text/css' },
        { filename: 'script.js', expected: 'application/javascript' },
        { filename: 'data.csv', expected: 'text/csv' },
        { filename: 'unknown.xyz', expected: 'application/octet-stream' },
      ];

      for (const testCase of testCases) {
        const buffer = Buffer.from('test content', 'utf8');
        const result = await fileProcessor.processFile(buffer, testCase.filename);
        expect(result.metadata.mimeType).toBe(testCase.expected);
      }
    });

    it('should calculate checksums correctly', async () => {
      const content1 = 'Hello World';
      const content2 = 'Hello World';
      const content3 = 'Different Content';
      
      const buffer1 = Buffer.from(content1, 'utf8');
      const buffer2 = Buffer.from(content2, 'utf8');
      const buffer3 = Buffer.from(content3, 'utf8');
      
      const result1 = await fileProcessor.processFile(buffer1, 'test1.txt');
      const result2 = await fileProcessor.processFile(buffer2, 'test2.txt');
      const result3 = await fileProcessor.processFile(buffer3, 'test3.txt');
      
      // Same content should have same checksum
      expect(result1.metadata.checksum).toBe(result2.metadata.checksum);
      
      // Different content should have different checksum
      expect(result1.metadata.checksum).not.toBe(result3.metadata.checksum);
      
      // Checksums should be hex strings
      expect(result1.metadata.checksum).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should handle different text encodings', async () => {
      const testText = 'Hello, 世界! Café';
      
      // Test UTF-8
      const utf8Buffer = Buffer.from(testText, 'utf8');
      const utf8Result = await fileProcessor.processFile(utf8Buffer, 'utf8.txt');
      expect(utf8Result.text).toContain('世界');
      expect(utf8Result.text).toContain('Café');
      
      // Test Latin-1
      const latin1Text = 'Hello, Café';
      const latin1Buffer = Buffer.from(latin1Text, 'latin1');
      const latin1Result = await fileProcessor.processFile(latin1Buffer, 'latin1.txt');
      expect(latin1Result.text).toContain('Café');
    });

    it('should handle File objects', async () => {
      const textContent = 'File object test content';
      const file = new File([textContent], 'test-file.txt', { type: 'text/plain' });
      
      const result = await fileProcessor.processFile(file, 'test-file.txt', {
        extractText: true,
      });

      expect(result.text).toBe(textContent);
      expect(result.metadata.filename).toBe('test-file.txt');
      expect(result.metadata.size).toBe(textContent.length);
    });
  });

  describe('edge cases', () => {
    it('should handle empty files', async () => {
      const emptyBuffer = Buffer.alloc(0);
      
      const result = await fileProcessor.processFile(emptyBuffer, 'empty.txt');
      
      expect(result.metadata.size).toBe(0);
      expect(result.text).toBe('');
    });

    it('should handle files with no extension', async () => {
      const buffer = Buffer.from('content without extension', 'utf8');
      
      const result = await fileProcessor.processFile(buffer, 'README');
      
      expect(result.metadata.mimeType).toBe('application/octet-stream');
      expect(result.text).toBe('content without extension');
    });

    it('should handle very large text content', async () => {
      const largeText = 'A'.repeat(100000);
      const buffer = Buffer.from(largeText, 'utf8');
      
      const result = await fileProcessor.processFile(buffer, 'large.txt', {
        extractText: true,
        maxTextLength: 1000,
      });

      expect(result.text!.length).toBeLessThanOrEqual(1003); // 1000 + "..."
    });

    it('should handle special characters in filenames', async () => {
      const buffer = Buffer.from('test content', 'utf8');
      const specialFilename = 'test file (1) [copy].txt';
      
      const result = await fileProcessor.processFile(buffer, specialFilename);
      
      expect(result.metadata.filename).toBe(specialFilename);
    });
  });
});