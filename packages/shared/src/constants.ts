import fs from 'fs';
import path from 'path';

export const TIMEZONE = 'Asia/Karachi';
export const SESSION_TIMEOUT = 30 * 60 * 1000;
export const CLINIC_START_HOUR = 9;
export const CLINIC_END_HOUR = 17;

export function getWebPublicDir(): string {
  if (process.env.WEB_PUBLIC_DIR) {
    return process.env.WEB_PUBLIC_DIR;
  }

  const cwd = process.cwd();
  const webPublic = path.join(cwd, 'public');
  if (fs.existsSync(path.join(cwd, 'next.config.mjs'))) {
    return webPublic;
  }

  const fromWorker = path.resolve(cwd, '../web/public');
  if (fs.existsSync(fromWorker)) {
    return fromWorker;
  }

  return path.resolve(cwd, 'apps/web/public');
}

export function getWorkerAuthDir(): string {
  if (process.env.WORKER_AUTH_DIR) {
    return process.env.WORKER_AUTH_DIR;
  }

  const cwd = process.cwd();
  const workerAuth = path.join(cwd, 'auth');
  if (fs.existsSync(workerAuth) || cwd.includes('worker')) {
    return workerAuth;
  }

  return path.resolve(cwd, 'apps/worker/auth');
}

export function getWorkerAuthDirFromWeb(): string {
  if (process.env.WORKER_AUTH_DIR) {
    return process.env.WORKER_AUTH_DIR;
  }
  return path.resolve(process.cwd(), '../worker/auth');
}
