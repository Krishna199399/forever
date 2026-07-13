import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Compass, Dumbbell, Apple, Heart, TrendingUp } from 'lucide-react';

const MOBILE_NAV_ITEMS = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/journey', label: 'Journey', icon: Compass },
  { path: '/exercise', label: 'Exercise', icon: Dumbbell },
  { path: '/meals', label: 'Meals', icon: Apple },
  { path: '/progress', label: 'Progress', icon: TrendingUp },
  { path: '/for-you', label: 'For You', icon: Heart },
];

export const Footer: React.FC = () => {
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const nextCount = clickCount + 1;
    setClickCount(nextCount);

    const timer = setTimeout(() => {
      setClickCount(0);
    }, 2000);

    if (nextCount >= 3) {
      clearTimeout(timer);
      setClickCount(0);
      navigate('/caregiver-portal');
    }
  };

  return (
    <>
      {/* Desktop Footer (Static) */}
      <footer className="w-full py-12 px-6 mt-auto hidden md:block border-t border-primary-love/10 bg-white/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex items-center gap-2 text-text-sub font-serif select-none">
            <span>Built with love, one day at a time</span>
            
            {/* Secret 3-Click Heart Icon for Admin Entry */}
            <motion.span
              onClick={handleHeartClick}
              whileHover={{ scale: 1.3 }}
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className="inline-block text-primary-love cursor-pointer p-1"
              title="Built with love"
            >
              ❤️
            </motion.span>
          </div>
          <p className="text-xs text-text-sub/70 tracking-wide font-sans flex items-center justify-center gap-2">
            <span>Her Rhythm &copy; {new Date().getFullYear()} &bull; For the most beautiful girl in the world.</span>
          </p>
        </div>
      </footer>

      {/* Mobile Sticky Bottom Tab Bar Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden px-4 pb-4">
        <div className="bg-glass border-glass shadow-glass rounded-[24px] px-2 py-2.5 flex items-center justify-around backdrop-blur-lg relative overflow-hidden">
          {/* Top inner white glow border */}
          <div className="absolute inset-px rounded-[24px] border border-white/50 pointer-events-none z-10" />

          {MOBILE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 gap-1 relative z-20 transition-colors ${
                    isActive ? 'text-primary-love' : 'text-text-sub/80 hover:text-primary-love'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <motion.div
                      whileTap={{ scale: 0.85 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                      className={`p-1 rounded-full ${isActive ? 'bg-primary-love/10' : ''}`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'fill-primary-love/20' : ''}`} />
                    </motion.div>
                    <span className="text-[10px] font-medium tracking-wide font-sans">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTabPill"
                        className="absolute inset-0 bg-primary-love/5 rounded-[16px] -z-10"
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
      
      {/* Mobile spacing padding element to prevent bottom navigation overlap on content */}
      <div className="h-24 block md:hidden" />
    </>
  );
};

export default Footer;
