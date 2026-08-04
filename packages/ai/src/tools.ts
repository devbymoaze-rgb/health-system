export const TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'checkAvailability',
      description: 'Check if a specific time slot is available. Clinic hours: 9 AM–5 PM PKT, Mon–Sat.',
      parameters: {
        type: 'object',
        properties: {
          startTime: { type: 'string', description: 'ISO 8601 PKT e.g. 2026-05-09T10:00:00+05:00' },
          endTime: { type: 'string', description: 'ISO 8601 PKT e.g. 2026-05-09T11:00:00+05:00' },
        },
        required: ['startTime', 'endTime'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getAvailableSlotsForDate',
      description: 'Get all available time slots for a specific date. Call this when user asks for available times or says a date.',
      parameters: {
        type: 'object',
        properties: {
          dateISO: { type: 'string', description: 'ISO 8601 date e.g. 2026-05-09' },
        },
        required: ['dateISO'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'checkExistingAppointments',
      description: 'Check if a patient already has an existing appointment. Call this BEFORE creating a new appointment to prevent duplicates.',
      parameters: {
        type: 'object',
        properties: {
          email: { type: 'string', description: 'Patient email address to check' },
        },
        required: ['email'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'createAppointment',
      description: 'Book a confirmed appointment. ONLY call after patient explicitly confirms with yes/sure/ok/confirm AND after checking they have no existing appointments.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'e.g. Eye Checkup' },
          startTime: { type: 'string', description: 'ISO 8601 PKT' },
          endTime: { type: 'string', description: 'ISO 8601 PKT, 1 hour after start if omitted' },
          patientName: { type: 'string' },
          patientEmail: { type: 'string' },
        },
        required: ['title', 'startTime', 'patientName', 'patientEmail'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'lookupAppointmentByEmail',
      description: 'Look up all upcoming appointments for a patient by their email. Call this when patient wants to view, change, or cancel their booking.',
      parameters: {
        type: 'object',
        properties: {
          email: { type: 'string', description: 'Patient email address' },
        },
        required: ['email'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'updateAppointment',
      description: 'Update an existing appointment — reschedule, change name, email, or contact.',
      parameters: {
        type: 'object',
        properties: {
          bookingId: { type: 'string' },
          patientName: { type: 'string' },
          patientEmail: { type: 'string' },
          patientContact: { type: 'string' },
          newStartTime: { type: 'string', description: 'ISO 8601 PKT' },
          newEndTime: { type: 'string', description: 'ISO 8601 PKT' },
        },
        required: ['bookingId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'cancelAppointment',
      description: 'Permanently cancel and delete an existing appointment from both CRM and Google Calendar.',
      parameters: {
        type: 'object',
        properties: {
          bookingId: { type: 'string' },
        },
        required: ['bookingId'],
      },
    },
  },
];
