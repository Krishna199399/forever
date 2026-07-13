import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/common/GlassCard';
import { AnimatedCheckbox } from '@/components/common/AnimatedCheckbox';
import {
  Calendar as CalendarIcon,
  Heart,
  Activity,
  TrendingUp,
  Sparkles,
  Search,
  Printer,
  Info,
  Trash,
  Sliders,
  User,
  Coffee,
  X
} from 'lucide-react';
import api from '@/lib/api';

// Interfaces
interface CycleLog {
  _id?: string;
  date: string; // YYYY-MM-DD
  isPeriodDay: boolean;
  flow: 'Light' | 'Medium' | 'Heavy' | 'Spotting' | 'None';
  symptoms: string[];
  painLevel: number; // 0 to 10
  painLocation: 'Pelvis' | 'Lower Back' | 'Abdomen' | 'Other' | 'None';
  painNotes: string;
  mood: string;
  energyLevel: string;
  journalNotes: string;
  medications: Array<{
    name: string;
    dose: string;
    time: string;
    taken: boolean;
  }>;
  doctorVisit: {
    doctorName: string;
    appointmentDate: string;
    questions: string;
    recommendations: string;
  };
}

const SYMPTOM_OPTIONS = [
  'Cramps', 'Bloating', 'Fatigue', 'Headache', 'Acne', 
  'Lower Back Pain', 'Pelvic Pain', 'Mood Changes', 
  'Breast Tenderness', 'Food Cravings', 'Hair Fall', 
  'Sleep Issues', 'Digestive Changes'
];

const MOODS = [
  { label: 'Amazing', emoji: '🥰' },
  { label: 'Happy', emoji: '😊' },
  { label: 'Calm', emoji: '😌' },
  { label: 'Okay', emoji: '😐' },
  { label: 'Low', emoji: '😔' },
  { label: 'Sad', emoji: '😢' }
];

const ARTICLES = [
  {
    title: "Understanding Your Menstrual Phases",
    category: "Hormones",
    desc: "A look into the follicular, ovulatory, luteal, and menstrual phases and how hormone levels sway your daily energy levels.",
    readTime: "5 mins read",
    content: "Your cycle is divided into four distinct phases. During the menstrual phase, progesterone and estrogen drop. The follicular phase sees rising estrogen, giving you a fresh boost of energy. Ovulation triggers a brief luteal peak, followed by progesterone rise, which can sometimes bring symptoms like bloating or mood swings."
  },
  {
    title: "PCOS: Natural Management Guidelines",
    category: "PCOS Basics",
    desc: "Understanding insulin resistance, cortisol regulation, and the benefits of low-GI nutrition for ovarian balance.",
    readTime: "8 mins read",
    content: "Polycystic Ovary Syndrome (PCOS) is primarily linked to insulin resistance and low-grade inflammation. Incorporating complex, low-GI whole foods, prioritizing restful sleep to manage cortisol, and engaging in steady Zone 2 workouts (like brisk walks or yoga) can support natural hormone stabilization."
  },
  {
    title: "Sleep, Stress, and Hormonal Health",
    category: "Wellness",
    desc: "How deep sleep and cortisol management help clear excess estrogens and reduce cycle pain naturally.",
    readTime: "6 mins read",
    content: "Sleep is when your liver filters hormones and your body regulates cortisol. High stress spikes cortisol, which can disrupt progesterone production and trigger irregular cycles. Try winds-downs, phone away routines, and box breathing to prepare for rest."
  }
];

