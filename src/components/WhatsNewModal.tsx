import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Minus, 
  Edit3, 
  FileText,
  TrendingUp,
  Package,
  Clock,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ScanHistory, ChangeItem, FolderItem } from '../types/drive';
import { useGitHubCommit } from '../hooks/useGitHubCommit';

interface VersionHistoryEntry {
  current_version?: string;
  n_version?: string;
  version?: string;
  scan_date: string;
  scanner_version: string;
  changes: {
    added_files: ChangeItem[];
    deleted_files: ChangeItem[];
    modified_files: ChangeItem[];
    total_changes: number;
    summary: string;
  };
  stats?: {
    totalFiles: number;
    totalFolders: number;
    totalSizeMB: number;
  };
}

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  scanHistory: ScanHistory | null;
  versionHistory?: VersionHistoryEntry[];
  rootFolder?: FolderItem | null;
  onNavigateToFolder?: (folderId: string, folderName: string, highlightFileId?: string) => void;
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

const ChangeIcon: React.FC<{ type: 'added' | 'deleted' | 'modified' }> = ({ type }) => {
  switch (type) {
    case 'added':
      return <Plus className="w-4 h-4 text-green-400" />;
    case 'deleted':
      return <Minus className="w-4 h-4 text-red-400" />;
    case 'modified':
      return <Edit3 className="w-4 h-4 text-blue-400" />;
  }
};

const handleFileClick = (item: ChangeItem) => {
  // Generate Google Drive link if available
  if (item.id) {
    const driveLink = `https://drive.google.com/file/d/${item.id}/view`;
    window.open(driveLink, '_blank');
  }
};

// Find breadcrumb (folders) for a file by ID within the drive tree
const findFileBreadcrumbs = (root: FolderItem | null | undefined, fileId: string): FolderItem[] | null => {
  if (!root) return null;

  // If file is directly under root
  const directAtRoot = (root.children || []).some((c: any) => c.type === 'file' && c.id === fileId);
  if (directAtRoot) return [root];

  const dfs = (node: FolderItem, path: FolderItem[]): FolderItem[] | null => {
    // Check if file exists directly under this folder
    const hasFile = (node.children || []).some((child: any) => child.type === 'file' && child.id === fileId);
    if (hasFile) return [...path, node];

    for (const child of node.children || []) {
      if ((child as any).type === 'folder') {
        const res = dfs(child as FolderItem, [...path, node]);
        if (res) return res;
      }
    }
    return null;
  };

  for (const child of root.children || []) {
    if ((child as any).type === 'folder') {
      const res = dfs(child as FolderItem, [root]);
      if (res) return res;
    }
  }
  return null;
};



