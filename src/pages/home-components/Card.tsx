import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    enableTilt?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', enableTilt = true }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!enableTilt) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX: enableTilt ? rotateX : 0,
                rotateY: enableTilt ? rotateY : 0,
                transformStyle: "preserve-3d",
            }}
            className={`relative rounded-3xl p-8 bg-white/60 backdrop-blur-xl border border-[#2E5E99]/10 shadow-[0_8px_32px_0_rgba(46,94,153,0.1)] transition-all duration-300 hover:border-[#2E5E99]/20 group ${className}`}
        >
            <div style={{ transform: "translateZ(50px)" }}>
                {children}
            </div>
            {/* Glossy Reflection Overlay */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#E7F0FA]/50 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
    );
};
