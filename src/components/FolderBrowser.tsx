import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Folder, 
  FileText, 
  Image, 
  FileVideo, 
  FileAudio, 
  Archive,
  User,
  Heart,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { FileItem, FolderItem } from '../types/drive';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { getFileStatus, formatDate } from '../utils/fileStatus';
import { useFavorites } from '../hooks/useFavorites';
import { useIntelligentPrefetch } from '../hooks/useIntelligentPrefetch';

interface FolderBrowserProps {
  currentFolder: FolderItem | null;
  currentPath: string;
  filteredItems: (FileItem | FolderItem)[];
  onFolderClick: (folderId: string, folderName: string) => void;
  onFileClick: (file: FileItem) => void;
  onBackClick: () => void;
  onBreadcrumbClick: (path: string) => void;
  canGoBack: boolean;
  loading: boolean;
  highlightFileId?: string;
  lastScanAt?: string;
}

const getFileIcon = (category: string) => {
  const iconMap = {
    'documents': FileText,
    'spreadsheets': FileText,
    'presentations': FileText,
    'images': Image,
    'videos': FileVideo,
    'audio': FileAudio,
    'archives': Archive,
    'default': FileText
  };
  return iconMap[category] || iconMap.default;
};

const formatSize = (sizeObj: { bytes: number; mb: number }) => {
  const mb = sizeObj.mb;
  if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
};

const getCategoryColor = (category: string) => {
  const colorMap = {
    'documents': 'text-green-400',
    'spreadsheets': 'text-green-400',
    'presentations': 'text-orange-400',
    'images': 'text-blue-400',
    'videos': 'text-red-400',
    'audio': 'text-purple-400',
    'archives': 'text-gray-400',
    'default': 'text-gray-400'
  };
  return colorMap[category] || colorMap.default;
};

