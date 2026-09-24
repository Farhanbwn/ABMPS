import mongoose, { Document, Schema } from 'mongoose';

export type GenderType = 'Male' | 'Female' | 'Other' | null;
export type MembershipStatusType = 'Active' | 'Inactive';

export interface IMember extends Document {
  serialNo: number;
  nameBengali: string;
  nameEnglish: string;
  dateOfBirth: Date | null;
  address: string;
  mobileNo: string;
  gender: GenderType;
  joinYear: number | null;
  membershipStatus: MembershipStatusType;
  activeBillId: string | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const memberSchema = new Schema<IMember>(
  {
    serialNo: {
      type: Number,
      required: [true, 'Serial number is required'],
      unique: true,
      index: true,
    },
    nameBengali: {
      type: String,
      required: [true, 'Bengali name is required'],
      trim: true,
      index: true,
    },
    nameEnglish: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    mobileNo: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', null],
      default: null,
    },
    joinYear: {
      type: Number,
      default: null,
      index: true,
    },
    membershipStatus: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
      required: true,
      index: true,
    },
    activeBillId: {
      type: String,
      default: null,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast searching and filtering
memberSchema.index({ serialNo: 1, isDeleted: 1 });
memberSchema.index({ nameEnglish: 1, isDeleted: 1 });
memberSchema.index({ nameBengali: 1, isDeleted: 1 });
memberSchema.index({ mobileNo: 1, isDeleted: 1 });
memberSchema.index({ membershipStatus: 1, isDeleted: 1 });
memberSchema.index({ joinYear: 1, isDeleted: 1 });

export const Member = mongoose.model<IMember>('Member', memberSchema);
