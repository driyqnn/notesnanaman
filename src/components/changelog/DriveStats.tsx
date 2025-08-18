import React from 'react';
import { Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DriveStatsProps {
  version: string;
  stats: {
    totalFiles: number;
    totalFolders: number;
    totalSizeMB: number;
    lastUpdated?: string;
  };
}

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

export const DriveStats: React.FC<DriveStatsProps> = ({ version, stats }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Package className="w-5 h-5" />
          <span>Drive Statistics - Version {version}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-lg bg-primary/10">
            <div className="text-2xl font-bold text-primary">{stats.totalFiles.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Files</div>
          </div>
          <div className="p-4 rounded-lg bg-blue-500/10">
            <div className="text-2xl font-bold text-blue-500">{stats.totalFolders.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Folders</div>
          </div>
          <div className="p-4 rounded-lg bg-green-500/10">
            <div className="text-2xl font-bold text-green-500">{stats.totalSizeMB.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Total Size (MB)</div>
          </div>
          <div className="p-4 rounded-lg bg-orange-500/10">
            <div className="text-2xl font-bold text-orange-500">
              {stats.lastUpdated ? formatDate(stats.lastUpdated) : 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground">Last Updated</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};