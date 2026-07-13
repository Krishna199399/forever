import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/common/GlassCard';
import { AnimatedCheckbox } from '@/components/common/AnimatedCheckbox';
import {
  Clock,
  Flame,
  Play,
  Heart,
  ChevronRight,
  TrendingUp,
  Award,
  Sparkles,
  Search,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  RotateCcw
} from 'lucide-react';
import api from '@/lib/api';

// Interfaces
interface ExerciseItem {
  name: string;
  type: 'time' | 'reps';
  target: string;
  duration?: number; // in seconds
  sets?: number;
  reps?: number;
  desc: string;
  image?: string;
  video?: string;
}

interface Routine {
  title: string;
  time: string;
  calories: string;
  exercises: ExerciseItem[];
}

interface ProgressLog {
  _id?: string;
  workoutTitle: string;
  completedDate: string;
  duration: number;
  calories: number;
  mood: string;
  notes?: string;
}

// -------------------------------------------------
// CONSTANTS
// -------------------------------------------------
const WEEKLY_PLAN: Record<string, Routine> = {
  Monday: {
    title: "Monday Strength & Movement",
    time: "55 Min",
    calories: "220 kcal",
    exercises: [
      { name: "🏃 Warm-up", type: "time", target: "5 Minutes", duration: 300, desc: "Gentle joints mobilization and deep breathing to prepare the body." },
      { name: "🚶 Brisk Walk", type: "time", target: "20 Minutes", duration: 1200, desc: "Cortisol-conscious aerobic movement at a steady, conversational pace.", video: "/assets/videos/Walking.mp4" },
      { name: "💪 Squats", type: "reps", target: "3 × 12 reps", sets: 3, reps: 12, desc: "Focus on driving hips back and keeping chest tall. Rest 30s between sets.", video: "/assets/videos/Squats.mp4" },
      { name: "🍑 Glute Bridges", type: "reps", target: "3 × 15 reps", sets: 3, reps: 15, desc: "Squeeze glutes at the top to support lower back and pelvis. Rest 30s.", video: "/assets/videos/Glute Bridges.mp4" },
      { name: "🤲 Wall Push-ups", type: "reps", target: "3 × 10 reps", sets: 3, reps: 10, desc: "Keep body in straight line, press away from wall with control. Rest 30s.", video: "/assets/videos/Wall Push-ups.mp4" },
      { name: "🦵 Lunges", type: "reps", target: "3 × 10 reps each leg", sets: 3, reps: 10, desc: "Step back or forward, keeping front knee behind toes. Rest 30s.", video: "/assets/videos/Lunges.mp4" },
      { name: "🧱 Plank", type: "time", target: "3 × 30-45 sec", duration: 45, desc: "Engage core and glutes, keep neck neutral. Rest 45s between holds.", image: "/assets/images/Plank.png" },
      { name: "🌿 Cool Down Stretch", type: "time", target: "5 Minutes", duration: 300, desc: "Gentle hamstring, quad, and lower back release stretches." }
    ]
  },
  Tuesday: {
    title: "Tuesday Walk & Abdominal Care",
    time: "65 Min",
    calories: "240 kcal",
    exercises: [
      { name: "🚶 Brisk Walk", type: "time", target: "30–40 Minutes", duration: 2100, desc: "Outdoor or treadmill brisk walk to keep energy circulating.", video: "/assets/videos/Walking.mp4" },
      { name: "🪜 Step-ups", type: "reps", target: "3 × 15 reps", sets: 3, reps: 15, desc: "Use a low step or stair, drive through the heel. Rest 30s.", video: "/assets/videos/Step-ups.mp4" },
      { name: "🦵 Side Leg Raises", type: "reps", target: "3 × 15 reps", sets: 3, reps: 15, desc: "Lying on side, lift leg slowly to strengthen outer hips and ovaries support.", video: "/assets/videos/Side Leg Raises.mp4" },
      { name: "🐦 Bird Dog", type: "reps", target: "3 × 12 reps", sets: 3, reps: 12, desc: "Extend opposite arm and leg, keeping pelvis square to floor. Rest 30s.", video: "/assets/videos/Bird Dog.mp4" },
      { name: "🚴 Bicycle Crunch", type: "reps", target: "3 × 15 reps", sets: 3, reps: 15, desc: "Slow, controlled rotation to support deep abdominal stability. Rest 30s.", video: "/assets/videos/Bicycle Crunch.mp4" },
      { name: "🧘 Stretching", type: "time", target: "10 Minutes", duration: 600, desc: "Targeted hip openers and full body static stretches." }
    ]
  },
  Wednesday: {
    title: "Wednesday Strength & Movement",
    time: "55 Min",
    calories: "220 kcal",
    exercises: [
      { name: "🏃 Warm-up", type: "time", target: "5 Minutes", duration: 300, desc: "Gentle joints mobilization and deep breathing to prepare the body." },
      { name: "🚶 Brisk Walk", type: "time", target: "20 Minutes", duration: 1200, desc: "Cortisol-conscious aerobic movement at a steady, conversational pace.", video: "/assets/videos/Walking.mp4" },
      { name: "💪 Squats", type: "reps", target: "3 × 12 reps", sets: 3, reps: 12, desc: "Focus on driving hips back and keeping chest tall. Rest 30s between sets.", video: "/assets/videos/Squats.mp4" },
      { name: "🍑 Glute Bridges", type: "reps", target: "3 × 15 reps", sets: 3, reps: 15, desc: "Squeeze glutes at the top to support lower back and pelvis. Rest 30s.", video: "/assets/videos/Glute Bridges.mp4" },
      { name: "🤲 Wall Push-ups", type: "reps", target: "3 × 10 reps", sets: 3, reps: 10, desc: "Keep body in straight line, press away from wall with control. Rest 30s.", video: "/assets/videos/Wall Push-ups.mp4" },
      { name: "🦵 Lunges", type: "reps", target: "3 × 10 reps each leg", sets: 3, reps: 10, desc: "Step back or forward, keeping front knee behind toes. Rest 30s.", video: "/assets/videos/Lunges.mp4" },
      { name: "🧱 Plank", type: "time", target: "3 × 30-45 sec", duration: 45, desc: "Engage core and glutes, keep neck neutral. Rest 45s between holds.", image: "/assets/images/Plank.png" },
      { name: "🌿 Cool Down Stretch", type: "time", target: "5 Minutes", duration: 300, desc: "Gentle hamstring, quad, and lower back release stretches." }
    ]
  },
  Thursday: {
    title: "Thursday Walk & Abdominal Care",
    time: "65 Min",
    calories: "240 kcal",
    exercises: [
      { name: "🚶 Brisk Walk", type: "time", target: "30–40 Minutes", duration: 2100, desc: "Outdoor or treadmill brisk walk to keep energy circulating.", video: "/assets/videos/Walking.mp4" },
      { name: "🪜 Step-ups", type: "reps", target: "3 × 15 reps", sets: 3, reps: 15, desc: "Use a low step or stair, drive through the heel. Rest 30s.", video: "/assets/videos/Step-ups.mp4" },
      { name: "🦵 Side Leg Raises", type: "reps", target: "3 × 15 reps", sets: 3, reps: 15, desc: "Lying on side, lift leg slowly to strengthen outer hips and ovaries support.", video: "/assets/videos/Side Leg Raises.mp4" },
      { name: "🐦 Bird Dog", type: "reps", target: "3 × 12 reps", sets: 3, reps: 12, desc: "Extend opposite arm and leg, keeping pelvis square to floor. Rest 30s.", video: "/assets/videos/Bird Dog.mp4" },
      { name: "🚴 Bicycle Crunch", type: "reps", target: "3 × 15 reps", sets: 3, reps: 15, desc: "Slow, controlled rotation to support deep abdominal stability. Rest 30s.", video: "/assets/videos/Bicycle Crunch.mp4" },
      { name: "🧘 Stretching", type: "time", target: "10 Minutes", duration: 600, desc: "Targeted hip openers and full body static stretches." }
    ]
  },
  Friday: {
    title: "Friday Strength & Movement",
    time: "55 Min",
    calories: "220 kcal",
    exercises: [
      { name: "🏃 Warm-up", type: "time", target: "5 Minutes", duration: 300, desc: "Gentle joints mobilization and deep breathing to prepare the body." },
      { name: "🚶 Brisk Walk", type: "time", target: "20 Minutes", duration: 1200, desc: "Cortisol-conscious aerobic movement at a steady, conversational pace.", video: "/assets/videos/Walking.mp4" },
      { name: "💪 Squats", type: "reps", target: "3 × 12 reps", sets: 3, reps: 12, desc: "Focus on driving hips back and keeping chest tall. Rest 30s between sets.", video: "/assets/videos/Squats.mp4" },
      { name: "🍑 Glute Bridges", type: "reps", target: "3 × 15 reps", sets: 3, reps: 15, desc: "Squeeze glutes at the top to support lower back and pelvis. Rest 30s.", video: "/assets/videos/Glute Bridges.mp4" },
      { name: "🤲 Wall Push-ups", type: "reps", target: "3 × 10 reps", sets: 3, reps: 10, desc: "Keep body in straight line, press away from wall with control. Rest 30s.", video: "/assets/videos/Wall Push-ups.mp4" },
      { name: "🦵 Lunges", type: "reps", target: "3 × 10 reps each leg", sets: 3, reps: 10, desc: "Step back or forward, keeping front knee behind toes. Rest 30s.", video: "/assets/videos/Lunges.mp4" },
      { name: "🧱 Plank", type: "time", target: "3 × 30-45 sec", duration: 45, desc: "Engage core and glutes, keep neck neutral. Rest 45s between holds.", image: "/assets/images/Plank.png" },
      { name: "🌿 Cool Down Stretch", type: "time", target: "5 Minutes", duration: 300, desc: "Gentle hamstring, quad, and lower back release stretches." }
    ]
  },
  Saturday: {
    title: "Saturday Walk & Abdominal Care",
    time: "65 Min",
    calories: "240 kcal",
    exercises: [
      { name: "🚶 Brisk Walk", type: "time", target: "30–40 Minutes", duration: 2100, desc: "Outdoor or treadmill brisk walk to keep energy circulating.", video: "/assets/videos/Walking.mp4" },
      { name: "🪜 Step-ups", type: "reps", target: "3 × 15 reps", sets: 3, reps: 15, desc: "Use a low step or stair, drive through the heel. Rest 30s.", video: "/assets/videos/Step-ups.mp4" },
      { name: "🦵 Side Leg Raises", type: "reps", target: "3 × 15 reps", sets: 3, reps: 15, desc: "Lying on side, lift leg slowly to strengthen outer hips and ovaries support.", video: "/assets/videos/Side Leg Raises.mp4" },
      { name: "🐦 Bird Dog", type: "reps", target: "3 × 12 reps", sets: 3, reps: 12, desc: "Extend opposite arm and leg, keeping pelvis square to floor. Rest 30s.", video: "/assets/videos/Bird Dog.mp4" },
      { name: "🚴 Bicycle Crunch", type: "reps", target: "3 × 15 reps", sets: 3, reps: 15, desc: "Slow, controlled rotation to support deep abdominal stability. Rest 30s.", video: "/assets/videos/Bicycle Crunch.mp4" },
      { name: "🧘 Stretching", type: "time", target: "10 Minutes", duration: 600, desc: "Targeted hip openers and full body static stretches." }
    ]
  },
  Sunday: {
    title: "Sunday Restorative & Yoga Care",
    time: "60 Min",
    calories: "160 kcal",
    exercises: [
      { name: "🚶 Relaxed Walk", type: "time", target: "30 Minutes", duration: 1800, desc: "Leisurely, peaceful walk outdoors to absorb morning fresh air.", video: "/assets/videos/Walking.mp4" },
      { name: "🧘 Full Yoga", type: "time", target: "20 Minutes", duration: 1200, desc: "Restorative sequence focusing on pelvic blood circulation and deep release." },
      { name: "🌬 Meditation", type: "time", target: "10 Minutes", duration: 600, desc: "Mindfulness and slow parasympathetic breathing to reset cortisol." }
    ]
  }
};

