import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}

export const AnimatedCheckbox: React.FC<AnimatedCheckboxProps> = ({
  checked,
  onChange,
  id,
}) => {
  return (
    <button
      id={id}
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
        checked
          ? 'bg-primary-love border-primary-love shadow-md shadow-primary-love/20'
          : 'border-primary-love/40 hover:border-primary-love/80 bg-white/50'
      }`}
    >
      <svg
        className="w-4 h-4 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
      >
        <motion.path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 13l4 4L19 7"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        />
      </svg>
    </button>
  );
};
