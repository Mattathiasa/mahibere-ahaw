import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface CardFlipProps {
    front: React.ReactNode;
    back: React.ReactNode;
}

export const CardFlip: React.FC<CardFlipProps> = ({ front, back }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div
            className="relative w-full h-full perspective-1000 cursor-pointer"
            onMouseEnter={() => setIsFlipped(true)}
            onMouseLeave={() => setIsFlipped(false)}
        >
            <motion.div
                className="relative w-full h-full transition-all duration-500 preserve-3d"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
            >
                <div className="absolute inset-0 backface-hidden">
                    {front}
                </div>
                <div
                    className="absolute inset-0 backface-hidden"
                    style={{ transform: 'rotateY(180deg)' }}
                >
                    {back}
                </div>
            </motion.div>
            <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>
        </div>
    );
};
