import mongoose from 'mongoose';

// Water Schema
const WaterSchema = new mongoose.Schema({
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  consumedCups: { type: Number, default: 0 },
  targetCups: { type: Number, default: 8 }
}, { timestamps: true });

// Sleep Schema
const SleepSchema = new mongoose.Schema({
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  durationHours: { type: Number, default: 8 },
  quality: { type: String, enum: ['Restless', 'Good', 'Deep'], default: 'Good' }
}, { timestamps: true });

// Workout Schema
const WorkoutSchema = new mongoose.Schema({
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  title: { type: String, required: true },
  duration: { type: String, default: '15 mins' },
  type: { type: String, default: 'Yoga' },
  completed: { type: Boolean, default: false }
}, { timestamps: true });

// Meal Schema
const MealSchema = new mongoose.Schema({
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  type: { type: String, enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'], required: true },
  description: { type: String, required: true }
}, { timestamps: true });

// Mood Schema
const MoodSchema = new mongoose.Schema({
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  emoji: { type: String, default: '🥰' },
  note: { type: String, default: '' }
}, { timestamps: true });

// Promise Schema
const PromiseSchema = new mongoose.Schema({
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  text: { type: String, required: true },
  completed: { type: Boolean, default: false }
}, { timestamps: true });

// Love Note Schema
const LoveNoteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  category: { type: String, default: 'Affirmation' },
  usedAt: { type: Date, default: null } // Track when it was shown
}, { timestamps: true });

export const Water = mongoose.model('Water', WaterSchema);
export const Sleep = mongoose.model('Sleep', SleepSchema);
export const Workout = mongoose.model('Workout', WorkoutSchema);
export const Meal = mongoose.model('Meal', MealSchema);
export const Mood = mongoose.model('Mood', MoodSchema);
export const Promise = mongoose.model('Promise', PromiseSchema);
export const LoveNote = mongoose.model('LoveNote', LoveNoteSchema);

// Workout Library Schema
const WorkoutLibrarySchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  duration: { type: Number, required: true }, // in minutes
  calories: { type: Number, required: true },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  equipment: { type: String, default: 'None' },
  images: [{ type: String }],
  video: { type: String },
  benefits: [{ type: String }],
  instructions: [{ type: String }],
  safetyTips: [{ type: String }],
  commonMistakes: [{ type: String }],
  targetMuscles: [{ type: String }],
  published: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  beginnerFriendly: { type: Boolean, default: true },
  pcosFriendly: { type: Boolean, default: true }
}, { timestamps: true });

// Workout Progress Schema
const WorkoutProgressSchema = new mongoose.Schema({
  workoutId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutLibrary' },
  workoutTitle: { type: String },
  completedDate: { type: String, required: true }, // Format: YYYY-MM-DD
  duration: { type: Number },
  calories: { type: Number },
  mood: { type: String },
  notes: { type: String }
}, { timestamps: true });

export const WorkoutLibrary = mongoose.model('WorkoutLibrary', WorkoutLibrarySchema);
export const WorkoutProgress = mongoose.model('WorkoutProgress', WorkoutProgressSchema);

// Meal Library Schema
const MealLibrarySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  image: { type: String },
  gallery: [{ type: String }],
  ingredients: [{ type: String }],
  recipe: { type: String },
  preparationSteps: [{ type: String }],
  prepTime: { type: Number, default: 15 },
  cookTime: { type: Number, default: 15 },
  servingSize: { type: String, default: "1 serving" },
  calories: { type: Number, default: 0 },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
  fiber: { type: Number, default: 0 },
  micronutrients: [{ type: String }],
  benefits: [{ type: String }],
  alternativeIngredients: [{ type: String }],
  featured: { type: Boolean, default: false },
  published: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

// Meal Progress Schema
const MealProgressSchema = new mongoose.Schema({
  mealId: { type: mongoose.Schema.Types.ObjectId, ref: 'MealLibrary' },
  mealName: { type: String },
  mealType: { type: String, enum: ['Breakfast', 'Morning Snack', 'Lunch', 'Evening Snack', 'Dinner'], required: true },
  completedDate: { type: String, required: true }, // Format: YYYY-MM-DD
  calories: { type: Number },
  protein: { type: Number },
  notes: { type: String }
}, { timestamps: true });

export const MealLibrary = mongoose.model('MealLibrary', MealLibrarySchema);
export const MealProgress = mongoose.model('MealProgress', MealProgressSchema);

// Detailed Sleep Log Schema
const DetailedSleepLogSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // Format: YYYY-MM-DD
  bedtime: { type: String, default: "22:00" },
  wakeTime: { type: String, default: "07:00" },
  hoursSlept: { type: Number, default: 8 },
  quality: { type: String, enum: ['Restless', 'Good', 'Deep'], default: 'Good' },
  stressLevel: { type: String, default: 'Normal' },
  meditationMinutes: { type: Number, default: 0 },
  breathingCompleted: { type: Boolean, default: false },
  gratitudeJournal: { type: String, default: "" },
  dreamTitle: { type: String, default: "" },
  dreamDescription: { type: String, default: "" },
  dreamMood: { type: String, default: "" },
  dreamTags: [{ type: String }],
  routineCompleted: { type: Boolean, default: false }
}, { timestamps: true });

export const DetailedSleepLog = mongoose.model('DetailedSleepLog', DetailedSleepLogSchema);

// Cycle Wellness Log Schema
const CycleWellnessLogSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // Format: YYYY-MM-DD
  isPeriodDay: { type: Boolean, default: false },
  flow: { type: String, enum: ['Light', 'Medium', 'Heavy', 'Spotting', 'None'], default: 'None' },
  symptoms: [{ type: String }],
  painLevel: { type: Number, default: 0 },
  painLocation: { type: String, default: 'None' },
  painNotes: { type: String, default: '' },
  mood: { type: String, default: 'Calm' },
  energyLevel: { type: String, default: 'Normal' },
  journalNotes: { type: String, default: '' },
  medications: [{
    name: { type: String },
    dose: { type: String },
    time: { type: String },
    taken: { type: Boolean, default: false }
  }],
  doctorVisit: {
    doctorName: { type: String, default: '' },
    appointmentDate: { type: String, default: '' },
    questions: { type: String, default: '' },
    recommendations: { type: String, default: '' }
  }
}, { timestamps: true });

export const CycleWellnessLog = mongoose.model('CycleWellnessLog', CycleWellnessLogSchema);

// Memory Schema
const MemorySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  type: { type: String, enum: ['Photo', 'Video', 'Letter', 'Journal', 'Voice'], default: 'Photo' },
  photos: [{ type: String }],
  videos: [{ type: String }],
  voiceNotes: [{ type: String }],
  location: { type: String, default: '' },
  mood: { type: String, default: 'Calm' },
  tags: [{ type: String }],
  favorite: { type: Boolean, default: false },
  collectionName: { type: String, default: 'Daily Life' },
  journalEntry: { type: String, default: '' },
  letter: {
    title: { type: String, default: '' },
    content: { type: String, default: '' },
    category: { type: String, default: 'Random Notes' }
  }
}, { timestamps: true });

export const Memory = mongoose.model('Memory', MemorySchema);

// Audit Log Schema
const AuditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  category: { type: String, required: true }, // 'Navigation', 'Workout', 'Input'
  details: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

// Settings Schema (for system config like Caregiver PIN in MongoDB)
const SettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true }
}, { timestamps: true });

export const Settings = mongoose.model('Settings', SettingsSchema);

