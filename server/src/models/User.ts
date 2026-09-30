import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends mongoose.Document<mongoose.Types.ObjectId> {
  username: string;
  email: string;
  password?: string;
  /** Google account id ("sub"), set when the user signs in with Google. */
  googleId?: string;
  /** Optional Codeforces handle, used to verify solves of Codeforces problems. */
  codeforcesHandle?: string;
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
  // Optional so Google-only accounts can exist; password accounts still require one.
  password: {
    type: String,
    required(this: { googleId?: string }) {
      return !this.googleId;
    },
    minlength: 6,
    select: false,
  },
  googleId: { type: String, unique: true, sparse: true },
  codeforcesHandle: { type: String, trim: true, maxlength: 24 },
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
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

/** Fields that are safe to send to the owning user. */
export const toPublicUser = (user: IUser) => ({
  id: user._id.toString(),
  username: user.username,
  email: user.email,
  isAdmin: user.isAdmin,
  createdAt: user.createdAt,
  googleLinked: Boolean(user.googleId),
  codeforcesHandle: user.codeforcesHandle || null,
});

export default mongoose.model<IUser>('User', userSchema);
