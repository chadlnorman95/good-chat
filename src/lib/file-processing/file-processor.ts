import "server-only";

export interface FileMetadata {
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  checksum?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number; // for audio/video files
  pageCount?: number; // for documents
  language?: string; // detected language
  encoding?: string; // text encoding
}

export interface ProcessedFileContent {
  text?: string;
  metadata: FileMetadata;
  thumbnails?: string[]; // base64 encoded thumbnails
  summary?: string;
  keywords?: string[];
  entities?: Array<{
    text: string;
    type: string;
    confidence: number;
  }>;
}

export interface FileProcessingOptions {
  extractText?: boolean;
  generateThumbnails?: boolean;
  generateSummary?: boolean;
  extractKeywords?: boolean;
  detectEntities?: boolean;
  maxTextLength?: number;
  thumbnailSizes?: Array<{ width: number; height: number }>;
}

/**
 * Enhanced file processing service with support for various file types
 */
export class FileProcessor {
  private static instance: FileProcessor;

  public static getInstance(): FileProcessor {
    if (!FileProcessor.instance) {
      FileProcessor.instance = new FileProcessor();
    }
    return FileProcessor.instance;
  }

  /**
   * Process a file and extract content, metadata, and insights
   */
  async processFile(
    file: File | Buffer,
    filename: string,
    options: FileProcessingOptions = {}
  ): Promise<ProcessedFileContent> {
    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
    const mimeType = this.detectMimeType(filename, buffer);
    
    const metadata: FileMetadata = {
      filename,
      size: buffer.length,
      mimeType,
      uploadedAt: new Date(),
      checksum: await this.calculateChecksum(buffer),
    };

    let text: string | undefined;
    let thumbnails: string[] | undefined;
    let summary: string | undefined;
    let keywords: string[] | undefined;
    let entities: Array<{ text: string; type: string; confidence: number }> | undefined;

    try {
      // Extract text content
      if (options.extractText !== false) {
        text = await this.extractText(buffer, mimeType, filename);
        if (options.maxTextLength && text && text.length > options.maxTextLength) {
          text = text.substring(0, options.maxTextLength) + '...';
        }
      }

      // Generate thumbnails for images and documents
      if (options.generateThumbnails && this.canGenerateThumbnails(mimeType)) {
        thumbnails = await this.generateThumbnails(buffer, mimeType, options.thumbnailSizes);
      }

      // Extract additional metadata
      await this.extractAdditionalMetadata(buffer, mimeType, metadata);

      // Generate summary if text is available
      if (options.generateSummary && text && text.length > 200) {
        summary = await this.generateSummary(text);
      }

      // Extract keywords
      if (options.extractKeywords && text) {
        keywords = await this.extractKeywords(text);
      }

      // Detect entities
      if (options.detectEntities && text) {
        entities = await this.detectEntities(text);
      }

    } catch (error) {
      console.error('Error processing file:', error);
      // Continue with basic metadata even if processing fails
    }

    return {
      text,
      metadata,
      thumbnails,
      summary,
      keywords,
      entities,
    };
  }

  /**
   * Extract text content from various file types
   */
  private async extractText(buffer: Buffer, mimeType: string, filename: string): Promise<string | undefined> {
    try {
      switch (mimeType) {
        case 'text/plain':
        case 'text/markdown':
        case 'text/csv':
          return this.extractPlainText(buffer);
        
        case 'application/json':
          return this.extractJsonText(buffer);
        
        case 'text/html':
          return this.extractHtmlText(buffer);
        
        case 'application/pdf':
          return await this.extractPdfText(buffer);
        
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          return await this.extractDocxText(buffer);
        
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        case 'application/vnd.ms-excel':
          return await this.extractExcelText(buffer);
        
        case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        case 'application/vnd.ms-powerpoint':
          return await this.extractPowerpointText(buffer);
        
        default:
          // Try to extract as plain text if it's a text-based file
          if (mimeType.startsWith('text/') || this.isTextFile(filename)) {
            return this.extractPlainText(buffer);
          }
          return undefined;
      }
    } catch (error) {
      console.error('Error extracting text:', error);
      return undefined;
    }
  }

  /**
   * Extract plain text content
   */
  private extractPlainText(buffer: Buffer): string {
    // Try different encodings
    const encodings = ['utf8', 'utf16le', 'latin1'];
    
    for (const encoding of encodings) {
      try {
        const text = buffer.toString(encoding as BufferEncoding);
        // Check if the text looks valid (no excessive null bytes or control characters)
        if (this.isValidText(text)) {
          return text;
        }
      } catch (error) {
        continue;
      }
    }
    
    // Fallback to utf8
    return buffer.toString('utf8');
  }

  /**
   * Extract text from JSON files
   */
  private extractJsonText(buffer: Buffer): string {
    try {
      const jsonStr = buffer.toString('utf8');
      const parsed = JSON.parse(jsonStr);
      return this.extractTextFromObject(parsed);
    } catch (error) {
      return buffer.toString('utf8');
    }
  }

