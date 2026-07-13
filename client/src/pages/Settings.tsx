import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/common/GlassCard';
import {
  User,
  Settings as SettingsIcon,
  Bell,
  Shield,
  Download,
  Upload,
  Sparkles,
  Info,
  Moon,
  Sun,
  Laptop,
  CheckCircle
} from 'lucide-react';
import api from '@/lib/api';

interface ProfileData {
  name: string;
  birthday: string;
  height: number;
  weight: number;
  targetWeight: number;
  waterGoal: number;
  stepGoal: number;
  workoutGoal: number;
  sleepGoal: number;
  preferredWakeTime: string;
  preferredBedtime: string;
  favoriteQuote: string;
}

const CUSTOM_THEMES = [
  { id: 'pink', name: 'Forever Pink', color: 'bg-pink-400', desc: 'Soft warm blush accents' },
  { id: 'lavender', name: 'Lavender Dream', color: 'bg-purple-400', desc: 'Mystical soothing purple' },
  { id: 'peach', name: 'Peach Blossom', color: 'bg-orange-300', desc: 'Cozy sweet pastel orange' },
  { id: 'ocean', name: 'Ocean Calm', color: 'bg-sky-400', desc: 'Calming waves soft blue' },
  { id: 'midnight', name: 'Midnight Sky', color: 'bg-indigo-950', desc: 'Deep indigo star sky' },
  { id: 'sunset', name: 'Warm Sunset', color: 'bg-rose-400', desc: 'Emotional warm evening sky' },
  { id: 'forest', name: 'Forest Morning', color: 'bg-emerald-400', desc: 'Nourishing herbal green' }
];

