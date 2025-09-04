import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export const WifiIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'moderate' | 'poor'>('good');

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    const measureConnectionSpeed = async () => {
      if (!navigator.onLine) {
        setConnectionQuality('poor');
        return;
      }

      try {
        const startTime = performance.now();
        await fetch('https://www.google.com/favicon.ico?' + Math.random(), {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache'
        });
        const endTime = performance.now();
        const duration = endTime - startTime;

        if (duration < 100) {
          setConnectionQuality('good');
        } else if (duration < 300) {
          setConnectionQuality('moderate');
        } else {
          setConnectionQuality('poor');
        }
      } catch {
        setConnectionQuality('poor');
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Measure connection quality every 30 seconds
    const interval = setInterval(measureConnectionSpeed, 30000);
    measureConnectionSpeed(); // Initial measurement

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  const getIndicatorColor = () => {
    if (!isOnline) return 'text-destructive';
    switch (connectionQuality) {
      case 'good': return 'text-green-500';
      case 'moderate': return 'text-yellow-500';
      case 'poor': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getTitle = () => {
    if (!isOnline) return 'No internet connection';
    switch (connectionQuality) {
      case 'good': return 'Good connection';
      case 'moderate': return 'Moderate connection';
      case 'poor': return 'Poor connection';
      default: return 'Unknown connection status';
    }
  };

  return (
    <div 
      className={cn(
        "flex items-center justify-center w-6 h-6 transition-colors",
        getIndicatorColor()
      )}
      title={getTitle()}
    >
      {isOnline ? (
        <Wifi className="w-4 h-4" />
      ) : (
        <WifiOff className="w-4 h-4" />
      )}
    </div>
  );
};