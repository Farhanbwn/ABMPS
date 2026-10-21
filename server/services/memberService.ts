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
  paidYears?: number[];
  unpaidYears?: number[];
  unpaidMatchMode?: 'all' | 'any';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startSerial?: number;
  endSerial?: number;
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

    // Membership renewal year filter (single year: includes joiners and renewals)
    if (params.membershipYear) {
      const year = Number(params.membershipYear);
      const renewedMemberIds = await MembershipRenewal.distinct('memberId', {
        membershipYear: year,
        status: 'Active',
      });
      const joinedMemberIds = await Member.distinct('_id', {
        joinYear: year,
        isDeleted: false,
      });
      const eligibleIds = [
        ...new Set([
          ...renewedMemberIds.map((id) => id.toString()),
          ...joinedMemberIds.map((id) => id.toString()),
        ]),
      ].map((id) => new mongoose.Types.ObjectId(id));
      query._id = MemberService.intersectMemberIds(query._id, eligibleIds);
    }

    // Advanced Filter: Paid Years (MUST have paid ALL selected years)
    if (params.paidYears && params.paidYears.length > 0) {
      const paidIds = await MemberService.resolvePaidYearsMemberIds(params.paidYears);
      query._id = MemberService.intersectMemberIds(query._id, paidIds);
    }

    // Advanced Filter: Unpaid Years (Missed ALL or Missed ANY of applicable years)
    if (params.unpaidYears && params.unpaidYears.length > 0) {
      const unpaidIds = await MemberService.resolveUnpaidYearsMemberIds(
        params.unpaidYears,
        params.unpaidMatchMode || 'all'
      );
      query._id = MemberService.intersectMemberIds(query._id, unpaidIds);
    }

    if (params.startSerial !== undefined || params.endSerial !== undefined) {
      query.serialNo = {};
      if (params.startSerial !== undefined) query.serialNo.$gte = Number(params.startSerial);
      if (params.endSerial !== undefined) query.serialNo.$lte = Number(params.endSerial);
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
      const joinedMemberIds = await Member.distinct('_id', {
        joinYear: year,
        isDeleted: false,
      });
      const eligibleIds = [
        ...new Set([
          ...renewedMemberIds.map((id) => id.toString()),
          ...joinedMemberIds.map((id) => id.toString()),
        ]),
      ].map((id) => new mongoose.Types.ObjectId(id));
      query._id = MemberService.intersectMemberIds(query._id, eligibleIds);
    }

    // Advanced Filter: Paid Years (MUST have paid ALL selected years)
    if (params.paidYears && params.paidYears.length > 0) {
      const paidIds = await MemberService.resolvePaidYearsMemberIds(params.paidYears);
      query._id = MemberService.intersectMemberIds(query._id, paidIds);
    }

    // Advanced Filter: Unpaid Years (Missed ALL or Missed ANY of applicable years)
    if (params.unpaidYears && params.unpaidYears.length > 0) {
      const unpaidIds = await MemberService.resolveUnpaidYearsMemberIds(
        params.unpaidYears,
        params.unpaidMatchMode || 'all'
      );
      query._id = MemberService.intersectMemberIds(query._id, unpaidIds);
    }

    if (params.startSerial !== undefined || params.endSerial !== undefined) {
      query.serialNo = {};
      if (params.startSerial !== undefined) query.serialNo.$gte = Number(params.startSerial);
      if (params.endSerial !== undefined) query.serialNo.$lte = Number(params.endSerial);
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
    const highestMember = await Member.findOne({ isDeleted: false }).sort({ serialNo: -1 }).select('serialNo').lean();
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
        // Clean up the previously soft-deleted member to free up the serial number
        await Member.deleteOne({ _id: existing._id });
        await MembershipRenewal.deleteMany({ memberId: existing._id });
      } else {
        throw new AppError(`Serial No. ${data.serialNo} is already assigned to an existing member.`, 409);
      }
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
        if (existing.isDeleted) {
          // Clean up the soft-deleted member to free up the serial number
          await Member.deleteOne({ _id: existing._id });
          await MembershipRenewal.deleteMany({ memberId: existing._id });
        } else {
          throw new AppError(`Serial No. ${updateData.serialNo} is already in use by another member.`, 409);
        }
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

    // Delete all membership renewals associated with this member
    await MembershipRenewal.deleteMany({ memberId: member._id });

    return member;
  }

  /**
   * Helper to intersect an array of ObjectIds with an existing query._id condition
   */
  private static intersectMemberIds(
    existingIdFilter: any,
    newIds: mongoose.Types.ObjectId[]
  ): any {
    const newIdStrs = new Set(newIds.map((id) => id.toString()));
    if (!existingIdFilter) {
      return { $in: newIds };
    }
    if (existingIdFilter.$in) {
      const intersected = existingIdFilter.$in.filter((id: any) =>
        newIdStrs.has(id.toString())
      );
      return { ...existingIdFilter, $in: intersected };
    }
    return { ...existingIdFilter, $in: newIds };
  }

  /**
   * Resolve member IDs matching paid years.
   * A member has paid in year Y if:
   * 1. They joined in year Y (joinYear === Y, initial membership paid upon admission), OR
   * 2. An active MembershipRenewal exists for year Y.
   * Member must satisfy this for ALL years in paidYears.
   */
  private static async resolvePaidYearsMemberIds(
    paidYears: number[]
  ): Promise<mongoose.Types.ObjectId[]> {
    if (!paidYears || paidYears.length === 0) return [];

    const renewalDocs = await MembershipRenewal.find(
      {
        membershipYear: { $in: paidYears },
        status: 'Active',
      },
      { memberId: 1, membershipYear: 1 }
    ).lean();

    const memberRenewals = new Map<string, Set<number>>();
    for (const r of renewalDocs) {
      const key = r.memberId.toString();
      if (!memberRenewals.has(key)) memberRenewals.set(key, new Set());
      memberRenewals.get(key)!.add(r.membershipYear);
    }

    const candidateMembers = await Member.find(
      { isDeleted: false },
      { _id: 1, joinYear: 1 }
    ).lean();

    return candidateMembers
      .filter((m) => {
        const idStr = m._id.toString();
        const rens = memberRenewals.get(idStr) || new Set();
        return paidYears.every((y) => m.joinYear === y || rens.has(y));
      })
      .map((m) => m._id as mongoose.Types.ObjectId);
  }

  /**
   * Resolve member IDs matching unpaid years.
   * - Only considers years where member was already registered (member.joinYear <= Y).
   * - A member has paid in year Y if joinYear === Y or an active renewal exists for Y.
   * - Mode 'all': member has NOT paid for ALL applicable years in unpaidYears.
   * - Mode 'any': member has NOT paid for AT LEAST ONE applicable year in unpaidYears.
   * - If member joined after all selected unpaid years, they are excluded (not liable).
   */
  private static async resolveUnpaidYearsMemberIds(
    unpaidYears: number[],
    unpaidMatchMode: 'all' | 'any' = 'all'
  ): Promise<mongoose.Types.ObjectId[]> {
    if (!unpaidYears || unpaidYears.length === 0) return [];

    const renewalDocs = await MembershipRenewal.find(
      {
        membershipYear: { $in: unpaidYears },
        status: 'Active',
      },
      { memberId: 1, membershipYear: 1 }
    ).lean();

    const memberRenewals = new Map<string, Set<number>>();
    for (const r of renewalDocs) {
      const key = r.memberId.toString();
      if (!memberRenewals.has(key)) memberRenewals.set(key, new Set());
      memberRenewals.get(key)!.add(r.membershipYear);
    }

    const candidateMembers = await Member.find(
      { isDeleted: false },
      { _id: 1, joinYear: 1 }
    ).lean();

    return candidateMembers
      .filter((m) => {
        const idStr = m._id.toString();
        const rens = memberRenewals.get(idStr) || new Set();

        // Applicable years for this member: only years after or equal to their joining year
        const applicableYears = unpaidYears.filter(
          (y) => m.joinYear && m.joinYear <= y
        );
        if (applicableYears.length === 0) {
          // Member joined in a later year; not liable for these earlier years
          return false;
        }

        if (unpaidMatchMode === 'all') {
          return applicableYears.every((y) => m.joinYear !== y && !rens.has(y));
        } else {
          return applicableYears.some((y) => m.joinYear !== y && !rens.has(y));
        }
      })
      .map((m) => m._id as mongoose.Types.ObjectId);
  }
}
