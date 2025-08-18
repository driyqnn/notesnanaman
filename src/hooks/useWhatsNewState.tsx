import { useState, useEffect } from 'react';

const STORAGE_KEY = 'whats_new_seen_versions';

interface WhatsNewState {
  isOpen: boolean;
  hasUnreadChanges: boolean;
  seenVersions: string[];
}

export const useWhatsNewState = (currentVersion?: string) => {
  const [state, setState] = useState<WhatsNewState>({
    isOpen: false,
    hasUnreadChanges: false,
    seenVersions: []
  });

  // Load seen versions from localStorage
  useEffect(() => {
    const loadSeenVersions = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const seenVersions = stored ? JSON.parse(stored) : [];
        
        // Load changelog to get the actual version
        let actualVersion = currentVersion;
        try {
          const response = await fetch('/changelog.json?' + Date.now());
          if (response.ok) {
            const data = await response.json();
            actualVersion = data.scan_history?.version || currentVersion;
          }
        } catch (error) {
          console.warn('Could not fetch changelog for version check:', error);
        }
        
        const hasUnreadChanges = actualVersion ? !seenVersions.includes(actualVersion) : false;
        
        setState(prev => ({
          ...prev,
          seenVersions,
          hasUnreadChanges,
          isOpen: hasUnreadChanges // Auto-open if there are unread changes
        }));
      } catch (error) {
        console.error('Error loading seen versions:', error);
      }
    };
    
    loadSeenVersions();
  }, [currentVersion]);

  const markVersionAsSeen = (version: string) => {
    try {
      const seenVersions = [...state.seenVersions];
      if (!seenVersions.includes(version)) {
        seenVersions.push(version);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seenVersions));
        setState(prev => ({
          ...prev,
          seenVersions,
          hasUnreadChanges: false
        }));
      }
    } catch (error) {
      console.error('Error saving seen version:', error);
    }
  };

  const openWhatsNew = () => {
    setState(prev => ({ ...prev, isOpen: true }));
  };

  const closeWhatsNew = async () => {
    setState(prev => ({ ...prev, isOpen: false }));
    
    // Get the actual version from changelog and mark it as seen
    try {
      const response = await fetch('/changelog.json?' + Date.now());
      if (response.ok) {
        const data = await response.json();
        const actualVersion = data.scan_history?.version;
        if (actualVersion) {
          markVersionAsSeen(actualVersion);
        }
      }
    } catch (error) {
      console.warn('Could not fetch changelog for marking as seen:', error);
      // Fallback to current version if available
      if (currentVersion) {
        markVersionAsSeen(currentVersion);
      }
    }
  };

  return {
    isOpen: state.isOpen,
    hasUnreadChanges: state.hasUnreadChanges,
    openWhatsNew,
    closeWhatsNew,
    markVersionAsSeen
  };
};