"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
import { Badge } from "ui/badge";
import { Skeleton } from "ui/skeleton";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  MessageSquare, 
  Hash, 
  Users, 
  TrendingUp, 
  Clock, 
  Zap,
  Brain,
  Search
} from "lucide-react";
import { UserStats, UsageStats } from "lib/analytics/analytics-service";

interface AnalyticsDashboardProps {
  userId?: string;
  showGlobalStats?: boolean;
}

interface ActivityData {
  date: string;
  chats: number;
  messages: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function AnalyticsDashboard({ userId, showGlobalStats = false }: AnalyticsDashboardProps) {
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month" | "all">("week");
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [globalStats, setGlobalStats] = useState<UsageStats | null>(null);
  const [activity, setActivity] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeframe, userId, showGlobalStats]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [statsResponse, activityResponse] = await Promise.all([
        fetch(`/api/analytics/stats?timeframe=${timeframe}&type=${showGlobalStats ? 'global' : 'user'}`),
        fetch(`/api/analytics/activity?timeframe=${timeframe}&global=${showGlobalStats}`)
      ]);

      if (!statsResponse.ok || !activityResponse.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const statsData = await statsResponse.json();
      const activityData = await activityResponse.json();

      if (showGlobalStats) {
        setGlobalStats(statsData.stats);
      } else {
        setUserStats(statsData.stats);
      }
      
      setActivity(activityData.activity);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const stats = showGlobalStats ? globalStats : userStats;

  if (isLoading) {
    return <AnalyticsSkeletonLoader />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-destructive">Error loading analytics: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {showGlobalStats ? 'Global Analytics' : 'Your Analytics'}
          </h2>
          <p className="text-muted-foreground">
            {showGlobalStats ? 'System-wide usage statistics' : 'Your personal usage statistics'}
          </p>
        </div>
        
        <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Chats"
          value={stats?.totalChats || 0}
          icon={<Hash className="h-4 w-4" />}
          trend="+12%"
        />
        <MetricCard
          title="Total Messages"
          value={stats?.totalMessages || 0}
          icon={<MessageSquare className="h-4 w-4" />}
          trend="+8%"
        />
        <MetricCard
          title="Avg Messages/Chat"
          value={Math.round(stats?.averageMessagesPerChat || 0)}
          icon={<TrendingUp className="h-4 w-4" />}
          trend="+5%"
        />
        {showGlobalStats && (
          <MetricCard
            title="Active Users"
            value={globalStats?.dailyActiveUsers || 0}
            icon={<Users className="h-4 w-4" />}
            trend="+15%"
          />
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Chat Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={activity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => formatDate(value as string)}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="chats" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Chats"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="messages" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="Messages"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showGlobalStats && userStats && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Member since</span>
                      <span className="text-sm font-medium">
                        {userStats.joinedAt.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Last active</span>
                      <span className="text-sm font-medium">
                        {userStats.lastActiveAt.toLocaleDateString()}
                      </span>
                    </div>
                  </>
                )}
                
                {showGlobalStats && globalStats && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Daily Active Users</span>
                      <Badge variant="secondary">{globalStats.dailyActiveUsers}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Weekly Active Users</span>
                      <Badge variant="secondary">{globalStats.weeklyActiveUsers}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Monthly Active Users</span>
                      <Badge variant="secondary">{globalStats.monthlyActiveUsers}</Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Model Usage Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Model Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats?.mostUsedModels || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Model Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Model Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats?.mostUsedModels || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ model, percent }) => `${model} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {(stats?.mostUsedModels || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tool Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.mostUsedTools || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tool" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={activity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => formatDate(value as string)}
                  />
                  <Bar dataKey="chats" fill="#8884d8" name="Chats" />
                  <Bar dataKey="messages" fill="#82ca9d" name="Messages" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  icon, 
  trend 
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  trend?: string; 
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            {trend && (
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                {trend}
              </p>
            )}
          </div>
          <div className="text-muted-foreground">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsSkeletonLoader() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}