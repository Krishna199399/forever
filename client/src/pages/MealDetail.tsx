import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/common/GlassCard';
import {
  ChevronLeft,
  Clock,
  Flame,
  Scale,
  Sparkles,
  Printer,
  Heart,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import api from '@/lib/api';

interface Meal {
  _id?: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  prepTime: number;
  cookTime: number;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  ingredients: string[];
  preparationSteps: string[];
  micronutrients?: string[];
  benefits?: string[];
  alternativeIngredients?: string[];
  featured?: boolean;
}

export const MealDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);

  // Completion states
  const [showProgressOverlay, setShowProgressOverlay] = useState(false);
  const [mealType, setMealType] = useState<'Breakfast' | 'Morning Snack' | 'Lunch' | 'Evening Snack' | 'Dinner'>('Breakfast');
  const [logNotes, setLogNotes] = useState('');

  // Fetch recipe
  useEffect(() => {
    const fetchMeal = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/meal-library/${slug}`);
        if (res.data) {
          setMeal(res.data);
        } else {
          setMeal(null);
        }
      } catch (err) {
        console.error('Failed to load recipe details:', err);
        setMeal(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMeal();
  }, [slug]);

  // Sync default type based on recipe category
  useEffect(() => {
    if (meal) {
      if (meal.category === 'Lunch') setMealType('Lunch');
      else if (meal.category === 'Dinner') setMealType('Dinner');
      else if (meal.category === 'Snacks') setMealType('Evening Snack');
      else setMealType('Breakfast');
    }
  }, [meal]);

  // Log completion handler
  const handleLogMeal = async () => {
    if (!meal) return;
    const today = new Date().toISOString().split('T')[0];
    const logData = {
      mealId: meal._id || null,
      mealName: meal.name,
      mealType,
      completedDate: today,
      calories: meal.calories,
      protein: meal.protein,
      notes: logNotes
    };

    try {
      await api.post('/api/meal-progress', logData);
    } catch (e) {
      console.log('Progress logs saved locally:', e);
    }

    setShowProgressOverlay(false);
    navigate('/meals');
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="text-center py-20 text-text-sub font-serif animate-pulse">Loading Recipe Details...</div>;
  }

  if (!meal) {
    return (
      <div className="text-center py-20">
        <h3 className="text-2xl font-serif text-text-dark">Recipe not found</h3>
        <Link to="/meals" className="text-primary-love text-sm font-semibold mt-4 block">Back to Nourish</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 print:p-0">
      
      {/* Back button link */}
      <Link to="/meals" className="flex items-center gap-1.5 text-text-sub hover:text-primary-love transition-colors text-sm font-semibold print:hidden">
        <ChevronLeft className="w-4 h-4" /> Back to Nourish
      </Link>

      {/* --- HERO BANNER --- */}
      <div className="relative rounded-[28px] overflow-hidden aspect-video bg-gradient-to-tr from-orange-200 via-pink-200 to-rose-300 border-glass flex items-center justify-center p-6 text-center">
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
        <div className="relative z-10 text-white max-w-xl space-y-4">
          <div className="flex gap-2 justify-center">
            <span className="text-[10px] font-bold bg-white/20 border border-white/30 px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              {meal.category}
            </span>
            <span className="text-[10px] font-bold bg-emerald-500/30 border border-emerald-300/40 px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              PCOS Friendly
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold leading-tight drop-shadow-sm">{meal.name}</h1>
          <p className="text-xs md:text-sm text-white/95 leading-relaxed font-sans">{meal.description}</p>
        </div>
      </div>

      {/* --- INGREDIENTS/NUTRITION METRICS ROW --- */}
      <div className="grid grid-cols-5 gap-3 text-center">
        {[
          { name: 'Calories', val: `${meal.calories} kcal`, icon: <Flame className="w-4 h-4 text-orange-400" /> },
          { name: 'Protein', val: `${meal.protein}g`, icon: <Scale className="w-4 h-4 text-sky-400" /> },
          { name: 'Carbs', val: `${meal.carbs}g`, icon: <Clock className="w-4 h-4 text-amber-400" /> },
          { name: 'Fat', val: `${meal.fat}g`, icon: <Heart className="w-4 h-4 text-red-400" /> },
          { name: 'Fiber', val: `${meal.fiber}g`, icon: <Sparkles className="w-4 h-4 text-emerald-400" /> }
        ].map((nut) => (
          <GlassCard key={nut.name} animateHover={false} className="p-3">
            <div className="flex justify-center mb-1">{nut.icon}</div>
            <p className="text-xs md:text-sm font-bold text-text-dark font-serif">{nut.val}</p>
            <span className="text-[8px] text-text-sub uppercase tracking-wider block mt-0.5">{nut.name}</span>
          </GlassCard>
        ))}
      </div>

      {/* --- RECIPE COOKING METRIC ROW --- */}
      <div className="grid grid-cols-3 gap-4">
        <GlassCard animateHover={false} className="text-center p-3.5">
          <Clock className="w-4.5 h-4.5 text-primary-love mx-auto mb-1" />
          <p className="text-sm font-bold text-text-dark font-serif">{meal.prepTime} mins</p>
          <span className="text-[9px] text-text-sub uppercase tracking-wider block">Prep Time</span>
        </GlassCard>
        <GlassCard animateHover={false} className="text-center p-3.5">
          <Clock className="w-4.5 h-4.5 text-primary-love mx-auto mb-1" />
          <p className="text-sm font-bold text-text-dark font-serif">{meal.cookTime} mins</p>
          <span className="text-[9px] text-text-sub uppercase tracking-wider block">Cook Time</span>
        </GlassCard>
        <GlassCard animateHover={false} className="text-center p-3.5">
          <Scale className="w-4.5 h-4.5 text-purple-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-text-dark font-serif truncate">{meal.servingSize}</p>
          <span className="text-[9px] text-text-sub uppercase tracking-wider block">Serving Size</span>
        </GlassCard>
      </div>

      {/* --- INGREDIENTS & STEPS GRID --- */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Left col: Ingredients checklist */}
        <div className="space-y-6">
          <GlassCard animateHover={false}>
            <h3 className="text-lg font-serif font-bold text-text-dark mb-4">Ingredients</h3>
            <ul className="space-y-3">
              {meal.ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-text-sub leading-normal">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-love shrink-0 mt-1.5" />
                  <span>{ing}</span>
                </li>
              ))}
            </ul>
          </GlassCard>

          {/* Alternative substitutions */}
          {meal.alternativeIngredients && meal.alternativeIngredients.length > 0 && (
            <GlassCard animateHover={false} className="border border-sky-100 bg-sky-50/5">
              <h3 className="text-sm font-serif font-bold text-text-dark flex items-center gap-1.5 mb-3">
                <HelpCircle className="w-4 h-4 text-sky-400" /> Healthy Swaps
              </h3>
              <ul className="space-y-2 text-[11px] text-text-sub leading-relaxed list-disc pl-4">
                {meal.alternativeIngredients.map((alt, i) => (
                  <li key={i}>{alt}</li>
                ))}
              </ul>
            </GlassCard>
          )}
        </div>

        {/* Right two cols: Steps & PCOS Benefits */}
        <div className="md:col-span-2 space-y-6">
          <GlassCard animateHover={false}>
            <h3 className="text-lg font-serif font-bold text-text-dark mb-4">Preparation Steps</h3>
            <ol className="space-y-5">
              {meal.preparationSteps.map((step, idx) => (
                <li key={idx} className="flex gap-4">
                  <span className="w-6 h-6 rounded-full bg-primary-love/10 border border-primary-love/20 flex items-center justify-center text-xs font-bold text-primary-love shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-text-sub leading-relaxed pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          </GlassCard>

          {/* PCOS Benefits */}
          {meal.benefits && meal.benefits.length > 0 && (
            <GlassCard animateHover={false} className="border border-emerald-100 bg-emerald-50/5">
              <h3 className="text-lg font-serif font-bold text-text-dark flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-emerald-500 fill-emerald-50" /> Why this is good for PCOS
              </h3>
              <ul className="space-y-2.5">
                {meal.benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-text-sub leading-normal">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}

          {/* Micronutrient support details */}
          {meal.micronutrients && meal.micronutrients.length > 0 && (
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[10px] font-bold text-text-sub uppercase tracking-wider">Rich in:</span>
              {meal.micronutrients.map((m, i) => (
                <span key={i} className="text-[10px] font-semibold bg-primary-love/5 border border-primary-love/15 px-3 py-1 rounded-full text-primary-love">
                  {m}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- CTAS & PRINT TRIGGERS --- */}
      <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4 print:hidden">
        <button
          onClick={() => setShowProgressOverlay(true)}
          className="px-8 py-3.5 bg-primary-love text-white font-bold rounded-full shadow-lg shadow-primary-love/15 hover:scale-102 transition-transform text-xs tracking-widest uppercase flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <CheckCircle className="w-4 h-4 fill-white stroke-primary-love" /> Log Completed Meal
        </button>

        <button
          onClick={handlePrint}
          className="px-6 py-3.5 border border-primary-love/20 text-primary-love font-bold rounded-full hover:bg-primary-love/5 transition-colors text-xs tracking-widest uppercase flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Print Recipe
        </button>
      </div>

      {/* --- LOG COMPLETION OVERLAY --- */}
      <AnimatePresence>
        {showProgressOverlay && (
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
              {/* Confetti particles */}
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
                <Heart className="w-8 h-8 fill-primary-love text-primary-love" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-bold text-text-dark">Log This Meal</h3>
                <p className="text-sm font-handwritten text-primary-love leading-relaxed max-w-sm mx-auto">
                  "Wonderful ❤️ You're taking great care of yourself today."
                </p>
              </div>

              {/* Feedbacks */}
              <div className="space-y-3.5 text-left">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-sub">Meal Slot</label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-primary-love/10 rounded-xl focus:outline-none bg-white font-semibold text-text-dark"
                  >
                    <option>Breakfast</option>
                    <option>Morning Snack</option>
                    <option>Lunch</option>
                    <option>Evening Snack</option>
                    <option>Dinner</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-sub">Journal Notes (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Added extra chopped paneer!"
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-primary-love/15 rounded-xl bg-white focus:outline-none focus:border-primary-love"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => setShowProgressOverlay(false)}
                  className="flex-1 py-3 border border-primary-love/15 text-primary-love text-xs font-semibold rounded-full hover:bg-primary-love/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogMeal}
                  className="flex-1 py-3 bg-primary-love text-white text-xs font-semibold rounded-full hover:bg-primary-love/90 shadow-lg shadow-primary-love/20 cursor-pointer"
                >
                  Log Meal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
export default MealDetail;
