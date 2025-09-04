export interface FileSize {
  bytes: number;
  kb: number;
  mb: number;
  gb?: number;
}

export interface FileItem {
  name: string;
  id: string;
  type: 'file';
  mimeType: string;
  category: 'documents' | 'spreadsheets' | 'presentations' | 'images' | 'videos' | 'audio' | 'archives' | 'others';
  size: FileSize;
  driveLink: string;
  modifiedTime: string;
  createdTime: string;
  description?: string;
}

export interface FolderItem {
  name: string;
  id: string;
  type: 'folder';
  driveLink: string;
  description?: string;
  fileCount: number;
  folderCount: number;
  totalSizeMB: number;
  lastUpdated: string;
  children: (FileItem | FolderItem)[];
  fileTypes?: Record<string, number>;
  sizeDistribution?: {
    small: number;
    medium: number;
    large: number;
    huge: number;
  };
}

export interface DriveStats {
  totalFiles: number;
  totalFolders: number;
  totalSizeMB: number;
  apiCallsCount: number;
}

export interface DriveData {
  version: string;
  scan_date: string;
  scanner_version: string;
  changes: ChangeSet;
  stats: DriveStats;
  data: FolderItem;
}

export interface ChangeItem {
  id: string;
  name: string;
  size?: number;
  old_modified?: string;
  new_modified?: string;
  old_name?: string;
  old_size?: number;
  new_size?: number;
  change_type?: string;
}

export interface ChangeSet {
  added_files: ChangeItem[];
  deleted_files: ChangeItem[];
  modified_files: ChangeItem[];
  total_changes: number;
  summary: string;
}

export interface ScanHistory {
  version: string;
  scan_date: string;
  scanner_version: string;
  changes: ChangeSet;
  data: FolderItem;
  file_signatures: Record<string, any>;
  total_files: number;
  total_folders: number;
}

export type ItemType = FileItem | FolderItem;