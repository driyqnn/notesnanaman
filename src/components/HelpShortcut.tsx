import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Keyboard, HelpCircle } from 'lucide-react';

interface HelpShortcutProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { key: 'Shift + /', description: 'Open this help menu' },
  { key: 'Ctrl + K', description: 'Focus search (header)' },
  { key: 'Escape', description: 'Close modals/clear search' },
  { key: 'Enter', description: 'Open selected file/folder' },
  { key: 'Ctrl + R', description: 'Refresh data' },
  { key: 'Backspace', description: 'Go back to parent folder' },
];

export const HelpShortcut: React.FC<HelpShortcutProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md glass border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{shortcut.description}</span>
              <Badge variant="outline" className="font-mono text-xs">
                {shortcut.key}
              </Badge>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            <Keyboard className="w-3 h-3 inline mr-1" />
            Press <Badge variant="outline" className="mx-1 text-xs">Shift + /</Badge> anywhere to open this help
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const useHelpShortcut = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '?' && event.shiftKey) {
        event.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    openHelp: () => setIsOpen(true),
    closeHelp: () => setIsOpen(false)
  };
};