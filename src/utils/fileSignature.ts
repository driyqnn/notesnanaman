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

// Create signatures for all files in a folder structure with path mapping
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

// Create path-to-signature mapping for better file change detection
export const createPathSignatures = (folder: FolderItem, path: string = ''): Record<string, { id: string; signature: string }> => {
  const pathSignatures: Record<string, { id: string; signature: string }> = {};
  
  for (const item of folder.children) {
    const itemPath = path ? `${path}/${item.name}` : item.name;
    
    if (item.type === 'file') {
      pathSignatures[itemPath] = {
        id: item.id,
        signature: createFileSignature(item as FileItem)
      };
    } else if (item.type === 'folder') {
      // Recursively process subfolders
      const subPathSignatures = createPathSignatures(item as FolderItem, itemPath);
      Object.assign(pathSignatures, subPathSignatures);
    }
  }
  
  return pathSignatures;
};

// Compare two signature sets to find differences
export interface SignatureComparison {
  added: string[];
  deleted: string[];
  modified: string[];
  unchanged: string[];
}

// Enhanced comparison that handles file ID changes better
export const compareSignaturesEnhanced = (
  oldPathSignatures: Record<string, { id: string; signature: string }>,
  newPathSignatures: Record<string, { id: string; signature: string }>,
  oldIdSignatures: Record<string, string>,
  newIdSignatures: Record<string, string>
): SignatureComparison => {
  const added: string[] = [];
  const deleted: string[] = [];
  const modified: string[] = [];
  const unchanged: string[] = [];

  const oldPaths = new Set(Object.keys(oldPathSignatures));
  const newPaths = new Set(Object.keys(newPathSignatures));
  const processedIds = new Set<string>();

  // Process files by path first to detect modifications with ID changes
  for (const path of newPaths) {
    const newFileInfo = newPathSignatures[path];
    
    if (oldPaths.has(path)) {
      const oldFileInfo = oldPathSignatures[path];
      
      if (oldFileInfo.signature !== newFileInfo.signature) {
        // File at same path but different signature = modified
        modified.push(newFileInfo.id);
      } else if (oldFileInfo.id === newFileInfo.id) {
        // Same ID and same signature = unchanged
        unchanged.push(newFileInfo.id);
      } else {
        // Same signature but different ID = file replaced but not changed
        unchanged.push(newFileInfo.id);
      }
      
      processedIds.add(oldFileInfo.id);
      processedIds.add(newFileInfo.id);
    } else {
      // New path = added file
      added.push(newFileInfo.id);
      processedIds.add(newFileInfo.id);
    }
  }

  // Find deleted files (paths that no longer exist)
  for (const path of oldPaths) {
    if (!newPaths.has(path)) {
      const oldFileInfo = oldPathSignatures[path];
      deleted.push(oldFileInfo.id);
      processedIds.add(oldFileInfo.id);
    }
  }

  // Handle any remaining IDs that weren't processed by path comparison
  const allOldIds = new Set(Object.keys(oldIdSignatures));
  const allNewIds = new Set(Object.keys(newIdSignatures));

  for (const id of allNewIds) {
    if (!processedIds.has(id)) {
      if (allOldIds.has(id)) {
        if (oldIdSignatures[id] !== newIdSignatures[id]) {
          modified.push(id);
        } else {
          unchanged.push(id);
        }
      } else {
        added.push(id);
      }
    }
  }

  for (const id of allOldIds) {
    if (!processedIds.has(id) && !allNewIds.has(id)) {
      deleted.push(id);
    }
  }

  return { added, deleted, modified, unchanged };
};

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
