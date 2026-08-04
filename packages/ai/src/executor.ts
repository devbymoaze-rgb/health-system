import {
  cancelAppointment,
  checkAvailability,
  createAppointment,
  formatPKTDateTime,
  getAvailableSlotsForDate,
  getPatientAppointments,
  hasExistingAppointment,
  lookupAppointmentByEmail,
  parsePKT,
  updateAppointment,
} from '@crm-eye/shared';

type Logger = { info?: (msg: string) => void; error?: (msg: string) => void };

export async function executeTool(
  name: string,
  args: Record<string, string>,
  remoteJid: string,
  logger?: Logger
) {
  logger?.info?.(`🔧 Tool: ${name} | Args: ${JSON.stringify(args)}`);

  if (name === 'checkAvailability') {
    return await checkAvailability(args.startTime, args.endTime);
  }

  if (name === 'getAvailableSlotsForDate') {
    return await getAvailableSlotsForDate(args.dateISO, logger);
  }

  if (name === 'checkExistingAppointments') {
    if (!args.email || args.email.trim() === '') {
      return { hasExisting: false, message: 'No email provided to check.' };
    }
    const hasExisting = await hasExistingAppointment(args.email);
    if (hasExisting) {
      const appointments = await getPatientAppointments(args.email);
      const nextAppointment = appointments[0];
      return {
        hasExisting: true,
        message: `This patient already has an appointment scheduled for ${formatPKTDateTime(new Date(nextAppointment.start))}. Ask if they want to modify this appointment instead of booking a new one.`,
        existingBookingId: nextAppointment.bookingId,
      };
    }
    return { hasExisting: false, message: 'No existing appointments found.' };
  }

  if (name === 'createAppointment') {
    const endTime =
      args.endTime || new Date(parsePKT(args.startTime).getTime() + 3600000).toISOString();
    return await createAppointment(
      {
        title: args.title || 'Eye Checkup',
        startTime: args.startTime,
        endTime,
        patientName: args.patientName,
        patientEmail: args.patientEmail || '',
        patientContact: remoteJid?.split('@')[0] || '',
      },
      logger
    );
  }

  if (name === 'lookupAppointmentByEmail') {
    return await lookupAppointmentByEmail(args.email, logger);
  }

  if (name === 'updateAppointment') {
    return await updateAppointment(args.bookingId, args, logger);
  }

  if (name === 'cancelAppointment') {
    return await cancelAppointment(args.bookingId, logger);
  }

  return { error: `Unknown tool: ${name}` };
}
