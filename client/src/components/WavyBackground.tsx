import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";

export const WavyBackground = ({
  children,
  className = "",
  containerClassName = "",
  colors = ["#a855f7", "#8b5cf6", "#6366f1"],
  waveWidth = 50,
  backgroundFill = "white",
  blur = 10,
  speed = "fast",
  waveOpacity = 0.5,
  ...props
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  colors?: string[];
  waveWidth?: number;
  backgroundFill?: string;
  blur?: number;
  speed?: "slow" | "fast";
  waveOpacity?: number;
  [key: string]: any;
}) => {
  const [wavePaths, setWavePaths] = useState<string[]>([]);
  const [animationDuration, setAnimationDuration] = useState<number>(0);
  const [isBrowser, setIsBrowser] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(1000); // Default value
  
  // Set animation duration based on speed
  useEffect(() => {
    setAnimationDuration(speed === "fast" ? 15 : 25);
  }, [speed]);
  
  // Create the wave path
  const createWavePath = useCallback((
    width: number,
    height: number,
    waveWidth: number,
    offset: number
  ): string => {
    const waveCount = Math.ceil(width / waveWidth) + 1;
    const baseHeight = height / 2;
    const amplitude = height / 6;

    let path = `M 0 ${baseHeight}`;

    for (let i = 0; i < waveCount; i++) {
      const x1 = i * waveWidth;
      const y1 = baseHeight + Math.sin(i + offset) * amplitude;
      const x2 = x1 + waveWidth / 2;
      const y2 = baseHeight + Math.cos(i + offset) * amplitude;
      const x3 = x1 + waveWidth;
      const y3 = baseHeight + Math.sin(i + offset) * amplitude;

      path += ` C ${x1 + waveWidth / 4} ${y1}, ${x2 - waveWidth / 4} ${y2}, ${x2} ${y2}`;
      path += ` C ${x2 + waveWidth / 4} ${y2}, ${x3 - waveWidth / 4} ${y3}, ${x3} ${y3}`;
    }

    // Complete the path by connecting to the bottom corners
    path += ` L ${width} ${height} L 0 ${height} Z`;
    return path;
  }, []);

  // Generate wave paths
  const generateWavePaths = useCallback(() => {
    if (!isBrowser) return;
    
    const newPaths: string[] = [];
    const height = 200; // Fixed height for SVG
    const width = viewportWidth;

    // Ensure we have at least as many paths as colors
    for (let i = 0; i < colors.length; i++) {
      const randomOffset = Math.random() * 10;
      const path = createWavePath(width, height, waveWidth, randomOffset);
      newPaths.push(path);
    }

    setWavePaths(newPaths);
  }, [isBrowser, viewportWidth, waveWidth, colors, createWavePath]);

  // On mount, set isBrowser to true and get the actual window width
  useEffect(() => {
    setIsBrowser(true);
    setViewportWidth(window.innerWidth);
    
    // Update on resize
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
      generateWavePaths();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [generateWavePaths]);
  
  // Generate wave paths when browser is ready
  useEffect(() => {
    if (isBrowser) {
      generateWavePaths();
    }
  }, [isBrowser, generateWavePaths]);

  // Only render the full component on the client
  return (
    <div
      className={`relative w-full overflow-hidden ${containerClassName}`}
      {...props}
    >
      {isBrowser && (
        <svg
          className="absolute inset-0 w-full z-0"
          preserveAspectRatio="none"
          viewBox={`0 0 ${viewportWidth} 200`}
          xmlns="http://www.w3.org/2000/svg"
          style={{
            filter: `blur(${blur}px)`,
            opacity: waveOpacity,
            zIndex: -1,
          }}
        >
          <rect
            x="0"
            y="0"
            width="100%"
            height="200"
            fill={backgroundFill}
          />
          {wavePaths.map((path, index) => (
            <motion.path
              key={index}
              d={path}
              fill={colors[index % colors.length]}
              animate={{
                d: createWavePath(
                  viewportWidth,
                  200,
                  waveWidth,
                  Math.random() * 10
                ),
              }}
              transition={{
                duration: animationDuration,
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
              }}
            />
          ))}
        </svg>
      )}

      <div className={`relative z-10 ${className}`}>{children}</div>
    </div>
  );
};

export default WavyBackground;