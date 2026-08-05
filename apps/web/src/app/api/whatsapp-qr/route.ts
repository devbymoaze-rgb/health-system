import { NextResponse } from 'next/server';
import { connectToDatabase, isDatabaseConnected } from '@crm-eye/database';
import { getWhatsAppQr } from '@crm-eye/shared';

export async function GET() {
  try {
    await connectToDatabase();
    if (!isDatabaseConnected()) {
      return NextResponse.json({ qr: null });
    }

    const qr = await getWhatsAppQr();
    return NextResponse.json({ qr });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('GET /api/whatsapp-qr error:', message);
    return NextResponse.json({ qr: null });
  }
}
