import { connectToDatabase, isDatabaseConnected, Settings } from '@crm-eye/database';
import type { Types } from 'mongoose';

export type WhatsAppStatus = 'disconnected' | 'qr_pending' | 'connected';

export type WhatsAppState = {
  qr: string | null;
  status: WhatsAppStatus;
  workerActive: boolean;
};

const WORKER_STALE_MS = 120_000;

async function ensureDatabase() {
  await connectToDatabase();
  if (!isDatabaseConnected()) {
    throw new Error('Database is not connected');
  }
}

async function resolveSettingsId(): Promise<Types.ObjectId> {
  const existing = await Settings.findOne().sort({ updatedAt: -1 });
  if (existing) return existing._id;
  const created = await Settings.create({ autoResponseEnabled: true });
  return created._id;
}

export async function getWhatsAppState(): Promise<WhatsAppState> {
  await ensureDatabase();

  const qrDoc = await Settings.findOne({
    whatsappQr: { $exists: true, $nin: [null, ''] },
  })
    .sort({ whatsappQrUpdatedAt: -1 })
    .select('whatsappQr')
    .lean();

  const statusDoc = await Settings.findOne()
    .sort({ whatsappWorkerSeenAt: -1, updatedAt: -1 })
    .select('whatsappStatus whatsappWorkerSeenAt')
    .lean();

  const workerSeenAt = statusDoc?.whatsappWorkerSeenAt;
  const workerActive = Boolean(
    workerSeenAt && Date.now() - new Date(workerSeenAt).getTime() < WORKER_STALE_MS
  );

  return {
    qr: qrDoc?.whatsappQr || null,
    status: (statusDoc?.whatsappStatus as WhatsAppStatus) || 'disconnected',
    workerActive,
  };
}

export async function getWhatsAppQr(): Promise<string | null> {
  const state = await getWhatsAppState();
  return state.qr;
}

export async function setWhatsAppQr(qr: string | null): Promise<void> {
  await ensureDatabase();
  const settingsId = await resolveSettingsId();
  await Settings.findByIdAndUpdate(settingsId, {
    $set: {
      whatsappQr: qr ?? null,
      whatsappQrUpdatedAt: new Date(),
      whatsappStatus: qr ? 'qr_pending' : 'disconnected',
    },
  });
}

export async function setWhatsAppStatus(status: WhatsAppStatus): Promise<void> {
  await ensureDatabase();
  const settingsId = await resolveSettingsId();
  await Settings.findByIdAndUpdate(settingsId, {
    $set: { whatsappStatus: status },
  });
}

export async function touchWhatsAppWorker(): Promise<void> {
  await ensureDatabase();
  const settingsId = await resolveSettingsId();
  await Settings.findByIdAndUpdate(settingsId, {
    $set: { whatsappWorkerSeenAt: new Date() },
  });
}

export async function requestWhatsAppReset(): Promise<void> {
  await ensureDatabase();
  const settingsId = await resolveSettingsId();
  await Settings.findByIdAndUpdate(settingsId, {
    $set: {
      whatsappQr: null,
      whatsappResetRequestedAt: new Date(),
      whatsappStatus: 'disconnected',
    },
  });
}

export async function getWhatsAppResetRequestedAt(): Promise<Date | null> {
  await ensureDatabase();
  const settings = await Settings.findOne()
    .sort({ whatsappResetRequestedAt: -1 })
    .select('whatsappResetRequestedAt')
    .lean();
  return settings?.whatsappResetRequestedAt ?? null;
}

export async function clearWhatsAppResetRequest(): Promise<void> {
  await ensureDatabase();
  const settingsId = await resolveSettingsId();
  await Settings.findByIdAndUpdate(settingsId, {
    $unset: { whatsappResetRequestedAt: '' },
  });
}
