import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends mongoose.Document<mongoose.Types.ObjectId> {
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  isAdmin: boolean;
  /** Problems already used in this user's duels, so rematches get fresh problems. */
  duelSolvedProblems: mongoose.Types.ObjectId[];
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  duelSolvedProblems: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      default: [],
    },
  ],
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

/** Fields that are safe to send to the owning user. */
export const toPublicUser = (user: IUser) => ({
  id: user._id.toString(),
  username: user.username,
  email: user.email,
  isAdmin: user.isAdmin,
  createdAt: user.createdAt,
});

export default mongoose.model<IUser>('User', userSchema);
