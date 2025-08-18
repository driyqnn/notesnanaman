import { useState, useEffect, useCallback } from 'react';
import { DriveData, ScanHistory } from '../types/drive';

interface IndexedDBStore {
  name: string;
  version: number;
  stores: {
    driveData: string;
    scanHistory: string;
    bookmarks: string;
    fileSignatures: string;
  };
}

const DB_CONFIG: IndexedDBStore = {
  name: 'DriveExplorerDB',
  version: 1,
  stores: {
    driveData: 'driveData',
    scanHistory: 'scanHistory', 
    bookmarks: 'bookmarks',
    fileSignatures: 'fileSignatures'
  }
};

class IndexedDBManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains(DB_CONFIG.stores.driveData)) {
          db.createObjectStore(DB_CONFIG.stores.driveData);
        }
        if (!db.objectStoreNames.contains(DB_CONFIG.stores.scanHistory)) {
          db.createObjectStore(DB_CONFIG.stores.scanHistory);
        }
        if (!db.objectStoreNames.contains(DB_CONFIG.stores.bookmarks)) {
          db.createObjectStore(DB_CONFIG.stores.bookmarks);
        }
        if (!db.objectStoreNames.contains(DB_CONFIG.stores.fileSignatures)) {
          db.createObjectStore(DB_CONFIG.stores.fileSignatures);
        }
      };
    });
  }

  async setItem<T>(storeName: string, key: string, value: T): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value, key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getItem<T>(storeName: string, key: string): Promise<T | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async removeItem(storeName: string, key: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(storeName: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

const dbManager = new IndexedDBManager();

export const useIndexedDB = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    dbManager.init().then(() => {
      setIsInitialized(true);
    }).catch((error) => {
      console.error('Failed to initialize IndexedDB:', error);
    });
  }, []);

  const setDriveData = useCallback(async (data: DriveData) => {
    try {
      await dbManager.setItem(DB_CONFIG.stores.driveData, 'current', data);
    } catch (error) {
      console.error('Failed to save drive data:', error);
    }
  }, []);

  const getDriveData = useCallback(async (): Promise<DriveData | null> => {
    try {
      return await dbManager.getItem<DriveData>(DB_CONFIG.stores.driveData, 'current');
    } catch (error) {
      console.error('Failed to get drive data:', error);
      return null;
    }
  }, []);

  const setScanHistory = useCallback(async (history: ScanHistory[]) => {
    try {
      await dbManager.setItem(DB_CONFIG.stores.scanHistory, 'history', history);
    } catch (error) {
      console.error('Failed to save scan history:', error);
    }
  }, []);

  const getScanHistory = useCallback(async (): Promise<ScanHistory[] | null> => {
    try {
      return await dbManager.getItem<ScanHistory[]>(DB_CONFIG.stores.scanHistory, 'history');
    } catch (error) {
      console.error('Failed to get scan history:', error);
      return null;
    }
  }, []);

  const setBookmarks = useCallback(async (bookmarks: any[]) => {
    try {
      await dbManager.setItem(DB_CONFIG.stores.bookmarks, 'bookmarks', bookmarks);
    } catch (error) {
      console.error('Failed to save bookmarks:', error);
    }
  }, []);

  const getBookmarks = useCallback(async (): Promise<any[] | null> => {
    try {
      return await dbManager.getItem<any[]>(DB_CONFIG.stores.bookmarks, 'bookmarks');
    } catch (error) {
      console.error('Failed to get bookmarks:', error);
      return null;
    }
  }, []);

  const setFileSignatures = useCallback(async (signatures: Record<string, string>) => {
    try {
      await dbManager.setItem(DB_CONFIG.stores.fileSignatures, 'current', signatures);
    } catch (error) {
      console.error('Failed to save file signatures:', error);
    }
  }, []);

  const getFileSignatures = useCallback(async (): Promise<Record<string, string> | null> => {
    try {
      return await dbManager.getItem<Record<string, string>>(DB_CONFIG.stores.fileSignatures, 'current');
    } catch (error) {
      console.error('Failed to get file signatures:', error);
      return null;
    }
  }, []);

  const clearAllData = useCallback(async () => {
    try {
      await Promise.all([
        dbManager.clear(DB_CONFIG.stores.driveData),
        dbManager.clear(DB_CONFIG.stores.scanHistory),
        dbManager.clear(DB_CONFIG.stores.bookmarks),
        dbManager.clear(DB_CONFIG.stores.fileSignatures)
      ]);
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }, []);

  return {
    isInitialized,
    setDriveData,
    getDriveData,
    setScanHistory,
    getScanHistory,
    setBookmarks,
    getBookmarks,
    setFileSignatures,
    getFileSignatures,
    clearAllData,
  };
};