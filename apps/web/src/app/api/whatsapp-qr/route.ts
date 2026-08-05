import { NextResponse } from 'next/server';
import { connectToDatabase, isDatabaseConnected } from '@crm-eye/database';
import { getWhatsAppState } from '@crm-eye/shared';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await connectToDatabase();
    if (!isDatabaseConnected()) {
      return NextResponse.json({
        qr: null,
        status: 'disconnected',
        workerActive: false,
      });
    }

    const state = await getWhatsAppState();
    return NextResponse.json(state, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('GET /api/whatsapp-qr error:', message);
    return NextResponse.json({
      qr: null,
      status: 'disconnected',
      workerActive: false,
    });
  }
}
