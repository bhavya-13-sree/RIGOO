import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import {
  Shield,
  PhoneCall,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Share2,
  Users,
  Compass,
  FileCheck
} from 'lucide-react';

export const SafetyCenterPage: React.FC = () => {
  const { currentUser, refreshUser } = useAuth();
  const [sosStatus, setSosStatus] = useState<string | null>(null);
  const [loadingSos, setLoadingSos] = useState(false);

  // Emergency contact editing
  const [contactName, setContactName] = useState(currentUser?.emergency_contact?.contact_name || '');
  const [contactPhone, setContactPhone] = useState(currentUser?.emergency_contact?.phone_number || '');
  const [contactRelation, setContactRelation] = useState(currentUser?.emergency_contact?.relationship || 'Parent');
  const [savedContactMsg, setSavedContactMsg] = useState(false);

  const handleTestSos = async () => {
    setLoadingSos(true);

    const dispatchSos = async (lat?: number, lng?: number) => {
      try {
        const res = await api.triggerEmergencySOS({
          latitude: lat,
          longitude: lng,
          address: lat && lng ? `GPS Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'Current Device Location',
        });
        setSosStatus(`Test Emergency Alert Dispatched! Reference: ${res.alert.alert_id}. SMS protocol triggered to emergency contact.`);
      } catch (err: any) {
        alert('SOS simulation failed');
      } finally {
        setLoadingSos(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => dispatchSos(pos.coords.latitude, pos.coords.longitude),
        () => dispatchSos(),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      dispatchSos();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">
          <Shield className="w-3.5 h-3.5" />
          <span>RIGOO Trust & Security Center</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#123F7A] tracking-tight">
          Safety First — Our Comprehensive Charter
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          At RIGOO, commuter safety is engineered into every single route match, live GPS ping, and verification tier.
        </p>
      </div>

      {/* Emergency Hotlines Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <a
          href="tel:112"
          className="p-5 rounded-3xl bg-red-50 border-2 border-red-200 text-red-900 flex items-center justify-between hover:bg-red-100 transition shadow-xs"
        >
          <div>
            <p className="text-xs font-bold text-red-500 uppercase tracking-wider">All-India Emergency</p>
            <h4 className="text-xl font-black">Police 112</h4>
            <p className="text-[11px] text-red-700">Instant Police & Medical Dispatch</p>
          </div>
          <PhoneCall className="w-6 h-6 text-red-600" />
        </a>

        <a
          href="tel:1091"
          className="p-5 rounded-3xl bg-pink-50 border-2 border-pink-200 text-pink-900 flex items-center justify-between hover:bg-pink-100 transition shadow-xs"
        >
          <div>
            <p className="text-xs font-bold text-pink-500 uppercase tracking-wider">Women In Distress</p>
            <h4 className="text-xl font-black">Helpline 1091</h4>
            <p className="text-[11px] text-pink-700">24/7 Women Safety Support</p>
          </div>
          <Shield className="w-6 h-6 text-pink-600" />
        </a>

        <a
          href="tel:+919490617444"
          className="p-5 rounded-3xl bg-blue-50 border-2 border-blue-200 text-blue-900 flex items-center justify-between hover:bg-blue-100 transition shadow-xs"
        >
          <div>
            <p className="text-xs font-bold text-[#1769D2] uppercase tracking-wider">Telangana Police</p>
            <h4 className="text-xl font-black">SHE Teams</h4>
            <p className="text-[11px] text-blue-700">Dedicated Hyderabad Transit Unit</p>
          </div>
          <Users className="w-6 h-6 text-[#1769D2]" />
        </a>
      </div>

      {/* Emergency SOS Simulation & Test Panel */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-black">
              SOS
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                1-Tap Emergency SOS Dispatch
              </h3>
              <p className="text-xs text-slate-500">
                Instantly captures live coordinates and triggers alerts to your primary emergency contact.
              </p>
            </div>
          </div>

          <button
            onClick={handleTestSos}
            disabled={loadingSos}
            className="px-5 py-2.5 rounded-xl font-black text-xs text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20 transition disabled:opacity-50"
          >
            {loadingSos ? 'Simulating...' : 'Test Emergency Protocol'}
          </button>
        </div>

        {sosStatus && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{sosStatus}</span>
          </div>
        )}
      </div>

      {/* 4 Pillars of Safety Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Pillar 1 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-base text-slate-900">Women-to-Women Matching Priority</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Verified female commuters can choose exclusive matching with verified female riders (like co-founders Rethika and Bhavya Sree). If none are available, we never automatically reassign you without consent.
          </p>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 italic">
            <b>Note:</b> Gender preference alone is never presented as proof of safety—all members undergo identity validation.
          </div>
        </div>

        {/* Pillar 2 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1769D2] flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-base text-slate-900">Mandatory Institutional Verification</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every rider and passenger must register with valid College ID (e.g. VNR VJIET, CBIT, Osmania) or corporate email. Pillion riders can check rider ratings, vehicle registration, and verified badges.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-base text-slate-900">Temporary Live Trip Sharing</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Generate an expiring sharing link for parents or friends. They can view your exact moving road route and ETA without needing to create an account. The link automatically expires when the trip ends.
          </p>
        </div>

        {/* Pillar 4 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-base text-slate-900">Continuous GPS Retention Purge</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Live GPS streaming operates only during pickup and active trips. Upon trip completion, precise coordinates are purged from live tables, retaining only necessary distance and timestamp history.
          </p>
        </div>

      </div>

    </div>
  );
};
