import React, { useEffect, useState, useRef } from 'react';

interface ConfettiProps {
  active?: boolean;
  duration?: number;
  particleCount?: number;
  colors?: string[];
  className?: string;
}

export function Confetti({
  active = false,
  duration = 3000,
  particleCount = 100,
  colors = ['#FFC700', '#FF0080', '#00BFFF', '#00FF00', '#FFCB6B', '#FF7F50'],
  className = '',
}: ConfettiProps) {
  const [particles, setParticles] = useState<JSX.Element[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const newParticles: JSX.Element[] = [];
    const container = containerRef.current;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const size = Math.random() * 10 + 5; // Random size between 5-15px
      const color = colors[Math.floor(Math.random() * colors.length)];
      const left = Math.random() * 100; // Random horizontal position (0-100%)
      const startPos = (Math.random() * 20) - 10; // Start slightly above or below top
      
      // Random animation duration between 1-3 seconds
      const animDuration = (Math.random() * 2 + 1);
      
      // Random left-right movement
      const horizontalMovement = (Math.random() * 20) - 10; // -10% to +10%
      
      // Random rotation
      const rotation = Math.random() * 360;
      const rotationEnd = rotation + (Math.random() * 360);

      const style = {
        position: 'absolute' as const,
        backgroundColor: color,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        left: `${left}%`,
        top: `${startPos}%`,
        opacity: 1,
        animation: `fall-${i} ${animDuration}s ease-in forwards`,
      };

      // Define unique keyframe animation for each particle
      const keyframes = `
        @keyframes fall-${i} {
          0% {
            transform: translate(0, 0) rotate(${rotation}deg);
            opacity: 1;
          }
          100% {
            transform: translate(${horizontalMovement}%, 100vh) rotate(${rotationEnd}deg);
            opacity: 0;
          }
        }
      `;

      newParticles.push(
        <React.Fragment key={i}>
          <style>{keyframes}</style>
          <div style={style} />
        </React.Fragment>
      );
    }

    setParticles(newParticles);

    // Clean up particles after animation
    const timer = setTimeout(() => {
      setParticles([]);
    }, duration);

    return () => clearTimeout(timer);
  }, [active, particleCount, colors, duration]);

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none overflow-hidden z-50 ${className}`}
    >
      {particles}
    </div>
  );
}