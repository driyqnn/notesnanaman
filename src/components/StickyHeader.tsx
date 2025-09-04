import React, { useState } from 'react';
import { Search, Share, RefreshCw, Menu, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { VersionBadge } from './VersionBadge';
import { SearchWithSuggestions } from './SearchWithSuggestions';
import { WifiIndicator } from './WifiIndicator';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface StickyHeaderProps {
  currentPath: string;
  version?: string;
  changeCount?: number;
  hasUnreadChanges?: boolean;
  onWhatsNewClick: () => void;
  onRefresh: () => void;
  onSidebarToggle: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isRefreshing?: boolean;
  isOnline?: boolean;
}

export const StickyHeader: React.FC<StickyHeaderProps> = ({
  currentPath,
  version = '1.0.0',
  changeCount = 0,
  hasUnreadChanges = false,
  onWhatsNewClick,
  onRefresh,
  onSidebarToggle,
  searchQuery,
  onSearchChange,
  isRefreshing = false,
  isOnline = true
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyLink = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "Link copied",
        description: "Current view link copied to clipboard"
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy link to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = `Drive Explorer - ${currentPath}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url
        });
      } catch (error) {
        // User cancelled or share failed
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <motion.header 
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 backdrop-blur-md bg-background/95 border-b border-border"
    >
      <div className="flex items-center justify-between px-4 py-3 gap-4">
        {/* Left section */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSidebarToggle}
            className="lg:hidden"
          >
            <Menu className="w-4 h-4" />
          </Button>
          
          <div className="hidden sm:flex items-center gap-2">
            <WifiIndicator />
          </div>
        </div>

        {/* Center section - Search */}
        <div className="flex-1 max-w-md mx-4">
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search files and folders..."
            className="w-full"
          />
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="hidden sm:flex"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Share className="w-4 h-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>

          <VersionBadge
            version={version}
            changeCount={changeCount}
            hasUnreadChanges={hasUnreadChanges}
            onClick={onWhatsNewClick}
          />
        </div>
      </div>
    </motion.header>
  );
};