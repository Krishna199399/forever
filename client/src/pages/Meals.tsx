import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/common/GlassCard';
import { AnimatedCheckbox } from '@/components/common/AnimatedCheckbox';
import {
  Flame,
  Scale,
  Sparkles,
  Clock,
  Droplet,
  Search,
  ShoppingCart,
  BookOpen,
  Calendar,
  Bookmark,
  Trash
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
}

interface MealProgress {
  _id?: string;
  mealName: string;
  mealType: 'Breakfast' | 'Morning Snack' | 'Lunch' | 'Evening Snack' | 'Dinner';
  completedDate: string;
  calories: number;
  protein: number;
  notes?: string;
}

const CATEGORIES = [
  'All',
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
  'High Protein',
  'Vegetarian'
];

const SWAPS = [
  { from: 'White Rice', to: 'Brown Rice / Quinoa', why: 'Lower glycemic index prevents insulin spikes.' },
  { from: 'Refined Sugar', to: 'Jaggery / Dates (in moderation)', why: 'Contains antioxidants and iron.' },
  { from: 'Potato Chips', to: 'Roasted Makhana (Foxnuts)', why: 'High in protein, low in calorie density.' },
  { from: 'Soft Drinks', to: 'Lemon Water / Buttermilk (Chaas)', why: 'Hydrates without heavy sucrose overload.' },
  { from: 'White Bread (Maida)', to: 'Whole Wheat / Multigrain Bread', why: 'Retains fiber and trace nutrients.' }
];

const HEALTHY_SNACKS = [
  { name: 'Roasted Chana', cals: 100, protein: 6, benefits: 'High fiber, extremely slow digesting complex carbs.' },
  { name: 'Moong Sprouts Salad', cals: 80, protein: 7, benefits: 'Raw enzymes, rich in iron and vitamin C.' },
  { name: 'Mixed Nuts (Almonds/Walnuts)', cals: 140, protein: 4, benefits: 'Healthy fats stabilize cell membranes.' },
  { name: 'Paneer Cubes (Lightly roasted)', cals: 150, protein: 12, benefits: 'Rich calcium source supporting ovary health.' }
];

const DEFAULT_SHOPPING_LIST = [
  { id: 's1', name: 'Paneer (Low Fat)', category: 'Dairy', qty: '400g', purchased: false },
  { id: 's2', name: 'Moong Dal (Yellow)', category: 'Lentils', qty: '1 kg', purchased: false },
  { id: 's3', name: 'Organic Quinoa', category: 'Whole grains', qty: '500g', purchased: false },
  { id: 's4', name: 'Chia Seeds', category: 'Seeds', qty: '200g', purchased: false },
  { id: 's5', name: 'Fresh Organic Carrots', category: 'Vegetables', qty: '500g', purchased: false },
  { id: 's6', name: 'Almond Milk (Unsweetened)', category: 'Dairy', qty: '2 Liters', purchased: false },
];

