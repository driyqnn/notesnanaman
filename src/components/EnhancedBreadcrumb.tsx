import React, { useState } from 'react';
import { ChevronRight, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface BreadcrumbItem {
  name: string;
  path: string;
}

interface EnhancedBreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (path: string) => void;
  className?: string;
}

export const EnhancedBreadcrumb: React.FC<EnhancedBreadcrumbProps> = ({
  items,
  onNavigate,
  className = ''
}) => {
  const [copied, setCopied] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [showFullPath, setShowFullPath] = useState(false);
  const { toast } = useToast();

  const fullPath = items.map(item => item.name).join(' / ');

  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(fullPath);
      setCopied(true);
      toast({
        title: "Path copied",
        description: "Folder path copied to clipboard"
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy path to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleTouchStart = () => {
    const timer = setTimeout(() => {
      setShowFullPath(true);
      setTimeout(() => setShowFullPath(false), 3000);
    }, 500);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <nav 
        className="flex items-center gap-1 flex-1 min-w-0"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        {items.map((item, index) => (
          <React.Fragment key={item.path}>
            {index > 0 && (
              <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate(item.path)}
              className={`
                px-2 py-1 h-auto text-sm font-medium transition-colors
                ${index === items.length - 1 
                  ? 'text-foreground cursor-default' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }
                ${showFullPath ? 'bg-accent' : ''}
              `}
              disabled={index === items.length - 1}
            >
              <span className="truncate max-w-[120px] sm:max-w-[200px]">
                {item.name}
              </span>
            </Button>
          </React.Fragment>
        ))}
      </nav>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopyPath}
        className="ml-2 h-6 w-6 p-0 flex-shrink-0"
        title="Copy path"
      >
        {copied ? (
          <Check className="w-3 h-3 text-green-500" />
        ) : (
          <Copy className="w-3 h-3" />
        )}
      </Button>

      {/* Full path overlay for mobile long-press */}
      {showFullPath && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute top-full left-0 right-0 bg-popover border border-border rounded-md p-2 text-xs text-foreground z-10 shadow-lg"
        >
          {fullPath}
        </motion.div>
      )}
    </div>
  );
};