  /**
   * Extract text from HTML files
   */
  private extractHtmlText(buffer: Buffer): string {
    const html = buffer.toString('utf8');
    // Simple HTML tag removal - in production, use a proper HTML parser
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract text from PDF files (placeholder - would need pdf-parse or similar)
   */
  private async extractPdfText(buffer: Buffer): Promise<string> {
    // This is a placeholder implementation
    // In a real implementation, you would use a library like pdf-parse
    console.log('PDF text extraction not implemented - would use pdf-parse library');
    return 'PDF text extraction requires additional dependencies';
  }

  /**
   * Extract text from DOCX files (placeholder)
   */
  private async extractDocxText(buffer: Buffer): Promise<string> {
    // This is a placeholder implementation
    // In a real implementation, you would use a library like mammoth or docx-parser
    console.log('DOCX text extraction not implemented - would use mammoth library');
    return 'DOCX text extraction requires additional dependencies';
  }

  /**
   * Extract text from Excel files (placeholder)
   */
  private async extractExcelText(buffer: Buffer): Promise<string> {
    // This is a placeholder implementation
    // In a real implementation, you would use a library like xlsx
    console.log('Excel text extraction not implemented - would use xlsx library');
    return 'Excel text extraction requires additional dependencies';
  }

  /**
   * Extract text from PowerPoint files (placeholder)
   */
  private async extractPowerpointText(buffer: Buffer): Promise<string> {
    // This is a placeholder implementation
    // In a real implementation, you would use a specialized library
    console.log('PowerPoint text extraction not implemented');
    return 'PowerPoint text extraction requires additional dependencies';
  }

  /**
   * Generate thumbnails for supported file types
   */
  private async generateThumbnails(
    buffer: Buffer,
    mimeType: string,
    sizes?: Array<{ width: number; height: number }>
  ): Promise<string[]> {
    const defaultSizes = sizes || [
      { width: 150, height: 150 },
      { width: 300, height: 300 },
    ];

    try {
      if (mimeType.startsWith('image/')) {
        return await this.generateImageThumbnails(buffer, defaultSizes);
      } else if (mimeType === 'application/pdf') {
        return await this.generatePdfThumbnails(buffer, defaultSizes);
      }
    } catch (error) {
      console.error('Error generating thumbnails:', error);
    }

    return [];
  }

  /**
   * Generate image thumbnails (placeholder)
   */
  private async generateImageThumbnails(
    buffer: Buffer,
    sizes: Array<{ width: number; height: number }>
  ): Promise<string[]> {
    // This is a placeholder implementation
    // In a real implementation, you would use a library like sharp
    console.log('Image thumbnail generation not implemented - would use sharp library');
    return [];
  }

  /**
   * Generate PDF thumbnails (placeholder)
   */
  private async generatePdfThumbnails(
    buffer: Buffer,
    sizes: Array<{ width: number; height: number }>
  ): Promise<string[]> {
    // This is a placeholder implementation
    // In a real implementation, you would use a library like pdf2pic
    console.log('PDF thumbnail generation not implemented - would use pdf2pic library');
    return [];
  }

  /**
   * Extract additional metadata based on file type
   */
  private async extractAdditionalMetadata(
    buffer: Buffer,
    mimeType: string,
    metadata: FileMetadata
  ): Promise<void> {
    try {
      if (mimeType.startsWith('image/')) {
        await this.extractImageMetadata(buffer, metadata);
      } else if (mimeType.startsWith('audio/')) {
        await this.extractAudioMetadata(buffer, metadata);
      } else if (mimeType.startsWith('video/')) {
        await this.extractVideoMetadata(buffer, metadata);
      } else if (mimeType === 'application/pdf') {
        await this.extractPdfMetadata(buffer, metadata);
      }
    } catch (error) {
      console.error('Error extracting additional metadata:', error);
    }
  }

  /**
   * Extract image metadata (placeholder)
   */
  private async extractImageMetadata(buffer: Buffer, metadata: FileMetadata): Promise<void> {
    // This is a placeholder implementation
    // In a real implementation, you would use a library like sharp or exif-reader
    console.log('Image metadata extraction not implemented - would use sharp library');
  }

  /**
   * Extract audio metadata (placeholder)
   */
  private async extractAudioMetadata(buffer: Buffer, metadata: FileMetadata): Promise<void> {
    // This is a placeholder implementation
    // In a real implementation, you would use a library like node-ffmpeg
    console.log('Audio metadata extraction not implemented - would use node-ffmpeg');
  }

  /**
   * Extract video metadata (placeholder)
   */
  private async extractVideoMetadata(buffer: Buffer, metadata: FileMetadata): Promise<void> {
    // This is a placeholder implementation
    // In a real implementation, you would use a library like node-ffmpeg
    console.log('Video metadata extraction not implemented - would use node-ffmpeg');
  }

  /**
   * Extract PDF metadata (placeholder)
   */
  private async extractPdfMetadata(buffer: Buffer, metadata: FileMetadata): Promise<void> {
    // This is a placeholder implementation
    // In a real implementation, you would use a library like pdf-parse
    console.log('PDF metadata extraction not implemented - would use pdf-parse');
  }

  /**
   * Generate summary of text content (placeholder)
   */
  private async generateSummary(text: string): Promise<string> {
    // This is a placeholder implementation
    // In a real implementation, you would use an AI service or local NLP library
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const firstFewSentences = sentences.slice(0, 3).join('. ');
    return firstFewSentences.length > 200 
      ? firstFewSentences.substring(0, 200) + '...'
      : firstFewSentences;
  }

  /**
   * Extract keywords from text (simple implementation)
   */
  private async extractKeywords(text: string): Promise<string[]> {
    // Simple keyword extraction - in production, use a proper NLP library
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    // Get top 10 most frequent words
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Detect entities in text (placeholder)
   */
  private async detectEntities(text: string): Promise<Array<{ text: string; type: string; confidence: number }>> {
    // This is a placeholder implementation
    // In a real implementation, you would use an NLP service or library
    const entities: Array<{ text: string; type: string; confidence: number }> = [];
    
    // Simple email detection
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailRegex) || [];
    emails.forEach(email => {
      entities.push({ text: email, type: 'EMAIL', confidence: 0.9 });
    });

    // Simple URL detection
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlRegex) || [];
    urls.forEach(url => {
      entities.push({ text: url, type: 'URL', confidence: 0.9 });
    });

    return entities;
  }

