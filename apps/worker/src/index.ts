import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import { connectWorkerDatabase } from '@crm-eye/database';
import { buildSystemPrompt, clearAllSessions, getOpenAIResponse, startSessionCleanup } from '@crm-eye/ai';
import { Doctor, Settings } from '@crm-eye/database';
import { getWebPublicDir, getWorkerAuthDir, processPendingFollowUps } from '@crm-eye/shared';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import pino from 'pino';
import QRCode from 'qrcode';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const logger = pino({ level: 'info' });

let activeSock: ReturnType<typeof makeWASocket> | null = null;
let followUpIntervalId: ReturnType<typeof setInterval> | null = null;

function getPublicDir() {
  return getWebPublicDir();
}

function getAuthDir() {
  return getWorkerAuthDir();
}

function startFollowUpChecker() {
  if (followUpIntervalId) clearInterval(followUpIntervalId);
  followUpIntervalId = setInterval(async () => {
    if (!activeSock?.user) return;
    await processPendingFollowUps(async (jid, text) => {
      await activeSock!.sendMessage(jid, { text });
    }, logger);
  }, 30000);
}

async function startWhatsApp() {
  const authDir = getAuthDir();
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: 'silent' }),
  });

  activeSock = sock;
  sock.ev.on('creds.update', saveCreds);
  startFollowUpChecker();

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    const publicDir = getPublicDir();
    const qrPngPath = path.join(publicDir, 'qr.png');
    const qrTxtPath = path.join(publicDir, 'whatsapp-qr.txt');

    if (qr) {
      if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
      await QRCode.toFile(qrPngPath, qr);
      fs.writeFileSync(qrTxtPath, qr);
      const port = process.env.PORT || '3000';
      logger.info(`📱 QR Generated → http://localhost:${port}/whatsapp`);
    }

    if (connection === 'close') {
      const code = (lastDisconnect?.error as { output?: { statusCode?: number } })?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) {
        logger.info('🔄 Reconnecting WhatsApp...');
        setTimeout(startWhatsApp, 3000);
      } else {
        logger.warn('❌ Logged out. Starting fresh for new QR...');
        [qrPngPath, qrTxtPath].forEach((f) => {
          try {
            if (fs.existsSync(f)) fs.unlinkSync(f);
          } catch {
            /* ignore */
          }
        });
        clearAllSessions();
        setTimeout(startWhatsApp, 3000);
      }
    }

    if (connection === 'open') {
      logger.info('✅ WhatsApp Connected!');
      [qrPngPath, qrTxtPath].forEach((f) => {
        try {
          if (fs.existsSync(f)) fs.unlinkSync(f);
        } catch {
          /* ignore */
        }
      });
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg?.message || msg.key.fromMe) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      '';

    if (!text.trim()) return;

    const remoteJid = msg.key.remoteJid;
    if (!remoteJid) return;

    try {
      const [settings, doctor] = await Promise.all([Settings.findOne(), Doctor.findOne()]);
      if (!settings?.autoResponseEnabled) return;

      const apiKey = settings?.openaiApiKey || process.env.OPENAI_API_KEY;
      if (!apiKey || apiKey === 'your_openai_api_key_here' || apiKey === 'pending') {
        logger.warn('OpenAI API key not configured.');
        return;
      }

      await sock.sendPresenceUpdate('composing', remoteJid);
      const reply = await getOpenAIResponse(buildSystemPrompt(doctor || undefined), text, apiKey, remoteJid, logger);
      await sock.sendPresenceUpdate('paused', remoteJid);
      await sock.sendMessage(remoteJid, { text: reply });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`Message handler error: ${message}`);
      try {
        await sock.sendMessage(remoteJid, {
          text: 'I apologize for the inconvenience. Please try your message again.',
        });
      } catch {
        /* ignore */
      }
    }
  });
}

function startResetWatcher() {
  const resetFlag = path.join(getPublicDir(), 'whatsapp-reset.flag');
  setInterval(() => {
    if (fs.existsSync(resetFlag)) {
      logger.info('🔄 Reset signal detected. Logging out...');
      try {
        fs.unlinkSync(resetFlag);
        if (activeSock) {
          activeSock.logout().catch((err) => logger.error(`Logout error: ${err.message}`));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(`Error handling reset flag: ${message}`);
      }
    }
  }, 2000);
}

async function main() {
  startSessionCleanup(logger);
  await connectWorkerDatabase(logger);
  startResetWatcher();
  await startWhatsApp();
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  logger.error(`Startup Error: ${message}`);
  process.exit(1);
});
