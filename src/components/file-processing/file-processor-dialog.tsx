"use client";

import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "ui/dialog";
import { Button } from "ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "ui/card";
import { Badge } from "ui/badge";
import { Checkbox } from "ui/checkbox";
import { Label } from "ui/label";
import { Input } from "ui/input";
import { Textarea } from "ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import { ScrollArea } from "ui/scroll-area";
import { Separator } from "ui/separator";
import { Progress } from "ui/progress";
import { 
  Upload, 
  FileText, 
  Image, 
  Hash, 
  Brain, 
  Eye,
  Download,
  Copy,
  Check,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { ProcessedFileContent, FileProcessingOptions } from "lib/file-processing/file-processor";
import { useAnalytics } from "@/hooks/use-analytics";
import { cn } from "lib/utils";

interface FileProcessorDialogProps {
  trigger?: React.ReactNode;
  onFileProcessed?: (result: ProcessedFileContent) => void;
}

export function FileProcessorDialog({ trigger, onFileProcessed }: FileProcessorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processedResult, setProcessedResult] = useState<ProcessedFileContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  const [options, setOptions] = useState<FileProcessingOptions>({
    extractText: true,
    generateThumbnails: false,
    generateSummary: false,
    extractKeywords: false,
    detectEntities: false,
    maxTextLength: 10000,
  });

  const { trackFeatureUsed } = useAnalytics();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setProcessedResult(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    accept: {
      'text/*': ['.txt', '.md', '.html', '.css', '.js', '.json', '.xml', '.csv'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.svg'],
      'audio/*': ['.mp3', '.wav', '.ogg'],
      'video/*': ['.mp4', '.avi', '.mov'],
    },
  });

  const processFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('options', JSON.stringify(options));

      const response = await fetch('/api/files/process', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Processing failed');
      }

      const data = await response.json();
      setProcessedResult(data.result);
      onFileProcessed?.(data.result);

      // Track usage
      trackFeatureUsed('file_processing', {
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        options: options,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProcessingProgress(0), 1000);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(type);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const resetDialog = () => {
    setSelectedFile(null);
    setProcessedResult(null);
    setError(null);
    setProcessingProgress(0);
    setCopiedText(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetDialog();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Process File
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Advanced File Processing</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[70vh]">
          {/* Left Panel - Upload and Options */}
          <div className="space-y-4">
            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Upload File</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                    isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                    selectedFile && "border-green-500 bg-green-50 dark:bg-green-950"
                  )}
                >
                  <input {...getInputProps()} />
                  {selectedFile ? (
                    <div className="space-y-2">
                      <FileText className="h-8 w-8 mx-auto text-green-600" />
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </p>
                      <Badge variant="secondary">{selectedFile.type}</Badge>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p>Drop a file here or click to browse</p>
                      <p className="text-sm text-muted-foreground">
                        Max 50MB • Text, PDF, Office docs, Images, Audio, Video
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Processing Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Processing Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="extractText"
                      checked={options.extractText}
                      onCheckedChange={(checked) =>
                        setOptions(prev => ({ ...prev, extractText: !!checked }))
                      }
                    />
                    <Label htmlFor="extractText" className="text-sm">Extract text content</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="generateThumbnails"
                      checked={options.generateThumbnails}
                      onCheckedChange={(checked) =>
                        setOptions(prev => ({ ...prev, generateThumbnails: !!checked }))
                      }
                    />
                    <Label htmlFor="generateThumbnails" className="text-sm">Generate thumbnails</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="generateSummary"
                      checked={options.generateSummary}
                      onCheckedChange={(checked) =>
                        setOptions(prev => ({ ...prev, generateSummary: !!checked }))
                      }
                    />
                    <Label htmlFor="generateSummary" className="text-sm">Generate summary</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="extractKeywords"
                      checked={options.extractKeywords}
                      onCheckedChange={(checked) =>
                        setOptions(prev => ({ ...prev, extractKeywords: !!checked }))
                      }
                    />
                    <Label htmlFor="extractKeywords" className="text-sm">Extract keywords</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="detectEntities"
                      checked={options.detectEntities}
                      onCheckedChange={(checked) =>
                        setOptions(prev => ({ ...prev, detectEntities: !!checked }))
                      }
                    />
                    <Label htmlFor="detectEntities" className="text-sm">Detect entities</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTextLength" className="text-sm">Max text length</Label>
                  <Input
                    id="maxTextLength"
                    type="number"
                    min={100}
                    max={50000}
                    value={options.maxTextLength}
                    onChange={(e) =>
                      setOptions(prev => ({ ...prev, maxTextLength: parseInt(e.target.value) || 10000 }))
                    }
                  />
                </div>

                <Button
                  onClick={processFile}
                  disabled={!selectedFile || isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Process File
                    </>
                  )}
                </Button>

                {isProcessing && (
                  <div className="space-y-2">
                    <Progress value={processingProgress} />
                    <p className="text-xs text-center text-muted-foreground">
                      {processingProgress}% complete
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Results */}
          <div className="space-y-4">
            {error && (
              <Card className="border-destructive">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-sm">{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {processedResult && (
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-sm">Processing Results</CardTitle>
                </CardHeader>
                <CardContent className="h-full overflow-hidden">
                  <Tabs defaultValue="metadata" className="h-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="metadata">Metadata</TabsTrigger>
                      <TabsTrigger value="text">Text</TabsTrigger>
                      <TabsTrigger value="insights">Insights</TabsTrigger>
                      <TabsTrigger value="thumbnails">Media</TabsTrigger>
                    </TabsList>

                    <TabsContent value="metadata" className="mt-4">
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Filename</Label>
                            <p className="text-sm font-medium">{processedResult.metadata.filename}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Size</Label>
                            <p className="text-sm">{formatFileSize(processedResult.metadata.size)}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">MIME Type</Label>
                            <Badge variant="secondary">{processedResult.metadata.mimeType}</Badge>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Uploaded</Label>
                            <p className="text-sm">{processedResult.metadata.uploadedAt.toLocaleString()}</p>
                          </div>
                          {processedResult.metadata.checksum && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Checksum</Label>
                              <p className="text-xs font-mono break-all">{processedResult.metadata.checksum}</p>
                            </div>
                          )}
                          {processedResult.metadata.dimensions && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Dimensions</Label>
                              <p className="text-sm">
                                {processedResult.metadata.dimensions.width} × {processedResult.metadata.dimensions.height}
                              </p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="text" className="mt-4">
                      <ScrollArea className="h-[400px]">
                        {processedResult.text ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs text-muted-foreground">
                                Extracted Text ({processedResult.text.length} characters)
                              </Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(processedResult.text!, 'text')}
                              >
                                {copiedText === 'text' ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                            <Textarea
                              value={processedResult.text}
                              readOnly
                              className="min-h-[300px] text-xs"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                            <p>No text content extracted</p>
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="insights" className="mt-4">
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-4">
                          {processedResult.summary && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <Label className="text-xs text-muted-foreground">Summary</Label>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(processedResult.summary!, 'summary')}
                                >
                                  {copiedText === 'summary' ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                              <p className="text-sm bg-muted p-3 rounded">{processedResult.summary}</p>
                            </div>
                          )}

                          {processedResult.keywords && processedResult.keywords.length > 0 && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Keywords</Label>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {processedResult.keywords.map((keyword, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {processedResult.entities && processedResult.entities.length > 0 && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Detected Entities</Label>
                              <div className="space-y-2 mt-2">
                                {processedResult.entities.map((entity, index) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                    <div>
                                      <p className="text-sm font-medium">{entity.text}</p>
                                      <p className="text-xs text-muted-foreground">{entity.type}</p>
                                    </div>
                                    <Badge variant="secondary">
                                      {Math.round(entity.confidence * 100)}%
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {!processedResult.summary && !processedResult.keywords?.length && !processedResult.entities?.length && (
                            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                              <p>No insights generated</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="thumbnails" className="mt-4">
                      <ScrollArea className="h-[400px]">
                        {processedResult.thumbnails && processedResult.thumbnails.length > 0 ? (
                          <div className="grid grid-cols-2 gap-4">
                            {processedResult.thumbnails.map((thumbnail, index) => (
                              <div key={index} className="space-y-2">
                                <img
                                  src={`data:image/png;base64,${thumbnail}`}
                                  alt={`Thumbnail ${index + 1}`}
                                  className="w-full rounded border"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = `data:image/png;base64,${thumbnail}`;
                                    link.download = `thumbnail-${index + 1}.png`;
                                    link.click();
                                  }}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                            <p>No thumbnails generated</p>
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}