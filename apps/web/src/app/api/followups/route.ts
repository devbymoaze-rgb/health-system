import { NextResponse } from 'next/server';
import { connectToDatabase, FollowUp } from '@crm-eye/database';

export async function GET() {
  try {
    await connectToDatabase();
    const followups = await FollowUp.find({}).sort({ scheduledTime: -1 });
    return NextResponse.json(followups);
  } catch (error: unknown) {
    console.error('GET /api/followups error:', error);
    return NextResponse.json({ error: 'Failed to fetch follow-ups' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { id } = await req.json();
    await FollowUp.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('DELETE /api/followups error:', error);
    return NextResponse.json({ error: 'Failed to delete follow-up' }, { status: 500 });
  }
}
