import { FollowUp } from '@crm-eye/database';
import type { Logger } from './google';

export async function scheduleFollowUp(
  remoteJid: string,
  message: string,
  scheduledTime: Date,
  logger?: Logger
) {
  const jid = remoteJid.includes('@') ? remoteJid : `${remoteJid}@s.whatsapp.net`;
  try {
    await FollowUp.create({ remoteJid: jid, message, scheduledTime, status: 'pending' });
    logger?.info?.(`📬 Follow-up scheduled for ${jid} at ${scheduledTime}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger?.error?.(`Schedule Follow-up Error: ${msg}`);
  }
}

export async function processPendingFollowUps(
  sendMessage: (jid: string, text: string) => Promise<void>,
  logger?: Logger
) {
  try {
    const pending = await FollowUp.find({ status: 'pending', scheduledTime: { $lte: new Date() } });
    for (const fu of pending) {
      try {
        const jid = fu.remoteJid?.includes('@') ? fu.remoteJid : `${fu.remoteJid}@s.whatsapp.net`;
        await sendMessage(jid, fu.message || '');
        fu.status = 'sent';
        await fu.save();
        logger?.info?.(`✅ Follow-up sent to ${jid}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        logger?.error?.(`Follow-up send failed: ${msg}`);
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger?.error?.(`Follow-up checker error: ${msg}`);
  }
}
