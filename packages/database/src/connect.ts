import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn('MONGODB_URI is not defined in environment variables. Falling back to local database.');
}

const finalUri = MONGODB_URI || 'mongodb://localhost:27017/moazbackend';

let cached = (global as typeof globalThis & { mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } }).mongoose;

if (!cached) {
  cached = (global as typeof globalThis & { mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } }).mongoose = {
    conn: null,
    promise: null,
  };
}

export async function connectToDatabase() {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    const maskedUri = finalUri.replace(/:([^:@]+)@/, ':****@');
    console.log(`Connecting to MongoDB at: ${maskedUri}`);

    cached!.promise = mongoose.connect(finalUri, opts).then((conn) => {
      console.log('Successfully connected to MongoDB');
      return conn;
    }).catch((err) => {
      console.error('Failed to connect to MongoDB:', err.message);
      console.warn('--- IMPORTANT ---');
      console.warn('MongoDB is not running. The application will not be able to save data.');
      console.warn('Please install MongoDB or use a cloud database (MongoDB Atlas).');
      console.warn('-----------------');
      return mongoose;
    });
  }

  cached!.conn = await cached!.promise;
  return cached!.conn;
}

export default connectToDatabase;
