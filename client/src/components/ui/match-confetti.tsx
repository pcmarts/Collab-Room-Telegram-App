import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

type ConfettiType = 'circle' | 'square' | 'triangle' | 'star';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  type: ConfettiType;
  delay: number;
  duration: number;
}

interface MatchConfettiProps {
  active: boolean;
  particleCount?: number;
  duration?: number;
  colors?: string[];
}

export function MatchConfetti({
  active,
  particleCount = 100,
  duration = 4000,
  colors = ['#FF5733', '#33FFC4', '#337DFF', '#F433FF', '#FFF633', '#33FF57', '#FFD700', '#FF00FF'],
}: MatchConfettiProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!active) {
      setConfetti([]);
      return;
    }

    // Generate confetti
    const newConfetti: ConfettiPiece[] = Array.from({ length: particleCount }).map((_, i) => {
      const types: ConfettiType[] = ['circle', 'square', 'triangle', 'star'];
      return {
        id: i,
        x: Math.random() * 100, // 0-100%
        y: -10, // Start slightly above the screen
        size: Math.random() * 12 + 4, // 4-16px
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        type: types[Math.floor(Math.random() * types.length)],
        delay: Math.random() * 1000, // 0-1s delay
        duration: Math.random() * 2000 + 2000, // 2-4s duration
      };
    });

    setConfetti(newConfetti);

    // Cleanup after duration
    const timer = setTimeout(() => {
      setConfetti([]);
    }, duration + 1000); // Add 1s for the longest delay

    return () => clearTimeout(timer);
  }, [active, particleCount, duration, colors]);

  const renderShape = (type: ConfettiType, size: number, color: string, rotation: number) => {
    switch (type) {
      case 'square':
        return (
          <div
            style={{
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              transform: `rotate(${rotation}deg)`,
            }}
          />
        );
      case 'triangle':
        return (
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: `${size / 2}px solid transparent`,
              borderRight: `${size / 2}px solid transparent`,
              borderBottom: `${size}px solid ${color}`,
              transform: `rotate(${rotation}deg)`,
            }}
          />
        );
      case 'star':
        return (
          <div
            style={{
              position: 'relative',
              display: 'inline-block',
              width: 0,
              height: 0,
              color: color,
              marginLeft: `${size / 2}px`,
              marginRight: `${size / 2}px`,
              marginBottom: `${size * 0.8}px`,
              borderRight: `${size * 0.3}px solid transparent`,
              borderBottom: `${size * 0.7}px solid ${color}`,
              borderLeft: `${size * 0.3}px solid transparent`,
              transform: `rotate(${rotation + 35}deg)`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                display: 'inline-block',
                top: 0,
                left: `-${size * 0.3}px`,
                width: 0,
                height: 0,
                borderRight: `${size * 0.3}px solid transparent`,
                borderBottom: `${size * 0.7}px solid ${color}`,
                borderLeft: `${size * 0.3}px solid transparent`,
                transform: 'rotate(70deg)',
              }}
            />
          </div>
        );
      case 'circle':
      default:
        return (
          <div
            style={{
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              borderRadius: '50%',
              transform: `rotate(${rotation}deg)`,
            }}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {confetti.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
          }}
          initial={{ y: '-10%', x: '0%', rotate: 0, scale: 1 }}
          animate={{
            y: '120%',
            x: (Math.random() - 0.5) * 50, // -25% to 25% horizontal movement
            rotate: piece.rotation + (Math.random() * 360),
            scale: [1, 0.8, 0.6, 0.4, 0.2, 0],
          }}
          transition={{
            duration: piece.duration / 1000,
            ease: 'easeIn',
            delay: piece.delay / 1000,
          }}
        >
          {renderShape(piece.type, piece.size, piece.color, piece.rotation)}
        </motion.div>
      ))}
    </div>
  );
}