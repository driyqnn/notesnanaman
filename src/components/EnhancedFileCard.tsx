import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { FileIcon, FolderIcon, ExternalLinkIcon, DownloadIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EnhancedFileCardProps {
  name: string;
  type: 'file' | 'folder';
  size?: string;
  modified?: string;
  isPopular?: boolean;
  href?: string;
  downloadUrl?: string;
  subject?: string;
  fileExtension?: string;
  onClick?: () => void;
  onDoubleClick?: () => void;
  popularity?: number;
}

const SUBJECT_COLORS = {
  math: 'hsl(var(--primary))',
  science: 'hsl(var(--accent))',
  literature: 'hsl(var(--secondary))',
  engineering: 'hsl(var(--muted))',
  default: 'hsl(var(--border))'
};

const BREATHING_SCALE = {
  high: { scale: [1, 1.05, 1], duration: 2 },
  medium: { scale: [1, 1.03, 1], duration: 3 },
  low: { scale: [1, 1.01, 1], duration: 4 },
  none: { scale: 1, duration: 0 }
};

export const EnhancedFileCard: React.FC<EnhancedFileCardProps> = ({
  name,
  type,
  size,
  modified,
  isPopular = false,
  href,
  downloadUrl,
  subject = 'default',
  fileExtension,
  onClick,
  onDoubleClick,
  popularity = 0
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showAura, setShowAura] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  
  // Mouse position tracking for 3D effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-100, 100], [5, -5]);
  const rotateY = useTransform(mouseX, [-100, 100], [-5, 5]);

  // Determine breathing intensity based on popularity
  const breathingIntensity = popularity > 80 ? 'high' : 
                           popularity > 50 ? 'medium' : 
                           popularity > 20 ? 'low' : 'none';

  const subjectColor = SUBJECT_COLORS[subject as keyof typeof SUBJECT_COLORS] || SUBJECT_COLORS.default;

  // Handle mouse movement for 3D effect
  const handleMouseMove = (event: React.MouseEvent) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    mouseX.set(event.clientX - centerX);
    mouseY.set(event.clientY - centerY);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    setShowAura(true);
    controls.start({ 
      scale: 1.05,
      transition: { duration: 0.2 }
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowAura(false);
    mouseX.set(0);
    mouseY.set(0);
    controls.start({ 
      scale: 1,
      transition: { duration: 0.2 }
    });
  };

  // Breathing animation effect
  useEffect(() => {
    if (breathingIntensity !== 'none') {
      const breathing = BREATHING_SCALE[breathingIntensity];
      controls.start({
        scale: breathing.scale,
        transition: {
          duration: breathing.duration,
          repeat: Infinity,
          ease: "easeInOut"
        }
      });
    }
  }, [breathingIntensity, controls]);

  return (
    <motion.div
      ref={cardRef}
      className="relative group"
      animate={controls}
      style={{
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
        transformStyle: 'preserve-3d'
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {/* File Aura Effect */}
      <motion.div
        className="absolute inset-0 rounded-lg pointer-events-none"
        initial={{ opacity: 0, scale: 1 }}
        animate={{
          opacity: showAura ? 0.6 : 0,
          scale: showAura ? 1.1 : 1,
        }}
        transition={{ duration: 0.3 }}
        style={{
          background: `radial-gradient(circle, ${subjectColor}20 0%, transparent 70%)`,
          filter: 'blur(8px)',
          zIndex: -1
        }}
      />

      {/* Glow effect for popular files */}
      {isPopular && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          animate={{
            boxShadow: [
              `0 0 10px ${subjectColor}40`,
              `0 0 20px ${subjectColor}60`,
              `0 0 10px ${subjectColor}40`
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ zIndex: -1 }}
        />
      )}

      <Card className="relative h-full p-4 cursor-pointer transition-all duration-200 hover:shadow-lg border-border/50 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {type === 'folder' ? (
              <FolderIcon 
                className="h-5 w-5 text-blue-400 transition-transform duration-200 group-hover:scale-110" 
              />
            ) : (
              <motion.div
                whileHover={{ rotate: [0, -10, 10, -5, 0] }}
                transition={{ duration: 0.5 }}
              >
                <FileIcon 
                  className="h-5 w-5 text-muted-foreground" 
                  style={{ color: subjectColor }}
                />
              </motion.div>
            )}
            
            {isPopular && (
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  🔥
                </Badge>
              </motion.div>
            )}
          </div>

          <div className="flex gap-1">
            {href && (
              <motion.div
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <ExternalLinkIcon className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            )}
            {downloadUrl && (
              <motion.div
                whileHover={{ scale: 1.2, y: -2 }}
                whileTap={{ scale: 0.9 }}
              >
                <DownloadIcon className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            )}
          </div>
        </div>

        <motion.h3 
          className="font-medium text-sm mb-1 line-clamp-2 text-card-foreground group-hover:text-primary transition-colors"
          style={{
            textShadow: isHovered ? `0 0 8px ${subjectColor}40` : 'none'
          }}
        >
          {name}
        </motion.h3>

        <div className="text-xs text-muted-foreground space-y-1">
          {size && (
            <div className="flex items-center justify-between">
              <span>Size:</span>
              <span>{size}</span>
            </div>
          )}
          {modified && (
            <div className="flex items-center justify-between">
              <span>Modified:</span>
              <span>{modified}</span>
            </div>
          )}
          {fileExtension && (
            <Badge variant="outline" className="text-xs">
              {fileExtension.toUpperCase()}
            </Badge>
          )}
        </div>

        {/* Subject indicator */}
        {subject !== 'default' && (
          <motion.div
            className="absolute top-2 right-2 w-2 h-2 rounded-full"
            style={{ backgroundColor: subjectColor }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}

        {/* Popularity indicator */}
        {popularity > 0 && (
          <div className="absolute bottom-2 right-2">
            <motion.div
              className="flex gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {Array.from({ length: Math.min(3, Math.ceil(popularity / 33)) }, (_, i) => (
                <motion.div
                  key={i}
                  className="w-1 h-1 rounded-full bg-primary"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </motion.div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};