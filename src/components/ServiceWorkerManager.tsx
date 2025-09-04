import { useEffect } from 'react';
import { useCustomToast } from './ToastManager';

export const ServiceWorkerManager = () => {
  const { addToast } = useCustomToast();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register service worker for offline capabilities
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available
                  addToast({
                    title: 'Update Available',
                    message: 'A new version is available. Refresh to update.',
                    type: 'info',
                    duration: 10000
                  });
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
          addToast({
            title: 'App Updated',
            message: 'Content has been cached for offline use.',
            type: 'success'
          });
        }
      });
    }
  }, [addToast]);

  return null;
};