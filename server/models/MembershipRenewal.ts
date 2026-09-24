import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMembershipRenewal extends Document {
  memberId: Types.ObjectId;
  serialNo: number;
  membershipYear: number;
  billId: string;
  renewalDate: Date;
  status: 'Active' | 'Inactive';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const membershipRenewalSchema = new Schema<IMembershipRenewal>(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Member ID is required'],
      index: true,
    },
    serialNo: {
      type: Number,
      required: [true, 'Serial number is required'],
      index: true,
    },
    membershipYear: {
      type: Number,
      required: [true, 'Membership year is required'],
      index: true,
    },
    billId: {
      type: String,
      required: [true, 'Bill ID is required'],
      trim: true,
      index: true,
    },
    renewalDate: {
      type: Date,
      required: [true, 'Renewal date is required'],
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
      required: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index preventing duplicate renewal for same member and year
membershipRenewalSchema.index({ memberId: 1, membershipYear: 1 }, { unique: true });

export const MembershipRenewal = mongoose.model<IMembershipRenewal>(
  'MembershipRenewal',
  membershipRenewalSchema
);