const YOGA_POSES = [
  { name: 'Butterfly Pose (Baddha Konasana)', emoji: '🦋', duration: '2 mins', benefits: 'Opens hips, stretches inner thighs, improves pelvic blood flow.', breath: 'Inhale to lengthen spine, exhale to gently fold forward.', mistakes: 'Forcing knees down with hands. Keep movements light.', contraindications: 'Groin or knee injury.', video: '/assets/exercises/Butterfly Pose (Baddha Konasana).mp4' },
  { name: 'Cat-Cow (Marjaryasana)', emoji: '🐈', duration: '2 mins', benefits: 'Warms spine, coordinates breath with motion, releases back tension.', breath: 'Inhale to arch spine (Cow), exhale to round spine (Cat).', mistakes: 'Moving too fast or straining the neck. Move slowly.', contraindications: 'Recent wrist or neck pain.', video: '/assets/exercises/Cat-Cow (Marjaryasana).mp4' },
  { name: 'Cobra Pose (Bhujangasana)', emoji: '🐍', duration: '2 mins', benefits: 'Strengthens spine, opens chest and abdomen, stimulates thyroid.', breath: 'Inhale to roll chest upward, keep shoulders relaxed down.', mistakes: 'Squeezing glutes too hard or lifting hips off the floor.', contraindications: 'Active lower back injury or pregnancy.', video: '/assets/exercises/Cobra Pose (Bhujangasana).mp4' },
  { name: 'Bridge Pose (Setu Bandha)', emoji: '🌉', duration: '2 mins', benefits: 'Strengthens glutes and back, opens chest, regulates thyroid.', breath: 'Inhale to lift hips high, exhale to lower them slowly.', mistakes: 'Letting knees splay outward. Keep thighs parallel.', contraindications: 'Recent neck or shoulder issues.', video: '/assets/exercises/Bridge Pose (Setu Bandha).mp4' },
  { name: 'Child Pose (Balasana)', emoji: '👶', duration: '3 mins', benefits: 'Releases lower back, relaxes nervous system, calms the mind.', breath: 'Inhale into the back ribs, exhale to sink hips deeper.', mistakes: 'Lifting forehead off floor. Use a block or cushion if needed.', contraindications: 'Knee injury or high blood pressure.', video: '/assets/exercises/Child Pose (Balasana).mp4' },
  { name: 'Legs Up The Wall (Viparita Karani)', emoji: '🧱', duration: '5 mins', benefits: 'Reduces leg swelling, improves circulation, triggers deep rest.', breath: 'Slow, deep nose breathing. Emphasize long, smooth exhalations.', mistakes: 'Lying too far or close to the wall causing lower back strain.', contraindications: 'Glaucoma or severe spine conditions.', video: '/assets/exercises/Legs Up The Wall (Viparita Karani).mp4' },
  { name: 'Deep Breathing (Pranayama)', emoji: '🌬️', duration: '5 mins', benefits: 'Lowers heart rate, reduces cortisol levels, relieves anxiety.', breath: 'Inhale for 4 seconds, hold for 2, exhale for 6 seconds.', mistakes: 'Chest breathing. Focus on expanding the lower belly.', contraindications: 'None. Safe for all levels.' }
];

const STRETCHES = [
  { name: 'Neck Stretch', benefits: 'Releases cervical spine strain and upper back tightness.', instructions: 'Tilt ear to shoulder, apply very light weight with hand. Hold 30s each side.' },
  { name: 'Shoulder Stretch', benefits: 'Releases shoulder girdle load and chest tension.', instructions: 'Draw arm across chest, hold with opposite forearm. Keep shoulder rolled down.' },
  { name: 'Hip Stretch (Pigeon/Glute)', benefits: 'Essential hip opener releasing stored pelvic emotional stress.', instructions: 'Bring front knee behind front wrist, sink hips low toward floor. Breathe deeply.' },
  { name: 'Hamstring Stretch', benefits: 'Unloads lower back tension by releasing back leg chains.', instructions: 'Extend one leg forward while seated, hinge from hips with a flat back. Reach for shin.' },
  { name: 'Quadriceps Stretch', benefits: 'Stretches anterior thighs to support knee cap health.', instructions: 'Stand, bend knee, draw heel to glute. Keep pelvis tucked forward.' },
  { name: 'Lower Back Stretch', benefits: 'Releases lumbar compression and stretches spine gently.', instructions: 'Lying down, draw both knees to chest, rock gently from side to side.' },
  { name: 'Full Body Stretch', benefits: 'Realigns energy meridians and wakes up cellular system.', instructions: 'Extend arms overhead and legs straight, reach in opposite directions on the floor.' }
];

