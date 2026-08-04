import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const filePath = path.join(process.cwd(), 'public', 'whatsapp-qr.txt');
  if (fs.existsSync(filePath)) {
    const qr = fs.readFileSync(filePath, 'utf-8');
    return NextResponse.json({ qr });
  } else {
    return NextResponse.json({ qr: null });
  }
}
