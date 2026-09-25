import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { Admin } from '../models/Admin';

dotenv.config();

export async function seedAdmin(options: { disconnectOnComplete?: boolean } = {}) {
  const { disconnectOnComplete = true } = options;
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in server/.env');
    }

    if (mongoose.connection.readyState === 0) {
      console.log(`[Seed Admin] Connecting to MongoDB: ${mongoUri.replace(/:([^@]+)@/, ':****@')}`);
      await mongoose.connect(mongoUri);
    }

    // Seed administrator account strictly from environment variables
    const adminUsername = process.env.ADMIN_USERNAME?.toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      throw new Error(
        'ADMIN_USERNAME and ADMIN_PASSWORD must both be defined in your .env file to seed the admin account.'
      );
    }

    const existingAdmin = await Admin.findOne({ username: adminUsername });
    if (!existingAdmin) {
      console.log(`[Seed Admin] Creating administrator account from .env: ${adminUsername}`);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(adminPassword, salt);
      await Admin.create({
        username: adminUsername,
        passwordHash,
        passwordChangedAt: new Date(),
      });
      console.log(`[Seed Admin] Administrator account created successfully.`);
    } else {
      console.log(`[Seed Admin] Existing administrator account verified: ${adminUsername}`);
    }

    if (disconnectOnComplete) {
      await mongoose.disconnect();
    }
  } catch (error) {
    console.error('[Seed Admin] Error seeding administrator:', error);
    if (disconnectOnComplete) {
      process.exit(1);
    }
    throw error;
  }
}

// Auto-run if executed directly via CLI
if (require.main === module) {
  seedAdmin({ disconnectOnComplete: true })
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
