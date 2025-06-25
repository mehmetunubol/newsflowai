import mongoose, { Document } from 'mongoose';

export interface IVoice extends mongoose.Document {
  script: string;
  audioPath: string;
  audioData: Buffer;
  createdAt: Date;
  updatedAt: Date;
}

const VoiceSchema = new mongoose.Schema({
  script: { type: String, required: true },
  audioPath: { type: String, required: true },
  audioData: { type: Buffer, required: true }
}, {
  timestamps: true
});

export const Voice = mongoose.model<IVoice>('Voice', VoiceSchema);
