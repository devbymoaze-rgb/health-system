import { NextResponse } from 'next/server';
import { connectToDatabase, Doctor, isDatabaseConnected } from '@crm-eye/database';

export async function GET() {
  try {
    await connectToDatabase();
    if (!isDatabaseConnected()) {
      return NextResponse.json({
        name: 'Demo Doctor (DB Offline)',
        specialization: 'Eye Specialist',
        bio: 'Database is not connected. This is demo data.',
      });
    }
    const doctor = await Doctor.findOne();
    return NextResponse.json(doctor || {});
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('GET /api/doctor error:', message);
    return NextResponse.json({
      name: 'Demo Doctor (Error)',
      specialization: 'Error',
      bio: 'Could not connect to database.',
    });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    if (!isDatabaseConnected()) {
      return NextResponse.json(
        { error: 'Database is not connected. Please check your MONGODB_URI.' },
        { status: 503 }
      );
    }

    const data = await req.json();

    let doctor = await Doctor.findOne();
    if (doctor) {
      doctor = await Doctor.findByIdAndUpdate(doctor._id, data, { new: true });
    } else {
      doctor = await Doctor.create(data);
    }

    return NextResponse.json(doctor);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('POST /api/doctor error:', message);
    return NextResponse.json({ error: 'Failed to save doctor details', details: message }, { status: 500 });
  }
}
