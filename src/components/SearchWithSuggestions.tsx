import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, File, Folder } from 'lucide-react';
import Fuse from 'fuse.js';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileItem, FolderItem } from '../types/drive';


interface SearchWithSuggestionsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  allItems: (FileItem | FolderItem)[];
  onItemSelect: (item: FileItem | FolderItem) => void;
  placeholder?: string;
  className?: string;
}

interface SearchableItem {
  path: string;
  originalItem: FileItem | FolderItem;
  id: string;
  name: string;
  type: 'file' | 'folder';
  description?: string;
}

export const SearchWithSuggestions: React.FC<SearchWithSuggestionsProps> = ({
  searchQuery,
  onSearchChange,
  allItems,
  onItemSelect,
  placeholder = "Search files and folders...",
  className = ""
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Create a flat list of all items with their paths for fuzzy search
  const searchableItems = useMemo(() => {
    const flattenItems = (items: (FileItem | FolderItem)[], currentPath: string = '/'): SearchableItem[] => {
      const results: SearchableItem[] = [];
      
      for (const item of items) {
        const itemPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
        
        results.push({
          path: itemPath,
          originalItem: item,
          id: item.id,
          name: item.name,
          type: item.type,
          description: item.description
        });
        
        // Recursively add children for folders
        if (item.type === 'folder' && (item as FolderItem).children) {
          results.push(...flattenItems((item as FolderItem).children!, itemPath));
        }
      }
      
      return results;
    };
    
    return flattenItems(allItems);
  }, [allItems]);

  // Fuzzy search using Fuse.js
  const suggestions = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return [] as SearchableItem[];

    const fuse = new Fuse<SearchableItem>(searchableItems, {
      keys: [
        { name: 'name', weight: 0.6 },
        { name: 'path', weight: 0.3 },
        { name: 'description', weight: 0.1 },
      ],
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 1,
      includeScore: true,
    });

    const results = fuse.search(q).slice(0, 8).map(r => r.item);
    // Fallback to simple contains if no fuzzy results
    if (results.length === 0) {
      const query = q.toLowerCase();
      return searchableItems.filter(item => item.name.toLowerCase().includes(query) || item.path.toLowerCase().includes(query)).slice(0, 8);
    }
    return results;
  }, [searchQuery, searchableItems]);

  // Handle input change
  const handleInputChange = (value: string) => {
    onSearchChange(value);
    setShowSuggestions(true);
    setSelectedIndex(-1);
  };

  // Handle suggestion click
  const handleSuggestionClick = (item: SearchableItem) => {
    onItemSelect(item.originalItem);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when global event is dispatched (from '/')
  useEffect(() => {
    const focusListener = () => {
      inputRef.current?.focus();
    };
    window.addEventListener('focus-search', focusListener as unknown as EventListener);
    return () => window.removeEventListener('focus-search', focusListener as unknown as EventListener);
  }, []);

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 text-foreground rounded px-0.5">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          className="pl-10 pr-10 bg-muted/50 border-border text-foreground placeholder-muted-foreground focus:border-primary"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSearchChange('');
              setShowSuggestions(false);
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 z-50"
          >
            <Card className="max-h-80 overflow-y-auto glass border-border shadow-lg">
              <CardContent className="p-0">
                {suggestions.map((item, index) => {
                  const isSelected = index === selectedIndex;
                  const Icon = item.type === 'folder' ? Folder : File;
                  const originalItem = item.originalItem;
                  
                  return (
                    <motion.div
                      key={`${item.id}-${index}`}
                      className={`p-3 cursor-pointer transition-colors border-b border-border/50 last:border-b-0 ${
                        isSelected ? 'bg-accent' : 'hover:bg-accent/50'
                      }`}
                      onClick={() => handleSuggestionClick(item)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.995 }}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${
                          item.type === 'folder' ? 'text-blue-500' : 'text-muted-foreground'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-foreground truncate">
                              {highlightMatch(item.name, searchQuery)}
                            </p>
                            <Badge variant="outline" className="text-xs capitalize flex-shrink-0">
                              {item.type}
                            </Badge>
                            {item.type === 'file' && originalItem.type === 'file' && (originalItem as FileItem).size && (
                              <Badge variant="secondary" className="text-xs flex-shrink-0">
                                {formatSize((originalItem as FileItem).size.bytes)}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {highlightMatch(item.path, searchQuery)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};