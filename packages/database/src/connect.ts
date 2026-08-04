import mongoose from 'mongoose';

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('MONGODB_URI is not defined in environment variables. Falling back to local database.');
    return 'mongodb://localhost:27017/moazbackend';
  }
  return uri;
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = global as typeof globalThis & { mongoose?: MongooseCache };

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = { conn: null, promise: null };
}

const cached = globalWithMongoose.mongoose;

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function connectToDatabase() {
  if (cached.conn && isDatabaseConnected()) {
    return cached.conn;
  }

  if (cached.conn && !isDatabaseConnected()) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    const finalUri = getMongoUri();
    const maskedUri = finalUri.replace(/:([^:@]+)@/, ':****@');
    console.log(`Connecting to MongoDB at: ${maskedUri}`);

    cached.promise = mongoose.connect(finalUri, opts).then((conn) => {
      console.log('Successfully connected to MongoDB');
      cached.conn = conn;
      return conn;
    }).catch((err) => {
      cached.promise = null;
      cached.conn = null;
      console.error('Failed to connect to MongoDB:', err.message);
      console.warn('--- IMPORTANT ---');
      console.warn('MongoDB is not running. The application will not be able to save data.');
      console.warn('Please install MongoDB or use a cloud database (MongoDB Atlas).');
      console.warn('-----------------');
      throw err;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectToDatabase;
