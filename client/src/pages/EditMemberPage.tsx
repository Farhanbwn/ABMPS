import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { memberService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Save, Loader2, Lock, Unlock, AlertTriangle } from 'lucide-react';

const currentYear = new Date().getFullYear();

const editMemberFormSchema = z.object({
  serialNo: z
    .number({ invalid_type_error: 'Serial number must be a valid number' })
    .positive('Serial number must be positive'),
  nameBengali: z
    .string()
    .min(2, 'Bengali name must be at least 2 characters')
    .max(100, 'Bengali name is too long'),
  nameEnglish: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  mobileNo: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).nullable().optional().or(z.literal('')),
  joinYear: z
    .number({ invalid_type_error: 'Join year must be a number' })
    .optional()
    .nullable(),
  membershipStatus: z.enum(['Active', 'Inactive', 'Pending']),
  activeBillId: z.string().optional(),
});

type EditMemberFormData = z.infer<typeof editMemberFormSchema>;

export const EditMemberPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [allowSerialEdit, setAllowSerialEdit] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditMemberFormData>({
    resolver: zodResolver(editMemberFormSchema),
  });

  useEffect(() => {
    if (id) {
      fetchMemberDetails(id);
    }
  }, [id]);

  const fetchMemberDetails = async (memberId: string) => {
    try {
      setIsLoading(true);
      const res = await memberService.getMemberById(memberId);
      const m = res.data.member;
      const formattedDob = m.dateOfBirth
        ? new Date(m.dateOfBirth).toISOString().split('T')[0]
        : '';

      reset({
        serialNo: m.serialNo,
        nameBengali: m.nameBengali,
        nameEnglish: m.nameEnglish || '',
        dateOfBirth: formattedDob,
        address: m.address || '',
        mobileNo: m.mobileNo || '',
        gender: (m.gender as any) || 'Male',
        joinYear: m.joinYear || null,
        membershipStatus: m.membershipStatus,
        activeBillId: m.activeBillId || '',
      });
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to load member profile.');
      navigate('/members');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: EditMemberFormData) => {
    if (!id) return;
    try {
      setIsSubmitting(true);
      await memberService.updateMember(id, {
        ...data,
        gender: data.gender === 'Male' || data.gender === 'Female' || data.gender === 'Other' ? data.gender : null,
        activeBillId: data.activeBillId?.trim() || null,
      });
      success('Member updated successfully.');
      navigate(`/members/${id}`);
    } catch (err: any) {
      error(err.response?.data?.message || 'Unable to update member. Please verify all inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-medium text-dark-muted">Loading member profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={id ? `/members/${id}` : '/members'}
            className="p-2 rounded-lg bg-white border border-[#E3E3E3] text-[#171717] hover:bg-[#F5F5F5] transition-colors"
            title="Back to Member Details"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#171717]">Edit Member Profile</h1>
            <p className="text-xs text-[#555555]">
              Update member personal details, status, and active billing identifier.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-xl border border-[#E3E3E3] shadow-xs overflow-hidden"
      >
        <div className="p-6 sm:p-8 space-y-6">
          {/* Section: Serial No & Protection */}
          <div className="border-b border-[#E3E3E3] pb-6">
            <h3 className="text-sm font-bold text-[#171717] mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C92812]" />
              Member Serial Number
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div>
                <label className="block text-xs font-semibold text-[#171717] uppercase mb-1.5">
                  Serial No. (Unique Member ID)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    disabled={!allowSerialEdit}
                    {...register('serialNo', { valueAsNumber: true })}
                    className={`w-full px-3 py-2 text-sm border rounded-md font-mono focus:outline-none ${
                      !allowSerialEdit
                        ? 'bg-[#F5F5F5] text-[#777777] cursor-not-allowed border-[#E3E3E3]'
                        : 'bg-white border-[#C92812] text-[#171717]'
                    }`}
                  />
                </div>
                {errors.serialNo && (
                  <p className="mt-1 text-xs text-[#C62828] font-medium">{errors.serialNo.message}</p>
                )}

                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setAllowSerialEdit(!allowSerialEdit)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#C92812] font-semibold hover:underline"
                  >
                    {allowSerialEdit ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Lock Serial Number</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Unlock to Edit Serial No.</span>
                      </>
                    )}
                  </button>
                </div>

                {allowSerialEdit && (
                  <div className="mt-2 p-2 bg-[#FFF4D6] border border-[#C77A00]/30 rounded-md text-[11px] text-[#171717] flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#C77A00] flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Caution:</strong> Changing the Serial No. affects this member&apos;s unique identifier and historical records.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section: Personal Info */}
          <div className="border-b border-[#E3E3E3] pb-6">
            <h3 className="text-sm font-bold text-[#171717] mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C92812]" />
              Personal & Contact Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#171717] uppercase mb-1.5">
                  Name (Bengali) *
                </label>
                <input
                  type="text"
                  {...register('nameBengali')}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E3E3E3] rounded-md font-bengali text-[#171717] focus:outline-none focus:border-[#C92812]"
                />
                {errors.nameBengali && (
                  <p className="mt-1 text-xs text-[#C62828] font-medium">{errors.nameBengali.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#171717] uppercase mb-1.5">
                  Name (English) <span className="text-[#777777] font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  {...register('nameEnglish')}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E3E3E3] rounded-md text-[#171717] focus:outline-none focus:border-[#C92812]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#171717] uppercase mb-1.5">
                  Date of Birth <span className="text-[#777777] font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="date"
                  {...register('dateOfBirth')}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E3E3E3] rounded-md text-[#171717] focus:outline-none focus:border-[#C92812]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#171717] uppercase mb-1.5">
                  Gender <span className="text-[#777777] font-normal lowercase">(optional)</span>
                </label>
                <select
                  {...register('gender')}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E3E3E3] rounded-md text-[#171717] focus:outline-none focus:border-[#C92812]"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#171717] uppercase mb-1.5">
                  Mobile Number <span className="text-[#777777] font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="tel"
                  maxLength={15}
                  {...register('mobileNo')}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E3E3E3] rounded-md font-mono text-[#171717] focus:outline-none focus:border-[#C92812]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#171717] uppercase mb-1.5">
                  Address <span className="text-[#777777] font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  {...register('address')}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E3E3E3] rounded-md text-[#171717] focus:outline-none focus:border-[#C92812]"
                />
              </div>
            </div>
          </div>

          {/* Section: Membership Details */}
          <div>
            <h3 className="text-sm font-bold text-[#171717] mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C92812]" />
              Membership & Billing Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#171717] uppercase mb-1.5">
                  Year of Joining <span className="text-[#777777] font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="number"
                  {...register('joinYear', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E3E3E3] rounded-md text-[#171717] focus:outline-none focus:border-[#C92812]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#171717] uppercase mb-1.5">
                  Membership Status <span className="text-[#777777] font-normal lowercase">(optional)</span>
                </label>
                <select
                  {...register('membershipStatus')}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E3E3E3] rounded-md text-[#171717] focus:outline-none focus:border-[#C92812]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#171717] uppercase mb-1.5">
                  Active Bill ID (Optional)
                </label>
                <input
                  type="text"
                  {...register('activeBillId')}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E3E3E3] rounded-md font-mono text-[#171717] focus:outline-none focus:border-[#C92812]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-[#FAF9F7] border-t border-[#E3E3E3] flex items-center justify-end gap-3">
          <Link
            to={id ? `/members/${id}` : '/members'}
            className="btn-secondary"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary shadow-xs"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSubmitting ? 'Updating Member...' : 'Update Member'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
