import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { connectToDatabase, Settings } from '@crm-eye/database';

export async function GET() {
  try {
    await connectToDatabase();
    const settings = await Settings.findOne();

    if (!settings?.googleTokens) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 401 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials(settings.googleTokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - 30);

    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 60);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events =
      response.data.items?.map((event) => ({
        id: event.id,
        title: event.summary,
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        description: event.description,
        isGoogleEvent: true,
      })) || [];

    return NextResponse.json(events);
  } catch (error: unknown) {
    console.error('Fetch Google Events Error:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
