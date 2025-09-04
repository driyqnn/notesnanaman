import React, { useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { FileItem, FolderItem } from '../types/drive';
import { motion } from 'framer-motion';
import { FileIcon, FolderIcon, ExternalLinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface VirtualizedFolderBrowserProps {
  items: (FileItem | FolderItem)[];
  onItemClick: (item: FileItem | FolderItem) => void;
  onExternalOpen: (item: FileItem | FolderItem) => void;
  searchQuery?: string;
  highlightFileId?: string | null;
}

interface ItemRowProps {
  item: FileItem | FolderItem;
  isHighlighted: boolean;
  searchQuery?: string;
  onItemClick: (item: FileItem | FolderItem) => void;
  onExternalOpen: (item: FileItem | FolderItem) => void;
}

const ItemRow: React.FC<ItemRowProps> = ({
  item,
  isHighlighted,
  searchQuery,
  onItemClick,
  onExternalOpen
}) => {
  const formatSize = (sizeValue?: number | { bytes: number }) => {
    if (!sizeValue) return '';
    const bytes = typeof sizeValue === 'number' ? sizeValue : sizeValue.bytes;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const highlightSearchTerm = (text: string, query?: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800">{part}</mark>
      ) : part
    );
  };

  const Icon = item.type === 'folder' ? FolderIcon : FileIcon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`
        group flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-pointer
        ${isHighlighted 
          ? 'border-primary bg-primary/10 shadow-md' 
          : 'border-border/50 hover:bg-accent/50'
        }
      `}
      onClick={() => onItemClick(item)}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Icon className={`
          w-5 h-5 flex-shrink-0
          ${item.type === 'folder' 
            ? 'text-gray-600 dark:text-gray-400' 
            : 'text-muted-foreground'
          }
        `} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm text-foreground truncate">
              {highlightSearchTerm(item.name, searchQuery)}
            </h4>
            {item.type === 'file' && (item as FileItem).size && (
              <Badge variant="secondary" className="text-xs">
                {formatSize((item as FileItem).size)}
              </Badge>
            )}
          </div>
          
          {item.type === 'file' && (item as FileItem).modifiedTime && (
            <p className="text-xs text-muted-foreground">
              Modified {formatDate((item as FileItem).modifiedTime)}
            </p>
          )}
          
          {item.type === 'folder' && (item as FolderItem).children && (
            <p className="text-xs text-muted-foreground">
              {(item as FolderItem).children?.length || 0} items
            </p>
          )}
        </div>
      </div>

      {/* Action button */}
      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onExternalOpen(item);
          }}
          className="h-8 w-8 p-0"
          title="Open in Google Drive"
        >
          <ExternalLinkIcon className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export const VirtualizedFolderBrowser: React.FC<VirtualizedFolderBrowserProps> = ({
  items,
  onItemClick,
  onExternalOpen,
  searchQuery,
  highlightFileId
}) => {
  const parentRef = React.useRef<HTMLDivElement>(null);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    return items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const virtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated height of each item
    overscan: 5, // Render 5 extra items outside viewport for smooth scrolling
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Auto-scroll to highlighted item
  React.useEffect(() => {
    if (highlightFileId) {
      const index = filteredItems.findIndex(item => item.id === highlightFileId);
      if (index !== -1) {
        virtualizer.scrollToIndex(index, { align: 'center' });
      }
    }
  }, [highlightFileId, filteredItems, virtualizer]);

  return (
    <div 
      ref={parentRef}
      className="h-full overflow-auto"
      style={{
        contain: 'strict',
      }}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualRow) => {
          const item = filteredItems[virtualRow.index];
          const isHighlighted = item.id === highlightFileId;

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: virtualRow.size,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="p-2">
                <ItemRow
                  item={item}
                  isHighlighted={isHighlighted}
                  searchQuery={searchQuery}
                  onItemClick={onItemClick}
                  onExternalOpen={onExternalOpen}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};