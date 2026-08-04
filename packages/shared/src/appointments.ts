import { Appointment } from '@crm-eye/database';
import { CLINIC_END_HOUR, CLINIC_START_HOUR, TIMEZONE } from './constants';
import { formatPKTDateTime, isSunday, parsePKT } from './dates';
import { deleteFromGoogleCalendar, syncToGoogleCalendar, updateGoogleCalendarEvent, type Logger } from './google';
import { scheduleFollowUp } from './followups';

export async function checkAvailability(startTime: string, endTime: string) {
  const start = parsePKT(startTime);
  const end = parsePKT(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { available: false, reason: 'Invalid date/time format provided.' };
  }
  if (start < new Date()) {
    return { available: false, reason: 'Cannot book an appointment in the past.' };
  }
  if (isSunday(startTime)) {
    return {
      available: false,
      reason: 'The clinic is closed on Sundays. Please choose a different day (Monday to Saturday).',
    };
  }

  const karachiHour = parseInt(
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: TIMEZONE,
    }).format(start)
  );

  if (karachiHour < CLINIC_START_HOUR || karachiHour >= CLINIC_END_HOUR) {
    return {
      available: false,
      reason: 'Clinic hours are 9:00 AM to 5:00 PM (PKT). Please choose a time within this range.',
    };
  }

  const conflict = await Appointment.findOne({
    start: { $lt: end },
    end: { $gt: start },
    status: 'confirmed',
  });

  return conflict
    ? { available: false, reason: 'This time slot is already booked. Please choose a different time.' }
    : { available: true, message: 'The slot is available.' };
}

