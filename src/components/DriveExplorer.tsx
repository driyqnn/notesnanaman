import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { FolderBrowser } from "./FolderBrowser";
import { WhatsNewModal } from "./WhatsNewModal";
import { ThemeProvider } from "./ThemeProvider";
import { SkeletonGrid } from "./SkeletonCard";
import { useIndexedDB } from "../hooks/useIndexedDB";
import { useCustomToast } from "./ToastManager";
import { StreakAnimation } from "./StreakAnimation";
import { SEOHead } from "./SEOHead";
import { useStreaks } from "../hooks/useStreaks";
import { Menu, X, HardDrive, Tag, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DriveData, ScanHistory, FileItem, FolderItem } from "../types/drive";
import { FavoriteItem } from "../hooks/useFavorites";
import { VersionBadge } from "./VersionBadge";
import { SearchWithSuggestions } from "./SearchWithSuggestions";

interface DriveExplorerProps { targetFileId?: string }
  
export const DriveExplorer: React.FC<DriveExplorerProps> = ({ targetFileId }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [driveData, setDriveDataState] = useState<DriveData | null>(null);
  const [scanHistory, setScanHistoryState] = useState<ScanHistory | null>(null);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("/");
  const [currentFolder, setCurrentFolder] = useState<FolderItem | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dataRefreshing, setDataRefreshing] = useState(false);
  const [highlightFileId, setHighlightFileId] = useState<string | null>(null);

  // If a targetFileId prop is provided, trigger highlight
  useEffect(() => {
    if (targetFileId) {
      setHighlightFileId(targetFileId);
    }
  }, [targetFileId]);
  // Streak functionality
  const { streakData, showStreakAnimation, setShowStreakAnimation } = useStreaks();

  // Removed toast functionality as requested

  // Online/offline detection
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  // Initialize particles.js with performance optimization
  useEffect(() => {
    const initializeParticles = () => {
      if (typeof window !== "undefined" && (window as any).particlesJS) {
        try {
          (window as any).particlesJS("particles-js", {
            particles: {
              number: {
                value: window.innerWidth < 768 ? 40 : 60, // Reduce particles on mobile
                density: {
                  enable: true,
                  value_area: 800,
                },
              },
              color: {
                value: "#ffffff",
              },
              shape: {
                type: "circle",
                stroke: {
                  width: 0,
                  color: "#000000",
                },
              },
              opacity: {
                value: 0.05,
                random: true,
                anim: {
                  enable: true,
                  speed: 0.3, // Slower animation for better performance
                  opacity_min: 0.01,
                  sync: false,
                },
              },
              size: {
                value: 2,
                random: true,
                anim: {
                  enable: true,
                  speed: 1,
                  size_min: 0.5,
                  sync: false,
                },
              },
              line_linked: {
                enable: true,
                distance: 100,
                color: "#ffffff",
                opacity: 0.015,
                width: 0.5,
              },
              move: {
                enable: true,
                speed: 0.5,
                direction: "none",
                random: true,
                straight: false,
                out_mode: "out",
                bounce: false,
                attract: {
                  enable: false, // Disable for better performance
                },
              },
            },
            interactivity: {
              detect_on: "canvas",
              events: {
                onhover: {
                  enable: !window.matchMedia('(pointer: coarse)').matches, // Disable on touch devices
                  mode: "grab",
                },
                onclick: {
                  enable: false, // Disable for better performance
                },
                resize: true,
              },
              modes: {
                grab: {
                  distance: 80,
                  line_linked: {
                    opacity: 0.05,
                  },
                },
              },
            },
            retina_detect: true,
          });
        } catch (error) {
          console.warn('Failed to initialize particles.js:', error);
        }
      }
    };

    // Check if particles.js is already loaded
    if ((window as any).particlesJS) {
      initializeParticles();
    } else {
      // Wait for particles.js to load
      const checkParticles = setInterval(() => {
        if ((window as any).particlesJS) {
          initializeParticles();
          clearInterval(checkParticles);
        }
      }, 100);

      // Cleanup after 5 seconds if particles.js doesn't load
      setTimeout(() => {
        clearInterval(checkParticles);
      }, 5000);
    }
  }, []);

  const {
    getDriveData,
    setDriveData,
    getScanHistory,
    setScanHistory,
    isInitialized
  } = useIndexedDB();

  // Load data from JSON files with IndexedDB caching
  const loadData = useCallback(async () => {
    if (!isInitialized) return;
    
    setLoading(true);
    setDataRefreshing(true);
    try {
      // Always fetch fresh data from network first
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const [dataResponse, changelogResponse] = await Promise.all([
        fetch("/data.json?" + Date.now(), { 
          signal: controller.signal,
          cache: 'no-store'
        }),
        fetch("/changelog.json?" + Date.now(), { 
          signal: controller.signal,
          cache: 'no-store'
        }),
      ]);

      clearTimeout(timeoutId);

      if (dataResponse.ok && changelogResponse.ok) {
        const [driveData, changelogData] = await Promise.all([
          dataResponse.json(),
          changelogResponse.json()
        ]);
        
        const scanHistoryData = changelogData.scan_history;

        // Save to IndexedDB for offline use
        await Promise.all([
          setDriveData(driveData),
          setScanHistory(scanHistoryData)
        ]);

        setDriveDataState(driveData);
        setScanHistoryState(Array.isArray(scanHistoryData) ? scanHistoryData[0] : scanHistoryData);
        setCurrentFolder(driveData.data);
        return;
      }

      // If network fails, try to load from IndexedDB
      const [cachedDriveData, cachedScanHistory] = await Promise.all([
        getDriveData(),
        getScanHistory()
      ]);

      if (cachedDriveData && cachedScanHistory) {
        setDriveDataState(cachedDriveData);
        setScanHistoryState(Array.isArray(cachedScanHistory) ? cachedScanHistory[0] : cachedScanHistory);
        setCurrentFolder(cachedDriveData.data);
      } else {
        throw new Error("No data available");
      }
    } catch (error) {
      console.error("Error loading data:", error);
      
      // Fallback to cached data
      try {
        const [cachedDriveData, cachedScanHistory] = await Promise.all([
          getDriveData(),
          getScanHistory()
        ]);

        if (cachedDriveData && cachedScanHistory) {
          setDriveDataState(cachedDriveData);
          setScanHistoryState(Array.isArray(cachedScanHistory) ? cachedScanHistory[0] : cachedScanHistory);
          setCurrentFolder(cachedDriveData.data);
        }
      } catch (cacheError) {
        console.error("Failed to load cached data:", cacheError);
      }
    } finally {
      setLoading(false);
      setDataRefreshing(false);
    }
  }, [isInitialized, getDriveData, getScanHistory, setDriveData, setScanHistory]);

  // Navigation functions
  const navigateToPath = useCallback(
    (path: string, folder: FolderItem) => {
      console.log("🔄 Navigating to path:", path, "folder:", folder.name);
      setCurrentPath(path);
      setCurrentFolder(folder);

      // Update URL parameters with dashes instead of spaces, avoid encoding slashes
      const url = new URL(window.location.href);
      if (path === '/') {
        url.searchParams.delete("path");
      } else {
        const urlPath = path.slice(1, -1).split('/').map(part => 
          part.toLowerCase().replace(/\s+/g, '-')
        ).join('/');
        url.searchParams.set("path", urlPath);
      }
      
      // Use replaceState to avoid URL encoding issues
      const newUrl = url.toString().replace(/%2F/g, '/');
      window.history.pushState({}, "", newUrl);
    },
    []
  );

  const navigateToFolder = useCallback(
    (folderId: string, folderName: string, targetFileId?: string) => {
      console.log(
        "🔄 Navigate to folder called with ID:",
        folderId,
        "Name:",
        folderName,
        targetFileId ? `Target file: ${targetFileId}` : ""
      );

      if (!driveData?.data) {
        console.error("❌ No drive data available");
        return;
      }

      // Enhanced recursive folder finding function
      const findFolderWithPath = (
        items: (FileItem | FolderItem)[],
        targetId: string,
        basePath: string = ""
      ): { folder: FolderItem; path: string } | null => {
        console.log(
          "🔍 Searching in items:",
          items.length,
          "items, basePath:",
          basePath
        );

        for (const item of items) {
          if (item.type === "folder") {
            const folder = item as FolderItem;
            const itemPath =
              basePath === "/"
                ? `/${folder.name}/`
                : `${basePath}${folder.name}/`;

            console.log(
              "🔍 Checking folder:",
              folder.name,
              "ID:",
              folder.id,
              "Path:",
              itemPath
            );

            if (folder.id === targetId) {
              console.log(
                "✅ Found target folder:",
                folder.name,
                "at path:",
                itemPath
              );
              return { folder, path: itemPath };
            }

            // Recursively search in children if they exist
            if (folder.children && folder.children.length > 0) {
              console.log(
                "🔍 Searching in children of:",
                folder.name,
                "children count:",
                folder.children.length
              );
              const found = findFolderWithPath(
                folder.children,
                targetId,
                itemPath
              );
              if (found) {
                console.log("✅ Found in children of:", folder.name);
                return found;
              }
            }
          }
        }

        console.log("❌ Not found in current level, basePath:", basePath);
        return null;
      };

      // Start the search from the root
      console.log(
        "🔍 Starting search from root with",
        driveData.data.children?.length || 0,
        "children"
      );
      const result = findFolderWithPath(
        driveData.data.children || [],
        folderId,
        "/"
      );

      if (result) {
        console.log(
          "✅ Successfully found folder, navigating to:",
          result.path
        );
        navigateToPath(result.path, result.folder);
        if (targetFileId) {
          setHighlightFileId(targetFileId);
        }
      } else {
        console.error("❌ Folder not found with ID:", folderId);
        console.log("🔍 Available folders at root level:");
        driveData.data.children?.forEach((child, index) => {
          if (child.type === "folder") {
            console.log(`  ${index + 1}. ${child.name} (ID: ${child.id})`);
          }
        });

        console.error("Folder not found:", folderName);
      }
    },
    [driveData, navigateToPath]
  );

  const goBack = useCallback(() => {
    console.log("🔙 Going back from path:", currentPath);

    if (currentPath === "/") {
      console.log("📍 Already at root, cannot go back");
      return;
    }

    const pathParts = currentPath.split("/").filter(Boolean);
    pathParts.pop(); // Remove last folder
    const newPath = pathParts.length > 0 ? `/${pathParts.join("/")}/` : "/";

    console.log("🔙 New path will be:", newPath);

    // Navigate back to parent folder
    if (newPath === "/" && driveData?.data) {
      console.log("🏠 Navigating back to root");
      navigateToPath("/", driveData.data);
    } else {
      // Find parent folder by reconstructing the path
      const findFolderByPath = (
        items: (FileItem | FolderItem)[],
        targetPath: string,
        basePath: string = ""
      ): FolderItem | null => {
        for (const item of items) {
          if (item.type === "folder") {
            const folder = item as FolderItem;
            const itemPath =
              basePath === "/"
                ? `/${folder.name}/`
                : `${basePath}${folder.name}/`;

            if (itemPath === targetPath) {
              return folder;
            }

            if (folder.children && folder.children.length > 0) {
              const found = findFolderByPath(
                folder.children,
                targetPath,
                itemPath
              );
              if (found) return found;
            }
          }
        }
        return null;
      };

      const parentFolder = findFolderByPath(
        driveData?.data?.children || [],
        newPath,
        "/"
      );
      if (parentFolder) {
        console.log("✅ Found parent folder, navigating back");
        navigateToPath(newPath, parentFolder);
      } else {
        console.error("❌ Could not find parent folder for path:", newPath);
        // Fallback to root
        if (driveData?.data) {
          navigateToPath("/", driveData.data);
        }
      }
    }
  }, [currentPath, driveData, navigateToPath]);

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = useCallback((path: string) => {
    console.log("🍞 Breadcrumb clicked for path:", path);
    
    if (path === "/" && driveData?.data) {
      navigateToPath("/", driveData.data);
      return;
    }

    // Find the folder for this path
    const findFolderByPath = (
      items: (FileItem | FolderItem)[],
      targetPath: string,
      basePath: string = ""
    ): FolderItem | null => {
      for (const item of items) {
        if (item.type === "folder") {
          const folder = item as FolderItem;
          const itemPath = basePath === "/" ? `/${folder.name}/` : `${basePath}${folder.name}/`;

          if (itemPath === targetPath) {
            return folder;
          }

          if (folder.children && folder.children.length > 0) {
            const found = findFolderByPath(folder.children, targetPath, itemPath);
            if (found) return found;
          }
        }
      }
      return null;
    };

    const targetFolder = findFolderByPath(driveData?.data?.children || [], path, "/");
    if (targetFolder) {
      navigateToPath(path, targetFolder);
    } else {
      console.error("❌ Could not find folder for breadcrumb path:", path);
    }
  }, [driveData, navigateToPath]);

  // Handle URL parameter changes
  useEffect(() => {
    const convertUrlPathToInternalPath = (urlPath: string): string => {
      if (!urlPath || urlPath === "/") return "/";
      // Convert dashes back to spaces and add leading/trailing slashes
      const parts = urlPath.split('/').filter(Boolean);
      const convertedParts = parts.map(part => part.replace(/-/g, ' '));
      return "/" + convertedParts.join('/') + "/";
    };

    const handlePopState = () => {
      const url = new URL(window.location.href);
      const urlPath = url.searchParams.get("path") || "/";
      const internalPath = convertUrlPathToInternalPath(urlPath);
      setCurrentPath(internalPath);
    };

    window.addEventListener("popstate", handlePopState);

    // Check for initial path parameter
    const url = new URL(window.location.href);
    const initialUrlPath = url.searchParams.get("path");
    if (initialUrlPath && initialUrlPath !== "/") {
      const initialInternalPath = convertUrlPathToInternalPath(initialUrlPath);
      setCurrentPath(initialInternalPath);
    }

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Load version history
  useEffect(() => {
    const loadVersionHistory = async () => {
      try {
        const response = await fetch("/changelog.json");
        if (response.ok) {
          const data = await response.json();
          setVersionHistory(data.version_history || []);
        }
      } catch (error) {
        console.log("Version history not available:", error);
      }
    };

    loadVersionHistory();
  }, []);

  // Removed URL sync for What's New modal to open instantly


  // Handle what's new modal open/close without URL param to avoid delay
  const handleWhatsNewOpen = useCallback(() => {
    setWhatsNewOpen(true);
  }, []);

  const handleWhatsNewClose = useCallback(() => {
    setWhatsNewOpen(false);
  }, []);

  // Keyboard shortcuts: '/' focuses search, Shift/Ctrl/Cmd+W or F1 opens What's New
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Focus search
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('focus-search'));
      }
      // Open What's New
      const key = e.key.toLowerCase();
      if ((key === 'w' && (e.shiftKey || e.ctrlKey || e.metaKey)) || e.key === 'F1') {
        e.preventDefault();
        handleWhatsNewOpen();
      }
      // Close on Escape when open
      if (e.key === 'Escape' && whatsNewOpen) {
        handleWhatsNewClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleWhatsNewOpen, handleWhatsNewClose, whatsNewOpen]);
  // Load data on component mount
  useEffect(() => {
    if (isInitialized) {
      loadData();
    }
  }, [isInitialized, loadData]);

  // Navigate to initial path from URL after data loads
  useEffect(() => {
    if (!driveData?.data) return;

    const url = new URL(window.location.href);
    const urlPath = url.searchParams.get("path");
    
    if (urlPath && urlPath !== "/") {
      console.log("🌐 Initial URL path detected:", urlPath);
      
      // Convert URL path format (dash-separated) to internal path format (space-separated)
      const convertUrlPathToInternalPath = (urlPath: string): string => {
        if (!urlPath || urlPath === "/") return "/";
        const parts = urlPath.split('/').filter(Boolean);
        const convertedParts = parts.map(part => part.replace(/-/g, ' '));
        return "/" + convertedParts.join('/') + "/";
      };

      const targetPath = convertUrlPathToInternalPath(urlPath);
      console.log("🎯 Converting URL path to internal path:", urlPath, "->", targetPath);

      // Find the folder at this path
      const findFolderByPath = (
        items: (FileItem | FolderItem)[],
        searchPath: string,
        basePath: string = ""
      ): FolderItem | null => {
        for (const item of items) {
          if (item.type === "folder") {
            const folder = item as FolderItem;
            const itemPath = basePath === "/" ? `/${folder.name}/` : `${basePath}${folder.name}/`;

            if (itemPath === searchPath) {
              return folder;
            }

            if (folder.children && folder.children.length > 0) {
              const found = findFolderByPath(folder.children, searchPath, itemPath);
              if (found) return found;
            }
          }
        }
        return null;
      };

      const targetFolder = findFolderByPath(driveData.data.children || [], targetPath, "/");
      
      if (targetFolder) {
        console.log("✅ Found target folder, navigating to:", targetPath);
        navigateToPath(targetPath, targetFolder);
      } else {
        console.log("❌ Target folder not found for path:", targetPath);
        // Stay at root if path not found
        navigateToPath("/", driveData.data);
      }
    }
  }, [driveData, navigateToPath]);

  // URL param: target=FILE_ID -> navigate to parent folder and highlight
  useEffect(() => {
    const target = searchParams.get('target');
    if (!target || !driveData?.data) return;

    // Find file and its parent folder path
    const root = driveData.data;

    const searchFolder = (folder: FolderItem, path: string): { file: FileItem; parent: FolderItem; path: string } | null => {
      for (const child of folder.children || []) {
        if (child.type === 'file') {
          if ((child as FileItem).id === target) {
            return { file: child as FileItem, parent: folder, path };
          }
        } else if (child.type === 'folder') {
          const sub = child as FolderItem;
          const nextPath = path === '/' ? `/${sub.name}/` : `${path}${sub.name}/`;
          const found = searchFolder(sub, nextPath);
          if (found) return found;
        }
      }
      return null;
    };

    let result: { file: FileItem; parent: FolderItem; path: string } | null = null;

    // Check root level files first
    for (const child of root.children || []) {
      if (child.type === 'file' && (child as FileItem).id === target) {
        result = { file: child as FileItem, parent: root, path: '/' };
        break;
      }
    }

    if (!result) {
      result = searchFolder(root, '/');
    }

    if (result) {
      if (result.path !== currentPath || currentFolder?.id !== result.parent.id) {
        navigateToPath(result.path, result.parent);
      }
      setHighlightFileId(target);

      // Remove the target param to prevent retriggering
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('target');
      setSearchParams(newParams);
    }
  }, [searchParams, driveData, currentPath, currentFolder, navigateToPath, setSearchParams]);

  // Filter files based on search and type
  const filteredFiles = useCallback(
    (items: (FileItem | FolderItem)[]) => {
      return items.filter((item) => {
        // Search filter
        if (
          searchQuery &&
          !item.name.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }


        return true;
      });
    },
    [searchQuery]
  );

  // Refresh data function
  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);

  // Handle file click to open directly in Google Drive
  const handleFileClick = useCallback(
    (file: FileItem) => {
      window.open(file.driveLink, "_blank");
    },
    []
  );

  // Handle favorite navigation for files
  const handleFavoriteNavigation = useCallback((favorite: FavoriteItem) => {
    if (favorite.type === 'file') {
      // For files, just open the drive link
      window.open(favorite.driveLink, '_blank');
    }
  }, []);

  // After navigating to a folder or when a target file is provided, scroll to and animate the target file
  useEffect(() => {
    if (!highlightFileId) return;
    const scrollTimer = setTimeout(() => {
      const el = document.querySelector(`[data-file-id="${highlightFileId}"]`) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);

    // Keep highlight active longer so it's noticeable
    const clearTimer = setTimeout(() => {
      setHighlightFileId(null);
    }, 9000);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [currentFolder, highlightFileId]);

  return (
    <ThemeProvider>
      <div className="min-h-dvh bg-background text-foreground relative overflow-hidden">
        {/* Particles background */}
        <div
          id="particles-js"
          className="fixed inset-0 pointer-events-none z-0"></div>

        {/* Mobile Header - removed, only hamburger remains through sidebar */}

        <div className="flex w-full min-h-screen min-h-dvh relative">

          {/* Sidebar */}
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            driveData={driveData}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            
            onRefresh={refreshData}
            isRefreshing={loading}
            onNavigateToFolder={navigateToFolder}
            onNavigateToFavorite={handleFavoriteNavigation}
            onItemSelect={(item) => {
              if (item.type === 'file') {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('target', item.id);
                setSearchParams(newParams);
              } else if (item.type === 'folder') {
                navigateToFolder(item.id, item.name);
              }
            }}
          />

          {/* SEO Head */}
          <SEOHead 
            currentFolder={currentFolder}
            currentPath={currentPath}
            totalFiles={driveData?.stats?.totalFiles}
            totalFolders={driveData?.stats?.totalFolders}
            children={currentFolder?.children}
          />

          {/* Main Content */}
          <main className="flex-1 flex flex-col relative overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              {/* Sticky Header: Menu, Search, Version */}
              <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/95 backdrop-blur-md shadow-sm">
                <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 flex items-center gap-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    aria-label="Toggle menu"
                    className="flex-shrink-0"
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                </motion.div>
                <motion.div 
                  className="flex-1"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <SearchWithSuggestions
                    searchQuery={headerSearchQuery}
                    onSearchChange={setHeaderSearchQuery}
                    allItems={driveData?.data?.children || []}
                    onItemSelect={(item) => {
                      if (item.type === 'folder') {
                        navigateToFolder(item.id, item.name);
                      } else {
                        const newParams = new URLSearchParams(searchParams);
                        newParams.set('target', item.id);
                        setSearchParams(newParams);
                      }
                    }}
                    placeholder="Search files and folders..."
                  />
                </motion.div>
                {driveData?.version && (
                  <motion.div 
                    className="flex-shrink-0"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.2 }}
                  >
                    <VersionBadge
                      version={driveData.version}
                      changeCount={scanHistory?.changes?.total_changes || 0}
                      onClick={handleWhatsNewOpen}
                    />
                  </motion.div>
                )}
                </div>
              </header>

              {/* Folder Browser */}
              <div className="flex-1 w-full">
              {loading ? (
                <div className="p-4 sm:p-6 space-y-6">
                  {/* Header skeleton */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                        <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
                      </div>
                      <div className="h-6 w-20 bg-muted animate-pulse rounded-full"></div>
                    </div>
                    <div className="h-4 w-96 bg-muted animate-pulse rounded"></div>
                    {/* Breadcrumb skeleton */}
                    <div className="bg-card/30 rounded-lg p-3 space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
                        <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
                        <div className="h-6 w-24 bg-muted animate-pulse rounded"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Folders section skeleton */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="h-5 w-5 bg-muted animate-pulse rounded"></div>
                      <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
                      <div className="h-5 w-8 bg-muted animate-pulse rounded-full"></div>
                    </div>
                    <SkeletonGrid count={6} type="folder" />
                  </div>
                  
                  {/* Files section skeleton */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="h-5 w-5 bg-muted animate-pulse rounded"></div>
                      <div className="h-6 w-12 bg-muted animate-pulse rounded"></div>
                      <div className="h-5 w-8 bg-muted animate-pulse rounded-full"></div>
                    </div>
                    <SkeletonGrid count={12} type="file" />
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPath}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    <FolderBrowser
                      currentFolder={currentFolder}
                      currentPath={currentPath}
                      filteredItems={
                        currentFolder ? currentFolder.children || [] : []
                      }
                      onFolderClick={navigateToFolder}
                      onFileClick={handleFileClick}
                      onBackClick={goBack}
                      onBreadcrumbClick={handleBreadcrumbClick}
                      canGoBack={currentPath !== "/"}
                      loading={false}
                      highlightFileId={highlightFileId}
                      lastScanAt={driveData?.scan_date || scanHistory?.scan_date}
                    />
                  </motion.div>
                </AnimatePresence>
              )}
              </div>
            </div>
          </main>
        </div>

        {/* What's New Modal */}
        <WhatsNewModal
          isOpen={whatsNewOpen}
          onClose={handleWhatsNewClose}
          scanHistory={scanHistory}
          versionHistory={versionHistory}
          rootFolder={driveData?.data}
          onNavigateToFolder={navigateToFolder}
        />

        {/* Streak Animation */}
        {showStreakAnimation && streakData && (
          <StreakAnimation 
            streak={streakData.streak} 
            onComplete={() => setShowStreakAnimation(false)} 
          />
        )}


      </div>
    </ThemeProvider>
  );
};
