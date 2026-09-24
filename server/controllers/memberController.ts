import { Request, Response, NextFunction } from 'express';
import { MemberService } from '../services/memberService';
import { AppError } from '../middleware/errorHandler';

export const getMembers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      page,
      limit,
      search,
      status,
      gender,
      joinYear,
      membershipYear,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await MemberService.getMembers({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 25,
      search: search as string,
      status: status as string,
      gender: gender as string,
      joinYear: joinYear ? Number(joinYear) : undefined,
      membershipYear: membershipYear ? Number(membershipYear) : undefined,
      sortBy: sortBy as string,
      sortOrder: (sortOrder as 'asc' | 'desc') || 'asc',
    });

    res.status(200).json({
      success: true,
      message: 'Members retrieved successfully',
      data: result.members,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllFilteredMembers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, status, gender, joinYear, membershipYear, sortBy, sortOrder } = req.query;

    const members = await MemberService.getAllFilteredMembers({
      search: search as string,
      status: status as string,
      gender: gender as string,
      joinYear: joinYear ? Number(joinYear) : undefined,
      membershipYear: membershipYear ? Number(membershipYear) : undefined,
      sortBy: sortBy as string,
      sortOrder: (sortOrder as 'asc' | 'desc') || 'asc',
    });

    res.status(200).json({
      success: true,
      message: 'Filtered members retrieved successfully',
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

export const getNextSerial = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const nextSerial = await MemberService.getNextAvailableSerial();
    res.status(200).json({
      success: true,
      data: { nextSerial },
    });
  } catch (error) {
    next(error);
  }
};

export const getJoinYears = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const years = await MemberService.getUniqueJoinYears();
    res.status(200).json({
      success: true,
      data: { years },
    });
  } catch (error) {
    next(error);
  }
};

export const getMemberById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await MemberService.getMemberById(id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getMemberBySerial = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const serialNo = Number(req.params.serialNo);
    if (isNaN(serialNo)) {
      throw new AppError('Invalid serial number', 400);
    }
    const result = await MemberService.getMemberBySerialNo(serialNo);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const createMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
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
    } = req.body;

    if (!serialNo || !nameBengali) {
      throw new AppError('Serial number and Bengali name are required.', 400);
    }

    const member = await MemberService.createMember({
      serialNo: Number(serialNo),
      nameBengali: nameBengali.trim(),
      nameEnglish: nameEnglish ? nameEnglish.trim() : '',
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      address: address ? address.trim() : '',
      mobileNo: mobileNo ? mobileNo.trim() : '',
      gender: gender || null,
      joinYear: joinYear ? Number(joinYear) : null,
      membershipStatus: membershipStatus || 'Active',
      activeBillId: activeBillId ? activeBillId.trim() : null,
    });

    res.status(201).json({
      success: true,
      message: 'Member added successfully',
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
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
    } = req.body;

    const updatePayload: any = {};
    if (serialNo !== undefined && serialNo !== null && !isNaN(Number(serialNo))) {
      updatePayload.serialNo = Number(serialNo);
    }
    if (nameBengali !== undefined) updatePayload.nameBengali = nameBengali.trim();
    if (nameEnglish !== undefined) updatePayload.nameEnglish = nameEnglish ? nameEnglish.trim() : '';

    if (dateOfBirth !== undefined) {
      if (!dateOfBirth) {
        updatePayload.dateOfBirth = null;
      } else {
        const d = new Date(dateOfBirth);
        updatePayload.dateOfBirth = isNaN(d.getTime()) ? null : d;
      }
    }

    if (address !== undefined) updatePayload.address = address ? address.trim() : '';
    if (mobileNo !== undefined) updatePayload.mobileNo = mobileNo ? mobileNo.trim() : '';

    if (gender !== undefined) {
      updatePayload.gender = gender === 'Male' || gender === 'Female' || gender === 'Other' ? gender : null;
    }

    if (joinYear !== undefined) {
      const y = Number(joinYear);
      updatePayload.joinYear = !joinYear || isNaN(y) ? null : y;
    }

    if (membershipStatus !== undefined) updatePayload.membershipStatus = membershipStatus;
    if (activeBillId !== undefined) updatePayload.activeBillId = activeBillId ? activeBillId.trim() : null;

    const member = await MemberService.updateMember(id, updatePayload);

    res.status(200).json({
      success: true,
      message: 'Member updated successfully',
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const member = await MemberService.deleteMember(id);

    res.status(200).json({
      success: true,
      message: 'Member deleted successfully',
      data: {
        id: member._id,
        serialNo: member.serialNo,
        nameEnglish: member.nameEnglish,
      },
    });
  } catch (error) {
    next(error);
  }
};
