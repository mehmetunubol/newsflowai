import mongoose, { Document } from 'mongoose';

interface IScript extends Document {
  headline: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const ScriptSchema = new mongoose.Schema({
  headline: { type: String, required: true },
  content: { type: String, required: true }
}, {
  timestamps: true
});

export const Script = mongoose.model<IScript>('Script', ScriptSchema);
