import React, { useState } from 'react';
import { Heart, Folder, FileText, Trash2, ExternalLink, Search, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FavoriteItem } from '../hooks/useFavorites';

interface FavoriteManagerProps {
  favorites: FavoriteItem[];
  onRemoveFavorite: (itemId: string) => void;
  onClearAll: () => void;
  onNavigateToItem: (favorite: FavoriteItem) => void;
}

export const FavoriteManager: React.FC<FavoriteManagerProps> = ({
  favorites,
  onRemoveFavorite,
  onClearAll,
  onNavigateToItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFavorites = favorites.filter(favorite =>
    favorite.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    favorite.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return FileText;
    
    if (mimeType.startsWith('image/')) return FileText;
    if (mimeType.startsWith('video/')) return FileText;
    if (mimeType.startsWith('audio/')) return FileText;
    if (mimeType.includes('pdf')) return FileText;
    if (mimeType.includes('document') || mimeType.includes('word')) return FileText;
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return FileText;
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return FileText;
    
    return FileText;
  };

  return (
    <Card className="glass border-border h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center space-x-2 text-foreground">
            <Heart className="w-4 h-4 fill-red-500 text-red-500" />
            <span>Favorites</span>
            <Badge variant="outline" className="ml-2 text-xs">
              {favorites.length}
            </Badge>
          </CardTitle>
          {favorites.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-xs hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>
        
        {favorites.length > 0 && (
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              placeholder="Search favorites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 pr-8 h-7 text-xs"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0 hover:bg-transparent"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        {favorites.length === 0 ? (
          <div className="p-6 text-center">
            <Heart className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground mb-1">No favorites yet</p>
            <p className="text-xs text-muted-foreground/70">
              Click the heart icon next to files or folders to favorite them
            </p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="p-4 space-y-2">
              {filteredFavorites.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground">
                    No favorites match your search
                  </p>
                </div>
              ) : (
                filteredFavorites.map((favorite, index) => {
                  const Icon = favorite.type === 'folder' ? Folder : getFileIcon(favorite.mimeType);
                  
                  return (
                    <div key={favorite.id}>
                      <div className="group flex items-center justify-between p-2 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors">
                        <div 
                          className="flex items-center space-x-2 flex-1 cursor-pointer"
                          onClick={() => onNavigateToItem(favorite)}
                        >
                          <Icon className={`w-4 h-4 ${
                            favorite.type === 'folder' 
                              ? 'text-blue-500' 
                              : 'text-muted-foreground'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="text-xs font-medium text-foreground truncate">
                                {favorite.name}
                              </p>
                              {favorite.type === 'file' && favorite.size && (
                                <Badge variant="secondary" className="text-xs">
                                  {formatSize(favorite.size)}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {favorite.path}
                            </p>
                            <p className="text-xs text-muted-foreground/70">
                              Added {formatDate(favorite.dateAdded)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(favorite.driveLink, '_blank');
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveFavorite(favorite.id);
                            }}
                            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      {index < filteredFavorites.length - 1 && (
                        <Separator className="my-1" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};