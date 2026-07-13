import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/common/GlassCard';
import {
  Lock,
  Clock,
  Droplet,
  Moon,
  AlertTriangle,
  Activity,
  Mail,
  Plus,
  Trash2,
  Send
} from 'lucide-react';
import api from '@/lib/api';

interface LoggedWorkout {
  workoutTitle: string;
  duration: number;
  calories: number;
  mood: string;
  notes?: string;
}

interface LoggedSleep {
  bedtime: string;
  wakeTime: string;
  hoursSlept: number;
  quality: 'Restless' | 'Good' | 'Deep';
  gratitudeJournal?: string;
}

interface LoggedMeal {
  mealName: string;
  mealType: string;
  calories?: number;
  notes?: string;
}

interface LoggedWater {
  consumedCups: number;
  targetCups: number;
}

interface LoggedCycle {
  isPeriodDay: boolean;
  flow: string;
  painLevel: number;
  painNotes?: string;
  symptoms: string[];
}

interface TimelineItem {
  date: string;
  workouts: LoggedWorkout[];
  sleep: LoggedSleep | null;
  meals: LoggedMeal[];
  water: LoggedWater | null;
  cycle: LoggedCycle | null;
}

interface CaregiverStats {
  avgSleep: string;
  avgWater: string;
  totalWorkouts: number;
}

