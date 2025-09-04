import { useEffect } from 'react';
import { toast } from '@/components/ui/sonner';

interface DraeToastEvent extends CustomEvent {
  detail: {
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
  };
}

/**
 * Component to handle toast notifications from draeAnalytics
 */
export function DraeToastHandler() {
  useEffect(() => {
    const handleDraeToast = (event: DraeToastEvent) => {
      const { type, title, message } = event.detail;
      
      switch (type) {
        case 'success':
          toast.success(title, {
            description: message,
            position: 'top-right',
            duration: 4000,
          });
          break;
        case 'error':
          toast.error(title, {
            description: message,
            position: 'top-right',
            duration: 5000,
          });
          break;
        case 'warning':
          toast.warning(title, {
            description: message,
            position: 'top-right',
            duration: 4000,
          });
          break;
        case 'info':
        default:
          toast(title, {
            description: message,
            position: 'top-right',
            duration: 4000,
          });
          break;
      }
    };

    // Listen for custom draeToast events
    window.addEventListener('draeToast', handleDraeToast as EventListener);

    // Also expose the toast function globally for direct access
    (window as any).showToast = (params: { type: string; title: string; message?: string }) => {
      handleDraeToast({
        detail: params,
        type: 'draeToast'
      } as DraeToastEvent);
    };

    return () => {
      window.removeEventListener('draeToast', handleDraeToast as EventListener);
      delete (window as any).showToast;
    };
  }, []);

  return null; // This component doesn't render anything
}