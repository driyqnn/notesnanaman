import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tag } from 'lucide-react';

interface VersionBadgeProps {
  version: string;
  changeCount: number;
  hasUnreadChanges: boolean;
  onClick: () => void;
}

export const VersionBadge: React.FC<VersionBadgeProps> = ({ version, changeCount, hasUnreadChanges, onClick }) => {
  return (
    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
      <Button
        variant="outline"
        size="sm"
        onClick={onClick}
        className="relative bg-background/80 backdrop-blur-sm"
      >
        <Tag className="w-4 h-4 mr-1" />
        v{version}
        {hasUnreadChanges && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full"
          />
        )}
        {changeCount > 0 && (
          <motion.span
            key={changeCount}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="ml-2 inline-flex items-center justify-center px-1.5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs font-medium"
          >
            {changeCount > 9 ? '9+' : changeCount}
          </motion.span>
        )}
      </Button>
    </motion.div>
  );
};
