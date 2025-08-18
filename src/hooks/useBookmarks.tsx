import { useState, useEffect, useCallback } from 'react';
import { FileItem, FolderItem } from '../types/drive';

export interface BookmarkItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  dateAdded: string;
  driveLink: string;
  size?: number;
  mimeType?: string;
  pinned?: boolean;
}

const STORAGE_KEY = 'drive-explorer-bookmarks';

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    try {
      const savedBookmarks = localStorage.getItem(STORAGE_KEY);
      if (savedBookmarks) {
        const parsedBookmarks = JSON.parse(savedBookmarks);
        setBookmarks(parsedBookmarks);
        console.info('Bookmarks loaded from localStorage:', parsedBookmarks.length);
      }
    } catch (error) {
      console.error('Failed to load bookmarks from localStorage:', error);
    }
  }, []);

  // Save bookmarks to localStorage whenever they change and notify other instances
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
      window.dispatchEvent(new Event('bookmarks:updated'));
      console.info('Bookmarks saved to localStorage:', bookmarks.length);
    } catch (error) {
      console.error('Failed to save bookmarks to localStorage:', error);
    }
  }, [bookmarks]);

  // Sync across multiple hook instances (same tab) and other tabs
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        setBookmarks(saved ? JSON.parse(saved) : []);
      } catch (error) {
        console.error('Failed to sync bookmarks from localStorage:', error);
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) handleSync();
    };

    window.addEventListener('bookmarks:updated', handleSync);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('bookmarks:updated', handleSync);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const addBookmark = useCallback((item: FileItem | FolderItem, path: string) => {
    const bookmark: BookmarkItem = {
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

    setBookmarks(prev => {
      // Check if already bookmarked
      if (prev.some(f => f.id === item.id)) {
        return prev;
      }
      return [...prev, bookmark];
    });
  }, []);

  const removeBookmark = useCallback((itemId: string) => {
    setBookmarks(prev => prev.filter(f => f.id !== itemId));
  }, []);

  const toggleBookmark = useCallback((item: FileItem | FolderItem, path: string) => {
    const isBookmarked = bookmarks.some(f => f.id === item.id);
    if (isBookmarked) {
      removeBookmark(item.id);
    } else {
      addBookmark(item, path);
    }
  }, [bookmarks, addBookmark, removeBookmark]);

  const isBookmarked = useCallback((itemId: string) => {
    return bookmarks.some(f => f.id === itemId);
  }, [bookmarks]);

  const clearAllBookmarks = useCallback(() => {
    setBookmarks([]);
  }, []);

  return {
    bookmarks,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    isBookmarked,
    clearAllBookmarks,
  };
};