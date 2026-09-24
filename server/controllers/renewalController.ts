import { Request, Response, NextFunction } from 'express';
import { RenewalService } from '../services/renewalService';

export const createRenewal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { memberId, membershipYear, billId, renewalDate, status, notes } = req.body;

    const renewal = await RenewalService.createRenewal({
      memberId,
      membershipYear: Number(membershipYear),
      billId,
      renewalDate,
      status,
      notes,
    });

    res.status(201).json({
      success: true,
      message: 'Membership renewed successfully',
      data: renewal,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllRenewals = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit, year, status, search } = req.query;

    const result = await RenewalService.getAllRenewals({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 25,
      year: year ? Number(year) : undefined,
      status: status as string,
      search: search as string,
    });

    res.status(200).json({
      success: true,
      message: 'Renewals retrieved successfully',
      data: result.renewals,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getRenewalsByMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { memberId } = req.params;
    const renewals = await RenewalService.getRenewalsByMember(memberId);

    res.status(200).json({
      success: true,
      data: renewals,
    });
  } catch (error) {
    next(error);
  }
};

export const getRenewalsByYear = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const year = Number(req.params.year);
    const renewals = await RenewalService.getRenewalsByYear(year);

    res.status(200).json({
      success: true,
      data: renewals,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRenewal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const renewal = await RenewalService.updateRenewal(id, req.body);

    res.status(200).json({
      success: true,
      message: 'Renewal record updated successfully',
      data: renewal,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRenewal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const renewal = await RenewalService.deleteRenewal(id);

    res.status(200).json({
      success: true,
      message: 'Renewal record removed successfully',
      data: renewal,
    });
  } catch (error) {
    next(error);
  }
};
