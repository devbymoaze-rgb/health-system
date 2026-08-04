'use client';

import { useState, useEffect } from 'react';
import { Save, Key, Shield, MessageSquare, Calendar } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    openaiApiKey: '',
    whatsappNumber: '03153936205',
    autoResponseEnabled: true,
    googleTokens: null
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data && !data.error) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleConnect = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error getting auth URL:', error);
    }
  };

  const handleGoogleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar? This will stop appointment syncing.')) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/auth/google/disconnect', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSettings({ ...settings, googleTokens: null });
        alert('Google Calendar disconnected successfully.');
      }
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data && !data.error) {
        alert('Settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-4xl font-black text-emerald-900 tracking-tight uppercase italic">Settings</h1>
        <p className="text-emerald-700/70 mt-2 font-bold">Manage API keys and integration settings.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* OpenAI Configuration */}
        <section className="green-card overflow-hidden">
          <div className="p-6 border-b border-emerald-100 flex items-center gap-3 bg-emerald-50/30">
            <Shield className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-black text-emerald-900 uppercase tracking-tight">OpenAI Configuration</h2>
          </div>
          <div className="p-8 space-y-4">
            <div className="space-y-3">
              <label className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <Key className="w-4 h-4" /> OpenAI API Key
              </label>
              <input
                type="password"
                value={settings.openaiApiKey}
                onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                className="green-input"
                placeholder="sk-..."
                required
              />
              <p className="text-xs font-bold text-emerald-600/50 italic">This key is used for AI-powered chat and auto-responses.</p>
            </div>
          </div>
        </section>

        {/* WhatsApp Configuration */}
        <section className="green-card overflow-hidden">
          <div className="p-6 border-b border-emerald-100 flex items-center gap-3 bg-emerald-50/30">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-black text-emerald-900 uppercase tracking-tight">WhatsApp Integration</h2>
          </div>
          <div className="p-8 space-y-8">
            <div className="flex items-center justify-between p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100">
              <div className="space-y-1">
                <p className="font-black text-emerald-900">Auto-Response System</p>
                <p className="text-xs font-bold text-emerald-600/60 uppercase tracking-wider">Enable AI for incoming messages</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoResponseEnabled}
                  onChange={(e) => setSettings({ ...settings, autoResponseEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-emerald-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-emerald-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-emerald-400 uppercase tracking-widest">WhatsApp Number</label>
              <input
                type="text"
                value={settings.whatsappNumber}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                className="green-input"
                placeholder="03153936205"
                required
              />
            </div>
          </div>
        </section>

        {/* Google Calendar Integration */}
        <section className="green-card overflow-hidden">
          <div className="p-6 border-b border-emerald-100 flex items-center gap-3 bg-emerald-50/30">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-black text-emerald-900 uppercase tracking-tight">Google Calendar Setup</h2>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <p className="font-black text-emerald-900">Sync Appointments</p>
                <p className="text-xs font-bold text-emerald-600/60 uppercase tracking-wider">Connect to your Google account</p>
              </div>
              <button
                type="button"
                onClick={settings.googleTokens ? handleGoogleDisconnect : handleGoogleConnect}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black transition-all shadow-sm active:scale-95 border-2 ${
                  settings.googleTokens 
                    ? 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100' 
                    : 'bg-white border-emerald-100 text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <Calendar className="w-5 h-5" />
                {settings.googleTokens ? 'DISCONNECT CALENDAR' : 'CONNECT GOOGLE CALENDAR'}
              </button>
            </div>
            
            {settings.googleTokens && (
              <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-emerald-50 shrink-0">
                  <Shield className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-black text-emerald-900 uppercase tracking-tight">Status: Active</p>
                  <p className="text-xs font-bold text-emerald-600/70 mt-1">
                    Your appointments will now automatically sync to your Google Calendar.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="green-button min-w-[250px] text-lg uppercase tracking-widest"
          >
            {saving ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div> : <Save className="w-6 h-6" />}
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
