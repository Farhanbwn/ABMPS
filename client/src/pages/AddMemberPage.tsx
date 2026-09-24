import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { memberService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Save, Sparkles, Loader2 } from 'lucide-react';

const currentYear = new Date().getFullYear();

// Form validation schema using Zod - Only serialNo and nameBengali are mandatory
const memberFormSchema = z.object({
  serialNo: z
    .number({ invalid_type_error: 'Serial number must be a valid number' })
    .positive('Serial number must be a positive number'),
  nameBengali: z
    .string()
    .min(1, 'Bengali name is required')
    .max(100, 'Bengali name is too long'),
  nameEnglish: z.string().optional(),
  dateOfBirth: z
    .string()
    .optional()
    .refine((date) => !date || new Date(date) <= new Date(), {
      message: 'Date of birth cannot be in the future',
    }),
  address: z.string().optional(),
  mobileNo: z
    .string()
    .optional()
    .refine((val) => !val || /^[6-9]\d{9}$/.test(val) || val.length >= 7, {
      message: 'Please enter a valid mobile number (e.g. 10 digits)',
    }),
  gender: z.enum(['Male', 'Female', 'Other']).nullable().optional().or(z.literal('')),
  joinYear: z.number().optional().nullable(),
  membershipStatus: z.enum(['Active', 'Inactive', 'Pending']),
  activeBillId: z.string().optional(),
});

type MemberFormData = z.infer<typeof memberFormSchema>;