export const CaregiverPortal: React.FC = () => {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [stats, setStats] = useState<CaregiverStats | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [daysCount, setDaysCount] = useState(14);
  const [activeTab, setActiveTab] = useState<'timeline' | 'audit' | 'letters'>('timeline');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Love Letters Admin State inside Caregiver Portal
  const [letters, setLetters] = useState<any[]>([]);
  const [letterAnalytics, setLetterAnalytics] = useState<any>(null);
  const [lettersSubSection, setLettersSubSection] = useState<'Dashboard' | 'Create' | 'All' | 'Templates'>('Dashboard');
  const [isSubmittingLetter, setIsSubmittingLetter] = useState(false);
  const [letterSuccessAlert, setLetterSuccessAlert] = useState('');
  const [letterErrorAlert, setLetterErrorAlert] = useState('');
  const [formLetter, setFormLetter] = useState<any>({
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

  const [verifyingPin, setVerifyingPin] = useState(false);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode || passcode.length < 4) {
      setAuthError('Please enter the 4-digit PIN.');
      return;
    }
    try {
      setVerifyingPin(true);
      const res = await api.post('/api/caregiver/verify-pin', { pin: passcode });
      if (res.data?.success) {
        setIsAuthenticated(true);
        setAuthError('');
        loadCaregiverLogs();
        loadAuditLogs();
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Incorrect Passcode. Access Denied.');
      setPasscode('');
    } finally {
      setVerifyingPin(false);
    }
  };

  const loadCaregiverLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/caregiver/activities?days=${daysCount}`);
      if (res.data) {
        setStats(res.data.stats);
        setTimeline(res.data.timeline);
      }
    } catch (err) {
      console.error('Failed to load caregiver activities logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      setLoadingAudit(true);
      const res = await api.get('/api/caregiver/audit?limit=60');
      if (res.data) {
        setAuditLogs(res.data);
      }
    } catch (err) {
      console.error('Failed to load caregiver audit logs:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  const loadLoveLettersAdmin = async () => {
    try {
      const res = await api.get('/api/letters');
      if (res.data) setLetters(res.data);
      const resAnalytics = await api.get('/api/letters/analytics');
      if (resAnalytics.data) setLetterAnalytics(resAnalytics.data);
    } catch (e) {
      console.error('Failed to load love letters in caregiver portal:', e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'timeline') {
        loadCaregiverLogs();
      } else if (activeTab === 'audit') {
        loadAuditLogs();
      } else if (activeTab === 'letters') {
        loadLoveLettersAdmin();
      }
    }
  }, [daysCount, isAuthenticated, activeTab]);

  // Helper to format date string to human-friendly format
  const formatHeaderDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  };

  // Lock Keypad display helper
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#FFF9FC]">
        {/* Decorative background blobs */}
        <div className="absolute top-[20%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-pink-100 opacity-50 blur-[80px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[35vw] h-[35vw] rounded-full bg-purple-100 opacity-50 blur-[80px]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm w-full relative z-10"
        >
          <GlassCard animateHover={false} className="border border-primary-love/15 p-8 text-center space-y-6 shadow-2xl">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary-love/10 flex items-center justify-center text-primary-love">
              <Lock className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <h1 className="text-xl font-serif font-bold text-text-dark">Caregiver Portal</h1>
              <p className="text-xs text-text-sub">Enter the 4-digit code to access self-care logs</p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <input
                type="password"
                maxLength={4}
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value.replace(/\D/g, ''));
                  setAuthError('');
                }}
                placeholder="••••"
                className="w-full text-center tracking-[1.5em] text-2xl py-3 border border-primary-love/15 rounded-2xl bg-white/50 focus:outline-none focus:border-primary-love"
              />

              {authError && (
                <p className="text-xs font-semibold text-red-500 animate-pulse">{authError}</p>
              )}

              <button
                type="submit"
                disabled={verifyingPin}
                className="w-full py-3.5 bg-primary-love text-white font-semibold text-xs tracking-widest uppercase rounded-2xl hover:bg-primary-love/90 shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-wait"
              >
                {verifyingPin ? 'Verifying…' : 'Access Dashboard'}
              </button>
            </form>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto px-4 py-8 relative">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-pink-100 opacity-40 blur-[90px]" />
        <div className="absolute bottom-[30%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-purple-100 opacity-30 blur-[110px]" />
      </div>

      <div className="relative z-10 space-y-8">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-primary-love/10 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-text-dark flex items-center gap-2">
              🌸 Hidden Caregiver Portal
            </h1>
            <p className="text-xs text-text-sub mt-1">Review her activity logs, nutrition consistency, and cycle health</p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-text-sub font-bold">Query range:</label>
            <select
              value={daysCount}
              onChange={(e) => setDaysCount(Number(e.target.value))}
              className="px-3 py-1.5 text-xs border border-primary-love/15 rounded-xl bg-white focus:outline-none cursor-pointer font-bold text-text-dark font-sans"
            >
              <option value={7}>Past 7 Days</option>
              <option value={14}>Past 14 Days</option>
              <option value={30}>Past 30 Days</option>
            </select>
          </div>
        </div>

        {/* --- COMPLIANCE SCORECARDS --- */}
        {stats && (
          <div className="grid sm:grid-cols-3 gap-6">
            <GlassCard animateHover={false} className="p-5 flex items-center gap-4 relative overflow-hidden">
              <div className="p-3 bg-pink-500/10 rounded-2xl text-primary-love">
                <Moon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-text-sub uppercase font-bold tracking-wider block">Sleep Target</span>
                <p className="text-2xl font-serif font-bold text-text-dark mt-0.5">{stats.avgSleep} hrs</p>
                <div className="mt-1 flex items-center gap-1.5">
                  {Number(stats.avgSleep) < 6 ? (
                    <span className="text-[9px] font-bold text-red-500 flex items-center gap-0.5 bg-red-50 px-1.5 py-0.5 rounded font-sans">
                      <AlertTriangle className="w-3 h-3" /> Short Sleep Alert
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded font-sans">
                      Optimal Duration
                    </span>
                  )}
                </div>
              </div>
            </GlassCard>

            <GlassCard animateHover={false} className="p-5 flex items-center gap-4 relative overflow-hidden">
              <div className="p-3 bg-sky-500/10 rounded-2xl text-sky-500">
                <Droplet className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-text-sub uppercase font-bold tracking-wider block">Avg Hydration</span>
                <p className="text-2xl font-serif font-bold text-text-dark mt-0.5">
                  {(Number(stats.avgWater) * 0.25).toFixed(1)}L <span className="text-xs text-text-sub font-sans">({stats.avgWater} cups)</span>
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  {Number(stats.avgWater) < 8 ? (
                    <span className="text-[9px] font-bold text-red-500 flex items-center gap-0.5 bg-red-50 px-1.5 py-0.5 rounded font-sans">
                      <AlertTriangle className="w-3 h-3" /> Under Target
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded font-sans">
                      Fully Hydrated
                    </span>
                  )}
                </div>
              </div>
            </GlassCard>

            <GlassCard animateHover={false} className="p-5 flex items-center gap-4 relative overflow-hidden">
              <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-text-sub uppercase font-bold tracking-wider block">Routine Activity</span>
                <p className="text-2xl font-serif font-bold text-text-dark mt-0.5">{stats.totalWorkouts} sessions</p>
                <span className="text-[9px] font-semibold text-text-sub mt-1 block">Completed this period</span>
              </div>
            </GlassCard>
          </div>
        )}

        {/* --- TAB SELECTORS --- */}
        <div className="flex flex-wrap gap-4 border-b border-primary-love/10 pb-4 z-20 relative font-sans">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-primary-love text-white shadow-md'
                : 'bg-white/50 border border-primary-love/10 text-text-sub hover:bg-white'
            }`}
          >
            📅 Daily Self-Care Timeline
          </button>

          <button
            onClick={() => setActiveTab('letters')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'letters'
                ? 'bg-primary-love text-white shadow-md'
                : 'bg-white/50 border border-primary-love/10 text-text-sub hover:bg-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" /> 💌 Daily Love Letters Admin
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'bg-primary-love text-white shadow-md'
                : 'bg-white/50 border border-primary-love/10 text-text-sub hover:bg-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> ⏱️ App Usage Audit Logs
          </button>
        </div>

        {/* --- CHRONOLOGICAL TIMELINE FEED --- */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <h2 className="text-lg font-serif font-bold text-text-dark pl-2">📅 Timeline Log Feed</h2>

            {loading ? (
              <div className="text-center py-20 text-text-sub font-serif animate-pulse">Fetching activities feed...</div>
            ) : timeline.length === 0 ? (
              <p className="text-xs text-text-sub text-center py-20 bg-white/30 border border-primary-love/5 rounded-2xl font-sans">
                No logged activities found in this time range.
              </p>
            ) : (
              <div className="space-y-6">
                {timeline.map((day) => {
                  // Determine if this day has any entries
                  const hasLogs = day.workouts.length > 0 || day.sleep || day.meals.length > 0 || day.water || day.cycle;

                  return (
                    <div key={day.date} className="relative pl-6 border-l-2 border-primary-love/15">
                      {/* Timeline bullet dot */}
                      <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-primary-love border border-white" />

                      <div className="space-y-4">
                        {/* Day Header */}
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-serif font-bold text-text-dark">{formatHeaderDate(day.date)}</h3>
                          <span className="text-[10px] text-text-sub font-mono bg-white border border-primary-love/10 px-2 py-0.5 rounded-full">
                            {day.date}
                          </span>
                        </div>

                        {!hasLogs ? (
                          <p className="text-[11px] text-text-sub italic pl-2 font-sans">No inputs logged for this day.</p>
                        ) : (
                          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 pl-2 font-sans">
                            
                            {/* 🏃 Workouts Card */}
                            {day.workouts.length > 0 && (
                              <div className="p-4 bg-white border border-pink-100 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Workouts
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  {day.workouts.map((w, idx) => (
                                    <div key={idx} className="text-xs">
                                      <h4 className="font-bold text-text-dark">{w.workoutTitle}</h4>
                                      <p className="text-[10px] text-text-sub mt-0.5">{w.duration} mins • {w.calories} kcal</p>
                                      {w.mood && <p className="text-[10px] text-primary-love mt-1 font-semibold">Mood: {w.mood}</p>}
                                      {w.notes && (
                                        <p className="text-[10px] text-text-sub bg-pink-50/50 p-2 rounded-lg border border-pink-50/50 italic mt-1.5">
                                          "{w.notes}"
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 🛌 Sleep Card */}
                            {day.sleep && (
                              <div className="p-4 bg-white border border-purple-100 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Sleep
                                  </span>
                                  {day.sleep.hoursSlept < 6 && (
                                    <span className="text-[9px] font-bold text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse">
                                      <AlertTriangle className="w-2.5 h-2.5" /> Short
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs space-y-1.5">
                                  <p className="font-bold text-text-dark">{day.sleep.hoursSlept} hours slept</p>
                                  <p className="text-[10px] text-text-sub">
                                    Timing: {day.sleep.bedtime} - {day.sleep.wakeTime}
                                  </p>
                                  <p className="text-[10px] text-text-sub">Quality: <strong className="text-purple-600">{day.sleep.quality}</strong></p>
                                  {day.sleep.gratitudeJournal && (
                                    <div className="text-[10px] text-text-sub bg-purple-50/50 p-2 rounded-lg border border-purple-50/50 italic mt-2">
                                      <strong>Gratitude snippet:</strong>
                                      <p className="mt-0.5">"{day.sleep.gratitudeJournal}"</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* 💧 Water Card */}
                            {day.water && (
                              <div className="p-4 bg-white border border-sky-100 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Hydration
                                  </span>
                                  {day.water.consumedCups < 8 && (
                                    <span className="text-[9px] font-bold text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse">
                                      <AlertTriangle className="w-2.5 h-2.5" /> Low
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs">
                                  <p className="font-bold text-text-dark">
                                    {(day.water.consumedCups * 0.25).toFixed(2)}L consumed
                                  </p>
                                  <p className="text-[10px] text-text-sub mt-0.5">
                                    {day.water.consumedCups} / {day.water.targetCups} target cups
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* 🩸 Cycle & Symptoms Card */}
                            {day.cycle && (
                              <div className="p-4 bg-white border border-rose-100 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Cycle Status
                                  </span>
                                  {day.cycle.painLevel >= 3 && (
                                    <span className="text-[9px] font-bold text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse font-sans">
                                      <AlertTriangle className="w-2.5 h-2.5" /> High Pain
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs space-y-1.5">
                                  <p className="font-bold text-text-dark">
                                    {day.cycle.isPeriodDay ? `🔴 Period Day (${day.cycle.flow} Flow)` : '⚪ Non-Period Day'}
                                  </p>
                                  <p className="text-[10px] text-text-sub">Pain Index: <strong>{day.cycle.painLevel}/10</strong></p>
                                  {day.cycle.symptoms && day.cycle.symptoms.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {day.cycle.symptoms.map((s, idx) => (
                                        <span key={idx} className="text-[8px] font-semibold bg-rose-500/10 border border-rose-500/15 px-1.5 py-0.5 rounded text-rose-600">
                                          {s}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {day.cycle.painNotes && (
                                    <p className="text-[10px] text-text-sub bg-rose-50/50 p-2 rounded-lg border border-rose-50/50 italic mt-2">
                                      "{day.cycle.painNotes}"
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* 🍽️ Meals Card */}
                            {day.meals && day.meals.length > 0 && (
                              <div className="p-4 bg-white border border-orange-100 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Nutrition Slots
                                  </span>
                                </div>
                                <div className="space-y-2 text-xs">
                                  {day.meals.map((m, idx) => (
                                    <div key={idx} className="border-b border-orange-50/50 pb-1.5 last:border-b-0 last:pb-0">
                                      <span className="text-[9px] font-bold text-orange-500 block">{m.mealType}</span>
                                      <h4 className="font-semibold text-text-dark mt-0.5">{m.mealName}</h4>
                                      {m.notes && <p className="text-[10px] text-text-sub italic mt-0.5">"{m.notes}"</p>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- AUDIT LOG PANEL --- */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <h2 className="text-lg font-serif font-bold text-text-dark pl-2">⏱️ App Usage & Activity Audit Logs</h2>

            {loadingAudit ? (
              <div className="text-center py-20 text-text-sub font-serif animate-pulse">Fetching audit records...</div>
            ) : auditLogs.length === 0 ? (
              <p className="text-xs text-text-sub text-center py-20 bg-white/30 border border-primary-love/5 rounded-2xl font-sans">
                No active audit logs recorded yet.
              </p>
            ) : (
              <div className="bg-white border border-primary-love/10 rounded-[28px] overflow-hidden shadow-sm">
                <div className="p-6 overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-primary-love/10 text-text-sub font-bold uppercase tracking-wider text-[10px] font-sans">
                        <th className="pb-3 pl-2">Timestamp</th>
                        <th className="pb-3">Action performed</th>
                        <th className="pb-3">Category</th>
                        <th className="pb-3 pr-2">System Context</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary-love/5 text-text-dark font-medium font-sans">
                      {auditLogs.map((log: any) => {
                        const dateObj = new Date(log.timestamp);
                        const displayTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                        const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                        const catColors: Record<string, string> = {
                          Navigation: 'bg-sky-500/10 text-sky-600 border-sky-500/15',
                          Workout: 'bg-pink-500/10 text-pink-600 border-pink-500/15',
                          Input: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/15'
                        };

                        return (
                          <tr key={log._id} className="hover:bg-pink-50/10 transition-colors">
                            <td className="py-3.5 pl-2 text-text-sub font-mono text-[10px]">
                              {displayDate} • {displayTime}
                            </td>
                            <td className="py-3.5 font-sans font-semibold">
                              {log.action}
                            </td>
                            <td className="py-3.5">
                              <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${catColors[log.category] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                {log.category}
                              </span>
                            </td>
                            <td className="py-3.5 pr-2 font-mono text-[10px] text-text-sub max-w-[200px] truncate" title={log.details}>
                              {log.details || 'None'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- LOVE LETTERS MANAGEMENT TAB SECTION --- */}
        {activeTab === 'letters' && (
          <div className="space-y-8">
            {/* Sub-nav */}
            <div className="flex flex-wrap gap-2 border-b border-primary-love/10 pb-4">
              {(['Dashboard', 'Create', 'All', 'Templates'] as const).map((sec) => (
                <button
                  key={sec}
                  onClick={() => setLettersSubSection(sec)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    lettersSubSection === sec
                      ? 'bg-text-dark text-white shadow-sm'
                      : 'bg-white/40 text-text-sub hover:text-text-dark border border-primary-love/10'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>

            {/* DASHBOARD */}
            {lettersSubSection === 'Dashboard' && letterAnalytics && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <GlassCard animateHover={false} className="p-5">
                    <span className="text-[10px] font-bold text-text-sub uppercase">Total Letters</span>
                    <p className="text-3xl font-serif font-bold text-text-dark mt-1">{letterAnalytics.totalLetters}</p>
                  </GlassCard>

                  <GlassCard animateHover={false} className="p-5">
                    <span className="text-[10px] font-bold text-text-sub uppercase">Published</span>
                    <p className="text-3xl font-serif font-bold text-emerald-600 mt-1">{letterAnalytics.publishedCount}</p>
                  </GlassCard>

                  <GlassCard animateHover={false} className="p-5">
                    <span className="text-[10px] font-bold text-text-sub uppercase">Read Rate</span>
                    <p className="text-3xl font-serif font-bold text-primary-love mt-1">{letterAnalytics.readRate}%</p>
                  </GlassCard>

                  <GlassCard animateHover={false} className="p-5">
                    <span className="text-[10px] font-bold text-text-sub uppercase">Favorited</span>
                    <p className="text-3xl font-serif font-bold text-purple-600 mt-1">{letterAnalytics.favoritesCount}</p>
                  </GlassCard>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <GlassCard animateHover={false} className="space-y-4">
                    <h3 className="text-lg font-serif font-bold text-text-dark">Reactions Breakdown</h3>
                    <div className="grid grid-cols-5 gap-3 text-center">
                      {['❤️', '😊', '🥹', '🌸', '⭐'].map((emoji) => (
                        <div key={emoji} className="p-3 bg-pink-50/50 rounded-xl border border-pink-100">
                          <span className="text-2xl block">{emoji}</span>
                          <span className="text-xs font-bold text-text-dark mt-1 block">
                            {letterAnalytics.reactionsMap?.[emoji] || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  <GlassCard animateHover={false} className="space-y-4 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-serif font-bold text-text-dark">Quick Action</h3>
                      <p className="text-xs text-text-sub mt-1">Publish a new daily love message or send reminders.</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setLettersSubSection('Create')}
                        className="flex-1 py-3 bg-primary-love text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Create Letter
                      </button>
                      <button
                        onClick={() => setLettersSubSection('Templates')}
                        className="flex-1 py-3 bg-white border border-primary-love/20 text-primary-love font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                      >
                        Templates
                      </button>
                    </div>
                  </GlassCard>
                </div>
              </div>
            )}

            {/* CREATE */}
            {lettersSubSection === 'Create' && (
              <GlassCard animateHover={false} className="p-8 space-y-6">
                <div className="border-b border-primary-love/10 pb-4">
                  <h3 className="text-xl font-serif font-bold text-text-dark">Create New Love Letter</h3>
                  <p className="text-xs text-text-sub">Write a custom message, select theme, mood, and delivery options.</p>
                </div>

                {letterSuccessAlert && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-bounce">
                    <span>{letterSuccessAlert}</span>
                  </div>
                )}

                {letterErrorAlert && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl">
                    <span>{letterErrorAlert}</span>
                  </div>
                )}

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!formLetter.title || !formLetter.content) {
                      setLetterErrorAlert('Title and Love Message Content are required!');
                      return;
                    }
                    try {
                      setIsSubmittingLetter(true);
                      setLetterErrorAlert('');
                      const res = await api.post('/api/letters', formLetter);
                      if (res.data) {
                        setLetters((prev) => [res.data, ...prev]);
                        setLetterSuccessAlert('❤️ Love Letter published successfully!');
                        
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

                        setTimeout(() => {
                          setLetterSuccessAlert('');
                          setLettersSubSection('All');
                          loadLoveLettersAdmin();
                        }, 1200);
                      }
                    } catch (err: any) {
                      console.log('Error creating letter:', err);
                      setLetterErrorAlert(err?.message || 'Failed to publish letter. Please check connection.');
                    } finally {
                      setIsSubmittingLetter(false);
                    }
                  }}
                  className="space-y-6"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-text-dark">Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Good Morning, My Sunshine ❤️"
                        value={formLetter.title}
                        onChange={(e) => setFormLetter({ ...formLetter, title: e.target.value })}
                        className="w-full p-2.5 text-xs border border-primary-love/20 rounded-xl bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-text-dark">Subtitle / Note</label>
                      <input
                        type="text"
                        placeholder="e.g. Start your day knowing you are cherished"
                        value={formLetter.subtitle}
                        onChange={(e) => setFormLetter({ ...formLetter, subtitle: e.target.value })}
                        className="w-full p-2.5 text-xs border border-primary-love/20 rounded-xl bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-dark">Love Message Content *</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Write your heart out..."
                      value={formLetter.content}
                      onChange={(e) => setFormLetter({ ...formLetter, content: e.target.value })}
                      className="w-full p-3 text-xs border border-primary-love/20 rounded-xl bg-white leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-text-dark">Category</label>
                      <select
                        value={formLetter.category}
                        onChange={(e) => setFormLetter({ ...formLetter, category: e.target.value })}
                        className="w-full p-2 text-xs border border-primary-love/20 rounded-xl bg-white"
                      >
                        <option>Love Letter</option>
                        <option>Morning Motivation</option>
                        <option>Workout Motivation</option>
                        <option>Meal Reminder</option>
                        <option>Water Reminder</option>
                        <option>Sleep Reminder</option>
                        <option>Special Day</option>
                        <option>Birthday</option>
                        <option>Anniversary</option>
                        <option>Achievement</option>
                        <option>Custom</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-text-dark">Emoji</label>
                      <input
                        type="text"
                        value={formLetter.emoji}
                        onChange={(e) => setFormLetter({ ...formLetter, emoji: e.target.value })}
                        className="w-full p-2 text-xs border border-primary-love/20 rounded-xl bg-white text-center"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-text-dark">Theme</label>
                      <select
                        value={formLetter.bgTheme}
                        onChange={(e) => setFormLetter({ ...formLetter, bgTheme: e.target.value })}
                        className="w-full p-2 text-xs border border-primary-love/20 rounded-xl bg-white"
                      >
                        <option>Rose</option>
                        <option>Lavender</option>
                        <option>Cream</option>
                        <option>Midnight</option>
                        <option>Sunset</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-text-dark">Font</label>
                      <select
                        value={formLetter.fontStyle}
                        onChange={(e) => setFormLetter({ ...formLetter, fontStyle: e.target.value })}
                        className="w-full p-2 text-xs border border-primary-love/20 rounded-xl bg-white"
                      >
                        <option>Handwritten</option>
                        <option>Serif</option>
                        <option>Sans</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-primary-love/10">
                    <label className="flex items-center gap-2 text-xs font-bold text-text-dark cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formLetter.published}
                        onChange={(e) => setFormLetter({ ...formLetter, published: e.target.checked })}
                        className="w-4 h-4 text-primary-love rounded"
                      />
                      Publish Immediately
                    </label>

                    <button
                      type="submit"
                      disabled={isSubmittingLetter}
                      className="px-8 py-3 bg-primary-love text-white font-bold text-xs rounded-xl shadow-lg hover:bg-primary-love/90 cursor-pointer disabled:opacity-50 disabled:cursor-wait flex items-center gap-1.5"
                    >
                      <Send className="w-4 h-4" /> {isSubmittingLetter ? 'Publishing...' : 'Publish Love Letter'}
                    </button>
                  </div>
                </form>
              </GlassCard>
            )}

            {/* ALL */}
            {lettersSubSection === 'All' && (
              <div className="space-y-4">
                <h3 className="text-xl font-serif font-bold text-text-dark">Manage All Love Letters</h3>
                <div className="space-y-3">
                  {letters.map((l) => (
                    <GlassCard key={l._id} animateHover={false} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{l.emoji}</span>
                        <div>
                          <h4 className="font-bold text-sm text-text-dark">{l.title}</h4>
                          <span className="text-[10px] text-text-sub">{l.category} • Status: {l.readStatus}</span>
                        </div>
                      </div>

                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!window.confirm('Delete this letter?')) return;
                          await api.delete(`/api/letters/${l._id}`);
                          loadLoveLettersAdmin();
                        }}
                        className="p-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </GlassCard>
                  ))}
                </div>
              </div>
            )}

            {/* TEMPLATES */}
            {lettersSubSection === 'Templates' && (
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { title: "Good Morning, My Love ❤️", category: "Morning Motivation", content: "Good morning, beautiful! I hope you woke up feeling rested and peaceful. Remember to sip a warm glass of water today. I love you so much.", emoji: "🌅" },
                  { title: "Hydration Reminder 💧", category: "Water Reminder", content: "Here is your gentle love reminder to drink a full cup of water right now! Your body deserves all the nourishment today.", emoji: "💧" },
                  { title: "Don't Forget Breakfast 🍳", category: "Meal Reminder", content: "Please make sure to eat a warm, wholesome breakfast. Fueling your energy keeps your hormone health in balance.", emoji: "🥐" },
                  { title: "I Am So Proud of You 🏆", category: "Achievement", content: "Whatever you accomplished today—big or small—I am cheering for you from the bottom of my heart.", emoji: "⭐" },
                  { title: "Sleep Peacefully, My Heart 🌙", category: "Sleep Reminder", content: "Put your phone away, dim the lights, and let go of today's worries. You did more than enough today. Sweet dreams!", emoji: "🌙" }
                ].map((tpl, i) => (
                  <GlassCard key={i} animateHover={false} className="p-6 space-y-4 flex flex-col justify-between">
                    <div>
                      <span className="text-2xl block mb-2">{tpl.emoji}</span>
                      <h4 className="font-serif font-bold text-base text-text-dark">{tpl.title}</h4>
                      <p className="text-xs text-text-sub italic mt-2">"{tpl.content}"</p>
                    </div>
                    <button
                      onClick={() => {
                        setFormLetter({
                          ...formLetter,
                          title: tpl.title,
                          category: tpl.category,
                          content: tpl.content,
                          emoji: tpl.emoji
                        });
                        setLettersSubSection('Create');
                      }}
                      className="w-full py-2.5 bg-primary-love text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                    >
                      Use Template
                    </button>
                  </GlassCard>
                ))}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default CaregiverPortal;
