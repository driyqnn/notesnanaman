import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Reorder } from 'framer-motion';
import { Bookmark, FileText, Folder, Pin, ExternalLink, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookmarkItem } from '../hooks/useBookmarks';
import { motion } from 'framer-motion';

interface DraggableBookmarksProps {
  bookmarks: BookmarkItem[];
  onReorder: (newOrder: BookmarkItem[]) => void;
  onPin: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  onNavigate: (bookmark: BookmarkItem) => void;
  onClearAll: () => void;
}

const BookmarkCard: React.FC<{
  bookmark: BookmarkItem;
  onPin: (id: string) => void;
  onRemove: (id: string) => void;
  onNavigate: (bookmark: BookmarkItem) => void;
}> = ({ bookmark, onPin, onRemove, onNavigate }) => {
  const Icon = bookmark.type === 'folder' ? Folder : FileText;
  const isPinned = bookmark.pinned;

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        group relative p-3 rounded-lg border transition-all duration-200 cursor-pointer
        ${isPinned 
          ? 'border-primary/50 bg-primary/5 shadow-md' 
          : 'border-border/50 hover:bg-accent/50'
        }
      `}
      onClick={() => onNavigate(bookmark)}
    >
      {/* Pin indicator */}
      {isPinned && (
        <Pin className="absolute top-2 right-2 w-3 h-3 text-primary fill-current" />
      )}

      <div className="flex items-start gap-3">
        <Icon className={`
          w-5 h-5 mt-0.5 flex-shrink-0
          ${bookmark.type === 'folder' 
            ? 'text-gray-600 dark:text-gray-400' 
            : 'text-muted-foreground'
          }
        `} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm text-foreground truncate">
              {bookmark.name}
            </h4>
            {bookmark.type === 'file' && bookmark.size && (
              <Badge variant="secondary" className="text-xs">
                {formatSize(bookmark.size)}
              </Badge>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground truncate mb-1">
            {bookmark.path}
          </p>
          
          <p className="text-xs text-muted-foreground/70">
            Added {formatDate(bookmark.dateAdded)}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="absolute top-2 right-8 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onPin(bookmark.id);
          }}
          className={`h-6 w-6 p-0 ${isPinned ? 'text-primary' : ''}`}
          title={isPinned ? 'Unpin' : 'Pin to top'}
        >
          <Pin className={`w-3 h-3 ${isPinned ? 'fill-current' : ''}`} />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            window.open(bookmark.driveLink, '_blank');
          }}
          className="h-6 w-6 p-0"
          title="Open in Google Drive"
        >
          <ExternalLink className="w-3 h-3" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(bookmark.id);
          }}
          className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
          title="Remove bookmark"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </motion.div>
  );
};

export const DraggableBookmarks: React.FC<DraggableBookmarksProps> = ({
  bookmarks,
  onReorder,
  onPin,
  onRemove,
  onNavigate,
  onClearAll
}) => {
  // Separate pinned and regular bookmarks
  const pinnedBookmarks = bookmarks.filter(b => b.pinned);
  const regularBookmarks = bookmarks.filter(b => !b.pinned);

  const handleReorder = (newOrder: BookmarkItem[]) => {
    // Maintain the pinned bookmarks at the top
    const reorderedRegular = newOrder.filter(b => !b.pinned);
    const finalOrder = [...pinnedBookmarks, ...reorderedRegular];
    onReorder(finalOrder);
  };

  if (bookmarks.length === 0) {
    return (
      <Card className="glass border-border h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center space-x-2 text-foreground">
            <Bookmark className="w-4 h-4 fill-gray-600 text-gray-600 dark:fill-gray-400 dark:text-gray-400" />
            <span>Bookmarks</span>
            <Badge variant="outline" className="ml-2 text-xs">0</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <Bookmark className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground mb-1">No bookmarks yet</p>
          <p className="text-xs text-muted-foreground/70">
            Click the bookmark icon next to files or folders to bookmark them
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <Card className="glass border-border h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center space-x-2 text-foreground">
              <Bookmark className="w-4 h-4 fill-gray-600 text-gray-600 dark:fill-gray-400 dark:text-gray-400" />
              <span>Bookmarks</span>
              <Badge variant="outline" className="ml-2 text-xs">
                {bookmarks.length}
              </Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-xs hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear All
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {/* Pinned bookmarks (not reorderable) */}
          {pinnedBookmarks.map((bookmark) => (
            <BookmarkCard
              key={`pinned-${bookmark.id}`}
              bookmark={bookmark}
              onPin={onPin}
              onRemove={onRemove}
              onNavigate={onNavigate}
            />
          ))}
          
          {/* Regular bookmarks (reorderable) */}
          <Reorder.Group
            axis="y"
            values={regularBookmarks}
            onReorder={handleReorder}
            className="space-y-3"
          >
            {regularBookmarks.map((bookmark) => (
              <Reorder.Item key={bookmark.id} value={bookmark}>
                <BookmarkCard
                  bookmark={bookmark}
                  onPin={onPin}
                  onRemove={onRemove}
                  onNavigate={onNavigate}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </CardContent>
      </Card>
    </DndProvider>
  );
};