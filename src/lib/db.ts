/* eslint-disable no-console */
import mongoose from 'mongoose';
import { config } from '../utils/config';

declare global {
  var mongooseCache:
    | {
        conn: mongoose.Connection | null;
        promise: Promise<mongoose.Mongoose> | null;
      }
    | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

const connectDB = async () => {
  const MONGODB_URI = config.MONGODB_URI;

  // If a connection already exists, return it (cached)
  if (cached?.conn) {
    console.log('[database]: Using existing cached connection');
    return cached.conn;
  }

  if (!cached?.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    console.log('[database]: Creating new connection...');
    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log(`[database]: MongoDB Connected: ${mongoose.connection.host}`);
      return mongoose;
    });
  }

  try {
    const mongooseInstance = await cached!.promise;
    cached!.conn = mongooseInstance.connection;

    // Run database category & health goal auto-migrations
    try {
      const Product = mongooseInstance.models.Product || mongooseInstance.model('Product');
      if (Product) {
        const rawProducts = await Product.collection.find({}).toArray();
        let migratedCount = 0;
        for (const raw of rawProducts) {
          let updatedCategory = null;
          if (['vitamins', 'supplements', 'wellness'].includes(raw.category)) {
            updatedCategory = 'nutrients';
          } else if (raw.category === 'cosmetics' && raw.subcategory) {
            updatedCategory = raw.subcategory;
          } else if (
            raw.category === 'nutrients' &&
            raw.subcategory &&
            raw.subcategory !== 'nutrients'
          ) {
            updatedCategory = 'nutrients';
          }

          if (updatedCategory) {
            await Product.collection.updateOne(
              { _id: raw._id },
              { $set: { category: updatedCategory } }
            );
            migratedCount++;
          }
        }
        if (migratedCount > 0) {
          console.log(`[database]: Auto-migrated category for ${migratedCount} products.`);
        }

        // Map health goals
        const mappings = [
          { old: 'Immunity Boost', new: 'Immunity Support' },
          { old: 'Energy Support', new: 'Energy & Vitality' },
          { old: 'Daily Wellness', new: 'Hydration & Electrolytes' },
          { old: 'Bone & Joint', new: 'Bone & Joints Health' },
          { old: 'Muscle Building', new: 'Fitness & Sports Nutrition' },
          { old: 'Weight Management', new: 'Beauty & Weight Loss' },
          { old: 'Heart Health', new: 'Energy & Vitality' },
          { old: 'Digestive Health', new: 'Digestive & Gut Health' },
          { old: 'Sleep Support', new: 'Relaxation & Sleep' },
          { old: 'Stress Relief', new: 'Relaxation & Sleep' },
          { old: 'Relaxation & Calm', new: 'Relaxation & Sleep' },
        ];

        let migratedGoalsCount = 0;
        for (const mapping of mappings) {
          const updateGoalRes = await Product.updateMany(
            { category: 'nutrients', healthGoal: mapping.old },
            { $set: { healthGoal: mapping.new } }
          );
          migratedGoalsCount += updateGoalRes.modifiedCount;
        }
        if (migratedGoalsCount > 0) {
          console.log(`[database]: Auto-migrated health goals for ${migratedGoalsCount} products.`);
        }
      }
    } catch (migrationError) {
      console.error('[database]: Connection migration runner failed:', migrationError);
    }
  } catch (error) {
    cached!.promise = null; // Reset promise so we can attempt to connect again later
    console.error('[database]: Connection error:', error);
    throw error;
  }

  return cached!.conn;
};

// Event listeners for robust error handling during the connection's lifecycle
mongoose.connection.on('disconnected', () => {
  console.warn('[database]: MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('[database]: MongoDB connection error:', err);
});

export { connectDB };
