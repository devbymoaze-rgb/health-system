'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  Settings as SettingsIcon,
  CheckCircle2,
  XCircle,
  Activity
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [stats, setStats] = useState({
    patientsToday: 12,
    unreadMessages: 5,
    upcomingAppointments: 8,
    whatsappConnected: false,
    aiModelStatus: 'Active'
  });

  return (
    <div className="space-y-12 py-8">
      {/* Welcome Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black text-emerald-900 tracking-tight">
            Welcome back
          </h1>
          <p className="text-emerald-700/70 text-lg max-w-2xl font-bold">
            Manage your ophthalmology practice and AI-powered patient communication.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white p-5 rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-200/50">
          <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
            <Activity className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">System Status</p>
            <p className="text-sm font-black text-emerald-600 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              All Systems Operational
            </p>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Patients Today', value: stats.patientsToday, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Unread Messages', value: stats.unreadMessages, icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Upcoming', value: stats.upcomingAppointments, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'AI Status', value: stats.aiModelStatus, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <div key={i} className="green-card p-8 group cursor-default border-emerald-100 shadow-emerald-100">
            <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-emerald-100`}>
              <stat.icon className={`w-7 h-7 ${stat.color}`} />
            </div>
            <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">{stat.label}</p>
            <p className="text-4xl font-black text-emerald-900 mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="green-card p-8 relative overflow-hidden group shadow-emerald-100">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-700 pointer-events-none">
            <SettingsIcon className="w-48 h-48 text-emerald-900" />
          </div>
          <h2 className="text-2xl font-black text-emerald-900 mb-8 uppercase tracking-tight">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/profile" className="flex items-center gap-4 p-5 bg-emerald-50/50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-2xl border border-emerald-100 transition-all duration-300 group/item">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center group-hover/item:bg-emerald-500 transition-colors shadow-sm">
                <Users className="w-5 h-5 text-emerald-600 group-hover/item:text-white" />
              </div>
              <span className="font-black uppercase text-sm tracking-wide">Edit Profile</span>
            </Link>
            <Link href="/settings" className="flex items-center gap-4 p-5 bg-emerald-50/50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-2xl border border-emerald-100 transition-all duration-300 group/item">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center group-hover/item:bg-emerald-500 transition-colors shadow-sm">
                <SettingsIcon className="w-5 h-5 text-emerald-600 group-hover/item:text-white" />
              </div>
              <span className="font-black uppercase text-sm tracking-wide">API Settings</span>
            </Link>
          </div>
        </div>

        {/* Integration Status */}
        <div className="green-card p-8 shadow-emerald-100">
          <h2 className="text-2xl font-black text-emerald-900 mb-8 uppercase tracking-tight">Integration Health</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-5 bg-emerald-50/30 rounded-2xl border border-emerald-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-emerald-50">
                  <MessageSquare className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="font-black text-emerald-900 text-sm">WhatsApp Integration</p>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Baileys Service</p>
                </div>
              </div>
              {stats.whatsappConnected ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              ) : (
                <XCircle className="w-7 h-7 text-red-400" />
              )}
            </div>

            <div className="flex items-center justify-between p-5 bg-emerald-50/30 rounded-2xl border border-emerald-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-emerald-50">
                  <Calendar className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="font-black text-emerald-900 text-sm">Google Calendar</p>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Sync Active</p>
                </div>
              </div>
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
