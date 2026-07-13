import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Home,
  Compass,
  Dumbbell,
  Apple,
  Moon,
  TrendingUp,
  Settings
} from 'lucide-react';

const PALETTE_LINKS = [
  { path: '/', label: 'Home Dashboard', icon: Home, category: 'Pages' },
  { path: '/journey', label: 'Her Journey (Cycles)', icon: Compass, category: 'Pages' },
  { path: '/exercise', label: 'Bloom Exercise (Yoga)', icon: Dumbbell, category: 'Pages' },
  { path: '/meals', label: 'Nourish Meal Planning', icon: Apple, category: 'Pages' },
  { path: '/sleep', label: 'Dream Sleep wind-down', icon: Moon, category: 'Pages' },
  { path: '/progress', label: 'Progress & Analytics', icon: TrendingUp, category: 'Pages' },
  { path: '/settings', label: 'App Settings & Backup', icon: Settings, category: 'Pages' }
];

export const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectLink = (path: string) => {
    navigate(path);
    setOpen(false);
    setQuery('');
  };

  const filtered = PALETTE_LINKS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      {/* Floating Shortcut Badge bottom-right for mouse click */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-white/80 border border-primary-love/15 text-primary-love p-3 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-1.5 cursor-pointer backdrop-blur-sm print:hidden"
        title="Search Command Palette (Ctrl+K)"
      >
        <Search className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-wider hidden md:inline">Ctrl + K</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-start justify-center p-4 pt-[15vh]"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.94, y: -10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: -10 }}
              className="max-w-lg w-full bg-white border border-primary-love/15 rounded-3xl overflow-hidden shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Bar Input */}
              <div className="relative border-b border-primary-love/5 flex items-center px-4">
                <Search className="w-4.5 h-4.5 text-text-sub shrink-0" />
                <input
                  type="text"
                  placeholder="Quick search shortcuts..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-3 pr-8 py-4 text-xs bg-transparent border-0 focus:outline-none text-text-dark"
                  autoFocus
                />
                <button
                  onClick={() => setOpen(false)}
                  className="absolute right-4 p-1 text-text-sub hover:text-text-dark cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Items list */}
              <div className="max-h-72 overflow-y-auto p-2 space-y-1">
                {filtered.length === 0 ? (
                  <p className="text-xs text-text-sub text-center py-6">No matching shortcuts found.</p>
                ) : (
                  filtered.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.path}
                        onClick={() => handleSelectLink(item.path)}
                        className="px-3.5 py-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors hover:bg-pink-50/50 group"
                      >
                        <div className="flex items-center gap-3 text-xs text-text-dark font-semibold">
                          <Icon className="w-4 h-4 text-text-sub group-hover:text-primary-love transition-colors" />
                          <span>{item.label}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-text-sub/50 group-hover:text-primary-love transition-colors" />
                      </div>
                    );
                  })
                )}
              </div>

              {/* Keyboard helper footer */}
              <div className="bg-slate-50 px-4 py-2 border-t border-primary-love/5 flex justify-between items-center text-[9px] text-text-sub font-bold uppercase tracking-wider">
                <span>Navigate: Tab / Arrow Keys</span>
                <span>Select: Enter</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
import { ChevronRight } from 'lucide-react';
