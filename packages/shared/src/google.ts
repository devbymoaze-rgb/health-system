import { google } from 'googleapis';
import { Appointment, Settings } from '@crm-eye/database';
import { TIMEZONE } from './constants';

export type Logger = { info?: (msg: string) => void; error?: (msg: string) => void };

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export async function syncToGoogleCalendar(
  appointment: {
    title: string;
    patientName: string;
    patientContact?: string;
    patientEmail: string;
    start: Date;
    end: Date;
    bookingId?: string;
    _id?: unknown;
  },
  logger?: Logger
) {
  try {
    const settings = await Settings.findOne();
    if (!settings?.googleTokens) return null;

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials(settings.googleTokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary: appointment.title,
      description: `Patient: ${appointment.patientName}\nContact: ${appointment.patientContact}\nEmail: ${appointment.patientEmail}`,
      start: { dateTime: new Date(appointment.start).toISOString(), timeZone: TIMEZONE },
      end: { dateTime: new Date(appointment.end).toISOString(), timeZone: TIMEZONE },
    };

    const res = await calendar.events.insert({ calendarId: 'primary', requestBody: event });

    if (appointment.bookingId) {
      await Appointment.findOneAndUpdate(
        { bookingId: appointment.bookingId },
        { $set: { googleEventId: res.data.id } }
      );
    } else if (appointment._id) {
      await Appointment.findByIdAndUpdate(appointment._id, { googleEventId: res.data.id });
    }

    logger?.info?.(`📅 Google Calendar Event Created: ${res.data.htmlLink}`);
    return res.data;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger?.error?.(`Google Calendar Sync Error: ${message}`);
    return null;
  }
}

export async function deleteFromGoogleCalendar(googleEventId: string, logger?: Logger) {
  try {
    if (!googleEventId) return false;

    const settings = await Settings.findOne();
    if (!settings?.googleTokens) return false;

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials(settings.googleTokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({ calendarId: 'primary', eventId: googleEventId });
    logger?.info?.(`📅 Google Calendar Event Deleted: ${googleEventId}`);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger?.error?.(`Google Calendar Delete Error: ${message}`);
    return false;
  }
}

export async function updateGoogleCalendarEvent(
  appointment: {
    title: string;
    patientName: string;
    patientContact?: string;
    patientEmail: string;
    start: Date;
    end: Date;
    googleEventId?: string;
  },
  logger?: Logger
) {
  try {
    if (!appointment.googleEventId) return false;

    const settings = await Settings.findOne();
    if (!settings?.googleTokens) return false;

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials(settings.googleTokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary: appointment.title,
      description: `Patient: ${appointment.patientName}\nContact: ${appointment.patientContact}\nEmail: ${appointment.patientEmail}`,
      start: { dateTime: new Date(appointment.start).toISOString(), timeZone: TIMEZONE },
      end: { dateTime: new Date(appointment.end).toISOString(), timeZone: TIMEZONE },
    };

    await calendar.events.update({
      calendarId: 'primary',
      eventId: appointment.googleEventId,
      requestBody: event,
    });

    logger?.info?.(`📅 Google Calendar Event Updated: ${appointment.googleEventId}`);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger?.error?.(`Google Calendar Update Error: ${message}`);
    return false;
  }
}

export async function getGoogleCalendarEvents() {
  const settings = await Settings.findOne();
  if (!settings?.googleTokens) {
    throw new Error('Google Calendar not connected');
  }

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials(settings.googleTokens);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 50,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return res.data.items || [];
}
