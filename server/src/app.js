import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import { Water, Sleep, Workout, Meal, Mood, Promise, LoveNote, WorkoutLibrary, WorkoutProgress, MealLibrary, MealProgress, DetailedSleepLog, CycleWellnessLog, Memory, AuditLog, Settings, LoveLetter, UserProfile } from './models/index.js';

const app = express();

// --- CORS ---
// In production, reads allowed origin from CORS_ORIGIN env variable.
// Falls back to localhost for local development.
const allowedOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:5173',
  // Allow extra dev ports only outside of production
  ...(process.env.NODE_ENV !== 'production'
    ? ['http://localhost:5174', 'http://localhost:5175']
    : [])
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: Origin ${origin} is not allowed.`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(helmet());
app.use(compression());

// --- Request Logger ---
app.use((req, _res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.path}`);
  next();
});

// Simple Custom Rate Limiter middleware (200 requests per 15 minutes per IP)
const rateLimitWindow = 15 * 60 * 1000;
const rateLimitMax = 200;
const ipRequests = new Map();

const rateLimiter = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  if (!ipRequests.has(ip)) {
    ipRequests.set(ip, []);
  }
  const timestamps = ipRequests.get(ip).filter(time => now - time < rateLimitWindow);
  timestamps.push(now);
  ipRequests.set(ip, timestamps);
  if (timestamps.length > rateLimitMax) {
    return res.status(429).json({ error: 'Too many requests from this IP. Please try again later.' });
  }
  next();
};
app.use(rateLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper to get today's date formatted as YYYY-MM-DD in local time
const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Root Health Check Route
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', time: new Date() });
});

// Detailed API Health Check (DB connectivity)
app.get('/api/health', (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  const isHealthy = dbState === 1;
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    db: states[dbState] || 'unknown',
    uptime: Math.floor(process.uptime()),
    time: new Date().toISOString()
  });
});