export const FolderBrowser: React.FC<FolderBrowserProps> = ({
  currentFolder,
  currentPath,
  filteredItems,
  onFolderClick,
  onFileClick,
  onBackClick,
  onBreadcrumbClick,
  canGoBack,
  loading,
  highlightFileId,
  lastScanAt
}) => {
  const { toggleFavorite, isFavorited } = useFavorites();
  const { handleFolderHover, handleFolderLeave } = useIntelligentPrefetch(currentFolder);
  

  // Filter out empty folders and files
  const visibleItems = filteredItems.filter(item => {
    if (item.type === 'folder') {
      const folder = item as FolderItem;
      // Only show folders that have children
      return folder.children && folder.children.length > 0;
    }
    return true; // Always show files
  });

  const folders = visibleItems.filter(item => item.type === 'folder') as FolderItem[];
  const files = visibleItems.filter(item => item.type === 'file') as FileItem[];

  const formattedPH = lastScanAt
    ? new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Manila',
      }).format(new Date(lastScanAt))
    : null;

  const lastScanDate = lastScanAt ? new Date(lastScanAt) : null;

  const getRelativeTime = (date: Date) => {
    const ms = Date.now() - date.getTime();
    const s = Math.floor(ms / 1000);
    if (s < 30) return 'just now';
    const minutes = Math.floor(s / 60);
    if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    const years = Math.floor(days / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  };

  const lastScanRelative = lastScanDate ? getRelativeTime(lastScanDate) : null;

  const [phNow, setPhNow] = React.useState<{ long: string; short: string } | null>(null);
  React.useEffect(() => {
    const update = () => {
      const now = new Date();
      const nowPHLong = new Intl.DateTimeFormat('en-PH', {
        timeStyle: 'medium',
        timeZone: 'Asia/Manila',
      }).format(now);
      const nowPHShort = new Intl.DateTimeFormat('en-PH', {
        timeStyle: 'short',
        timeZone: 'Asia/Manila',
      }).format(now);
      setPhNow({ long: nowPHLong, short: nowPHShort });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  // Create animated breadcrumb items from path
  const createBreadcrumbs = () => {
    if (currentPath === '/') return null;
    
    const pathParts = currentPath.split('/').filter(Boolean);
    
    return (
      <motion.div 
        className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-lg p-3 mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Breadcrumb>
          <BreadcrumbList className="flex-wrap">
            <BreadcrumbItem>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-2 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 transition-all duration-200"
                  onClick={() => onBreadcrumbClick('/')}
                >
                  <Home className="w-4 h-4 mr-1" />
                  Drive
                </Button>
              </motion.div>
            </BreadcrumbItem>
            
            {pathParts.map((part, index) => {
              const isLast = index === pathParts.length - 1;
              const pathToThisLevel = '/' + pathParts.slice(0, index + 1).join('/') + '/';
              const displayName = part.replace(/-/g, ' ').toUpperCase();
              
              return (
                <React.Fragment key={index}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.15 + index * 0.05 }}
                  >
                    <BreadcrumbSeparator className="text-muted-foreground/50" />
                  </motion.div>
                  <BreadcrumbItem>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: 0.2 + index * 0.05 }}
                    >
                      {isLast ? (
                        <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary font-semibold rounded-md border border-primary/20">
                          <Folder className="w-4 h-4 text-yellow-400" />
                          <span className="text-xs">{displayName}</span>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-2 text-xs font-medium text-foreground hover:text-primary hover:bg-accent/50 transition-all duration-200"
                          onClick={() => onBreadcrumbClick(pathToThisLevel)}
                        >
                          <Folder className="w-3 h-3 mr-1 text-yellow-400" />
                          {displayName}
                        </Button>
                      )}
                    </motion.div>
                  </BreadcrumbItem>
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </motion.div>
    );
  };

  return (
    <div className="flex-1 p-2 sm:p-4 space-y-4 sm:space-y-6 pb-16 lg:pb-4">
      {/* Header with breadcrumb and back button */}
      <div className="flex flex-col space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            {canGoBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackClick}
                className="focus-ring hover:bg-accent/50 transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">
                {currentFolder?.name || 'notesnicharles hahahaha'}
              </h1>
            </div>
          </div>
          <Badge variant="outline" className="flex-shrink-0 text-xs sm:text-sm">
            {visibleItems.length} items
          </Badge>
        </div>

        {currentPath === '/' && (formattedPH || phNow) && (
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-xs text-muted-foreground">
              Last scan: {formattedPH ? <span>{formattedPH}</span> : '—'}
              {lastScanRelative && (
                <span className="text-primary-foreground font-semibold"> ({lastScanRelative})</span>
              )}
            </span>
            {phNow && (
              <span className="text-xs font-semibold text-primary-foreground whitespace-nowrap">{phNow.long}</span>
            )}
          </div>
        )}
        
        
        {/* Breadcrumbs */}
        {createBreadcrumbs()}
      </div>

      {visibleItems.length === 0 ? (
        <Card className="glass border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Folder className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No items found</h3>
            <p className="text-sm text-muted-foreground text-center">
              This folder appears to be empty or all items are filtered out.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Folders Section */}
          {folders.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Folder className="w-5 h-5 text-yellow-400" />
                <h2 className="text-lg font-medium">Folders</h2>
                <Badge variant="outline">{folders.length}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {folders.map((folder, idx) => (
                  <motion.div
                    key={folder.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    whileHover={{ y: -1, scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    layout
                  >
                    <Card
                      className="group cursor-pointer glass border-border hover:border-primary/20 transition-all duration-300 hover:shadow-lg"
                      onMouseEnter={() => handleFolderHover(folder.id)}
                      onMouseLeave={handleFolderLeave}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start justify-between">
                          <div 
                            className="flex items-start space-x-3 flex-1 min-w-0"
                            onClick={() => {
                              console.log('📁 Folder clicked:', folder.name, 'ID:', folder.id);
                              onFolderClick(folder.id, folder.name);
                            }}
                          >
                            <div className="flex-shrink-0">
                              <Folder className="w-8 h-8 text-yellow-400 group-hover:text-yellow-300 transition-colors duration-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground group-hover:text-primary transition-colors duration-300 break-words">
                                {folder.name}
                              </h4>
                            {folder.description && (
                              <div className="flex items-center space-x-1 mt-1">
                                <User className="w-3 h-3 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground break-words">
                                  {folder.description}
                                </p>
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-sm text-muted-foreground">
                                {folder.children?.length || 0} items
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(folder.lastUpdated)}
                              </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(folder, currentPath);
                            }}
                            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 h-auto hover:bg-accent/50"
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                isFavorited(folder.id)
                                  ? 'fill-red-500 text-red-500'
                                  : 'text-muted-foreground hover:text-red-500'
                              }`}
                            />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Separator */}
          {folders.length > 0 && files.length > 0 && (
            <Separator />
          )}

          {/* Files Section */}
          {files.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="w-5 h-5 text-green-400" />
                <h2 className="text-lg font-medium">Files</h2>
                <Badge variant="outline">{files.length}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {files.map((file) => {
                  const IconComponent = getFileIcon(file.category);
                  const iconColor = getCategoryColor(file.category);
                  const status = getFileStatus(file);
                  const isTarget = highlightFileId === file.id;
                  
                  return (
                    <motion.div
                      key={file.id}
                      className="relative rounded-lg will-change-transform"
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={
                        isTarget
                          ? { opacity: 1, y: 0, boxShadow: '0 0 0 8px hsl(var(--highlight-cyan) / 0.6)' }
                          : { opacity: 1, y: 0, boxShadow: '0 0 0 0 hsl(var(--highlight-cyan) / 0)' }
                      }
                      whileHover={{ y: -1, scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      transition={isTarget ? { duration: 0.4 } : { duration: 0.2 }}
                    >
                      {/* Bold cyan outline overlay */}
                      <motion.div
                        aria-hidden
                        className="pointer-events-none absolute -inset-1 rounded-xl border-4"
                        style={{
                          borderColor: 'hsl(var(--highlight-cyan))',
                          boxShadow:
                            '0 0 0 2px hsl(var(--highlight-cyan)), 0 0 24px hsl(var(--highlight-cyan) / 0.8)'
                        }}
                        initial={{ opacity: 0 }}
                        animate={isTarget ? { opacity: [0.5, 1, 0.5], scale: [1, 1.01, 1] } : { opacity: 0 }}
                        transition={isTarget ? { duration: 0.9, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
                      />
                      <Card
                        data-file-id={file.id}
                        className="group relative cursor-pointer glass border-border hover:border-primary/20 transition-all duration-300 hover:shadow-lg"
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-start justify-between">
                            <div 
                              className="flex items-start space-x-3 flex-1 min-w-0"
                              onClick={() => {
                                console.log('📄 File clicked:', file.name);
                                onFileClick(file);
                              }}
                            >
                              <div className="flex-shrink-0">
                                <IconComponent className={`w-8 h-8 ${iconColor} group-hover:scale-110 transition-transform duration-300`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <h4 className="font-medium text-foreground group-hover:text-primary transition-colors duration-300 break-words leading-tight flex-1">
                                    {file.name}
                                  </h4>
                                  {status && (
                                    <Badge 
                                      variant="outline" 
                                      className={`ml-2 text-xs ${
                                        status === 'New' 
                                          ? 'border-green-500 text-green-600' 
                                          : 'border-blue-500 text-blue-600'
                                      }`}
                                    >
                                      {status}
                                    </Badge>
                                  )}
                                </div>
                                {file.description && (
                                  <p className="text-sm text-muted-foreground mt-1 break-words leading-relaxed">
                                    {file.description}
                                  </p>
                                )}
                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center space-x-2">
                                    <Badge variant="secondary" className="text-xs capitalize">
                                      {file.category}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {formatSize(file.size)}
                                    </span>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(file.modifiedTime)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(file, currentPath);
                              }}
                              className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 h-auto hover:bg-accent/50"
                            >
                              <Heart
                                className={`w-4 h-4 ${
                                  isFavorited(file.id)
                                    ? 'fill-red-500 text-red-500'
                                    : 'text-muted-foreground hover:text-red-500'
                                }`}
                              />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
