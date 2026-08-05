import { connectToDatabase, isDatabaseConnected, Settings } from '@crm-eye/database';

async function ensureDatabase() {
  await connectToDatabase();
  if (!isDatabaseConnected()) {
    throw new Error('Database is not connected');
  }
}

export async function getWhatsAppQr(): Promise<string | null> {
  await ensureDatabase();
  const settings = await Settings.findOne().select('whatsappQr').lean();
  return settings?.whatsappQr || null;
}

export async function setWhatsAppQr(qr: string | null): Promise<void> {
  await ensureDatabase();
  await Settings.findOneAndUpdate(
    {},
    { $set: { whatsappQr: qr ?? null } },
    { upsert: true, new: true }
  );
}

export async function requestWhatsAppReset(): Promise<void> {
  await ensureDatabase();
  await Settings.findOneAndUpdate(
    {},
    {
      $set: {
        whatsappQr: null,
        whatsappResetRequestedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );
}

export async function getWhatsAppResetRequestedAt(): Promise<Date | null> {
  await ensureDatabase();
  const settings = await Settings.findOne().select('whatsappResetRequestedAt').lean();
  return settings?.whatsappResetRequestedAt ?? null;
}

export async function clearWhatsAppResetRequest(): Promise<void> {
  await ensureDatabase();
  await Settings.findOneAndUpdate({}, { $unset: { whatsappResetRequestedAt: '' } });
}