export const Meals: React.FC = () => {
  // --- DATABASE STATE ---
  const [meals, setMeals] = useState<Meal[]>([]);
  const [progress, setProgress] = useState<MealProgress[]>([]);
  const [loading, setLoading] = useState(true);

  // Favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('fav_meals') || '[]');
  });

  // Hydration state (saved locally for quick reactivity)
  const [waterCups, setWaterCups] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(`water_${today}`);
    return saved ? Number(saved) : 0;
  });

  // Search & Library filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Shopping List items
  const [shoppingList, setShoppingList] = useState(() => {
    const saved = localStorage.getItem('shopping_list');
    return saved ? JSON.parse(saved) : DEFAULT_SHOPPING_LIST;
  });
  const [newShopItemName, setNewShopItemName] = useState('');
  const [newShopItemQty, setNewShopItemQty] = useState('');

  // Weekly Planner assignments (Day -> Meal name)
  const [weeklyPlan, setWeeklyPlan] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('weekly_meals');
    return saved ? JSON.parse(saved) : {
      Monday: 'Oats & Carrot Idli',
      Tuesday: 'High-Protein Moong Dal Cheela',
      Wednesday: 'One-Pot Quinoa Khichdi',
      Thursday: 'Almond-Chia Seed Smoothie',
      Friday: 'Oats & Carrot Idli',
      Saturday: 'One-Pot Quinoa Khichdi',
      Sunday: 'High-Protein Moong Dal Cheela'
    };
  });



  // --- API FETHES ---
  const loadData = async () => {
    try {
      setLoading(true);
      const resM = await api.get('/api/meal-library');
      if (resM.data) setMeals(resM.data);

      const resP = await api.get('/api/meal-progress');
      if (resP.data) setProgress(resP.data);
    } catch (e) {
      console.log('API Offline. Standalone mode active for Nourish.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync Shopping list
  useEffect(() => {
    localStorage.setItem('shopping_list', JSON.stringify(shoppingList));
  }, [shoppingList]);

  // Sync Weekly Planner
  useEffect(() => {
    localStorage.setItem('weekly_meals', JSON.stringify(weeklyPlan));
  }, [weeklyPlan]);

  // --- HANDLERS ---
  const toggleFavorite = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const updated = favorites.includes(slug)
      ? favorites.filter((s) => s !== slug)
      : [...favorites, slug];
    setFavorites(updated);
    localStorage.setItem('fav_meals', JSON.stringify(updated));
  };

  // Water Tracker handlers
  const handleAddWater = (amtMl: number) => {
    const cups = amtMl / 250;
    setWaterCups((w) => {
      const next = w + cups;
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(`water_${today}`, String(next));
      // Save water stats to backend if connected
      api.post('/api/water', { date: today, consumedCups: next, targetCups: 12 });
      return next;
    });
  };

  const handleResetWater = () => {
    const today = new Date().toISOString().split('T')[0];
    setWaterCups(0);
    localStorage.setItem(`water_${today}`, '0');
    api.post('/api/water', { date: today, consumedCups: 0, targetCups: 12 });
  };

  // Shopping List modifiers
  const handleAddShoppingItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopItemName) return;
    const newItem = {
      id: 's_' + Date.now(),
      name: newShopItemName,
      qty: newShopItemQty || '1 unit',
      category: 'Grains/Misc',
      purchased: false
    };
    setShoppingList((prev: any) => [...prev, newItem]);
    setNewShopItemName('');
    setNewShopItemQty('');
  };

  const togglePurchased = (id: string) => {
    setShoppingList((prev: any) =>
      prev.map((item: any) => (item.id === id ? { ...item, purchased: !item.purchased } : item))
    );
  };

  const clearPurchased = () => {
    setShoppingList((prev: any) => prev.filter((item: any) => !item.purchased));
  };

  const handleDeleteMeal = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await api.delete(`/api/meal-library/${id}`);
      loadData();
    } catch (err) {
      console.log('Delete meal failed:', err);
    }
  };

  // Assign meals dynamically to day slots
  const assignMealToDay = (day: string, mealName: string) => {
    setWeeklyPlan((prev) => ({
      ...prev,
      [day]: mealName
    }));
  };

  // --- STAT CALCULATIONS ---
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayProgress = useMemo(() => {
    return progress.filter((p) => p.completedDate === todayDateStr);
  }, [progress, todayDateStr]);

  const loggedCalories = todayProgress.reduce((sum, p) => sum + (p.calories || 200), 0);
  const loggedProtein = todayProgress.reduce((sum, p) => sum + (p.protein || 10), 0);

  const proteinGoal = 55; // grams
  const waterTargetCups = 12; // 3 Liters
  
  const proteinPercent = Math.min(Math.round((loggedProtein / proteinGoal) * 100), 100);
  const waterPercent = Math.min(Math.round((waterCups / waterTargetCups) * 100), 100);
  const nutritionCompletion = Math.round((proteinPercent + waterPercent) / 2);

  // Search filter
  const filteredMeals = useMemo(() => {
    return meals.filter((m) => {
      const matchSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'All' ? true :
                       selectedCategory === 'High Protein' ? m.protein >= 10 :
                       selectedCategory === 'Vegetarian' ? true : // seeded are veg
                       m.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [meals, searchQuery, selectedCategory]);

  return (
    <div className="space-y-12 pb-20">
      
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-grad-orange opacity-40 blur-[100px] animate-float-2" />
        <div className="absolute bottom-[30%] right-[-15%] w-[55vw] h-[55vw] rounded-full bg-grad-pink opacity-30 blur-[120px] animate-float-1" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 relative z-10">

        {/* --- HERO SECTION --- */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[32px] overflow-hidden border border-white/40 shadow-glass bg-gradient-to-tr from-orange-100/40 via-pink-100/30 to-rose-100/20 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-md"
        >
          <div className="absolute inset-px rounded-[31px] border border-white/50 pointer-events-none z-10" />

          <div className="space-y-6 max-w-xl text-center md:text-left z-20">
            <span className="text-xs font-semibold text-primary-love tracking-widest uppercase mb-3 flex items-center justify-center md:justify-start gap-1.5 animate-pulse-soft">
              <Sparkles className="w-4 h-4 fill-primary-love/20" /> Nourish Companion
            </span>
            <h1 className="text-4xl md:text-6xl font-serif text-text-dark font-bold leading-tight animate-fade-in">
              Let's nourish your body with love today ❤️
            </h1>
            <p className="text-text-sub font-display text-base md:text-lg leading-relaxed">
              "Every healthy meal is a gift to your future self." Mindful Indian vegetarian meals styled for hormone balance.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-bold text-text-sub uppercase tracking-wider">

              <span className="flex items-center gap-1.5 bg-white/70 px-3.5 py-1.5 rounded-full border border-primary-love/10 shadow-sm">
                <Flame className="w-4.5 h-4.5 text-orange-400" /> Today: {loggedCalories} kcal
              </span>
              <span className="flex items-center gap-1.5 bg-white/70 px-3.5 py-1.5 rounded-full border border-primary-love/10 shadow-sm">
                <Scale className="w-4.5 h-4.5 text-sky-400" /> Today: {loggedProtein}g / 55g Protein
              </span>
            </div>
          </div>

          {/* Goal progress circle */}
          <div className="w-full max-w-[240px] aspect-square relative z-20 flex items-center justify-center bg-white/50 border border-white/80 rounded-[28px] p-6 shadow-sm">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#fee2e2" strokeWidth="2.5" />
                <motion.circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#f472b6"
                  strokeWidth="2.5"
                  strokeDasharray="88"
                  animate={{ strokeDashoffset: 88 - (nutritionCompletion / 100) * 88 }}
                  transition={{ duration: 0.8 }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-serif font-bold text-text-dark">{nutritionCompletion}%</span>
                <span className="text-[8px] text-text-sub font-semibold tracking-widest uppercase mt-0.5">Hydra + Prot</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* --- TODAY'S MEAL RECOMMENDATION TIMELINE --- */}
        <div className="space-y-6">
          <h2 className="text-2xl font-serif text-text-dark pl-2">Today's Meal Timeline</h2>
          <div className="grid md:grid-cols-5 gap-6">
            {[
              { slot: 'Breakfast', name: 'Oats & Carrot Idli', cals: 180, pro: '7g', time: '15m prep', img: '🥞' },
              { slot: 'Morning Snack', name: 'Almond-Chia Smoothie', cals: 160, pro: '5g', time: '10m prep', img: '🍹' },
              { slot: 'Lunch', name: 'One-Pot Quinoa Khichdi', cals: 290, pro: '14g', time: '25m prep', img: '🍲' },
              { slot: 'Evening Snack', name: 'Roasted Makhana', cals: 90, pro: '3g', time: '5m prep', img: '🍿' },
              { slot: 'Dinner', name: 'Moong Dal Cheela with Paneer', cals: 220, pro: '12g', time: '15m prep', img: '🍳' }
            ].map((slot) => {
              const isLogged = todayProgress.some((p) => p.mealType === slot.slot);
              return (
                <GlassCard
                  key={slot.slot}
                  animateHover={true}
                  className={`flex flex-col justify-between p-5 relative border ${
                    isLogged ? 'border-emerald-200 bg-emerald-50/10' : 'border-primary-love/5'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-bold text-primary-love uppercase tracking-wider bg-pink-50 px-2 py-0.5 rounded-full">
                        {slot.slot}
                      </span>
                      {isLogged && (
                        <span className="text-[8px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-0.5">
                          ✓ Logged
                        </span>
                      )}
                    </div>
                    <span className="text-3xl block my-3">{slot.img}</span>
                    <h4 className="font-serif font-bold text-sm text-text-dark leading-snug">{slot.name}</h4>
                    
                    <div className="mt-3 space-y-1 text-[10px] text-text-sub font-semibold">
                      <span className="block">{slot.time}</span>
                      <span className="block">{slot.cals} kcal &bull; {slot.pro} Protein</span>
                    </div>
                  </div>

                  <Link
                    to={`/meals/${slot.name.toLowerCase().replace(/ /g, '-').replace(/&/g, 'carrot')}`}
                    className="w-full py-1.5 mt-4 text-center border border-primary-love/15 hover:bg-primary-love text-primary-love hover:text-white rounded-lg text-[10px] font-semibold tracking-wider uppercase transition-colors"
                  >
                    View Recipe
                  </Link>
                </GlassCard>
              );
            })}
          </div>
        </div>

        {/* --- WATER BOTTLE TRACKER --- */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Water log bottle illustration */}
          <GlassCard animateHover={false} className="md:col-span-2 bg-gradient-to-tr from-sky-50 to-indigo-50/30 border-sky-100 relative overflow-hidden flex flex-col md:flex-row items-center justify-around p-8">
            <div className="absolute top-[-10px] right-[-10px] w-24 h-24 rounded-full bg-sky-200/20 blur-xl pointer-events-none" />
            
            {/* Visual cup-filling glass display */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-28 h-52 bg-white/60 border-2 border-sky-300 rounded-[24px] overflow-hidden flex flex-col justify-end p-1 shadow-sm">
                <motion.div
                  className="w-full bg-gradient-to-t from-sky-400 to-sky-300 rounded-[20px]"
                  style={{ height: `${(waterCups / waterTargetCups) * 100}%` }}
                  initial={{ height: '0%' }}
                  animate={{ height: `${(waterCups / waterTargetCups) * 100}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
                
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
                  <Droplet className="w-8 h-8 text-sky-500 fill-sky-200/40 animate-bounce" />
                  <span className="text-xl font-bold font-serif text-text-dark mt-1">{(waterCups * 0.25).toFixed(2)}L</span>
                  <span className="text-[9px] text-text-sub font-semibold uppercase tracking-wider">Goal: 3.0 Liters</span>
                </div>
              </div>

              {waterPercent >= 100 && (
                <span className="mt-3 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 animate-pulse">
                  Goal Achieved! 💧
                </span>
              )}
            </div>

            {/* Quick add triggers */}
            <div className="space-y-4 max-w-xs text-center md:text-left mt-6 md:mt-0">
              <div>
                <h3 className="text-lg font-serif font-bold text-text-dark flex items-center justify-center md:justify-start gap-1">
                  <Droplet className="w-5 h-5 text-sky-500 fill-sky-50" /> Hydration Monitor
                </h3>
                <p className="text-xs text-text-sub leading-relaxed mt-1">
                  Drinking water supports estrogen processing and keeps insulin levels stable. Log your daily cups!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { text: '+ 250 ml', val: 250 },
                  { text: '+ 500 ml', val: 500 },
                  { text: '+ 750 ml', val: 750 },
                  { text: '+ 1.0 L', val: 1000 }
                ].map((item) => (
                  <button
                    key={item.text}
                    onClick={() => handleAddWater(item.val)}
                    className="py-2.5 bg-white border border-sky-200 hover:border-sky-300 text-sky-600 rounded-xl text-xs font-bold transition-all shadow-sm shadow-sky-500/5 cursor-pointer"
                  >
                    {item.text}
                  </button>
                ))}
              </div>

              <button
                onClick={handleResetWater}
                className="w-full text-center py-2 border border-dashed border-red-200 text-red-500 rounded-xl text-[10px] font-semibold hover:bg-red-50 transition-colors uppercase tracking-wider cursor-pointer"
              >
                Reset Daily Hydration
              </button>
            </div>
          </GlassCard>

          {/* Healthy Swaps Card */}
          <GlassCard animateHover={false} className="flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-serif font-bold text-text-dark flex items-center gap-1">
                <Sparkles className="w-5 h-5 text-amber-500" /> Healthy Snacking
              </h3>
              <p className="text-xs text-text-sub mt-0.5 leading-relaxed">
                PCOS-friendly snack options rich in fibers and minerals.
              </p>
            </div>

            <div className="space-y-3.5 my-4">
              {HEALTHY_SNACKS.map((snack) => (
                <div key={snack.name} className="flex justify-between items-center text-xs pb-2 border-b border-primary-love/5">
                  <div>
                    <h5 className="font-bold text-text-dark">{snack.name}</h5>
                    <span className="text-[10px] text-text-sub font-semibold">{snack.benefits}</span>
                  </div>
                  <span className="text-[10px] font-bold text-primary-love shrink-0 bg-pink-50 px-2 py-0.5 rounded">
                    {snack.cals} cal
                  </span>
                </div>
              ))}
            </div>

            <span className="text-[10px] text-text-sub text-center italic">
              "Snacking healthy reduces glucose drop cravings"
            </span>
          </GlassCard>
        </div>

        {/* --- WEEKLY MEAL PLANBOARD --- */}
        <div className="space-y-6">
          <h2 className="text-2xl font-serif text-text-dark pl-2 flex items-center gap-2">
            <Calendar className="w-5.5 h-5.5 text-primary-love" /> Weekly Meal Planner
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
            {Object.keys(weeklyPlan).map((day) => (
              <GlassCard key={day} animateHover={false} className="p-4 text-center flex flex-col justify-between h-40">
                <div>
                  <span className="text-[10px] font-bold text-primary-love uppercase tracking-wider block border-b border-primary-love/5 pb-1">
                    {day}
                  </span>
                  <h4 className="font-serif font-bold text-xs text-text-dark mt-3 leading-snug line-clamp-3">
                    {weeklyPlan[day]}
                  </h4>
                </div>

                {/* Dropdown meal assignment selector */}
                <select
                  value={weeklyPlan[day]}
                  onChange={(e) => assignMealToDay(day, e.target.value)}
                  className="w-full mt-3 px-1.5 py-1 text-[9px] border border-primary-love/10 rounded-md focus:outline-none bg-white font-semibold text-text-dark"
                >
                  <option>Oats & Carrot Idli</option>
                  <option>High-Protein Moong Dal Cheela</option>
                  <option>One-Pot Quinoa Khichdi</option>
                  <option>Almond-Chia Seed Smoothie</option>
                </select>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* --- GROCERY SHOPPING CHECKLIST & HEALTHY SWAPS --- */}
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Shopping List */}
          <GlassCard animateHover={false} className="space-y-6">
            <div className="flex justify-between items-center border-b border-primary-love/5 pb-3">
              <div>
                <h3 className="text-lg font-serif font-bold text-text-dark flex items-center gap-1.5">
                  <ShoppingCart className="w-5 h-5 text-primary-love" /> Grocery Shopping List
                </h3>
                <span className="text-[10px] text-text-sub block">Generated automatically based on ingredients</span>
              </div>
              <button
                onClick={clearPurchased}
                className="text-[10px] text-red-500 hover:text-red-600 font-bold border border-red-200 hover:bg-red-50 px-2.5 py-1 rounded-xl transition-colors uppercase tracking-wider"
              >
                Clear Checked
              </button>
            </div>

            <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1">
              {shoppingList.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <AnimatedCheckbox checked={item.purchased} onChange={() => togglePurchased(item.id)} />
                    <span className={`font-semibold text-text-dark ${item.purchased ? 'line-through text-text-sub/50' : ''}`}>
                      {item.name}
                    </span>
                  </label>
                  <span className="text-[10px] text-text-sub font-semibold">{item.qty}</span>
                </div>
              ))}
            </div>

            {/* Form to insert custom item */}
            <form onSubmit={handleAddShoppingItem} className="flex gap-2 border-t border-primary-love/5 pt-4">
              <input
                type="text"
                required
                placeholder="Add custom item..."
                value={newShopItemName}
                onChange={(e) => setNewShopItemName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs border border-primary-love/10 rounded-xl bg-white/50 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Qty..."
                value={newShopItemQty}
                onChange={(e) => setNewShopItemQty(e.target.value)}
                className="w-16 px-2 py-1.5 text-xs border border-primary-love/10 rounded-xl bg-white/50 focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 bg-primary-love text-white rounded-xl text-xs font-semibold hover:bg-primary-love/90 shadow-sm"
              >
                Add
              </button>
            </form>
          </GlassCard>

          {/* Healthy Swaps Contrast Cards */}
          <GlassCard animateHover={false} className="space-y-6">
            <div>
              <h3 className="text-lg font-serif font-bold text-text-dark flex items-center gap-1">
                <Sparkles className="w-5 h-5 text-amber-400" /> Nutritional Swaps
              </h3>
              <p className="text-xs text-text-sub">
                Small swaps in everyday cooking to lower overall glycemic load.
              </p>
            </div>

            <div className="space-y-3.5">
              {SWAPS.map((swap, idx) => (
                <div key={idx} className="flex justify-between items-start gap-4 text-xs pb-3 border-b border-primary-love/5 last:border-0 last:pb-0">
                  <div className="w-1/3">
                    <span className="text-[9px] font-bold text-red-500 line-through block">Instead of:</span>
                    <span className="font-bold text-text-sub mt-0.5 block">{swap.from}</span>
                  </div>
                  
                  <div className="w-1/3 text-emerald-600 font-bold">
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">Swap with:</span>
                    <span className="mt-0.5 block">→ {swap.to}</span>
                  </div>

                  <div className="w-1/3 text-[10px] text-text-sub/90 leading-relaxed italic">
                    {swap.why}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* --- MEAL RECIPES LIBRARY GRID --- */}
        <div className="space-y-6">
          <h2 className="text-2xl font-serif text-text-dark pl-2">Meal & Recipe Library</h2>

          {/* Inline filters */}
          <div className="flex flex-wrap gap-2 border-b border-primary-love/5 pb-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-primary-love border-primary-love text-white shadow-sm'
                    : 'border-primary-love/15 hover:border-primary-love/35 text-text-dark bg-white/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-sub" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-primary-love/15 rounded-xl bg-white/40 focus:outline-none"
            />
          </div>

          {loading ? (
            <div className="text-center py-12 text-text-sub font-serif animate-pulse">Loading recipes...</div>
          ) : filteredMeals.length === 0 ? (
            <div className="text-center py-12 text-text-sub border border-dashed border-primary-love/15 rounded-3xl bg-white/20">
              No matching recipes found. Try clearing filters.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-2 gap-8">
              {filteredMeals.map((meal) => {
                const isFav = favorites.includes(meal.slug);
                return (
                  <GlassCard
                    key={meal.slug}
                    animateHover={true}
                    className="flex flex-col justify-between overflow-hidden relative"
                  >
                    {/* Favorite Button */}
                    <button
                      onClick={(e) => toggleFavorite(meal.slug, e)}
                      className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 border border-primary-love/10 text-primary-love shadow-sm cursor-pointer hover:bg-white"
                    >
                      <Bookmark className={`w-4.5 h-4.5 ${isFav ? 'fill-primary-love' : ''}`} />
                    </button>

                    <div>
                      <div className="flex gap-1.5 mb-3">
                        <span className="text-[9px] font-bold text-primary-love bg-pink-50 border border-primary-love/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {meal.category}
                        </span>
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          PCOS Friendly
                        </span>
                      </div>

                      <h3 className="text-xl font-serif font-bold text-text-dark mb-2">{meal.name}</h3>
                      <p className="text-xs text-text-sub leading-relaxed line-clamp-2">{meal.description}</p>
                      
                      {/* Macro summaries */}
                      <div className="flex gap-4 items-center mt-4 pt-3 border-t border-primary-love/5">
                        <span className="text-xs text-text-sub font-semibold flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-orange-400" /> {meal.calories} kcal
                        </span>
                        <span className="text-xs text-text-sub font-semibold flex items-center gap-1">
                          <Scale className="w-3.5 h-3.5 text-sky-400" /> {meal.protein}g protein
                        </span>
                        <span className="text-xs text-text-sub font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-primary-love" /> {meal.prepTime + meal.cookTime} mins
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center gap-2 w-full">
                      <Link
                        to={`/meals/${meal.slug}`}
                        className="flex-1 py-2.5 bg-primary-love text-white font-semibold text-xs tracking-wider rounded-xl hover:bg-primary-love/90 shadow-md shadow-primary-love/10 flex items-center justify-center gap-1.5 cursor-pointer relative z-10"
                      >
                        <BookOpen className="w-3.5 h-3.5" /> View Recipe
                      </Link>
                      {meal._id && (
                        <button
                          onClick={(e) => handleDeleteMeal(meal._id!, e)}
                          className="px-3.5 py-2.5 border border-red-200 hover:bg-red-50 text-red-500 rounded-xl text-xs font-semibold cursor-pointer relative z-10"
                          title="Delete Recipe"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>



      </div>

    </div>
  );
};
export default Meals;
