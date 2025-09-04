import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Tag, 
  Clock, 
  Calendar, 
  TrendingUp, 
  FileText, 
  Plus, 
  Minus, 
  Edit3,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FolderItem, ChangeItem } from '../types/drive';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';

interface VersionHistoryEntry {
  version: string;
  scan_date: string;
  scanner_version: string;
  changes: {
    added_files: ChangeItem[];
    deleted_files: ChangeItem[];
    modified_files: ChangeItem[];
    total_changes: number;
    summary: string;
  };
  stats: {
    totalFiles: number;
    totalFolders: number;
    totalSizeMB: number;
  };
}

interface ChangelogProps {
  rootFolder?: FolderItem | null;
  onNavigateToFolder?: (folderId: string, folderName: string, highlightFileId?: string) => void;
}

// Load changelog data
const useChangelogData = () => {
  const [versionHistory, setVersionHistory] = useState<VersionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const changelogResponse = await fetch('/changelog.json?' + Date.now());

        if (changelogResponse?.ok) {
          const changelogData = await changelogResponse.json();
          if (changelogData.version_history) {
            setVersionHistory(changelogData.version_history);
            localStorage.setItem('changelog_version_history', JSON.stringify(changelogData.version_history));
          }
        } else {
          // Try localStorage as fallback
          const stored = localStorage.getItem('changelog_version_history');
          if (stored) {
            setVersionHistory(JSON.parse(stored));
          }
        }
      } catch (error) {
        console.error('Failed to load changelog data:', error);
        const stored = localStorage.getItem('changelog_version_history');
        if (stored) {
          setVersionHistory(JSON.parse(stored));
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  return { versionHistory, loading };
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

const formatSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  const kb = size / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
};

const ChangeIcon: React.FC<{ type: 'added' | 'deleted' | 'updated' }> = ({ type }) => {
  switch (type) {
    case 'added':
      return <Plus className="w-4 h-4 text-green-400" />;
    case 'deleted':
      return <Minus className="w-4 h-4 text-red-400" />;
    case 'updated':
      return <Edit3 className="w-4 h-4 text-blue-400" />;
  }
};

const VersionCard: React.FC<{
  version: VersionHistoryEntry;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigateToFolder?: (folderId: string, folderName: string, highlightFileId?: string) => void;
  onCollapseOthers: () => void;
}> = ({ version, isExpanded, onToggle, onNavigateToFolder, onCollapseOthers }) => {
  const totalChanges = version.changes.total_changes;
  const hasChanges = totalChanges > 0;

  const handleFileClick = (file: ChangeItem) => {
    // Navigate to the main drive and highlight the file
    if (file.id) {
      // Navigate to the main drive with the file highlighted
      const currentUrl = new URL(window.location.origin);
      currentUrl.searchParams.set('target', file.id);
      window.location.href = currentUrl.toString();
    } else {
      // Fallback to search if no ID available
      window.location.href = `/?search=${encodeURIComponent(file.name)}`;
    }
  };

  const renderFileList = (files: ChangeItem[], type: 'added' | 'deleted' | 'updated') => {
    if (files.length === 0) return null;

    return (
      <div className="mt-2">
        <div className="flex items-center space-x-2 mb-2">
          <ChangeIcon type={type} />
          <span className="font-medium text-xs capitalize">{type === 'updated' ? 'Updated' : type} Files</span>
          <Badge variant="secondary" className="text-xs">{files.length}</Badge>
        </div>
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {files.map((file, index) => (
            <div 
              key={`${file.id}-${index}`}
              className="flex items-center justify-between p-1.5 rounded-md bg-muted/50 text-xs hover:bg-muted cursor-pointer transition-colors"
              onClick={() => handleFileClick(file)}
            >
              <div className="flex items-center space-x-1.5 flex-1 min-w-0">
                <FileText className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <span className="break-words">{file.name}</span>
              </div>
              {file.size && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatSize(file.size)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleToggle = () => {
    onToggle();
  };

  return (
    <Card className="glass border-border">
      <Collapsible open={isExpanded} onOpenChange={handleToggle}>
        <CollapsibleTrigger asChild>
          <div className="p-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.div>
                <div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      <Tag className="w-3 h-3 mr-1" />
                      {version.version.startsWith('v') ? version.version : `v${version.version}`}
                    </Badge>
                    <span className="text-sm font-medium">
                      {formatDate(version.scan_date)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {version.changes.summary}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>{totalChanges}</span>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="px-3 pb-3 border-t border-border/50"
          >
            {hasChanges ? (
              <div className="pt-3 space-y-3">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                   {renderFileList(version.changes.added_files, 'added')}
                   {renderFileList(version.changes.modified_files, 'updated')}
                   {renderFileList(version.changes.deleted_files, 'deleted')}
                 </div>
              </div>
            ) : (
              <div className="pt-3 text-center py-4">
                <TrendingUp className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <h3 className="text-sm font-medium mb-1">No Changes</h3>
                <p className="text-xs text-muted-foreground">
                  No file changes detected in this version.
                </p>
              </div>
            )}
          </motion.div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

const Changelog: React.FC<ChangelogProps> = ({ 
  rootFolder, 
  onNavigateToFolder 
}) => {
  const { versionHistory, loading } = useChangelogData();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [filterType, setFilterType] = useState<'all' | 'major' | 'minor' | 'changes-only'>(
    (searchParams.get('filter') as any) || 'all'
  );
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());

  // Update URL when filters change
  const updateFilters = (search: string, filter: string) => {
    const newParams = new URLSearchParams();
    if (search) newParams.set('search', search);
    if (filter !== 'all') newParams.set('filter', filter);
    setSearchParams(newParams);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    updateFilters(value, filterType);
  };

  const handleFilterChange = (value: 'all' | 'major' | 'minor' | 'changes-only') => {
    setFilterType(value);
    updateFilters(searchQuery, value);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setSearchParams(new URLSearchParams());
  };

  const toggleVersion = (version: string) => {
    setExpandedVersions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(version)) {
        newSet.delete(version);
      } else {
        newSet.add(version);
      }
      return newSet;
    });
  };

  const collapseOthersAndOpen = (version: string) => {
    setExpandedVersions(new Set([version]));
  };

  const filteredVersions = useMemo(() => {
    if (!versionHistory) return [];
    
    return versionHistory.filter(version => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesVersion = version.version.toLowerCase().includes(searchLower);
        const matchesSummary = version.changes.summary.toLowerCase().includes(searchLower);
        const matchesFiles = version.changes.added_files.some(f => f.name.toLowerCase().includes(searchLower)) ||
                           version.changes.modified_files.some(f => f.name.toLowerCase().includes(searchLower)) ||
                           version.changes.deleted_files.some(f => f.name.toLowerCase().includes(searchLower));
        
        if (!matchesVersion && !matchesSummary && !matchesFiles) return false;
      }
      
      // Type filter
      if (filterType === 'major') {
        const versionParts = version.version.replace('v', '').split('.');
        return versionParts[1] === '0' && versionParts[2] === '0'; // x.0.0
      } else if (filterType === 'minor') {
        const versionParts = version.version.replace('v', '').split('.');
        return versionParts[2] === '0' && versionParts[1] !== '0'; // x.y.0 where y != 0
      } else if (filterType === 'changes-only') {
        return version.changes.total_changes > 0;
      }
      
      return true;
    });
  }, [versionHistory, searchQuery, filterType]);


  return (
    <>
      <SEOHead 
        currentFolder={null}
        currentPath="/changelog"
        pageType="changelog"
        customTitle="Changelog"
        customDescription="Track all file system changes, version history, and updates across academic resources. View detailed changelogs with file additions, modifications, and deletions."
      />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-background"
      >
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Tag className="w-7 h-7 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Changelog</h1>
                <p className="text-sm text-muted-foreground">
                  Track all file system changes and version history
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <Card className="glass border-border">
            <CardContent className="p-3">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search versions, files, or changes..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10 h-9"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={filterType} onValueChange={handleFilterChange}>
                    <SelectTrigger className="w-40 h-9">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Versions</SelectItem>
                      <SelectItem value="major">Major Releases</SelectItem>
                      <SelectItem value="minor">Minor Releases</SelectItem>
                      <SelectItem value="changes-only">With Changes Only</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {(searchQuery || filterType !== 'all') && (
                    <Button variant="outline" size="sm" onClick={clearFilters} className="h-9">
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-border">
                <div className="text-xs text-muted-foreground">
                  Showing {filteredVersions.length} of {versionHistory.length} versions
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        {loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-pulse text-muted-foreground">Loading version history...</div>
            </CardContent>
          </Card>
        ) : filteredVersions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Tag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery || filterType !== 'all' ? 'No Matching Versions' : 'No Version History'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery || filterType !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Version history data is not available.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredVersions.map((version) => (
              <VersionCard
                key={version.version}
                version={version}
                isExpanded={expandedVersions.has(version.version)}
                onToggle={() => toggleVersion(version.version)}
                onNavigateToFolder={onNavigateToFolder}
                onCollapseOthers={() => collapseOthersAndOpen(version.version)}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
    </>
  );
};

export default Changelog;