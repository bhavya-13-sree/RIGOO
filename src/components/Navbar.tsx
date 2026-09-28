import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { NotificationItem } from '../types/index.ts';
import {
  Bike,
  Shield,
  Bell,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Search,
  PlusCircle,
  Clock,
  CheckCircle,
  MapPin,
  ChevronDown,
  Sparkles,
  Users
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenAuth }) => {
  const { currentUser, logout, switchDemoUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadNotifications();
    }
  }, [currentUser]);

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
    } catch (err) {
      console.warn('Failed to load notifications');
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      await api.markNotificationRead(notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    }
    if (notif.related_ride_id) {
      setCurrentTab('my-rides');
    }
    setNotificationsOpen(false);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Title */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setCurrentTab(currentUser ? 'dashboard' : 'landing')}
              className="flex items-center gap-3 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1769D2] to-[#123F7A] flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition">
                <Bike className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xl tracking-tight text-[#123F7A]">
                    RIGOO
                  </span>
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-[#EAF3FF] text-[#1769D2] border border-[#1769D2]/20">
                    AI Bike Pool
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-500 -mt-0.5">
                  Share the Journey
                </p>
              </div>
            </button>

            {/* Desktop Navigation */}
            {currentUser && (
              <nav className="hidden md:flex items-center gap-1 ml-4">
                <button
                  onClick={() => setCurrentTab('dashboard')}
                  className={`px-3 py-2 text-sm font-semibold rounded-lg transition ${
                    currentTab === 'dashboard'
                      ? 'text-[#1769D2] bg-[#EAF3FF]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentTab('offer-ride')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition ${
                    currentTab === 'offer-ride'
                      ? 'text-[#1769D2] bg-[#EAF3FF]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  Offer Ride
                </button>
                <button
                  onClick={() => setCurrentTab('find-ride')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition ${
                    currentTab === 'find-ride'
                      ? 'text-[#1769D2] bg-[#EAF3FF]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  Find Ride
                </button>
                <button
                  onClick={() => setCurrentTab('my-rides')}
                  className={`px-3 py-2 text-sm font-semibold rounded-lg transition ${
                    currentTab === 'my-rides'
                      ? 'text-[#1769D2] bg-[#EAF3FF]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  My Rides
                </button>
                <button
                  onClick={() => setCurrentTab('ride-history')}
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg transition ${
                    currentTab === 'ride-history'
                      ? 'text-[#1769D2] bg-[#EAF3FF]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  History
                </button>
                <button
                  onClick={() => setCurrentTab('safety')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition ${
                    currentTab === 'safety'
                      ? 'text-[#1769D2] bg-[#EAF3FF]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Shield className="w-4 h-4 text-emerald-600" />
                  Safety Center
                </button>
              </nav>
            )}
          </div>

          {/* Right Action & User Profile */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <>
                {/* Demo Persona Switcher (For test session A: Rider, Session B: Passenger) */}
                <div className="relative hidden sm:block">
                  <button
                    onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                    title="Switch user for dual testing"
                  >
                    <Users className="w-3.5 h-3.5 text-[#1769D2]" />
                    <span>Switch Role</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {demoMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 text-xs">
                      <p className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Dual Testing Personas
                      </p>
                      <button
                        onClick={() => {
                          switchDemoUser('rethika@rigoo.in');
                          setDemoMenuOpen(false);
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-blue-50 transition flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-900">M. Rethika (Co-Founder)</p>
                          <p className="text-slate-500 text-[11px]">Rider · Karmanghat to LB Nagar</p>
                        </div>
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">
                          Rider
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          switchDemoUser('ananya@gmail.com');
                          setDemoMenuOpen(false);
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-emerald-50 transition flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-900">Ananya Sharma</p>
                          <p className="text-slate-500 text-[11px]">Passenger · Champapet route</p>
                        </div>
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">
                          Passenger
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          switchDemoUser('vikram@gmail.com');
                          setDemoMenuOpen(false);
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-slate-100 transition flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-900">Vikram Aditya</p>
                          <p className="text-slate-500 text-[11px]">Rider · Ring Road Corridor</p>
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
                          Rider
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setNotificationsOpen(!notificationsOpen);
                      setDemoMenuOpen(false);
                    }}
                    className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition relative"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                        <h4 className="font-bold text-sm text-slate-900">Notifications</h4>
                        <span className="text-xs text-slate-500">{notifications.length} updates</span>
                      </div>
                      <div className="max-h-72 overflow-y-auto space-y-2">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-4">No notifications yet</p>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => handleNotificationClick(n)}
                              className={`p-2.5 rounded-xl cursor-pointer text-xs transition ${
                                n.is_read ? 'bg-slate-50/60 text-slate-600' : 'bg-blue-50/80 text-slate-900 font-medium'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1 mb-1">
                                <span className="font-bold text-[#1769D2]">{n.title}</span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-slate-600 leading-snug">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Profile Pill */}
                <button
                  onClick={() => setCurrentTab('profile')}
                  className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition"
                >
                  <img
                    src={currentUser.profile_photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={currentUser.full_name}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-blue-500/20"
                  />
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                      {currentUser.full_name}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                      <CheckCircle className="w-2.5 h-2.5" />
                      Verified
                    </p>
                  </div>
                </button>

                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={onOpenAuth}
                  className="text-sm font-semibold text-slate-700 hover:text-[#1769D2] px-3 py-2 transition"
                >
                  Sign In
                </button>
                <button
                  onClick={onOpenAuth}
                  className="px-4 py-2 text-sm font-bold text-white bg-[#1769D2] hover:bg-[#123F7A] rounded-xl shadow-md shadow-blue-500/20 transition transform active:scale-95"
                >
                  Join RIGOO
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            {currentUser && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && currentUser && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-1">
          <button
            onClick={() => { setCurrentTab('dashboard'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-800 rounded-lg hover:bg-slate-100"
          >
            Dashboard
          </button>
          <button
            onClick={() => { setCurrentTab('offer-ride'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-800 rounded-lg hover:bg-slate-100"
          >
            Offer a Ride
          </button>
          <button
            onClick={() => { setCurrentTab('find-ride'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-800 rounded-lg hover:bg-slate-100"
          >
            Find a Ride
          </button>
          <button
            onClick={() => { setCurrentTab('my-rides'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-800 rounded-lg hover:bg-slate-100"
          >
            My Rides & Active Sessions
          </button>
          <button
            onClick={() => { setCurrentTab('ride-history'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-800 rounded-lg hover:bg-slate-100"
          >
            Ride History
          </button>
          <button
            onClick={() => { setCurrentTab('safety'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-800 rounded-lg hover:bg-slate-100"
          >
            Safety Center & Emergency SOS
          </button>
          <button
            onClick={() => { setCurrentTab('profile'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-800 rounded-lg hover:bg-slate-100"
          >
            My Profile & Emergency Contacts
          </button>
        </div>
      )}
    </header>
  );
};
