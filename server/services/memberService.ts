import mongoose from 'mongoose';
import { Member, IMember } from '../models/Member';
import { MembershipRenewal } from '../models/MembershipRenewal';
import { AppError } from '../middleware/errorHandler';
import { escapeRegex } from '../utils/regex';

const ALLOWED_SORT_FIELDS = new Set([
  'serialNo',
  'nameEnglish',
  'nameBengali',
  'joinYear',
  'membershipStatus',
  'createdAt',
  'updatedAt',
]);

export interface MemberQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  gender?: string;
  joinYear?: number;
  membershipYear?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class MemberService {
  /**
   * Get paginated members with search, filters, and sorting
   */
  static async getMembers(params: MemberQueryParams) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(500, Number(params.limit) || 25));
    const skip = (page - 1) * limit;

    const query: any = { isDeleted: false };

    // Search partial matches with ReDoS/Regex Injection protection
    if (params.search && typeof params.search === 'string' && params.search.trim()) {
      const rawTerm = params.search.trim().slice(0, 100);
      const safeTerm = escapeRegex(rawTerm);
      const numTerm = Number(rawTerm);
      const orConditions: any[] = [
        { nameBengali: { $regex: safeTerm, $options: 'i' } },
        { nameEnglish: { $regex: safeTerm, $options: 'i' } },
        { mobileNo: { $regex: safeTerm, $options: 'i' } },
        { activeBillId: { $regex: safeTerm, $options: 'i' } },
      ];

      // If user typed a number, also match serialNo
      if (!isNaN(numTerm) && numTerm > 0) {
        orConditions.push({ serialNo: numTerm });
      }

      query.$or = orConditions;
    }

    // Status filter
    if (params.status && params.status !== 'All' && typeof params.status === 'string') {
      query.membershipStatus = params.status;
    }

    // Gender filter
    if (params.gender && params.gender !== 'All' && typeof params.gender === 'string') {
      query.gender = params.gender;
    }

    // Join year filter
    if (params.joinYear) {
      query.joinYear = Number(params.joinYear);
    }

    // Membership renewal year filter
    if (params.membershipYear) {
      const year = Number(params.membershipYear);
      const renewedMemberIds = await MembershipRenewal.distinct('memberId', {
        membershipYear: year,
        status: 'Active',
      });
      query._id = { $in: renewedMemberIds };
    }

    // Sorting with whitelist protection
    const sortField = params.sortBy && ALLOWED_SORT_FIELDS.has(params.sortBy) ? params.sortBy : 'serialNo';
    const sortDirection = params.sortOrder === 'desc' ? -1 : 1;
    const sort: any = { [sortField]: sortDirection };

    const [members, total] = await Promise.all([
      Member.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Member.countDocuments(query),
    ]);

    return {
      members,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get all members matching filter (for Excel export or complete list)
   * Enforces 10,000 maximum record ceiling to prevent memory exhaustion DoS
   */
  static async getAllFilteredMembers(params: Omit<MemberQueryParams, 'page' | 'limit'>) {
    const query: any = { isDeleted: false };

    if (params.search && typeof params.search === 'string' && params.search.trim()) {
      const rawTerm = params.search.trim().slice(0, 100);
      const safeTerm = escapeRegex(rawTerm);
      const numTerm = Number(rawTerm);
      const orConditions: any[] = [
        { nameBengali: { $regex: safeTerm, $options: 'i' } },
        { nameEnglish: { $regex: safeTerm, $options: 'i' } },
        { mobileNo: { $regex: safeTerm, $options: 'i' } },
        { activeBillId: { $regex: safeTerm, $options: 'i' } },
      ];
      if (!isNaN(numTerm) && numTerm > 0) {
        orConditions.push({ serialNo: numTerm });
      }
      query.$or = orConditions;
    }

    if (params.status && params.status !== 'All' && typeof params.status === 'string') {
      query.membershipStatus = params.status;
    }

    if (params.gender && params.gender !== 'All' && typeof params.gender === 'string') {
      query.gender = params.gender;
    }

    if (params.joinYear) {
      query.joinYear = Number(params.joinYear);
    }

    if (params.membershipYear) {
      const year = Number(params.membershipYear);
      const renewedMemberIds = await MembershipRenewal.distinct('memberId', {
        membershipYear: year,
        status: 'Active',
      });
      query._id = { $in: renewedMemberIds };
    }

    const sortField = params.sortBy && ALLOWED_SORT_FIELDS.has(params.sortBy) ? params.sortBy : 'serialNo';
    const sortDirection = params.sortOrder === 'desc' ? -1 : 1;

    // Safety limit 10,000 to prevent OOM
    return Member.find(query).sort({ [sortField]: sortDirection }).limit(10000).lean();
  }

  /**
   * Get member by ID with renewal history
   */
  static async getMemberById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid Member ID format', 400);
    }
    const member = await Member.findOne({ _id: id, isDeleted: false });
    if (!member) {
      throw new AppError('Member not found', 404);
    }

    const renewals = await MembershipRenewal.find({ memberId: id })
      .sort({ membershipYear: -1, renewalDate: -1 })
      .lean();

    return {
      member,
      renewals,
    };
  }


  /**
   * Get member by serial number
   */
  static async getMemberBySerialNo(serialNo: number) {
    const member = await Member.findOne({ serialNo, isDeleted: false });
    if (!member) {
      throw new AppError(`Member with Serial No. ${serialNo} not found`, 404);
    }
    const renewals = await MembershipRenewal.find({ memberId: member._id })
      .sort({ membershipYear: -1 })
      .lean();
    return { member, renewals };
  }

  /**
   * Get next available serial number
   */
  static async getNextAvailableSerial(): Promise<number> {
    const highestMember = await Member.findOne({}).sort({ serialNo: -1 }).select('serialNo').lean();
    if (!highestMember || !highestMember.serialNo) {
      return 101; // Start from 101 as standard
    }
    return highestMember.serialNo + 1;
  }

  /**
   * Get list of unique join years for filter dropdowns
   */
  static async getUniqueJoinYears(): Promise<number[]> {
    const years = await Member.distinct('joinYear', { isDeleted: false });
    return years.filter(Boolean).sort((a: number, b: number) => b - a);
  }

  /**
   * Create new member
   */
  static async createMember(data: Partial<IMember>) {
    const existing = await Member.findOne({ serialNo: data.serialNo });
    if (existing) {
      if (existing.isDeleted) {
        throw new AppError(
          `Serial No. ${data.serialNo} belongs to a previously deleted member. Please use a different Serial No. or contact database administrator.`,
          409
        );
      }
      throw new AppError(`Serial No. ${data.serialNo} is already assigned to an existing member.`, 409);
    }

    const member = new Member(data);
    await member.save();

    // If joinYear and activeBillId provided, automatically record initial joining renewal if not already existing
    if (member.activeBillId && member.joinYear) {
      try {
        await MembershipRenewal.create({
          memberId: member._id,
          serialNo: member.serialNo,
          membershipYear: member.joinYear,
          billId: member.activeBillId,
          renewalDate: new Date(),
          status: member.membershipStatus,
          notes: 'Initial joining registration',
        });
      } catch (err) {
        console.warn('Note: Could not create auto initial renewal record:', err);
      }
    }

    return member;
  }

  /**
   * Update member
   */
  static async updateMember(id: string, updateData: Partial<IMember>) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid Member ID format', 400);
    }
    const member = await Member.findOne({ _id: id, isDeleted: false });
    if (!member) {
      throw new AppError('Member not found', 404);
    }

    // Check serialNo conflict if serial number is changing
    if (updateData.serialNo && updateData.serialNo !== member.serialNo) {
      const existing = await Member.findOne({
        serialNo: updateData.serialNo,
        _id: { $ne: id },
      });
      if (existing) {
        throw new AppError(`Serial No. ${updateData.serialNo} is already in use by another member.`, 409);
      }
      // Update serialNo in renewals as well
      await MembershipRenewal.updateMany(
        { memberId: member._id },
        { serialNo: updateData.serialNo }
      );
    }

    Object.assign(member, updateData);
    await member.save();
    return member;
  }

  /**
   * Soft delete member
   */
  static async deleteMember(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid Member ID format', 400);
    }
    const member = await Member.findOne({ _id: id, isDeleted: false });
    if (!member) {
      throw new AppError('Member not found', 404);
    }

    member.isDeleted = true;
    member.deletedAt = new Date();
    await member.save();

    return member;
  }
}
