import { useState, useEffect, useCallback } from 'react';
import { DriveData, ScanHistory } from '../types/drive';

interface DatabaseStores {
  driveData: string;
  scanHistory: string;
  fileSignatures: string;
}

const DB_CONFIG = {
  name: 'DriveExplorerDB',
  version: 4,
  stores: {
    driveData: 'driveData',
    scanHistory: 'scanHistory', 
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
        
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains(DB_CONFIG.stores.driveData)) {
          db.createObjectStore(DB_CONFIG.stores.driveData);
        }
        if (!db.objectStoreNames.contains(DB_CONFIG.stores.scanHistory)) {
          db.createObjectStore(DB_CONFIG.stores.scanHistory);
        }
        if (!db.objectStoreNames.contains(DB_CONFIG.stores.fileSignatures)) {
          db.createObjectStore(DB_CONFIG.stores.fileSignatures);
        }
      };
    });
  }

  async setItem<T>(storeName: string, key: string, value: T): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value, key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getItem<T>(storeName: string, key: string): Promise<T | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async clear(storeName: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export const useIndexedDB = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [dbManager] = useState(() => new IndexedDBManager());

  useEffect(() => {
    const initDB = async () => {
      try {
        await dbManager.init();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
      }
    };

    initDB();
  }, [dbManager]);

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
    setFileSignatures,
    getFileSignatures,
    clearAllData,
  };
};