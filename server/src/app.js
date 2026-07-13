import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import { Water, Sleep, Workout, Meal, Mood, Promise, LoveNote, WorkoutLibrary, WorkoutProgress, MealLibrary, MealProgress, DetailedSleepLog, CycleWellnessLog, Memory, AuditLog, Settings } from './models/index.js';

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

    // Fetch progress from each domain database sequentially to avoid Promise shadow collisions
    const workouts = await WorkoutProgress.find({ completedDate: { $in: dateList } }).sort({ createdAt: -1 });
    const sleeps = await DetailedSleepLog.find({ date: { $in: dateList } }).sort({ date: -1 });
    const meals = await MealProgress.find({ completedDate: { $in: dateList } }).sort({ createdAt: -1 });
    const waters = await Water.find({ date: { $in: dateList } }).sort({ date: -1 });
    const cycles = await CycleWellnessLog.find({ date: { $in: dateList } }).sort({ date: -1 });

    // Aggregate compliance stats
    let totalSleepDuration = 0;
    let sleepDaysCount = 0;
    let totalWaterCups = 0;
    let waterDaysCount = 0;

    const timeline = dateList.map((date) => {
      const dayWorkouts = workouts.filter(w => w.completedDate === date);
      const daySleep = sleeps.find(s => s.date === date) || null;
      const dayMeals = meals.filter(m => m.completedDate === date);
      const dayWater = waters.find(w => w.date === date) || null;
      const dayCycle = cycles.find(c => c.date === date) || null;

      if (daySleep) {
        totalSleepDuration += daySleep.hoursSlept;
        sleepDaysCount++;
      }
      if (dayWater) {
        totalWaterCups += dayWater.consumedCups;
        waterDaysCount++;
      }

      return {
        date,
        workouts: dayWorkouts,
        sleep: daySleep,
        meals: dayMeals,
        water: dayWater,
        cycle: dayCycle
      };
    });

    res.json({
      days,
      stats: {
        avgSleep: sleepDaysCount > 0 ? (totalSleepDuration / sleepDaysCount).toFixed(1) : "8.0",
        avgWater: waterDaysCount > 0 ? (totalWaterCups / waterDaysCount).toFixed(1) : "0.0",
        totalWorkouts: workouts.length,
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
    const limit = parseInt(req.query.limit) || 50;
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(limit);
    res.json(logs);
  } catch (error) {
    console.error('Audit Log Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
