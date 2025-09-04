import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';

interface FileTreeProps {
  data: any;
  onNavigateToFolder?: (folderId: string, folderName: string) => void;
}

const formatSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  const kb = size / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
};

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

export const FileTree: React.FC<FileTreeProps> = ({ data, onNavigateToFolder }) => {
  const navigate = useNavigate();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleFileClick = (file: any) => {
    if (file.driveLink) {
      window.open(file.driveLink, '_blank');
    }
  };

  const handleFolderClick = (folder: any) => {
    if (onNavigateToFolder) {
      navigate(`/?folder=${folder.id}&target=${folder.id}`);
      onNavigateToFolder(folder.id, folder.name);
    } else if (folder.driveLink) {
      window.open(folder.driveLink, '_blank');
    }
  };

  const renderFileTree = (items: any[], depth: number = 0) => {
    if (!items || items.length === 0) return null;

    return (
      <div className={`space-y-1 ${depth > 0 ? 'ml-6' : ''}`}>
        {items.map((item, idx) => {
          if (item.type === 'folder') {
            const isExpanded = expandedFolders.has(item.id);
            const hasChildren = item.children && item.children.length > 0;
            
            return (
              <div key={item.id || idx} className="space-y-1">
                <div 
                  className="flex items-center space-x-2 p-2 rounded border border-border/50 hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => {
                    toggleFolder(item.id);
                    handleFolderClick(item);
                  }}
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {hasChildren ? (
                      isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )
                    ) : (
                      <div className="w-4 h-4 flex-shrink-0" />
                    )}
                    <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    {item.fileCount > 0 && <span>{item.fileCount} files</span>}
                    {item.folderCount > 0 && <span>{item.folderCount} folders</span>}
                    {item.totalSizeMB > 0 && <span>{item.totalSizeMB.toFixed(2)} MB</span>}
                  </div>
                </div>
                {item.description && (
                  <div className="text-xs text-muted-foreground ml-8 mb-2">
                    {item.description}
                  </div>
                )}
                {isExpanded && hasChildren && (
                  <Collapsible open={true}>
                    <CollapsibleContent>
                      {renderFileTree(item.children, depth + 1)}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            );
          } else if (item.type === 'file') {
            return (
              <div 
                key={item.id || idx}
                className="flex items-center space-x-2 p-2 rounded border border-border/50 hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => handleFileClick(item)}
                title={`Open ${item.name}`}
              >
                <div className="w-4 h-4 flex-shrink-0" />
                <FileText className="w-4 h-4 text-green-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm truncate">{item.name}</span>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground ml-2">
                      {item.size && <span>{formatSize(item.size.bytes)}</span>}
                      {item.category && <Badge variant="outline" className="text-xs">{item.category}</Badge>}
                    </div>
                  </div>
                  {(item.modifiedTime || item.createdTime) && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.modifiedTime ? `Modified: ${formatDate(item.modifiedTime)}` : `Created: ${formatDate(item.createdTime)}`}
                    </div>
                  )}
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>Drive Contents</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data && data.children && data.children.length > 0 ? (
          <ScrollArea className="h-[600px] w-full">
            {renderFileTree(data.children)}
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No files or folders found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};