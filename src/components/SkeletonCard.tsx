
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonCardProps {
  type?: 'file' | 'folder';
  showIcon?: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ 
  type = 'file', 
  showIcon = true 
}) => {
  return (
    <div className="glass border border-border rounded-lg p-3 sm:p-4 animate-pulse">
      <div className="flex items-start space-x-3">
        {showIcon && (
          <Skeleton className="w-8 h-8 rounded-md flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <div className="flex items-center space-x-2">
            {type === 'file' && (
              <>
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
              </>
            )}
            {type === 'folder' && (
              <Skeleton className="h-3 w-24" />
            )}
          </div>
          <Skeleton className="h-3 w-1/2" />
        </div>
        {type === 'folder' && (
          <Skeleton className="w-4 h-4 rounded" />
        )}
      </div>
    </div>
  );
};

export const SkeletonGrid: React.FC<{ count?: number; type?: 'file' | 'folder' }> = ({ 
  count = 8, 
  type = 'file' 
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} type={type} />
      ))}
    </div>
  );
};
