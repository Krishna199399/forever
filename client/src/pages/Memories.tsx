import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/common/GlassCard';
import {
  Heart,
  Calendar,
  MapPin,
  Bookmark,
  Camera,
  Video,
  FileText,
  Trash,
  PlusCircle,
  ChevronRight,
  ChevronLeft,
  X,
  Play,
  Pause,
  Sparkles,
  Search
} from 'lucide-react';
import api from '@/lib/api';

// Interfaces
interface Memory {
  _id?: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  type: 'Photo' | 'Video' | 'Letter' | 'Journal' | 'Voice';
  photos?: string[];
  videos?: string[];
  voiceNotes?: string[];
  location?: string;
  mood?: string;
  tags?: string[];
  favorite: boolean;
  collectionName?: string;
  journalEntry?: string;
  letter?: {
    title: string;
    content: string;
    category: string;
  };
}

const COLLECTIONS = [
  'All',
  'Trips',
  'Daily Life',
  'Food',
  'Funny Moments',
  'Love Letters'
];

const SPECIAL_DAYS = [
  { name: 'First Meeting 🌿', date: '2023-11-20', type: 'since' },
  { name: 'First Date 🍽️', date: '2024-05-14', type: 'since' },
  { name: 'Next Anniversary 💍', date: '2027-05-14', type: 'until' },
  { name: 'Her Birthday 🎂', date: '2026-12-05', type: 'until' }
];

