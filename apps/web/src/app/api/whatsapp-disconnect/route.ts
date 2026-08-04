import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getWorkerAuthDirFromWeb } from '@crm-eye/shared';

export async function DELETE() {
  const authPath = getWorkerAuthDirFromWeb();
  const qrTxtPath = path.join(process.cwd(), 'public', 'whatsapp-qr.txt');
  const qrPngPath = path.join(process.cwd(), 'public', 'qr.png');

  if (fs.existsSync(authPath)) {
    fs.rmSync(authPath, { recursive: true, force: true });
  }

  if (fs.existsSync(qrTxtPath)) fs.unlinkSync(qrTxtPath);
  if (fs.existsSync(qrPngPath)) fs.unlinkSync(qrPngPath);

  const resetFlag = path.join(process.cwd(), 'public', 'whatsapp-reset.flag');
  fs.writeFileSync(resetFlag, 'reset');

  return NextResponse.json({ message: 'Disconnected' });
}
