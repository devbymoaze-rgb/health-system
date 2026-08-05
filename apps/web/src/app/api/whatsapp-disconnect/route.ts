import { NextResponse } from 'next/server';
import { connectToDatabase, isDatabaseConnected } from '@crm-eye/database';
import { requestWhatsAppReset } from '@crm-eye/shared';

export async function DELETE() {
  try {
    await connectToDatabase();
    if (!isDatabaseConnected()) {
      return NextResponse.json(
        { error: 'Database is not connected. Please check your MONGODB_URI.' },
        { status: 503 }
      );
    }

    await requestWhatsAppReset();

    return NextResponse.json({ message: 'Disconnected' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('DELETE /api/whatsapp-disconnect error:', message);
    return NextResponse.json({ error: 'Failed to disconnect', details: message }, { status: 500 });
  }
}
