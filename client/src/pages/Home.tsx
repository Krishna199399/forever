import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/common/GlassCard';
import { AnimatedCheckbox } from '@/components/common/AnimatedCheckbox';
import {
  Droplet,
  Moon,
  Heart,
  Sparkles,
  ChevronRight,
  BookOpen,
  X,
  Trophy,
  Flame,
  Calendar,
  Clock,
  CloudSun,
  Mail
} from 'lucide-react';
import api from '@/lib/api';

// Design Constants
const LOVE_LETTERS = [
  "I'm so incredibly proud of you for taking care of yourself today. You are doing amazing.",
  "No matter how hard today feels, remember that you are stronger than you think. I'll always be beside you.",
  "You are my morning sunshine, my calm sunset, and the peace in my day. I love you so much.",
  "Take a deep breath. Inhale peace, exhale worry. You are safe, you are loved, and everything will be okay.",
  "My heart is happiest when I see you smile. I built this companion because your happiness means the world to me.",
  "You are my absolute favorite person. I hope this little wellness check-in brings a small smile to your face.",
  "I hope you know how much light you bring into my life. Thank you for just being you.",
  "Remember to drink some water and stretch. You deserve to feel good and happy, my love.",
  "You deserve all the love, peace, and soft joy in the world. I hope today treats you gently.",
];

const MOTIVATIONS = [
  "Small habits create big miracles.",
  "Consistency is stronger than perfection.",
  "Take one healthy step today, for us.",
  "You do not need to be perfect to be amazing.",
  "Rest is just as productive as progress. Listen to your body.",
];

const EDUCATION_TOPICS = [
  {
    id: 'sleep',
    title: 'Healthy Sleep',
    desc: 'How rest builds emotional resilience and cellular health.',
    content: 'Prioritizing 7-9 hours of sleep helps regulate cortisol (stress hormone), restores brain glycogen, and strengthens learning. Wind down without screens 30 minutes before bed to allow melatonin release. You deserve restful, sweet dreams.',
    color: 'bg-indigo-50 text-indigo-600 border-indigo-100'
  },
  {
    id: 'hydration',
    title: 'Nourishing Hydration',
    desc: 'The beauty of water for clear skin and physical vitality.',
    content: 'Drinking 2-3 liters of water daily keeps cells hydrated, enhances digestion, maintains optimal blood volume, and gives you that beautiful, healthy glow. Try carrying a warm pink flask today to make it a comforting ritual.',
    color: 'bg-sky-50 text-sky-600 border-sky-100'
  },
  {
    id: 'yoga',
    title: 'Mindful Yoga & Movement',
    desc: 'Connecting breath with body to release physical tension.',
    content: 'Stretching and breathing increase oxygen flow to your tissues, release muscular holding patterns in the shoulders and back, and ground your nervous system. A simple 10-minute flow is a warm hug for your physiology.',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  },
  {
    id: 'cycle',
    title: 'Cycle Awareness',
    desc: 'Honoring your biological seasons with kindness.',
    content: 'Your body moves through four distinct phases (Menstrual, Follicular, Ovulatory, Luteal). Energy levels naturally fluctuate. Rest during winter (menstruation), bloom during spring/summer, and eat warm, grounding meals in autumn. I am here to support you in every season.',
    color: 'bg-pink-50 text-pink-600 border-pink-100'
  }
];

