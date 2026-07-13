import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Home, ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-16 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 160 }}
        className="flex flex-col items-center gap-6 max-w-md"
      >
        {/* Animated 404 number */}
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-24 h-24 bg-primary-love/10 rounded-full flex items-center justify-center"
          >
            <Heart className="w-12 h-12 text-primary-love fill-primary-love/40" />
          </motion.div>
          {/* Floating 404 badge */}
          <div className="absolute -top-2 -right-2 bg-white border border-primary-love/20 rounded-full px-2.5 py-0.5 shadow-sm">
            <span className="text-xs font-bold font-display text-primary-love">404</span>
          </div>
        </div>

        {/* Heading */}
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-text-dark mb-3">
            Page Not Found
          </h1>
          <p className="text-text-sub text-sm leading-relaxed">
            Oops! This page seems to have wandered off somewhere. Don't worry — let's get you back somewhere cozy. 🌸
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center mt-2">
          <Link
            to="/"
            className="flex items-center gap-2 bg-primary-love text-white rounded-full px-6 py-2.5 text-sm font-semibold font-display shadow-md hover:shadow-lg hover:scale-[1.03] transition-all duration-200"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 bg-white border border-primary-love/25 text-primary-love rounded-full px-6 py-2.5 text-sm font-semibold font-display hover:bg-primary-love/5 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>

        {/* Decorative love quote */}
        <p className="text-[11px] text-text-sub/60 italic font-serif mt-4 max-w-xs">
          "Even when lost, love always finds its way home."
        </p>
      </motion.div>
    </div>
  );
};

export default NotFound;
