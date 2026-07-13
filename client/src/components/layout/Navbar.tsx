import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Home' },
  { path: '/journey', label: 'Journey' },
  { path: '/exercise', label: 'Exercise' },
  { path: '/meals', label: 'Meals' },
  { path: '/sleep', label: 'Sleep' },
  { path: '/progress', label: 'Progress' },
  { path: '/for-you', label: 'For You ❤️' },
];

export const Navbar: React.FC = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 hidden md:block">
      <div className="max-w-7xl mx-auto flex items-center justify-between bg-glass border-glass shadow-glass rounded-full px-8 py-3 backdrop-blur-md relative overflow-hidden">
        {/* Top inner white glow border */}
        <div className="absolute inset-px rounded-full border border-white/40 pointer-events-none z-10" />

        {/* Logo Link */}
        <Link
          to="/"
          className="flex items-center gap-2 group relative z-20 select-none cursor-pointer"
        >
          <motion.div
            whileHover={{ scale: 1.15, rotate: 10 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Heart className="w-6 h-6 text-primary-love fill-primary-love" />
          </motion.div>
          <span className="font-serif font-semibold text-lg tracking-wider text-text-dark group-hover:text-primary-love transition-colors">
            Her Rhythm
          </span>
        </Link>

        {/* Links */}
        <ul className="flex items-center gap-6 relative z-20">
          {NAV_ITEMS.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `relative px-3 py-1.5 text-sm font-medium tracking-wide transition-colors ${
                    isActive
                      ? 'text-primary-love font-semibold'
                      : 'text-text-sub hover:text-primary-love'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeTabDot"
                        className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary-love"
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};
