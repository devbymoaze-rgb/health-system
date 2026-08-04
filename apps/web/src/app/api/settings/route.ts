import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase, Settings } from '@crm-eye/database';

export async function GET() {
  try {
    await connectToDatabase();
    if (mongoose.connection.readyState !== 1) {
      return NextResponse.json({
        openaiApiKey: 'offline_demo_key',
        whatsappNumber: 'offline_demo_number',
        autoResponseEnabled: true,
      });
    }
    const settings = await Settings.findOne();
    return NextResponse.json(settings || {});
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('GET /api/settings error:', message);
    return NextResponse.json({
      openaiApiKey: '',
      whatsappNumber: '',
      autoResponseEnabled: false,
    });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const data = await req.json();

    let settings = await Settings.findOne();
    if (settings) {
      settings = await Settings.findByIdAndUpdate(settings._id, data, { new: true });
    } else {
      settings = await Settings.create(data);
    }

    return NextResponse.json(settings);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('POST /api/settings error:', message);
    return NextResponse.json({ error: 'Failed to save settings', details: message }, { status: 500 });
  }
}
