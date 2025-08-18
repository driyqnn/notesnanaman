import React from "react";
import {
  Clock,
  Plus,
  Minus,
  Edit,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  Tag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChangeSet, FolderItem } from "../types/drive";

interface VersionHistoryEntry {
  version?: string;
  current_version?: string;
  n_version?: string;
  scan_date: string;
  scanner_version: string;
  changes: ChangeSet;
  stats?: {
    totalFiles: number;
    totalFolders: number;
    totalSizeMB: number;
  };
}

interface VersionHistoryProps {
  versionHistory: VersionHistoryEntry[];
  rootFolder?: FolderItem | null;
  onNavigateToFolder?: (folderId: string, folderName: string) => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({ versionHistory, rootFolder, onNavigateToFolder }) => {
  const [expandedVersions, setExpandedVersions] = React.useState<Set<string>>(new Set());

  // Group by version, keep latest scan_date but original changes
  const filteredVersionHistory = React.useMemo(() => {
    if (!versionHistory || versionHistory.length === 0) return [];
    
    // Group all entries by version number
    const versionGroups = new Map<string, VersionHistoryEntry[]>();
    
    versionHistory.forEach(entry => {
      const version = entry.version || entry.current_version || entry.n_version || 'unknown';
      if (!versionGroups.has(version)) {
        versionGroups.set(version, []);
      }
      versionGroups.get(version)!.push(entry);
    });
    
    // For each version group, create a merged entry
    const mergedVersions: VersionHistoryEntry[] = [];
    
    versionGroups.forEach((entries, version) => {
      // Find the entry with changes (original changes when version was created)
      const entryWithChanges = entries.find(entry => entry.changes?.total_changes > 0);
      
      // Only include versions that had real changes at some point
      if (!entryWithChanges) return;
      
      // Find the latest scan date in this version group
      const latestEntry = entries.reduce((latest, current) => 
        new Date(current.scan_date) > new Date(latest.scan_date) ? current : latest
      );
      
      // Create merged entry: latest scan_date + original changes + latest stats
      const mergedEntry: VersionHistoryEntry = {
        ...entryWithChanges, // Use the entry with changes as base
        scan_date: latestEntry.scan_date, // But use the latest scan date
        stats: latestEntry.stats || entryWithChanges.stats, // Use latest stats if available
      };
      
      mergedVersions.push(mergedEntry);
    });
    
    // Sort by the original creation time (when changes first appeared)
    return mergedVersions.sort((a, b) => {
      // Find the earliest scan_date for each version (when it was first created)
      const aGroup = versionGroups.get(a.version || a.current_version || a.n_version || 'unknown') || [];
      const bGroup = versionGroups.get(b.version || b.current_version || b.n_version || 'unknown') || [];
      
      const aCreated = aGroup.reduce((earliest, entry) => 
        entry.changes?.total_changes > 0 && new Date(entry.scan_date) < new Date(earliest.scan_date) ? entry : earliest
      );
      const bCreated = bGroup.reduce((earliest, entry) => 
        entry.changes?.total_changes > 0 && new Date(entry.scan_date) < new Date(earliest.scan_date) ? entry : earliest
      );
      
      // Sort by creation time, newest first
      return new Date(bCreated.scan_date).getTime() - new Date(aCreated.scan_date).getTime();
    });
  }, [versionHistory]);

  const toggleVersion = (version: string) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(version)) {
      newExpanded.delete(version);
    } else {
      newExpanded.add(version);
    }
    setExpandedVersions(newExpanded);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Find breadcrumb (folders) for a file by ID
  const findFileBreadcrumbs = (root: FolderItem | null | undefined, fileId: string) => {
    if (!root) return null;
    const trail: FolderItem[] = [];

    const dfs = (node: FolderItem): FolderItem[] | null => {
      // Check if file exists directly under this folder
      const hasFile = (node.children || []).some((child: any) => child.type === 'file' && child.id === fileId);
      if (hasFile) {
        return [...trail, node];
      }
      for (const child of node.children || []) {
        if (child.type === 'folder') {
          trail.push(child as FolderItem);
          const res = dfs(child as FolderItem);
          if (res) return [node, ...res.slice(trail.indexOf(child as FolderItem))];
          trail.pop();
        }
      }
      return null;
    };

    // Start from root
    if (root) {
      // Root may directly contain the file
      const rootHas = (root.children || []).some((c: any) => c.type === 'file' && c.id === fileId);
      if (rootHas) return [root];
      for (const child of root.children || []) {
        if (child.type === 'folder') {
          trail.push(child as FolderItem);
          const res = dfs(child as FolderItem);
          if (res) return [root, ...res];
          trail.pop();
        }
      }
    }
    return null;
  };
  if (!filteredVersionHistory || filteredVersionHistory.length === 0) {
    return (
      <Card className="glass border-border animate-float-up">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2 text-foreground">
            <Clock className="w-4 h-4" />
            <span>Version History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground text-center py-4">
            No version history available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-border animate-float-up">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center space-x-2 text-foreground">
          <Clock className="w-4 h-4 group-hover:animate-wiggle" />
          <span>Version History</span>
          <Badge variant="outline" className="ml-auto text-xs animate-scale-fade">
            {filteredVersionHistory.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="p-4 space-y-3">
            {filteredVersionHistory.map((entry, index) => {
              // Use the actual version from the data, or generate semantic version as fallback
              const version = entry.version || entry.current_version || entry.n_version || `1.0.${filteredVersionHistory.length - index}`;
              const isExpanded = expandedVersions.has(version);
              const changes = entry.changes;
              const totalChanges = changes.total_changes || 0;
              const isLatest = index === 0; // First entry after filtering is the latest

              return (
                <Collapsible
                  key={`${version}-${entry.scan_date}`}
                  open={isExpanded}
                  onOpenChange={() => toggleVersion(version)}
                  className="animate-slide-in-left"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-3 h-auto border border-border/50 hover:bg-accent/50 transition-all duration-300 hover:scale-105 group"
                      aria-expanded={isExpanded}
                      title={`${isExpanded ? 'Collapse' : 'Expand'} version v${version}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <Tag className="w-4 h-4 text-primary group-hover:animate-wiggle" />
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                            v{version}
                          </span>
                          {isLatest && (
                            <Badge variant="default" className="text-xs animate-glow">
                              Latest
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(entry.scan_date)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {totalChanges > 0 && (
                          <Badge variant="secondary" className="text-xs animate-pulse">
                            {totalChanges} change{totalChanges > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {totalChanges === 0 && (
                          <Badge variant="outline" className="text-xs">
                            No changes
                          </Badge>
                        )}
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                        ) : (
                          <ChevronRight className="w-4 h-4 transition-transform duration-200" />
                        )}
                      </div>
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="px-3 pb-3 animate-fade-in">
                    <div className="mt-3 space-y-3 border-t border-border/30 pt-3">
                      {/* Summary */}
                      <div className="text-xs text-muted-foreground animate-slide-in-left">
                        {changes.summary || "No changes detected"}
                      </div>

                      {/* Change Categories */}
                      {changes.added_files && changes.added_files.length > 0 && (
                        <div className="space-y-2 animate-float-up">
                          <div className="flex items-center space-x-2 text-xs font-medium text-green-600 dark:text-green-400">
                            <Plus className="w-3 h-3 animate-scale-fade" />
                            <span>Added ({changes.added_files.length})</span>
                          </div>
                          <div className="space-y-1 ml-5">
                             {changes.added_files.slice(0, 3).map((file, idx) => (
                               <div 
                                 key={idx} 
                                 className="space-y-0.5 text-xs text-muted-foreground transition-colors"
                               >
                                 <div 
                                   className="flex items-center space-x-2 hover:text-primary cursor-pointer"
                                   onClick={() => file.id && window.open(`https://drive.google.com/file/d/${file.id}/view`, '_blank')}
                                   title={file.id ? "Click to open in Google Drive" : "File ID not available"}
                                 >
                                   <FileText className="w-3 h-3" />
                                   <span className="truncate hover:underline">{file.name}</span>
                                   {file.size && (
                                     <span className="text-xs">({formatSize(file.size)})</span>
                                   )}
                                 </div>
                                 {/* Folder Path */}
                                 {rootFolder && (
                                   (() => {
                                     const crumbs = findFileBreadcrumbs(rootFolder!, file.id);
                                     if (!crumbs || crumbs.length === 0) return null;
                                     return (
                                       <div className="ml-5 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground/90">
                                         {crumbs.map((folder, i) => (
                                           <React.Fragment key={folder.id}>
                                             <button
                                               type="button"
                                               className="hover:underline hover:text-primary"
                                               onClick={() => onNavigateToFolder && onNavigateToFolder(folder.id, folder.name)}
                                             >
                                               {folder.name}
                                             </button>
                                             {i < crumbs.length - 1 && <span className="opacity-60">/</span>}
                                           </React.Fragment>
                                         ))}
                                       </div>
                                     );
                                   })()
                                 )}
                               </div>
                             ))}
                            {changes.added_files.length > 3 && (
                              <div className="text-xs text-muted-foreground ml-5">
                                +{changes.added_files.length - 3} more files
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {changes.deleted_files && changes.deleted_files.length > 0 && (
                        <div className="space-y-2 animate-float-up">
                          <div className="flex items-center space-x-2 text-xs font-medium text-red-600 dark:text-red-400">
                            <Minus className="w-3 h-3 animate-scale-fade" />
                            <span>Deleted ({changes.deleted_files.length})</span>
                          </div>
                          <div className="space-y-1 ml-5">
                             {changes.deleted_files.slice(0, 3).map((file, idx) => (
                               <div 
                                 key={idx} 
                                 className="space-y-0.5 text-xs text-muted-foreground transition-colors"
                               >
                                 <div 
                                   className="flex items-center space-x-2 hover:text-primary cursor-pointer"
                                   onClick={() => file.id && window.open(`https://drive.google.com/file/d/${file.id}/view`, '_blank')}
                                   title={file.id ? "Click to open in Google Drive" : "File ID not available"}
                                 >
                                   <FileText className="w-3 h-3" />
                                   <span className="truncate hover:underline">{file.name}</span>
                                   {file.size && (
                                     <span className="text-xs">({formatSize(file.size)})</span>
                                   )}
                                 </div>
                                 {/* Folder Path */}
                                 {rootFolder && (
                                   (() => {
                                     const crumbs = findFileBreadcrumbs(rootFolder!, file.id);
                                     if (!crumbs || crumbs.length === 0) return null;
                                     return (
                                       <div className="ml-5 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground/90">
                                         {crumbs.map((folder, i) => (
                                           <React.Fragment key={folder.id}>
                                             <button
                                               type="button"
                                               className="hover:underline hover:text-primary"
                                               onClick={() => onNavigateToFolder && onNavigateToFolder(folder.id, folder.name)}
                                             >
                                               {folder.name}
                                             </button>
                                             {i < crumbs.length - 1 && <span className="opacity-60">/</span>}
                                           </React.Fragment>
                                         ))}
                                       </div>
                                     );
                                   })()
                                 )}
                               </div>
                             ))}
                            {changes.deleted_files.length > 3 && (
                              <div className="text-xs text-muted-foreground ml-5">
                                +{changes.deleted_files.length - 3} more files
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {changes.modified_files && changes.modified_files.length > 0 && (
                        <div className="space-y-2 animate-float-up">
                          <div className="flex items-center space-x-2 text-xs font-medium text-yellow-600 dark:text-yellow-400">
                            <Edit className="w-3 h-3 animate-scale-fade" />
                            <span>Modified ({changes.modified_files.length})</span>
                          </div>
                          <div className="space-y-1 ml-5">
                             {changes.modified_files.slice(0, 3).map((file, idx) => (
                               <div 
                                 key={idx} 
                                 className="space-y-0.5 text-xs text-muted-foreground transition-colors"
                               >
                                 <div 
                                   className="flex items-center space-x-2 hover:text-primary cursor-pointer"
                                   onClick={() => file.id && window.open(`https://drive.google.com/file/d/${file.id}/view`, '_blank')}
                                   title={file.id ? "Click to open in Google Drive" : "File ID not available"}
                                 >
                                   <FileText className="w-3 h-3" />
                                   <span className="truncate hover:underline">{file.name}</span>
                                   {file.old_size !== undefined && file.new_size !== undefined && (
                                     <span className="text-xs">
                                       ({formatSize(file.old_size)} → {formatSize(file.new_size)})
                                     </span>
                                   )}
                                 </div>
                                 {/* Folder Path */}
                                 {rootFolder && (
                                   (() => {
                                     const crumbs = findFileBreadcrumbs(rootFolder!, file.id);
                                     if (!crumbs || crumbs.length === 0) return null;
                                     return (
                                       <div className="ml-5 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground/90">
                                         {crumbs.map((folder, i) => (
                                           <React.Fragment key={folder.id}>
                                             <button
                                               type="button"
                                               className="hover:underline hover:text-primary"
                                               onClick={() => onNavigateToFolder && onNavigateToFolder(folder.id, folder.name)}
                                             >
                                               {folder.name}
                                             </button>
                                             {i < crumbs.length - 1 && <span className="opacity-60">/</span>}
                                           </React.Fragment>
                                         ))}
                                       </div>
                                     );
                                   })()
                                 )}
                               </div>
                             ))}
                            {changes.modified_files.length > 3 && (
                              <div className="text-xs text-muted-foreground ml-5">
                                +{changes.modified_files.length - 3} more files
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Stats */}
                      {entry.stats && (
                        <div className="grid grid-cols-3 gap-2 text-xs border-t border-border/30 pt-2">
                          <div className="text-center">
                            <div className="text-muted-foreground">Files</div>
                            <div className="font-medium text-foreground">{entry.stats.totalFiles}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-muted-foreground">Folders</div>
                            <div className="font-medium text-foreground">{entry.stats.totalFolders}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-muted-foreground">Size</div>
                            <div className="font-medium text-foreground">
                              {entry.stats.totalSizeMB < 1024 
                                ? `${entry.stats.totalSizeMB.toFixed(1)} MB`
                                : `${(entry.stats.totalSizeMB / 1024).toFixed(1)} GB`
                              }
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};