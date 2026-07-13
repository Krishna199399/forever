import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number; // percentage
  size: number; // pixels
  delay: number; // seconds
  duration: number; // seconds
  type: 'heart' | 'petal' | 'star';
  scale: number;
}

export const FloatingBackground: React.FC = () => {
  // Use useMemo to generate particles once so they don't regenerate and jump on state updates
  const particles = useMemo<Particle[]>(() => {
    const list: Particle[] = [];
    const types: ('heart' | 'petal' | 'star')[] = ['heart', 'petal', 'star'];
    for (let i = 0; i < 20; i++) {
      list.push({
        id: i,
        x: Math.random() * 100, // random horizontal position
        size: Math.random() * 16 + 12, // size between 12px and 28px
        delay: Math.random() * 8, // start delay
        duration: Math.random() * 20 + 20, // rise duration: very slow, between 20s and 40s
        type: types[i % types.length],
        scale: Math.random() * 0.6 + 0.6,
      });
    }
    return list;
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#FFF9FC]">
      {/* Dynamic Floating Glassmorphic Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-grad-pink opacity-50 blur-[100px] animate-float-1" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-grad-lavender opacity-40 blur-[120px] animate-float-2" />
      <div className="absolute top-[30%] left-[40%] w-[45vw] h-[45vw] rounded-full bg-grad-peach opacity-45 blur-[90px] animate-float-3" />

      {/* Floating Particles Overlay */}
      <div className="absolute inset-0">
        {particles.map((p) => {
          // Render SVG shapes based on type
          const renderShape = () => {
            if (p.type === 'heart') {
              return (
                <svg
                  width={p.size}
                  height={p.size}
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-primary-love/35"
                >
                  <path
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                    fill="currentColor"
                  />
                </svg>
              );
            } else if (p.type === 'petal') {
              return (
                <svg
                  width={p.size}
                  height={p.size}
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-accent-love/25"
                >
                  <path
                    d="M12 2C12 2 6 9 6 14C6 17.31 8.69 20 12 20C15.31 20 18 17.31 18 14C18 9 12 2 12 2Z"
                    fill="currentColor"
                  />
                </svg>
              );
            } else {
              // Star particle
              return (
                <svg
                  width={p.size}
                  height={p.size}
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-amber-300/35"
                >
                  <path
                    d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                    fill="currentColor"
                  />
                </svg>
              );
            }
          };

          return (
            <motion.div
              key={p.id}
              className="absolute bottom-[-50px]"
              style={{ left: `${p.x}%` }}
              initial={{ y: 0, opacity: 0, scale: 0 }}
              animate={{
                y: '-110vh',
                opacity: [0, 0.8, 0.8, 0],
                scale: [p.scale * 0.5, p.scale, p.scale, p.scale * 0.5],
                x: [0, Math.sin(p.id) * 40, Math.cos(p.id) * 30, Math.sin(p.id) * 20],
                rotate: [0, p.id * 30, p.id * 60, p.id * 90],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {renderShape()}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
