import mongoose from 'mongoose';
import { MembershipRenewal, IMembershipRenewal } from '../models/MembershipRenewal';
import { Member } from '../models/Member';
import { AppError } from '../middleware/errorHandler';
import { escapeRegex } from '../utils/regex';

export interface RenewalInput {
  memberId: string;
  membershipYear: number;
  billId: string;
  renewalDate?: Date | string;
  status?: 'Active' | 'Inactive';
  notes?: string;
}

export class RenewalService {
  /**
   * Renew a membership safely
   */
  static async createRenewal(data: RenewalInput) {
    if (!mongoose.Types.ObjectId.isValid(data.memberId)) {
      throw new AppError('Invalid Member ID format', 400);
    }
    const member = await Member.findOne({ _id: data.memberId, isDeleted: false });
    if (!member) {
      throw new AppError('Member not found or has been deleted.', 404);
    }

    const year = Number(data.membershipYear);
    if (!year || isNaN(year) || year < 1900 || year > 2100) {
      throw new AppError('Please provide a valid membership renewal year.', 400);
    }

    if (!data.billId || !data.billId.trim()) {
      throw new AppError('Bill ID is required for renewal.', 400);
    }

    // Check duplicate renewal for same member and membership year
    const existingRenewal = await MembershipRenewal.findOne({
      memberId: member._id,
      membershipYear: year,
    });

    if (existingRenewal) {
      throw new AppError(
        `Renewal for Member #${member.serialNo} (${member.nameEnglish}) for year ${year} already exists with Bill ID: ${existingRenewal.billId}. Duplicate renewal is prevented.`,
        409
      );
    }

    const renewalStatus = data.status || 'Active';
    const renewalDate = data.renewalDate ? new Date(data.renewalDate) : new Date();

    // Try transaction if supported by MongoDB deployment
    let session: mongoose.ClientSession | null = null;
    let supportsTransactions = false;

    try {
      session = await mongoose.startSession();
      // Test if replica set is available for transactions
      session.startTransaction();
      supportsTransactions = true;
    } catch (e) {
      supportsTransactions = false;
      if (session) {
        await session.endSession();
        session = null;
      }
    }

    if (supportsTransactions && session) {
      try {
        const [renewal] = await MembershipRenewal.create(
          [
            {
              memberId: member._id,
              serialNo: member.serialNo,
              membershipYear: year,
              billId: data.billId.trim(),
              renewalDate,
              status: renewalStatus,
              notes: data.notes?.trim() || '',
            },
          ],
          { session }
        );

        // Update member active status and active bill ID
        await Member.findByIdAndUpdate(
          member._id,
          {
            membershipStatus: renewalStatus,
            activeBillId: data.billId.trim(),
          },
          { session }
        );

        await session.commitTransaction();
        await session.endSession();
        return renewal;
      } catch (err) {
        await session.abortTransaction();
        await session.endSession();
        throw err;
      }
    } else {
      // Non-transactional fallback for standalone MongoDB instances
      const renewal = await MembershipRenewal.create({
        memberId: member._id,
        serialNo: member.serialNo,
        membershipYear: year,
        billId: data.billId.trim(),
        renewalDate,
        status: renewalStatus,
        notes: data.notes?.trim() || '',
      });

      await Member.findByIdAndUpdate(member._id, {
        membershipStatus: renewalStatus,
        activeBillId: data.billId.trim(),
      });

      return renewal;
    }
  }

  /**
   * Get all renewals for a specific member
   */
  static async getRenewalsByMember(memberId: string) {
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      throw new AppError('Invalid Member ID format', 400);
    }
    return MembershipRenewal.find({ memberId }).sort({ membershipYear: -1, renewalDate: -1 }).lean();
  }

  /**
   * Get renewals by year
   */
  static async getRenewalsByYear(year: number) {
    return MembershipRenewal.find({ membershipYear: year })
      .populate('memberId', 'nameEnglish nameBengali mobileNo membershipStatus')
      .sort({ serialNo: 1 })
      .lean();
  }

  /**
   * Get all renewals across organization with pagination & filtering
   */
  static async getAllRenewals(params: {
    page?: number;
    limit?: number;
    year?: number;
    status?: string;
    search?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 25));
    const skip = (page - 1) * limit;

    const query: any = {};

    if (params.year) {
      query.membershipYear = Number(params.year);
    }

    if (params.status && params.status !== 'All' && typeof params.status === 'string') {
      query.status = params.status;
    }

    if (params.search && typeof params.search === 'string' && params.search.trim()) {
      const rawTerm = params.search.trim().slice(0, 100);
      const safeTerm = escapeRegex(rawTerm);
      const numTerm = Number(rawTerm);
      const orConditions: any[] = [{ billId: { $regex: safeTerm, $options: 'i' } }];
      if (!isNaN(numTerm) && numTerm > 0) {
        orConditions.push({ serialNo: numTerm });
      }
      query.$or = orConditions;
    }

    const [renewals, total] = await Promise.all([
      MembershipRenewal.find(query)
        .populate('memberId', 'nameEnglish nameBengali mobileNo')
        .sort({ membershipYear: -1, renewalDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MembershipRenewal.countDocuments(query),
    ]);

    return {
      renewals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Update renewal record
   */
  static async updateRenewal(id: string, updateData: Partial<IMembershipRenewal>) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid Renewal ID format', 400);
    }
    const renewal = await MembershipRenewal.findById(id);
    if (!renewal) {
      throw new AppError('Renewal record not found', 404);
    }

    if (updateData.billId) renewal.billId = updateData.billId.trim();
    if (updateData.renewalDate) renewal.renewalDate = new Date(updateData.renewalDate);
    if (updateData.status) renewal.status = updateData.status;
    if (updateData.notes !== undefined) renewal.notes = updateData.notes.trim();

    await renewal.save();
    return renewal;
  }

  /**
   * Delete renewal record
   */
  static async deleteRenewal(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid Renewal ID format', 400);
    }
    const renewal = await MembershipRenewal.findByIdAndDelete(id);
    if (!renewal) {
      throw new AppError('Renewal record not found', 404);
    }
    return renewal;
  }
}
