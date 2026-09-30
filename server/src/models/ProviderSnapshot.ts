import mongoose from 'mongoose';

/**
 * Last successful response from an external problem source, stored so the catalog
 * keeps working (clearly marked stale) when the source is temporarily unreachable.
 */
export interface IProviderSnapshot extends mongoose.Document<mongoose.Types.ObjectId> {
  provider: string;
  fetchedAt: Date;
  data: unknown;
}

const providerSnapshotSchema = new mongoose.Schema({
  provider: { type: String, required: true, unique: true },
  fetchedAt: { type: Date, required: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
});

export default mongoose.model<IProviderSnapshot>('ProviderSnapshot', providerSnapshotSchema);