export const Memories: React.FC = () => {
  // --- DATABASE STATE ---
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search variables
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('All');

  // Slideshow
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [slideshowIdx, setSlideshowIdx] = useState(0);
  const [slideshowActive, setSlideshowActive] = useState(false);

  // Polaroid zoom detail modal
  const [zoomMemory, setZoomMemory] = useState<Memory | null>(null);

  // Collapsible admin panel
  const [adminOpen, setAdminOpen] = useState(false);

  // Admin New Memory form inputs
  const [adminTitle, setAdminTitle] = useState('');
  const [adminDesc, setAdminDesc] = useState('');
  const [adminDate, setAdminDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [adminType, setAdminType] = useState<'Photo' | 'Video' | 'Letter'>('Photo');
  const [adminImage, setAdminImage] = useState('');
  const [adminLocation, setAdminLocation] = useState('');
  const [adminMood, setAdminMood] = useState('Happy');
  const [adminCollection, setAdminCollection] = useState('Daily Life');
  const [adminLetterTitle, setAdminLetterTitle] = useState('');
  const [adminLetterContent, setAdminLetterContent] = useState('');

  // Years manual setting
  const yearsTogether = 2.2;

  // --- API FETHES ---
  const loadMemories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/memories');
      if (res.data) {
        setMemories(res.data);
      }
    } catch (e) {
      console.log('API Offline. Scrapbook running in standalone local mode.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, []);

  // Slideshow intervals
  useEffect(() => {
    let timer: any;
    if (slideshowOpen && slideshowActive) {
      const photosOnly = memories.filter((m) => m.type === 'Photo' && m.photos && m.photos.length > 0);
      timer = setInterval(() => {
        setSlideshowIdx((curr) => {
          if (curr >= photosOnly.length - 1) return 0;
          return curr + 1;
        });
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [slideshowOpen, slideshowActive, memories]);

  // Favorite toggle update
  const toggleFavorite = async (id: string, currentFav: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    setMemories((prev) =>
      prev.map((m) => (m._id === id ? { ...m, favorite: !currentFav } : m))
    );

    try {
      await api.put(`/api/memories/${id}`, { favorite: !currentFav });
    } catch (err) {
      console.log('Fav update failed:', err);
    }
  };

  // Delete memory handler
  const handleDeleteMemory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    setMemories((prev) => prev.filter((m) => m._id !== id));

    try {
      await api.delete(`/api/memories/${id}`);
    } catch (err) {
      console.log('Delete memory failed:', err);
    }
  };

  // Add memory handler
  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminTitle || !adminDesc) return;

    const newMemory: Memory = {
      title: adminTitle,
      description: adminDesc,
      date: adminDate,
      type: adminType,
      favorite: false,
      location: adminLocation,
      mood: adminMood,
      collectionName: adminCollection,
      tags: [adminCollection]
    };

    if (adminType === 'Photo') {
      newMemory.photos = [adminImage || "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80"];
    } else if (adminType === 'Letter') {
      newMemory.letter = {
        title: adminLetterTitle || "Love Note",
        content: adminLetterContent,
        category: "Random Notes"
      };
      newMemory.collectionName = 'Love Letters';
    }

    try {
      await api.post('/api/memories', newMemory);
      loadMemories();
      
      setAdminTitle('');
      setAdminDesc('');
      setAdminImage('');
      setAdminLetterContent('');
      setAdminLetterTitle('');
      setAdminOpen(false);
    } catch (err) {
      console.log('Failed to post memory:', err);
      // Standalone fallback
      setMemories((prev) => [newMemory, ...prev]);
      setAdminOpen(false);
    }
  };

  // --- STAT CALCULATIONS ---
  const photoCount = memories.filter((m) => m.type === 'Photo').length;
  const videoCount = memories.filter((m) => m.type === 'Video').length;
  const letterCount = memories.filter((m) => m.type === 'Letter').length;

  const favoriteMemories = useMemo(() => {
    return memories.filter((m) => m.favorite);
  }, [memories]);

  // Search filter
  const filteredMemories = useMemo(() => {
    return memories.filter((m) => {
      const matchSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (m.location || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchColl = selectedCollection === 'All' ? true :
                        selectedCollection === 'Love Letters' ? m.type === 'Letter' :
                        m.collectionName === selectedCollection;
      return matchSearch && matchColl;
    });
  }, [memories, searchQuery, selectedCollection]);

  // Photos-only list for slideshow
  const photoMemories = useMemo(() => {
    return memories.filter((m) => m.type === 'Photo' && m.photos && m.photos.length > 0);
  }, [memories]);

  // Special Days counters calculation
  const calculatedDays = useMemo(() => {
    return SPECIAL_DAYS.map((day) => {
      const target = new Date(day.date).getTime();
      const now = new Date().getTime();
      const diffMs = target - now;
      const diffDays = Math.ceil(diffMs / 86400000);

      if (day.type === 'since') {
        const daysElapsed = Math.floor((now - target) / 86400000);
        return { name: day.name, text: `${daysElapsed} Days Since` };
      } else {
        return { name: day.name, text: diffDays > 0 ? `${diffDays} Days Until` : 'Today! 🎉' };
      }
    });
  }, []);

  return (
    <div className="space-y-12 pb-20">
      
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] right-[-5%] w-[45vw] h-[45vw] rounded-full bg-pink-400/10 blur-[110px] animate-float-1" />
        <div className="absolute bottom-[20%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-purple-300/10 blur-[130px] animate-float-2" />
      </div>

      <div className="relative z-10 space-y-12 max-w-7xl mx-auto px-4">

        {/* --- HERO SCAPBOOK HEADER --- */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[32px] overflow-hidden border border-white/40 shadow-glass bg-gradient-to-tr from-pink-100/40 via-purple-100/35 to-rose-50/20 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-md"
        >
          <div className="absolute inset-px rounded-[31px] border border-white/50 pointer-events-none z-10" />

          <div className="space-y-6 max-w-xl text-center md:text-left z-20">
            <span className="text-xs font-semibold text-primary-love tracking-widest uppercase mb-3 flex items-center justify-center md:justify-start gap-1.5 animate-pulse-soft">
              <Sparkles className="w-4 h-4 fill-primary-love/20" /> Living Scrapbook
            </span>
            <h1 className="text-4xl md:text-6xl font-serif text-text-dark font-bold leading-tight">
              Every memory tells our story ❤️
            </h1>
            <p className="text-text-sub font-display text-sm md:text-base leading-relaxed">
              "Our favorite moments, safely kept forever." Pinned Polaroids, milestones, and letters.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3.5 text-xs font-semibold text-text-sub uppercase tracking-wider">
              <span className="flex items-center gap-1.5 bg-white/70 px-4 py-1.5 rounded-full border border-primary-love/10 shadow-sm">
                <Heart className="w-4.5 h-4.5 text-primary-love fill-primary-love" /> {yearsTogether} Years Together
              </span>
              <span className="flex items-center gap-1.5 bg-white/70 px-4 py-1.5 rounded-full border border-primary-love/10 shadow-sm">
                <Camera className="w-4.5 h-4.5 text-purple-400" /> {photoCount} Photos
              </span>
              <span className="flex items-center gap-1.5 bg-white/70 px-4 py-1.5 rounded-full border border-primary-love/10 shadow-sm">
                <Video className="w-4.5 h-4.5 text-rose-400" /> {videoCount} Videos
              </span>
              <span className="flex items-center gap-1.5 bg-white/70 px-4 py-1.5 rounded-full border border-primary-love/10 shadow-sm">
                <FileText className="w-4.5 h-4.5 text-sky-400" /> {letterCount} Letters
              </span>
            </div>
          </div>

          {/* Quick Start slideshow launcher */}
          <div className="w-full max-w-[230px] aspect-square relative z-20 flex items-center justify-center bg-white/50 border border-white/80 rounded-[28px] p-6 shadow-sm">
            <div className="text-center space-y-3">
              <span className="text-4xl block">🎠</span>
              <h3 className="text-xs font-semibold text-text-sub uppercase tracking-wider">Photo Loop</h3>
              <button
                disabled={photoMemories.length === 0}
                onClick={() => {
                  setSlideshowIdx(0);
                  setSlideshowActive(true);
                  setSlideshowOpen(true);
                }}
                className="px-6 py-2.5 bg-primary-love text-white rounded-full text-xs font-semibold shadow-md shadow-primary-love/10 hover:scale-103 transition-transform flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Play className="w-3.5 h-3.5 fill-white stroke-none" /> Play Slideshow
              </button>
            </div>
          </div>
        </motion.div>

        {/* --- SPECIAL DAYS COUNTDOWN REMINDERS --- */}
        <div className="space-y-6">
          <h2 className="text-2xl font-serif text-text-dark pl-2">Special Milestones</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {calculatedDays.map((day) => (
              <GlassCard key={day.name} animateHover={false} className="p-5 text-center">
                <span className="text-[10px] font-bold text-primary-love uppercase tracking-wider block border-b border-primary-love/5 pb-1">
                  {day.name}
                </span>
                <p className="text-xl font-serif font-bold text-text-dark mt-4">{day.text}</p>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* --- PINNED CAROUSEL (POLAROID CARDS) --- */}
        {favoriteMemories.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif text-text-dark pl-2 flex items-center gap-2">
              <Heart className="w-5.5 h-5.5 text-primary-love fill-primary-love" /> Pinned Favorites
            </h2>

            <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin">
              {favoriteMemories.map((m) => (
                <motion.div
                  key={m._id || m.title}
                  whileHover={{ rotate: 1, scale: 1.02 }}
                  onClick={() => setZoomMemory(m)}
                  className="bg-white border border-black/5 shadow-md p-4 w-60 shrink-0 cursor-pointer rounded-sm"
                  style={{ transform: 'rotate(-1.5deg)' }}
                >
                  {/* Polaroid Image */}
                  {m.photos && m.photos.length > 0 ? (
                    <div className="aspect-square bg-slate-100 overflow-hidden relative border border-black/5 mb-3">
                      <img src={m.photos[0]} alt={m.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-square bg-gradient-to-tr from-pink-50 to-purple-50 flex items-center justify-center border border-black/5 mb-3">
                      <FileText className="w-10 h-10 text-primary-love" />
                    </div>
                  )}
                  
                  {/* Polaroid caption */}
                  <div className="text-center font-handwritten text-text-dark">
                    <h4 className="font-bold text-sm truncate">{m.title}</h4>
                    <span className="text-[10px] text-text-sub block mt-1 font-sans font-semibold">{m.date}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* --- FILTER & SEARCH BAR --- */}
        <GlassCard animateHover={false} className="border border-primary-love/5">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search inputs */}
            <div className="w-full md:max-w-md relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-sub" />
              <input
                type="text"
                placeholder="Search captions, tags, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-primary-love/15 rounded-xl bg-white/40 focus:outline-none focus:border-primary-love"
              />
            </div>

            {/* Collection tag lists */}
            <div className="flex flex-wrap gap-1.5 w-full md:w-auto justify-end">
              {COLLECTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCollection(c)}
                  className={`px-3 py-1 rounded-full border text-[11px] font-bold transition-all cursor-pointer ${
                    selectedCollection === c
                      ? 'bg-primary-love border-primary-love text-white shadow-sm'
                      : 'border-primary-love/10 hover:border-primary-love/20 text-text-dark bg-white/40'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* --- SCRAPBOOK PHOTO & LETTER GRID --- */}
        <div className="space-y-6">
          <h2 className="text-2xl font-serif text-text-dark pl-2">Memories Library</h2>

          {loading ? (
            <div className="text-center py-12 text-text-sub font-serif animate-pulse">Loading album milestones...</div>
          ) : filteredMemories.length === 0 ? (
            <div className="text-center py-12 text-text-sub border border-dashed border-primary-love/15 rounded-3xl bg-white/20">
              No memories logged in this category. Use the Admin panel below to log new moments.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
              {filteredMemories.map((m) => {
                const isFav = m.favorite;
                return (
                  <motion.div
                    key={m._id || m.title}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setZoomMemory(m)}
                    className="bg-white border border-black/5 p-4 rounded-xl cursor-pointer flex flex-col justify-between shadow-sm relative group"
                  >
                    {/* Favorite bookmark overlay */}
                    <button
                      onClick={(e) => toggleFavorite(m._id!, isFav, e)}
                      className="absolute top-6 right-6 z-20 p-2 rounded-full bg-white/80 border border-primary-love/10 text-primary-love shadow-sm cursor-pointer hover:bg-white"
                    >
                      <Bookmark className={`w-4 h-4 ${isFav ? 'fill-primary-love text-primary-love' : ''}`} />
                    </button>

                    <div>
                      {/* Photo / Content layout */}
                      {m.photos && m.photos.length > 0 ? (
                        <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden border border-black/5 mb-4 relative">
                          <img src={m.photos[0]} alt={m.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="aspect-video bg-gradient-to-tr from-pink-500/5 to-purple-500/5 rounded-lg border border-purple-100 flex items-center justify-center mb-4">
                          <FileText className="w-8 h-8 text-primary-love" />
                        </div>
                      )}

                      <div className="space-y-2">
                        <span className="text-[9px] font-bold text-primary-love bg-pink-50 border border-primary-love/10 px-2 py-0.5 rounded-full uppercase tracking-wider w-fit block">
                          {m.type === 'Letter' ? `Letter: ${m.letter?.category}` : m.collectionName}
                        </span>
                        <h3 className="text-lg font-serif font-bold text-text-dark">{m.title}</h3>
                        <p className="text-xs text-text-sub line-clamp-2 leading-relaxed">
                          {m.type === 'Letter' ? m.letter?.content : m.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 pt-3 border-t border-primary-love/5 flex justify-between items-center text-[10px] text-text-sub font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {m.date}
                      </span>
                      
                      {m._id && (
                        <button
                          onClick={(e) => handleDeleteMemory(m._id!, e)}
                          className="p-1 text-red-400 hover:text-red-500 cursor-pointer relative z-10"
                          title="Delete memory"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* --- LOVE LETTER DETAILS DIALOG MODAL --- */}
        <AnimatePresence>
          {zoomMemory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.93, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.93, y: 20 }}
                className="max-w-lg w-full bg-white border border-primary-love/15 rounded-[32px] p-8 space-y-6 relative shadow-2xl"
              >
                {/* Close Button */}
                <button
                  onClick={() => setZoomMemory(null)}
                  className="absolute top-4 right-4 p-2 text-text-sub hover:text-text-dark cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                {zoomMemory.type === 'Letter' ? (
                  // Love Letter Layout
                  <div className="space-y-4 font-sans text-xs">
                    <div className="border-b border-primary-love/5 pb-3">
                      <span className="text-[10px] font-bold text-primary-love uppercase tracking-widest bg-pink-50 px-2.5 py-0.5 rounded-full">
                        Love Letter
                      </span>
                      <h3 className="text-2xl font-serif font-bold text-text-dark mt-3">{zoomMemory.letter?.title}</h3>
                      <span className="text-[10px] text-text-sub block mt-1">Written on {zoomMemory.date}</span>
                    </div>

                    <p className="text-text-sub leading-relaxed whitespace-pre-line italic font-serif text-sm">
                      "{zoomMemory.letter?.content}"
                    </p>
                  </div>
                ) : (
                  // Polaroid details layout
                  <div className="space-y-4">
                    {zoomMemory.photos && zoomMemory.photos.length > 0 && (
                      <div className="aspect-video rounded-xl bg-slate-100 overflow-hidden border border-black/5 relative">
                        <img src={zoomMemory.photos[0]} alt={zoomMemory.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    
                    <div className="border-b border-primary-love/5 pb-3">
                      <span className="text-[10px] font-bold text-primary-love bg-pink-50 border border-primary-love/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {zoomMemory.collectionName}
                      </span>
                      <h3 className="text-xl font-serif font-bold text-text-dark mt-2">{zoomMemory.title}</h3>
                      <span className="text-[10px] text-text-sub block mt-1">Logged on {zoomMemory.date}</span>
                    </div>

                    <p className="text-xs text-text-sub leading-relaxed">{zoomMemory.description}</p>
                    
                    {zoomMemory.location && (
                      <span className="text-[10px] font-semibold text-text-sub flex items-center gap-1 pt-1">
                        <MapPin className="w-3.5 h-3.5 text-primary-love" /> {zoomMemory.location}
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- FULLSCREEN SLIDESHOW PLAYER OVERLAY --- */}
        <AnimatePresence>
          {slideshowOpen && photoMemories.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#0E0B16] flex flex-col justify-between p-8"
            >
              {/* Close slides */}
              <button
                onClick={() => setSlideshowOpen(false)}
                className="absolute top-6 right-6 p-2 text-white/60 hover:text-white cursor-pointer z-50"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex-1 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slideshowIdx}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="max-w-2xl text-center space-y-6"
                  >
                    <div className="aspect-video bg-white/5 border border-white/10 rounded-2xl overflow-hidden relative max-h-[60vh]">
                      <img
                        src={photoMemories[slideshowIdx].photos?.[0]}
                        alt={photoMemories[slideshowIdx].title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-serif text-white font-bold">{photoMemories[slideshowIdx].title}</h3>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">{photoMemories[slideshowIdx].description}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Controls footer */}
              <div className="flex justify-between items-center max-w-md w-full mx-auto pb-4 z-40">
                <button
                  onClick={() => {
                    setSlideshowIdx((curr) => (curr === 0 ? photoMemories.length - 1 : curr - 1));
                  }}
                  className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-full cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setSlideshowActive(!slideshowActive)}
                  className="px-6 py-2 bg-primary-love text-white rounded-full text-xs font-semibold hover:bg-primary-love/90 shadow-md cursor-pointer flex items-center gap-1"
                >
                  {slideshowActive ? <Pause className="w-4 h-4 fill-white stroke-none" /> : <Play className="w-4 h-4 fill-white stroke-none" />}
                  {slideshowActive ? 'Pause Loop' : 'Play Loop'}
                </button>

                <button
                  onClick={() => {
                    setSlideshowIdx((curr) => (curr >= photoMemories.length - 1 ? 0 : curr + 1));
                  }}
                  className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-full cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- PRIVATE SETTINGS / ADD MEMORIES COLLAPSIBLE (BOYFRIEND DASHBOARD) --- */}
        <GlassCard animateHover={false} className="border border-red-100 bg-red-50/5">
          <button
            onClick={() => setAdminOpen(!adminOpen)}
            className="w-full flex items-center justify-between font-serif font-bold text-text-dark focus:outline-none cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-red-400" /> Boyfriend's Journal Dashboard (Write Letters & Log Moments)
            </span>
            <ChevronRight className={`w-4 h-4 transform transition-transform ${adminOpen ? 'rotate-90' : ''}`} />
          </button>

          <AnimatePresence>
            {adminOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-6 pt-6 border-t border-red-100"
              >
                <form onSubmit={handleAddMemory} className="space-y-4 max-w-xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-text-sub">Moment/Letter Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Cooking Paneer Tikka"
                        value={adminTitle}
                        onChange={(e) => setAdminTitle(e.target.value)}
                        className="w-full px-4 py-2 text-xs border border-primary-love/15 rounded-xl bg-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-text-sub">Memory Type</label>
                      <select
                        value={adminType}
                        onChange={(e) => setAdminType(e.target.value as any)}
                        className="w-full px-4 py-2 text-xs border border-primary-love/15 rounded-xl bg-white focus:outline-none"
                      >
                        <option>Photo</option>
                        <option>Letter</option>
                        <option>Video</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-text-sub">Log Date</label>
                      <input
                        type="date"
                        required
                        value={adminDate}
                        onChange={(e) => setAdminDate(e.target.value)}
                        className="w-full px-4 py-2 text-xs border border-primary-love/15 rounded-xl bg-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-text-sub">Location</label>
                      <input
                        type="text"
                        placeholder="Botanical Garden"
                        value={adminLocation}
                        onChange={(e) => setAdminLocation(e.target.value)}
                        className="w-full px-4 py-2 text-xs border border-primary-love/15 rounded-xl bg-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-text-sub">Milestone Collection</label>
                      <select
                        value={adminCollection}
                        onChange={(e) => setAdminCollection(e.target.value)}
                        className="w-full px-4 py-2 text-xs border border-primary-love/15 rounded-xl bg-white focus:outline-none"
                      >
                        <option>Trips</option>
                        <option>Daily Life</option>
                        <option>Food</option>
                        <option>Funny Moments</option>
                        <option>Love Letters</option>
                      </select>
                    </div>
                    <div className="space-y-1 col-span-2 md:col-span-1">
                      <label className="text-xs font-bold text-text-sub">Mood Tag</label>
                      <select
                        value={adminMood}
                        onChange={(e) => setAdminMood(e.target.value)}
                        className="w-full px-4 py-2 text-xs border border-primary-love/15 rounded-xl bg-white focus:outline-none"
                      >
                        <option>Happy</option>
                        <option>Amazing</option>
                        <option>Calm</option>
                        <option>Excited</option>
                        <option>Nostalgic</option>
                      </select>
                    </div>
                  </div>

                  {adminType === 'Photo' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-text-sub">Unsplash Image URL (or direct file link)</label>
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/..."
                        value={adminImage}
                        onChange={(e) => setAdminImage(e.target.value)}
                        className="w-full px-4 py-2 text-xs border border-primary-love/15 rounded-xl bg-white focus:outline-none"
                      />
                    </div>
                  )}

                  {adminType === 'Letter' && (
                    <div className="space-y-4 pt-2 border-t border-primary-love/5">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-text-sub">Letter Header Title</label>
                        <input
                          type="text"
                          placeholder="You are my brightest star..."
                          value={adminLetterTitle}
                          onChange={(e) => setAdminLetterTitle(e.target.value)}
                          className="w-full px-4 py-2 text-xs border border-primary-love/15 rounded-xl bg-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-text-sub">Love Letter Content</label>
                        <textarea
                          rows={4}
                          placeholder="Write your emotional, sweet letter content here..."
                          value={adminLetterContent}
                          onChange={(e) => setAdminLetterContent(e.target.value)}
                          className="w-full px-4 py-2 text-xs border border-primary-love/15 rounded-xl bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-sub">Moment Caption / Description</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Add descriptions about what happened..."
                      value={adminDesc}
                      onChange={(e) => setAdminDesc(e.target.value)}
                      className="w-full px-4 py-2 text-xs border border-primary-love/15 rounded-xl bg-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-red-400 text-white rounded-xl text-xs font-semibold hover:bg-red-500 shadow-md cursor-pointer"
                  >
                    Add Moment & Lock in Album
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

      </div>

    </div>
  );
};
export default Memories;
