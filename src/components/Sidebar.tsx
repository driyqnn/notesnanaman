import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";

import { Link } from "react-router-dom";
import {
  Search,
  Folder,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  BarChart3,
  X,
  HardDrive,
  RefreshCw,
  Menu,
  Tag,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { DriveData, FileItem, FolderItem } from "../types/drive";
const VersionHistoryLazy = lazy(() => import('./VersionHistory').then(m => ({ default: m.VersionHistory })));
const FavoriteManagerLazy = lazy(() => import('./FavoriteManager').then(m => ({ default: m.FavoriteManager })));


import { useFavorites, FavoriteItem } from "../hooks/useFavorites";
import { useStreaks } from "../hooks/useStreaks";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  driveData: DriveData | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onNavigateToFolder?: (folderId: string, folderName: string) => void;
  onNavigateToFavorite?: (favorite: FavoriteItem) => void;
  onItemSelect?: (item: FileItem | FolderItem) => void;
}


export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onToggle,
  driveData,
  searchQuery,
  onSearchChange,
  onRefresh,
  isRefreshing,
  onNavigateToFolder,
  onNavigateToFavorite,
  onItemSelect,
}) => {
  const [versionHistory, setVersionHistory] = useState([]);
  const { favorites, removeFavorite, clearAllFavorites } = useFavorites();
  const { streakData, showStreak } = useStreaks();

  // Create a flat list of all items for search suggestions
  const allItems = useMemo(() => {
    if (!driveData?.data?.children) return [];

    const flattenItems = (
      items: (FileItem | FolderItem)[]
    ): (FileItem | FolderItem)[] => {
      const results: (FileItem | FolderItem)[] = [...items];

      for (const item of items) {
        if (item.type === "folder" && (item as FolderItem).children) {
          results.push(...flattenItems((item as FolderItem).children!));
        }
      }

      return results;
    };

    return flattenItems(driveData.data.children);
  }, [driveData]);

  const formatSize = (mb: number) => {
    if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

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
    // Refresh version history when drive data changes
    if (driveData) {
      setTimeout(loadVersionHistory, 1000);
    }
  }, [driveData]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}


      {/* Sidebar */}
      <aside
        id="sidebar"
        role="complementary"
        aria-label="Sidebar"
        className={`
        fixed lg:static inset-y-0 left-0 z-40 w-80 glass border-r border-border/30
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        flex flex-col h-dvh bg-background/95 backdrop-blur-xl
      `}>
        {/* Header */}
        <div className="p-4 border-b border-border/30 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-6 h-6 text-primary" />
              <h2 className="text-lg font-bold text-foreground"></h2>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                aria-label="Refresh data"
                title="Refresh data"
                drae-data-title="clicked refresh"
                className="text-muted-foreground hover:text-foreground hover:bg-accent/50">
                <div>
                  <RefreshCw className="w-4 h-4" />
                </div>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Close sidebar"
                title="Close sidebar"
                drae-data-title="toggled sidebar"
                drae-data-source="mobile"
                className="lg:hidden text-muted-foreground hover:text-foreground hover:bg-accent/50">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Search moved to global header */}
        </div>

        <ScrollArea id="sidebar-content" aria-label="Sidebar content" className="flex-1">
          <div className="p-4 space-y-4">
            {/* Dashboard */}
            <Card className="glass border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center space-x-2 text-foreground">
                  <BarChart3 className="w-4 h-4" />
                  <span>Dashboard</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {driveData?.stats && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        Total Files
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {driveData.stats.totalFiles.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        Total Folders
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {driveData.stats.totalFolders.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        Total Size
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {formatSize(driveData.stats.totalSizeMB)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        Last Scan
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(driveData.scan_date).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Drive Maintenance Streak */}
            {showStreak && streakData && (
              <Card className="glass border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center space-x-2 text-foreground">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span>Drive Maintenance Streak</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      Current Streak
                    </span>
                    <div className="flex items-center space-x-1">
                      <Flame className="w-3 h-3 text-orange-500" />
                      <span className="text-sm font-medium text-foreground">
                        {streakData.streak}{" "}
                        {streakData.streak === 1 ? "day" : "days"}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      Started
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(streakData.streakStart).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Favorites */}
            <Suspense fallback={<div className="text-xs text-muted-foreground">Loading favorites…</div>}>
              <FavoriteManagerLazy
                favorites={favorites}
                onRemoveFavorite={removeFavorite}
                onClearAll={clearAllFavorites}
                onNavigateToItem={(favorite) => {
                  if (favorite.type === "folder" && onNavigateToFolder) {
                    onNavigateToFolder(favorite.id, favorite.name);
                  } else if (favorite.type === "file" && onNavigateToFavorite) {
                    onNavigateToFavorite(favorite);
                  }
                  onClose();
                }}
              />
            </Suspense>

            {/* Version History */}
            <Suspense fallback={<div className="text-xs text-muted-foreground">Loading version history…</div>}>
              <VersionHistoryLazy
                versionHistory={versionHistory}
                rootFolder={driveData?.data}
                onNavigateToFolder={(id, name) => {
                  if (onNavigateToFolder) onNavigateToFolder(id, name);
                  onClose();
                }}
              />
            </Suspense>

            {/* Feedback Link */}
            <Card className="glass border-border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-1">
                    <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                      If you see something wrong or a mistake with problem sets, feel free to report it.
                    </p>
                    <Button 
                      asChild 
                      size="sm" 
                      variant="outline" 
                      className="h-8 w-full"
                    >
                      <Link 
                        to="/feedback" 
                        onClick={onClose}
                        className="inline-flex items-center justify-center space-x-1"
                      >
                        <span>Report Issue</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border/30 flex-shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            Developed by{" "}
            <a
              href="https://m.me/09sychicc"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary">
              @09sychic
            </a>
          </p>
        </div>
      </aside>
    </>
  );
};
