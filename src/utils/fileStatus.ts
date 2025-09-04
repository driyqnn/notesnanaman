
import { FileItem } from '@/types/drive';
import { SignatureComparison } from './fileSignature';

export interface FileStatusContext {
  signatureComparison?: SignatureComparison;
  previousScanDate?: string;
}

export const getFileStatus = (
  file: FileItem, 
  context?: FileStatusContext
): 'New' | 'Updated' | null => {
  // If we have signature comparison data, use it for more accurate detection
  if (context?.signatureComparison) {
    const { added, modified } = context.signatureComparison;
    
    if (added.includes(file.id)) {
      return 'New';
    }
    
    if (modified.includes(file.id)) {
      return 'Updated';
    }
    
    // If file is in unchanged list, check time-based criteria as fallback
  }
  
  // Fallback to time-based detection
  const now = new Date();
  const createdTime = new Date(file.createdTime);
  const modifiedTime = new Date(file.modifiedTime);
  
  const daysSinceCreated = Math.floor((now.getTime() - createdTime.getTime()) / (1000 * 60 * 60 * 24));
  const daysSinceModified = Math.floor((now.getTime() - modifiedTime.getTime()) / (1000 * 60 * 60 * 24));
  
  // Consider "New" if created within last 7 days
  if (daysSinceCreated <= 7) {
    return 'New';
  }
  
  // Consider "Updated" if modified within last 7 days and not new
  if (daysSinceModified <= 7 && daysSinceCreated > 7) {
    return 'Updated';
  }
  
  return null;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
