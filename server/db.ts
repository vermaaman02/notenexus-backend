
import mongoose from 'mongoose';
// dotenv/config not needed for Azure, use portal env vars

// Check if we're using memory storage
const useMemoryStorage = process.env['USE_MEMORY_STORAGE'] === 'true';

if (!useMemoryStorage && !process.env['MONGODB_URI']) {
  throw new Error(
    "MONGODB_URI must be set unless using memory storage. Please set up your database connection string or set USE_MEMORY_STORAGE=true."
  );
}

// Database connection with optimized settings
export async function connectToDatabase() {
  // Skip database connection if using memory storage
  if (useMemoryStorage) {
    console.log('🧠 Using in-memory storage for development');
    return Promise.resolve(mongoose.connection);
  }

  const uri = process.env['MONGODB_URI'] as string;

  mongoose.connect(uri, {
    ssl: true,
    retryWrites: false,
    tlsAllowInvalidCertificates: true, // Only for local development
  })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

  return mongoose.connection;
}

// Graceful connection handling
mongoose.connection.on('connected', () => {
  console.log('📦 Mongoose connected to database');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('📦 Mongoose disconnected from database');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('📦 Mongoose connection closed through app termination');
  process.exit(0);
});

export { mongoose };