export const Settings: React.FC = () => {
  // --- STATE SYSTEM ---
  const [profile, setProfile] = useState<ProfileData>(() => {
    const saved = localStorage.getItem('user_profile');
    return saved ? JSON.parse(saved) : {
      name: "Sweetheart",
      birthday: "2000-01-01",
      height: 165,
      weight: 58,
      targetWeight: 55,
      waterGoal: 8,
      stepGoal: 10000,
      workoutGoal: 30,
      sleepGoal: 8,
      preferredWakeTime: "07:00",
      preferredBedtime: "22:30",
      favoriteQuote: "Rest is where tomorrow begins."
    };
  });

  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem('app_theme') || 'pink');
  const [colorMode, setColorMode] = useState(() => localStorage.getItem('color_mode') || 'system');

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('reminders_config');
    return saved ? JSON.parse(saved) : {
      water: true,
      meal: true,
      workout: true,
      yoga: true,
      bedtime: true,
      morning: true,
      lovenote: true,
      cycle: true,
      journal: true
    };
  });

  const [successMsg, setSuccessMsg] = useState('');

  // Fetch settings from MongoDB database on load
  useEffect(() => {
    api.get('/api/settings/profile').then((res) => {
      if (res.data) {
        const p = res.data;
        setProfile({
          name: p.name || "Sweetheart",
          birthday: p.birthday || "2000-01-01",
          height: p.height || 165,
          weight: p.weight || 58,
          targetWeight: p.targetWeight || 55,
          waterGoal: p.waterGoal || 8,
          stepGoal: p.stepGoal || 10000,
          workoutGoal: p.workoutGoal || 30,
          sleepGoal: p.sleepGoal || 8,
          preferredWakeTime: p.preferredWakeTime || "07:00",
          preferredBedtime: p.preferredBedtime || "22:30",
          favoriteQuote: p.favoriteQuote || "Rest is where tomorrow begins."
        });
        if (p.theme) {
          setActiveTheme(p.theme);
          localStorage.setItem('app_theme', p.theme);
        }
        if (p.colorMode) {
          setColorMode(p.colorMode);
          localStorage.setItem('color_mode', p.colorMode);
        }
        if (p.notifications) {
          setNotifications(p.notifications);
          localStorage.setItem('reminders_config', JSON.stringify(p.notifications));
        }
      }
    }).catch((err) => {
      console.log('Using offline localStorage profile settings:', err);
    });
  }, []);

  // Save profile helper to MongoDB Database & Sync Target Goals
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('user_profile', JSON.stringify(profile));
    localStorage.setItem('progress_water_goal', String(profile.waterGoal));
    localStorage.setItem('progress_workout_goal', String(profile.workoutGoal));
    localStorage.setItem('progress_sleep_goal', String(profile.sleepGoal));

    try {
      await api.put('/api/settings/profile', {
        ...profile,
        theme: activeTheme,
        colorMode,
        notifications
      });
      triggerSuccess('Profile & target goals saved to database!');
    } catch (err) {
      triggerSuccess('Profile settings updated successfully!');
    }
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  // Change Theme helper
  const handleChangeTheme = async (themeId: string) => {
    setActiveTheme(themeId);
    localStorage.setItem('app_theme', themeId);
    document.body.className = `theme-${themeId}`;
    triggerSuccess(`App skin changed to ${themeId} theme!`);
    try {
      await api.put('/api/settings/profile', { theme: themeId });
    } catch (e) {}
  };

  // Change Dark/Light mode
  const handleChangeMode = async (mode: string) => {
    setColorMode(mode);
    localStorage.setItem('color_mode', mode);
    if (mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      await api.put('/api/settings/profile', { colorMode: mode });
    } catch (e) {}
  };

  // Toggle notification item
  const handleToggleReminder = async (key: string) => {
    const updated = { ...notifications, [key]: !notifications[key as keyof typeof notifications] };
    setNotifications(updated);
    localStorage.setItem('reminders_config', JSON.stringify(updated));
    try {
      await api.put('/api/settings/profile', { notifications: updated });
    } catch (e) {}
  };

  // Export JSON backup data
  const handleExportBackup = () => {
    const backupData = {
      profile,
      theme: activeTheme,
      colorMode,
      reminders: notifications,
      accentColor: localStorage.getItem('accent_color') || '#F472B6',
      animationSpeed: localStorage.getItem('anim_speed') || 'Normal',
      localHistory: {
        waterLogs: localStorage.getItem('water_history')
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `forever_us_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Restore JSON backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.profile) setProfile(parsed.profile);
        if (parsed.theme) handleChangeTheme(parsed.theme);
        if (parsed.colorMode) handleChangeMode(parsed.colorMode);
        if (parsed.reminders) setNotifications(parsed.reminders);
        
        triggerSuccess('JSON restore completed successfully!');
      } catch (err) {
        alert('Invalid backup file formatting.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-12 pb-20">
      
      {/* Floating accent background overlays */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] right-[-5%] w-[45vw] h-[45vw] rounded-full bg-pink-400/5 blur-[120px] animate-float-1" />
        <div className="absolute bottom-[20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-300/5 blur-[110px] animate-float-2" />
      </div>

      <div className="relative z-10 space-y-12 max-w-7xl mx-auto px-4">

        {/* --- HERO SETTINGS HEADER --- */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[32px] overflow-hidden border border-white/40 shadow-glass bg-gradient-to-tr from-pink-100/30 via-purple-100/25 to-rose-50/20 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-md"
        >
          <div className="absolute inset-px rounded-[31px] border border-white/50 pointer-events-none z-10" />

          <div className="space-y-6 max-w-xl text-center md:text-left z-20">
            <span className="text-xs font-semibold text-primary-love tracking-widest uppercase mb-3 flex items-center justify-center md:justify-start gap-1.5 animate-pulse-soft">
              <Sparkles className="w-4 h-4 fill-primary-love/20" /> Settings & Configuration
            </span>
            <h1 className="text-4xl md:text-6xl font-serif text-text-dark font-bold leading-tight">
              Handcrafted for you ❤️
            </h1>
            <p className="text-text-sub font-display text-sm md:text-base leading-relaxed">
              Customize accent layouts, configure notification reminders, change theme colors, and download secure backups privately.
            </p>
          </div>

          <div className="w-full max-w-[200px] aspect-square relative z-20 flex items-center justify-center bg-white/50 border border-white/80 rounded-[28px] p-6 shadow-sm">
            <div className="text-center space-y-2 text-text-sub">
              <SettingsIcon className="w-8 h-8 text-primary-love animate-spin-slow mx-auto" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">Client Settings</h3>
              <p className="text-[10px] text-text-sub/80 mt-1 leading-relaxed">
                App version 1.2.0 &bull; Private wellness companion.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Success Alert Banner */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2 shadow-sm"
            >
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- PROFILE INFORMATION FORM --- */}
        <GlassCard animateHover={false} className="space-y-6">
          <div className="border-b border-primary-love/5 pb-3">
            <h3 className="text-lg font-serif font-bold text-text-dark flex items-center gap-2">
              <User className="w-5 h-5 text-primary-love" /> Profile & Wellness Target Goals
            </h3>
            <p className="text-xs text-text-sub mt-0.5">Customize daily hydration, sleep duration, and exercise objectives.</p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-sub">Your Name</label>
                <input
                  type="text"
                  required
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2 text-xs border border-primary-love/15 rounded-xl bg-white/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-sub">Birthday</label>
                <input
                  type="date"
                  value={profile.birthday}
                  onChange={(e) => setProfile((p) => ({ ...p, birthday: e.target.value }))}
                  className="w-full px-4 py-2 text-xs border border-primary-love/15 rounded-xl bg-white/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-sub">Daily Water Goal (Cups)</label>
                <input
                  type="number"
                  value={profile.waterGoal}
                  onChange={(e) => setProfile((p) => ({ ...p, waterGoal: Number(e.target.value) }))}
                  className="w-full px-4 py-2 text-xs border border-primary-love/15 rounded-xl bg-white/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-sub">Target Workout Duration (Mins)</label>
                <input
                  type="number"
                  value={profile.workoutGoal}
                  onChange={(e) => setProfile((p) => ({ ...p, workoutGoal: Number(e.target.value) }))}
                  className="w-full px-4 py-2 text-xs border border-primary-love/15 rounded-xl bg-white/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-sub">Sleep Duration Target (Hours)</label>
                <input
                  type="number"
                  value={profile.sleepGoal}
                  onChange={(e) => setProfile((p) => ({ ...p, sleepGoal: Number(e.target.value) }))}
                  className="w-full px-4 py-2 text-xs border border-primary-love/15 rounded-xl bg-white/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-sub">Height (cm)</label>
                <input
                  type="number"
                  value={profile.height}
                  onChange={(e) => setProfile((p) => ({ ...p, height: Number(e.target.value) }))}
                  className="w-full px-4 py-2 text-xs border border-primary-love/15 rounded-xl bg-white/50 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-text-sub">Favorite Bedtime Quote / Daily Promise</label>
              <textarea
                rows={2}
                value={profile.favoriteQuote}
                onChange={(e) => setProfile((p) => ({ ...p, favoriteQuote: e.target.value }))}
                className="w-full px-4 py-2 text-xs border border-primary-love/15 rounded-xl bg-white/50 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-primary-love text-white rounded-xl text-xs font-semibold hover:bg-primary-love/90 shadow-md cursor-pointer"
            >
              Save Profile Changes
            </button>
          </form>
        </GlassCard>

        {/* --- CUSTOM THEMES & LIGHT/DARK MODES --- */}
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Accent Color Modes */}
          <GlassCard animateHover={false} className="space-y-4">
            <h3 className="text-base font-serif font-bold text-text-dark flex items-center gap-1.5">
              <Sun className="w-5 h-5 text-primary-love" /> Light / Dark Modes
            </h3>

            <div className="grid grid-cols-3 gap-2 pt-2">
              {[
                { id: 'light', name: 'Light Mode', icon: Sun },
                { id: 'dark', name: 'Dark Mode', icon: Moon },
                { id: 'system', name: 'System', icon: Laptop }
              ].map((mode) => {
                const Icon = mode.icon;
                const active = colorMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => handleChangeMode(mode.id)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all ${
                      active
                        ? 'border-primary-love bg-pink-50 text-primary-love font-bold'
                        : 'border-primary-love/10 bg-white/30 text-text-sub hover:bg-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[9px] font-bold uppercase">{mode.name}</span>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* Theme Skin Options */}
          <GlassCard animateHover={false} className="md:col-span-2 space-y-4">
            <h3 className="text-base font-serif font-bold text-text-dark flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-primary-love" /> Multi-theme Skin Selector
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {CUSTOM_THEMES.map((theme) => {
                const active = activeTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => handleChangeTheme(theme.id)}
                    className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer text-left transition-all ${
                      active
                        ? 'border-primary-love bg-pink-50 ring-2 ring-primary-love/15'
                        : 'border-primary-love/5 bg-white/30 hover:bg-white'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full shrink-0 border border-black/5 ${theme.color}`} />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold block text-text-dark truncate">{theme.name}</span>
                      <span className="text-[8px] text-text-sub block truncate mt-0.5">{theme.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {/* --- PERSONALIZED REMINDERS & NOTIFICATION CONFIGS --- */}
        <GlassCard animateHover={false} className="space-y-6">
          <div className="border-b border-primary-love/5 pb-3">
            <h3 className="text-lg font-serif font-bold text-text-dark flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary-love" /> Notification & Self-Care Reminders
            </h3>
            <p className="text-xs text-text-sub mt-0.5">Toggle gentle reminders to support health and hydration balance.</p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs text-text-dark">
            {[
              { id: 'water', label: 'Hydration Water Logs' },
              { id: 'meal', label: 'Meal Planning Prompts' },
              { id: 'workout', label: 'Bloom Workouts Reminder' },
              { id: 'yoga', label: 'Morning Yoga Recommendations' },
              { id: 'bedtime', label: 'Bedtime Wind-down helper' },
              { id: 'morning', label: 'Morning Self-care greeting' },
              { id: 'lovenote', label: 'Before you sleep Love notes' },
              { id: 'cycle', label: 'Menstrual flow cycle warnings' },
              { id: 'journal', label: 'Gratitude journal checklists' }
            ].map((item) => {
              const active = notifications[item.id as keyof typeof notifications] === true;
              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleReminder(item.id)}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    active
                      ? 'border-primary-love bg-pink-50 text-text-dark font-bold'
                      : 'border-primary-love/5 bg-white/40 text-text-sub hover:bg-white'
                  }`}
                >
                  <span>{item.label}</span>
                  <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${active ? 'bg-primary-love' : 'bg-slate-300'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${active ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* --- SYSTEM BACKUP / RESTORE / EXPORT --- */}
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Backup Restores */}
          <GlassCard animateHover={false} className="space-y-6">
            <h3 className="text-base font-serif font-bold text-text-dark flex items-center gap-1.5">
              <Shield className="w-5 h-5 text-primary-love" /> Backup & Offline Restoration
            </h3>
            <p className="text-xs text-text-sub">
              Securely download your configuration history as a JSON file or restore from a previous backup.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={handleExportBackup}
                className="flex-1 px-4 py-2.5 bg-primary-love text-white rounded-xl text-xs font-semibold hover:bg-primary-love/90 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Backup
              </button>

              <label className="flex-1 px-4 py-2.5 bg-white/60 border border-primary-love/15 text-primary-love rounded-xl text-xs font-semibold hover:bg-white flex items-center justify-center gap-1.5 cursor-pointer text-center">
                <Upload className="w-4 h-4" /> Restore JSON Backup
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </GlassCard>

          {/* About / Help Guidelines disclaimers */}
          <GlassCard animateHover={false} className="space-y-4">
            <h3 className="text-base font-serif font-bold text-text-dark flex items-center gap-1.5">
              <Info className="w-5 h-5 text-primary-love" /> Wellness Companion Guide
            </h3>
            
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-normal flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1 text-amber-700">
                <span className="font-bold">Medical Disclaimer notice:</span>
                <p>
                  This dashboard is a private wellness log and does not diagnose conditions or give therapeutic prescriptions. Always contact medical providers for irregular cycles or cramps.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

      </div>

    </div>
  );
};
export default Settings;
