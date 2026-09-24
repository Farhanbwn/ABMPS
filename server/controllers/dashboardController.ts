import { Request, Response, NextFunction } from 'express';
import { Member } from '../models/Member';
import { MembershipRenewal } from '../models/MembershipRenewal';

export const getDashboardStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const currentYear = new Date().getFullYear();

    // Aggregations and counts
    const [
      totalMembers,
      activeMembers,
      inactiveMembers,
      renewedThisYearCount,
      recentMembers,
      recentRenewals,
    ] = await Promise.all([
      Member.countDocuments({ isDeleted: false }),
      Member.countDocuments({ isDeleted: false, membershipStatus: 'Active' }),
      Member.countDocuments({ isDeleted: false, membershipStatus: 'Inactive' }),
      MembershipRenewal.countDocuments({
        membershipYear: currentYear,
        status: 'Active',
      }),
      Member.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('serialNo nameBengali nameEnglish membershipStatus joinYear createdAt')
        .lean(),
      MembershipRenewal.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('memberId', 'nameEnglish nameBengali serialNo')
        .lean(),
    ]);

    // Pending renewal: active members count minus those who have already renewed this year
    const pendingRenewal = Math.max(0, activeMembers - renewedThisYearCount);

    res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: {
        currentYear,
        totalMembers,
        activeMembers,
        inactiveMembers,
        renewedThisYear: renewedThisYearCount,
        pendingRenewal,
        recentMembers,
        recentRenewals,
      },
    });
  } catch (error) {
    next(error);
  }
};
