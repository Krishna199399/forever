import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/forever-us';
    const conn = await mongoose.connect(connUri);
    console.log(`💖 MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
};