// --- WATER ROUTES ---
app.get('/api/water', async (req, res) => {
  try {
    const date = req.query.date || getTodayDateString();
    let waterLog = await Water.findOne({ date });
    if (!waterLog) {
      waterLog = await Water.create({ date, consumedCups: 0, targetCups: 8 });
    }
    res.json(waterLog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch water log' });
  }
});

app.post('/api/water', async (req, res) => {
  try {
    const date = req.body.date || getTodayDateString();
    const { consumedCups } = req.body;
    let waterLog = await Water.findOneAndUpdate(
      { date },
      { consumedCups },
      { new: true, upsert: true }
    );
    res.json(waterLog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save water log' });
  }
});

// --- SLEEP ROUTES ---
app.get('/api/sleep', async (req, res) => {
  try {
    const date = req.query.date || getTodayDateString();
    let sleepLog = await Sleep.findOne({ date });
    if (!sleepLog) {
      sleepLog = await Sleep.create({ date, durationHours: 8, quality: 'Good' });
    }
    res.json(sleepLog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sleep log' });
  }
});

app.post('/api/sleep', async (req, res) => {
  try {
    const date = req.body.date || getTodayDateString();
    const { durationHours, quality } = req.body;
    let sleepLog = await Sleep.findOneAndUpdate(
      { date },
      { durationHours, quality },
      { new: true, upsert: true }
    );
    res.json(sleepLog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save sleep log' });
  }
});

// --- WORKOUT ROUTES ---
app.get('/api/workouts', async (req, res) => {
  try {
    const date = req.query.date || getTodayDateString();
    const list = await Workout.find({ date });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workouts' });
  }
});

app.post('/api/workouts', async (req, res) => {
  try {
    const date = req.body.date || getTodayDateString();
    const { title, duration, type } = req.body;
    const newWorkout = await Workout.create({ date, title, duration, type, completed: false });
    res.json(newWorkout);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create workout' });
  }
});

app.put('/api/workouts/:id', async (req, res) => {
  try {
    const { completed } = req.body;
    const updated = await Workout.findByIdAndUpdate(
      req.params.id,
      { completed },
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update workout status' });
  }
});

app.delete('/api/workouts/:id', async (req, res) => {
  try {
    await Workout.findByIdAndDelete(req.params.id);
    res.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete workout' });
  }
});

// --- MEALS ROUTES ---
app.get('/api/meals', async (req, res) => {
  try {
    const date = req.query.date || getTodayDateString();
    const list = await Meal.find({ date });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meals' });
  }
});

app.post('/api/meals', async (req, res) => {
  try {
    const date = req.body.date || getTodayDateString();
    const { type, description } = req.body;
    const newMeal = await Meal.create({ date, type, description });
    res.json(newMeal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create meal log' });
  }
});

// --- MOOD ROUTES ---
app.get('/api/mood', async (req, res) => {
  try {
    const date = req.query.date || getTodayDateString();
    let moodLog = await Mood.findOne({ date });
    if (!moodLog) {
      moodLog = await Mood.create({ date, emoji: '🥰', note: '' });
    }
    res.json(moodLog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch mood' });
  }
});

app.post('/api/mood', async (req, res) => {
  try {
    const date = req.body.date || getTodayDateString();
    const { emoji, note } = req.body;
    const moodLog = await Mood.findOneAndUpdate(
      { date },
      { emoji, note },
      { new: true, upsert: true }
    );
    res.json(moodLog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save mood' });
  }
});

// --- PROMISES ROUTES ---
app.get('/api/promises', async (req, res) => {
  try {
    const date = req.query.date || getTodayDateString();
    const list = await Promise.find({ date });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch promises' });
  }
});

app.put('/api/promises/:id', async (req, res) => {
  try {
    const { completed } = req.body;
    const updated = await Promise.findByIdAndUpdate(
      req.params.id,
      { completed },
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update promise completion' });
  }
});

// --- LOVE NOTES ROUTES (Rotating messages) ---
app.get('/api/love-notes', async (req, res) => {
  try {
    // Return all love notes or a rotating daily one
    const count = await LoveNote.countDocuments();
    if (count === 0) {
      return res.json({ text: "You are the absolute love of my life." });
    }
    // Simple deterministic rotation based on the day of the year
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000);
    const index = dayOfYear % count;
    
    const note = await LoveNote.findOne().skip(index);
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch love notes' });
  }
});

// --- WORKOUT LIBRARY & PROGRESS ROUTES ---
app.get('/api/workout-library', async (req, res) => {
  try {
    const { category, difficulty, search, beginnerFriendly, pcosFriendly } = req.query;
    let query = {};
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (beginnerFriendly === 'true') query.beginnerFriendly = true;
    if (pcosFriendly === 'true') query.pcosFriendly = true;
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    
    const list = await WorkoutLibrary.find(query).sort({ order: 1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workouts' });
  }
});

app.get('/api/workout-library/:slug', async (req, res) => {
  try {
    const item = await WorkoutLibrary.findOne({ slug: req.params.slug });
    if (!item) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workout details' });
  }
});

app.post('/api/workout-library', async (req, res) => {
  try {
    const item = await WorkoutLibrary.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create workout' });
  }
});

app.put('/api/workout-library/:id', async (req, res) => {
  try {
    const updated = await WorkoutLibrary.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update workout' });
  }
});

app.delete('/api/workout-library/:id', async (req, res) => {
  try {
    await WorkoutLibrary.findByIdAndDelete(req.params.id);
    res.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete workout' });
  }
});

app.get('/api/workout-progress', async (req, res) => {
  try {
    const logs = await WorkoutProgress.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch progress logs' });
  }
});

app.post('/api/workout-progress', async (req, res) => {
  try {
    const { workoutId, workoutTitle, completedDate, duration, calories, mood, notes } = req.body;
    const log = await WorkoutProgress.create({
      workoutId,
      workoutTitle,
      completedDate,
      duration,
      calories,
      mood,
      notes
    });
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: 'Failed to log workout progress' });
  }
});

// --- NUTRITION & MEAL PLANNING ROUTES ---
app.get('/api/meal-library', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};
    if (category) query.category = category;
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    const list = await MealLibrary.find(query).sort({ order: 1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meals' });
  }
});

app.get('/api/meal-library/:slug', async (req, res) => {
  try {
    const item = await MealLibrary.findOne({ slug: req.params.slug });
    if (!item) {
      return res.status(404).json({ error: 'Meal not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meal details' });
  }
});

app.post('/api/meal-library', async (req, res) => {
  try {
    const item = await MealLibrary.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create meal' });
  }
});

app.put('/api/meal-library/:id', async (req, res) => {
  try {
    const updated = await MealLibrary.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update meal' });
  }
});

app.delete('/api/meal-library/:id', async (req, res) => {
  try {
    await MealLibrary.findByIdAndDelete(req.params.id);
    res.json({ message: 'Meal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete meal' });
  }
});

app.get('/api/meal-progress', async (req, res) => {
  try {
    const logs = await MealProgress.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meal progress' });
  }
});

app.post('/api/meal-progress', async (req, res) => {
  try {
    const { mealId, mealName, mealType, completedDate, calories, protein, notes } = req.body;
    const log = await MealProgress.create({
      mealId,
      mealName,
      mealType,
      completedDate,
      calories,
      protein,
      notes
    });
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: 'Failed to log meal completion' });
  }
});

// --- SLEEP & RELAXATION ROUTES ---
app.get('/api/sleep-logs', async (req, res) => {
  try {
    const logs = await DetailedSleepLog.find().sort({ date: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch detailed sleep logs' });
  }
});

app.post('/api/sleep-logs', async (req, res) => {
  try {
    const {
      date,
      bedtime,
      wakeTime,
      hoursSlept,
      quality,
      stressLevel,
      meditationMinutes,
      breathingCompleted,
      gratitudeJournal,
      dreamTitle,
      dreamDescription,
      dreamMood,
      dreamTags,
      routineCompleted
    } = req.body;

    const log = await DetailedSleepLog.findOneAndUpdate(
      { date },
      {
        date,
        bedtime,
        wakeTime,
        hoursSlept,
        quality,
        stressLevel,
        meditationMinutes,
        breathingCompleted,
        gratitudeJournal,
        dreamTitle,
        dreamDescription,
        dreamMood,
        dreamTags,
        routineCompleted
      },
      { new: true, upsert: true }
    );
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save detailed sleep log' });
  }
});

// --- CYCLE TRACKING & WOMEN'S WELLNESS ROUTES ---
app.get('/api/cycle-logs', async (req, res) => {
  try {
    const logs = await CycleWellnessLog.find().sort({ date: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch detailed cycle logs' });
  }
});

app.post('/api/cycle-logs', async (req, res) => {
  try {
    const {
      date,
      isPeriodDay,
      flow,
      symptoms,
      painLevel,
      painLocation,
      painNotes,
      mood,
      energyLevel,
      journalNotes,
      medications,
      doctorVisit
    } = req.body;

    const log = await CycleWellnessLog.findOneAndUpdate(
      { date },
      {
        date,
        isPeriodDay,
        flow,
        symptoms,
        painLevel,
        painLocation,
        painNotes,
        mood,
        energyLevel,
        journalNotes,
        medications,
        doctorVisit
      },
      { new: true, upsert: true }
    );
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save detailed cycle log' });
  }
});

// --- OUR MEMORIES SCAPBOOK ROUTES ---
app.get('/api/memories', async (req, res) => {
  try {
    const { type, search, favorite, collectionName } = req.query;
    let query = {};
    if (type) query.type = type;
    if (favorite === 'true') query.favorite = true;
    if (collectionName) query.collectionName = collectionName;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const list = await Memory.find(query).sort({ date: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch memories' });
  }
});

app.post('/api/memories', async (req, res) => {
  try {
    const item = await Memory.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create memory' });
  }
});

app.put('/api/memories/:id', async (req, res) => {
  try {
    const updated = await Memory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update memory' });
  }
});

app.delete('/api/memories/:id', async (req, res) => {
  try {
    await Memory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Memory deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete memory' });
  }
});

// --- CAREGIVER PORTAL ROUTES ---

// Helper to get or seed caregiver PIN directly from MongoDB Settings collection
const getCaregiverPinFromDB = async () => {
  try {
    let setting = await Settings.findOne({ key: 'caregiver_pin' });
    if (!setting) {
      const initialPin = String(process.env.CAREGIVER_PIN || '5678').trim();
      setting = await Settings.create({ key: 'caregiver_pin', value: initialPin });
    }
    return String(setting.value).trim();
  } catch (err) {
    console.error('Failed to query PIN from DB, using fallback:', err);
    return String(process.env.CAREGIVER_PIN || '5678').trim();
  }
};

// PIN Verification — queries MongoDB Settings collection (seeds '5678' if empty)
app.post('/api/caregiver/verify-pin', async (req, res) => {
  try {
    const pin = req.body && req.body.pin ? String(req.body.pin).trim() : '';
    const correctPin = await getCaregiverPinFromDB();
    
    if (!pin) {
      return res.status(400).json({ error: 'PIN is required.' });
    }
    
    if (pin === correctPin) {
      return res.json({ success: true });
    }
    
    return res.status(401).json({ success: false, error: 'Incorrect PIN. Access Denied.' });
  } catch (error) {
    console.error('Verify PIN Error:', error);
    return res.status(500).json({ error: 'Failed to verify PIN' });
  }
});

// Update PIN route — updates PIN in MongoDB Settings collection
app.post('/api/caregiver/update-pin', async (req, res) => {
  try {
    const { currentPin, newPin } = req.body || {};
    const correctPin = await getCaregiverPinFromDB();
    if (String(currentPin).trim() !== correctPin) {
      return res.status(401).json({ error: 'Current PIN is incorrect.' });
    }
    if (!newPin || String(newPin).trim().length < 4) {
      return res.status(400).json({ error: 'New PIN must be at least 4 digits.' });
    }
    await Settings.findOneAndUpdate(
      { key: 'caregiver_pin' },
      { value: String(newPin).trim() },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: 'PIN updated successfully in database.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update PIN in database.' });
  }
});

app.get('/api/caregiver/activities', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 14;
    
    // Calculate date strings from 'days' ago to today
    const dateList = [];
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dateList.push(`${year}-${month}-${day}`);
    }

    // Query actual MongoDB documents strictly logged by user
    const workouts = await WorkoutProgress.find({ completedDate: { $in: dateList } }).sort({ createdAt: -1 });
    const detailedSleeps = await DetailedSleepLog.find({ date: { $in: dateList } }).sort({ date: -1 });
    const simpleSleeps = await Sleep.find({ date: { $in: dateList } }).sort({ date: -1 });
    const meals = await MealProgress.find({ completedDate: { $in: dateList } }).sort({ createdAt: -1 });
    const waters = await Water.find({ date: { $in: dateList } }).sort({ date: -1 });
    const cycles = await CycleWellnessLog.find({ date: { $in: dateList } }).sort({ date: -1 });

    let totalSleepDuration = 0;
    let sleepDaysCount = 0;
    let totalWaterCups = 0;
    let waterDaysCount = 0;

    const timeline = dateList.map((date) => {
      // 1. Workouts
      const dayWorkouts = workouts.filter(w => w.completedDate === date).map(w => ({
        workoutTitle: w.workoutTitle || 'Exercise Session',
        duration: w.duration || 0,
        calories: w.calories || 0,
        mood: w.mood || '',
        notes: w.notes || ''
      }));

      // 2. Sleep
      const detailedDoc = detailedSleeps.find(s => s.date === date);
      const simpleDoc = simpleSleeps.find(s => s.date === date);
      let daySleep = null;
      if (detailedDoc) {
        daySleep = {
          bedtime: detailedDoc.bedtime || '',
          wakeTime: detailedDoc.wakeTime || '',
          hoursSlept: detailedDoc.hoursSlept || 0,
          quality: detailedDoc.quality || 'Good',
          gratitudeJournal: detailedDoc.gratitudeJournal || ''
        };
        totalSleepDuration += detailedDoc.hoursSlept || 0;
        sleepDaysCount++;
      } else if (simpleDoc) {
        daySleep = {
          bedtime: '',
          wakeTime: '',
          hoursSlept: simpleDoc.durationHours || 0,
          quality: simpleDoc.quality || 'Good',
          gratitudeJournal: ''
        };
        totalSleepDuration += simpleDoc.durationHours || 0;
        sleepDaysCount++;
      }

      // 3. Meals
      const dayMeals = meals.filter(m => m.completedDate === date);

      // 4. Water
      const waterDoc = waters.find(w => w.date === date);
      let dayWater = null;
      if (waterDoc) {
        dayWater = {
          consumedCups: waterDoc.consumedCups || 0,
          targetCups: waterDoc.targetCups || 8
        };
        totalWaterCups += waterDoc.consumedCups || 0;
        waterDaysCount++;
      }

      // 5. Cycle
      const cycleDoc = cycles.find(c => c.date === date) || null;

      return {
        date,
        workouts: dayWorkouts,
        sleep: daySleep,
        meals: dayMeals,
        water: dayWater,
        cycle: cycleDoc
      };
    });

    const totalWorkoutCount = workouts.length;
    const avgSleep = sleepDaysCount > 0 ? (totalSleepDuration / sleepDaysCount).toFixed(1) : "0.0";
    const avgWater = waterDaysCount > 0 ? (totalWaterCups / waterDaysCount).toFixed(1) : "0.0";

    res.json({
      days,
      stats: {
        avgSleep,
        avgWater,
        totalWorkouts: totalWorkoutCount,
      },
      timeline
    });
  } catch (error) {
    console.error('Failed to fetch caregiver logs:', error);
    res.status(500).json({ error: 'Failed to fetch caregiver activities logs' });
  }
});

// --- USER AUDIT LOG ROUTES ---
app.post('/api/user/audit', async (req, res) => {
  try {
    const { action, category, details } = req.body || {};
    if (!action || !category) {
      return res.status(400).json({ error: 'Action and category are required' });
    }

    // Check for recent duplicate audit log within the past 5 seconds
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const existing = await AuditLog.findOne({
      action: String(action),
      category: String(category),
      timestamp: { $gte: fiveSecondsAgo }
    });

    if (existing) {
      return res.json(existing);
    }

    const log = await AuditLog.create({
      action: String(action),
      category: String(category),
      details: details ? String(details) : ''
    });
    res.status(201).json(log);
  } catch (error) {
    console.error('Audit Log Create Error:', error);
    res.status(500).json({ error: 'Failed to create audit log' });
  }
});

app.get('/api/caregiver/audit', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 60;
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(limit * 2);

    // Filter out rapid duplicate consecutive logs for clean presentation
    const cleanLogs = [];
    const seen = new Set();

    for (const log of logs) {
      const timeKey = `${log.action}-${Math.floor(new Date(log.timestamp).getTime() / 5000)}`;
      if (!seen.has(timeKey)) {
        seen.add(timeKey);
        cleanLogs.push(log);
      }
      if (cleanLogs.length >= limit) break;
    }

    res.json(cleanLogs);
  } catch (error) {
    console.error('Audit Log Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// --- DAILY LOVE LETTERS ROUTES ---

// GET /api/letters - List all letters with filters
app.get('/api/letters', async (req, res) => {
  try {
    const { category, search, mood, favorite, published, deliveryOption, sort } = req.query;
    let filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }
    if (mood && mood !== 'All') {
      filter.mood = mood;
    }
    if (favorite === 'true') {
      filter.favorite = true;
    }
    if (published !== undefined) {
      filter.published = published === 'true';
    }
    if (deliveryOption && deliveryOption !== 'All') {
      filter.deliveryOption = deliveryOption;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subtitle: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOrder = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
    const letters = await LoveLetter.find(filter).sort(sortOrder);
    res.json(letters);
  } catch (error) {
    console.error('Fetch Letters Error:', error);
    res.status(500).json({ error: 'Failed to fetch love letters' });
  }
});

// GET /api/letters/today - Get today's published featured letter strictly from MongoDB
app.get('/api/letters/today', async (req, res) => {
  try {
    const letter = await LoveLetter.findOne({ published: true }).sort({ createdAt: -1 });
    res.json(letter || null);
  } catch (error) {
    console.error('Today Letter Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s letter' });
  }
});

// GET /api/letters/analytics - Admin Metrics Overview
app.get('/api/letters/analytics', async (req, res) => {
  try {
    const totalLetters = await LoveLetter.countDocuments();
    const publishedCount = await LoveLetter.countDocuments({ published: true });
    const readCount = await LoveLetter.countDocuments({ published: true, readStatus: 'Read' });
    const favoritesCount = await LoveLetter.countDocuments({ favorite: true });

    const readRate = publishedCount > 0 ? Math.round((readCount / publishedCount) * 100) : 0;

    // Reactions count breakdown
    const reactions = await LoveLetter.aggregate([
      { $match: { reaction: { $ne: 'None' } } },
      { $group: { _id: '$reaction', count: { $sum: 1 } } }
    ]);
    const reactionsMap = { '❤️': 0, '😊': 0, '🥹': 0, '🌸': 0, '⭐': 0 };
    reactions.forEach(r => {
      if (reactionsMap[r._id] !== undefined) {
        reactionsMap[r._id] = r.count;
      }
    });

    const mostLoved = await LoveLetter.findOne({ favorite: true }).sort({ updatedAt: -1 });

    res.json({
      totalLetters,
      publishedCount,
      readCount,
      readRate,
      favoritesCount,
      reactionsMap,
      mostLoved
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// POST /api/letters - Create Love Letter
app.post('/api/letters', async (req, res) => {
  try {
    const { title, subtitle, content, category, mood, emoji, bgTheme, fontStyle, priority, coverImage, music, video, voiceNote, published, deliveryOption, scheduledAt, recurrence, tags } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const parsedScheduledDate = (scheduledAt && !isNaN(Date.parse(scheduledAt))) ? new Date(scheduledAt) : null;

    const newLetter = await LoveLetter.create({
      title,
      subtitle: subtitle || '',
      content,
      category: category || 'Love Letter',
      mood: mood || 'Romantic',
      emoji: emoji || '❤️',
      bgTheme: bgTheme || 'Rose',
      fontStyle: fontStyle || 'Handwritten',
      priority: priority || 'Normal',
      coverImage: coverImage || '',
      music: music || '',
      video: video || '',
      voiceNote: voiceNote || '',
      published: published !== undefined ? Boolean(published) : true,
      deliveryOption: deliveryOption || 'Immediate',
      scheduledAt: parsedScheduledDate,
      recurrence: recurrence || 'None',
      tags: Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map(t => t.trim()) : [])
    });

    res.status(201).json(newLetter);
  } catch (error) {
    console.error('Create Letter Error:', error);
    res.status(500).json({ error: error.message || 'Failed to create love letter' });
  }
});

// PUT /api/letters/:id - Update Love Letter
app.put('/api/letters/:id', async (req, res) => {
  try {
    const updated = await LoveLetter.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ error: 'Letter not found' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Update Letter Error:', error);
    res.status(500).json({ error: 'Failed to update letter' });
  }
});

// PATCH /api/letters/:id/read - Mark Read
app.patch('/api/letters/:id/read', async (req, res) => {
  try {
    const updated = await LoveLetter.findByIdAndUpdate(
      req.params.id, 
      { readStatus: 'Read', readAt: new Date() }, 
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update read status' });
  }
});

// PATCH /api/letters/:id/reaction - Set Reaction
app.patch('/api/letters/:id/reaction', async (req, res) => {
  try {
    const { reaction } = req.body;
    const updated = await LoveLetter.findByIdAndUpdate(
      req.params.id, 
      { reaction: reaction || 'None' }, 
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update reaction' });
  }
});

// PATCH /api/letters/:id/favorite - Toggle Favorite
app.patch('/api/letters/:id/favorite', async (req, res) => {
  try {
    const letter = await LoveLetter.findById(req.params.id);
    if (!letter) return res.status(404).json({ error: 'Letter not found' });
    letter.favorite = !letter.favorite;
    await letter.save();
    res.json(letter);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

// DELETE /api/letters/:id - Delete Letter
app.delete('/api/letters/:id', async (req, res) => {
  try {
    await LoveLetter.findByIdAndDelete(req.params.id);
    res.json({ message: 'Letter deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete letter' });
  }
});

// --- USER PROFILE & SETTINGS ROUTES ---

// GET /api/settings/profile
app.get('/api/settings/profile', async (req, res) => {
  try {
    let profile = await UserProfile.findOne();
    if (!profile) {
      profile = await UserProfile.create({
        name: 'Sweetheart',
        birthday: '2000-01-01',
        height: 165,
        weight: 58,
        targetWeight: 55,
        waterGoal: 8,
        stepGoal: 10000,
        workoutGoal: 30,
        sleepGoal: 8,
        preferredWakeTime: '07:00',
        preferredBedtime: '22:30',
        favoriteQuote: 'Rest is where tomorrow begins.'
      });
    }
    res.json(profile);
  } catch (error) {
    console.error('Fetch Profile Settings Error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile settings' });
  }
});

// --- CAREGIVER PORTAL ENDPOINTS ---

// POST /api/caregiver/verify-pin
app.post('/api/caregiver/verify-pin', async (req, res) => {
  try {
    const { pin } = req.body || {};
    if (pin === '1234' || pin === '5201314') {
      return res.json({ success: true, message: 'PIN Verified' });
    }
    return res.status(401).json({ success: false, error: 'Incorrect Passcode. Access Denied.' });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

// PUT /api/settings/profile
app.put('/api/settings/profile', async (req, res) => {
  try {
    let profile = await UserProfile.findOne();
    if (profile) {
      Object.assign(profile, req.body);
      await profile.save();
    } else {
      profile = await UserProfile.create(req.body);
    }
    res.json(profile);
  } catch (error) {
    console.error('Update Profile Settings Error:', error);
    res.status(500).json({ error: 'Failed to update profile settings' });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
