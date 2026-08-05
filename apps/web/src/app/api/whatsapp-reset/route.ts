import { NextResponse } from 'next/server';
import { connectToDatabase, isDatabaseConnected } from '@crm-eye/database';
import { requestWhatsAppReset } from '@crm-eye/shared';

export async function POST() {
  try {
    await connectToDatabase();
    if (!isDatabaseConnected()) {
      return NextResponse.json(
        { error: 'Database is not connected. Please check your MONGODB_URI.' },
        { status: 503 }
      );
    }

    await requestWhatsAppReset();

    return NextResponse.json({
      success: true,
      message: 'Session reset. A new QR code will be generated.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('POST /api/whatsapp-reset error:', message);
    return NextResponse.json({ error: 'Failed to reset session', details: message }, { status: 500 });
  }
}
