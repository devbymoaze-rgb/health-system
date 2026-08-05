import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISettings extends Document {
  openaiApiKey?: string;
  whatsappNumber?: string;
  autoResponseEnabled: boolean;
  whatsappQr?: string;
  whatsappResetRequestedAt?: Date;
  googleTokens?: {
    access_token?: string;
    refresh_token?: string;
    scope?: string;
    token_type?: string;
    expiry_date?: number;
  };
}

const SettingsSchema: Schema = new Schema({
  openaiApiKey: { type: String },
  whatsappNumber: { type: String },
  autoResponseEnabled: { type: Boolean, default: true },
  whatsappQr: { type: String },
  whatsappResetRequestedAt: { type: Date },
  googleTokens: {
    access_token: String,
    refresh_token: String,
    scope: String,
    token_type: String,
    expiry_date: Number,
  },
});

export const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);

export interface IDoctor extends Document {
  name?: string;
  specialization?: string;
  experience?: number;
  clinicAddress?: string;
  contactNumber?: string;
  bio?: string;
  updatedAt?: Date;
}

const DoctorSchema: Schema = new Schema({
  name: { type: String },
  specialization: { type: String },
  experience: { type: Number },
  clinicAddress: { type: String },
  contactNumber: { type: String },
  bio: { type: String },
  updatedAt: { type: Date, default: Date.now },
});

export const Doctor: Model<IDoctor> =
  mongoose.models.Doctor || mongoose.model<IDoctor>('Doctor', DoctorSchema);

export interface IAppointment extends Document {
  title: string;
  start: Date;
  end: Date;
  patientName: string;
  patientEmail: string;
  patientContact?: string;
  bookingId?: string;
  googleEventId?: string;
  status?: 'confirmed' | 'cancelled' | 'completed';
}

const AppointmentSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    patientName: { type: String, required: true },
    patientEmail: { type: String },
    patientContact: { type: String },
    bookingId: { type: String, unique: true },
    googleEventId: { type: String },
    status: { type: String, enum: ['confirmed', 'cancelled', 'completed'], default: 'confirmed' },
  },
  { timestamps: true }
);

export const Appointment: Model<IAppointment> =
  mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);

export interface IFollowUp extends Document {
  remoteJid?: string;
  message?: string;
  scheduledTime?: Date;
  status?: 'pending' | 'sent' | 'failed';
  createdAt?: Date;
}

const FollowUpSchema: Schema = new Schema(
  {
    remoteJid: String,
    message: String,
    scheduledTime: Date,
    status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const FollowUp: Model<IFollowUp> =
  mongoose.models.FollowUp || mongoose.model<IFollowUp>('FollowUp', FollowUpSchema);

export interface IConversation extends Document {
  userId: string;
  messages: Array<{
    role: string;
    content?: string;
    tool_calls?: unknown[];
  }>;
}

const ConversationSchema: Schema = new Schema({
  userId: { type: String, required: true },
  messages: [
    {
      role: String,
      content: String,
      tool_calls: Array,
    },
  ],
});

export const Conversation: Model<IConversation> =
  mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);
