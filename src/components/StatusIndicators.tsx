import React from 'react';
import { WifiIndicator } from './WifiIndicator';
import { useGitHubCommit } from '../hooks/useGitHubCommit';

export const StatusIndicators: React.FC = () => {
  const { commit, loading: commitLoading } = useGitHubCommit();

  return (
    <div className="flex items-center gap-3 mt-2">
      <WifiIndicator />
      {!commitLoading && commit && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-xs">v</span>
          <span className="font-mono">{commit.shortSha}</span>
        </div>
      )}
    </div>
  );
};