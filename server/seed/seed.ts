import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedAdmin } from './seedAdmin';
import { seedMembers } from './seedMembers';

dotenv.config();

async function seedAll() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in server/.env');
    }

    console.log(`[Seed All] Connecting to MongoDB: ${mongoUri.replace(/:([^@]+)@/, ':****@')}`);
    await mongoose.connect(mongoUri);

    console.log(`\n========================================`);
    console.log(`[1/2] Seeding Administrator Account`);
    console.log(`========================================`);
    await seedAdmin({ disconnectOnComplete: false });

    console.log(`\n========================================`);
    console.log(`[2/2] Seeding Members & Renewals`);
    console.log(`========================================`);
    await seedMembers({ disconnectOnComplete: false });

    await mongoose.disconnect();
    console.log(`\n[Seed All] Complete database seed finished successfully.`);
    process.exit(0);
  } catch (error) {
    console.error('[Seed All] Error during master seed process:', error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

seedAll();
