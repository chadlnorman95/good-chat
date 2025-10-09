"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "ui/card";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { Textarea } from "ui/textarea";
import { Badge } from "ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import { ScrollArea } from "ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "ui/dialog";
import { Alert, AlertDescription } from "ui/alert";
import { 
  Zap, 
  Plus, 
  Search, 
  Globe, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ExternalLink,
  Copy,
  Loader2,
  Star,
  Filter,
  Download,
  Upload,
  Sparkles,
  Link as LinkIcon,
  Settings,
  Info
} from "lucide-react";
import { MCPConnectionTemplate, MCPConnectionDiscovery } from "lib/mcp-connections/mcp-connection-service";
import { MCPServerConfig } from "types/mcp";
import { cn } from "lib/utils";

interface MCPQuickConnectProps {
  onConnect: (config: MCPServerConfig, name: string) => Promise<void>;
  isConnecting?: boolean;
}

interface TestResult {
  success: boolean;
  error?: string;
  latency?: number;
  serverInfo?: any;
}

export function MCPQuickConnect({ onConnect, isConnecting = false }: MCPQuickConnectProps) {
  const [templates, setTemplates] = useState<MCPConnectionTemplate[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; icon: string; count: number }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [discoveredInfo, setDiscoveredInfo] = useState<MCPConnectionDiscovery | null>(null);

  // Quick connect form state
  const [quickConnectUrl, setQuickConnectUrl] = useState('');
  const [quickConnectName, setQuickConnectName] = useState('');
  const [quickConnectHeaders, setQuickConnectHeaders] = useState('');
  const [quickConnectToken, setQuickConnectToken] = useState('');

  // Template customization state
  const [selectedTemplate, setSelectedTemplate] = useState<MCPConnectionTemplate | null>(null);
  const [customizationData, setCustomizationData] = useState<Record<string, any>>({});

  useEffect(() => {
    loadTemplates();
  }, [selectedCategory, searchQuery]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (searchQuery) params.set('search', searchQuery);

      const response = await fetch(`/api/mcp-connections/templates?${params}`);
      const data = await response.json();

      if (data.success) {
        setTemplates(data.templates);
        if (data.categories) {
          setCategories([{ id: 'all', name: 'All', icon: '📦', count: data.templates.length }, ...data.categories]);
        }
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickConnect = async () => {
    if (!quickConnectUrl.trim()) return;

    setIsTesting(true);
    setTestResult(null);
    setDiscoveredInfo(null);

    try {
      const headers = quickConnectHeaders ? JSON.parse(quickConnectHeaders) : {};
      
      const response = await fetch('/api/mcp-connections/quick-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: quickConnectUrl,
          name: quickConnectName,
          headers,
          authToken: quickConnectToken,
          testConnection: true,
        }),
      });

      const data = await response.json();

      if (data.success && data.config) {
        setTestResult({ success: true });
        setDiscoveredInfo(data.discoveredInfo);
        
        // Auto-connect if successful
        const serverName = quickConnectName || data.discoveredInfo?.name || 'Quick Connect Server';
        await onConnect(data.config, serverName);
      } else {
        setTestResult({ success: false, error: data.error });
      }
    } catch (error) {
      console.error('Quick connect failed:', error);
      setTestResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTemplateConnect = async (template: MCPConnectionTemplate) => {
    setSelectedTemplate(template);
    setCustomizationData({});
  };

  const handleCustomizedConnect = async () => {
    if (!selectedTemplate) return;

    try {
      // Generate config from template with customizations
      const config = {
        ...selectedTemplate.config,
        ...customizationData,
      };

      const serverName = customizationData.name || selectedTemplate.name;
      await onConnect(config, serverName);
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Template connect failed:', error);
    }
  };

  const testConnection = async (config: MCPServerConfig) => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/mcp-connections/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });

      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      console.error('Connection test failed:', error);
      setTestResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Test failed' 
      });
    } finally {
      setIsTesting(false);
    }
  };

  const discoverServer = async (url: string) => {
    try {
      const response = await fetch('/api/mcp-connections/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      if (data.success && data.discoveredInfo) {
        setDiscoveredInfo(data.discoveredInfo);
        if (data.discoveredInfo.name && !quickConnectName) {
          setQuickConnectName(data.discoveredInfo.name);
        }
      }
    } catch (error) {
      console.error('Server discovery failed:', error);
    }
  };

  const filteredTemplates = templates.filter(template => {
    if (selectedCategory !== 'all' && template.category !== selectedCategory) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3 premium-gradient">
            <div className="p-2 rounded-xl bg-primary/10 premium-glow">
              <Zap className="h-7 w-7 text-primary" />
            </div>
            Quick Connect to MCP
          </h2>
          <p className="text-muted-foreground text-lg mt-2">
            Easily connect to MCP servers via URL or choose from popular templates
          </p>
        </div>
      </div>

      <Tabs defaultValue="quick-connect" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quick-connect" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Quick Connect
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import
          </TabsTrigger>
        </TabsList>

        {/* Quick Connect Tab */}
        <TabsContent value="quick-connect" className="space-y-4">
          <Card className="premium-interactive surface-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                Connect via URL
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="url">MCP Server URL *</Label>
                  <Input
                    id="url"
                    value={quickConnectUrl}
                    onChange={(e) => {
                      setQuickConnectUrl(e.target.value);
                      if (e.target.value) {
                        discoverServer(e.target.value);
                      }
                    }}
                    placeholder="https://your-mcp-server.com/sse"
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Server Name</Label>
                  <Input
                    id="name"
                    value={quickConnectName}
                    onChange={(e) => setQuickConnectName(e.target.value)}
                    placeholder="My MCP Server"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="headers">Headers (JSON)</Label>
                  <Textarea
                    id="headers"
                    value={quickConnectHeaders}
                    onChange={(e) => setQuickConnectHeaders(e.target.value)}
                    placeholder='{"Authorization": "Bearer token"}'
                    rows={3}
                    className="font-mono text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="token">Auth Token (optional)</Label>
                  <Input
                    id="token"
                    type="password"
                    value={quickConnectToken}
                    onChange={(e) => setQuickConnectToken(e.target.value)}
                    placeholder="Bearer token or API key"
                  />
                </div>
              </div>

              {/* Discovered Info */}
              {discoveredInfo && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p><strong>Discovered:</strong> {discoveredInfo.name}</p>
                      <p>{discoveredInfo.description}</p>
                      {discoveredInfo.tools && (
                        <p><strong>Tools:</strong> {discoveredInfo.tools.join(', ')}</p>
                      )}
                      {discoveredInfo.authRequired && (
                        <p className="text-amber-600">⚠️ Authentication required</p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Test Result */}
              {testResult && (
                <Alert className={cn(
                  testResult.success 
                    ? "border-green-200 bg-green-50" 
                    : "border-red-200 bg-red-50"
                )}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription>
                    {testResult.success ? (
                      <div>
                        <p className="font-medium text-green-800">Connection successful!</p>
                        {testResult.latency && (
                          <p className="text-sm text-green-700">Latency: {testResult.latency}ms</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-red-800">{testResult.error}</p>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => testConnection({ url: quickConnectUrl, headers: quickConnectHeaders ? JSON.parse(quickConnectHeaders) : {} })}
                  disabled={!quickConnectUrl || isTesting}
                  className="premium-interactive"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleQuickConnect}
                  disabled={!quickConnectUrl || isConnecting}
                  className="premium-interactive premium-shadow"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Connect
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Label>Category:</Label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1 border rounded-md"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name} ({category.count})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ScrollArea className="h-[600px]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                filteredTemplates.map((template) => (
                  <Card key={template.id} className="premium-interactive premium-float" style={{ animationDelay: `${Math.random() * 0.5}s` }}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{template.icon}</span>
                          <div>
                            <h3 className="font-medium">{template.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                          </div>
                        </div>
                        {template.isPopular && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {template.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <Badge className={getDifficultyColor(template.difficulty)}>
                          {template.difficulty}
                        </Badge>
                        <div className="flex space-x-1">
                          {template.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        {template.website && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(template.website, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Docs
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleTemplateConnect(template)}
                          className="premium-interactive premium-shimmer"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Upload className="h-12 w-12 mx-auto mb-4" />
                <p>Import functionality coming soon!</p>
                <p className="text-sm">Support for JSON, YAML, and URL imports</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Customization Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedTemplate?.icon}</span>
              Configure {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                {selectedTemplate.description}
              </p>

              {selectedTemplate.setupInstructions && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Setup Instructions:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {selectedTemplate.setupInstructions.map((instruction, i) => (
                          <li key={i}>{instruction}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Server Name</Label>
                  <Input
                    value={customizationData.name || selectedTemplate.name}
                    onChange={(e) => setCustomizationData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                {'url' in selectedTemplate.config && (
                  <div>
                    <Label>Server URL</Label>
                    <Input
                      value={customizationData.url || selectedTemplate.config.url}
                      onChange={(e) => setCustomizationData(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://your-server.com/sse"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTemplate(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCustomizedConnect}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Connect
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}