import React, { useState } from 'react';
import { GlassCard } from '@/components/common/GlassCard';
import { Heart, Sparkles, ChevronRight, MessageCircleHeart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LOVE_NOTES = [
  "I'm so incredibly proud of you for taking care of yourself today. You are doing amazing.",
  "No matter how hard today feels, remember that you are stronger than you think, and I'll always be beside you.",
  "You are my morning sunshine, my calm sunset, and the peace in my day. I love you so much.",
  "Take a deep breath. Inhale peace, exhale worry. You are safe, you are loved, and everything will be okay.",
  "My heart is happiest when I see you smile. I built this small application because your health and happiness mean the world to me.",
  "You are my absolute favorite person. I hope this little wellness check-in brings a small smile to your face.",
  "I hope you know how much light you bring into my life. Thank you for just being you.",
  "Remember to drink some water and stretch. You deserve to feel good and happy, my love.",
  "You deserve all the love, peace, and soft joy in the world. I hope today treats you gently.",
];

export const ForYou: React.FC = () => {
  const [noteIndex, setNoteIndex] = useState(0);

  const handleNextNote = () => {
    setNoteIndex((prevIndex) => (prevIndex + 1) % LOVE_NOTES.length);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col justify-center items-center min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="w-full space-y-8 flex flex-col items-center"
      >
        <div className="text-center">
          <div className="inline-flex p-3 bg-primary-love/15 rounded-full text-primary-love mb-3 animate-pulse-soft">
            <Heart className="w-8 h-8 fill-primary-love" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif text-text-dark font-bold">
            For You, My Love
          </h1>
          <p className="mt-1 text-xs text-text-sub font-display tracking-wider uppercase">
            A safe space of warm thoughts, anytime you need them
          </p>
        </div>

        {/* Polaroid Letter Card */}
        <div className="w-full max-w-xl relative">
          {/* Shadow element behind */}
          <div className="absolute inset-0 bg-primary-love/5 rounded-[32px] blur-xl transform translate-y-3 z-0" />
          
          <GlassCard
            animateHover={false}
            className="w-full min-h-[320px] bg-gradient-to-tr from-white/95 to-pink-50/90 border-2 border-primary-love/10 shadow-xl flex flex-col justify-between p-8 md:p-10 z-10"
          >
            {/* Top Header */}
            <div className="flex justify-between items-center border-b border-primary-love/10 pb-4">
              <span className="text-xs font-semibold text-primary-love tracking-widest uppercase flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 fill-primary-love/20" /> Love Letter
              </span>
              <span className="text-[10px] text-text-sub/80 font-mono">Note {noteIndex + 1} of {LOVE_NOTES.length}</span>
            </div>

            {/* Letter Body (Animated Transitions) */}
            <div className="my-8 flex-1 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={noteIndex}
                  initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                  transition={{ duration: 0.35 }}
                  className="font-handwritten text-xl md:text-2xl text-center text-text-dark/90 leading-loose italic max-w-md"
                >
                  "{LOVE_NOTES[noteIndex]}"
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Letter Footer */}
            <div className="flex justify-between items-center border-t border-primary-love/10 pt-4">
              <div className="flex items-center gap-2">
                <MessageCircleHeart className="w-4 h-4 text-primary-love" />
                <span className="text-xs text-text-sub italic font-serif">Forever Yours</span>
              </div>
              
              <button
                onClick={handleNextNote}
                className="flex items-center gap-1 text-xs font-bold text-primary-love hover:text-accent-love transition-colors"
              >
                Next Message <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Ambient indicator */}
        <p className="text-[11px] text-text-sub/60 text-center max-w-xs">
          Built with love, custom reminders, and endless smiles. Whenever you feel overwhelmed, click above.
        </p>
      </motion.div>
    </div>
  );
};
export default ForYou;
