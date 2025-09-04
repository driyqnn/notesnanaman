import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DynamicThemeEngineProps {
  subject?: string;
  fileTypes?: string[];
  isActive?: boolean;
}

const THEME_PATTERNS = {
  math: {
    background: `
      radial-gradient(circle at 20% 80%, rgba(243, 156, 18, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(52, 152, 219, 0.05) 0%, transparent 50%),
      linear-gradient(135deg, transparent 0%, rgba(231, 76, 60, 0.02) 100%)
    `,
    equations: ['∫', '∑', '∂', 'π', '∞', '≈', '≡', '∇'],
    gridPattern: true
  },
  science: {
    background: `
      radial-gradient(circle at 30% 70%, rgba(46, 204, 113, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 70% 30%, rgba(22, 160, 133, 0.05) 0%, transparent 50%),
      conic-gradient(from 45deg at 50% 50%, transparent 0deg, rgba(39, 174, 96, 0.03) 180deg, transparent 360deg)
    `,
    molecules: ['⚛', '🧬', '⚗', '🔬', '🧪', '⚡', '🌡', '🔋'],
    dnaHelix: true
  },
  literature: {
    background: `
      radial-gradient(ellipse at center, rgba(155, 89, 182, 0.03) 0%, transparent 70%),
      linear-gradient(45deg, rgba(142, 68, 173, 0.02) 0%, transparent 50%),
      repeating-linear-gradient(90deg, transparent, transparent 100px, rgba(233, 30, 99, 0.01) 101px)
    `,
    textParticles: ['📖', '✍', '📝', '📚', '🖋', '📄', '💭', '✨'],
    flowingText: true
  },
  engineering: {
    background: `
      linear-gradient(0deg, rgba(52, 73, 94, 0.02) 0%, transparent 100%),
      repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(149, 165, 166, 0.02) 21px, rgba(149, 165, 166, 0.02) 41px),
      repeating-linear-gradient(-45deg, transparent, transparent 20px, rgba(127, 140, 141, 0.02) 21px, rgba(127, 140, 141, 0.02) 41px)
    `,
    mechanical: ['⚙', '🔧', '🔩', '⚡', '🏗', '🛠', '⚒', '🔨'],
    blueprintGrid: true
  }
};

export const DynamicThemeEngine: React.FC<DynamicThemeEngineProps> = ({
  subject = 'default',
  fileTypes = [],
  isActive = true
}) => {
  const [activeSymbols, setActiveSymbols] = useState<Array<{
    id: string;
    symbol: string;
    x: number;
    y: number;
    delay: number;
  }>>([]);

  const theme = THEME_PATTERNS[subject as keyof typeof THEME_PATTERNS];

  // Generate floating symbols
  useEffect(() => {
    if (!theme || !isActive) {
      setActiveSymbols([]);
      return;
    }

    const symbols = ('equations' in theme ? theme.equations : 
                     'molecules' in theme ? theme.molecules : 
                     'textParticles' in theme ? theme.textParticles : 
                     'mechanical' in theme ? theme.mechanical : []);
    const newSymbols = Array.from({ length: 8 }, (_, i) => ({
      id: `symbol-${i}`,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3
    }));

    setActiveSymbols(newSymbols);
  }, [subject, isActive, theme]);

  if (!isActive || !theme) return null;

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      {/* Dynamic background */}
      <div
        className="absolute inset-0"
        style={{
          background: theme.background,
          mixBlendMode: 'multiply'
        }}
      />

      {/* Grid pattern for math/engineering */}
      {(('gridPattern' in theme && theme.gridPattern) || ('blueprintGrid' in theme && theme.blueprintGrid)) && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          <svg
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: 'blur(0.5px)' }}
          >
            <defs>
              <pattern
                id={`grid-${subject}`}
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  opacity="0.1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#grid-${subject})`} />
          </svg>
        </motion.div>
      )}

      {/* DNA Helix for science */}
      {'dnaHelix' in theme && theme.dnaHelix && (
        <motion.div
          className="absolute right-10 top-1/4 opacity-10"
          initial={{ scale: 0, rotate: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear",
            delay: 1 
          }}
        >
          <svg width="60" height="200" viewBox="0 0 60 200">
            {Array.from({ length: 10 }, (_, i) => (
              <g key={i} transform={`translate(30, ${20 + i * 18})`}>
                <motion.ellipse
                  cx="0"
                  cy="0"
                  rx="25"
                  ry="4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  opacity="0.3"
                  initial={{ rotateY: i * 36 }}
                  animate={{ rotateY: i * 36 + 360 }}
                  transition={{ 
                    duration: 10, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                />
              </g>
            ))}
          </svg>
        </motion.div>
      )}

      {/* Floating symbols */}
      <AnimatePresence>
        {activeSymbols.map((item) => (
          <motion.div
            key={item.id}
            className="absolute text-2xl opacity-20 select-none"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              color: 'hsl(var(--muted-foreground))'
            }}
            initial={{ 
              opacity: 0, 
              scale: 0,
              y: 50
            }}
            animate={{ 
              opacity: [0, 0.3, 0],
              scale: [0, 1, 0.8],
              y: [50, -50, -100],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              delay: item.delay,
              ease: "easeInOut"
            }}
          >
            {item.symbol}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Flowing text effect for literature */}
      {'flowingText' in theme && theme.flowingText && (
        <motion.div
          className="absolute inset-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 2 }}
        >
          {Array.from({ length: 3 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute text-sm opacity-5 whitespace-nowrap select-none"
              style={{
                left: '-100%',
                top: `${20 + i * 30}%`,
                color: 'hsl(var(--primary))'
              }}
              animate={{
                left: '100%'
              }}
              transition={{
                duration: 15 + i * 5,
                repeat: Infinity,
                ease: "linear",
                delay: i * 3
              }}
            >
              {Array.from({ length: 20 }, (_, j) => (
                <span key={j} className="mr-8">
                  {['In', 'the', 'beginning', 'was', 'the', 'Word', 'and', 'stories', 'flow', 'like', 'rivers'][j % 11]}
                </span>
              ))}
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};