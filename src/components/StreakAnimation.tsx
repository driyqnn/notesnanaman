import React, { useEffect, useState, useCallback } from 'react';
import { Flame, Trophy, Star, Zap, Crown, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface StreakAnimationProps {
  streak: number;
  onComplete: () => void;
}

export const StreakAnimation: React.FC<StreakAnimationProps> = ({ streak, onComplete }) => {
  const [showAnimation, setShowAnimation] = useState(true);
  const [isExploding, setIsExploding] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    // Start confetti immediately
    setShowConfetti(true);
    
    // Start explosion effect after slight delay
    const explosionTimer = setTimeout(() => {
      setIsExploding(true);
    }, 300);

    // Auto-close after 6 seconds
    const timer = setTimeout(() => {
      setShowAnimation(false);
      setTimeout(onComplete, 800);
    }, 6000);

    return () => {
      clearTimeout(timer);
      clearTimeout(explosionTimer);
    };
  }, [onComplete]);

  const handleCardClick = useCallback(() => {
    setClickCount(prev => prev + 1);
    setIsExploding(true);
    
    // Create ripple effect
    const ripples = document.querySelectorAll('.ripple-effect');
    ripples.forEach(ripple => {
      ripple.classList.remove('animate-ping');
      setTimeout(() => ripple.classList.add('animate-ping'), 10);
    });
  }, []);

  const getStreakMessage = () => {
    if (streak >= 30) return "🔥 LEGENDARY STREAK! 🔥";
    if (streak >= 14) return "⚡ EPIC STREAK! ⚡";
    if (streak >= 7) return "🌟 AMAZING STREAK! 🌟";
    if (streak >= 3) return "🚀 GREAT STREAK! 🚀";
    return "✨ NEW STREAK! ✨";
  };

  const getStreakColor = () => {
    if (streak >= 30) return "from-purple-500 via-pink-500 to-red-500";
    if (streak >= 14) return "from-blue-500 via-purple-500 to-pink-500";
    if (streak >= 7) return "from-orange-500 via-red-500 to-pink-500";
    if (streak >= 3) return "from-yellow-500 via-orange-500 to-red-500";
    return "from-green-500 via-blue-500 to-purple-500";
  };

  if (!showAnimation) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-out">
        <Card className="glass border-border animate-scale-out">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="relative">
                <Flame className="w-16 h-16 mx-auto text-orange-500 animate-bounce" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Keep it going!</h2>
                <p className="text-muted-foreground">
                  {streak} day{streak > 1 ? 's' : ''} streak earned!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center animate-fade-in">
      {/* Confetti Background */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-3 h-3 rounded-full animate-bounce`}
              style={{
                backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7'][i % 7],
                left: `${Math.random() * 100}%`,
                top: `-5%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                transform: `translateY(${100 + Math.random() * 20}vh) rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Main Card */}
      <Card 
        className={`glass border-border cursor-pointer transform transition-all duration-300 hover:scale-105 ${
          isExploding ? 'animate-pulse' : 'animate-scale-in'
        }`}
        onClick={handleCardClick}
      >
        <CardContent className="p-12 text-center relative overflow-hidden">
          {/* Ripple Effects */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`ripple-effect absolute inset-0 border-4 border-orange-400/20 rounded-lg ${
                  isExploding ? 'animate-ping' : ''
                }`}
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>

          <div className="space-y-8 relative z-10">
            {/* Animated Crown for high streaks */}
            {streak >= 7 && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                <Crown className={`w-12 h-12 text-yellow-500 animate-bounce`} />
              </div>
            )}

            {/* Main Fire Animation */}
            <div className="relative">
              <div className={`transform transition-all duration-500 ${isExploding ? 'scale-125' : 'scale-100'}`}>
                <div className="relative">
                  <Flame 
                    className={`w-32 h-32 mx-auto text-transparent bg-gradient-to-r ${getStreakColor()} bg-clip-text animate-pulse`}
                    style={{ 
                      filter: 'drop-shadow(0 0 20px rgba(255, 165, 0, 0.7))',
                      animation: 'bounce 1s infinite, pulse 2s infinite'
                    }}
                  />
                  
                  {/* Flame Particles */}
                  <div className="absolute inset-0 overflow-visible">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className={`absolute w-3 h-3 rounded-full ${
                          isExploding ? 'animate-ping' : 'animate-pulse'
                        }`}
                        style={{
                          backgroundColor: ['#ff6b35', '#f7931e', '#ffd23f', '#ff4757', '#ff3838'][i % 5],
                          left: `${30 + (i * 5)}%`,
                          top: `${20 + (i % 4 * 15)}%`,
                          animationDelay: `${i * 150}ms`,
                          animationDuration: `${1 + Math.random()}s`,
                          transform: `translate(${Math.sin(i) * 20}px, ${Math.cos(i) * 20}px)`
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Icons */}
              <div className="absolute inset-0 overflow-visible">
                <Star className="absolute -top-6 -right-8 w-8 h-8 text-yellow-400 animate-spin" />
                <Zap className="absolute -top-4 -left-10 w-6 h-6 text-blue-400 animate-bounce" />
                <Sparkles className="absolute -bottom-4 -right-6 w-7 h-7 text-purple-400 animate-pulse" />
                <Star className="absolute -bottom-6 -left-8 w-5 h-5 text-pink-400 animate-spin" style={{ animationDirection: 'reverse' }} />
              </div>
            </div>

            {/* Animated Message */}
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <Trophy className={`w-10 h-10 text-yellow-500 ${isExploding ? 'animate-bounce' : 'animate-pulse'}`} />
                <h1 className={`text-4xl font-bold bg-gradient-to-r ${getStreakColor()} bg-clip-text text-transparent animate-pulse`}>
                  {getStreakMessage()}
                </h1>
                <Trophy className={`w-10 h-10 text-yellow-500 ${isExploding ? 'animate-bounce' : 'animate-pulse'}`} />
              </div>
              
              {/* Streak Counter */}
              <div className="relative">
                <Badge 
                  variant="outline" 
                  className={`text-2xl px-8 py-4 bg-gradient-to-r ${getStreakColor()}/20 border-2 font-bold transform transition-all duration-300 ${
                    isExploding ? 'scale-110 animate-pulse' : 'scale-100'
                  }`}
                  style={{ 
                    borderColor: 'rgba(255, 165, 0, 0.5)',
                    boxShadow: '0 0 30px rgba(255, 165, 0, 0.3)'
                  }}
                >
                  <span className={`bg-gradient-to-r ${getStreakColor()} bg-clip-text text-transparent`}>
                    {streak} DAY{streak > 1 ? 'S' : ''} IN A ROW!
                  </span>
                </Badge>
              </div>

              <p className="text-lg text-muted-foreground animate-fade-in">
                {clickCount > 0 && "🎉 Click me for more fireworks! "}
                Keep visiting to maintain your streak! 🔥
              </p>
            </div>

            {/* Interactive Progress Bar */}
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Streak Power</div>
              <div className="w-full bg-muted/30 rounded-full h-4 overflow-hidden relative">
                <div 
                  className={`h-full bg-gradient-to-r ${getStreakColor()} rounded-full transition-all duration-1000 relative`}
                  style={{ 
                    width: `${Math.min(streak * 3.33, 100)}%`,
                    boxShadow: '0 0 20px rgba(255, 165, 0, 0.5)'
                  }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-slide-in-right" />
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {streak >= 30 ? "MAXIMUM POWER!" : `${Math.min(streak * 3.33, 100).toFixed(0)}% Power`}
              </div>
            </div>

            {/* Action Button */}
            <Button
              onClick={onComplete}
              className={`bg-gradient-to-r ${getStreakColor()} hover:scale-105 transform transition-all duration-300 text-white font-bold px-8 py-3 text-lg shadow-lg hover:shadow-xl`}
              style={{ boxShadow: '0 10px 30px rgba(255, 165, 0, 0.3)' }}
            >
              🚀 AWESOME! 🚀
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Click Counter Display */}
      {clickCount > 0 && (
        <div className="absolute top-8 right-8 animate-bounce">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            🎆 {clickCount} clicks!
          </Badge>
        </div>
      )}
    </div>
  );
};