const BREATHING_TECHS = [
  { name: 'Deep Belly Breathing', inhale: 4, hold1: 2, exhale: 6, hold2: 0, desc: 'Increases oxygenation and triggers the calming parasympathetic pathway.' },
  { name: 'Box Breathing', inhale: 4, hold1: 4, exhale: 4, hold2: 4, desc: 'Used for immediate nervous system resets and stress relief.' },
  { name: '4-7-8 Calm', inhale: 4, hold1: 7, exhale: 8, hold2: 0, desc: 'Deeply relaxing technique designed for instant sleep/peace prep.' },
  { name: 'Alternate Nostril Breathing', inhale: 5, hold1: 0, exhale: 5, hold2: 0, desc: 'Brings balance to left and right brain hemispheres.' }
];

const MOTIVATION_QUOTES = [
  "One healthy habit today creates a stronger tomorrow.",
  "You are becoming healthier and stronger every single day.",
  "I'm so incredibly proud of you for showing up today.",
  "Progress and consistency matter much more than perfection.",
  "Every slow, deep movement is a gift of love to your body.",
  "Breathe, soften your shoulders, and proceed with love."
];

const renderExerciseVisual = (name: string) => {
  const n = name.toLowerCase();

  // 1. Warm-up
  if (n.includes('warm-up') || n.includes('warmup') || n.includes('☀️')) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3">
        <svg className="w-20 h-20 text-amber-400" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          {/* Pulsing solar joint energy */}
          <motion.circle
            cx="50"
            cy="50"
            r="16"
            fill="currentColor"
            opacity="0.1"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Shoulder roll visual joints */}
          <circle cx="50" cy="22" r="5" fill="currentColor" opacity="0.3" />
          <line x1="50" y1="27" x2="50" y2="52" />
          <motion.path
            d="M32,32 C42,28 58,28 68,32"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.circle cx="32" cy="32" r="3" fill="#fbbf24" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
          <motion.circle cx="68" cy="32" r="3" fill="#fbbf24" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
          <path d="M38,75 L50,52 L62,75" opacity="0.4" />
        </svg>
        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-500/10 border border-amber-500/15 px-2.5 py-0.5 rounded-full">
          Joint Mobilization & Warm Up
        </span>
      </div>
    );
  }

  // 2. Walking Routine
  if (n.includes('walk') || n.includes('🚶') || n.includes('🏃')) {
    return (
      <svg className="w-24 h-24 text-pink-400" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        {/* Animated dotted walking path */}
        <path d="M15,80 C35,60 65,90 85,70" strokeDasharray="5, 5" className="animate-[stroke_15s_linear_infinite]" />
        {/* Bouncing shoes outlines */}
        <motion.g
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M35,65 C35,55 45,50 50,55 L52,65 Z" fill="currentColor" opacity="0.15" />
          <path d="M35,65 L52,65" strokeWidth="3" />
        </motion.g>
        <motion.g
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 1.2, delay: 0.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M50,70 C50,60 60,55 65,60 L67,70 Z" fill="currentColor" opacity="0.25" />
          <path d="M50,70 L67,70" strokeWidth="3" stroke="#f472b6" />
        </motion.g>
      </svg>
    );
  }

  // 3. Breathing / Meditation
  if (n.includes('breathing') || n.includes('breath') || n.includes('meditation') || n.includes('🌬') || n.includes('🧘')) {
    return (
      <div className="relative w-28 h-28 flex items-center justify-center">
        <motion.div
          className="absolute rounded-full bg-gradient-to-tr from-cyan-400/20 to-purple-400/20"
          animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: '100%', height: '100%' }}
        />
        <svg className="w-16 h-16 text-cyan-400 z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" strokeDasharray="3, 3" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      </div>
    );
  }

  // 4. Strength Poses (highlighting active target zones)
  let muscleGroup = "Full Body";
  if (n.includes('squat') || n.includes('bridge') || n.includes('lunge') || n.includes('🍑') || n.includes('🦵') || n.includes('step')) {
    muscleGroup = "Lower Body (Glutes & Quads)";
  } else if (n.includes('push') || n.includes('wall') || n.includes('💪') || n.includes('🤲')) {
    muscleGroup = "Upper Body (Chest & Arms)";
  } else if (n.includes('plank') || n.includes('dog') || n.includes('crunch') || n.includes('🧱') || n.includes('🐦') || n.includes('crunch')) {
    muscleGroup = "Core & Stabilizers";
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      {/* Calm silhouette wireframe overlay */}
      <svg className="w-20 h-20 text-purple-400" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
        {/* Head */}
        <circle cx="50" cy="22" r="6" />
        {/* Spine */}
        <line x1="50" y1="28" x2="50" y2="55" />
        {/* Arms */}
        <path d="M25,35 C40,32 50,32 75,35" />
        {/* Hips / Legs */}
        <path d="M35,80 L50,55 L65,80" />
        
        {/* Muscle group target glow highlight */}
        <motion.circle
          cx="50"
          cy={muscleGroup.includes('Core') ? 45 : muscleGroup.includes('Upper') ? 32 : 65}
          r="8"
          fill="#f472b6"
          opacity="0.3"
          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </svg>
      <span className="text-[9px] font-bold uppercase tracking-wider text-primary-love bg-pink-500/10 border border-primary-love/15 px-2.5 py-0.5 rounded-full">
        Target: {muscleGroup}
      </span>
    </div>
  );
};