export async function getAvailableTimeSlots(dateISO: string) {
  const availableSlots = [];

  for (let hour = CLINIC_START_HOUR; hour < CLINIC_END_HOUR; hour++) {
    const startTime = `${dateISO}T${hour.toString().padStart(2, '0')}:00:00+05:00`;
    const endTime = `${dateISO}T${(hour + 1).toString().padStart(2, '0')}:00:00+05:00`;

    const availability = await checkAvailability(startTime, endTime);
    if (availability.available) {
      const time12hr = hour <= 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`;
      availableSlots.push({ time: time12hr, startTime, endTime });
    }
  }

  return availableSlots;
}

export async function getPatientAppointments(email: string) {
  try {
    return await Appointment.find({
      patientEmail: email.toLowerCase().trim(),
      status: 'confirmed',
      start: { $gte: new Date() },
    }).sort({ start: 1 });
  } catch {
    return [];
  }
}

export async function hasExistingAppointment(email: string) {
  const appointments = await getPatientAppointments(email);
  return appointments.length > 0;
}

export async function createAppointment(
  data: {
    title?: string;
    startTime: string;
    endTime?: string;
    patientName: string;
    patientEmail: string;
    patientContact?: string;
  },
  logger?: Logger
) {
  try {
    const start = parsePKT(data.startTime);
    const end = parsePKT(data.endTime || new Date(start.getTime() + 3600000).toISOString());

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { success: false, error: 'Invalid date format.' };
    }

    if (isSunday(data.startTime)) {
      return {
        success: false,
        error: 'The clinic is closed on Sundays. Please choose a different day (Monday to Saturday).',
      };
    }

    const existingAppointments = await Appointment.find({
      patientEmail: data.patientEmail.toLowerCase().trim(),
      status: 'confirmed',
      start: { $gte: new Date() },
    });

    if (existingAppointments.length > 0) {
      const existingBooking = existingAppointments[0];
      return {
        success: false,
        error: `You already have an existing appointment scheduled for ${formatPKTDateTime(new Date(existingBooking.start))}. Would you like to modify or cancel that appointment instead?`,
        existingBooking: {
          bookingId: existingBooking.bookingId,
          scheduledFor: existingBooking.start,
        },
      };
    }

    const conflict = await Appointment.findOne({
      start: { $lt: end },
      end: { $gt: start },
      status: 'confirmed',
    });
    if (conflict) {
      return { success: false, error: 'This time slot is already booked. Please choose another time.' };
    }

    const bookingId = `BK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const appointment = await Appointment.create({
      title: data.title || 'Eye Checkup',
      start,
      end,
      patientName: data.patientName,
      patientEmail: data.patientEmail.toLowerCase().trim(),
      patientContact: data.patientContact || '',
      bookingId,
      status: 'confirmed',
    });

    logger?.info?.(`✅ Appointment Created: ${bookingId}`);

    const googleEvent = await syncToGoogleCalendar(appointment, logger);
    if (googleEvent && appointment.save) {
      appointment.googleEventId = googleEvent.id ?? undefined;
      await appointment.save();
    }

    const reminderTime = new Date(start.getTime() - 3600000);
    if (reminderTime > new Date()) {
      const timeStr = formatPKTDateTime(start);
      await scheduleFollowUp(
        data.patientContact || '',
        `🏥 *Appointment Reminder*\n\nDear ${data.patientName}, your appointment at Dr. Moaz Eye Clinic is scheduled for *${timeStr}*.\n\nPlease arrive 10 minutes early. To reschedule, please contact us.\n\nThank you! 🙏`,
        reminderTime,
        logger
      );
    }

    return {
      success: true,
      bookingId,
      confirmedTime: formatPKTDateTime(start),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger?.error?.(`Create Appointment Error: ${message}`);
    return { success: false, error: 'Failed to create appointment. Please try again.' };
  }
}

export async function lookupAppointmentByEmail(email: string, logger?: Logger) {
  try {
    const appointments = await Appointment.find({
      patientEmail: email.toLowerCase().trim(),
      status: 'confirmed',
    }).sort({ start: 1 });

    if (!appointments || appointments.length === 0) {
      return { found: false, message: 'No confirmed appointments found for this email address.' };
    }

    const upcoming = appointments.filter((a) => new Date(a.start) >= new Date());
    const past = appointments.filter((a) => new Date(a.start) < new Date());

    if (upcoming.length === 0) {
      if (past.length > 0) {
        return {
          found: false,
          message: `You have ${past.length} past appointment(s) but no upcoming appointments. Would you like to book a new appointment?`,
        };
      }
      return { found: false, message: 'No appointments found for this email address.' };
    }

    return {
      found: true,
      count: upcoming.length,
      appointments: upcoming.map((a) => ({
        bookingId: a.bookingId,
        patientName: a.patientName,
        patientEmail: a.patientEmail,
        patientContact: a.patientContact || 'N/A',
        scheduledFor: formatPKTDateTime(new Date(a.start)),
        title: a.title,
        status: a.status,
        googleEventId: a.googleEventId,
      })),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger?.error?.(`Lookup Appointment Error: ${message}`);
    return { found: false, message: 'Error looking up appointment. Please try again.' };
  }
}

export async function updateAppointment(
  bookingId: string,
  updates: {
    patientName?: string;
    patientEmail?: string;
    patientContact?: string;
    newStartTime?: string;
    newEndTime?: string;
  },
  logger?: Logger
) {
  try {
    const setData: Record<string, unknown> = {};
    if (updates.patientName) setData.patientName = updates.patientName;
    if (updates.patientEmail) setData.patientEmail = updates.patientEmail.toLowerCase().trim();
    if (updates.patientContact) setData.patientContact = updates.patientContact;

    if (updates.newStartTime) {
      if (isSunday(updates.newStartTime)) {
        return {
          success: false,
          error: 'The clinic is closed on Sundays. Please choose a different day (Monday to Saturday).',
        };
      }

      const newStart = parsePKT(updates.newStartTime);
      const newEnd = updates.newEndTime
        ? parsePKT(updates.newEndTime)
        : new Date(newStart.getTime() + 3600000);
      if (isNaN(newStart.getTime())) return { success: false, error: 'Invalid new date/time.' };

      const conflict = await Appointment.findOne({
        bookingId: { $ne: bookingId },
        start: { $lt: newEnd },
        end: { $gt: newStart },
        status: 'confirmed',
      });
      if (conflict) {
        return { success: false, error: 'That time slot is already booked. Please choose another.' };
      }

      setData.start = newStart;
      setData.end = newEnd;
    }

    const updated = await Appointment.findOneAndUpdate(
      { bookingId, status: 'confirmed' },
      { $set: setData },
      { new: true }
    );
    if (!updated) return { success: false, error: 'Appointment not found or already cancelled.' };

    if (updates.newStartTime && updated.googleEventId) {
      await updateGoogleCalendarEvent(updated, logger);
    }

    return {
      success: true,
      message: 'Appointment updated successfully.',
      updatedDetails: {
        bookingId: updated.bookingId,
        patientName: updated.patientName,
        patientEmail: updated.patientEmail,
        scheduledFor: formatPKTDateTime(new Date(updated.start)),
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger?.error?.(`Update Appointment Error: ${message}`);
    return { success: false, error: 'Failed to update appointment.' };
  }
}

export async function cancelAppointment(bookingId: string, logger?: Logger) {
  try {
    const appointment = await Appointment.findOne({ bookingId, status: 'confirmed' });
    if (!appointment) {
      return { success: false, error: 'Appointment not found or already cancelled.' };
    }

    if (appointment.googleEventId) {
      await deleteFromGoogleCalendar(appointment.googleEventId, logger);
    }

    const result = await Appointment.deleteOne({ bookingId });

    return result.deletedCount === 0
      ? { success: false, error: 'Appointment not found.' }
      : { success: true, message: 'Appointment cancelled and removed successfully.' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger?.error?.(`Cancel Appointment Error: ${message}`);
    return { success: false, error: 'Failed to cancel appointment.' };
  }
}

export async function getAvailableSlotsForDate(dateISO: string, logger?: Logger) {
  try {
    if (isSunday(dateISO)) {
      return {
        success: false,
        error: 'The clinic is closed on Sundays. Please choose a different day (Monday to Saturday).',
      };
    }

    const availableSlots = await getAvailableTimeSlots(dateISO);

    if (availableSlots.length === 0) {
      return {
        success: false,
        error: 'No available slots on this day. Please choose another day.',
      };
    }

    const slotOptions = availableSlots.map((slot) => slot.time).join(', ');

    return {
      success: true,
      slots: availableSlots,
      message: `Available time slots: ${slotOptions}. Please let me know which time works best for you.`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger?.error?.(`Get Available Slots Error: ${message}`);
    return { success: false, error: 'Failed to fetch available slots.' };
  }
}
