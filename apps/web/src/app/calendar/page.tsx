'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { 
  Plus, RefreshCw, Trash2, Calendar as CalendarIcon, 
  Clock, User, Phone, ExternalLink, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar-custom.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function CalendarPage() {
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<any>(Views.WEEK);

  const [newApt, setNewApt] = useState({
    title: '',
    date: '',
    time: '',
    patientName: '',
    patientEmail: '',
    patientContact: ''
  });

  // ✅ Hydration fix
  useEffect(() => {
    setMounted(true);
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data?.googleTokens) {
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  // ✅ SAFE DATE FORMATTER (FORCES PKT FOR DISPLAY)
  const safeFormat = (date: any, formatStr: string) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';

    // Get date parts in Asia/Karachi timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(d);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    const hour = parts.find(p => p.type === 'hour')?.value;
    const minute = parts.find(p => p.type === 'minute')?.value;

    // Create a "fake" local date that has the same numbers as PKT
    // This ensures date-fns format() works as expected
    const pktDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
    return format(pktDate, formatStr);
  };

  // ✅ CONVERT DATE TO "PKT-LOCAL" FOR CALENDAR GRID
  const toPKTDate = (date: any) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return d;
    
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Karachi',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(d);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    const hour = parts.find(p => p.type === 'hour')?.value;
    const minute = parts.find(p => p.type === 'minute')?.value;
    
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
  };

  // ✅ Combine local and Google events for the calendar
  const allEvents = useMemo(() => {
    // 1. Get all local CRM booking Google IDs to avoid duplicates
    const localGoogleIds = new Set(
      events.map(e => e.googleEventId).filter(id => !!id)
    );

    const local = events.map(e => ({
      id: e._id,
      title: `${e.title} - ${e.patientName}`,
      start: toPKTDate(e.start),
      end: toPKTDate(e.end),
      resource: e,
      color: '#10b981' // emerald-500
    }));

    // 2. Filter out Google events that are already represented as local CRM bookings
    const google = googleEvents
      .filter(e => !localGoogleIds.has(e.id))
      .map(e => ({
        id: e.id,
        title: e.title,
        start: toPKTDate(e.start),
        end: toPKTDate(e.end),
        resource: e,
        color: '#3b82f6' // blue-500
      }));

    return [...local, ...google];
  }, [events, googleEvents]);

  // ✅ FETCH EVERYTHING
  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setRefreshing(true);

    try {
      // Fetch local appointments
      const resLocal = await fetch('/api/appointments');
      if (resLocal.ok) {
        const data = await resLocal.json();
        setEvents(Array.isArray(data) ? data : []);
      }

      // Fetch Google events if connected
      if (isConnected) {
        const resGoogle = await fetch('/api/calendar/events');
        if (resGoogle.ok) {
          const data = await resGoogle.json();
          setGoogleEvents(Array.isArray(data) ? data : []);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      if (!isSilent) setLoading(false);
      setRefreshing(false);
    }
  }, [isConnected]);

  useEffect(() => {
    if (mounted) {
      fetchData();
    }
  }, [mounted, fetchData]);

  // ✅ DELETE
  const handleDeleteApt = async (id: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;

    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchData(true);
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
    }
  };

  // ✅ ADD APPOINTMENT
  const handleAddApt = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ FORCE PKT (+05:00) when constructing the date
    const startStr = `${newApt.date}T${newApt.time}:00+05:00`;
    const start = new Date(startStr);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    if (isNaN(start.getTime())) {
      alert('Invalid date/time');
      return;
    }

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...newApt, 
          start: start.toISOString(), 
          end: end.toISOString() 
        })
      });

      const data = await res.json();

      if (!data.error) {
        setShowForm(false);
        fetchData(true);
        setNewApt({
          title: '',
          date: '',
          time: '',
          patientName: '',
          patientEmail: '',
          patientContact: ''
        });
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error adding appointment:', error);
    }
  };

  if (!mounted) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* HEADER */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-emerald-900 uppercase italic tracking-tight">
            Clinic Schedule
          </h1>
          <p className="text-emerald-700/70 mt-2 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Manage appointments from 9:00 AM to 5:00 PM
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => fetchData()}
            disabled={refreshing}
            className="p-3 rounded-2xl bg-white border border-emerald-100 text-emerald-600 hover:bg-emerald-50 transition-all disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowForm(true)}
            className="green-button flex items-center gap-2 px-6 py-3 rounded-2xl shadow-lg shadow-emerald-200"
          >
            <Plus className="w-5 h-5" /> ADD APPOINTMENT
          </button>
        </div>
      </header>

      {/* CALENDAR VIEW */}
      <div className="bg-white p-6 rounded-3xl border border-emerald-50 shadow-xl overflow-hidden min-h-[700px] relative">
        {!isConnected && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center mb-4 border border-yellow-100">
              <CalendarIcon className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-black text-emerald-900 uppercase italic">Google Calendar Not Connected</h3>
            <p className="text-emerald-700/60 font-bold max-w-md mt-2">
              Connect your Google account in settings to sync all your events.
            </p>
            <a 
              href="/settings" 
              className="mt-6 green-button px-8 py-3 rounded-xl shadow-lg shadow-emerald-200"
            >
              GO TO SETTINGS
            </a>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-bold text-emerald-900 uppercase">CRM Bookings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs font-bold text-emerald-900 uppercase">Google Events</span>
            </div>
          </div>
          
          <div className="flex bg-emerald-50 p-1 rounded-xl">
            {[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                  view === v ? 'bg-white text-emerald-600 shadow-sm' : 'text-emerald-400 hover:text-emerald-600'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <Calendar
          localizer={localizer}
          events={allEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          view={view}
          onView={(v) => setView(v)}
          date={currentDate}
          onNavigate={(d) => setCurrentDate(d)}
          min={new Date(0, 0, 0, 9, 0, 0)} // ✅ 9 AM
          max={new Date(0, 0, 0, 17, 0, 0)} // ✅ 5 PM
          eventPropGetter={(event: any) => ({
            style: {
              backgroundColor: event.color,
              borderRadius: '8px',
              border: 'none',
              fontSize: '11px',
              fontWeight: 'bold',
              padding: '2px 6px'
            }
          })}
          components={{
            toolbar: (props) => (
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-emerald-900 uppercase italic tracking-tighter">
                  {props.label}
                </h2>
                <div className="flex gap-2">
                  <button onClick={() => props.onNavigate('PREV')} className="p-2 hover:bg-emerald-50 rounded-xl text-emerald-600 transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button onClick={() => props.onNavigate('TODAY')} className="px-4 py-2 hover:bg-emerald-50 rounded-xl text-emerald-600 font-black text-xs uppercase tracking-widest transition-colors border border-emerald-100">
                    Today
                  </button>
                  <button onClick={() => props.onNavigate('NEXT')} className="p-2 hover:bg-emerald-50 rounded-xl text-emerald-600 transition-colors">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
            )
          }}
        />
      </div>

      {/* APPOINTMENTS LIST */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-emerald-900 uppercase italic">Recent Appointments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.length > 0 ? (
            events
              .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
              .map((apt: any) => (
                <div key={apt._id} className="bg-white p-6 rounded-3xl border-2 border-emerald-50 hover:border-emerald-200 transition-all group relative shadow-sm">
                  <button
                    onClick={() => handleDeleteApt(apt._id)}
                    className="absolute top-4 right-4 p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                      <CalendarIcon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-black text-emerald-900">{apt.title}</h3>
                      <p className="text-xs font-bold text-emerald-500 uppercase">{safeFormat(apt.start, 'EEEE, MMM dd')}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-emerald-700/70 font-bold">
                      <Clock className="w-4 h-4" />
                      {safeFormat(apt.start, 'hh:mm a')} - {safeFormat(apt.end, 'hh:mm a')}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-900 font-black">
                      <User className="w-4 h-4 text-emerald-400" />
                      {apt.patientName}
                    </div>
                    {apt.patientContact && (
                      <div className="flex items-center gap-2 text-sm text-emerald-700/60 font-bold">
                        <Phone className="w-4 h-4 text-emerald-400" />
                        {apt.patientContact}
                      </div>
                    )}
                    {apt.bookingId && (
                      <div className="mt-4 pt-4 border-t border-emerald-50 flex items-center justify-between">
                        <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Booking ID</span>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{apt.bookingId}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
          ) : (
            <div className="col-span-full py-12 text-center bg-emerald-50/50 rounded-3xl border-2 border-dashed border-emerald-100">
              <CalendarIcon className="w-12 h-12 text-emerald-200 mx-auto mb-4" />
              <p className="text-emerald-900 font-black uppercase tracking-tight">No appointments scheduled</p>
              <p className="text-emerald-600/50 text-sm font-bold">Booked appointments will appear here.</p>
            </div>
          )}
        </div>
      </div>

      {/* ADD APPOINTMENT MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-emerald-950/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border-4 border-emerald-50 overflow-hidden">
            <div className="p-8 border-b border-emerald-50 bg-emerald-50/30">
              <h2 className="text-2xl font-black text-emerald-900 uppercase italic tracking-tight flex items-center gap-3">
                <Plus className="w-6 h-6 text-emerald-600" />
                Add New Appointment
              </h2>
            </div>
            
            <form onSubmit={handleAddApt} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1">Title</label>
                  <input className="green-input" placeholder="Eye Checkup"
                    value={newApt.title}
                    onChange={(e) => setNewApt({ ...newApt, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1">Patient Name</label>
                  <input className="green-input" placeholder="John Doe"
                    value={newApt.patientName}
                    onChange={(e) => setNewApt({ ...newApt, patientName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1">Contact</label>
                  <input className="green-input" placeholder="03001234567"
                    value={newApt.patientContact}
                    onChange={(e) => setNewApt({ ...newApt, patientContact: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1">Email</label>
                  <input className="green-input" type="email" placeholder="patient@example.com"
                    value={newApt.patientEmail}
                    onChange={(e) => setNewApt({ ...newApt, patientEmail: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1">Date</label>
                  <input className="green-input" type="date"
                    value={newApt.date}
                    onChange={(e) => setNewApt({ ...newApt, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1">Time</label>
                  <input className="green-input" type="time"
                    value={newApt.time}
                    onChange={(e) => setNewApt({ ...newApt, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  className="flex-1 px-6 py-4 rounded-2xl border-2 border-emerald-100 text-emerald-600 font-black uppercase tracking-widest hover:bg-emerald-50 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 green-button py-4 rounded-2xl shadow-lg shadow-emerald-200"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}