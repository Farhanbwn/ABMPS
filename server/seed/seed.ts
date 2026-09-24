import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
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
  gender?: 'Male' | 'Female' | 'Other' | null;
  joinYear?: number | null;
  membershipStatus?: 'Active' | 'Inactive' | string;
  activeBillId?: string | null;
}

interface RawRenewalItem {
  memberId?: string;
  serialNo: number;
  membershipYear: number;
  billId?: string | null;
  renewalDate?: string | Date | null;
  status?: 'Active' | 'Pending' | 'Cancelled';
  notes?: string;
}

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in server/.env');
    }

    console.log(`[Seed] Connecting to MongoDB: ${mongoUri.replace(/:([^@]+)@/, ':****@')}`);
    await mongoose.connect(mongoUri);

    // Seed administrator account if not present
    const adminUsername = (process.env.ADMIN_USERNAME || 'admin').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin12345';

    let existingAdmin = await Admin.findOne({ username: adminUsername });
    if (!existingAdmin) {
      console.log(`[Seed] Creating initial administrator account: ${adminUsername}`);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(adminPassword, salt);
      await Admin.create({
        username: adminUsername,
        passwordHash,
        passwordChangedAt: new Date(),
      });
      console.log(`[Seed] Administrator account created successfully.`);
    } else {
      console.log(`[Seed] Existing administrator account verified: ${adminUsername}`);
    }

    // Resolve member_management_members.json dynamically relative to project root
    const jsonFilePath = process.env.MEMBERS_JSON_PATH
      ? path.resolve(process.env.MEMBERS_JSON_PATH)
      : path.resolve(__dirname, '../../member_management_members.json');

    if (!fs.existsSync(jsonFilePath)) {
      throw new Error(`member_management_members.json not found at: ${jsonFilePath}`);
    }

    console.log(`[Seed] Loading members exclusively from: ${jsonFilePath}`);
    const fileContent = fs.readFileSync(jsonFilePath, 'utf-8');
    const parsedData = JSON.parse(fileContent);
    const rawMembers: RawMemberItem[] = parsedData.members || parsedData;
    const rawRenewals: RawRenewalItem[] = parsedData.membershipRenewals || [];

    console.log(`[Seed] Found ${rawMembers.length} member records in JSON. Resetting member collections...`);

    // Clean existing member & renewal collections
    await Member.deleteMany({});
    await MembershipRenewal.deleteMany({});

    // Filter and sanitize member records from the file
    const validMemberDocs = rawMembers
      .filter((raw) => raw.serialNo && raw.nameBengali)
      .map((raw) => {
        let dateOfBirth: Date | null = null;
        if (raw.dateOfBirth) {
          const parsedDate = new Date(raw.dateOfBirth);
          if (!isNaN(parsedDate.getTime())) {
            dateOfBirth = parsedDate;
          }
        }

        let gender: 'Male' | 'Female' | 'Other' | null = null;
        if (raw.gender === 'Male' || raw.gender === 'Female' || raw.gender === 'Other') {
          gender = raw.gender;
        }

        const joinYear = raw.joinYear ? Number(raw.joinYear) : null;
        const membershipStatus = raw.membershipStatus === 'Inactive' ? 'Inactive' : 'Active';
        const activeBillId = raw.activeBillId ? String(raw.activeBillId).trim() : null;

        return {
          serialNo: Number(raw.serialNo),
          nameBengali: String(raw.nameBengali).trim(),
          nameEnglish: raw.nameEnglish ? String(raw.nameEnglish).trim() : '',
          dateOfBirth,
          address: raw.address ? String(raw.address).trim() : '',
          mobileNo: raw.mobileNo ? String(raw.mobileNo).trim() : '',
          gender,
          joinYear,
          membershipStatus,
          activeBillId,
          isDeleted: false,
          deletedAt: null,
        };
      });

    // Bulk insert members
    const insertedMembers = await Member.insertMany(validMemberDocs);
    console.log(`[Seed] Successfully inserted ${insertedMembers.length} members.`);

    // If membership renewals are provided in the JSON file, seed them
    let renewalsInserted = 0;
    if (Array.isArray(rawRenewals) && rawRenewals.length > 0) {
      const serialToMemberMap = new Map<number, mongoose.Types.ObjectId>();
      for (const m of insertedMembers) {
        serialToMemberMap.set(m.serialNo, m._id as mongoose.Types.ObjectId);
      }

      const validRenewalDocs = rawRenewals
        .filter((r) => r.serialNo && r.membershipYear)
        .map((r) => {
          const memberId = r.memberId || serialToMemberMap.get(Number(r.serialNo));
          if (!memberId) return null;

          return {
            memberId,
            serialNo: Number(r.serialNo),
            membershipYear: Number(r.membershipYear),
            billId: r.billId ? String(r.billId).trim() : `BILL-${r.membershipYear}-${r.serialNo}`,
            renewalDate: r.renewalDate ? new Date(r.renewalDate) : new Date(),
            status: r.status || 'Active',
            notes: r.notes || '',
          };
        })
        .filter(Boolean);

      if (validRenewalDocs.length > 0) {
        await MembershipRenewal.insertMany(validRenewalDocs);
        renewalsInserted = validRenewalDocs.length;
        console.log(`[Seed] Successfully inserted ${renewalsInserted} renewal records.`);
      }
    }

    const finalMemberCount = await Member.countDocuments();
    const finalRenewalCount = await MembershipRenewal.countDocuments();

    console.log(`\n========================================`);
    console.log(`[Seed] SUCCESSFUL SEED EXECUTION`);
    console.log(`========================================`);
    console.log(`  - Target File: ${jsonFilePath}`);
    console.log(`  - Members Seeded: ${finalMemberCount}`);
    console.log(`  - Renewal Records: ${finalRenewalCount}`);
    console.log(`========================================\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    process.exit(1);
  }
}

seed();
