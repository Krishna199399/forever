import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/common/GlassCard';
import {
  Heart,
  Sparkles,
  ChevronRight,
  MessageCircleHeart,
  Search,
  Bookmark,
  Clock,
  Volume2,
  X,
  Bell
} from 'lucide-react';
import api from '@/lib/api';

interface LoveLetterItem {
  _id?: string;
  title: string;
  subtitle?: string;
  content: string;
  category: 'Love Letter' | 'Morning Motivation' | 'Workout Motivation' | 'Meal Reminder' | 'Water Reminder' | 'Sleep Reminder' | 'Special Day' | 'Birthday' | 'Anniversary' | 'Achievement' | 'Custom';
  mood?: string;
  emoji?: string;
  bgTheme?: 'Rose' | 'Lavender' | 'Cream' | 'Midnight' | 'Sunset';
  fontStyle?: 'Handwritten' | 'Serif' | 'Sans';
  priority?: 'Low' | 'Normal' | 'High' | 'Urgent';
  coverImage?: string;
  music?: string;
  video?: string;
  voiceNote?: string;
  published: boolean;
  deliveryOption?: 'Immediate' | 'Scheduled' | 'Recurring';
  scheduledAt?: string;
  recurrence?: 'None' | 'Daily' | 'Weekly' | 'Monthly';
  tags?: string[];
  readStatus?: 'Unread' | 'Read';
  favorite?: boolean;
  reaction?: '❤️' | '😊' | '🥹' | '🌸' | '⭐' | 'None';
  createdBy?: string;
  createdAt?: string;
}

