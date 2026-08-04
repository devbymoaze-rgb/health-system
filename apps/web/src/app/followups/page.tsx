'use client';

import { useState, useEffect } from 'react';
import { Bell, Clock, CheckCircle, AlertCircle, Trash2, RefreshCw, Phone } from 'lucide-react';
import { format } from 'date-fns';

export default function FollowUpsPage() {
  const [followups, setFollowups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFollowUps = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setRefreshing(true);
    try {
      const res = await fetch('/api/followups');
      const data = await res.json();
      if (Array.isArray(data)) {
        setFollowups(data);
      }
    } catch (error) {
      console.error('Error fetching follow-ups:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await fetch('/api/followups', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      fetchFollowUps(true);
    } catch (error) {
      console.error('Error deleting follow-up:', error);
    }
  };

  useEffect(() => {
    fetchFollowUps();
    const interval = setInterval(() => fetchFollowUps(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const safeFormat = (date: any, formatStr: string) => {
    const d = new Date(date);
    return isNaN(d.getTime()) ? 'Invalid Date' : format(d, formatStr);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-emerald-900 uppercase italic tracking-tight">Patient Follow-ups</h1>
          <p className="text-emerald-700/70 mt-2 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Automatic 10-minute reminders for your patients
          </p>
        </div>
        <button
          onClick={() => fetchFollowUps()}
          disabled={refreshing}
          className="p-3 rounded-2xl bg-white border border-emerald-100 text-emerald-600 hover:bg-emerald-50 transition-all disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="font-bold text-emerald-600">Loading follow-ups...</p>
          </div>
        ) : followups.length > 0 ? (
          followups.map((fu) => (
            <div key={fu._id} className={`bg-white p-6 rounded-3xl border-2 transition-all group relative ${
              fu.status === 'sent' ? 'border-emerald-50' : 'border-yellow-50'
            }`}>
              <button
                onClick={() => handleDelete(fu._id)}
                className="absolute top-4 right-4 p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  fu.status === 'sent' ? 'bg-emerald-50' : 'bg-yellow-50'
                }`}>
                  {fu.status === 'sent' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-emerald-900">
                    {fu.remoteJid.split('@')[0]}
                  </h3>
                  <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest inline-block ${
                    fu.status === 'sent' ? 'bg-emerald-100 text-emerald-600' : 'bg-yellow-100 text-yellow-600'
                  }`}>
                    {fu.status}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-bold text-emerald-900/80 leading-relaxed bg-emerald-50/30 p-4 rounded-2xl italic">
                  &quot;{fu.message}&quot;
                </p>
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-[11px] font-black text-emerald-400 uppercase tracking-tighter">
                    <Clock className="w-3.5 h-3.5" />
                    Scheduled: {safeFormat(fu.scheduledTime, 'hh:mm a, MMM dd')}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center bg-emerald-50/50 rounded-3xl border-2 border-dashed border-emerald-100">
            <Bell className="w-12 h-12 text-emerald-200 mx-auto mb-4" />
            <p className="text-emerald-900 font-black uppercase tracking-tight">No follow-ups yet</p>
            <p className="text-emerald-600/50 text-sm font-bold">Follow-ups will appear here after patients book appointments.</p>
          </div>
        )}
      </div>
    </div>
  );
}
