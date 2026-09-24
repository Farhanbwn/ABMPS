import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { Admin } from '../models/Admin';
import { Member } from '../models/Member';
import { MembershipRenewal } from '../models/MembershipRenewal';

dotenv.config();

interface RawMemberItem {
  serialNo: number;
  nameBengali: string;
  nameEnglish?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  mobileNo?: string | number | null;
  gender?: string | null;
  joinYear?: number | null;
  membershipStatus?: 'Active' | 'Inactive' | string;
  activeBillId?: string | null;
}

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in server/.env');
    }

    console.log(`[Seed] Connecting to MongoDB: ${mongoUri.replace(/:([^@]+)@/, ':****@')}`);
    await mongoose.connect(mongoUri);

    // 1. Seed/Update Admin from .env
    const adminUsername = (process.env.ADMIN_USERNAME || 'admin@abmps.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@9232';

    console.log(`[Seed] Configuring Admin account for '${adminUsername}'...`);
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const existingAdmin = await Admin.findOne({ username: adminUsername });
    if (existingAdmin) {
      existingAdmin.passwordHash = passwordHash;
      await existingAdmin.save();
      console.log(`[Seed] Updated existing admin password for: ${adminUsername}`);
    } else {
      await Admin.create({
        username: adminUsername,
        passwordHash,
      });
      console.log(`[Seed] Created new admin user: ${adminUsername}`);
    }

    // 2. Read member_management_members.json
    const possiblePaths = [
      path.resolve(__dirname, '../../member_management_members.json'),
      path.resolve(__dirname, '../member_management_members.json'),
      'C:\\Users\\farha\\Desktop\\MMS\\member_management_members.json',
    ];

    let jsonFilePath = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        jsonFilePath = p;
        break;
      }
    }

    if (!jsonFilePath) {
      throw new Error(`member_management_members.json not found in paths: ${possiblePaths.join(', ')}`);
    }

    console.log(`[Seed] Loading members from: ${jsonFilePath}`);
    const fileContent = fs.readFileSync(jsonFilePath, 'utf-8');
    const parsedData = JSON.parse(fileContent);
    const rawMembers: RawMemberItem[] = parsedData.members || parsedData;

    console.log(`[Seed] Found ${rawMembers.length} member records in JSON. Cleaning collections...`);

    // Clean existing data for clean import
    await Member.deleteMany({});
    await MembershipRenewal.deleteMany({});

    const currentYear = new Date().getFullYear();
    let membersInserted = 0;
    let renewalsCreated = 0;

    for (const raw of rawMembers) {
      if (!raw.serialNo || !raw.nameBengali) {
        console.warn(`[Seed] Skipping record missing serialNo or nameBengali:`, raw);
        continue;
      }

      // Parse and sanitize fields
      const serialNo = Number(raw.serialNo);
      const nameBengali = String(raw.nameBengali).trim();
      const nameEnglish = raw.nameEnglish ? String(raw.nameEnglish).trim() : '';

      let dateOfBirth: Date | null = null;
      if (raw.dateOfBirth) {
        const parsedDate = new Date(raw.dateOfBirth);
        if (!isNaN(parsedDate.getTime())) {
          dateOfBirth = parsedDate;
        }
      }

      const address = raw.address ? String(raw.address).trim() : '';
      const mobileNo = raw.mobileNo ? String(raw.mobileNo).trim() : '';

      let gender: 'Male' | 'Female' | 'Other' | null = null;
      if (raw.gender === 'Male' || raw.gender === 'Female' || raw.gender === 'Other') {
        gender = raw.gender;
      }

      let joinYear: number | null = null;
      if (raw.joinYear) {
        const y = Number(raw.joinYear);
        if (!isNaN(y) && y >= 1950 && y <= currentYear + 1) {
          joinYear = y;
        }
      }

      const membershipStatus = raw.membershipStatus === 'Inactive' ? 'Inactive' : 'Active';
      const activeBillId = raw.activeBillId ? String(raw.activeBillId).trim() : (membershipStatus === 'Active' ? `BILL-${currentYear}-${serialNo}` : null);

      const member = await Member.create({
        serialNo,
        nameBengali,
        nameEnglish,
        dateOfBirth,
        address,
        mobileNo,
        gender,
        joinYear,
        membershipStatus,
        activeBillId,
        isDeleted: false,
        deletedAt: null,
      });

      membersInserted++;

      // Create renewal records
      // If joinYear is available, create annual renewals from joinYear up to currentYear (or prior if inactive)
      if (joinYear) {
        const endYear = membershipStatus === 'Active' ? currentYear : currentYear - 1;
        for (let y = joinYear; y <= endYear; y++) {
          const billId = y === currentYear && activeBillId ? activeBillId : `BILL-${y}-${serialNo}`;
          const renewalDate = new Date(y, 0, Math.floor(Math.random() * 20) + 5);

          await MembershipRenewal.create({
            memberId: member._id,
            serialNo: member.serialNo,
            membershipYear: y,
            billId,
            renewalDate,
            status: 'Active',
            notes: y === joinYear ? 'Initial membership join' : `Annual renewal for ${y}`,
          });
          renewalsCreated++;
        }
      } else if (membershipStatus === 'Active' && activeBillId) {
        // If no explicit joinYear, create a current renewal record for the active bill ID
        await MembershipRenewal.create({
          memberId: member._id,
          serialNo: member.serialNo,
          membershipYear: currentYear,
          billId: activeBillId,
          renewalDate: new Date(),
          status: 'Active',
          notes: `Membership registration for ${currentYear}`,
        });
        renewalsCreated++;
      }
    }

    const finalMemberCount = await Member.countDocuments();
    const finalRenewalCount = await MembershipRenewal.countDocuments();
    const finalAdminCount = await Admin.countDocuments();

    console.log(`\n========================================`);
    console.log(`[Seed] SUCCESSFUL SEED EXECUTION`);
    console.log(`========================================`);
    console.log(`  - Admin User: ${adminUsername}`);
    console.log(`  - Admins in DB: ${finalAdminCount}`);
    console.log(`  - Members Seeded: ${finalMemberCount} (from member_management_members.json)`);
    console.log(`  - Renewal Records Created: ${finalRenewalCount}`);
    console.log(`========================================\n`);

    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    process.exit(1);
  }
}

seed();
