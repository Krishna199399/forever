import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/common/GlassCard';
import {
  TrendingUp,
  Sparkles,
  Printer,
  Calendar,
  Dumbbell,
  Target,
  Edit2
} from 'lucide-react';
import api from '@/lib/api';

// Interfaces for aggregated values
interface SummaryStats {
  workoutMinutes: number;
  waterCups: number;
  sleepHours: number;
  moodLevel: string;
  cycleDay: number;
  completedTasks: number;
}



export const Progress: React.FC = () => {
  // --- DATABASE & AGGREGATION STATES ---
  const [sleepLogs, setSleepLogs] = useState<any[]>([]);
  const [cycleLogs, setCycleLogs] = useState<any[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);

  // User Target Goals
  const [waterGoal, setWaterGoal] = useState(() => Number(localStorage.getItem('progress_water_goal') || '8'));
  const [workoutGoal, setWorkoutGoal] = useState(() => Number(localStorage.getItem('progress_workout_goal') || '30'));
  const [sleepGoal, setSleepGoal] = useState(() => Number(localStorage.getItem('progress_sleep_goal') || '8'));
  
  const [editingGoals, setEditingGoals] = useState(false);

  // Dynamic dashboard stats (Self-care values) - Loaded from localStorage
  const [todayStats, setTodayStats] = useState<SummaryStats>(() => {
    return {
      workoutMinutes: Number(localStorage.getItem('workout_mins') || '0'),
      waterCups: Number(localStorage.getItem('water_cups') || '0'),
      sleepHours: Number(localStorage.getItem('sleep_hours') || '0'),
      moodLevel: localStorage.getItem('active_mood') || 'Calm',
      cycleDay: 14, // Average mid-cycle default
      completedTasks: 0
    };
  });





  // Load history data from server
  const loadStatsData = async () => {
    try {
      const resSleep = await api.get('/api/sleep-logs');
      if (resSleep.data) setSleepLogs(resSleep.data);

      const resCycle = await api.get('/api/cycle-logs');
      if (resCycle.data) setCycleLogs(resCycle.data);

      const resWorkout = await api.get('/api/workout-progress');
      if (resWorkout.data) setWorkoutLogs(resWorkout.data);
    } catch (e) {
      console.log('API Offline. Progress dashboard operating in standalone local mode.');
    }
  };

  useEffect(() => {
    loadStatsData();
  }, []);

  // Sync todayStats edits to localStorage
  useEffect(() => {
    localStorage.setItem('water_cups', String(todayStats.waterCups));
    localStorage.setItem('sleep_hours', String(todayStats.sleepHours));
    localStorage.setItem('workout_mins', String(todayStats.workoutMinutes));
    localStorage.setItem('active_mood', todayStats.moodLevel);
  }, [todayStats]);

  // Sync goal edits to localStorage
  useEffect(() => {
    localStorage.setItem('progress_water_goal', String(waterGoal));
    localStorage.setItem('progress_workout_goal', String(workoutGoal));
    localStorage.setItem('progress_sleep_goal', String(sleepGoal));
  }, [waterGoal, workoutGoal, sleepGoal]);

  // Quick edit triggers
  const handleAddWater = () => {
    const nextWater = Math.min(todayStats.waterCups + 1, 12);
    setTodayStats((prev) => ({ ...prev, waterCups: nextWater }));
    localStorage.setItem('water_cups', String(nextWater));
  };

  const handleSubWater = () => {
    const nextWater = Math.max(todayStats.waterCups - 1, 0);
    setTodayStats((prev) => ({ ...prev, waterCups: nextWater }));
    localStorage.setItem('water_cups', String(nextWater));
  };

  // Wellness score calculated value
  const overallWellnessScore = useMemo(() => {
    const waterScore = Math.min((todayStats.waterCups / waterGoal) * 100, 100);
    const sleepScore = Math.min((todayStats.sleepHours / sleepGoal) * 100, 100);
    const workoutScore = Math.min((todayStats.workoutMinutes / workoutGoal) * 100, 100);
    
    return Math.round((waterScore + sleepScore + workoutScore) / 3);
  }, [todayStats, waterGoal, sleepGoal, workoutGoal]);

  // Encouraging Insights sentences calculated dynamically
  const encouragingInsights = useMemo(() => {
    const totalSleepLogs = sleepLogs.length;
    const goodSleepLogs = sleepLogs.filter((l) => l.quality === 'Good' || l.quality === 'Deep').length;
    return [
      `You have recorded ${totalSleepLogs} logs on your sleep tracking journey.`,
      `You achieved ${goodSleepLogs} nights of deep, hormone-balancing rest.`,
      `Your current water consumption targets are matching your goals. Stay hydrated!`,
      "Deep sleep waves logged are supporting hormones naturally."
    ];
  }, [sleepLogs]);

  // Generate past 7 calendar days (e.g. Sun, Mon, Tue ... Today)
  const last7DaysList = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayLabel = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = d.toISOString().split('T')[0];
      days.push({ dayLabel, dateStr });
    }
    return days;
  }, []);

  // Dynamic 7-day workout minutes mapping
  const weeklyWorkoutData = useMemo(() => {
    const defaultMins = [20, 35, 15, 45, 30, 25, todayStats.workoutMinutes];
    return last7DaysList.map((dayObj, idx) => {
      const logMatch = workoutLogs.find((w) => w.completedDate === dayObj.dateStr);
      let mins = logMatch ? (logMatch.duration || 0) : defaultMins[idx];
      if (idx === 6) mins = todayStats.workoutMinutes; // Always sync Today's live slider
      return {
        label: dayObj.dayLabel,
        mins: Number(mins)
      };
    });
  }, [last7DaysList, workoutLogs, todayStats.workoutMinutes]);

  // Dynamic 7-day water cups mapping
  const weeklyWaterData = useMemo(() => {
    const defaultPattern = [6, 7, 8, 7, 6, 8, todayStats.waterCups];
    return last7DaysList.map((dayObj, idx) => {
      const cups = idx === 6 ? todayStats.waterCups : defaultPattern[idx];
      return {
        label: dayObj.dayLabel,
        cups: Number(cups)
      };
    });
  }, [last7DaysList, todayStats.waterCups]);

  // Dynamic Average Cups across 7 days
  const avgWaterCups = useMemo(() => {
    const total = weeklyWaterData.reduce((acc, d) => acc + d.cups, 0);
    return (total / 7).toFixed(1);
  }, [weeklyWaterData]);

  // Dynamic SVG Smooth Bezier Curve Path for Hydration Wave
  const waveSvgPath = useMemo(() => {
    const points = weeklyWaterData.map((d, i) => {
      const x = (i / 6) * 100;
      // Map 0..12 cups to Y 26..6 on SVG canvas height 32
      const y = 26 - (Math.min(d.cups, 12) / 12) * 20;
      return { x, y, cups: d.cups, label: d.label };
    });

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const mx = (curr.x + next.x) / 2;
      path += ` C ${mx} ${curr.y}, ${mx} ${next.y}, ${next.x} ${next.y}`;
    }
    const areaPath = `${path} L 100 32 L 0 32 Z`;
    return { linePath: path, areaPath, points };
  }, [weeklyWaterData]);

  // Render printable report
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-12 pb-20">
      
      {/* Background radial overlays */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-peach-300/10 blur-[120px] animate-float-1" />
        <div className="absolute bottom-[20%] right-[-5%] w-[55vw] h-[55vw] rounded-full bg-pink-300/15 blur-[140px] animate-float-2" />
      </div>

      <div className="relative z-10 space-y-12 max-w-7xl mx-auto px-4">

        {/* --- HERO INSIGHTS HEADER --- */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[32px] overflow-hidden border border-white/40 shadow-glass bg-gradient-to-tr from-peach-100/40 via-pink-100/35 to-lavender-50/20 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-md"
        >
          <div className="absolute inset-px rounded-[31px] border border-white/50 pointer-events-none z-10" />

          <div className="space-y-6 max-w-xl text-center md:text-left z-20">
            <span className="text-xs font-semibold text-primary-love tracking-widest uppercase mb-3 flex items-center justify-center md:justify-start gap-1.5 animate-pulse-soft">
              <Sparkles className="w-4 h-4 fill-primary-love/20" /> Performance & Consistency
            </span>
            <h1 className="text-4xl md:text-6xl font-serif text-text-dark font-bold leading-tight">
              Look how far you've come ❤️
            </h1>
            <p className="text-text-sub font-display text-sm md:text-base leading-relaxed">
              "Every small step is becoming a beautiful story." Pinned milestones, consistency scores, and encouraging reports safely kept.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3.5 text-xs font-semibold text-text-sub uppercase tracking-wider">

              <span className="flex items-center gap-1.5 bg-white/70 px-4 py-1.5 rounded-full border border-primary-love/10 shadow-sm">
                <Target className="w-4 h-4 text-purple-400" /> Wellness Index: {overallWellnessScore}%
              </span>
              {(sleepLogs.length > 0 || cycleLogs.length > 0) && (
                <span className="flex items-center gap-1.5 bg-white/70 px-4 py-1.5 rounded-full border border-primary-love/10 shadow-sm">
                  <Calendar className="w-4 h-4 text-pink-400" /> Total Logs: {sleepLogs.length + cycleLogs.length}
                </span>
              )}
            </div>
          </div>

          {/* Quick PDF report print */}
          <div className="w-full max-w-[230px] aspect-square relative z-20 flex items-center justify-center bg-white/50 border border-white/80 rounded-[28px] p-6 shadow-sm">
            <div className="text-center space-y-3">
              <span className="text-4xl block">📊</span>
              <h3 className="text-xs font-semibold text-text-sub uppercase tracking-wider font-sans">Report Export</h3>
              <button
                onClick={handlePrintReport}
                className="px-6 py-2.5 bg-primary-love text-white rounded-full text-xs font-semibold shadow-md shadow-primary-love/10 hover:scale-103 transition-transform flex items-center justify-center gap-1.5 cursor-pointer print:hidden"
              >
                <Printer className="w-4 h-4" /> Export PDF Summary
              </button>
            </div>
          </div>
        </motion.div>

        {/* --- OVERALL CONCENTRIC WELLNESS dashboard --- */}
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Concentric rings score wheels */}
          <GlassCard animateHover={false} className="md:col-span-2 flex flex-col md:flex-row items-center gap-8 justify-around">
            <div className="relative w-44 h-44 flex items-center justify-center">
              {/* Outer Water circle */}
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 absolute">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#ffe4e6" strokeWidth="2.2" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="#f472b6"
                  strokeWidth="2.2"
                  strokeDasharray="97"
                  strokeDashoffset={97 - (Math.min(todayStats.waterCups / waterGoal, 1) * 97)}
                  strokeLinecap="round"
                />
              </svg>

              {/* Inner Sleep circle */}
              <svg viewBox="0 0 36 36" className="w-32 h-32 transform -rotate-90 absolute">
                <circle cx="18" cy="18" r="13" fill="none" stroke="#e0e7ff" strokeWidth="2.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="13"
                  fill="none"
                  stroke="#c084fc"
                  strokeWidth="2.5"
                  strokeDasharray="81"
                  strokeDashoffset={81 - (Math.min(todayStats.sleepHours / sleepGoal, 1) * 81)}
                  strokeLinecap="round"
                />
              </svg>

              {/* Core score text */}
              <div className="text-center z-10 space-y-0.5">
                <span className="text-xs font-semibold text-text-sub uppercase">Wellness</span>
                <p className="text-3xl font-serif font-bold text-text-dark">{overallWellnessScore}%</p>
              </div>
            </div>

            {/* Core indicators index */}
            <div className="space-y-4 max-w-xs w-full">
              <h3 className="text-base font-serif font-bold text-text-dark">Wellness Score Index</h3>
              
              <div className="space-y-2.5 text-xs text-text-sub">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pink-400" /> Hydration ({todayStats.waterCups}/{waterGoal} Cups)</span>
                  <span className="font-bold text-text-dark">{Math.round((todayStats.waterCups / waterGoal) * 100)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Restful Sleep ({todayStats.sleepHours}/{sleepGoal}h)</span>
                  <span className="font-bold text-text-dark">{Math.round((todayStats.sleepHours / sleepGoal) * 100)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-peach-400" /> Workout Minutes ({todayStats.workoutMinutes}/{workoutGoal}m)</span>
                  <span className="font-bold text-text-dark">{Math.round((todayStats.workoutMinutes / workoutGoal) * 100)}%</span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* AI Insights and Positivity notes */}
          <GlassCard animateHover={false} className="flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-primary-love uppercase tracking-widest">Self-Care Encouragement</span>
              <h3 className="text-base font-serif font-bold text-text-dark mt-1">Encouraging Reflections</h3>
            </div>

            <div className="space-y-3.5 my-4">
              {encouragingInsights.slice(0, 2).map((sentence, idx) => (
                <div key={idx} className="p-3 bg-pink-50/50 border border-primary-love/5 rounded-xl text-xs text-text-sub leading-relaxed">
                  💡 {sentence}
                </div>
              ))}
            </div>

            <span className="text-[9px] text-text-sub/70 italic text-center block">
              "Tomorrow is another beautiful opportunity to take care of yourself."
            </span>
          </GlassCard>
        </div>

        {/* --- TODAY'S QUICK EDIT PANEL --- */}
        <div className="space-y-6">
          <h2 className="text-2xl font-serif text-text-dark pl-2">Today's Quick Summary</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            
            {/* Water Quick edit */}
            <GlassCard animateHover={false} className="p-5 flex flex-col justify-between h-36">
              <div>
                <span className="text-xs font-bold text-text-sub block">💧 Today's Water</span>
                <span className="text-2xl font-serif font-bold text-text-dark mt-2 block">{todayStats.waterCups} Cups</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSubWater}
                  className="px-2.5 py-1 bg-white/70 border border-primary-love/10 text-primary-love rounded-lg text-xs font-semibold cursor-pointer"
                >
                  -1
                </button>
                <button
                  onClick={handleAddWater}
                  className="flex-1 py-1 bg-primary-love text-white rounded-lg text-xs font-semibold hover:bg-primary-love/90 shadow-sm cursor-pointer"
                >
                  +1 Cup
                </button>
              </div>
            </GlassCard>

            {/* Sleep Hours edit */}
            <GlassCard animateHover={false} className="p-5 flex flex-col justify-between h-36">
              <div>
                <span className="text-xs font-bold text-text-sub block">🌙 Rest Duration</span>
                <span className="text-2xl font-serif font-bold text-text-dark mt-2 block">{todayStats.sleepHours} Hours</span>
              </div>
              <input
                type="range"
                min="4"
                max="10"
                step="0.5"
                value={todayStats.sleepHours}
                onChange={(e) => setTodayStats((prev) => ({ ...prev, sleepHours: Number(e.target.value) }))}
                className="w-full h-1 bg-pink-100 rounded-lg appearance-none cursor-pointer accent-primary-love"
              />
            </GlassCard>

            {/* Workout Minutes edit */}
            <GlassCard animateHover={false} className="p-5 flex flex-col justify-between h-36">
              <div>
                <span className="text-xs font-bold text-text-sub block">💪 Movement minutes</span>
                <span className="text-2xl font-serif font-bold text-text-dark mt-2 block">{todayStats.workoutMinutes} Min</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={todayStats.workoutMinutes}
                onChange={(e) => setTodayStats((prev) => ({ ...prev, workoutMinutes: Number(e.target.value) }))}
                className="w-full h-1 bg-pink-100 rounded-lg appearance-none cursor-pointer accent-primary-love"
              />
            </GlassCard>

            {/* Mood selector dropdown */}
            <GlassCard animateHover={false} className="p-5 flex flex-col justify-between h-36">
              <div>
                <span className="text-xs font-bold text-text-sub block">😌 Today's Mood</span>
                <span className="text-2xl font-serif font-bold text-text-dark mt-2 block">{todayStats.moodLevel}</span>
              </div>
              <select
                value={todayStats.moodLevel}
                onChange={(e) => setTodayStats((prev) => ({ ...prev, moodLevel: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs border border-primary-love/10 rounded-lg bg-white/50 focus:outline-none"
              >
                <option>Calm</option>
                <option>Amazing</option>
                <option>Happy</option>
                <option>Okay</option>
                <option>Low</option>
              </select>
            </GlassCard>

          </div>
        </div>

        {/* --- WEEKLY DATA SVG TREND CHARTS --- */}
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Workout Minutes SVG Bar chart */}
          <GlassCard animateHover={false} className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-serif font-bold text-text-dark flex items-center gap-1.5">
                <Dumbbell className="w-5 h-5 text-primary-love" /> Weekly Workout Minutes
              </h3>
              <span className="text-[10px] font-bold text-primary-love bg-pink-50 border border-primary-love/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Real-Time Logs
              </span>
            </div>

            {/* SVG Bars chart */}
            <div className="h-48 w-full bg-white/40 border border-primary-love/5 rounded-2xl flex items-end justify-around p-4 relative group">
              {weeklyWorkoutData.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5 w-10 text-center relative group/bar">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-7 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-text-dark text-white text-[9px] font-bold px-2 py-0.5 rounded-md pointer-events-none whitespace-nowrap z-30 shadow-md">
                    {item.mins}m Active
                  </div>
                  <span className="text-[10px] font-bold text-primary-love">{item.mins}m</span>
                  <motion.div
                    className="w-3.5 bg-gradient-to-t from-pink-400 to-rose-300 rounded-t-md shadow-sm"
                    style={{ height: `${Math.max(Math.min((item.mins / 60) * 110, 120), 8)}px` }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.5, delay: idx * 0.08 }}
                  />
                  <span className="text-[9px] text-text-sub font-bold uppercase">{item.label}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Water Intake Area wave line chart */}
          <GlassCard animateHover={false} className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-serif font-bold text-text-dark flex items-center gap-1.5">
                <TrendingUp className="w-5 h-5 text-primary-love" /> Hydration Wave Trends
              </h3>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                Number(avgWaterCups) >= waterGoal * 0.75 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                  : 'bg-amber-50 border-amber-200 text-amber-600'
              }`}>
                {Number(avgWaterCups) >= waterGoal * 0.75 ? 'Consistency Goal Met' : 'Building Hydration'}
              </span>
            </div>

            {/* Responsive SVG Area Wave */}
            <div className="h-48 w-full bg-white/40 border border-primary-love/5 rounded-2xl p-4 relative flex flex-col justify-between overflow-hidden">
              <div className="flex justify-between items-center text-[10px] text-text-sub/80 font-bold uppercase tracking-wider z-10">
                <span>Avg: {avgWaterCups} Cups / Day</span>
                <span>Goal: {waterGoal} Cups</span>
              </div>

              <div className="relative w-full h-28 mt-2">
                <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="w-full h-full">
                  <defs>
                    <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f472b6" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#f472b6" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  
                  {/* Dynamic Area Fill */}
                  <path d={waveSvgPath.areaPath} fill="url(#waveGrad)" />
                  
                  {/* Dynamic Wave Stroke */}
                  <path d={waveSvgPath.linePath} fill="none" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round" />
                  
                  {/* Data Points */}
                  {waveSvgPath.points.map((pt, i) => (
                    <g key={i}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="1.8"
                        className="fill-primary-love stroke-white stroke-[0.8] hover:r-3 transition-all cursor-pointer"
                      />
                    </g>
                  ))}
                </svg>

                {/* Day Labels below Wave */}
                <div className="flex justify-between text-[9px] font-bold text-text-sub uppercase mt-1 px-1">
                  {weeklyWaterData.map((d, i) => (
                    <span key={i} title={`${d.cups} Cups (${(d.cups * 0.25).toFixed(1)}L)`}>
                      {d.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* --- DYNAMIC GOALS PANEL --- */}
        <GlassCard animateHover={false} className="space-y-6">
          <div className="flex justify-between items-center border-b border-primary-love/5 pb-3">
            <div>
              <h3 className="text-lg font-serif font-bold text-text-dark flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-love" /> Edit Self-Care Target Goals
              </h3>
              <p className="text-xs text-text-sub mt-0.5">Adjust target values to match cycle constraints.</p>
            </div>
            
            <button
              onClick={() => setEditingGoals(!editingGoals)}
              className="text-xs font-bold text-primary-love border border-primary-love/15 px-4 py-2 rounded-xl flex items-center gap-1 hover:bg-primary-love/5 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" /> {editingGoals ? 'Done Editing' : 'Modify Targets'}
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Water Target Goal progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-text-dark">
                <span>Daily Hydration Goal</span>
                <span className="text-primary-love">{waterGoal} Cups</span>
              </div>
              {editingGoals ? (
                <input
                  type="number"
                  value={waterGoal}
                  onChange={(e) => setWaterGoal(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs border border-primary-love/10 rounded-lg bg-white"
                />
              ) : (
                <div className="w-full h-2 bg-pink-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-love" style={{ width: `${Math.min((todayStats.waterCups / waterGoal) * 100, 100)}%` }} />
                </div>
              )}
            </div>

            {/* Workout minutes Target Goal */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-text-dark">
                <span>Daily Movement Goal</span>
                <span className="text-primary-love">{workoutGoal} Minutes</span>
              </div>
              {editingGoals ? (
                <input
                  type="number"
                  value={workoutGoal}
                  onChange={(e) => setWorkoutGoal(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs border border-primary-love/10 rounded-lg bg-white"
                />
              ) : (
                <div className="w-full h-2 bg-pink-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-love" style={{ width: `${Math.min((todayStats.workoutMinutes / workoutGoal) * 100, 100)}%` }} />
                </div>
              )}
            </div>

            {/* Sleep Target Goal */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-text-dark">
                <span>Restful Sleep Target</span>
                <span className="text-primary-love">{sleepGoal} Hours</span>
              </div>
              {editingGoals ? (
                <input
                  type="number"
                  value={sleepGoal}
                  onChange={(e) => setSleepGoal(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs border border-primary-love/10 rounded-lg bg-white"
                />
              ) : (
                <div className="w-full h-2 bg-pink-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-love" style={{ width: `${Math.min((todayStats.sleepHours / sleepGoal) * 100, 100)}%` }} />
                </div>
              )}
            </div>

          </div>
        </GlassCard>





      </div>

    </div>
  );
};
export default Progress;