export const Home: React.FC = () => {
  // --- STATE ---
  const [greeting, setGreeting] = useState('Good Morning ❤️');
  const [time, setTime] = useState('');
  const [dateStr, setDateStr] = useState('');
  
  // Rotating content states
  const [loveNote, setLoveNote] = useState('');
  const [motivation, setMotivation] = useState('');
  
  // Persistence state hooks (local storage)
  const [waterCups, setWaterCups] = useState(() => Number(localStorage.getItem('water_cups') || '3'));
  const [weight, setWeight] = useState(() => Number(localStorage.getItem('weight') || '52'));
  const [sleepHours, setSleepHours] = useState(() => Number(localStorage.getItem('sleep_hours') || '7.5'));
  const [workoutMinutes, setWorkoutMinutes] = useState(() => Number(localStorage.getItem('workout_mins') || '20'));
  const [activeMood, setActiveMood] = useState(() => localStorage.getItem('active_mood') || '🥰');
  
  // Checklists
  const [journeyTasks, setJourneyTasks] = useState([
    { id: 'j1', label: 'Morning Meditation', time: '07:30 AM', completed: false },
    { id: 'j2', label: 'Healthy Breakfast', time: '08:30 AM', completed: false },
    { id: 'j3', label: 'Water Check-in 1', time: '10:00 AM', completed: false },
    { id: 'j4', label: '15m Stretch/Yoga', time: '11:00 AM', completed: false },
    { id: 'j5', label: 'Nourishing Lunch', time: '01:30 PM', completed: false },
    { id: 'j6', label: 'Hydration Check-in 2', time: '03:30 PM', completed: false },
    { id: 'j7', label: 'Sunset Walk', time: '06:00 PM', completed: false },
    { id: 'j8', label: 'Warm Dinner', time: '08:00 PM', completed: false },
    { id: 'j9', label: 'Cozy Sleep Prep', time: '10:00 PM', completed: false },
  ]);

  const [dailyGoals, setDailyGoals] = useState(() => {
    const saved = localStorage.getItem('daily_goals');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'g1', text: 'Drink 3L Water', completed: false },
      { id: 'g2', text: 'Walk 8,000 Steps', completed: false },
      { id: 'g3', text: 'Morning Yoga Stretches', completed: false },
      { id: 'g4', text: 'Log Calories & Meal', completed: false },
      { id: 'g5', text: 'Sleep before 10:30 PM', completed: false },
    ];
  });

  // Modal State
  const [activeModalTopic, setActiveModalTopic] = useState<typeof EDUCATION_TOPICS[0] | null>(null);
  const [todayLetter, setTodayLetter] = useState<any>(null);

  useEffect(() => {
    api.get('/api/letters/today').then((res) => {
      if (res.data) setTodayLetter(res.data);
    }).catch(() => {});
  }, []);

  // End of Day Celebrations
  const [showCelebration, setShowCelebration] = useState(false);
  const [dayFinished, setDayFinished] = useState(() => localStorage.getItem('day_finished') === 'true');

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('water_cups', String(waterCups));
    localStorage.setItem('weight', String(weight));
    localStorage.setItem('sleep_hours', String(sleepHours));
    localStorage.setItem('workout_mins', String(workoutMinutes));
    localStorage.setItem('active_mood', activeMood);
    localStorage.setItem('day_finished', String(dayFinished));
  }, [waterCups, weight, sleepHours, workoutMinutes, activeMood, dayFinished]);

  useEffect(() => {
    localStorage.setItem('daily_goals', JSON.stringify(dailyGoals));
  }, [dailyGoals]);

  // --- TIME & ROTATION LOGIC ---
  useEffect(() => {
    // Dynamic Greeting
    const hours = new Date().getHours();
    if (hours < 12) setGreeting('Good Morning, Beautiful ❤️');
    else if (hours < 17) setGreeting('Good Afternoon, Love ❤️');
    else setGreeting('Good Evening, Sweetheart ❤️');

    // Date & Time Updates
    const updateTime = () => {
      const d = new Date();
      setTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDateStr(d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    // Rotate Daily Elements deterministically based on date
    const dayOfYear = Math.floor(
      (new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000
    );
    setLoveNote(LOVE_LETTERS[dayOfYear % LOVE_LETTERS.length]);
    setMotivation(MOTIVATIONS[dayOfYear % MOTIVATIONS.length]);

    return () => clearInterval(interval);
  }, []);

  // --- CALCULATED VALUES ---
  // BMI calculation: weight / (1.63^2) [mock height 1.63m]
  const bmi = useMemo(() => {
    const height = 1.63;
    return (weight / (height * height)).toFixed(1);
  }, [weight]);

  const caloriesBurned = useMemo(() => {
    return Math.round(workoutMinutes * 7.5 + (waterCups * 15));
  }, [workoutMinutes, waterCups]);

  // Completion metrics
  const completedJourneyCount = journeyTasks.filter((t) => t.completed).length;
  const totalJourneyCount = journeyTasks.length;
  const journeyProgress = Math.round((completedJourneyCount / totalJourneyCount) * 100);

  const completedGoalsCount = dailyGoals.filter((g: any) => g.completed).length;
  const totalGoalsCount = dailyGoals.length;
  const goalsProgress = Math.round((completedGoalsCount / totalGoalsCount) * 100);

  const overallWellnessScore = Math.round((journeyProgress + goalsProgress + (waterCups >= 8 ? 100 : waterCups * 12.5)) / 3);



  // --- HANDLERS ---
  const toggleJourneyTask = (id: string) => {
    setJourneyTasks(
      journeyTasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const toggleGoal = (id: string) => {
    setDailyGoals(
      dailyGoals.map((g: any) => (g.id === id ? { ...g, completed: !g.completed } : g))
    );
  };



  const finishToday = () => {
    setDayFinished(true);
    setShowCelebration(true);
  };

  // --- FLOATING ANIMATIONS PARTICLE ARRAY ---
  const floatingParticles = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      x: Math.random() * 90 + 5,
      y: Math.random() * 90 + 5,
      scale: Math.random() * 0.5 + 0.5,
      duration: Math.random() * 15 + 15,
      delay: Math.random() * 5,
    }));
  }, []);

  return (
    <div className="relative min-h-screen pb-20">
      
      {/* Ambient Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {floatingParticles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute text-primary-love/20"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            animate={{
              y: ['0px', '-40px', '0px'],
              x: ['0px', '20px', '0px'],
              rotate: [0, 360],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {p.id % 2 === 0 ? (
              <Heart className="w-5 h-5 fill-primary-love/10" style={{ transform: `scale(${p.scale})` }} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-accent-love/15">
                <path d="M12 2C12 2 6 9 6 14C6 17.31 8.69 20 12 20C15.31 20 18 17.31 18 14C18 9 12 2 12 2Z" fill="currentColor" />
              </svg>
            )}
          </motion.div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 relative z-10">
        
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative rounded-[32px] overflow-hidden border border-white/40 shadow-glass p-8 md:p-12 min-h-[360px] flex items-center"
        >
          {/* Hero Background Image */}
          <div className="absolute inset-0 z-0 select-none pointer-events-none">
            <img
              src="/assets/hero img.png"
              alt="Bloom background"
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center right' }}
            />
            {/* Ambient readable mask overlay: fading from solid pink/white on left to transparent on right */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-100/95 via-pink-50/80 md:via-pink-50/60 to-transparent" />
          </div>

          {/* Decorative Inner Glow */}
          <div className="absolute inset-px rounded-[31px] border border-white/50 pointer-events-none z-30" />

          {/* Hero Content (Positioned on top of background) */}
          <div className="w-full md:max-w-xl space-y-6 text-center md:text-left z-20 relative">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-text-sub uppercase tracking-wider">
              <span className="flex items-center gap-1 bg-white/85 px-3 py-1.5 rounded-full border border-primary-love/10">
                <Calendar className="w-3.5 h-3.5 text-primary-love" /> {dateStr}
              </span>
              <span className="flex items-center gap-1 bg-white/80 px-3 py-1.5 rounded-full border border-primary-love/10">
                <Clock className="w-3.5 h-3.5 text-primary-love animate-pulse-soft" /> {time}
              </span>
              <span className="flex items-center gap-1 bg-white/80 px-3 py-1.5 rounded-full border border-primary-love/10">
                <CloudSun className="w-3.5 h-3.5 text-primary-love" /> 24°C &bull; Sweet & Calm
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-serif text-text-dark font-bold leading-tight">
              {greeting}
            </h1>
            <p className="text-text-sub font-display text-base md:text-lg leading-relaxed max-w-md">
              Today is another beautiful step toward a healthier and happier you. I'm cheering you on.
            </p>

            <div className="flex flex-col sm:flex-row justify-center md:justify-start items-center gap-4">
              <a
                href="#journey"
                className="w-full sm:w-auto text-center px-8 py-3.5 bg-primary-love text-white font-semibold rounded-full shadow-lg shadow-primary-love/25 hover:bg-primary-love/90 transition-all font-display text-sm tracking-wide cursor-pointer"
              >
                Start Today's Journey
              </a>
              <a
                href="#snapshot"
                className="w-full sm:w-auto text-center px-8 py-3.5 bg-white/80 border border-primary-love/15 text-primary-love font-semibold rounded-full hover:bg-white/95 transition-all font-display text-sm tracking-wide cursor-pointer"
              >
                View Progress
              </a>
            </div>
          </div>
        </motion.div>

        {/* --- DOUBLE COLUMN GRID --- */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* LEFT & CENTER COLUMN */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* DAILY LOVE LETTER */}
            <GlassCard animateHover={false} className="border-2 border-primary-love/15 bg-gradient-to-tr from-white to-pink-50/20 relative overflow-hidden">
              {/* Backlight Glow */}
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-primary-love/10 blur-xl pointer-events-none" />
              
              <div className="flex justify-between items-center mb-6 border-b border-primary-love/10 pb-3">
                <span className="text-xs font-semibold text-primary-love tracking-widest uppercase flex items-center gap-1.5">
                  <Heart className="w-4 h-4 fill-primary-love" /> Daily Love Letter
                </span>
                <span className="text-[10px] text-text-sub font-mono">Rotates Daily</span>
              </div>
              
              <div className="min-h-[120px] flex items-center justify-center p-2 text-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={loveNote}
                    initial={{ opacity: 0, scale: 0.98, filter: 'blur(3px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 0.98, filter: 'blur(3px)' }}
                    transition={{ duration: 0.5 }}
                    className="font-serif italic text-xl md:text-2xl text-text-dark font-medium leading-relaxed max-w-xl"
                  >
                    "{loveNote}"
                  </motion.p>
                </AnimatePresence>
              </div>
              <div className="text-center mt-4 text-[10px] text-text-sub">
                Designed and built with all my heart &bull; For Us
              </div>
            </GlassCard>

            {/* TODAY'S JOURNEY TIMELINE */}
            <GlassCard id="journey" animateHover={false}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-primary-love/5 pb-4">
                <div>
                  <h2 className="text-2xl font-serif text-text-dark font-bold">Today's Journey</h2>
                  <p className="text-xs text-text-sub">Log your self-care flow hourly to cultivate mindfulness.</p>
                </div>
                
                {/* Progress bar */}
                <div className="w-full sm:w-48 space-y-1">
                  <div className="flex justify-between text-xs font-bold text-primary-love">
                    <span>Care Progress</span>
                    <span>{journeyProgress}%</span>
                  </div>
                  <div className="w-full bg-primary-love/10 h-2 rounded-full overflow-hidden">
                    <motion.div
                      className="bg-primary-love h-full rounded-full"
                      animate={{ width: `${journeyProgress}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>

              {/* Timeline Flow */}
              <div className="relative pl-6 border-l-2 border-primary-love/20 space-y-6 ml-2 py-2">
                {journeyTasks.map((task) => (
                  <div key={task.id} className="relative flex items-center justify-between gap-4">
                    {/* Circle marker */}
                    <button
                      onClick={() => toggleJourneyTask(task.id)}
                      className={`absolute -left-[35px] w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                        task.completed
                          ? 'bg-primary-love border-primary-love text-white shadow-sm'
                          : 'border-primary-love/30 hover:border-primary-love bg-white'
                      }`}
                    >
                      {task.completed && (
                        <svg className="w-3.5 h-3.5 stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1">
                      <h4
                        className={`text-sm font-semibold transition-colors ${
                          task.completed ? 'line-through text-text-sub/50' : 'text-text-dark'
                        }`}
                      >
                        {task.label}
                      </h4>
                      <span className="text-[10px] text-text-sub tracking-wider uppercase">{task.time}</span>
                    </div>

                    <span className="text-xs text-text-sub/70 bg-white/60 border border-primary-love/5 px-2.5 py-1 rounded-full font-medium">
                      {task.completed ? 'Done ✨' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* HEALTH SNAPSHOT */}
            <div id="snapshot" className="space-y-6">
              <h2 className="text-2xl font-serif text-text-dark pl-2">Health Snapshot</h2>
              
              <div className="grid sm:grid-cols-2 gap-6">
                {/* Weight & BMI */}
                <GlassCard animateHover={false} className="flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-semibold tracking-wider text-text-sub uppercase">Weight & BMI</h3>
                    <span className="text-[10px] text-emerald-500 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Healthy</span>
                  </div>
                  
                  <div className="my-6 flex justify-around items-center">
                    {/* Weight Controller */}
                    <div className="text-center">
                      <p className="text-3xl font-bold font-serif text-text-dark">{weight} <span className="text-sm font-sans font-normal text-text-sub">kg</span></p>
                      <span className="text-[10px] text-text-sub tracking-wider uppercase block mt-1">Weight</span>
                      <div className="flex items-center justify-center gap-1.5 mt-2.5">
                        <button
                          onClick={() => setWeight((w) => Math.max(w - 0.5, 35))}
                          className="w-6 h-6 rounded-full border border-primary-love/20 flex items-center justify-center text-xs hover:bg-primary-love/5 cursor-pointer"
                        >
                          -
                        </button>
                        <button
                          onClick={() => setWeight((w) => Math.min(w + 0.5, 95))}
                          className="w-6 h-6 rounded-full border border-primary-love/20 flex items-center justify-center text-xs hover:bg-primary-love/5 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="w-px h-12 bg-primary-love/10" />

                    {/* BMI display */}
                    <div className="text-center">
                      <p className="text-3xl font-bold font-serif text-text-dark">{bmi}</p>
                      <span className="text-[10px] text-text-sub tracking-wider uppercase block mt-1">BMI Index</span>
                      <span className="text-[10px] text-emerald-500 font-medium block mt-3">Normal (18.5 - 24.9)</span>
                    </div>
                  </div>
                </GlassCard>

                {/* Water Intake */}
                <GlassCard animateHover={false} className="flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-semibold tracking-wider text-text-sub uppercase">Hydration</h3>
                    <Droplet className="w-4 h-4 text-sky-400" />
                  </div>
                  
                  <div className="my-4 text-center relative flex flex-col items-center">
                    {/* Heart Progress SVG */}
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                        {/* Circle path */}
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#e0f2fe" strokeWidth="2.5" />
                        <motion.circle
                          cx="18"
                          cy="18"
                          r="14"
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2.5"
                          strokeDasharray="88"
                          animate={{ strokeDashoffset: 88 - (Math.min(waterCups, 8) / 8) * 88 }}
                          transition={{ duration: 0.5 }}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-text-dark font-serif">{waterCups}</span>
                        <span className="text-[8px] text-text-sub font-semibold tracking-wide">/ 8 cups</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => setWaterCups((w) => Math.max(w - 1, 0))}
                        className="px-2.5 py-1 text-[10px] font-bold border border-sky-200 rounded-lg hover:bg-sky-50 text-sky-500 cursor-pointer"
                      >
                        Reduce
                      </button>
                      <button
                        onClick={() => setWaterCups((w) => Math.min(w + 1, 16))}
                        className="px-2.5 py-1 text-[10px] font-bold bg-sky-400 text-white rounded-lg hover:bg-sky-500 shadow-sm shadow-sky-400/20 cursor-pointer"
                      >
                        Drink +1
                      </button>
                    </div>
                  </div>
                </GlassCard>

                {/* Sleep Logger */}
                <GlassCard animateHover={false} className="flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-semibold tracking-wider text-text-sub uppercase">Sleep</h3>
                    <Moon className="w-4 h-4 text-indigo-400 fill-indigo-100" />
                  </div>
                  <div className="my-6 text-center">
                    <p className="text-3xl font-bold font-serif text-text-dark">{sleepHours} <span className="text-sm font-sans font-normal text-text-sub">Hours</span></p>
                    <span className="text-[10px] text-text-sub tracking-wider uppercase block mt-1">Rest Quality</span>
                    <div className="flex items-center justify-center gap-1.5 mt-3">
                      <button
                        onClick={() => setSleepHours((s) => Math.max(s - 0.5, 3))}
                        className="w-6 h-6 rounded-full border border-indigo-200 text-indigo-500 flex items-center justify-center text-xs hover:bg-indigo-50 cursor-pointer"
                      >
                        -
                      </button>
                      <button
                        onClick={() => setSleepHours((s) => Math.min(s + 0.5, 12))}
                        className="w-6 h-6 rounded-full border border-indigo-200 text-indigo-500 flex items-center justify-center text-xs hover:bg-indigo-50 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </GlassCard>

                {/* Physical metrics */}
                <GlassCard animateHover={false} className="flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-semibold tracking-wider text-text-sub uppercase">Burn & Activity</h3>
                    <Flame className="w-4 h-4 text-orange-400 fill-orange-50" />
                  </div>
                  
                  <div className="my-5 space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-text-sub">Workout Time</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setWorkoutMinutes((m) => Math.max(m - 5, 0))}
                          className="px-1.5 border border-orange-200 rounded text-[9px] hover:bg-orange-50 cursor-pointer font-bold"
                        >
                          -5m
                        </button>
                        <span className="font-bold text-text-dark">{workoutMinutes}m</span>
                        <button
                          onClick={() => setWorkoutMinutes((m) => Math.min(m + 5, 180))}
                          className="px-1.5 border border-orange-200 rounded text-[9px] hover:bg-orange-50 cursor-pointer font-bold"
                        >
                          +5m
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-text-sub">Estimated Calories</span>
                      <span className="font-bold text-text-dark">{caloriesBurned} kcal</span>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>



          </div>

          {/* RIGHT COLUMN (Goals, Wellness Wheel & Personal Widgets) */}
          <div className="space-y-8">
            
            {/* WELLNESS WHEEL */}
            <GlassCard animateHover={false} className="bg-gradient-to-tr from-purple-50/50 to-pink-50/40">
              <h3 className="text-lg font-serif font-bold text-text-dark mb-1">Wellness Wheel</h3>
              <p className="text-xs text-text-sub mb-6">Today's overall wellness footprint.</p>

              <div className="flex flex-col items-center">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {/* Concentric rings */}
                    {/* Ring 1: Water */}
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e0f2fe" strokeWidth="4" />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="4"
                      strokeDasharray="251"
                      animate={{ strokeDashoffset: 251 - (Math.min(waterCups, 8) / 8) * 251 }}
                      transition={{ duration: 0.6 }}
                      strokeLinecap="round"
                    />

                    {/* Ring 2: Exercise */}
                    <circle cx="50" cy="50" r="32" fill="none" stroke="#d1fae5" strokeWidth="4" />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="32"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="4"
                      strokeDasharray="201"
                      animate={{ strokeDashoffset: 201 - (Math.min(workoutMinutes, 60) / 60) * 201 }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      strokeLinecap="round"
                    />

                    {/* Ring 3: Sleep */}
                    <circle cx="50" cy="50" r="24" fill="none" stroke="#e0e7ff" strokeWidth="4" />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="24"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="4"
                      strokeDasharray="151"
                      animate={{ strokeDashoffset: 151 - (Math.min(sleepHours, 8) / 8) * 151 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      strokeLinecap="round"
                    />
                  </svg>
                  {/* Overall score in center */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold font-serif text-text-dark">{overallWellnessScore}</span>
                    <span className="text-[9px] text-text-sub font-semibold tracking-wide">Wellness Index</span>
                  </div>
                </div>

                {/* Custom legend */}
                <div className="grid grid-cols-3 gap-3 w-full mt-6 pt-4 border-t border-primary-love/5 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400 block" />
                    <span className="text-text-sub font-medium">Water</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block" />
                    <span className="text-text-sub font-medium">Activity</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 block" />
                    <span className="text-text-sub font-medium">Sleep</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* TODAY'S GOALS CHECKLIST */}
            <GlassCard animateHover={false} className="border-2 border-primary-love/10 bg-gradient-to-tr from-white to-pink-50/10">
              <div className="flex items-center justify-between mb-4 border-b border-primary-love/5 pb-2">
                <h3 className="text-lg font-serif font-bold text-text-dark">Today's Goals</h3>
                <Heart className="w-4 h-4 text-primary-love fill-primary-love" />
              </div>
              
              <ul className="space-y-4">
                {dailyGoals.map((goal: any) => (
                  <li key={goal.id} className="flex items-start gap-3">
                    <AnimatedCheckbox
                      checked={goal.completed}
                      onChange={() => toggleGoal(goal.id)}
                    />
                    <span
                      className={`text-sm font-sans transition-all leading-tight ${
                        goal.completed ? 'line-through text-text-sub/50' : 'text-text-dark font-medium'
                      }`}
                    >
                      {goal.text}
                    </span>
                  </li>
                ))}
              </ul>

              {goalsProgress === 100 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center gap-2 text-xs text-emerald-600 font-medium"
                >
                  <Sparkles className="w-4 h-4 fill-emerald-50 animate-bounce" />
                  <span>Amazing job! You checked off all of today's goals.</span>
                </motion.div>
              )}
            </GlassCard>

            {/* MOOD CHECK-IN */}
            <GlassCard animateHover={false}>
              <h3 className="text-lg font-serif font-bold text-text-dark">Mood Check-in</h3>
              <p className="text-xs text-text-sub mt-1">Log your mood to track emotional patterns.</p>
              
              <div className="grid grid-cols-3 gap-2.5 mt-5">
                {[
                  { emoji: '🥰', label: 'Amazing' },
                  { emoji: '😄', label: 'Happy' },
                  { emoji: '😌', label: 'Calm' },
                  { emoji: '😐', label: 'Okay' },
                  { emoji: '😔', label: 'Low' },
                  { emoji: '😢', label: 'Sad' },
                ].map((item) => (
                  <button
                    key={item.emoji}
                    onClick={() => setActiveMood(item.emoji)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                      activeMood === item.emoji
                        ? 'bg-primary-love/15 border-primary-love scale-105 shadow-sm'
                        : 'border-primary-love/5 hover:border-primary-love/20 bg-white/40 text-text-sub'
                    }`}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="text-[10px] font-semibold mt-1">{item.label}</span>
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* MOTIVATION SECTION */}
            <GlassCard className="bg-gradient-to-tr from-pink-50 to-orange-50 relative overflow-hidden">
              <div className="absolute top-[-10px] left-[-10px] w-12 h-12 bg-primary-love/5 rounded-full blur-md" />
              <div className="flex items-center gap-2 text-primary-love mb-3">
                <Sparkles className="w-4.5 h-4.5" />
                <h4 className="text-sm font-semibold tracking-wider uppercase font-sans">Motivation</h4>
              </div>
              <p className="font-handwritten text-lg italic text-text-dark leading-relaxed">
                "{motivation}"
              </p>
              <div className="w-8 h-[2px] bg-primary-love/25 mt-4" />
            </GlassCard>

            {/* DAILY LOVE LETTER WIDGET */}
            {todayLetter && (
              <GlassCard className="bg-gradient-to-tr from-rose-50 via-pink-50 to-purple-50 border-2 border-primary-love/15 relative overflow-hidden group cursor-pointer">
                <Link to="/for-you" className="block space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-primary-love uppercase tracking-wider flex items-center gap-1">
                      <Mail className="w-4 h-4" /> Daily Love Letter
                    </span>
                    <span className="text-lg">{todayLetter.emoji || '💌'}</span>
                  </div>

                  <h4 className="font-serif font-bold text-base text-text-dark group-hover:text-primary-love transition-colors">
                    {todayLetter.title}
                  </h4>
                  <p className="text-xs text-text-sub line-clamp-2 italic font-display">
                    "{todayLetter.content}"
                  </p>

                  <div className="pt-2 flex justify-between items-center text-[10px] font-bold text-primary-love">
                    <span>Open Sealed Envelope</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </GlassCard>
            )}



          </div>
        </div>

        {/* --- HEALTH EDUCATION SECTION --- */}
        <div className="space-y-6">
          <h2 className="text-2xl font-serif text-text-dark pl-2">Health & Sleep Education</h2>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {EDUCATION_TOPICS.map((topic) => (
              <GlassCard
                key={topic.id}
                onClick={() => setActiveModalTopic(topic)}
                className="group cursor-pointer flex flex-col justify-between min-h-[140px]"
              >
                <div>
                  <div className={`p-2 w-fit rounded-lg border mb-3 ${topic.color}`}>
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h4 className="font-serif font-bold text-base text-text-dark group-hover:text-primary-love transition-colors">
                    {topic.title}
                  </h4>
                  <p className="text-[11px] text-text-sub mt-1 leading-normal">
                    {topic.desc}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-primary-love flex items-center gap-0.5 mt-4 group-hover:translate-x-1 transition-transform">
                  Read Article <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* --- END OF DAY SECTION --- */}
        <AnimatePresence>
          {!dayFinished ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-[32px] overflow-hidden border border-indigo-200/50 bg-gradient-to-tr from-indigo-950 via-indigo-900 to-purple-900 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 text-white relative shadow-2xl"
            >
              {/* Stars drawing */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-indigo-950 to-black/30 opacity-40 z-0 pointer-events-none" />
              
              <div className="space-y-6 max-w-xl text-center md:text-left z-10">
                <span className="text-xs font-semibold text-accent-love tracking-widest uppercase mb-3 flex items-center justify-center md:justify-start gap-1.5">
                  <Moon className="w-4 h-4 fill-accent-love/20" /> Wind Down
                </span>
                <h3 className="text-3xl md:text-4xl font-serif font-bold leading-tight">
                  You did your best today.
                </h3>
                <p className="text-indigo-200/80 font-display text-sm md:text-base leading-relaxed">
                  Tomorrow is another beautiful opportunity. Let's close out today with warm thoughts and gratitude.
                </p>
                
                <button
                  onClick={finishToday}
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-primary-love to-accent-love text-white font-semibold rounded-full shadow-lg shadow-primary-love/25 hover:scale-105 transition-all font-display text-sm tracking-wide cursor-pointer"
                >
                  Finish Today &bull; Rest
                </button>
              </div>

              {/* Night moon visualizer */}
              <div className="w-full max-w-[200px] aspect-square relative z-10 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                  {/* Stars */}
                  <circle cx="20" cy="30" r="1" fill="#fff" opacity="0.8" className="animate-pulse" />
                  <circle cx="80" cy="20" r="1.5" fill="#fff" opacity="0.6" className="animate-pulse" />
                  <circle cx="50" cy="70" r="0.8" fill="#fff" opacity="0.5" className="animate-pulse" />
                  {/* Moon */}
                  <circle cx="50" cy="50" r="30" fill="url(#moonGrad)" />
                  <circle cx="62" cy="42" r="28" fill="#0f172a" />
                  <defs>
                    <linearGradient id="moonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFF0F6" />
                      <stop offset="100%" stopColor="#C084FC" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-[32px] border-2 border-emerald-100 bg-gradient-to-tr from-emerald-500/10 to-teal-500/5 p-8 text-center flex flex-col items-center justify-center gap-4 relative overflow-hidden"
            >
              <div className="p-4 bg-emerald-100 text-emerald-600 rounded-full mb-2">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-text-dark">Today is Fully Complete!</h3>
              <p className="text-sm text-text-sub max-w-md leading-relaxed">
                You took amazing care of yourself today. Sleep well, sweetheart. I'll see you in the morning!
              </p>
              <button
                onClick={() => setDayFinished(false)}
                className="mt-3 text-xs font-semibold text-primary-love hover:text-accent-love transition-colors cursor-pointer"
              >
                Log more details / Restart day
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* --- CELEBRATION MODAL OVERLAY --- */}
      {createPortal(
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCelebration(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="max-w-md w-full bg-white border border-primary-love/15 rounded-[32px] p-8 text-center space-y-6 relative overflow-hidden"
              >
                {/* Confetti details */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        left: `${Math.random() * 80 + 10}%`,
                        top: `-20px`,
                        backgroundColor: i % 3 === 0 ? '#f472b6' : i % 3 === 1 ? '#c084fc' : '#38bdf8'
                      }}
                      animate={{
                        y: ['0vh', '50vh'],
                        x: ['0px', `${(Math.random() - 0.5) * 60}px`],
                        rotate: [0, 360],
                      }}
                      transition={{
                        duration: Math.random() * 2 + 1.5,
                        ease: 'easeOut',
                      }}
                    />
                  ))}
                </div>

                <div className="p-4 bg-primary-love/10 text-primary-love rounded-full w-fit mx-auto animate-bounce">
                  <Heart className="w-8 h-8 fill-primary-love" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-serif font-bold text-text-dark">Today was beautiful!</h3>
                  <p className="text-sm text-text-sub leading-relaxed">
                    "I'm so incredibly proud of you for prioritizing your wellness today. You are worth every single step. Get some rest, love."
                  </p>
                </div>

                <button
                  onClick={() => setShowCelebration(false)}
                  className="w-full py-3 bg-primary-love text-white text-xs font-semibold rounded-full hover:bg-primary-love/90 shadow-lg shadow-primary-love/20 cursor-pointer"
                >
                  Close &bull; Sleep well ❤️
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* --- ARTICLE MODAL WINDOW --- */}
      {createPortal(
        <AnimatePresence>
          {activeModalTopic && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModalTopic(null)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 25 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 25 }}
                onClick={(e) => e.stopPropagation()}
                className="max-w-lg w-[90%] sm:w-full bg-white border border-primary-love/15 rounded-[32px] p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-xl"
              >
                {/* Close Button */}
                <button
                  onClick={() => setActiveModalTopic(null)}
                  className="absolute top-4 right-4 p-2 text-text-sub hover:text-text-dark transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="space-y-4">
                  <div className={`p-2.5 w-fit rounded-xl border ${activeModalTopic.color}`}>
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-text-dark">{activeModalTopic.title}</h3>
                  <p className="text-sm text-text-sub/90 leading-relaxed text-justify">
                    {activeModalTopic.content}
                  </p>
                </div>

                <div className="bg-primary-love/5 border border-primary-love/10 p-4 rounded-2xl flex gap-3.5 items-center">
                  <Heart className="w-6 h-6 text-primary-love fill-primary-love/10 shrink-0" />
                  <p className="text-xs text-primary-love italic font-serif">
                    "I want you to be healthy because your longevity and strength are what make our days together possible. Take care of yourself, sweet girl."
                  </p>
                </div>

                <button
                  onClick={() => setActiveModalTopic(null)}
                  className="w-full py-3 border border-primary-love/20 text-primary-love text-xs font-semibold rounded-full hover:bg-primary-love/5 transition-colors cursor-pointer"
                >
                  Go Back to Dashboard
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
};
export default Home;
