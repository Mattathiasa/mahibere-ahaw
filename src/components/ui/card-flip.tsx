import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface CardFlipProps {
  front: React.ReactNode;
  back: React.ReactNode;
  className?: string;
}

export const CardFlip: React.FC<CardFlipProps> = ({ front, back, className = '' }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className={`relative w-full h-full cursor-pointer ${className}`}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <motion.div
        className="absolute inset-0 w-full h-full"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{ backfaceVisibility: "hidden" }}
        >
          {front}
        </div>
        
        {/* Back */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{ 
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
        >
          {back}
        </div>
      </motion.div>
    </div>
  );
};