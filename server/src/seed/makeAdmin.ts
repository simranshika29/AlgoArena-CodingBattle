import mongoose from 'mongoose';
import { config } from '../config';
import User from '../models/User';

// Usage: npm run make-admin -- someone@example.com
const email = (process.argv[2] || '').trim().toLowerCase();

if (!email) {
  console.error('Usage: npm run make-admin -- <email>');
  process.exit(1);
}

mongoose
  .connect(config.mongoUri)
  .then(() => User.findOneAndUpdate({ email }, { isAdmin: true }, { new: true }))
  .then((user) => {
    if (!user) {
      console.error(`No user found with email ${email}. Register first, then re-run.`);
      process.exitCode = 1;
    } else {
      console.log(`${user.username} is now an admin.`);
    }
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
