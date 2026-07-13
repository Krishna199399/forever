import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import type { ReactNode, FC } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
  animateHover?: boolean;
}

export const GlassCard: FC<GlassCardProps> = ({
  children,
  className,
  animateHover = true,
  ...props
}) => {
  const hoverAnimation = animateHover
    ? {
        whileHover: { y: -6, scale: 1.015, transition: { duration: 0.3, ease: 'easeOut' as const } },
        whileTap: { scale: 0.985 },
      }
    : {};

  return (
    <motion.div
      className={cn(
        'bg-glass-card border-glass-subtle shadow-glass rounded-[28px] p-6 backdrop-blur-2xl transition-shadow duration-300 hover:shadow-glass-hover relative overflow-hidden',
        props.onClick && 'cursor-pointer',
        className
      )}
      {...hoverAnimation}
      {...props}
    >
      {/* Decorative premium inner light glow line */}
      <div className="absolute inset-px rounded-[27px] border border-white/40 pointer-events-none z-10" />
      <div className="relative z-20">{children}</div>
    </motion.div>
  );
};
