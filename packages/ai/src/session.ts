import { SESSION_TIMEOUT } from '@crm-eye/shared';

type SessionData = {
  messages: Array<Record<string, unknown>>;
  lastUpdated: number;
  contextData: Record<string, string>;
  retryCount: number;
};

const sessionConversations = new Map<string, SessionData>();

export function startSessionCleanup(logger: { info: (msg: string) => void }) {
  setInterval(() => {
    const now = Date.now();
    for (const [jid, data] of sessionConversations.entries()) {
      if (now - data.lastUpdated > SESSION_TIMEOUT) {
        sessionConversations.delete(jid);
        logger.info(`🧹 Cleared session for ${jid} due to timeout`);
      }
    }
  }, 5 * 60 * 1000);
}

export function getSessionConversation(remoteJid: string) {
  let session = sessionConversations.get(remoteJid);
  if (!session) {
    session = {
      messages: [],
      lastUpdated: Date.now(),
      contextData: {},
      retryCount: 0,
    };
    sessionConversations.set(remoteJid, session);
  }
  session.lastUpdated = Date.now();
  return session;
}

export function updateSessionContext(remoteJid: string, extractedInfo: Record<string, string>) {
  const session = getSessionConversation(remoteJid);
  session.contextData = { ...session.contextData, ...extractedInfo };
  session.lastUpdated = Date.now();
}

export function clearSession(remoteJid: string, logger?: { info: (msg: string) => void }) {
  sessionConversations.delete(remoteJid);
  logger?.info?.(`🧹 Cleared session for ${remoteJid}`);
}

export function clearAllSessions() {
  sessionConversations.clear();
}
