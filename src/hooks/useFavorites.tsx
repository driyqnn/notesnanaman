import { useState, useEffect, useCallback } from 'react';
import { FileItem, FolderItem } from '../types/drive';
import { useIndexedDB } from './useIndexedDB';

export interface FavoriteItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  dateAdded: string;
  driveLink: string;
  size?: number;
  mimeType?: string;
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const { getBookmarks, setBookmarks: saveFavorites, isInitialized } = useIndexedDB();

  // Load favorites from IndexedDB on mount
  useEffect(() => {
    if (!isInitialized) return;
    
    const loadFavorites = async () => {
      try {
        const savedFavorites = await getBookmarks();
        if (savedFavorites) {
          setFavorites(savedFavorites);
        }
      } catch (error) {
        console.error('Failed to load favorites:', error);
      }
    };

    loadFavorites();
  }, [isInitialized, getBookmarks]);

  // Save favorites to IndexedDB whenever they change (but not on initial load)
  useEffect(() => {
    if (!isInitialized) return;
    
    // Always save favorites to IndexedDB immediately
    const saveFavoritesData = async () => {
      try {
        await saveFavorites(favorites);
        console.log('Favorites saved to IndexedDB:', favorites.length);
      } catch (error) {
        console.error('Failed to save favorites:', error);
      }
    };
    
    saveFavoritesData();
  }, [favorites, isInitialized, saveFavorites]);

  const addFavorite = useCallback((item: FileItem | FolderItem, path: string) => {
    const favorite: FavoriteItem = {
      id: item.id,
      name: item.name,
      type: item.type,
      path,
      dateAdded: new Date().toISOString(),
      driveLink: item.driveLink,
      ...(item.type === 'file' && {
        size: (item as FileItem).size.bytes,
        mimeType: (item as FileItem).mimeType,
      }),
    };

    setFavorites(prev => {
      // Check if already favorited
      if (prev.some(f => f.id === item.id)) {
        return prev;
      }
      return [...prev, favorite];
    });
  }, []);

  const removeFavorite = useCallback((itemId: string) => {
    setFavorites(prev => prev.filter(f => f.id !== itemId));
  }, []);

  const toggleFavorite = useCallback((item: FileItem | FolderItem, path: string) => {
    const isFavorited = favorites.some(f => f.id === item.id);
    if (isFavorited) {
      removeFavorite(item.id);
    } else {
      addFavorite(item, path);
    }
  }, [favorites, addFavorite, removeFavorite]);

  const isFavorited = useCallback((itemId: string) => {
    return favorites.some(f => f.id === itemId);
  }, [favorites]);

  const clearAllFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorited,
    clearAllFavorites,
  };
};