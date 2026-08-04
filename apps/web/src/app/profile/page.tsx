'use client';

import { useState, useEffect } from 'react';
import { Save, User, MapPin, Phone, Briefcase, Info } from 'lucide-react';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctor, setDoctor] = useState({
    name: '',
    specialization: '',
    experience: 0,
    clinicAddress: '',
    contactNumber: '',
    bio: ''
  });

  useEffect(() => {
    fetchDoctor();
  }, []);

  const fetchDoctor = async () => {
    try {
      const res = await fetch('/api/doctor');
      const data = await res.json();
      if (data && !data.error) {
        setDoctor(data);
      }
    } catch (error) {
      console.error('Error fetching doctor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doctor)
      });
      const data = await res.json();
      if (data && !data.error) {
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error saving doctor:', error);
      alert('Failed to update profile.');
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
        <h1 className="text-4xl font-black text-emerald-900 tracking-tight uppercase italic">Doctor Profile</h1>
        <p className="text-emerald-700/70 mt-2 font-bold">Manage your professional information and contact details.</p>
      </header>

      <form onSubmit={handleSubmit} className="green-card overflow-hidden">
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <User className="w-4 h-4" /> Full Name
              </label>
              <input
                type="text"
                value={doctor.name}
                onChange={(e) => setDoctor({ ...doctor, name: e.target.value })}
                className="green-input"
                placeholder="Dr. Moaz"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Specialization
              </label>
              <input
                type="text"
                value={doctor.specialization}
                onChange={(e) => setDoctor({ ...doctor, specialization: e.target.value })}
                className="green-input"
                placeholder="Ophthalmologist"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <Info className="w-4 h-4" /> Years of Experience
              </label>
              <input
                type="number"
                value={doctor.experience}
                onChange={(e) => setDoctor({ ...doctor, experience: parseInt(e.target.value) })}
                className="green-input"
                placeholder="10"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <Phone className="w-4 h-4" /> Contact Number
              </label>
              <input
                type="text"
                value={doctor.contactNumber}
                onChange={(e) => setDoctor({ ...doctor, contactNumber: e.target.value })}
                className="green-input"
                placeholder="03153936205"
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Clinic Address
            </label>
            <input
              type="text"
              value={doctor.clinicAddress}
              onChange={(e) => setDoctor({ ...doctor, clinicAddress: e.target.value })}
              className="green-input"
              placeholder="123 Health St, Eye City"
              required
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <Info className="w-4 h-4" /> Professional Bio
            </label>
            <textarea
              value={doctor.bio}
              onChange={(e) => setDoctor({ ...doctor, bio: e.target.value })}
              className="green-input h-40 resize-none"
              placeholder="Brief professional summary..."
              required
            ></textarea>
          </div>
        </div>

        <div className="bg-emerald-50/50 p-8 flex justify-end border-t border-emerald-100">
          <button
            type="submit"
            disabled={saving}
            className="green-button min-w-[200px]"
          >
            {saving ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Save className="w-5 h-5" />}
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
}