export const Exercise: React.FC = () => {
  const [history, setHistory] = useState<ProgressLog[]>([]);
  const [selectedYogaPose, setSelectedYogaPose] = useState<typeof YOGA_POSES[number] | null>(null);

  // Today details
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = weekdays[new Date().getDay()];
  const todayRoutine = WEEKLY_PLAN[todayName] || WEEKLY_PLAN.Monday;

  // Tabs for weekly planner
  const [selectedPlannerDay, setSelectedPlannerDay] = useState<string>(todayName);

  // Search & Library state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBeginnerOnly, setFilterBeginnerOnly] = useState(true);

  // Dynamic Metrics loaded from DB history
  const todayDateString = new Date().toISOString().split('T')[0];
  const totalCompletedRoutines = history.length;

  const todayMinutes = useMemo(() => {
    return history
      .filter((log) => log.completedDate === todayDateString)
      .reduce((sum, log) => sum + (log.duration || 0), 0);
  }, [history, todayDateString]);

  const todayCalories = useMemo(() => {
    return history
      .filter((log) => log.completedDate === todayDateString)
      .reduce((sum, log) => sum + (log.calories || 0), 0);
  }, [history, todayDateString]);

  // Overall goal percentage logic
  const dailyCaloriesGoal = 180;
  const dailyMinutesGoal = 30;
  const caloriesProgressPercent = Math.min(Math.round((todayCalories / dailyCaloriesGoal) * 100), 100);
  const minutesProgressPercent = Math.min(Math.round((todayMinutes / dailyMinutesGoal) * 100), 100);
  const overallProgress = Math.round((caloriesProgressPercent + minutesProgressPercent) / 2);

  // Rotating quote
  const motivationQuote = useMemo(() => {
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000);
    return MOTIVATION_QUOTES[dayOfYear % MOTIVATION_QUOTES.length];
  }, []);

  // Guided Breathing coach state variables
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingModalOpen, setBreathingModalOpen] = useState(false);
  const [selectedBreathingIdx, setSelectedBreathingIdx] = useState(0);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  const [breathTimer, setBreathTimer] = useState(4);
  const [voiceAssist, setVoiceAssist] = useState(true);

  // Cooldown Guide overlay state
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownPhaseIdx, setCooldownPhaseIdx] = useState(0);
  const [cooldownTimer, setCooldownTimer] = useState(60);

  // Workout Player Overlay state variables
  const [activePlayerRoutine, setActivePlayerRoutine] = useState<Routine | null>(null);
  const [activePlayerDayName, setActivePlayerDayName] = useState<string>('');
  const [playerStepIdx, setPlayerStepIdx] = useState(0);
  const [playerOpen, setPlayerOpen] = useState(false);
  
  // Set-based workout tracking
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restTimer, setRestTimer] = useState(30);
  
  // Timed-based workout tracking
  const [stepTimerActive, setStepTimerActive] = useState(false);
  const [stepTimerSecs, setStepTimerSecs] = useState(60);

  // Celebration state
  const [showConfetti, setShowConfetti] = useState(false);
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState('Happy');
  const [completionSuccess, setCompletionSuccess] = useState(false);

  // Load progress history
  const loadStatsData = async () => {
    try {
      const resProgress = await api.get('/api/workout-progress');
      if (resProgress.data) setHistory(resProgress.data);
    } catch (e) {
      console.log('Failed to fetch history logs from server. Running standalone.', e);
    }
  };

  useEffect(() => {
    loadStatsData();
  }, []);

  // Text-to-speech speaker helper
  const speakText = (text: string) => {
    if (!voiceAssist) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.volume = 0.55;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.log('TTS Voice assist failed:', err);
    }
  };

  // -------------------------------------------------
  // BREATHING COACH LOGIC
  // -------------------------------------------------
  useEffect(() => {
    let interval: any;
    if (breathingActive && breathingModalOpen) {
      const tech = BREATHING_TECHS[selectedBreathingIdx];
      interval = setInterval(() => {
        setBreathTimer((t) => {
          if (t <= 1) {
            let nextPhase: typeof breathPhase = 'Inhale';
            let nextDuration = tech.inhale;

            if (breathPhase === 'Inhale') {
              if (tech.hold1 > 0) {
                nextPhase = 'Hold';
                nextDuration = tech.hold1;
              } else {
                nextPhase = 'Exhale';
                nextDuration = tech.exhale;
              }
            } else if (breathPhase === 'Hold') {
              nextPhase = 'Exhale';
              nextDuration = tech.exhale;
            } else if (breathPhase === 'Exhale') {
              if (tech.hold2 > 0) {
                nextPhase = 'Rest';
                nextDuration = tech.hold2;
              } else {
                nextPhase = 'Inhale';
                nextDuration = tech.inhale;
              }
            } else if (breathPhase === 'Rest') {
              nextPhase = 'Inhale';
              nextDuration = tech.inhale;
            }

            setBreathPhase(nextPhase);
            speakText(nextPhase);
            return nextDuration;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [breathingActive, breathPhase, selectedBreathingIdx, breathingModalOpen]);

  const handleStartBreathing = () => {
    const tech = BREATHING_TECHS[selectedBreathingIdx];
    setBreathPhase('Inhale');
    setBreathTimer(tech.inhale);
    setBreathingActive(true);
    speakText('Inhale');
  };

  const handleStopBreathing = () => {
    setBreathingActive(false);
    window.speechSynthesis.cancel();
  };

  const closeBreathingModal = () => {
    handleStopBreathing();
    setBreathingModalOpen(false);
  };

  // -------------------------------------------------
  // COOLDOWN GUIDE LOGIC
  // -------------------------------------------------
  const COOLDOWN_PHASES = [
    { title: "Neck & Shoulder Stretch", desc: "Roll neck in slow circles. Drop shoulders back.", duration: 60 },
    { title: "Lower Back Spinal Twist", desc: "Hug knees to chest. Drop knees to right, then left.", duration: 60 },
    { title: "Deep Belly Breathing", desc: "Inhale expanding abdomen, exhale relaxing muscles.", duration: 90 },
    { title: "Savasana Rest", desc: "Close eyes, relax tongue, sink into absolute support.", duration: 90 }
  ];

  useEffect(() => {
    let interval: any;
    if (cooldownActive) {
      interval = setInterval(() => {
        setCooldownTimer((t) => {
          if (t <= 1) {
            if (cooldownPhaseIdx < COOLDOWN_PHASES.length - 1) {
              const nextIdx = cooldownPhaseIdx + 1;
              setCooldownPhaseIdx(nextIdx);
              speakText(`Next: ${COOLDOWN_PHASES[nextIdx].title}`);
              return COOLDOWN_PHASES[nextIdx].duration;
            } else {
              setCooldownActive(false);
              speakText("Cooldown complete. Well done.");
              return 60;
            }
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldownActive, cooldownPhaseIdx]);

  const startCooldown = () => {
    setCooldownPhaseIdx(0);
    setCooldownTimer(COOLDOWN_PHASES[0].duration);
    setCooldownActive(true);
    speakText("Starting guided cooldown. First, Neck and Shoulder Stretch.");
  };

  const stopCooldown = () => {
    setCooldownActive(false);
    window.speechSynthesis.cancel();
  };

  // -------------------------------------------------
  // WORKOUT PLAYER LOGIC
  // -------------------------------------------------
  const startWorkoutFlow = (dayName: string) => {
    const routine = WEEKLY_PLAN[dayName];
    if (!routine) return;
    setActivePlayerRoutine(routine);
    setActivePlayerDayName(dayName);
    setPlayerStepIdx(0);
    setCurrentSet(1);
    setIsResting(false);
    setPlayerOpen(true);
    setCompletionSuccess(false);

    // Initial step setup
    const initialEx = routine.exercises[0];
    if (initialEx.type === 'time') {
      setStepTimerSecs(initialEx.duration || 60);
      setStepTimerActive(false);
    }
    speakText(`Starting ${routine.title}. First exercise is ${initialEx.name}.`);
  };

  // Timed steps ticker
  useEffect(() => {
    let interval: any;
    if (playerOpen && stepTimerActive && !isResting) {
      interval = setInterval(() => {
        setStepTimerSecs((s) => {
          if (s <= 1) {
            setStepTimerActive(false);
            speakText("Interval completed.");
            // Auto advance rest or next exercise
            const currentEx = activePlayerRoutine?.exercises[playerStepIdx];
            if (currentEx && playerStepIdx < activePlayerRoutine.exercises.length - 1) {
              handleNextStep();
            } else {
              setCompletionSuccess(true);
              setShowConfetti(true);
              speakText("Routine complete. Congratulations!");
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [playerOpen, stepTimerActive, isResting, playerStepIdx, activePlayerRoutine]);

  // Rest Timer countdown
  useEffect(() => {
    let interval: any;
    if (playerOpen && isResting) {
      interval = setInterval(() => {
        setRestTimer((r) => {
          if (r <= 1) {
            setIsResting(false);
            speakText("Rest complete. Start next set.");
            return 30;
          }
          return r - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [playerOpen, isResting]);

  const handleNextStep = () => {
    if (!activePlayerRoutine) return;
    if (playerStepIdx < activePlayerRoutine.exercises.length - 1) {
      const nextIdx = playerStepIdx + 1;
      setPlayerStepIdx(nextIdx);
      setCurrentSet(1);
      setIsResting(false);
      setStepTimerActive(false);
      
      const nextEx = activePlayerRoutine.exercises[nextIdx];
      if (nextEx.type === 'time') {
        setStepTimerSecs(nextEx.duration || 60);
      }
      speakText(`Next exercise is ${nextEx.name}.`);
    } else {
      setCompletionSuccess(true);
      setShowConfetti(true);
      speakText("Routine complete. Congratulations!");
    }
  };

  const handlePrevStep = () => {
    if (playerStepIdx > 0) {
      const prevIdx = playerStepIdx - 1;
      setPlayerStepIdx(prevIdx);
      setCurrentSet(1);
      setIsResting(false);
      setStepTimerActive(false);

      const prevEx = activePlayerRoutine!.exercises[prevIdx];
      if (prevEx.type === 'time') {
        setStepTimerSecs(prevEx.duration || 60);
      }
      speakText(`Previous exercise: ${prevEx.name}.`);
    }
  };

  const triggerRest = (durationSecs: number) => {
    setRestTimer(durationSecs);
    setIsResting(true);
    speakText(`Resting for ${durationSecs} seconds.`);
  };

  const finishWorkoutLog = async () => {
    if (!activePlayerRoutine) return;
    
    // Calculate total minutes based on routine
    const durMins = activePlayerDayName === 'Sunday' ? 60 : 55;
    const cals = activePlayerDayName === 'Sunday' ? 160 : 220;

    const logData = {
      workoutTitle: activePlayerRoutine.title,
      completedDate: todayDateString,
      duration: durMins,
      calories: cals,
      mood,
      notes: notes || "Completed structured daily workout routine."
    };

    try {
      await api.post('/api/workout-progress', logData);
      loadStatsData(); // Reload stats
    } catch (err) {
      console.log('Failed to log completed routine to server:', err);
    }

    setPlayerOpen(false);
    setShowConfetti(false);
    setNotes('');
  };

  // Achievements thresholds based on total logs
  const achievements = [
    { id: 'ac1', title: 'First Workout', desc: 'Step of self-love initiated', unlocked: totalCompletedRoutines >= 1, icon: '🌸' },
    { id: 'ac2', title: '7 Day Streak', desc: 'Consistent movement for 7 logs', unlocked: totalCompletedRoutines >= 7, icon: '🔥' },
    { id: 'ac3', title: '14 Day Streak', desc: 'Strengthened resolve for 14 logs', unlocked: totalCompletedRoutines >= 14, icon: '🌟' },
    { id: 'ac4', title: '30 Day Streak', desc: 'Grew a movement meadow for 30 logs', unlocked: totalCompletedRoutines >= 30, icon: '🌺' },
    { id: 'ac5', title: 'Walking Star', desc: 'Logged 5 or more walking sessions', unlocked: totalCompletedRoutines >= 5, icon: '👟' },
    { id: 'ac6', title: 'Yoga Lover', desc: 'Completed 3 or more yoga sequences', unlocked: totalCompletedRoutines >= 3, icon: '🧘‍♀️' },
    { id: 'ac7', title: 'Consistency Champion', desc: 'Logged 10 total completed activities', unlocked: totalCompletedRoutines >= 10, icon: '👑' }
  ];

  // Filtering search library if query is entered
  const filteredSearchList = useMemo(() => {
    if (!searchQuery) return [];
    return Object.entries(WEEKLY_PLAN).flatMap(([day, routine]) => 
      routine.exercises.filter((ex) => 
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.desc.toLowerCase().includes(searchQuery.toLowerCase())
      ).map((ex) => ({ ...ex, day }))
    );
  }, [searchQuery]);

  return (
    <div className="space-y-12 pb-20 relative z-10">
      
      {/* Background soft flower ambient floating circles */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[8%] left-[-10%] w-[38vw] h-[38vw] rounded-full bg-pink-300/10 blur-[130px] animate-float-1" />
        <div className="absolute bottom-[20%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-purple-300/10 blur-[140px] animate-float-2" />
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-12 relative z-10">

        {/* --- 1. HERO SECTION WITH APPLE-STYLE COMPRESSION --- */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[32px] overflow-hidden border border-white/40 shadow-glass bg-gradient-to-tr from-pink-50/50 via-purple-50/40 to-peach-50/30 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-md"
        >
          <div className="absolute inset-px rounded-[31px] border border-white/50 pointer-events-none z-10" />
          
          <div className="space-y-6 max-w-xl text-center md:text-left z-20">
            <span className="text-xs font-semibold text-primary-love tracking-widest uppercase mb-3 flex items-center justify-center md:justify-start gap-1.5 animate-pulse-soft">
              <Sparkles className="w-4 h-4 fill-primary-love/20" /> Guided Movement 🌸 Bloom
            </span>
            <h1 className="text-4xl md:text-6xl font-serif text-text-dark font-bold leading-tight">
              Every movement is an act of self-love
            </h1>
            <p className="text-text-sub font-display text-sm md:text-base leading-relaxed">
              "Bloom" is your pressure-free movement companion. Auto-detecting your daily cycle targets, facilitating stretching, breathing, and walks tailored specifically for PCOD/PCOS recovery.
            </p>



            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-text-sub uppercase tracking-wider">
              <span className="flex items-center gap-1 bg-white/70 px-3.5 py-1.5 rounded-full border border-primary-love/10 shadow-sm">
                <Clock className="w-4 h-4 text-primary-love" /> Today: {todayMinutes}m Active
              </span>
              <span className="flex items-center gap-1 bg-white/70 px-3.5 py-1.5 rounded-full border border-primary-love/10 shadow-sm">
                <Flame className="w-4 h-4 text-orange-400" /> Today: {todayCalories} kcal
              </span>
            </div>

            <button
              onClick={() => startWorkoutFlow(todayName)}
              className="px-8 py-3.5 bg-primary-love text-white text-xs font-bold tracking-wider uppercase rounded-full shadow-lg shadow-primary-love/20 hover:scale-103 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-white stroke-none" /> Start Today's Workout
            </button>
          </div>

          {/* Core score target concentric ring */}
          <div className="relative w-44 h-44 md:w-52 md:h-52 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <circle cx="18" cy="18" r="14.5" fill="none" stroke="#fce7f3" strokeWidth="2.2" />
              <motion.circle
                cx="18"
                cy="18"
                r="14.5"
                fill="none"
                stroke="#f472b6"
                strokeWidth="2.2"
                strokeDasharray="91"
                animate={{ strokeDashoffset: 91 - (overallProgress / 100) * 91 }}
                transition={{ duration: 0.8 }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-serif font-bold text-text-dark">{overallProgress}%</span>
              <span className="text-[9px] text-text-sub font-semibold tracking-widest uppercase mt-0.5">Move Goal</span>
            </div>
          </div>
        </motion.div>

        {/* --- 2. TODAY'S ACTIVE WORKOUT CARD --- */}
        <div className="grid md:grid-cols-3 gap-8">
          <GlassCard animateHover={false} className="md:col-span-2 space-y-6">
            <div className="flex justify-between items-center border-b border-primary-love/5 pb-3">
              <div>
                <h3 className="text-xl font-serif font-bold text-text-dark flex items-center gap-2">
                  ☀️ Today's Planned Exercises ({todayName})
                </h3>
                <p className="text-xs text-text-sub mt-0.5">{todayRoutine.title} • {todayRoutine.time} Duration</p>
              </div>
              <button
                onClick={() => startWorkoutFlow(todayName)}
                className="text-xs font-bold text-primary-love border border-primary-love/15 px-4 py-2 rounded-xl hover:bg-primary-love/5 cursor-pointer"
              >
                Launch Player
              </button>
            </div>

            <div className="divide-y divide-primary-love/5">
              {todayRoutine.exercises.map((ex, idx) => (
                <div key={idx} className="py-3.5 flex items-start gap-4 justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-text-dark">{ex.name}</h4>
                    <p className="text-xs text-text-sub leading-normal max-w-lg">{ex.desc}</p>
                  </div>
                  <span className="text-xs font-bold text-primary-love bg-pink-50 border border-primary-love/10 px-3 py-1 rounded-full shrink-0">
                    {ex.target}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Dynamic Side Reflections Note */}
          <GlassCard animateHover={false} className="bg-gradient-to-tr from-lavender-100/40 to-pink-100/40 flex flex-col justify-between p-6">
            <div>
              <Heart className="w-8 h-8 text-primary-love fill-primary-love/10 mb-3" />
              <h3 className="text-lg font-serif font-bold text-text-dark">Daily Reflection</h3>
              <p className="font-handwritten text-base italic text-primary-love leading-relaxed mt-2">
                "{motivationQuote}"
              </p>
            </div>
            
            <div className="text-[10px] text-text-sub/80 border-t border-primary-love/10 pt-4 leading-normal mt-4">
              Rest and slow aerobic movements support adrenal glands naturally. Be kind to yourself today.
            </div>
          </GlassCard>
        </div>

        {/* --- 3. WEEKLY PLAN CALENDAR GRID --- */}
        <div className="space-y-6">
          <div className="flex justify-between items-center pl-2">
            <div>
              <h2 className="text-2xl font-serif text-text-dark">Structured Weekly Plan</h2>
              <p className="text-xs text-text-sub">Interactive calendar layout detailing target exercises</p>
            </div>
            {/* Horizontal weekday tabs selector */}
            <div className="flex gap-1.5 overflow-x-auto py-1">
              {Object.keys(WEEKLY_PLAN).map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedPlannerDay(day)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
                    selectedPlannerDay === day 
                      ? 'bg-primary-love text-white shadow-md' 
                      : 'bg-white/70 border border-primary-love/10 text-text-sub'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Planner detail view */}
          <GlassCard animateHover={false} className="border-2 border-primary-love/5">
            <div className="flex justify-between items-center border-b border-primary-love/5 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-text-dark flex items-center gap-1.5">
                  📅 {selectedPlannerDay} Routine Plan
                </h3>
                <p className="text-xs text-text-sub">Est. Burn: {WEEKLY_PLAN[selectedPlannerDay].calories} • Duration: {WEEKLY_PLAN[selectedPlannerDay].time}</p>
              </div>
              <button
                onClick={() => startWorkoutFlow(selectedPlannerDay)}
                className="px-5 py-2 bg-primary-love text-white text-xs font-semibold rounded-xl hover:bg-primary-love/90 shadow-md cursor-pointer"
              >
                Start Day Routine
              </button>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {WEEKLY_PLAN[selectedPlannerDay].exercises.map((ex, i) => (
                <div key={i} className="p-4 bg-white/40 border border-primary-love/5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-primary-love uppercase tracking-wider block mb-1">Step {i+1}</span>
                    <h4 className="text-xs font-bold text-text-dark">{ex.name}</h4>
                    <p className="text-[10px] text-text-sub leading-normal mt-1 line-clamp-3">{ex.desc}</p>
                  </div>
                  <span className="text-[10px] font-bold text-text-sub bg-white border border-black/5 px-2.5 py-0.5 rounded-full w-fit mt-3">
                    {ex.target}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* --- 4. EXERCISE FILTER & SEARCH TOOLBAR --- */}
        <GlassCard animateHover={false} className="border border-primary-love/5">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:max-w-md relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-sub" />
              <input
                type="text"
                placeholder="Search structured routine exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-primary-love/15 rounded-xl bg-white/40 focus:outline-none focus:border-primary-love"
              />
            </div>
            
            <div className="flex gap-4 text-xs font-semibold text-text-sub">
              <label className="flex items-center gap-2 cursor-pointer">
                <AnimatedCheckbox checked={filterBeginnerOnly} onChange={(checked) => setFilterBeginnerOnly(checked)} />
                <span>Beginner Friendly Only</span>
              </label>
            </div>
          </div>

          {/* Search results display */}
          {searchQuery && (
            <div className="mt-4 pt-4 border-t border-primary-love/5 grid sm:grid-cols-2 gap-4">
              {filteredSearchList.length === 0 ? (
                <p className="text-xs text-text-sub col-span-2">No matching exercises found in the weekly planner.</p>
              ) : (
                filteredSearchList.map((ex, idx) => (
                  <div key={idx} className="p-3 bg-white/50 border border-primary-love/5 rounded-xl flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-text-dark">{ex.name} ({ex.day})</h4>
                      <p className="text-[10px] text-text-sub mt-0.5">{ex.desc}</p>
                    </div>
                    <span className="text-[10px] font-bold text-primary-love bg-pink-50 px-2 py-0.5 rounded-full shrink-0">
                      {ex.target}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </GlassCard>

        {/* --- 5. DETAILED YOGA ROUTINE LIBRARY --- */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-serif text-text-dark pl-2">🌸 Gentle Yoga Routines</h2>
            <p className="text-xs text-text-sub pl-2">Restorative poses supporting cellular relaxation and circulation</p>
          </div>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {YOGA_POSES.map((pose) => (
              <GlassCard
                key={pose.name}
                onClick={() => setSelectedYogaPose(pose)}
                className="border border-emerald-100 flex flex-col justify-between cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all duration-300"
              >
                <div>
                  <div className="flex justify-between items-start mb-3 pb-2 border-b border-emerald-50">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{pose.emoji}</span>
                      <h3 className="font-serif font-bold text-sm text-text-dark leading-snug">{pose.name}</h3>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full shrink-0">
                      {pose.duration}
                    </span>
                  </div>
                  
                  {/* Video Thumbnail Placeholder */}
                  {pose.video && (
                    <div className="aspect-video w-full rounded-2xl overflow-hidden bg-emerald-500/5 border border-emerald-100/50 mb-3 flex flex-col items-center justify-center relative shadow-sm hover:bg-emerald-500/10 transition-all duration-300">
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100/60 px-2.5 py-0.5 rounded-full absolute top-2 right-2 uppercase tracking-wider">Video Guide</span>
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 fill-emerald-600 stroke-none ml-0.5" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-emerald-600 uppercase tracking-wider text-[8px] block">Benefits</span>
                      <p className="text-text-sub mt-0.5 leading-normal">{pose.benefits}</p>
                    </div>
                    <div>
                      <span className="font-bold text-emerald-600 uppercase tracking-wider text-[8px] block">Breathing Guide</span>
                      <p className="text-text-sub mt-0.5 leading-normal italic font-serif">"{pose.breath}"</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-emerald-50/50 text-[10px] text-text-sub/70 space-y-1">
                  <div><span className="font-bold text-red-500/80">Avoid if:</span> {pose.contraindications}</div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* --- 6. STRETCHING SECTION --- */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-serif text-text-dark pl-2">🌿 Dynamic & Static Stretching</h2>
            <p className="text-xs text-text-sub pl-2">Unload muscular compression and open critical core joints</p>
          </div>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {STRETCHES.map((stretch, i) => (
              <GlassCard key={i} animateHover={false} className="p-5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full w-fit block mb-2">Stretch {i+1}</span>
                  <h3 className="font-serif font-bold text-sm text-text-dark mb-1">{stretch.name}</h3>
                  <p className="text-[10px] text-text-sub leading-normal line-clamp-3 mb-3">{stretch.benefits}</p>
                </div>
                <div className="text-[10px] text-text-sub border-t border-purple-100/50 pt-2.5 leading-relaxed italic">
                  💡 {stretch.instructions}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* --- 7. GUIDED BREATHING & COOLDOWN ACTION TRIGGERS --- */}
        <div className="grid sm:grid-cols-2 gap-8">
          
          {/* Guided breathing card trigger */}
          <GlassCard
            onClick={() => setBreathingModalOpen(true)}
            className="cursor-pointer bg-gradient-to-tr from-cyan-50 to-blue-50/50 border border-cyan-100 flex items-center justify-between p-6 relative group overflow-hidden"
          >
            <div className="space-y-2">
              <span className="text-xs font-bold text-cyan-600 bg-cyan-100/60 px-3 py-1 rounded-full w-fit block uppercase tracking-wider">Breathing Coach</span>
              <h3 className="text-xl font-serif font-bold text-text-dark mt-2">🌬️ Guided Breathing Circle</h3>
              <p className="text-xs text-text-sub leading-relaxed max-w-sm">
                Box breathing, 4-7-8 calm, and belly breathing routines with automated voice cues.
              </p>
            </div>
            <ChevronRight className="w-6 h-6 text-cyan-500 group-hover:translate-x-1.5 transition-transform" />
          </GlassCard>

          {/* Calming Guided cooldown card trigger */}
          <GlassCard
            onClick={cooldownActive ? stopCooldown : startCooldown}
            className={`cursor-pointer border flex items-center justify-between p-6 relative group overflow-hidden transition-all duration-300 ${
              cooldownActive ? 'bg-purple-100/60 border-purple-300 scale-103' : 'bg-gradient-to-tr from-purple-50 to-indigo-50/50 border-purple-100'
            }`}
          >
            <div className="space-y-2">
              <span className="text-xs font-bold text-purple-600 bg-purple-100/60 px-3 py-1 rounded-full w-fit block uppercase tracking-wider">Cooldown Flow</span>
              <h3 className="text-xl font-serif font-bold text-text-dark mt-2">
                {cooldownActive ? '🧘 Guided Cooldown Active' : '🌿 5-Min Calming Cooldown'}
              </h3>
              <p className="text-xs text-text-sub leading-relaxed max-w-sm">
                {cooldownActive 
                  ? `Active: ${COOLDOWN_PHASES[cooldownPhaseIdx].title} (${cooldownTimer}s remaining)` 
                  : 'Stretching, breathing, and Savasana relaxation flow with calming slow flower cues.'}
              </p>
            </div>
            {cooldownActive ? (
              <X className="w-6 h-6 text-purple-600" />
            ) : (
              <ChevronRight className="w-6 h-6 text-purple-500 group-hover:translate-x-1.5 transition-transform" />
            )}
          </GlassCard>
        </div>

        {/* --- 8. PROGRESS ANALYTICS & ACHIEVEMENTS --- */}
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Achievements badge grid list */}
          <GlassCard animateHover={false} className="md:col-span-2 space-y-6">
            <h3 className="text-lg font-serif font-bold text-text-dark flex items-center gap-2">
              <Award className="w-5 h-5 text-primary-love fill-primary-love/10" /> Your Achievements
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`p-4 rounded-2xl border flex items-start gap-3.5 transition-all ${
                    ach.unlocked 
                      ? 'bg-emerald-50/40 border-emerald-100 text-text-dark shadow-sm' 
                      : 'bg-black/5 border-black/5 opacity-50 text-text-sub'
                  }`}
                >
                  <span className="text-3xl">{ach.unlocked ? ach.icon : '🔒'}</span>
                  <div>
                    <h4 className="text-sm font-bold flex items-center gap-1">
                      {ach.title}
                      {ach.unlocked && <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />}
                    </h4>
                    <p className="text-[11px] leading-relaxed mt-0.5">{ach.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Simple Dynamic consistency statistics */}
          <GlassCard animateHover={false} className="flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-serif font-bold text-text-dark flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-5 h-5 text-primary-love" /> Monthly Overview
              </h3>
              <p className="text-xs text-text-sub leading-normal">
                Structured movements completed are support cells naturally. Check-ins are safe here.
              </p>
            </div>

            <div className="text-center py-6 space-y-2">
              <span className="text-5xl font-serif font-bold text-text-dark">{totalCompletedRoutines}</span>
              <span className="text-xs text-text-sub font-bold uppercase tracking-wider block">Total Routines Logged</span>
            </div>

            <div className="text-[9px] text-text-sub/70 italic text-center block border-t border-primary-love/5 pt-3">
              "Tomorrow is another beautiful opportunity to take care of yourself."
            </div>
          </GlassCard>
        </div>

      </div>

      {/* --- GUIDED BREATHING OVERLAY MODAL --- */}
      {createPortal(
        <AnimatePresence>
          {breathingModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-[#0E1525]/90 backdrop-blur-md flex items-center justify-center p-4"
            >
            <motion.div
              initial={{ scale: 0.93, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.93, y: 20 }}
              className="max-w-md w-full bg-[#1A2333] border border-cyan-500/10 rounded-[32px] p-8 text-center space-y-6 relative overflow-hidden flex flex-col justify-between min-h-[520px] shadow-2xl text-white"
            >
              {/* Close Button */}
              <button
                onClick={closeBreathingModal}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div className="text-left">
                  <span className="text-[9px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Coach</span>
                  <h3 className="text-lg font-serif font-bold text-white mt-1">Guided Breathing</h3>
                </div>
                {/* Voice Assist switch */}
                <button
                  onClick={() => setVoiceAssist(!voiceAssist)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    voiceAssist ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400' : 'border-white/10 text-slate-400'
                  }`}
                  title={voiceAssist ? 'Disable Voice Assist' : 'Enable Voice Assist'}
                >
                  {voiceAssist ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
                </button>
              </div>

              {/* Central Coach Animation Circle */}
              <div className="flex-1 flex flex-col items-center justify-center py-6 relative">
                
                {/* Expanding glowing circle */}
                <motion.div
                  className="rounded-full bg-cyan-500/20 absolute"
                  animate={{
                    width: breathPhase === 'Inhale' ? ['140px', '220px'] : breathPhase === 'Exhale' ? ['220px', '140px'] : breathPhase === 'Hold' ? '220px' : '140px',
                    height: breathPhase === 'Inhale' ? ['140px', '220px'] : breathPhase === 'Exhale' ? ['220px', '140px'] : breathPhase === 'Hold' ? '220px' : '140px',
                  }}
                  transition={{
                    duration: breathPhase === 'Inhale' ? BREATHING_TECHS[selectedBreathingIdx].inhale : breathPhase === 'Exhale' ? BREATHING_TECHS[selectedBreathingIdx].exhale : 1,
                    ease: 'easeInOut'
                  }}
                />

                <div className="w-36 h-36 rounded-full bg-cyan-500/40 border border-cyan-400/30 flex flex-col items-center justify-center z-10 shadow-lg shadow-cyan-500/10">
                  <span className="text-2xl font-serif font-bold tracking-wide uppercase">{breathPhase}</span>
                  <span className="text-xs opacity-80 mt-1 font-mono">{breathTimer}s</span>
                </div>
              </div>

              {/* Selector lists */}
              <div className="space-y-4">
                <div className="flex justify-around bg-white/5 border border-white/5 rounded-2xl p-1">
                  {BREATHING_TECHS.map((tech, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        handleStopBreathing();
                        setSelectedBreathingIdx(i);
                        setBreathTimer(tech.inhale);
                      }}
                      className={`flex-1 py-2 text-[10px] font-bold rounded-xl transition-all cursor-pointer ${
                        selectedBreathingIdx === i ? 'bg-cyan-500 text-white shadow' : 'text-slate-400'
                      }`}
                    >
                      {tech.name.split(' ')[0]}
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed font-sans px-2">
                  {BREATHING_TECHS[selectedBreathingIdx].desc}
                </p>

                <div className="flex gap-4 pt-2">
                  {breathingActive ? (
                    <button
                      onClick={handleStopBreathing}
                      className="flex-1 py-3 bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-semibold rounded-full hover:bg-red-500/30 transition-colors cursor-pointer"
                    >
                      Pause Coach
                    </button>
                  ) : (
                    <button
                      onClick={handleStartBreathing}
                      className="flex-1 py-3 bg-cyan-500 text-white text-xs font-semibold rounded-full hover:bg-cyan-600 shadow-md shadow-cyan-500/15 cursor-pointer"
                    >
                      Start Guided Flow
                    </button>
                  )}
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}

      {/* --- GUIDED WORKOUT PLAYER OVERLAY MODAL --- */}
      {createPortal(
        <AnimatePresence>
          {playerOpen && activePlayerRoutine && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-[#0A0512]/92 backdrop-blur-lg flex items-center justify-center p-4"
            >
            <motion.div
              initial={{ scale: 0.94, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 20 }}
              className="max-w-2xl w-full bg-[#181124] border border-primary-love/10 rounded-[36px] p-8 text-center space-y-6 relative overflow-hidden flex flex-col justify-between min-h-[540px] shadow-2xl text-white"
            >
              {/* Star sprinkles completion */}
              <AnimatePresence>
                {showConfetti && (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none z-30">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: ['#F472B6', '#C084FC', '#FB7185', '#FBBF24'][i % 4],
                          left: `${Math.random() * 80 + 10}%`,
                          top: `-20px`
                        }}
                        animate={{
                          y: ['0vh', '80vh'],
                          x: ['0px', `${(Math.random() - 0.5) * 120}px`],
                          rotate: [0, 360]
                        }}
                        transition={{
                          duration: Math.random() * 2 + 1.5,
                          ease: 'easeOut',
                          repeat: Infinity
                        }}
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>

              {/* Header */}
              <div className="flex justify-between items-start border-b border-white/10 pb-4">
                <div className="text-left">
                  <span className="text-[10px] font-bold text-primary-love bg-pink-500/10 border border-primary-love/15 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {activePlayerDayName} Routine
                  </span>
                  <h3 className="text-lg font-serif font-bold text-white mt-1.5">{activePlayerRoutine.title}</h3>
                </div>
                {/* Voice assist */}
                <button
                  onClick={() => setVoiceAssist(!voiceAssist)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    voiceAssist ? 'bg-pink-500/10 border-primary-love text-primary-love' : 'border-white/10 text-slate-400'
                  }`}
                >
                  {voiceAssist ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
                </button>
              </div>

              {/* Main Content Area */}
              {!completionSuccess ? (
                <div className="flex-1 my-6 flex flex-col items-center justify-center text-center space-y-6">
                  
                  {/* Step Info */}
                  <div className="space-y-1 max-w-lg mx-auto">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Exercise {playerStepIdx + 1} of {activePlayerRoutine.exercises.length}
                    </span>
                    <h4 className="text-2xl font-serif font-bold text-white">
                      {activePlayerRoutine.exercises[playerStepIdx].name}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed italic">
                      "{activePlayerRoutine.exercises[playerStepIdx].desc}"
                    </p>
                  </div>

                  {/* Visual Guide Demonstration Box */}
                  <div className="w-full max-w-sm aspect-video rounded-2xl overflow-hidden bg-black/20 border border-white/5 flex items-center justify-center relative mx-auto shrink-0 shadow-inner">
                    {activePlayerRoutine.exercises[playerStepIdx].video ? (
                      <video
                        src={activePlayerRoutine.exercises[playerStepIdx].video}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-contain bg-black"
                      />
                    ) : activePlayerRoutine.exercises[playerStepIdx].image ? (
                      <img
                        src={activePlayerRoutine.exercises[playerStepIdx].image}
                        alt={activePlayerRoutine.exercises[playerStepIdx].name}
                        className="w-full h-full object-contain bg-black"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-tr from-pink-500/5 to-purple-500/5">
                        {renderExerciseVisual(activePlayerRoutine.exercises[playerStepIdx].name)}
                      </div>
                    )}
                  </div>

                  {/* Dynamic tracking panel */}
                  <div className="w-full flex justify-center items-center py-4">
                    {isResting ? (
                      /* Rest overlay timer */
                      <div className="p-6 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center space-y-2 max-w-xs w-full animate-pulse-soft">
                        <span className="text-xs font-bold text-purple-400 uppercase tracking-widest block">Rest Interval</span>
                        <p className="text-4xl font-serif font-bold text-white">{restTimer}s</p>
                        <button
                          onClick={() => setIsResting(false)}
                          className="text-[10px] font-semibold text-purple-400 border border-purple-500/20 px-3 py-1 rounded-lg hover:bg-purple-500/10 mt-1 cursor-pointer"
                        >
                          Skip Rest
                        </button>
                      </div>
                    ) : activePlayerRoutine.exercises[playerStepIdx].type === 'time' ? (
                      /* Timed workout countdown */
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-28 h-28 rounded-full border-2 border-primary-love/20 flex flex-col items-center justify-center relative shadow-lg">
                          <span className="text-3xl font-serif font-bold text-white font-mono">{stepTimerSecs}s</span>
                          <span className="text-[8px] text-slate-400 uppercase tracking-wider">Remaining</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setStepTimerActive(!stepTimerActive)}
                            className="px-6 py-1.5 bg-primary-love text-white text-xs font-semibold rounded-lg hover:bg-primary-love/90 cursor-pointer shadow-sm"
                          >
                            {stepTimerActive ? 'Pause' : 'Start'}
                          </button>
                          <button
                            onClick={() => setStepTimerSecs(activePlayerRoutine.exercises[playerStepIdx].duration || 60)}
                            className="p-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-white cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Rep/Set tracking values */
                      <div className="flex flex-col items-center gap-4">
                        <div className="flex gap-8 justify-center">
                          <div className="text-center bg-white/5 border border-white/5 px-6 py-3 rounded-2xl min-w-[90px]">
                            <span className="text-[9px] text-slate-400 uppercase tracking-widest block">Current Set</span>
                            <span className="text-xl font-bold text-white">{currentSet} / {activePlayerRoutine.exercises[playerStepIdx].sets || 3}</span>
                          </div>
                          <div className="text-center bg-white/5 border border-white/5 px-6 py-3 rounded-2xl min-w-[90px]">
                            <span className="text-[9px] text-slate-400 uppercase tracking-widest block">Reps Target</span>
                            <span className="text-xl font-bold text-primary-love">{activePlayerRoutine.exercises[playerStepIdx].reps || 12}</span>
                          </div>
                        </div>

                        {/* Set complete rest controls */}
                        <div className="flex gap-1.5 flex-wrap justify-center">
                          <span className="text-[10px] text-slate-400 font-bold block w-full mb-1">Log Set & Rest:</span>
                          {[10, 20, 30, 45, 60].map((sec) => (
                            <button
                              key={sec}
                              onClick={() => {
                                const totalSets = activePlayerRoutine.exercises[playerStepIdx].sets || 3;
                                if (currentSet < totalSets) {
                                  setCurrentSet((s) => s + 1);
                                  triggerRest(sec);
                                } else {
                                  speakText("Exercise set complete.");
                                  handleNextStep();
                                }
                              }}
                              className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold hover:bg-white/10 text-slate-300 cursor-pointer"
                            >
                              +{sec}s
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation Footer */}
                  <div className="w-full pt-4 border-t border-white/10 flex justify-between items-center gap-4">
                    <button
                      onClick={handlePrevStep}
                      disabled={playerStepIdx === 0}
                      className="px-5 py-2 border border-white/10 rounded-xl text-xs font-semibold text-slate-300 disabled:opacity-30 cursor-pointer hover:bg-white/5"
                    >
                      Previous
                    </button>
                    
                    <button
                      onClick={() => {
                        window.speechSynthesis.cancel();
                        setPlayerOpen(false);
                      }}
                      className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                    >
                      Exit Routine
                    </button>

                    <button
                      onClick={handleNextStep}
                      className="px-6 py-2 bg-primary-love text-white text-xs font-bold rounded-xl hover:bg-primary-love/90 shadow-sm cursor-pointer"
                    >
                      {playerStepIdx === activePlayerRoutine.exercises.length - 1 ? 'Finish' : 'Next'}
                    </button>
                  </div>

                </div>
              ) : (
                /* Completion feedback form modal overlay */
                <div className="flex-1 my-6 flex flex-col justify-between text-center space-y-6">
                  <div className="space-y-3">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 fill-emerald-500/10 mx-auto animate-bounce" />
                    <h3 className="text-2xl font-serif font-bold text-white">Routine Complete!</h3>
                    <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                      You took amazing care of yourself. Take a moment to log your mood and notes below.
                    </p>
                  </div>

                  {/* Mood and Notes selections */}
                  <div className="space-y-4 max-w-md mx-auto w-full">
                    <div className="flex justify-around bg-white/5 border border-white/5 rounded-2xl p-1">
                      {['Calm', 'Happy', 'Amazing', 'Tired'].map((m) => (
                        <button
                          key={m}
                          onClick={() => setMood(m)}
                          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                            mood === m ? 'bg-primary-love text-white shadow' : 'text-slate-400'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add reflections or symptoms noted..."
                      className="w-full px-4 py-3 text-xs border border-white/10 rounded-xl bg-[#1A1625] text-slate-200 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={finishWorkoutLog}
                    className="w-full py-3.5 bg-primary-love text-white text-xs font-bold rounded-xl hover:bg-primary-love/90 shadow-lg cursor-pointer tracking-wider uppercase"
                  >
                    Log Completed Routine
                  </button>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}

    {/* --- SELECTED YOGA POSE OVERLAY MODAL --- */}
    {createPortal(
      <AnimatePresence>
        {selectedYogaPose && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.94, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 20 }}
              className="max-w-2xl w-full bg-white border border-emerald-100 rounded-[32px] p-8 space-y-6 relative overflow-hidden flex flex-col justify-between shadow-2xl text-text-dark max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedYogaPose(null)}
                className="absolute top-4 right-4 p-2 text-text-sub hover:text-text-dark cursor-pointer z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex justify-between items-start border-b border-emerald-50 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selectedYogaPose.emoji}</span>
                  <div>
                    <h3 className="text-xl font-serif font-bold text-text-dark">{selectedYogaPose.name}</h3>
                    <p className="text-xs text-text-sub">Yoga Guide • {selectedYogaPose.duration} Duration</p>
                  </div>
                </div>
              </div>

              {/* Video Player Display */}
              {selectedYogaPose.video && (
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black/10 border border-emerald-50 relative shadow-sm shrink-0">
                  <video
                    src={selectedYogaPose.video}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-contain bg-black"
                    style={{ filter: 'contrast(1.02) saturate(1.05)' }}
                  />
                </div>
              )}

              {/* Details layout */}
              <div className="space-y-4 text-xs md:text-sm text-text-sub leading-relaxed">
                <div>
                  <span className="font-bold text-emerald-600 uppercase tracking-wider text-[10px] block">Pose Benefits</span>
                  <p className="mt-1 font-sans">{selectedYogaPose.benefits}</p>
                </div>
                <div>
                  <span className="font-bold text-emerald-600 uppercase tracking-wider text-[10px] block">Breathing Guidelines</span>
                  <p className="mt-1 font-serif italic">"{selectedYogaPose.breath}"</p>
                </div>
                <div>
                  <span className="font-bold text-emerald-600 uppercase tracking-wider text-[10px] block">Mistakes to Avoid</span>
                  <p className="mt-1 font-sans">{selectedYogaPose.mistakes}</p>
                </div>
                <div>
                  <span className="font-bold text-red-500/80 uppercase tracking-wider text-[10px] block">Contraindications</span>
                  <p className="mt-1 font-sans text-red-600/90">{selectedYogaPose.contraindications}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedYogaPose(null)}
                className="w-full py-3 bg-emerald-600 text-white font-semibold text-xs tracking-wider uppercase rounded-xl hover:bg-emerald-700 shadow-md cursor-pointer mt-4"
              >
                Return to Library
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

export default Exercise;
