import { useState, useEffect, useCallback } from 'react';

interface StreakData {
  lastVisit: string;
  streak: number;
  streakStart: string;
}

export const useStreaks = () => {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [showStreak, setShowStreak] = useState(false);
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);

  // Get current date in PH timezone (UTC+8)
  const getCurrentPHDate = useCallback(() => {
    const now = new Date();
    const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // UTC+8
    return phTime.toISOString().split('T')[0]; // YYYY-MM-DD format
  }, []);

  // Calculate days difference
  const calculateDaysDiff = useCallback((date1: string, date2: string) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  }, []);

  // Update streak on visit
  const updateStreak = useCallback(() => {
    const today = getCurrentPHDate();
    const stored = localStorage.getItem('driveStreak');
    
    let currentStreak: StreakData;

    if (!stored) {
      // First visit
      currentStreak = {
        lastVisit: today,
        streak: 1,
        streakStart: today
      };
    } else {
      const parsed = JSON.parse(stored) as StreakData;
      const daysDiff = calculateDaysDiff(parsed.lastVisit, today);

      if (daysDiff === 1) {
        // Consecutive day visit - show animation for new streak
        const newStreak = parsed.streak + 1;
        currentStreak = {
          ...parsed,
          lastVisit: today,
          streak: newStreak
        };
        // Show animation for streak >= 2
        if (newStreak >= 2) {
          setShowStreakAnimation(true);
        }
      } else if (daysDiff === 0) {
        // Same day, no change
        currentStreak = parsed;
      } else {
        // Missed a day or more, reset streak
        currentStreak = {
          lastVisit: today,
          streak: 1,
          streakStart: today
        };
      }
    }

    localStorage.setItem('driveStreak', JSON.stringify(currentStreak));
    setStreakData(currentStreak);
    setShowStreak(currentStreak.streak >= 2);
  }, [getCurrentPHDate, calculateDaysDiff]);

  // Load streak data on mount
  useEffect(() => {
    updateStreak();
  }, [updateStreak]);

  return {
    streakData,
    showStreak,
    showStreakAnimation,
    setShowStreakAnimation,
    updateStreak
  };
};