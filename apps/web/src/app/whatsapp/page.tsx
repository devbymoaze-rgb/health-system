'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { MessageSquare, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function WhatsAppPage() {
  const [qr, setQr] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'disconnected' | 'connected'>('loading');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchQr();
    const interval = setInterval(fetchQr, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchQr = async () => {
    try {
      const res = await fetch('/api/whatsapp-qr');
      const data = await res.json();
      if (data.qr) {
        setQr(data.qr);
        setStatus('disconnected');
      } else {
        setQr(null);
        // If there's no QR and we haven't confirmed connected, keep looking
        // This is a simple status check
      }
    } catch (error) {
      console.error('Error fetching QR:', error);
    }
  };

  const handleReset = async () => {
    if (!confirm('This will delete your current session and require a new QR scan. Continue?')) return;
    setRefreshing(true);
    try {
      const res = await fetch('/api/whatsapp-reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('Session reset successfully. A new QR code will be generated shortly.');
        setQr(null);
        setStatus('disconnected');
      } else {
        alert('Failed to reset session: ' + data.error);
      }
    } catch (error) {
      console.error('Error resetting session:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect?')) return;
    await fetch('/api/whatsapp-disconnect', { method: 'DELETE' });
    setQr(null);
    setStatus('disconnected');
    alert('Successfully disconnected. A new QR code will be generated if needed.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-4xl font-black text-emerald-900 tracking-tight uppercase italic">WhatsApp Integration</h1>
        <p className="text-emerald-700/70 mt-2 font-bold">Connect your WhatsApp to enable AI-powered auto-responses and reminders.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Status Card */}
        <div className="green-card p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-emerald-900 uppercase tracking-tight">Connection Status</h2>
            <div className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 border-2 ${
              status === 'connected' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 
              status === 'disconnected' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-200' : 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
            }`}>
              <div className={`w-2.5 h-2.5 rounded-full ${
                status === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 
                status === 'disconnected' ? 'bg-yellow-500' : 'bg-emerald-500 animate-pulse'
              }`}></div>
              {status.toUpperCase()}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-emerald-50">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-black text-emerald-900 uppercase tracking-tight">Auto-Response Active</p>
                <p className="text-xs font-bold text-emerald-600/60 mt-1">AI will handle patient bookings and follow-up reminders automatically.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleReset}
              disabled={refreshing}
              className="w-full flex items-center justify-center gap-2 bg-emerald-900 text-white px-4 py-3 rounded-2xl font-black uppercase tracking-widest transition-all hover:bg-emerald-800 active:scale-95 shadow-lg shadow-emerald-200"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Reset & New QR
            </button>
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 px-4 py-2 rounded-xl font-bold transition-colors border border-red-100"
            >
              Disconnect Current
            </button>
          </div>
        </div>

        {/* QR Code Card */}
        <div className="green-card p-8 flex flex-col items-center justify-center space-y-8 bg-white relative overflow-hidden min-h-[400px]">
          <div className="absolute top-0 right-0 p-4 opacity-[0.05] pointer-events-none">
            <MessageSquare className="w-32 h-32 text-emerald-900" />
          </div>
          
          {qr ? (
            <>
              <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-emerald-200/50 border-4 border-emerald-50 relative z-10">
                <QRCodeSVG value={qr} size={256} />
              </div>
              <div className="text-center relative z-10">
                <p className="text-sm font-black text-emerald-900 uppercase tracking-widest">Scan QR Code</p>
                <p className="text-xs font-bold text-emerald-600/60 mt-2 max-w-[200px]">
                  Open WhatsApp on your phone and scan to link account.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center space-y-6 relative z-10">
              <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-emerald-900 uppercase italic tracking-tight">System Ready</h3>
                <p className="text-sm font-bold text-emerald-600/60 mt-2 max-w-[250px]">
                  WhatsApp is connected or waiting for service initialization. 
                  If you don&apos;t see a QR code, click <strong>Reset & New QR</strong>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
