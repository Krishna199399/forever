import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/common/GlassCard';
import { AnimatedCheckbox } from '@/components/common/AnimatedCheckbox';
import {
  Moon,
  Clock,
  Music,
  Play,
  Pause,
  Volume2,
  Heart,
  Activity,
  TrendingUp,
  Award,
  Sparkles,
  Compass,
  Search
} from 'lucide-react';
import api from '@/lib/api';

// Interfaces
interface SleepLog {
  _id?: string;
  date: string; // YYYY-MM-DD
  bedtime: string;
  wakeTime: string;
  hoursSlept: number;
  quality: 'Restless' | 'Good' | 'Deep';
  stressLevel: string;
  meditationMinutes: number;
  breathingCompleted: boolean;
  gratitudeJournal: string;
  dreamTitle: string;
  dreamDescription: string;
  dreamMood: string;
  dreamTags: string[];
  routineCompleted: boolean;
}

const BREATHING_TECHS = [
  { name: '4-4-4-4 Box Breathing', inhale: 4, hold1: 4, exhale: 4, hold2: 4, desc: 'Equal ratios to quiet the autonomic nervous system.' },
  { name: '4-7-8 Bedtime Calm', inhale: 4, hold1: 7, exhale: 8, hold2: 0, desc: 'Deeply relaxing technique designed for instant sleep prep.' },
  { name: '5-5 Coherent Breathing', inhale: 5, hold1: 0, exhale: 5, hold2: 0, desc: 'Synchronizes heart rate variability to reduce stress.' }
];

const NIGHT_SOUNDS = [
  { name: 'Night Crickets', icon: '🦗', src: 'https://assets.mixkit.co/active_storage/sfx/2520/2520-84.wav' },
  { name: 'Soft Ocean Waves', icon: '🌊', src: 'https://assets.mixkit.co/active_storage/sfx/2507/2507-84.wav' },
  { name: 'Bedtime Rain Loop', icon: '🌧️', src: 'https://assets.mixkit.co/active_storage/sfx/2513/2513-84.wav' },
  { name: 'Ambient Forest', icon: '🌲', src: 'https://assets.mixkit.co/active_storage/sfx/2519/2519-84.wav' }
];

const GRATITUDE_PROMPTS = [
  "What made you smile today?",
  "What is one small thing you are grateful for?",
  "What self-care action are you proud of today?",
  "What acts of kindness did you witness or receive today?"
];

const LOVE_NOTES = [
  "You did your absolute best today, and that is more than enough.",
  "I am so incredibly proud of you. Sleep peacefully.",
  "You are safe, you are loved, and tomorrow is a fresh beginning.",
  "Let go of today's worries. Rest is where tomorrow begins.",
  "The stars are glowing tonight just to remind you of my love."
];

