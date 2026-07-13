import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/common/GlassCard';
import {
  Heart,
  Sparkles,
  ChevronRight,
  MessageCircleHeart,
  Mail,
  Search,
  Bookmark,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Volume2,
  Video,
  X,
  Filter,
  TrendingUp,
  Award,
  CheckCircle,
  Eye,
  Send,
  Lock,
  Unlock,
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
  priority?: 'Normal' | 'High' | 'Urgent';
  coverImage?: string;
  music?: string;
  video?: string;
  voiceNote?: string;
  published?: boolean;
  deliveryOption?: 'Immediate' | 'Scheduled' | 'Recurring';
  scheduledAt?: string;
  recurrence?: 'None' | 'Every Morning' | 'Every Night' | 'Weekly' | 'Monthly';
  readStatus?: 'Unread' | 'Read';
  readAt?: string;
  favorite?: boolean;
  archived?: boolean;
  reaction?: '❤️' | '😊' | '🥹' | '🌸' | '⭐' | 'None';
  tags?: string[];
  createdAt?: string;
}

const CATEGORIES = [
  'All',
  'Love Letter',
  'Morning Motivation',
  'Workout Motivation',
  'Meal Reminder',
  'Water Reminder',
  'Sleep Reminder',
  'Special Day',
  'Birthday',
  'Anniversary',
  'Achievement',
  'Custom'
];

const REACTION_OPTIONS = ['❤️', '😊', '🥹', '🌸', '⭐'];

const TEMPLATES = [
  {
    title: "Good Morning, My Love ❤️",
    subtitle: "A soft start to a wonderful day.",
    category: "Morning Motivation",
    mood: "Sweet",
    emoji: "🌅",
    content: "Good morning, beautiful! I hope you woke up feeling rested and peaceful. Remember to sip a warm glass of water and take things one gentle step at a time today. I love you so much.",
    bgTheme: "Rose",
    fontStyle: "Handwritten"
  },
  {
    title: "Hydration Reminder 💧",
    subtitle: "Take care of your body today.",
    category: "Water Reminder",
    mood: "Caring",
    emoji: "💧",
    content: "Here is your gentle love reminder to drink a full cup of water right now! Your skin, energy, and body deserve all the nourishment today. Stay glowing, my girl.",
    bgTheme: "Cream",
    fontStyle: "Sans"
  },
  {
    title: "Don't Forget Breakfast 🍳",
    subtitle: "Nourish yourself with love.",
    category: "Meal Reminder",
    mood: "Caring",
    emoji: "🥐",
    content: "Please make sure to eat a warm, wholesome breakfast. Fueling your energy keeps your hormone health in balance and your smile bright. Bon appétit, sweetheart!",
    bgTheme: "Cream",
    fontStyle: "Serif"
  },
  {
    title: "I Am So Proud of You 🏆",
    subtitle: "You achieved something special today.",
    category: "Achievement",
    mood: "Inspiring",
    emoji: "⭐",
    content: "Whatever you accomplished today—big or small—I am cheering for you from the bottom of my heart. You continue to amaze me with your grace and perseverance.",
    bgTheme: "Lavender",
    fontStyle: "Handwritten"
  },
  {
    title: "Sleep Peacefully, My Heart 🌙",
    subtitle: "Time to rest your mind and body.",
    category: "Sleep Reminder",
    mood: "Romantic",
    emoji: "🌙",
    content: "Put your phone away, dim the lights, and let go of today's worries. You did more than enough today. Sweet dreams, my forever love.",
    bgTheme: "Midnight",
    fontStyle: "Serif"
  }
];

