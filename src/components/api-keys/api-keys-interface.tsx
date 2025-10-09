"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "ui/card";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { Textarea } from "ui/textarea";
import { Badge } from "ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import { ScrollArea } from "ui/scroll-area";
import { Separator } from "ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "ui/dialog";
import { Label } from "ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
import { Switch } from "ui/switch";
import { Alert, AlertDescription } from "ui/alert";
import { 
  Key, 
  Plus, 
  Eye, 
  EyeOff, 
  Edit, 
  Trash2, 
  TestTube, 
  BarChart3, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ExternalLink,
  Copy,
  Loader2,
  Calendar,
  Activity,
  Globe,
  Zap,
  Settings
} from "lucide-react";
import { ApiKey, ApiKeyWithValue } from "lib/api-keys/api-key-service";
import { useAnalytics } from "@/hooks/use-analytics";
import { cn } from "lib/utils";

interface SupportedService {
  id: string;
  name: string;
  description: string;
  website: string;
  keyFormat: string;
}

interface UsageStats {
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
}

interface TestResult {
  isValid: boolean;
  service: string;
  error?: string;
  metadata?: Record<string, any>;
}

export function ApiKeysInterface() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [services, setServices] = useState<SupportedService[]>([]);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [showKeyValue, setShowKeyValue] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});

  const { trackFeatureUsed } = useAnalytics();

  // New API key form state
  const [newApiKey, setNewApiKey] = useState({
    name: "",
    service: "",
    value: "",
    description: "",
    expiresAt: "",
  });

  // Load data on mount
  useEffect(() => {
    loadApiKeys();
    loadServices();
    loadStats();
  }, []);

  const loadApiKeys = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/api-keys');
      const data = await response.json();

      if (data.success) {
        setApiKeys(data.apiKeys);
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const response = await fetch('/api/api-keys/services');
      const data = await response.json();

      if (data.success) {
        setServices(data.services);
      }
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/api-keys/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const createApiKey = async () => {
    if (!newApiKey.name.trim() || !newApiKey.service || !newApiKey.value.trim()) {
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newApiKey,
          expiresAt: newApiKey.expiresAt || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setApiKeys(prev => [data.apiKey, ...prev]);
        setNewApiKey({
          name: "",
          service: "",
          value: "",
          description: "",
          expiresAt: "",
        });
        setShowCreateDialog(false);
        loadStats(); // Refresh stats
        
        trackFeatureUsed('api_key_created', {
          service: newApiKey.service,
        });
      } else {
        console.error('Failed to create API key:', data.error);
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteApiKey = async (id: string) => {
    try {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setApiKeys(prev => prev.filter(key => key.id !== id));
        loadStats(); // Refresh stats
        
        trackFeatureUsed('api_key_deleted');
      }
    } catch (error) {
      console.error('Failed to delete API key:', error);
    }
  };

  const toggleKeyActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      const data = await response.json();

      if (data.success) {
        setApiKeys(prev => prev.map(key => 
          key.id === id ? { ...key, isActive } : key
        ));
      }
    } catch (error) {
      console.error('Failed to toggle API key:', error);
    }
  };

  const testApiKey = async (id: string) => {
    setIsTesting(id);
    try {
      const response = await fetch('/api/api-keys/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyId: id }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResults(prev => ({
          ...prev,
          [id]: data.result,
        }));
        
        trackFeatureUsed('api_key_tested', {
          service: data.result.service,
          isValid: data.result.isValid,
        });
      }
    } catch (error) {
      console.error('Failed to test API key:', error);
    } finally {
      setIsTesting(null);
    }
  };

  const toggleKeyVisibility = async (id: string) => {
    if (showKeyValue[id]) {
      setShowKeyValue(prev => ({ ...prev, [id]: false }));
    } else {
      try {
        const response = await fetch(`/api/api-keys/${id}?includeValue=true`);
        const data = await response.json();

        if (data.success) {
          setShowKeyValue(prev => ({ ...prev, [id]: true }));
          // Store the key value temporarily for display
          // In a real implementation, you'd handle this more securely
        }
      } catch (error) {
        console.error('Failed to get API key value:', error);
      }
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getServiceIcon = (service: string) => {
    const icons: Record<string, React.ReactNode> = {
      'openai': <Zap className="h-4 w-4" />,
      'anthropic': <Shield className="h-4 w-4" />,
      'google': <Globe className="h-4 w-4" />,
      'aws': <Settings className="h-4 w-4" />,
      'groq': <Activity className="h-4 w-4" />,
      'xai': <Key className="h-4 w-4" />,
    };
    return icons[service] || <Key className="h-4 w-4" />;
  };

  const getStatusColor = (key: ApiKey) => {
    if (!key.isActive) return 'bg-gray-500';
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) return 'bg-red-500';
    return 'bg-green-500';
  };

  const getStatusText = (key: ApiKey) => {
    if (!key.isActive) return 'Inactive';
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) return 'Expired';
    return 'Active';
  };

  const selectedService = services.find(s => s.id === newApiKey.service);

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">
            Manage your API keys for various AI services and integrations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Usage Stats
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>API Key Usage Statistics</DialogTitle>
              </DialogHeader>
              {stats && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">{stats.totalKeys}</div>
                        <div className="text-sm text-muted-foreground">Total Keys</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">{stats.activeKeys}</div>
                        <div className="text-sm text-muted-foreground">Active Keys</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">{stats.totalUsage}</div>
                        <div className="text-sm text-muted-foreground">Total Usage</div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Service Usage</h4>
                      <div className="space-y-1">
                        {Object.entries(stats.serviceBreakdown).map(([service, count]) => (
                          <div key={service} className="flex justify-between text-sm">
                            <span className="capitalize">{service}</span>
                            <span>{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Key Performance</h4>
                      <div className="space-y-1">
                        {stats.keyStats.slice(0, 5).map((key) => (
                          <div key={key.id} className="flex justify-between text-sm">
                            <span className="truncate">{key.name}</span>
                            <span>{key.usageCount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add API Key
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New API Key</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newApiKey.name}
                      onChange={(e) => setNewApiKey(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="My OpenAI Key"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="service">Service</Label>
                    <Select
                      value={newApiKey.service}
                      onValueChange={(value) => setNewApiKey(prev => ({ ...prev, service: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service..." />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map(service => (
                          <SelectItem key={service.id} value={service.id}>
                            <div className="flex items-center space-x-2">
                              {getServiceIcon(service.id)}
                              <span>{service.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedService && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p><strong>Expected format:</strong> {selectedService.keyFormat}</p>
                        <p>{selectedService.description}</p>
                        {selectedService.website && (
                          <a 
                            href={selectedService.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800"
                          >
                            Get your API key <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="value">API Key</Label>
                  <Input
                    id="value"
                    type="password"
                    value={newApiKey.value}
                    onChange={(e) => setNewApiKey(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="Enter your API key..."
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={newApiKey.description}
                    onChange={(e) => setNewApiKey(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What will you use this key for?"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="expiresAt">Expiration Date (optional)</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={newApiKey.expiresAt}
                    onChange={(e) => setNewApiKey(prev => ({ ...prev, expiresAt: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createApiKey}
                    disabled={isCreating || !newApiKey.name.trim() || !newApiKey.service || !newApiKey.value.trim()}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Add API Key'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* API Keys List */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-lg">
            Your API Keys ({apiKeys.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Key className="h-12 w-12 mb-4" />
              <p>No API keys found</p>
              <p className="text-sm">Add your first API key to get started</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {apiKeys.map((apiKey) => (
                  <Card key={apiKey.id} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            {getServiceIcon(apiKey.service)}
                            <h3 className="font-medium truncate">{apiKey.name}</h3>
                            <div className="flex items-center space-x-2">
                              <div className={cn("w-2 h-2 rounded-full", getStatusColor(apiKey))} />
                              <Badge variant={apiKey.isActive ? "default" : "secondary"}>
                                {getStatusText(apiKey)}
                              </Badge>
                              <Badge variant="outline" className="capitalize">
                                {apiKey.service}
                              </Badge>
                            </div>
                          </div>
                          
                          {apiKey.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {apiKey.description}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Created {formatDate(apiKey.createdAt)}
                            </span>
                            <span className="flex items-center">
                              <Activity className="h-3 w-3 mr-1" />
                              {apiKey.usageCount} uses
                            </span>
                            {apiKey.lastUsedAt && (
                              <span>
                                Last used {formatDate(apiKey.lastUsedAt)}
                              </span>
                            )}
                            {apiKey.expiresAt && (
                              <span className={cn(
                                new Date(apiKey.expiresAt) < new Date() ? "text-red-600" : ""
                              )}>
                                Expires {formatDate(apiKey.expiresAt)}
                              </span>
                            )}
                          </div>

                          {/* API Key Value Display */}
                          {showKeyValue[apiKey.id] && (
                            <div className="mt-3 p-2 bg-muted rounded border">
                              <div className="flex items-center justify-between">
                                <code className="text-sm font-mono">
                                  sk-mock-api-key-value-for-{apiKey.service}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(`sk-mock-api-key-value-for-${apiKey.service}`)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Test Results */}
                          {testResults[apiKey.id] && (
                            <div className="mt-3">
                              <Alert className={cn(
                                testResults[apiKey.id].isValid 
                                  ? "border-green-200 bg-green-50" 
                                  : "border-red-200 bg-red-50"
                              )}>
                                {testResults[apiKey.id].isValid ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                                <AlertDescription>
                                  {testResults[apiKey.id].isValid ? (
                                    <div>
                                      <p className="font-medium text-green-800">API key is valid!</p>
                                      {testResults[apiKey.id].metadata && (
                                        <div className="mt-1 text-sm text-green-700">
                                          {JSON.stringify(testResults[apiKey.id].metadata, null, 2)}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-red-800">
                                      {testResults[apiKey.id].error || 'API key test failed'}
                                    </p>
                                  )}
                                </AlertDescription>
                              </Alert>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-1 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                          >
                            {showKeyValue[apiKey.id] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => testApiKey(apiKey.id)}
                            disabled={isTesting === apiKey.id}
                          >
                            {isTesting === apiKey.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <TestTube className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <Switch
                            checked={apiKey.isActive}
                            onCheckedChange={(checked) => toggleKeyActive(apiKey.id, checked)}
                          />
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteApiKey(apiKey.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}