export const Sleep: React.FC = () => {
  // --- DATABASE STATE ---
  const [logs, setLogs] = useState<SleepLog[]>([]);

  // Today's log state
  const todayStr = new Date().toISOString().split('T')[0];
  const [todayLog, setTodayLog] = useState<Partial<SleepLog>>({
    date: todayStr,
    bedtime: "22:30",
    wakeTime: "07:00",
    hoursSlept: 8,
    quality: "Good",
    stressLevel: "Normal",
    meditationMinutes: 0,
    breathingCompleted: false,
    gratitudeJournal: "",
    dreamTitle: "",
    dreamDescription: "",
    dreamMood: "Peaceful",
    dreamTags: [],
    routineCompleted: false
  });

  // Bedtime countdown
  const [countdownText, setCountdownText] = useState('0 minutes');

  // Routine Checklist
  const [checklist, setChecklist] = useState(() => {
    const saved = localStorage.getItem(`routine_${todayStr}`);
    return saved ? JSON.parse(saved) : [
      { name: 'Brush Teeth', done: false },
      { name: 'Wash Face & Skincare', done: false },
      { name: 'Drink Glass of Water', done: false },
      { name: '10 Minute Light Stretch', done: false },
      { name: 'Guided Breathing', done: false },
      { name: 'Write Gratitude Journal', done: false },
      { name: 'Phone Away / Lights Off', done: false }
    ];
  });

  // Sound machine states
  const [activeSoundIdx, setActiveSoundIdx] = useState<number | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.5);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Guided breathing coach states
  const [breathingActive, setBreathingActive] = useState(false);
  const [selectedTechIdx, setSelectedTechIdx] = useState(0);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  const [breathTimer, setBreathTimer] = useState(4);

  // Dream Gallery states
  const [dreamSearch, setDreamSearch] = useState('');



  // Bedtime countdown calculate
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const bedtimeParts = (todayLog.bedtime || "22:30").split(':');
      const bedtimeDate = new Date();
      bedtimeDate.setHours(Number(bedtimeParts[0]), Number(bedtimeParts[1]), 0);

      // If bedtime already passed today, set to tomorrow
      if (now.getTime() > bedtimeDate.getTime()) {
        bedtimeDate.setDate(bedtimeDate.getDate() + 1);
      }

      const diffMs = bedtimeDate.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;

      if (hours > 0) {
        setCountdownText(`${hours}h ${mins}m remaining`);
      } else {
        setCountdownText(`${mins} minutes remaining`);
      }
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 60000);
    return () => clearInterval(timer);
  }, [todayLog.bedtime]);

  // Checklist local persistence
  useEffect(() => {
    localStorage.setItem(`routine_${todayStr}`, JSON.stringify(checklist));
    
    // Auto update routineCompleted when all checklist checked
    const allDone = checklist.every((item: any) => item.done === true);
    setTodayLog((prev) => ({ ...prev, routineCompleted: allDone }));
  }, [checklist, todayStr]);

  // Load backend logs
  const fetchLogs = async () => {
    try {
      const res = await api.get('/api/sleep-logs');
      if (res.data) {
        setLogs(res.data);
        const matchToday = res.data.find((l: any) => l.date === todayStr);
        if (matchToday) {
          setTodayLog(matchToday);
          if (matchToday.gratitudeJournal) {
            // Already synced
          }
        }
      }
    } catch (e) {
      console.log('API Offline. Running Sleep dashboard in local mode.', e);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Save current sleep log progress (autosaving)
  const saveSleepLog = async (updatedFields: Partial<SleepLog>) => {
    const nextLog = { ...todayLog, ...updatedFields };
    setTodayLog(nextLog);

    try {
      await api.post('/api/sleep-logs', nextLog);
    } catch (e) {
      console.log('Sleep logs saved locally:', e);
    }
  };

  // Sound machine handlers
  const handleSelectSound = (idx: number) => {
    if (activeSoundIdx === idx) {
      setAudioPlaying(!audioPlaying);
    } else {
      setActiveSoundIdx(idx);
      setAudioPlaying(true);
    }
  };

  useEffect(() => {
    if (activeSoundIdx !== null) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(NIGHT_SOUNDS[activeSoundIdx].src);
      audioRef.current.loop = true;
      audioRef.current.volume = audioVolume;
      if (audioPlaying) {
        audioRef.current.play().catch((err) => console.log('Audio autoplay error:', err));
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [activeSoundIdx]);

  useEffect(() => {
    if (audioRef.current) {
      if (audioPlaying) {
        audioRef.current.play().catch((err) => console.log('Audio playback error:', err));
      } else {
        audioRef.current.pause();
      }
    }
  }, [audioPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioVolume;
    }
  }, [audioVolume]);

  // Breathing intervals
  useEffect(() => {
    let interval: any;
    if (breathingActive) {
      const tech = BREATHING_TECHS[selectedTechIdx];
      interval = setInterval(() => {
        setBreathTimer((t) => {
          if (t <= 1) {
            // Transition phase
            setBreathPhase((prev) => {
              if (prev === 'Inhale') {
                if (tech.hold1 > 0) return 'Hold';
                return 'Exhale';
              }
              if (prev === 'Hold') return 'Exhale';
              if (prev === 'Exhale') {
                if (tech.hold2 > 0) return 'Rest';
                return 'Inhale';
              }
              return 'Inhale';
            });
            // Reset timer based on next phase
            setTimeout(() => {
              setBreathPhase((p) => {
                if (p === 'Inhale') setBreathTimer(tech.inhale);
                else if (p === 'Hold') setBreathTimer(tech.hold1);
                else if (p === 'Exhale') setBreathTimer(tech.exhale);
                else setBreathTimer(tech.hold2);
                return p;
              });
            }, 50);
            return 1;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [breathingActive, breathPhase, selectedTechIdx]);

  const handleStartBreathing = () => {
    const tech = BREATHING_TECHS[selectedTechIdx];
    setBreathPhase('Inhale');
    setBreathTimer(tech.inhale);
    setBreathingActive(true);
  };

  const handleStopBreathing = () => {
    setBreathingActive(false);
    saveSleepLog({ breathingCompleted: true });
    // Check checklist breathing
    setChecklist((prev: any) =>
      prev.map((item: any) => (item.name === 'Guided Breathing' ? { ...item, done: true } : item))
    );
  };

  const toggleChecklistItem = (idx: number) => {
    setChecklist((prev: any) =>
      prev.map((item: any, i: number) => (i === idx ? { ...item, done: !item.done } : item))
    );
  };

  // Love Note deterministic selection
  const loveNote = useMemo(() => {
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000);
    return LOVE_NOTES[dayOfYear % LOVE_NOTES.length];
  }, []);

  // Filtered Dreams from history
  const dreamLogs = useMemo(() => {
    return logs.filter((log) => {
      if (!log.dreamTitle && !log.dreamDescription) return false;
      const query = dreamSearch.toLowerCase();
      return log.dreamTitle.toLowerCase().includes(query) || 
             log.dreamDescription.toLowerCase().includes(query) ||
             log.dreamMood.toLowerCase().includes(query);
    });
  }, [logs, dreamSearch]);

  // Total meditation calculation
  const totalMeditationMinutes = useMemo(() => {
    return logs.reduce((sum, log) => sum + (log.meditationMinutes || 0), 0);
  }, [logs]);

  // Weekly bedtime consistency hours from logs
  const weeklyHours = useMemo(() => {
    const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
    const last7 = sorted.slice(-7);
    const hours = last7.map((l) => l.hoursSlept || 0);
    while (hours.length < 7) {
      hours.unshift(8); // Default to target 8 hours to fill
    }
    return hours;
  }, [logs]);

  const weeklyDays = useMemo(() => {
    const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
    const last7 = sorted.slice(-7);
    const days = last7.map((l) => {
      const parts = l.date.split('-');
      return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : 'Log';
    });
    while (days.length < 7) {
      days.unshift(`Day ${days.length + 1}`);
    }
    return days;
  }, [logs]);

  // Routine Checklist Completion %
  const completedCount = checklist.filter((item: any) => item.done).length;
  const checklistPercent = Math.round((completedCount / checklist.length) * 100);

  return (
    <div className="min-h-screen text-slate-100 bg-[#0E0B16] relative pb-20 overflow-hidden">
      
      {/* Bedtime Glowing Stars Ambient Animation */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-indigo-500/10 blur-[120px] animate-float-1" />
        <div className="absolute bottom-[20%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-purple-500/10 blur-[130px] animate-float-2" />
        
        {/* Sky Stars particles */}
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse-soft"
            style={{
              left: `${Math.random() * 95}%`,
              top: `${Math.random() * 90}%`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: Math.random() * 0.6 + 0.2
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 relative z-10">
        
        {/* --- HERO BEDTIME BANNER --- */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[32px] overflow-hidden border border-white/10 shadow-glass bg-gradient-to-tr from-purple-950/30 via-slate-900/40 to-indigo-950/20 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-md"
        >
          <div className="absolute inset-px rounded-[31px] border border-white/5 pointer-events-none z-10" />

          <div className="space-y-6 max-w-xl text-center md:text-left z-20">
            <span className="text-xs font-semibold text-purple-400 tracking-widest uppercase mb-3 flex items-center justify-center md:justify-start gap-1.5 animate-pulse-soft">
              <Sparkles className="w-4 h-4 text-purple-400 fill-purple-400/20" /> Bedside Journal 🌙 Dream
            </span>
            <h1 className="text-4xl md:text-6xl font-serif text-white font-bold leading-tight drop-shadow-md">
              Good Evening ❤️
            </h1>
            <p className="text-slate-300 font-display text-base md:text-lg leading-relaxed">
              "You've done enough for today. Now it's time to rest."
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider">

              <span className="flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                <Clock className="w-4 h-4 text-purple-400" /> Target Bedtime: {todayLog.bedtime}
              </span>
            </div>
          </div>

          {/* Large Animated Moon */}
          <div className="w-full max-w-[240px] aspect-square relative z-20 flex items-center justify-center">
            <motion.div
              className="w-36 h-36 rounded-full bg-gradient-to-tr from-yellow-100 to-amber-200 relative flex items-center justify-center shadow-lg shadow-amber-300/10"
              animate={{
                scale: [1, 1.05, 1],
                boxShadow: ['0 0 20px rgba(251, 191, 36, 0.2)', '0 0 35px rgba(251, 191, 36, 0.4)', '0 0 20px rgba(251, 191, 36, 0.2)']
              }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="absolute top-4 left-6 w-5 h-5 rounded-full bg-amber-300/30" />
              <div className="absolute bottom-6 right-8 w-8 h-8 rounded-full bg-amber-300/30" />
              <div className="absolute top-10 right-4 w-4 h-4 rounded-full bg-amber-300/20" />
            </motion.div>
          </div>
        </motion.div>

        {/* --- TONIGHT'S BEDTIME ROUTINE & COUNTDOWN TIMER --- */}
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Bedtime Routine timeline checklist */}
          <GlassCard animateHover={false} className="md:col-span-2 space-y-6 border-white/5 bg-slate-900/30">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div>
                <h3 className="text-lg font-serif font-bold text-white">Tonight's Bedtime Routine</h3>
                <span className="text-[10px] text-slate-400 block mt-0.5">Step-by-step relaxation timeline</span>
              </div>
              <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                {checklistPercent}% Complete
              </span>
            </div>

            <div className="space-y-4">
              {checklist.map((item: any, idx: number) => (
                <div key={item.name} className="flex items-center justify-between text-xs pb-1 border-b border-white/5 last:border-0 last:pb-0">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <AnimatedCheckbox checked={item.done} onChange={() => toggleChecklistItem(idx)} />
                    <span className={`font-semibold text-slate-200 ${item.done ? 'line-through text-slate-500' : ''}`}>
                      {item.name}
                    </span>
                  </label>
                  <span className="text-[10px] text-purple-400/80 font-bold uppercase tracking-wider">
                    Step {idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Countdown Clock Panel */}
          <GlassCard animateHover={false} className="flex flex-col justify-between text-center border-white/5 bg-slate-900/30 relative overflow-hidden">
            <div className="absolute right-[-10px] top-[-10px] w-20 h-20 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
            
            <div>
              <h3 className="text-base font-serif font-bold text-white flex items-center justify-center gap-1.5">
                <Clock className="w-4.5 h-4.5 text-purple-400" /> Bedtime Countdown
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Wind down helper</p>
            </div>

            <div className="relative w-32 h-32 flex items-center justify-center mx-auto my-6">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#2d2245" strokeWidth="2.5" />
                <motion.circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#c084fc"
                  strokeWidth="2.5"
                  strokeDasharray="88"
                  animate={{ strokeDashoffset: 88 - (checklistPercent / 100) * 88 }}
                  transition={{ duration: 0.5 }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Target</span>
                <span className="text-xl font-serif font-bold text-white mt-0.5">{todayLog.bedtime}</span>
              </div>
            </div>

            <div className="text-[11px] font-semibold text-slate-300 bg-white/5 border border-white/10 py-2 rounded-xl">
              {countdownText}
            </div>
          </GlassCard>
        </div>

        {/* --- DAILY SLEEP TRACKER SLIDER LOGS --- */}
        <GlassCard animateHover={false} className="border-white/5 bg-slate-900/30 space-y-6">
          <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" /> Daily Sleep Tracker Check-In
          </h3>

          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Bedtime and Wake Time selectors */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Bedtime</label>
                  <input
                    type="time"
                    value={todayLog.bedtime}
                    onChange={(e) => saveSleepLog({ bedtime: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-white/10 rounded-xl bg-[#1A1625] text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Wake Time</label>
                  <input
                    type="time"
                    value={todayLog.wakeTime}
                    onChange={(e) => saveSleepLog({ wakeTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-white/10 rounded-xl bg-[#1A1625] text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 block">Hours Slept ({todayLog.hoursSlept}h)</label>
                <input
                  type="range"
                  min="4"
                  max="12"
                  step="0.5"
                  value={todayLog.hoursSlept}
                  onChange={(e) => saveSleepLog({ hoursSlept: Number(e.target.value) })}
                  className="w-full h-1.5 bg-[#2D2245] rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
              </div>
            </div>

            {/* Quality and Stress parameters */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Sleep Quality</label>
                <select
                  value={todayLog.quality}
                  onChange={(e) => saveSleepLog({ quality: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs border border-white/10 rounded-xl bg-[#1A1625] text-white focus:outline-none"
                >
                  <option>Deep</option>
                  <option>Good</option>
                  <option>Restless</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Stress Slider Check-In</label>
                <select
                  value={todayLog.stressLevel}
                  onChange={(e) => saveSleepLog({ stressLevel: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-white/10 rounded-xl bg-[#1A1625] text-white focus:outline-none"
                >
                  <option>Very Relaxed</option>
                  <option>Calm</option>
                  <option>Normal</option>
                  <option>Busy</option>
                  <option>Stressed</option>
                  <option>Overwhelmed</option>
                </select>
              </div>
            </div>

            {/* Dream log input */}
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Record Tonight's Dream Title</label>
                <input
                  type="text"
                  placeholder="e.g. Walking in a golden flower garden"
                  value={todayLog.dreamTitle}
                  onChange={(e) => saveSleepLog({ dreamTitle: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-white/10 rounded-xl bg-[#1A1625] text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Dream Details</label>
                <input
                  type="text"
                  placeholder="What happened in the dream..."
                  value={todayLog.dreamDescription}
                  onChange={(e) => saveSleepLog({ dreamDescription: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-white/10 rounded-xl bg-[#1A1625] text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

          </div>
        </GlassCard>

        {/* --- RELAXATION MUSIC & Guided Breathing Coach --- */}
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Audio Player Card */}
          <GlassCard animateHover={false} className="border-white/5 bg-slate-900/30 space-y-6">
            <div>
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-1.5">
                <Music className="w-5 h-5 text-purple-400" /> Bedtime Relaxation Sounds
              </h3>
              <p className="text-xs text-slate-400 mt-1">Play calming loops to mask environmental static.</p>
            </div>

            <div className="space-y-3">
              {NIGHT_SOUNDS.map((sound, idx) => (
                <div
                  key={sound.name}
                  onClick={() => handleSelectSound(idx)}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    activeSoundIdx === idx
                      ? 'bg-purple-900/20 border-purple-500 text-white shadow-sm'
                      : 'border-white/5 bg-white/5 hover:bg-white/10 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sound.icon}</span>
                    <span className="text-xs font-bold">{sound.name}</span>
                  </div>
                  
                  <div className="p-2 rounded-full bg-white/5 text-purple-400 hover:bg-white/10">
                    {activeSoundIdx === idx && audioPlaying ? (
                      <Pause className="w-4 h-4 fill-purple-400 stroke-none" />
                    ) : (
                      <Play className="w-4 h-4 fill-purple-400 stroke-none" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Volume controls */}
            {activeSoundIdx !== null && (
              <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                <Volume2 className="w-4 h-4 text-purple-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioVolume}
                  onChange={(e) => setAudioVolume(Number(e.target.value))}
                  className="flex-1 h-1 bg-[#2D2245] rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
                <span className="text-[10px] text-slate-400 font-bold">{Math.round(audioVolume * 100)}%</span>
              </div>
            )}
          </GlassCard>

          {/* Breathing Coach Card */}
          <GlassCard animateHover={false} className="border-white/5 bg-slate-900/30 flex flex-col justify-between p-6">
            <div>
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-1.5">
                <Compass className="w-5 h-5 text-purple-400" /> Guided Breathing Coach
              </h3>
              <p className="text-xs text-slate-400 mt-1">Select a breathing technique to stabilize cortisol.</p>
            </div>

            {/* Breathing tech selector */}
            <div className="grid grid-cols-3 gap-2 my-4">
              {BREATHING_TECHS.map((tech, idx) => (
                <button
                  key={tech.name}
                  onClick={() => {
                    setBreathingActive(false);
                    setSelectedTechIdx(idx);
                  }}
                  className={`p-2.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                    selectedTechIdx === idx
                      ? 'bg-purple-500 border-purple-500 text-white shadow-sm'
                      : 'border-white/10 hover:border-white/20 text-slate-200 bg-white/5'
                  }`}
                >
                  {tech.name.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Breathing Animator display */}
            <div className="my-6 flex flex-col items-center justify-center p-4 border border-white/5 rounded-2xl bg-white/5">
              {breathingActive ? (
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <motion.div
                    className="absolute rounded-full bg-purple-500/20 border-2 border-purple-400/40"
                    animate={{
                      scale: breathPhase === 'Inhale' 
                        ? [1, 1.45] 
                        : (breathPhase === 'Hold' ? 1.45 : (breathPhase === 'Exhale' ? [1.45, 1] : 1))
                    }}
                    transition={{
                      duration: breathPhase === 'Inhale' || breathPhase === 'Exhale' ? 4 : 5,
                      ease: 'easeInOut'
                    }}
                    style={{ width: '100px', height: '100px' }}
                  />
                  <div className="z-10 text-center">
                    <p className="text-xs font-bold text-purple-300 uppercase tracking-widest">{breathPhase}</p>
                    <p className="text-xl font-bold text-white mt-1">{breathTimer}s</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center leading-relaxed py-10 px-4">
                  {BREATHING_TECHS[selectedTechIdx].desc}
                </p>
              )}

              <div className="flex gap-2.5 mt-4">
                {breathingActive ? (
                  <button
                    onClick={handleStopBreathing}
                    className="px-6 py-2 bg-red-400/90 text-white rounded-full text-xs font-semibold hover:bg-red-500 cursor-pointer"
                  >
                    Finish Coach
                  </button>
                ) : (
                  <button
                    onClick={handleStartBreathing}
                    className="px-6 py-2 bg-purple-500 text-white rounded-full text-xs font-semibold hover:bg-purple-600 cursor-pointer"
                  >
                    Start Coach
                  </button>
                )}
              </div>
            </div>

          </GlassCard>
        </div>

        {/* --- GRATITUDE BEDTIME JOURNAL --- */}
        <div className="grid md:grid-cols-3 gap-8">
          
          <GlassCard animateHover={false} className="md:col-span-2 border-white/5 bg-slate-900/30 space-y-4">
            <div>
              <h3 className="text-lg font-serif font-bold text-white">Bedtime Gratitude Journal</h3>
              <p className="text-xs text-slate-400 mt-1">Reflect on positive details of today before shutting down.</p>
            </div>

            <div className="space-y-4">
              {/* Prompts list */}
              <div className="grid grid-cols-2 gap-2 text-[10px] text-purple-300 font-semibold uppercase tracking-wider">
                {GRATITUDE_PROMPTS.map((prompt) => (
                  <div key={prompt} className="p-2 border border-purple-500/10 rounded-lg bg-purple-500/5">
                    💡 {prompt}
                  </div>
                ))}
              </div>

              <textarea
                rows={4}
                value={todayLog.gratitudeJournal}
                onChange={(e) => saveSleepLog({ gratitudeJournal: e.target.value })}
                placeholder="Write down what you are grateful for today..."
                className="w-full px-4 py-3 text-xs border border-white/10 rounded-xl bg-[#1A1625] text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </GlassCard>

          {/* Random Bedtime Love Note */}
          <GlassCard className="flex flex-col justify-center items-center text-center p-8 bg-gradient-to-tr from-purple-950/20 to-indigo-950/30 border-white/5 relative">
            <Heart className="w-8 h-8 text-purple-400 fill-purple-400/10 animate-pulse-soft mb-3" />
            <h3 className="text-lg font-serif text-white font-bold">❤️ Before You Sleep</h3>
            <p className="font-handwritten text-lg italic text-purple-300 leading-relaxed mt-3">
              "{loveNote}"
            </p>
          </GlassCard>
        </div>

        {/* --- DREAM GALLERY HUB --- */}
        <div className="space-y-6">
          <h2 className="text-2xl font-serif text-white pl-2">Dream Gallery</h2>
          
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search dream notes..."
              value={dreamSearch}
              onChange={(e) => setDreamSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-white/10 rounded-xl bg-[#1A1625] text-white focus:outline-none"
            />
          </div>

          {dreamLogs.length === 0 ? (
            <div className="text-center py-10 text-slate-500 border border-dashed border-white/10 rounded-3xl bg-slate-900/10">
              No saved dreams match your search. Record dream descriptions in the Daily check-in above.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {dreamLogs.map((log) => (
                <GlassCard key={log._id || log.date} className="border-white/5 bg-slate-900/30 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">{log.date}</span>
                      <span className="text-[9px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {log.dreamMood}
                      </span>
                    </div>
                    <h4 className="font-serif font-bold text-base text-white mb-2">{log.dreamTitle || 'Untitled Dream'}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed italic">"{log.dreamDescription}"</p>
                  </div>
                  
                  {log.quality && (
                    <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Sleep Quality: {log.quality}
                    </div>
                  )}
                </GlassCard>
              ))}
            </div>
          )}
        </div>

        {/* --- SLEEP CONSISTENCY ANALYTICS --- */}
        <div className="grid md:grid-cols-3 gap-8">
          <GlassCard animateHover={false} className="md:col-span-2 space-y-6 border-white/5 bg-slate-900/30">
            <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" /> Weekly Bedtime Consistency
            </h3>
            
            {/* Simple SVG consistency charts */}
            <div className="h-40 w-full bg-white/5 border border-white/5 rounded-xl flex items-end p-4 overflow-hidden relative justify-around">
              {weeklyHours.map((hours, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 w-10">
                  <span className="text-[10px] font-bold text-purple-300">{hours}h</span>
                  <motion.div
                    className="w-4 bg-purple-500/30 hover:bg-purple-500/50 rounded-t-sm cursor-pointer relative group"
                    style={{ height: `${(hours / 10) * 100}px` }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                  />
                  <span className="text-[9px] text-slate-500 font-bold uppercase">{weeklyDays[idx]}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Sleep Streaks awards cards */}
          <GlassCard animateHover={false} className="flex flex-col justify-between border-white/5 bg-slate-900/30 p-6">
            <div>
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-1">
                <Award className="w-5 h-5 text-purple-400" /> Meditation Minutes
              </h3>
              <p className="text-xs text-slate-400 mt-1">Total mindfulness logged before resting.</p>
            </div>

            <div className="text-center py-6">
              <span className="text-5xl font-serif font-bold text-white">{totalMeditationMinutes}</span>
              <span className="text-xs text-purple-300 font-bold uppercase tracking-wider block mt-1">Minutes Total</span>
            </div>

            <div className="text-[10px] text-slate-500 text-center leading-normal">
              Consistent meditation supports deeper sleep waves. Keep it up!
            </div>
          </GlassCard>
        </div>

      </div>

      {/* --- NIGHT COMPLETE BEDTIME CELEBRATION MODAL OVERLAY --- */}
      <AnimatePresence>
        {todayLog.routineCompleted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0E0B16]/90 backdrop-blur-lg flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              className="max-w-md w-full bg-[#161224] border border-purple-500/10 rounded-[32px] p-8 text-center space-y-6 relative overflow-hidden"
            >
              {/* Star sparkles */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1.5 h-1.5 bg-yellow-200 rounded-full"
                    style={{
                      left: `${Math.random() * 80 + 10}%`,
                      top: `-20px`,
                    }}
                    animate={{
                      y: ['0vh', '50vh'],
                      x: ['0px', `${(Math.random() - 0.5) * 60}px`],
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: Math.random() * 2 + 2,
                      ease: 'easeOut',
                    }}
                  />
                ))}
              </div>

              <div className="p-4 bg-purple-500/10 text-purple-400 rounded-full w-fit mx-auto animate-bounce">
                <Moon className="w-8 h-8 text-purple-400 fill-purple-400/20" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-serif font-bold text-white">Sleep peacefully ❤️</h3>
                <p className="text-sm font-handwritten text-purple-300 leading-relaxed max-w-sm mx-auto">
                  "Tomorrow is another chance to bloom."
                </p>
              </div>

              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-xs text-slate-400 leading-relaxed">
                Routine checklist complete. Devices away, ambient sound playing, and sweet dreams ahead.
              </div>

              <button
                onClick={() => setChecklist((prev: any) => prev.map((item: any) => ({ ...item, done: false })))}
                className="w-full py-3 bg-purple-500 text-white text-xs font-semibold rounded-full hover:bg-purple-600 shadow-lg shadow-purple-500/20 cursor-pointer"
              >
                Reset Checklist
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
export default Sleep;
