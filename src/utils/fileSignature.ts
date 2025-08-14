import { FileItem, FolderItem } from '@/types/drive';

// Simple hash function for creating file signatures
const simpleHash = (str: string): string => {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

// Create a signature for a file based on its properties
export const createFileSignature = (file: FileItem): string => {
  const signatureData = [
    file.name,
    file.size.bytes.toString(),
    file.mimeType,
    file.createdTime
  ].join('|');
  
  return simpleHash(signatureData);
};

// Create signatures for all files in a folder structure
export const createFolderSignatures = (folder: FolderItem, path: string = ''): Record<string, string> => {
  const signatures: Record<string, string> = {};
  
  for (const item of folder.children) {
    const itemPath = path ? `${path}/${item.name}` : item.name;
    
    if (item.type === 'file') {
      signatures[item.id] = createFileSignature(item as FileItem);
    } else if (item.type === 'folder') {
      // Recursively process subfolders
      const subSignatures = createFolderSignatures(item as FolderItem, itemPath);
      Object.assign(signatures, subSignatures);
    }
  }
  
  return signatures;
};

// Compare two signature sets to find differences
export interface SignatureComparison {
  added: string[];
  deleted: string[];
  modified: string[];
  unchanged: string[];
}

export const compareSignatures = (
  oldSignatures: Record<string, string>,
  newSignatures: Record<string, string>
): SignatureComparison => {
  const oldIds = new Set(Object.keys(oldSignatures));
  const newIds = new Set(Object.keys(newSignatures));
  
  const added: string[] = [];
  const deleted: string[] = [];
  const modified: string[] = [];
  const unchanged: string[] = [];
  
  // Find added files
  for (const id of newIds) {
    if (!oldIds.has(id)) {
      added.push(id);
    }
  }
  
  // Find deleted files
  for (const id of oldIds) {
    if (!newIds.has(id)) {
      deleted.push(id);
    }
  }
  
  // Find modified and unchanged files
  for (const id of newIds) {
    if (oldIds.has(id)) {
      if (oldSignatures[id] !== newSignatures[id]) {
        modified.push(id);
      } else {
        unchanged.push(id);
      }
    }
  }
  
  return { added, deleted, modified, unchanged };
};

// Create file map for easy lookup
export const createFileMap = (folder: FolderItem): Record<string, FileItem> => {
  const fileMap: Record<string, FileItem> = {};
  
  const processFolder = (currentFolder: FolderItem) => {
    for (const item of currentFolder.children) {
      if (item.type === 'file') {
        fileMap[item.id] = item as FileItem;
      } else if (item.type === 'folder') {
        processFolder(item as FolderItem);
      }
    }
  };
  
  processFolder(folder);
  return fileMap;
};