const ChangeList: React.FC<{ 
  title: string; 
  items: ChangeItem[]; 
  type: 'added' | 'deleted' | 'modified';
  emptyMessage: string;
  rootFolder?: FolderItem | null;
  onNavigateToFolder?: (folderId: string, folderName: string, highlightFileId?: string) => void;
  onClose?: () => void;
}> = ({ title, items, type, emptyMessage, rootFolder, onNavigateToFolder, onClose }) => {
  if (items.length === 0) {
    return null; // Don't render empty sections
  }

  return (
    <Card className="glass border-border">
      <div className="p-3">
        <div className="flex items-center space-x-2 mb-3">
          <ChangeIcon type={type} />
          <span className="font-medium text-sm">{title}</span>
          <Badge variant="secondary" className="ml-auto text-xs">{items.length}</Badge>
        </div>
        <div className="max-h-28 overflow-y-auto scrollbar-thin">
          <div className="space-y-1.5">
            {items.map((item, index) => {
              const crumbs = item.id ? findFileBreadcrumbs(rootFolder, item.id) : null;
              const path = crumbs ? crumbs.map((f) => f.name).join(' / ') : '';

              const handleRowClick = () => {
                if (type === 'deleted') return;
                if (crumbs && crumbs.length) {
                  const last = crumbs[crumbs.length - 1];
                  // Update URL with target parameter for deep linking
                  const currentUrl = new URL(window.location.href);
                  currentUrl.searchParams.set('folder', last.id);
                  currentUrl.searchParams.set('target', item.id);
                  window.history.pushState({}, '', currentUrl.toString());
                  
                  onNavigateToFolder?.(last.id, last.name, item.id);
                  onClose?.();
                } else {
                  // Fallback to open in Google Drive when we don't know the folder path
                  handleFileClick(item);
                }
              };

              return (
                <div 
                  key={`${item.id}-${index}`}
                  className={`flex items-center justify-between p-1.5 rounded-md bg-muted/50 transition-colors ${
                    type !== 'deleted' ? 'hover:bg-muted cursor-pointer' : ''
                  }`}
                  onClick={handleRowClick}
                  title={
                    type !== 'deleted'
                      ? 'Click to open file'
                      : undefined
                  }
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs break-words leading-tight">
                        {item.name}
                      </span>
                    </div>
                  </div>
                  {item.size !== undefined && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatSize(item.size)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({
  isOpen,
  onClose,
  scanHistory,
  versionHistory = [],
  rootFolder,
  onNavigateToFolder,
}) => {
  const navigate = useNavigate();
  const { commit } = useGitHubCommit();

  // ALL HOOKS MUST BE AT THE TOP - Memoize derived data to avoid heavy work on open
  const { versionEntry, sameVersionEntries, mergedChanges, changes, hasChanges, stats } = React.useMemo(() => {
    if (!scanHistory) {
      return {
        versionEntry: null,
        sameVersionEntries: [],
        mergedChanges: null,
        changes: null,
        hasChanges: false,
        stats: { totalFiles: 0, totalFolders: 0, totalSizeMB: 0 }
      };
    }

    // Find the version entry that matches the scan history version
    const versionEntryLocal = versionHistory.find(entry => entry.version === scanHistory.version);

    // Accumulate all changes from the same version across multiple scans
    const currentVersionNumber = scanHistory.version;
    const sameVersionEntriesLocal = versionHistory.filter(entry => entry.version === currentVersionNumber);

    // Merge all changes from the same version
    const mergedChangesLocal = sameVersionEntriesLocal.reduce((acc, entry) => {
      if (entry.changes) {
        acc.added_files = [...acc.added_files, ...entry.changes.added_files];
        acc.deleted_files = [...acc.deleted_files, ...entry.changes.deleted_files];
        acc.modified_files = [...acc.modified_files, ...entry.changes.modified_files];
        acc.total_changes += entry.changes.total_changes;
      }
      return acc;
    }, {
      added_files: [] as ChangeItem[],
      deleted_files: [] as ChangeItem[],
      modified_files: [] as ChangeItem[],
      total_changes: 0,
      summary: `${sameVersionEntriesLocal.length} scans in version ${currentVersionNumber}`
    });

    // Use merged changes if available, fallback to scan history changes
    const changesLocal = (mergedChangesLocal.total_changes > 0 ? mergedChangesLocal : scanHistory.changes) as any;
    const hasChangesLocal = changesLocal.total_changes > 0;
    const statsLocal = versionEntryLocal?.stats || {
      totalFiles: scanHistory.total_files,
      totalFolders: scanHistory.total_folders,
      totalSizeMB: 0
    };

    return { versionEntry: versionEntryLocal, sameVersionEntries: sameVersionEntriesLocal, mergedChanges: mergedChangesLocal, changes: changesLocal, hasChanges: hasChangesLocal, stats: statsLocal };
  }, [versionHistory, scanHistory]);

  // Defer heavy content until next frame for instant modal open
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    if (isOpen) {
      setReady(false);
      const raf = requestAnimationFrame(() => setReady(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setReady(false);
    }
  }, [isOpen]);

  // CONDITIONAL RENDER AFTER ALL HOOKS
  if (!scanHistory) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl glass border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>What's New</span>
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No scan history available</h3>
            <p className="text-sm text-muted-foreground">
              Scan history data is not available at the moment.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] flex flex-col glass border-border" hideCloseButton>
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>What's New</span>
              <Badge variant="outline" className="ml-2">
                {scanHistory.version.startsWith('v') ? scanHistory.version : `v${scanHistory.version}`}
              </Badge>
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigate('/changelog');
                onClose();
              }}
              className="flex items-center space-x-1"
            >
              <Clock className="w-3 h-3" />
              <span className="text-xs">Changelog</span>
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 scrollbar-thin">
          <div className="space-y-4 pr-4">
            {/* Changes - Only show sections with actual changes */}
            {ready && hasChanges ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium">Recent Changes</h3>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>{stats.totalFiles.toLocaleString()} files</span>
                    <span>{stats.totalFolders.toLocaleString()} folders</span>
                    <span>{changes.total_changes} changes</span>
                  </div>
                </div>
                
                <div className="grid gap-3 grid-cols-1 lg:grid-cols-3">
                  {changes.modified_files.length > 0 && (
                    <ChangeList
                      title="Modified Files"
                      items={changes.modified_files}
                      type="modified"
                      emptyMessage="No files were modified in the latest scan."
                      rootFolder={rootFolder}
                      onNavigateToFolder={onNavigateToFolder}
                      onClose={onClose}
                    />
                  )}
                  
                  {changes.added_files.length > 0 && (
                    <ChangeList
                      title="Added Files"
                      items={changes.added_files}
                      type="added"
                      emptyMessage="No files were added in the latest scan."
                      rootFolder={rootFolder}
                      onNavigateToFolder={onNavigateToFolder}
                      onClose={onClose}
                    />
                  )}
                  
                  {changes.deleted_files.length > 0 && (
                    <ChangeList
                      title="Deleted Files"
                      items={changes.deleted_files}
                      type="deleted"
                      emptyMessage="No files were deleted in the latest scan."
                      rootFolder={rootFolder}
                      onNavigateToFolder={onNavigateToFolder}
                      onClose={onClose}
                    />
                  )}
                </div>
              </div>
            ) : ready && !hasChanges ? (
              <Card className="glass border-border">
                <CardContent className="text-center py-6">
                  <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="text-base font-medium mb-2">No Recent Changes</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your Google Drive folder structure hasn't changed since the last scan.
                  </p>
                  <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                    <span>{stats.totalFiles.toLocaleString()} files</span>
                    <span>{stats.totalFolders.toLocaleString()} folders</span>
                    <span>Last scan: {formatDate(scanHistory.scan_date)}</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass border-border">
                <CardContent className="text-center py-6">
                  <div className="animate-pulse text-sm text-muted-foreground">Loading changes…</div>
                </CardContent>
              </Card>
            )}
            {commit && (
              <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground/70 p-3 border-t border-border">
                <span>Git commit:</span>
                <span className="font-mono text-primary">{commit.shortSha}</span>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex-shrink-0 pt-3 border-t border-border">
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline" className="focus-ring glass">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
