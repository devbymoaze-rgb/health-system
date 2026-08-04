import mongoose from 'mongoose';
import { Appointment, Doctor, FollowUp, Settings } from './models';

const localStore = {
  settings: null as Record<string, unknown> | null,
  doctor: null as Record<string, unknown> | null,
  appointments: [] as Record<string, unknown>[],
  followUps: [] as Record<string, unknown>[],
};

let usingMockMode = false;

export function isMockMode() {
  return usingMockMode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyModel = any;

export function patchModelsForMockMode() {
  (Settings as AnyModel).findOne = async () => localStore.settings;
  (Settings as AnyModel).prototype.save = async function (this: Record<string, unknown>) {
    localStore.settings = this;
  };
  (Doctor as AnyModel).findOne = async () => localStore.doctor;

  (Appointment as AnyModel).findOne = async (query: Record<string, unknown>) => {
    if (!query) return null;
    if (query.bookingId) {
      return localStore.appointments.find((a) => a.bookingId === query.bookingId) || null;
    }
    if (query.patientEmail) {
      const emailMatches = localStore.appointments.filter((a) => a.patientEmail === query.patientEmail);
      return emailMatches.length > 0 ? emailMatches[0] : null;
    }
    if (query.start && query.end) {
      const reqEnd = (query.start as { $lt: Date }).$lt;
      const reqStart = (query.end as { $gt: Date }).$gt;
      return localStore.appointments.find((a) => (a.start as Date) < reqEnd && (a.end as Date) > reqStart) || null;
    }
    return null;
  };

  (Appointment as AnyModel).find = async (query?: Record<string, unknown>) => {
    if (query?.patientEmail) {
      return localStore.appointments.filter(
        (a) => (a.patientEmail as string)?.toLowerCase() === (query.patientEmail as string).toLowerCase()
      );
    }
    if (query?.bookingId) {
      return localStore.appointments.filter((a) => a.bookingId === query.bookingId);
    }
    return localStore.appointments;
  };

  (Appointment as AnyModel).create = async (data: Record<string, unknown>) => {
    const newApp = { ...data, _id: String(Date.now()), save: async () => newApp };
    localStore.appointments.push(newApp);
    return newApp;
  };

  (Appointment as AnyModel).findOneAndUpdate = async (
    query: Record<string, unknown>,
    update: { $set: Record<string, unknown> }
  ) => {
    let idx = -1;
    if (query.bookingId) {
      idx = localStore.appointments.findIndex((a) => a.bookingId === query.bookingId);
    } else if (query.patientEmail) {
      idx = localStore.appointments.findIndex((a) => a.patientEmail === query.patientEmail);
    }
    if (idx === -1) return null;
    localStore.appointments[idx] = { ...localStore.appointments[idx], ...update.$set };
    return localStore.appointments[idx];
  };

  (Appointment as AnyModel).updateOne = async (
    query: Record<string, unknown>,
    update: { $set: Record<string, unknown> }
  ) => {
    let idx = -1;
    if (query.bookingId) {
      idx = localStore.appointments.findIndex((a) => a.bookingId === query.bookingId);
    } else if (query.patientEmail && query.status) {
      idx = localStore.appointments.findIndex(
        (a) => a.patientEmail === query.patientEmail && a.status === query.status
      );
    }
    if (idx === -1) return { modifiedCount: 0 };
    localStore.appointments[idx] = { ...localStore.appointments[idx], ...update.$set };
    return { modifiedCount: 1 };
  };

  (Appointment as AnyModel).deleteOne = async (query: Record<string, unknown>) => {
    const idx = localStore.appointments.findIndex((a) => a.bookingId === query.bookingId);
    if (idx !== -1) localStore.appointments.splice(idx, 1);
    return { deletedCount: 1 };
  };

  (FollowUp as AnyModel).create = async (data: Record<string, unknown>) => {
    const fu = { ...data, _id: String(Date.now()), status: 'pending' };
    localStore.followUps.push(fu);
    return fu;
  };

  (FollowUp as AnyModel).find = async (query?: { scheduledTime?: { $lte?: Date }; status?: string }) => {
    const now = query?.scheduledTime?.$lte || new Date();
    return localStore.followUps
      .filter((fu) => fu.status === 'pending' && (fu.scheduledTime as Date) <= now)
      .map((fu) => ({
        ...fu,
        save: async () => {
          const idx = localStore.followUps.findIndex((f) => f._id === fu._id);
          if (idx !== -1) localStore.followUps[idx] = { ...fu };
        },
      }));
  };
}

export async function connectWorkerDatabase(logger: {
  info: (msg: string) => void;
  error: (msg: string) => void;
  warn: (msg: string) => void;
}) {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/moazbackend';

  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
    logger.info('✅ MongoDB Connected');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`❌ MongoDB Connection Failed: ${message}`);
    logger.warn('⚠️  RUNNING IN MOCK MODE — data will not persist between restarts.');
    usingMockMode = true;
    patchModelsForMockMode();
  }
}
