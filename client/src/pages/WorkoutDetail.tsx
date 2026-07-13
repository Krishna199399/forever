import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/common/GlassCard';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Dumbbell,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  X,
  Volume2,
  VolumeX,
  AlertTriangle,
  Award,
  Sparkles
} from 'lucide-react';
import api from '@/lib/api';

// Interfaces
interface Workout {
  _id?: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  duration: number;
  calories: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  equipment: string;
  benefits?: string[];
  instructions: string[];
  safetyTips?: string[];
  commonMistakes?: string[];
  targetMuscles?: string[];
  video?: string;
  beginnerFriendly?: boolean;
  pcosFriendly?: boolean;
}

export const WorkoutDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);

  // Guided Player Active states
  const [playerOpen, setPlayerOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(45); // 45 seconds per step
  const [isPlaying, setIsPlaying] = useState(false);

  // Easing rest timers
  const [isRest, setIsRest] = useState(false);
  const [restDuration, setRestDuration] = useState(15); // Default 15s rest
  const [restTimeRemaining, setRestTimeRemaining] = useState(15);

  // Voice Assist
  const [voiceAssist, setVoiceAssist] = useState(true);

  // Completion Log Overlay
  const [completed, setCompleted] = useState(false);
  const [mood, setMood] = useState('😌 Calmer & Peaceful');
  const [notes, setNotes] = useState('');

  // Video Settings
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Fetch Workout Details
  useEffect(() => {
    const loadWorkout = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/workout-library/${slug}`);
        if (res.data) {
          setWorkout(res.data);
        } else {
          setWorkout(null);
        }
      } catch (e) {
        console.error('Failed to load workout details:', e);
        setWorkout(null);
      } finally {
        setLoading(false);
      }
    };
    loadWorkout();
  }, [slug]);

  // --- VOICE SYNTHESIS READER ---
  const speakInstruction = (text: string) => {
    if (!voiceAssist) return;
    try {
      // Cancel previous speech
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // slightly slower for relaxing flow
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.log('Speech synthesis error:', e);
    }
  };

  // Trigger speech on step changes
  useEffect(() => {
    if (playerOpen && workout && isPlaying) {
      if (isRest) {
        speakInstruction("Take a deep breath and rest.");
      } else {
        speakInstruction(`Next exercise: ${workout.instructions[currentStep]}`);
      }
    }
  }, [currentStep, isRest, playerOpen, isPlaying]);

  // --- TIMER CYCLE INTERVALS ---
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        if (isRest) {
          setRestTimeRemaining((r) => {
            if (r <= 1) {
              setIsRest(false);
              setTimeRemaining(45); // reset next exercise timer
              return restDuration;
            }
            return r - 1;
          });
        } else {
          setTimeRemaining((s) => {
            if (s <= 1) {
              if (workout && currentStep < workout.instructions.length - 1) {
                setIsRest(true);
                setRestTimeRemaining(restDuration);
                setCurrentStep((curr) => curr + 1);
                return 0;
              } else {
                // Completed final step
                setIsPlaying(false);
                setCompleted(true);
                return 0;
              }
            }
            return s - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isRest, workout, currentStep, restDuration]);

  // --- WORKOUT EVENT HANDLERS ---
  const startPlayer = () => {
    setPlayerOpen(true);
    setCurrentStep(0);
    setTimeRemaining(45);
    setIsRest(false);
    setIsPlaying(true);
  };

  const handlePauseToggle = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setTimeRemaining(45);
    setIsRest(false);
    setIsPlaying(true);
  };

  const handleSkip = () => {
    if (workout && currentStep < workout.instructions.length - 1) {
      setCurrentStep((curr) => curr + 1);
      setIsRest(true);
      setRestTimeRemaining(restDuration);
    } else {
      setIsPlaying(false);
      setCompleted(true);
    }
  };

  const saveCompletion = async () => {
    if (!workout) return;
    const today = new Date().toISOString().split('T')[0];
    const logData = {
      workoutId: workout._id || null,
      workoutTitle: workout.title,
      completedDate: today,
      duration: workout.duration,
      calories: workout.calories,
      mood,
      notes
    };

    try {
      await api.post('/api/workout-progress', logData);
      // Log audit event for caregivers
      await api.post('/api/user/audit', {
        action: `Completed workout: ${workout.title}`,
        category: 'Workout',
        details: `Duration: ${workout.duration}m, Est. Burn: ${workout.calories} kcal`
      });
    } catch (e) {
      console.log('Failed to upload log or audit:', e);
    }

    setCompleted(false);
    setPlayerOpen(false);
    navigate('/exercise');
  };

  if (loading) {
    return <div className="text-center py-20 text-text-sub font-serif animate-pulse">Loading Routine Details...</div>;
  }

  if (!workout) {
    return (
      <div className="text-center py-20">
        <h3 className="text-2xl font-serif text-text-dark">Routine not found</h3>
        <Link to="/exercise" className="text-primary-love text-sm font-semibold mt-4 block">Back to Bloom</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Back button */}
      <Link to="/exercise" className="flex items-center gap-1.5 text-text-sub hover:text-primary-love transition-colors text-sm font-semibold">
        <ChevronLeft className="w-4 h-4" /> Back to Bloom
      </Link>

      {/* Medical Disclaimer Banner */}
      <div className="p-4 bg-primary-love/5 border border-primary-love/10 rounded-2xl text-[11px] text-text-sub/80 leading-relaxed">
        ℹ️ <strong>General Wellness Support:</strong> These exercises support general fitness and healthy lifestyle habits. They are not a treatment or cure for PCOS. Please consult a healthcare professional before starting a new exercise routine.
      </div>

      {/* --- HERO IMAGE CONTAINER --- */}
      <div className="relative rounded-[28px] overflow-hidden aspect-video bg-gradient-to-tr from-pink-300 via-purple-300 to-orange-200 border-glass flex items-center justify-center p-6 text-center">
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
        <div className="relative z-10 text-white max-w-xl space-y-4">
          <div className="flex gap-2 justify-center">
            <span className="text-[10px] font-bold bg-white/20 border border-white/30 px-3 py-1 rounded-full uppercase tracking-wider">
              {workout.category}
            </span>
            <span className="text-[10px] font-bold bg-white/20 border border-white/30 px-3 py-1 rounded-full uppercase tracking-wider">
              {workout.difficulty}
            </span>
            {workout.pcosFriendly && (
              <span className="text-[10px] font-bold bg-emerald-500/30 border border-emerald-300/40 px-3 py-1 rounded-full uppercase tracking-wider">
                PCOS Friendly
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold leading-tight drop-shadow-sm">{workout.title}</h1>
          <p className="text-xs md:text-sm text-white/90 leading-relaxed font-sans">{workout.description}</p>
        </div>
      </div>

      {/* --- DOUBLE ROW STATISTICS --- */}
      <div className="grid grid-cols-3 gap-4">
        <GlassCard animateHover={false} className="text-center p-4">
          <Clock className="w-5 h-5 text-primary-love mx-auto mb-1" />
          <p className="text-lg font-bold text-text-dark font-serif">{workout.duration}m</p>
          <span className="text-[9px] text-text-sub uppercase tracking-wider block">Duration</span>
        </GlassCard>
        <GlassCard animateHover={false} className="text-center p-4">
          <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-text-dark font-serif">{workout.calories} kcal</p>
          <span className="text-[9px] text-text-sub uppercase tracking-wider block">Est. Burn</span>
        </GlassCard>
        <GlassCard animateHover={false} className="text-center p-4">
          <Dumbbell className="w-5 h-5 text-purple-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-text-dark font-serif truncate mt-1">{workout.equipment}</p>
          <span className="text-[9px] text-text-sub uppercase tracking-wider block">Equipment</span>
        </GlassCard>
      </div>

      {/* --- VIDEO PLAYER COMPONENT --- */}
      {workout.video && (
        <GlassCard animateHover={false} className="overflow-hidden">
          <h2 className="text-xl font-serif text-text-dark mb-4">Routine Video Guide</h2>
          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black relative">
            <video
              ref={videoRef}
              src={workout.video}
              controls
              className="w-full h-full object-contain bg-black"
              style={{ filter: 'contrast(1.05) saturate(1.1)' }}
            />
            {/* Speed controller overlays */}
            <div className="absolute bottom-16 right-4 z-20 flex gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-xl text-[10px] text-white">
              <span className="font-semibold mr-1">Speed:</span>
              {[0.75, 1, 1.25].map((speed) => (
                <button
                  key={speed}
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.playbackRate = speed;
                      setPlaybackSpeed(speed);
                    }
                  }}
                  className={`px-1.5 rounded cursor-pointer font-bold ${playbackSpeed === speed ? 'bg-primary-love text-white' : 'hover:bg-white/10'
                    }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </GlassCard>
      )}

      {/* --- BENIFITS & DETAIL GRIDS --- */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left two columns: details */}
        <div className="md:col-span-2 space-y-6">
          <GlassCard animateHover={false}>
            <h3 className="text-lg font-serif font-bold text-text-dark mb-3">Target Area & Benefits</h3>
            {workout.benefits && (
              <ul className="space-y-2">
                {workout.benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-text-sub leading-normal">
                    <Sparkles className="w-3.5 h-3.5 text-primary-love shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}

            {workout.targetMuscles && (
              <div className="mt-4 pt-4 border-t border-primary-love/5">
                <span className="text-[10px] font-bold text-primary-love uppercase tracking-wider">Target Muscles:</span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {workout.targetMuscles.map((m, i) => (
                    <span key={i} className="text-[10px] font-semibold bg-primary-love/5 border border-primary-love/15 px-2.5 py-1 rounded-full text-primary-love">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>

          <GlassCard animateHover={false}>
            <h3 className="text-lg font-serif font-bold text-text-dark mb-4">Step-by-step Instructions</h3>
            <ol className="space-y-4">
              {workout.instructions.map((step, idx) => (
                <li key={idx} className="flex gap-4">
                  <span className="w-6 h-6 rounded-full bg-primary-love/10 border border-primary-love/20 flex items-center justify-center text-xs font-bold text-primary-love shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-text-sub leading-relaxed pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          </GlassCard>
        </div>

        {/* Right column: Safety & Contraindications */}
        <div className="space-y-6">
          {/* Safety Tips */}
          {workout.safetyTips && (
            <GlassCard animateHover={false} className="border border-amber-100 bg-amber-50/5">
              <h3 className="text-sm font-serif font-bold text-text-dark flex items-center gap-1.5 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 fill-amber-50" /> Safety Cues
              </h3>
              <ul className="space-y-2 text-[11px] text-text-sub leading-relaxed list-disc pl-4">
                {workout.safetyTips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </GlassCard>
          )}

          {/* Common Mistakes */}
          {workout.commonMistakes && (
            <GlassCard animateHover={false} className="border border-red-100 bg-red-50/5">
              <h3 className="text-sm font-serif font-bold text-text-dark flex items-center gap-1.5 mb-3">
                <X className="w-4 h-4 text-red-500" /> Watch Out For
              </h3>
              <ul className="space-y-2 text-[11px] text-text-sub leading-relaxed list-disc pl-4">
                {workout.commonMistakes.map((mistake, i) => (
                  <li key={i}>{mistake}</li>
                ))}
              </ul>
            </GlassCard>
          )}
        </div>
      </div>

      {/* --- START CTA --- */}
      <div className="pt-4 text-center">
        <button
          onClick={startPlayer}
          className="px-10 py-4 bg-primary-love text-white font-bold rounded-full shadow-lg shadow-primary-love/20 hover:scale-102 transition-transform text-sm tracking-widest uppercase flex items-center justify-center gap-2 mx-auto cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white stroke-none" /> Launch Guided Routine
        </button>
      </div>

      {/* --- TIMED GUIDED PLAYER OVERLAY MODAL --- */}
      {createPortal(
        <AnimatePresence>
          {playerOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.93, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.93, y: 20 }}
                className="max-w-2xl w-full bg-white border border-primary-love/15 rounded-[32px] p-8 space-y-6 relative overflow-hidden flex flex-col justify-between min-h-[500px] shadow-2xl"
              >
                {/* Close Player */}
                <button
                  onClick={() => {
                    window.speechSynthesis.cancel();
                    setPlayerOpen(false);
                  }}
                  className="absolute top-4 right-4 p-2 text-text-sub hover:text-text-dark cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Player Header controls */}
                <div className="flex justify-between items-start border-b border-primary-love/10 pb-4">
                  <div>
                    <span className="text-[10px] font-bold text-primary-love bg-pink-50 border border-primary-love/15 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Guided Flow
                    </span>
                    <h3 className="text-xl font-serif font-bold text-text-dark mt-2">{workout.title}</h3>
                  </div>

                  {/* Voice Assist control toggle */}
                  <button
                    onClick={() => setVoiceAssist(!voiceAssist)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${voiceAssist ? 'bg-primary-love/10 border-primary-love text-primary-love' : 'border-text-sub/10 text-text-sub'
                      }`}
                    title={voiceAssist ? 'Mute Voice Assist' : 'Enable Voice Assist'}
                  >
                    {voiceAssist ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                </div>

                {/* Central Exercise Guide */}
                <div className="flex-1 my-6 flex flex-col items-center justify-center text-center space-y-6">
                  <AnimatePresence mode="wait">
                    {isRest ? (
                      <motion.div
                        key="rest"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-4"
                      >
                        <span className="text-4xl">🌱</span>
                        <h4 className="text-xl font-serif font-bold text-sky-500">Rest & Re-center</h4>
                        <p className="text-xs text-text-sub max-w-xs mx-auto">
                          Inhale calm, exhale strain. Next up:
                          <span className="font-bold text-text-dark block mt-1">{workout.instructions[currentStep]}</span>
                        </p>

                        {/* Countdown timer adjust selectors */}
                        <div className="flex items-center justify-center gap-1.5 mt-2">
                          {[10, 15, 30, 45].map((secs) => (
                            <button
                              key={secs}
                              onClick={() => {
                                setRestDuration(secs);
                                setRestTimeRemaining(secs);
                              }}
                              className={`px-2 py-0.5 rounded border text-[9px] font-bold cursor-pointer transition-all ${restDuration === secs ? 'bg-sky-400 border-sky-400 text-white' : 'border-sky-200 text-sky-500 hover:bg-sky-50'
                                }`}
                            >
                              {secs}s
                            </button>
                          ))}
                        </div>

                        {/* Rest timer digit */}
                        <p className="text-6xl font-bold font-serif text-sky-500">{restTimeRemaining}s</p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="active"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-4 w-full"
                      >
                        <span className="text-xs font-semibold text-text-sub uppercase tracking-wider">
                          Exercise {currentStep + 1} of {workout.instructions.length}
                        </span>
                        <p className="text-lg text-text-dark font-medium leading-relaxed max-w-lg mx-auto italic font-serif">
                          "{workout.instructions[currentStep]}"
                        </p>

                        {/* Active timer ring */}
                        <div className="relative w-28 h-28 flex items-center justify-center mx-auto mt-4">
                          <svg viewBox="0 0 36 36" className="absolute inset-0 w-full h-full transform -rotate-90">
                            <circle cx="18" cy="18" r="14" fill="none" stroke="#fce7f3" strokeWidth="2.5" />
                            <circle
                              cx="18"
                              cy="18"
                              r="14"
                              fill="none"
                              stroke="#f472b6"
                              strokeWidth="2.5"
                              strokeDasharray="88"
                              strokeDashoffset={88 - (timeRemaining / 45) * 88}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="text-3xl font-serif font-bold text-text-dark relative z-10">{timeRemaining}s</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Player footer buttons */}
                <div className="flex justify-between items-center border-t border-primary-love/10 pt-4">
                  <button
                    disabled={currentStep === 0}
                    onClick={() => {
                      setCurrentStep((c) => c - 1);
                      setIsRest(false);
                      setTimeRemaining(45);
                    }}
                    className="px-4 py-2 border border-primary-love/15 text-primary-love disabled:opacity-40 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRestart}
                      className="p-2 border border-primary-love/10 text-primary-love hover:bg-primary-love/5 rounded-xl cursor-pointer"
                      title="Restart Timer"
                    >
                      <RotateCcw className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={handlePauseToggle}
                      className="p-3.5 bg-primary-love text-white rounded-full shadow-lg shadow-primary-love/15 cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-5 h-5 fill-white stroke-none" /> : <Play className="w-5 h-5 fill-white stroke-none" />}
                    </button>
                    <button
                      onClick={handleSkip}
                      className="p-2 border border-primary-love/10 text-primary-love hover:bg-primary-love/5 rounded-xl cursor-pointer"
                      title="Skip Exercise"
                    >
                      <SkipForward className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  <button
                    onClick={handleSkip}
                    className="px-5 py-2 bg-primary-love text-white rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-primary-love/90 cursor-pointer"
                  >
                    {currentStep === workout.instructions.length - 1 ? 'Finish' : 'Next'} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* --- CONGRATULATIONS SUCCESS MODAL --- */}
      {createPortal(
        <AnimatePresence>
          {completed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="max-w-md w-full bg-white border border-primary-love/15 rounded-[32px] p-8 text-center space-y-6 relative overflow-hidden"
              >
                {/* Confetti drops */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        left: `${Math.random() * 80 + 10}%`,
                        top: `-20px`,
                        backgroundColor: i % 3 === 0 ? '#f472b6' : i % 3 === 1 ? '#c084fc' : '#6bcb77'
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
                  <Award className="w-8 h-8 text-primary-love" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-serif font-bold text-text-dark">Routine Completed!</h3>
                  <p className="text-sm font-handwritten text-primary-love leading-relaxed max-w-sm mx-auto">
                    "I'm so proud of you. Thank you for taking care of yourself today. ❤️"
                  </p>
                </div>

                {/* Log entry feedbacks */}
                <div className="space-y-3.5 text-left">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-sub">Log your post-exercise mood</label>
                    <select
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-primary-love/10 rounded-xl focus:outline-none bg-white"
                    >
                      <option>😌 Calmer & Peaceful</option>
                      <option>⚡ Energized & Focused</option>
                      <option>😊 Relieved & Proud</option>
                      <option>😴 Soft & Sleep-ready</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-sub">Add a short journal note (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Spine stretches felt incredible!"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-primary-love/15 rounded-xl bg-white/40 focus:outline-none focus:border-primary-love"
                    />
                  </div>
                </div>

                <button
                  onClick={saveCompletion}
                  className="w-full py-3 bg-primary-love text-white text-xs font-semibold rounded-full hover:bg-primary-love/90 shadow-lg shadow-primary-love/20 cursor-pointer"
                >
                  Log Completion & Return
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
export default WorkoutDetail;
