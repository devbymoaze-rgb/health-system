'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  UserCircle, 
  Settings, 
  MessageSquare, 
  Calendar,
  Bell,
  Eye,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  if (pathname === '/login') return null;

  const handleLogout = () => {
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push('/login');
  };

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Doctor Profile', href: '/profile', icon: UserCircle },
    { label: 'Settings', href: '/settings', icon: Settings },
    { label: 'WhatsApp', href: '/whatsapp', icon: MessageSquare },
    { label: 'Calendar', href: '/calendar', icon: Calendar },
    { label: 'Follow-ups', href: '/followups', icon: Bell },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-emerald-600 text-white rounded-lg shadow-lg"
      >
        {isOpen ? <X /> : <Menu />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-emerald-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`
        fixed lg:relative inset-y-0 left-0 z-40
        flex flex-col h-screen w-72 bg-emerald-900 text-white border-r border-emerald-800
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center gap-3 p-8 border-b border-emerald-800">
          <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-400/30">
            <Eye className="w-8 h-8 text-emerald-400" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white uppercase italic">CRM Eye</span>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                  isActive 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 scale-[1.02]' 
                    : 'text-emerald-100 hover:bg-emerald-800 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-emerald-400 group-hover:text-emerald-300'}`} />
                <span className="font-bold tracking-wide uppercase text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-emerald-800 space-y-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-5 py-4 text-emerald-400 hover:bg-red-500/10 hover:text-red-400 rounded-2xl transition-all duration-group group"
          >
            <LogOut className="w-5 h-5 transition-colors group-hover:text-red-400" />
            <span className="font-bold tracking-wide uppercase text-sm">Logout</span>
          </button>

          <div className="flex items-center gap-4 px-5 py-4 bg-emerald-950/50 rounded-2xl border border-emerald-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black shadow-inner">
              M
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white truncate">Dr. Moaz</p>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Ophthalmologist</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