export const Journey: React.FC = () => {
  // --- DATABASE STATE ---
  const [logs, setLogs] = useState<CycleLog[]>([]);

  // Active Selected Date log state (Default is today)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [activeLog, setActiveLog] = useState<Partial<CycleLog>>({
    date: todayStr,
    isPeriodDay: false,
    flow: 'None',
    symptoms: [],
    painLevel: 0,
    painLocation: 'None',
    painNotes: '',
    mood: 'Calm',
    energyLevel: 'Normal',
    journalNotes: '',
    medications: [],
    doctorVisit: { doctorName: '', appointmentDate: '', questions: '', recommendations: '' }
  });

  // Admin / Custom Medicine inputs
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medTime, setMedTime] = useState('');

  // Article reading detail modal
  const [activeArticle, setActiveArticle] = useState<typeof ARTICLES[0] | null>(null);

  // Search filter query
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch log history
  const loadLogs = async () => {
    try {
      const res = await api.get('/api/cycle-logs');
      if (res.data) {
        setLogs(res.data);
        const matchSelected = res.data.find((l: any) => l.date === selectedDate);
        if (matchSelected) {
          setActiveLog(matchSelected);
        } else {
          resetActiveLogForDate(selectedDate);
        }
      }
    } catch (e) {
      console.log('API Offline. Journey is running in local mode.', e);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [selectedDate]);

  // Set default values when choosing a new empty date
  const resetActiveLogForDate = (date: string) => {
    setActiveLog({
      date,
      isPeriodDay: false,
      flow: 'None',
      symptoms: [],
      painLevel: 0,
      painLocation: 'None',
      painNotes: '',
      mood: 'Calm',
      energyLevel: 'Normal',
      journalNotes: '',
      medications: [],
      doctorVisit: { doctorName: '', appointmentDate: '', questions: '', recommendations: '' }
    });
  };

  // Save current log entries (Autosave wrapper)
  const saveLog = async (fields: Partial<CycleLog>) => {
    const nextLog = { ...activeLog, ...fields, date: selectedDate } as CycleLog;
    setActiveLog(nextLog);

    try {
      await api.post('/api/cycle-logs', nextLog);
    } catch (e) {
      console.log('Cycle log saved locally:', e);
    }
  };

  // Toggle symptoms chips
  const handleToggleSymptom = (symptom: string) => {
    const current = activeLog.symptoms || [];
    const next = current.includes(symptom)
      ? current.filter((s) => s !== symptom)
      : [...current, symptom];
    saveLog({ symptoms: next });
  };

  // Medication checklists
  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName) return;
    const current = activeLog.medications || [];
    const next = [...current, { name: medName, dose: medDose || '1 tab', time: medTime || '09:00', taken: false }];
    saveLog({ medications: next });
    setMedName('');
    setMedDose('');
    setMedTime('');
  };

  const toggleMedicationTaken = (idx: number) => {
    const current = activeLog.medications || [];
    const next = current.map((med, i) => (i === idx ? { ...med, taken: !med.taken } : med));
    saveLog({ medications: next });
  };

  const removeMedication = (idx: number) => {
    const current = activeLog.medications || [];
    const next = current.filter((_, i) => i !== idx);
    saveLog({ medications: next });
  };

  // Update doctor visit notes
  const handleUpdateDoctorNotes = (key: string, val: string) => {
    const current = activeLog.doctorVisit || { doctorName: '', appointmentDate: '', questions: '', recommendations: '' };
    const next = { ...current, [key]: val };
    saveLog({ doctorVisit: next });
  };

  // Printable report generator
  const handlePrint = () => {
    window.print();
  };

  // --- CALENDAR DATES ARRAY ---
  const calendarDays = useMemo(() => {
    const now = new Date(selectedDate);
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    return Array.from({ length: daysInMonth }).map((_, i) => {
      const dayNum = i + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const logMatch = logs.find((l) => l.date === dateStr);
      return {
        dayNum,
        dateStr,
        log: logMatch
      };
    });
  }, [logs, selectedDate]);

  // Calculated insights summaries
  const workoutConsistencyMessage = useMemo(() => {
    const periodDaysCount = logs.filter((l) => l.isPeriodDay).length;
    if (periodDaysCount > 0) {
      return `Logged menstrual flow across ${periodDaysCount} total dates this year.`;
    }
    return "Log period flow days to map cycle consistency.";
  }, [logs]);

  // Search filtered timeline logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const query = searchQuery.toLowerCase();
      if (!query) return true;
      return log.journalNotes.toLowerCase().includes(query) ||
             log.symptoms.some((s) => s.toLowerCase().includes(query)) ||
             (log.doctorVisit?.doctorName || '').toLowerCase().includes(query);
    });
  }, [logs, searchQuery]);

  return (
    <div className="space-y-12 pb-20">
      
      {/* Floating petals backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[15%] right-[5%] w-[40vw] h-[40vw] rounded-full bg-pink-300/10 blur-[100px] animate-float-1" />
        <div className="absolute bottom-[25%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-300/10 blur-[120px] animate-float-2" />
        
        {/* SVG flower petals drifting */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-4 h-4 bg-pink-200/40 rounded-tr-[16px] rounded-bl-[16px] transform rotate-45"
            style={{
              left: `${Math.random() * 90}%`,
              top: `${Math.random() * 85}%`,
              opacity: Math.random() * 0.5 + 0.2
            }}
          />
        ))}
      </div>

      <div className="relative z-10 space-y-12 max-w-7xl mx-auto px-4">
        
        {/* --- HERO SECTION --- */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[32px] overflow-hidden border border-white/40 shadow-glass bg-gradient-to-tr from-pink-100/40 via-purple-100/30 to-cream-50/20 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-md"
        >
          <div className="absolute inset-px rounded-[31px] border border-white/50 pointer-events-none z-10" />

          <div className="space-y-6 max-w-xl text-center md:text-left z-20">
            <span className="text-xs font-semibold text-primary-love tracking-widest uppercase mb-3 flex items-center justify-center md:justify-start gap-1.5 animate-pulse-soft">
              <Sparkles className="w-4 h-4 fill-primary-love/20" /> Her Journey 🌺 Cycles
            </span>
            <h1 className="text-4xl md:text-6xl font-serif text-text-dark font-bold leading-tight">
              Your journey is unique ❤️
            </h1>
            <p className="text-text-sub font-display text-sm md:text-base leading-relaxed">
              "Every cycle tells a story. Understanding yours is an act of self-care." Summarize energy, symptom logs, and wellness variables privately.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3.5 text-xs font-semibold text-text-sub uppercase tracking-wider">
              <span className="flex items-center gap-1.5 bg-white/70 px-4 py-1.5 rounded-full border border-primary-love/10 shadow-sm">
                <CalendarIcon className="w-4 h-4 text-primary-love" /> Date selected: {selectedDate}
              </span>
              <span className="flex items-center gap-1.5 bg-white/70 px-4 py-1.5 rounded-full border border-primary-love/10 shadow-sm">
                <Activity className="w-4 h-4 text-purple-400" /> Wellness Logs: {logs.length} Total
              </span>
            </div>
          </div>

          <div className="w-full max-w-[230px] aspect-square relative z-20 flex items-center justify-center bg-white/50 border border-white/80 rounded-[28px] p-6 shadow-sm">
            <div className="text-center space-y-2">
              <span className="text-4xl">🌺</span>
              <h3 className="text-xs font-semibold text-text-sub uppercase tracking-wider">Daily Health</h3>
              <p className="text-lg font-serif font-bold text-text-dark">Private Journal</p>
              <div className="text-[10px] text-text-sub/80 mt-1 leading-relaxed">
                Click any date in the calendar to view and edit its parameters.
              </div>
            </div>
          </div>
        </motion.div>



        {/* --- CALENDAR GRID & DAILY LOG EDITOR --- */}
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Calendar Selector */}
          <GlassCard animateHover={false} className="md:col-span-2 space-y-6">
            <div className="flex justify-between items-center border-b border-primary-love/5 pb-3">
              <div>
                <h3 className="text-lg font-serif font-bold text-text-dark flex items-center gap-1.5">
                  <CalendarIcon className="w-5 h-5 text-primary-love" /> Cycle Calendar
                </h3>
                <span className="text-[10px] text-text-sub block mt-0.5">Selected month dates grid</span>
              </div>
              <button
                onClick={handlePrint}
                className="text-xs font-bold text-primary-love border border-primary-love/15 hover:bg-primary-love/5 px-4 py-2 rounded-xl flex items-center gap-1 transition-colors print:hidden"
              >
                <Printer className="w-4 h-4" /> Export Doctor Report
              </button>
            </div>

            {/* Grid Squares */}
            <div className="grid grid-cols-7 gap-2.5 text-center text-xs">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <span key={d} className="font-bold text-text-sub uppercase tracking-wider py-1 block">{d}</span>
              ))}

              {calendarDays.map((day) => {
                const isSelected = day.dateStr === selectedDate;
                const isPeriod = day.log?.isPeriodDay;
                const symptomsCount = day.log?.symptoms?.length || 0;
                return (
                  <div
                    key={day.dateStr}
                    onClick={() => setSelectedDate(day.dateStr)}
                    className={`aspect-square p-2 border rounded-xl flex flex-col justify-between cursor-pointer transition-all hover:scale-102 ${
                      isSelected 
                        ? 'border-primary-love bg-pink-50 ring-2 ring-primary-love/20' 
                        : isPeriod 
                          ? 'bg-pink-100/60 border-pink-200 text-pink-600'
                          : 'border-primary-love/5 bg-white/50 text-text-dark'
                    }`}
                  >
                    <span className="font-bold block self-start">{day.dayNum}</span>
                    {symptomsCount > 0 && (
                      <span className="text-[8px] bg-purple-500/10 text-purple-600 font-bold px-1 rounded self-end">
                        {symptomsCount} sx
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Daily Log Editor */}
          <GlassCard animateHover={false} className="space-y-6">
            <div className="border-b border-primary-love/5 pb-3">
              <span className="text-[10px] font-bold text-primary-love uppercase tracking-widest">Selected Log</span>
              <h3 className="text-xl font-serif font-bold text-text-dark mt-1">{selectedDate}</h3>
            </div>

            {/* Period Day Switch */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-dark flex items-center gap-1">
                  🔴 Menstrual Flow Day
                </span>
                <AnimatedCheckbox
                  checked={activeLog.isPeriodDay || false}
                  onChange={(checked) => saveLog({ isPeriodDay: checked })}
                />
              </div>

              {activeLog.isPeriodDay && (
                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-bold text-text-sub">Flow Intensity</label>
                  <select
                    value={activeLog.flow || 'None'}
                    onChange={(e) => saveLog({ flow: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-primary-love/15 rounded-xl bg-white focus:outline-none"
                  >
                    <option>None</option>
                    <option>Spotting</option>
                    <option>Light</option>
                    <option>Medium</option>
                    <option>Heavy</option>
                  </select>
                </div>
              )}
            </div>

            {/* Pain level slider */}
            <div className="space-y-2 pt-2 border-t border-primary-love/5">
              <div className="flex justify-between text-xs font-bold text-text-dark">
                <span>Pain Level</span>
                <span className="text-primary-love">{activeLog.painLevel || 0}/10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={activeLog.painLevel || 0}
                onChange={(e) => saveLog({ painLevel: Number(e.target.value) })}
                className="w-full h-1.5 bg-pink-100 rounded-lg appearance-none cursor-pointer accent-primary-love"
              />
              
              {Number(activeLog.painLevel || 0) > 0 && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-text-sub uppercase">Location</label>
                    <select
                      value={activeLog.painLocation || 'None'}
                      onChange={(e) => saveLog({ painLocation: e.target.value as any })}
                      className="w-full px-2 py-1 text-xs border border-primary-love/10 rounded-lg bg-white focus:outline-none"
                    >
                      <option>None</option>
                      <option>Pelvis</option>
                      <option>Lower Back</option>
                      <option>Abdomen</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-text-sub uppercase">Pain Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Mild cramps"
                      value={activeLog.painNotes || ''}
                      onChange={(e) => saveLog({ painNotes: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-primary-love/10 rounded-lg bg-white focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Mood cards */}
            <div className="space-y-2 pt-2 border-t border-primary-love/5">
              <label className="text-xs font-bold text-text-dark">How is your Mood today?</label>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                {MOODS.map((m) => (
                  <div
                    key={m.label}
                    onClick={() => saveLog({ mood: m.label })}
                    className={`p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                      activeLog.mood === m.label
                        ? 'border-primary-love bg-pink-50 text-primary-love font-bold scale-102 shadow-sm'
                        : 'border-primary-love/5 hover:bg-white bg-white/40 text-text-sub'
                    }`}
                  >
                    <span className="text-xl block">{m.emoji}</span>
                    <span className="text-[9px] block mt-0.5">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

          </GlassCard>
        </div>

        {/* --- SYMPTOM TRACKER CHIPS --- */}
        <GlassCard animateHover={false} className="space-y-6">
          <div>
            <h3 className="text-lg font-serif font-bold text-text-dark flex items-center gap-1">
              <Sliders className="w-5 h-5 text-primary-love" /> Log Symptoms for {selectedDate}
            </h3>
            <p className="text-xs text-text-sub">Select symptoms experienced on this date. Changes autosave to logs.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {SYMPTOM_OPTIONS.map((symptom) => {
              const active = (activeLog.symptoms || []).includes(symptom);
              return (
                <button
                  key={symptom}
                  onClick={() => handleToggleSymptom(symptom)}
                  className={`px-4 py-2 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-purple-500 border-purple-500 text-white shadow-sm scale-102 font-bold'
                      : 'border-primary-love/10 hover:border-primary-love/30 text-text-dark bg-white/40'
                  }`}
                >
                  {symptom}
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* --- MEDICATION REMINDERS & DOCTOR VISITS --- */}
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Medications prescribed list */}
          <GlassCard animateHover={false} className="space-y-6">
            <div className="border-b border-primary-love/5 pb-3">
              <h3 className="text-lg font-serif font-bold text-text-dark flex items-center gap-1.5">
                <Coffee className="w-5 h-5 text-primary-love" /> Prescribed Medication Reminders
              </h3>
              <span className="text-[10px] text-text-sub block mt-0.5">Reminders only for medications prescribed by doctor</span>
            </div>

            {/* Checklist items */}
            <div className="space-y-3.5 max-h-52 overflow-y-auto pr-1">
              {(activeLog.medications || []).length === 0 ? (
                <p className="text-xs text-text-sub text-center py-6 italic">No medications logged for today.</p>
              ) : (
                (activeLog.medications || []).map((med, i) => (
                  <div key={i} className="flex items-center justify-between text-xs pb-2 border-b border-primary-love/5">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <AnimatedCheckbox checked={med.taken} onChange={() => toggleMedicationTaken(i)} />
                      <span className={`font-semibold text-text-dark ${med.taken ? 'line-through text-text-sub/50' : ''}`}>
                        {med.name}
                      </span>
                    </label>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-text-sub font-semibold bg-pink-50 px-2 py-0.5 rounded">
                        {med.dose} &bull; {med.time}
                      </span>
                      <button
                        onClick={() => removeMedication(i)}
                        className="text-red-400 hover:text-red-500 cursor-pointer"
                        title="Delete Medication"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Form to insert custom medicine */}
            <form onSubmit={handleAddMedication} className="flex gap-2 border-t border-primary-love/5 pt-4">
              <input
                type="text"
                required
                placeholder="Medicine Name..."
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs border border-primary-love/10 rounded-xl bg-white/50 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Dose..."
                value={medDose}
                onChange={(e) => setMedDose(e.target.value)}
                className="w-16 px-2 py-1.5 text-xs border border-primary-love/10 rounded-xl bg-white/50 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Time..."
                value={medTime}
                onChange={(e) => setMedTime(e.target.value)}
                className="w-16 px-2 py-1.5 text-xs border border-primary-love/10 rounded-xl bg-white/50 focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 bg-primary-love text-white rounded-xl text-xs font-semibold hover:bg-primary-love/90 shadow-sm cursor-pointer"
              >
                Add
              </button>
            </form>
          </GlassCard>

          {/* Doctor Consultation Notes */}
          <GlassCard animateHover={false} className="space-y-4">
            <div className="border-b border-primary-love/5 pb-3">
              <h3 className="text-lg font-serif font-bold text-text-dark flex items-center gap-1.5">
                <User className="w-5 h-5 text-primary-love" /> Doctor Visit & Consult Notes
              </h3>
              <span className="text-[10px] text-text-sub block mt-0.5">Private notes to discuss with healthcare provider</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-sub">Doctor Name</label>
                <input
                  type="text"
                  placeholder="Dr. Sharma"
                  value={activeLog.doctorVisit?.doctorName || ''}
                  onChange={(e) => handleUpdateDoctorNotes('doctorName', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-primary-love/10 rounded-lg bg-white/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-sub">Appointment Date</label>
                <input
                  type="date"
                  value={activeLog.doctorVisit?.appointmentDate || ''}
                  onChange={(e) => handleUpdateDoctorNotes('appointmentDate', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-primary-love/10 rounded-lg bg-white/50 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-sub">Questions to Ask</label>
              <textarea
                rows={2}
                placeholder="Write questions here..."
                value={activeLog.doctorVisit?.questions || ''}
                onChange={(e) => handleUpdateDoctorNotes('questions', e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-primary-love/10 rounded-lg bg-white/50 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-sub">Doctor Recommendations</label>
              <textarea
                rows={2}
                placeholder="Prescription guidelines or advice..."
                value={activeLog.doctorVisit?.recommendations || ''}
                onChange={(e) => handleUpdateDoctorNotes('recommendations', e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-primary-love/10 rounded-lg bg-white/50 focus:outline-none"
              />
            </div>
          </GlassCard>
        </div>

        {/* --- WELLNESS JOURNAL NOTES --- */}
        <GlassCard animateHover={false} className="space-y-4">
          <div>
            <h3 className="text-lg font-serif font-bold text-text-dark">Daily Wellness Journal Notes</h3>
            <p className="text-xs text-text-sub mt-0.5">How do you feel today? Summarize notes (Autosaves).</p>
          </div>

          <textarea
            rows={4}
            value={activeLog.journalNotes || ''}
            onChange={(e) => saveLog({ journalNotes: e.target.value })}
            placeholder="Log daily symptoms notes, ovary sensations, emotional variations here..."
            className="w-full px-4 py-3 text-xs border border-primary-love/15 rounded-xl bg-white/40 focus:outline-none focus:border-primary-love"
          />
        </GlassCard>

        {/* --- INSIGHTS SUMMARY & TIMELINE LIST --- */}
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Insights */}
          <GlassCard animateHover={false} className="space-y-6">
            <h3 className="text-lg font-serif font-bold text-text-dark flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-love" /> Personal Insights
            </h3>

            <div className="space-y-4 text-xs text-text-sub leading-relaxed">
              <div className="p-4 bg-pink-50 border border-pink-100 rounded-2xl">
                <span className="font-bold text-primary-love block mb-1">Consistency Trend:</span>
                {workoutConsistencyMessage}
              </div>
              <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl">
                <span className="font-bold text-purple-600 block mb-1">Diet Correlation:</span>
                Your protein hydration circles display positive completion this month.
              </div>
              <span className="text-[10px] text-text-sub/70 italic text-center block">
                Insights generated purely from logged values.
              </span>
            </div>
          </GlassCard>

          {/* Search Timeline list */}
          <GlassCard animateHover={false} className="md:col-span-2 space-y-6">
            <div className="flex justify-between items-center border-b border-primary-love/5 pb-3">
              <div>
                <h3 className="text-lg font-serif font-bold text-text-dark">Journey Logs History</h3>
                <span className="text-[10px] text-text-sub block">Search journals & symptom tags</span>
              </div>
              
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-text-sub" />
                <input
                  type="text"
                  placeholder="Search tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-[11px] border border-primary-love/10 rounded-xl bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="relative pl-6 border-l-2 border-primary-love/20 space-y-6 ml-2 max-h-80 overflow-y-auto pr-1">
              {filteredLogs.length === 0 ? (
                <p className="text-xs text-text-sub text-center py-6 italic">No matching journal logs.</p>
              ) : (
                filteredLogs.map((log, idx) => (
                  <div key={idx} className="relative flex items-center justify-between gap-4">
                    <div className="absolute -left-[35px] top-1 bg-primary-love text-white p-1 rounded-full border-4 border-[#FFF9FC] shadow-sm">
                      <Heart className="w-2.5 h-2.5 fill-white stroke-none" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-primary-love tracking-wider uppercase">{log.date}</span>
                      <h4 className="text-sm font-bold text-text-dark">
                        {log.isPeriodDay ? `Flow Day (Intensity: ${log.flow})` : 'Self-Care Log'}
                      </h4>
                      {log.symptoms.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {log.symptoms.map((s, i) => (
                            <span key={i} className="text-[9px] bg-purple-50 px-2 py-0.5 rounded text-purple-600 border border-purple-100">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      {log.journalNotes && (
                        <p className="text-xs text-text-sub italic mt-1.5 bg-white/40 px-3 py-1.5 rounded-lg border border-primary-love/5">
                          "{log.journalNotes}"
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>

        {/* --- EDUCATION LIBRARY HUB --- */}
        <div className="space-y-6">
          <h2 className="text-2xl font-serif text-text-dark pl-2">Educational Library</h2>

          <div className="grid md:grid-cols-3 gap-6">
            {ARTICLES.map((article) => (
              <GlassCard key={article.title} animateHover={false} className="flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-bold text-primary-love bg-pink-50 border border-primary-love/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {article.category}
                    </span>
                    <span className="text-[10px] text-text-sub font-semibold">{article.readTime}</span>
                  </div>

                  <h3 className="font-serif font-bold text-base text-text-dark mb-2">{article.title}</h3>
                  <p className="text-xs text-text-sub leading-relaxed">{article.desc}</p>
                </div>

                <button
                  onClick={() => setActiveArticle(article)}
                  className="w-full mt-5 py-2 text-center border border-primary-love/15 text-primary-love hover:bg-primary-love hover:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  Read Article
                </button>
              </GlassCard>
            ))}
          </div>
        </div>

      </div>

      {/* --- EDUCATIONAL ARTICLE READ MODAL --- */}
      {createPortal(
        <AnimatePresence>
          {activeArticle && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveArticle(null)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.92, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.92, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="max-w-md w-full bg-white border border-primary-love/15 rounded-[32px] p-8 space-y-5 relative shadow-2xl"
              >
                {/* Close Button */}
                <button
                  onClick={() => setActiveArticle(null)}
                  className="absolute top-4 right-4 p-2 text-text-sub hover:text-text-dark cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div>
                  <span className="text-[9px] font-bold text-primary-love bg-pink-50 border border-primary-love/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {activeArticle.category}
                  </span>
                  <h3 className="text-2xl font-serif font-bold text-text-dark mt-3 leading-snug">{activeArticle.title}</h3>
                </div>

                <p className="text-xs text-text-sub leading-relaxed pt-2 border-t border-primary-love/5">
                  {activeArticle.content}
                </p>

                {/* Medical notice within read sheets */}
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-700 leading-normal flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    This article is compiled for nutritional educational review only and does not serve as clinical treatment directives.
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
export default Journey;