export const ForYou: React.FC = () => {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'Girlfriend' | 'Admin'>('Girlfriend');
  const [letters, setLetters] = useState<LoveLetterItem[]>([]);
  const [todayLetter, setTodayLetter] = useState<LoveLetterItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Envelope & Reading State
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);
  const [activeReadingLetter, setActiveReadingLetter] = useState<LoveLetterItem | null>(null);

  // Search & Filtering (Timeline)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Admin Form & Analytics
  const [adminSection, setAdminSection] = useState<'Dashboard' | 'Create' | 'All' | 'Templates' | 'Analytics'>('Dashboard');
  const [analytics, setAnalytics] = useState<any>(null);
  
  // New Letter Form State
  const [formLetter, setFormLetter] = useState<Partial<LoveLetterItem>>({
    title: '',
    subtitle: '',
    content: '',
    category: 'Love Letter',
    mood: 'Romantic',
    emoji: '❤️',
    bgTheme: 'Rose',
    fontStyle: 'Handwritten',
    priority: 'Normal',
    coverImage: '',
    video: '',
    voiceNote: '',
    published: true,
    deliveryOption: 'Immediate',
    scheduledAt: '',
    recurrence: 'None',
    tags: []
  });

  // Admin PIN Protection State
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Load Data
  const fetchLetters = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/letters');
      if (res.data) {
        setLetters(res.data);
      }

      const todayRes = await api.get('/api/letters/today');
      if (todayRes.data) {
        setTodayLetter(todayRes.data);
      }

      const analyticsRes = await api.get('/api/letters/analytics');
      if (analyticsRes.data) {
        setAnalytics(analyticsRes.data);
      }
    } catch (e) {
      console.log('API Offline. Using standalone letter state.');
    } finally {
      setLoading(false);
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

  const handleCreateLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLetter.title || !formLetter.content) return;

    try {
      const res = await api.post('/api/letters', formLetter);
      if (res.data) {
        setLetters((prev) => [res.data, ...prev]);
        setFormLetter({
          title: '',
          subtitle: '',
          content: '',
          category: 'Love Letter',
          mood: 'Romantic',
          emoji: '❤️',
          bgTheme: 'Rose',
          fontStyle: 'Handwritten',
          priority: 'Normal',
          coverImage: '',
          video: '',
          voiceNote: '',
          published: true,
          deliveryOption: 'Immediate',
          scheduledAt: '',
          recurrence: 'None',
          tags: []
        });
        setAdminSection('All');
        fetchLetters();
      }
    } catch (err) {
      console.log('Error creating letter:', err);
    }
  };

  const handleDeleteLetter = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this letter?')) return;
    try {
      await api.delete(`/api/letters/${id}`);
      setLetters((prev) => prev.filter((l) => l._id !== id));
      if (todayLetter && todayLetter._id === id) {
        setTodayLetter(null);
      }
    } catch (err) {
      console.log('Error deleting letter:', err);
    }
  };

  const handleUseTemplate = (tpl: typeof TEMPLATES[0]) => {
    setFormLetter({
      ...formLetter,
      title: tpl.title,
      subtitle: tpl.subtitle,
      category: tpl.category as any,
      mood: tpl.mood,
      emoji: tpl.emoji,
      content: tpl.content,
      bgTheme: tpl.bgTheme as any,
      fontStyle: tpl.fontStyle as any
    });
    setAdminSection('Create');
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1234' || pinInput === '5201314') {
      setAdminUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // Filtered letters for memory timeline
  const filteredLetters = useMemo(() => {
    return letters.filter((letter) => {
      const matchesSearch =
        searchQuery === '' ||
        letter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        letter.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (letter.subtitle && letter.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === 'All' || letter.category === selectedCategory;
      const matchesFav = !favoritesOnly || letter.favorite;

      return matchesSearch && matchesCat && matchesFav;
    }).sort((a, b) => {
      const dA = new Date(a.createdAt || Date.now()).getTime();
      const dB = new Date(b.createdAt || Date.now()).getTime();
      return sortOrder === 'newest' ? dB - dA : dA - dB;
    });
  }, [letters, searchQuery, selectedCategory, favoritesOnly, sortOrder]);

  const unreadCount = useMemo(() => {
    return letters.filter((l) => l.published && l.readStatus === 'Unread').length;
  }, [letters]);

  // Background Theme Utility
  const getThemeClasses = (theme?: string) => {
    switch (theme) {
      case 'Lavender':
        return 'from-purple-100/90 via-purple-50 to-pink-50 text-purple-950 border-purple-200/50';
      case 'Cream':
        return 'from-amber-50 via-warm-white to-orange-50/60 text-amber-950 border-amber-200/50';
      case 'Midnight':
        return 'from-slate-900 via-indigo-950 to-purple-950 text-slate-100 border-purple-500/30';
      case 'Sunset':
        return 'from-orange-100/90 via-pink-100/70 to-rose-50 text-rose-950 border-rose-200/50';
      case 'Rose':
      default:
        return 'from-pink-100/90 via-rose-50 to-peach-50 text-rose-950 border-pink-200/50';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10 pb-24">

      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-primary-love/10 pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif text-text-dark font-bold flex items-center gap-2">
            ❤️ Daily Love Letters
          </h1>
          <p className="text-xs text-text-sub mt-1">
            Handwritten affirmations, daily reminders, and private love letters.
          </p>
        </div>
      </div>

      {/* --- GIRLFRIEND EXPERIENCE VIEW --- */}
      <div className="space-y-12">

          {/* --- UNREAD NOTIFICATION BANNER --- */}
          {unreadCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 text-white rounded-2xl shadow-lg flex items-center justify-between gap-4 cursor-pointer"
              onClick={() => todayLetter && handleOpenLetter(todayLetter)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-full animate-bounce">
                  <Bell className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold font-serif">You have a new Love Letter! ❤️</h4>
                  <p className="text-xs text-white/90">Click to open your special daily message from your boyfriend.</p>
                </div>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1.5 rounded-full flex items-center gap-1">
                Open Letter <ChevronRight className="w-4 h-4" />
              </span>
            </motion.div>
          )}

          {/* --- HERO: TODAY'S FEATURED ENVELOPE --- */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-primary-love uppercase tracking-widest mb-3 flex items-center gap-1">
              <Sparkles className="w-4 h-4" /> Today's Message
            </span>

            {todayLetter ? (
              <div className="w-full max-w-xl relative">
                {/* Envelope Outer Shadow */}
                <div className="absolute inset-0 bg-primary-love/15 rounded-[36px] blur-2xl transform translate-y-4" />

                <GlassCard
                  animateHover={true}
                  onClick={() => handleOpenLetter(todayLetter)}
                  className="w-full min-h-[320px] bg-gradient-to-tr from-pink-50 via-white to-purple-50 border-2 border-primary-love/20 shadow-2xl flex flex-col justify-between p-8 text-center relative overflow-hidden group cursor-pointer"
                >
                  {/* Top Seal Tag */}
                  <div className="flex justify-between items-center z-10 border-b border-primary-love/10 pb-4">
                    <span className="text-[10px] font-bold text-primary-love uppercase tracking-wider bg-pink-100/80 px-3 py-1 rounded-full flex items-center gap-1">
                      {todayLetter.category}
                    </span>
                    <span className="text-xs text-text-sub font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-primary-love" />
                      {todayLetter.createdAt ? new Date(todayLetter.createdAt).toLocaleDateString() : 'Today'}
                    </span>
                  </div>

                  {/* 3D Envelope Wax Seal Central Icon */}
                  <div className="my-8 flex flex-col items-center justify-center space-y-4 z-10">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 flex items-center justify-center text-3xl shadow-xl shadow-pink-500/30 group-hover:scale-110 transition-transform">
                        {todayLetter.emoji || '💌'}
                      </div>
                      <div className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-full border border-pink-200 text-primary-love shadow-sm">
                        <Heart className="w-4 h-4 fill-primary-love" />
                      </div>
                    </div>

                    <div>
                      <h2 className="text-2xl md:text-3xl font-serif font-bold text-text-dark group-hover:text-primary-love transition-colors">
                        {todayLetter.title}
                      </h2>
                      {todayLetter.subtitle && (
                        <p className="text-xs text-text-sub mt-1 italic font-display">
                          "{todayLetter.subtitle}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="flex justify-between items-center z-10 pt-4 border-t border-primary-love/10">
                    <span className="text-xs text-primary-love font-serif italic flex items-center gap-1">
                      <MessageCircleHeart className="w-4 h-4" /> Tap to open letter
                    </span>
                    <span className="px-4 py-2 bg-primary-love text-white text-xs font-bold rounded-full shadow-md group-hover:bg-primary-love/90 flex items-center gap-1">
                      Open Envelope <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </GlassCard>
              </div>
            ) : (
              <GlassCard className="w-full max-w-xl text-center py-12 space-y-3">
                <span className="text-4xl block">💌</span>
                <h3 className="text-lg font-serif font-bold text-text-dark">No New Love Letters Yet</h3>
                <p className="text-xs text-text-sub">Check back soon for your next handwritten message ❤️</p>
              </GlassCard>
            )}
          </div>

          {/* --- MEMORY TIMELINE GRID & SEARCH --- */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-serif text-text-dark font-bold">Memory Timeline</h2>
                <p className="text-xs text-text-sub">Every love letter and motivation stored forever.</p>
              </div>

              {/* Favorites & Sort Toggles */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFavoritesOnly(!favoritesOnly)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                    favoritesOnly
                      ? 'bg-pink-100 border-primary-love text-primary-love'
                      : 'border-primary-love/15 text-text-sub hover:text-primary-love bg-white/50'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-primary-love' : ''}`} /> Favorites
                </button>

                <button
                  onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold border border-primary-love/15 text-text-sub hover:text-text-dark bg-white/50 cursor-pointer"
                >
                  Sort: {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                </button>
              </div>
            </div>

            {/* Search & Category Pills */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-text-sub absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search letters by title, message, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs border border-primary-love/15 rounded-xl bg-white/60 focus:outline-none focus:border-primary-love"
                />
              </div>

              {/* Category Pills */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border ${
                      selectedCategory === cat
                        ? 'bg-primary-love text-white border-primary-love shadow-sm'
                        : 'bg-white/40 border-primary-love/10 text-text-sub hover:border-primary-love/30'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline Cards Grid */}
            {filteredLetters.length === 0 ? (
              <div className="text-center py-12 text-xs text-text-sub border border-dashed border-primary-love/15 rounded-3xl bg-white/20">
                No matching letters found. Try clearing filters or search query.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filteredLetters.map((letter) => (
                  <GlassCard
                    key={letter._id}
                    animateHover={true}
                    onClick={() => handleOpenLetter(letter)}
                    className="flex flex-col justify-between p-6 cursor-pointer relative group border border-primary-love/10"
                  >
                    {/* Favorite Bookmark */}
                    <button
                      onClick={(e) => handleToggleFavorite(letter._id!, e)}
                      className="absolute top-4 right-4 z-20 p-1.5 rounded-full bg-white/80 border border-primary-love/10 text-primary-love shadow-sm hover:bg-white cursor-pointer"
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${letter.favorite ? 'fill-primary-love' : ''}`} />
                    </button>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{letter.emoji || '💌'}</span>
                        <span className="text-[9px] font-bold text-primary-love bg-pink-50 border border-primary-love/10 px-2 py-0.5 rounded-full uppercase tracking-wider truncate">
                          {letter.category}
                        </span>
                      </div>

                      <h3 className="font-serif font-bold text-base text-text-dark mb-1 group-hover:text-primary-love transition-colors line-clamp-1">
                        {letter.title}
                      </h3>
                      <p className="text-xs text-text-sub leading-relaxed line-clamp-2 italic font-display">
                        "{letter.content}"
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-primary-love/5 flex justify-between items-center text-[10px] text-text-sub">
                      <span>{letter.createdAt ? new Date(letter.createdAt).toLocaleDateString() : 'Date'}</span>
                      {letter.reaction && letter.reaction !== 'None' && (
                        <span className="px-2 py-0.5 bg-pink-100 rounded-full text-xs">{letter.reaction}</span>
                      )}
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        </div>

      {/* ========================================================= */}
      {/* 3. FULL ENVELOPE OPENING OVERLAY MODAL                    */}
      {/* ========================================================= */}
      {createPortal(
        <AnimatePresence>
          {isEnvelopeOpen && activeReadingLetter && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEnvelopeOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
            >
              {/* Floating Heart particles background animation */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-pink-300/40 text-xl"
                    style={{
                      left: `${Math.random() * 80 + 10}%`,
                      top: `-20px`
                    }}
                    animate={{
                      y: ['0vh', '80vh'],
                      x: ['0px', `${(Math.random() - 0.5) * 80}px`],
                      rotate: [0, 360]
                    }}
                    transition={{
                      duration: Math.random() * 3 + 3,
                      repeat: Infinity,
                      ease: 'linear'
                    }}
                  >
                    {i % 2 === 0 ? '🌸' : '❤️'}
                  </motion.div>
                ))}
              </div>

              {/* Main Unfolded Paper Modal */}
              <motion.div
                initial={{ scale: 0.85, y: 30, rotateX: -15 }}
                animate={{ scale: 1, y: 0, rotateX: 0 }}
                exit={{ scale: 0.85, y: 30 }}
                transition={{ type: 'spring', damping: 20 }}
                onClick={(e) => e.stopPropagation()}
                className={`max-w-xl w-full bg-gradient-to-br ${getThemeClasses(activeReadingLetter.bgTheme)} rounded-[36px] p-8 md:p-10 space-y-6 relative shadow-2xl z-10 border max-h-[90vh] overflow-y-auto`}
              >
                {/* Close Button */}
                <button
                  onClick={() => setIsEnvelopeOpen(false)}
                  className="absolute top-5 right-5 p-2 text-text-sub hover:text-text-dark cursor-pointer z-20"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Cover Image / Media Preview if available */}
                {activeReadingLetter.coverImage && (
                  <div className="aspect-video w-full rounded-2xl overflow-hidden border border-black/5 shadow-sm">
                    <img src={activeReadingLetter.coverImage} alt="Cover" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Header */}
                <div className="space-y-2 border-b border-black/10 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{activeReadingLetter.emoji || '💌'}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white/70 px-3 py-1 rounded-full shadow-sm">
                      {activeReadingLetter.category}
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-text-dark leading-tight">
                    {activeReadingLetter.title}
                  </h2>
                  {activeReadingLetter.subtitle && (
                    <p className="text-xs text-text-sub italic font-display">
                      "{activeReadingLetter.subtitle}"
                    </p>
                  )}
                </div>

                {/* Letter Body Content */}
                <div className="my-6">
                  <p
                    className={`text-base md:text-xl text-text-dark leading-relaxed whitespace-pre-line ${
                      activeReadingLetter.fontStyle === 'Handwritten'
                        ? 'font-handwritten italic'
                        : activeReadingLetter.fontStyle === 'Serif'
                        ? 'font-serif'
                        : 'font-sans'
                    }`}
                  >
                    "{activeReadingLetter.content}"
                  </p>
                </div>

                {/* Voice Note Audio Player if present */}
                {activeReadingLetter.voiceNote && (
                  <div className="p-4 bg-white/60 border border-primary-love/15 rounded-2xl flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-primary-love shrink-0" />
                    <div className="flex-1">
                      <span className="text-xs font-bold block text-text-dark">Voice Note Attachment</span>
                      <audio controls src={activeReadingLetter.voiceNote} className="w-full mt-1 h-8" />
                    </div>
                  </div>
                )}

                {/* Video Player if present */}
                {activeReadingLetter.video && (
                  <div className="aspect-video rounded-2xl overflow-hidden bg-black/10 border border-black/5">
                    <video controls src={activeReadingLetter.video} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Reactions & Favorite Bar */}
                <div className="pt-6 border-t border-black/10 space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs font-serif font-bold text-text-sub">Send a Reaction:</span>
                    
                    <div className="flex items-center gap-2">
                      {REACTION_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleSetReaction(activeReadingLetter._id!, emoji as any)}
                          className={`p-2.5 rounded-full text-lg transition-transform hover:scale-125 cursor-pointer ${
                            activeReadingLetter.reaction === emoji
                              ? 'bg-white shadow-md ring-2 ring-primary-love'
                              : 'bg-white/40 hover:bg-white/80'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setIsEnvelopeOpen(false)}
                    className="w-full py-3 bg-primary-love text-white font-bold text-xs uppercase tracking-wider rounded-full hover:bg-primary-love/90 shadow-md cursor-pointer"
                  >
                    Close Letter ❤️
                  </button>
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
