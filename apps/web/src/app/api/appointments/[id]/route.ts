import { NextResponse } from 'next/server';
import { Appointment, connectToDatabase } from '@crm-eye/database';
import { deleteFromGoogleCalendar } from '@crm-eye/shared';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    if (appointment.googleEventId) {
      try {
        await deleteFromGoogleCalendar(appointment.googleEventId);
        console.log(`Deleted Google Event: ${appointment.googleEventId}`);
      } catch (gErr: unknown) {
        const message = gErr instanceof Error ? gErr.message : String(gErr);
        console.error('Failed to delete Google Calendar event:', message);
      }
    }

    await Appointment.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('DELETE appointment error:', error);
    return NextResponse.json({ error: 'Failed to delete appointment' }, { status: 500 });
  }
}