export const AddMemberPage: React.FC = () => {
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingSerial, setIsFetchingSerial] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberFormSchema) as any,
    defaultValues: {
      serialNo: undefined as any,
      nameBengali: '',
      nameEnglish: '',
      dateOfBirth: '',
      address: '',
      mobileNo: '',
      gender: 'Male',
      joinYear: currentYear,
      membershipStatus: 'Active',
      activeBillId: '',
    },
  });

  // Fetch next available serial number on mount
  useEffect(() => {
    fetchNextSerial();
  }, []);

  const fetchNextSerial = async () => {
    try {
      setIsFetchingSerial(true);
      const res = await memberService.getNextSerial();
      if (res.data?.nextSerial) {
        setValue('serialNo', res.data.nextSerial);
        const joinYr = watch('joinYear') || currentYear;
        setValue('activeBillId', `BILL-${joinYr}-${res.data.nextSerial}`);
      }
    } catch (err) {
      console.warn('Could not auto-fetch next serial number');
    } finally {
      setIsFetchingSerial(false);
    }
  };

  const onSubmit = async (data: MemberFormData) => {
    try {
      setIsSubmitting(true);
      const res = await memberService.createMember({
        serialNo: data.serialNo,
        nameBengali: data.nameBengali.trim(),
        nameEnglish: data.nameEnglish ? data.nameEnglish.trim() : '',
        dateOfBirth: data.dateOfBirth ? (data.dateOfBirth as any) : null,
        address: data.address ? data.address.trim() : '',
        mobileNo: data.mobileNo ? data.mobileNo.trim() : '',
        gender: data.gender === 'Male' || data.gender === 'Female' || data.gender === 'Other' ? data.gender : null,
        joinYear: data.joinYear || null,
        membershipStatus: data.membershipStatus || 'Active',
        activeBillId: data.activeBillId?.trim() || null,
      });
      success(`Member #${res.data.serialNo} (${res.data.nameEnglish || res.data.nameBengali}) added successfully.`);
      navigate(`/members/${res.data._id}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Unable to save member. Please check the highlighted fields.';
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/members"
            className="p-2 rounded-lg bg-white border border-[#E3E3E3] text-[#171717] hover:bg-[#F5F5F5] transition-colors"
            title="Back to Member List"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#171717]">Add New Member</h1>
            <p className="text-xs text-[#555555]">
              Register an organization member. Serial No. and Bengali Name are required.
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
          {/* Section: Identification */}
          <div className="border-b border-[#E3E3E3] pb-6">
            <h3 className="text-sm font-bold text-[#171717] mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C92812]" />
              Member Serial Number
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div>
                <label className="block text-xs font-semibold text-[#171717] uppercase mb-1.5">
                  Serial No. (Unique Member ID) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    {...register('serialNo', { valueAsNumber: true })}
                    placeholder="e.g. 105"
                    className={`w-full px-3 py-2 text-sm bg-white border rounded-md font-mono text-[#171717] focus:outline-none ${
                      errors.serialNo
                        ? 'border-[#C62828]'
                        : 'border-[#E3E3E3] focus:border-[#C92812]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={fetchNextSerial}
                    disabled={isFetchingSerial}
                    title="Generate next sequential serial number"
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-[#C92812] bg-[#FBE9E6] rounded-md hover:bg-[#FBE9E6]/80 border border-[#C92812]/20 whitespace-nowrap transition-colors"
                  >
                    {isFetchingSerial ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Next ID</span>
                  </button>
                </div>
                {errors.serialNo && (
                  <p className="mt-1 text-xs text-[#C62828] font-medium">{errors.serialNo.message}</p>
                )}
                <p className="text-[11px] text-[#777777] mt-1">
                  Unique identifier. Can be manually entered or auto-generated.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Names & Demographics */}
          <div className="border-b border-[#E3E3E3] pb-6">
            <h3 className="text-sm font-bold text-[#171717] mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C92812]" />
              Personal & Contact Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Bengali Name - Mandatory */}
              <div>
                <label className="block text-xs font-semibold text-[#171717] uppercase mb-1.5">
                  Name (Bengali) *
                </label>
                <input
                  type="text"
                  {...register('nameBengali')}
                  placeholder="e.g. হাসিনা বিবি"
                  className={`w-full px-3 py-2 text-sm bg-white border rounded-md font-bengali text-[#171717] focus:outline-none ${
                    errors.nameBengali
                      ? 'border-[#C62828]'
                      : 'border-[#E3E3E3] focus:border-[#C92812]'
                  }`}
                />
                {errors.nameBengali && (
                  <p className="mt-1 text-xs text-[#C62828] font-medium">{errors.nameBengali.message}</p>
                )}
              </div>

              {/* English Name - Optional */}
              <div>
                <label className="block text-xs font-semibold text-[#171717] uppercase mb-1.5">
                  Name (English) <span className="text-[#777777] font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  {...register('nameEnglish')}
                  placeholder="e.g. Hasina Bibi"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E3E3E3] rounded-md text-[#171717] focus:outline-none focus:border-[#C92812]"
                />
              </div>

              {/* Date of Birth - Optional */}
              <div>
                <label className="block text-xs font-semibold text-[#171717] uppercase mb-1.5">
                  Date of Birth <span className="text-[#777777] font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="date"
                  {...register('dateOfBirth')}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E3E3E3] rounded-md text-[#171717] focus:outline-none focus:border-[#C92812]"
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-xs text-[#C62828] font-medium">{errors.dateOfBirth.message}</p>
                )}
              </div>

              {/* Gender - Optional */}
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

              {/* Mobile Number - Optional */}
              <div>
                <label className="block text-xs font-semibold text-[#171717] uppercase mb-1.5">
                  Mobile Number <span className="text-[#777777] font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="tel"
                  maxLength={15}
                  {...register('mobileNo')}
                  placeholder="e.g. 9876543210"
                  className={`w-full px-3 py-2 text-sm bg-white border rounded-md font-mono text-[#171717] focus:outline-none ${
                    errors.mobileNo
                      ? 'border-[#C62828]'
                      : 'border-[#E3E3E3] focus:border-[#C92812]'
                  }`}
                />
                {errors.mobileNo && (
                  <p className="mt-1 text-xs text-[#C62828] font-medium">{errors.mobileNo.message}</p>
                )}
              </div>

              {/* Address - Optional */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#171717] uppercase mb-1.5">
                  Address <span className="text-[#777777] font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  {...register('address')}
                  placeholder="e.g. Babur Bagh, Burdwan"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E3E3E3] rounded-md text-[#171717] focus:outline-none focus:border-[#C92812]"
                />
              </div>
            </div>
          </div>

          {/* Section: Membership & Billing */}
          <div>
            <h3 className="text-sm font-bold text-[#171717] mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C92812]" />
              Membership & Billing Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Year of Joining - Optional */}
              <div>
                <label className="block text-xs font-semibold text-[#171717] uppercase mb-1.5">
                  Year of Joining <span className="text-[#777777] font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 2024"
                  {...register('joinYear', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E3E3E3] rounded-md text-[#171717] focus:outline-none focus:border-[#C92812]"
                />
              </div>

              {/* Membership Status - Optional with default */}
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

              {/* Active Bill ID - Optional */}
              <div>
                <label className="block text-xs font-semibold text-[#171717] uppercase mb-1.5">
                  Active Bill ID <span className="text-[#777777] font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  {...register('activeBillId')}
                  placeholder="e.g. BILL-2026-105"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E3E3E3] rounded-md font-mono text-[#171717] focus:outline-none focus:border-[#C92812]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions Footer */}
        <div className="p-6 bg-[#FAF9F7] border-t border-[#E3E3E3] flex items-center justify-end gap-3">
          <Link
            to="/members"
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
            <span>{isSubmitting ? 'Saving Member...' : 'Save Member'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