export const ForYou: React.FC = () => {
  // --- STATE ---
  const [letters, setLetters] = useState<LoveLetterItem[]>([]);
  const [todayLetter, setTodayLetter] = useState<LoveLetterItem | null>(null);

  // Envelope & Reading State
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);
  const [activeReadingLetter, setActiveReadingLetter] = useState<LoveLetterItem | null>(null);

  // Search & Filtering (Timeline)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Load Data
  const fetchLetters = async () => {
    try {
      const res = await api.get('/api/letters');
      if (res.data) {
        setLetters(res.data);
      }

      const todayRes = await api.get('/api/letters/today');
      if (todayRes.data) {
        setTodayLetter(todayRes.data);
      }
    } catch (e) {
      console.log('API Offline. Using standalone letter state.');
    }
  };

  useEffect(() => {
    fetchLetters();
  }, []);

  // Action Handlers
  const handleOpenLetter = async (letter: LoveLetterItem) => {
    setActiveReadingLetter(letter);
    setIsEnvelopeOpen(true);

    // Mark as read in backend
    if (letter._id && letter.readStatus === 'Unread') {
      try {
        await api.patch(`/api/letters/${letter._id}/read`);
        setLetters((prev) =>
          prev.map((l) => (l._id === letter._id ? { ...l, readStatus: 'Read' } : l))
        );
        if (todayLetter && todayLetter._id === letter._id) {
          setTodayLetter((prev) => (prev ? { ...prev, readStatus: 'Read' } : null));
        }
      } catch (e) {
        console.log('Error marking read:', e);
      }
    }
  };

  const handleSetReaction = async (letterId: string, reactionEmoji: LoveLetterItem['reaction']) => {
    try {
      const res = await api.patch(`/api/letters/${letterId}/reaction`, { reaction: reactionEmoji });
      if (res.data) {
        setLetters((prev) => prev.map((l) => (l._id === letterId ? { ...l, reaction: reactionEmoji } : l)));
        if (activeReadingLetter && activeReadingLetter._id === letterId) {
          setActiveReadingLetter((prev) => (prev ? { ...prev, reaction: reactionEmoji } : null));
        }
      }
    } catch (e) {
      console.log('Error saving reaction:', e);
    }
  };

  const handleToggleFavorite = async (letterId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.patch(`/api/letters/${letterId}/favorite`);
      if (res.data) {
        setLetters((prev) =>
          prev.map((l) => (l._id === letterId ? { ...l, favorite: res.data.favorite } : l))
        );
        if (activeReadingLetter && activeReadingLetter._id === letterId) {
          setActiveReadingLetter((prev) => (prev ? { ...prev, favorite: res.data.favorite } : null));
        }
      }
    } catch (e) {
      console.log('Error toggling favorite:', e);
    }
  };

  // Filtered & Sorted Timeline Letters (Girlfriend View)
  const filteredLetters = useMemo(() => {
    return letters
      .filter((letter) => {
        if (!letter.published) return false; // Girlfriend only sees published letters!

        const matchesSearch =
          letter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          letter.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (letter.tags && letter.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

        const matchesCategory = selectedCategory === 'All' || letter.category === selectedCategory;
        const matchesFavorite = !favoritesOnly || letter.favorite;

        return matchesSearch && matchesCategory && matchesFavorite;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || Date.now()).getTime();
        const dateB = new Date(b.createdAt || Date.now()).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });
  }, [letters, searchQuery, selectedCategory, favoritesOnly, sortOrder]);

  const categoriesList = ['All', 'Love Letter', 'Morning Motivation', 'Workout Motivation', 'Meal Reminder', 'Water Reminder', 'Sleep Reminder', 'Special Day', 'Achievement'];

  const getThemeClasses = (theme?: string) => {
    switch (theme) {
      case 'Lavender':
        return 'bg-gradient-to-br from-purple-100/80 via-pink-50/50 to-indigo-100/80 border-purple-200/50 text-purple-950';
      case 'Cream':
        return 'bg-gradient-to-br from-amber-50 via-orange-50/40 to-yellow-50/60 border-amber-200/50 text-amber-950';
      case 'Midnight':
        return 'bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 border-purple-500/30 text-pink-100';
      case 'Sunset':
        return 'bg-gradient-to-br from-rose-100 via-orange-100 to-amber-100 border-rose-200 text-rose-950';
      case 'Rose':
      default:
        return 'bg-gradient-to-br from-pink-100/90 via-rose-50/60 to-red-100/60 border-pink-200/60 text-pink-950';
    }
  };

  const getFontClass = (font?: string) => {
    switch (font) {
      case 'Serif':
        return 'font-serif font-medium leading-relaxed tracking-wide';
      case 'Sans':
        return 'font-sans leading-relaxed';
      case 'Handwritten':
      default:
        return 'font-serif italic leading-relaxed tracking-wide';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 px-4 py-8 relative pb-28">
      {/* Dynamic Header */}
      <header className="text-center space-y-3 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-100/80 border border-primary-love/20 text-primary-love text-xs font-semibold tracking-wider uppercase backdrop-blur-md"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary-love animate-pulse" />
          <span>Daily Love &amp; Messages Just For You</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl font-serif font-bold text-text-dark tracking-tight"
        >
          Love Notes &amp; Daily Inspiration
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-text-sub max-w-lg mx-auto font-sans"
        >
          Personal letters, motivational reminders, and sweet notes written with endless love.
        </motion.p>
      </header>

      {/* TODAY'S FEATURED LOVE LETTER */}
      {todayLetter && (
        <section className="relative z-10 max-w-3xl mx-auto">
          <GlassCard className="p-8 relative overflow-hidden bg-gradient-to-br from-white/90 via-pink-50/40 to-rose-100/60 border-pink-200 shadow-xl rounded-[32px]">
            {/* Background floating glow */}
            <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-primary-love/15 blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-3 bg-pink-100/80 rounded-2xl border border-pink-200/60 shadow-sm">
                  {todayLetter.emoji || '💌'}
                </span>
                <div>
                  <span className="text-[10px] font-bold text-primary-love tracking-widest uppercase bg-pink-100/60 px-2.5 py-0.5 rounded-full border border-pink-200/50">
                    Today's Featured Message
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-text-dark mt-1">
                    {todayLetter.title}
                  </h2>
                </div>
              </div>

              {todayLetter.readStatus === 'Unread' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-pink-600 bg-pink-100/80 border border-pink-300 px-3 py-1 rounded-full animate-pulse">
                  <Bell className="w-3.5 h-3.5" /> New Unread Letter
                </span>
              )}
            </div>

            <p className="text-sm text-text-sub font-serif italic mb-6 line-clamp-3 leading-relaxed relative z-10">
              "{todayLetter.content}"
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-primary-love/10 relative z-10">
              <span className="text-xs font-semibold text-text-sub flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-primary-love fill-primary-love" />
                From Boyfriend with love
              </span>

              <button
                onClick={() => handleOpenLetter(todayLetter)}
                className="px-6 py-2.5 bg-primary-love text-white font-semibold text-xs rounded-full shadow-lg shadow-pink-500/20 hover:scale-105 transition-all duration-300 flex items-center gap-2 cursor-pointer"
              >

                <span>Open Envelope &amp; Read</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </GlassCard>
        </section>
      )}

      {/* TIMELINE FEED */}
      <section className="space-y-6 relative z-10">
        {/* Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white/40 p-4 rounded-3xl border border-primary-love/10 backdrop-blur-md">
          {/* Categories Horizontal Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-primary-love text-white shadow-md shadow-pink-500/20'
                    : 'bg-white/80 text-text-sub hover:bg-pink-100/50 border border-pink-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-sub" />
              <input
                type="text"
                placeholder="Search letters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-full border border-pink-200/60 bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-love/40"
              />
            </div>

            {/* Favorite Filter Button */}
            <button
              onClick={() => setFavoritesOnly(!favoritesOnly)}
              className={`p-2 rounded-full border transition-all cursor-pointer ${
                favoritesOnly
                  ? 'bg-rose-500 text-white border-rose-500 shadow-md'
                  : 'bg-white/80 text-text-sub border-pink-200/60 hover:text-rose-500'
              }`}
              title="Filter Favorites"
            >
              <Bookmark className={`w-4 h-4 ${favoritesOnly ? 'fill-white' : ''}`} />
            </button>

            {/* Sort Order Toggle */}
            <button
              onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
              className="px-3 py-1.5 text-xs font-bold text-text-sub bg-white/80 rounded-full border border-pink-200/60 flex items-center gap-1 cursor-pointer hover:text-primary-love"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{sortOrder === 'newest' ? 'Newest' : 'Oldest'}</span>
            </button>
          </div>
        </div>

        {/* Letters Grid */}
        {filteredLetters.length === 0 ? (
          <div className="text-center py-16 bg-white/30 border border-primary-love/10 rounded-3xl p-8 backdrop-blur-sm">
            <MessageCircleHeart className="w-12 h-12 text-primary-love/40 mx-auto mb-3 animate-bounce" />
            <h3 className="font-serif font-bold text-text-dark text-lg">No Published Letters Found</h3>
            <p className="text-xs text-text-sub max-w-sm mx-auto mt-1 font-sans">
              Check back soon for new sweet messages from your boyfriend.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLetters.map((letter) => {
              const isUnread = letter.readStatus === 'Unread';
              return (
                <motion.div
                  key={letter._id || letter.title}
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  onClick={() => handleOpenLetter(letter)}
                  className={`group cursor-pointer p-6 rounded-[28px] border relative flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-xl ${getThemeClasses(
                    letter.bgTheme
                  )}`}
                >
                  {/* Top Header */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-2xl p-2 bg-white/60 rounded-xl backdrop-blur-md border border-white/40 shadow-sm">
                        {letter.emoji || '💌'}
                      </span>

                      <div className="flex items-center gap-2">
                        {isUnread && (
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                        )}

                        <button
                          onClick={(e) => handleToggleFavorite(letter._id || '', e)}
                          className="p-1.5 rounded-full hover:bg-white/50 transition-colors"
                        >
                          <Bookmark
                            className={`w-4 h-4 ${
                              letter.favorite
                                ? 'text-rose-500 fill-rose-500'
                                : 'text-text-sub/50 hover:text-rose-500'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold tracking-wider uppercase opacity-75">
                      {letter.category}
                    </span>

                    <h3 className="text-xl font-serif font-bold tracking-tight mt-1 group-hover:text-primary-love transition-colors">
                      {letter.title}
                    </h3>

                    {letter.subtitle && (
                      <p className="text-xs font-sans opacity-80 mt-1 line-clamp-1">
                        {letter.subtitle}
                      </p>
                    )}

                    <p className={`text-xs mt-3 line-clamp-3 opacity-90 ${getFontClass(letter.fontStyle)}`}>
                      "{letter.content}"
                    </p>
                  </div>

                  {/* Footer Action */}
                  <div className="mt-6 pt-4 border-t border-black/5 flex items-center justify-between">
                    <span className="text-[10px] font-mono opacity-60">
                      {letter.createdAt ? new Date(letter.createdAt).toLocaleDateString() : 'Today'}
                    </span>

                    <span className="text-xs font-bold text-primary-love flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Read Envelope <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* FULL LETTER READING ENVELOPE MODAL */}
      {createPortal(
        <AnimatePresence>
          {isEnvelopeOpen && activeReadingLetter && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 30 }}
                className={`max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-[36px] p-8 sm:p-10 shadow-2xl border relative ${getThemeClasses(
                  activeReadingLetter.bgTheme
                )}`}
              >
                {/* Close Button */}
                <button
                  onClick={() => setIsEnvelopeOpen(false)}
                  className="absolute top-6 right-6 p-2 rounded-full bg-white/40 hover:bg-white/80 text-text-dark transition-all shadow-sm cursor-pointer z-20"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Cover Image if attached */}
                {activeReadingLetter.coverImage && (
                  <div className="w-full h-48 rounded-2xl overflow-hidden mb-6 shadow-md border border-white/50">
                    <img
                      src={activeReadingLetter.coverImage}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-4xl p-3 bg-white/60 rounded-2xl backdrop-blur-md border border-white/40 shadow-sm">
                    {activeReadingLetter.emoji || '💖'}
                  </span>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest opacity-70">
                      {activeReadingLetter.category} &bull; {activeReadingLetter.mood || 'Romantic'}
                    </span>
                    <h2 className="text-3xl font-serif font-bold mt-0.5">
                      {activeReadingLetter.title}
                    </h2>
                  </div>
                </div>

                {/* Subtitle */}
                {activeReadingLetter.subtitle && (
                  <p className="text-sm font-serif italic opacity-80 mb-6 pb-4 border-b border-black/10">
                    "{activeReadingLetter.subtitle}"
                  </p>
                )}

                {/* Main Content */}
                <div className={`text-base leading-relaxed my-6 ${getFontClass(activeReadingLetter.fontStyle)}`}>
                  {activeReadingLetter.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {/* Media Audio / Video */}
                {activeReadingLetter.music && (
                  <div className="p-4 bg-white/50 rounded-2xl border border-white/60 my-4 flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-primary-love" />
                    <span className="text-xs font-bold">Background Music Attached</span>
                  </div>
                )}

                {/* Reaction Picker */}
                <div className="mt-8 pt-6 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold opacity-80">Send Reaction:</span>
                    {(['❤️', '😊', '🥹', '🌸', '⭐'] as const).map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleSetReaction(activeReadingLetter._id || '', emoji)}
                        className={`text-xl p-2 rounded-full hover:scale-125 transition-transform cursor-pointer ${
                          activeReadingLetter.reaction === emoji ? 'bg-white/80 shadow-md ring-2 ring-primary-love' : ''
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  <span className="text-xs font-serif font-semibold opacity-75">
                    Written with endless love ❤️
                  </span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default ForYou;
