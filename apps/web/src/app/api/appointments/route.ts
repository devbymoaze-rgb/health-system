import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Appointment, connectToDatabase } from '@crm-eye/database';
import { syncToGoogleCalendar } from '@crm-eye/shared';

export async function GET() {
  try {
    await connectToDatabase();
    if (mongoose.connection.readyState !== 1) {
      return NextResponse.json([]);
    }
    const appointments = await Appointment.find({}).sort({ start: 1 });
    return NextResponse.json(appointments);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('GET /api/appointments error:', message);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    if (mongoose.connection.readyState !== 1) {
      return NextResponse.json({ error: 'Database is offline. Appointment cannot be saved.' }, { status: 503 });
    }
    const data = await req.json();

    const conflictingAppointment = await Appointment.findOne({
      start: { $lt: data.end },
      end: { $gt: data.start },
    });

    if (conflictingAppointment) {
      return NextResponse.json({ error: 'A conflicting appointment already exists.' }, { status: 409 });
    }

    const bookingId = `BK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const appointment = await Appointment.create({ ...data, bookingId });
    await syncToGoogleCalendar(appointment);
    return NextResponse.json(appointment);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('POST /api/appointments error:', message);
    return NextResponse.json({ error: 'Failed to create appointment', details: message }, { status: 500 });
  }
}