  /**
   * Detect MIME type from filename and buffer
   */
  private detectMimeType(filename: string, buffer: Buffer): string {
    const extension = filename.toLowerCase().split('.').pop();
    
    // Check magic bytes first
    const magicBytes = buffer.slice(0, 16);
    
    if (magicBytes[0] === 0xFF && magicBytes[1] === 0xD8) return 'image/jpeg';
    if (magicBytes[0] === 0x89 && magicBytes[1] === 0x50) return 'image/png';
    if (magicBytes[0] === 0x47 && magicBytes[1] === 0x49) return 'image/gif';
    if (magicBytes.slice(0, 4).toString() === '%PDF') return 'application/pdf';
    if (magicBytes.slice(0, 2).toString() === 'PK') {
      // ZIP-based formats
      if (extension === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      if (extension === 'xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      if (extension === 'pptx') return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    }

    // Fallback to extension-based detection
    const mimeTypes: Record<string, string> = {
      'txt': 'text/plain',
      'md': 'text/markdown',
      'html': 'text/html',
      'htm': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'xml': 'application/xml',
      'csv': 'text/csv',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
    };

    return extension ? mimeTypes[extension] || 'application/octet-stream' : 'application/octet-stream';
  }

  /**
   * Calculate file checksum
   */
  private async calculateChecksum(buffer: Buffer): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Check if file can generate thumbnails
   */
  private canGenerateThumbnails(mimeType: string): boolean {
    return mimeType.startsWith('image/') || mimeType === 'application/pdf';
  }

  /**
   * Check if filename suggests a text file
   */
  private isTextFile(filename: string): boolean {
    const textExtensions = [
      'txt', 'md', 'markdown', 'log', 'cfg', 'conf', 'ini', 'yaml', 'yml',
      'json', 'xml', 'csv', 'tsv', 'sql', 'py', 'js', 'ts', 'jsx', 'tsx',
      'html', 'htm', 'css', 'scss', 'sass', 'less', 'php', 'rb', 'go',
      'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'vb', 'pl', 'sh', 'bat'
    ];
    
    const extension = filename.toLowerCase().split('.').pop();
    return extension ? textExtensions.includes(extension) : false;
  }

  /**
   * Check if text looks valid (not binary)
   */
  private isValidText(text: string): boolean {
    // Check for excessive null bytes or control characters
    const nullBytes = (text.match(/\0/g) || []).length;
    const controlChars = (text.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g) || []).length;
    
    return nullBytes < text.length * 0.1 && controlChars < text.length * 0.1;
  }

  /**
   * Extract text from nested objects
   */
  private extractTextFromObject(obj: any, maxDepth: number = 3): string {
    if (maxDepth <= 0) return '';
    
    const texts: string[] = [];
    
    if (typeof obj === 'string') {
      texts.push(obj);
    } else if (typeof obj === 'number' || typeof obj === 'boolean') {
      texts.push(String(obj));
    } else if (Array.isArray(obj)) {
      obj.forEach(item => {
        const text = this.extractTextFromObject(item, maxDepth - 1);
        if (text) texts.push(text);
      });
    } else if (obj && typeof obj === 'object') {
      Object.values(obj).forEach(value => {
        const text = this.extractTextFromObject(value, maxDepth - 1);
        if (text) texts.push(text);
      });
    }
    
    return texts.join(' ');
  }
}

// Export singleton instance
export const fileProcessor = FileProcessor.getInstance();