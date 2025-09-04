import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { motion } from 'framer-motion';

interface DashboardData {
  sessionSummary: {
    duration: string;
    totalClicks: number;
    totalInputs: number;
    pagesVisited: number;
    scrollDepth: number;
  };
  userInfo: {
    label: string;
    browserEmoji: string;
    deviceType: string;
    isIncognito: boolean;
    timezone: string;
    language: string;
  };
  performance: {
    loadTime: number;
    domContentLoaded: number;
    batteryLevel?: number;
    connectionType?: string;
  };
  activity: Array<{
    type: string;
    timestamp: string;
    details: string;
  }>;
}

export const AnalyticsDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // This component is now disabled - analytics are only available in admin dashboard
    return () => {};
  }, []);

  // Component disabled - analytics only available in admin dashboard
  return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md"
    >
      <Card className="w-full max-w-4xl mx-4 bg-background/95 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Session Analytics Dashboard
            <Badge variant="outline">{dashboardData.userInfo.label}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Session Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Session Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="text-sm font-medium">{dashboardData.sessionSummary.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Clicks</span>
                  <span className="text-sm font-medium">{dashboardData.sessionSummary.totalClicks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Form Inputs</span>
                  <span className="text-sm font-medium">{dashboardData.sessionSummary.totalInputs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pages Visited</span>
                  <span className="text-sm font-medium">{dashboardData.sessionSummary.pagesVisited}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Max Scroll</span>
                  <span className="text-sm font-medium">{dashboardData.sessionSummary.scrollDepth}%</span>
                </div>
              </CardContent>
            </Card>

            {/* User Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">User Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Browser</span>
                  <span className="text-sm font-medium">{dashboardData.userInfo.browserEmoji}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Device</span>
                  <span className="text-sm font-medium">{dashboardData.userInfo.deviceType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Mode</span>
                  <Badge variant={dashboardData.userInfo.isIncognito ? "destructive" : "secondary"}>
                    {dashboardData.userInfo.isIncognito ? "Incognito" : "Normal"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Timezone</span>
                  <span className="text-sm font-medium">{dashboardData.userInfo.timezone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Language</span>
                  <span className="text-sm font-medium">{dashboardData.userInfo.language}</span>
                </div>
              </CardContent>
            </Card>

            {/* Performance */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Load Time</span>
                  <span className="text-sm font-medium">{dashboardData.performance.loadTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">DOM Ready</span>
                  <span className="text-sm font-medium">{dashboardData.performance.domContentLoaded}ms</span>
                </div>
                {dashboardData.performance.batteryLevel && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Battery</span>
                    <span className="text-sm font-medium">{Math.round(dashboardData.performance.batteryLevel * 100)}%</span>
                  </div>
                )}
                {dashboardData.performance.connectionType && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Connection</span>
                    <span className="text-sm font-medium">{dashboardData.performance.connectionType}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Separator className="my-6" />

          {/* Activity Timeline */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Recent Activity</h3>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {dashboardData.activity.slice(0, 10).map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground w-16">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {activity.type}
                    </Badge>
                    <span className="text-muted-foreground flex-1 truncate">
                      {activity.details}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};