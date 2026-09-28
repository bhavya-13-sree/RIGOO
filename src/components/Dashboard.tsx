import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { OfferedRide, RideRequest, ConfirmedRide } from '../types/index.ts';
import {
  Bike,
  Search,
  PlusCircle,
  Navigation,
  Clock,
  Shield,
  CheckCircle2,
  Calendar,
  DollarSign,
  Leaf,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Users
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string, payload?: any) => void;
  onOpenTracking: (rideId: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onOpenTracking }) => {
  const { currentUser } = useAuth();
  const [offeredRides, setOfferedRides] = useState<OfferedRide[]>([]);
  const [riderRequests, setRiderRequests] = useState<RideRequest[]>([]);
  const [passengerRequests, setPassengerRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    if (!currentUser) return;
    try {
      const [ridesRes, riderReqRes, passReqRes] = await Promise.all([
        api.getRides({ status: 'OFFERED' }),
        api.getRiderRequests(),
        api.getPassengerRequests(),
      ]);
      setOfferedRides(ridesRes.rides || []);
      setRiderRequests(riderReqRes.requests || []);
      setPassengerRequests(passReqRes.requests || []);
    } catch (err) {
      console.warn('Dashboard data fetch failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (reqId: number) => {
    try {
      const res = await api.acceptRequest(reqId);
      await loadDashboardData();
      if (res.confirmed) {
        onOpenTracking(res.confirmed.ride_id);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (reqId: number) => {
    try {
      await api.rejectRequest(reqId);
      await loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to reject');
    }
  };

  const pendingRequestsCount = riderRequests.filter(r => r.status === 'PENDING').length;
  const activeBookings = passengerRequests.filter(r => r.status === 'ACCEPTED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#123F7A] to-[#1769D2] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-blue-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            <span>Verified Member · {currentUser?.college_or_org || 'Campus Commuter'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {currentUser?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-sm text-blue-100/90 leading-relaxed">
            Ready for your daily commute? RIGOO matches you with verified students and commuters travelling along the exact same corridor.
          </p>
        </div>

        {/* Stats strip inside banner */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/15 text-xs">
          <div>
            <p className="text-blue-200">Rides Offered</p>
            <p className="text-lg font-black text-white">{currentUser?.total_rides_offered || 0}</p>
          </div>
          <div>
            <p className="text-blue-200">Rides Taken</p>
            <p className="text-lg font-black text-white">{currentUser?.total_rides_taken || 0}</p>
          </div>
          <div>
            <p className="text-blue-200">Community Rating</p>
            <p className="text-lg font-black text-white">⭐ {currentUser?.rating_avg || 5.0}</p>
          </div>
          <div>
            <p className="text-blue-200">Fuel Saved</p>
            <p className="text-lg font-black text-emerald-300">₹{(currentUser?.total_rides_offered || 1) * 35}</p>
          </div>
        </div>

        {/* Background icon watermark */}
        <Bike className="absolute -right-8 -bottom-8 w-64 h-64 text-white/5 pointer-events-none" />
      </div>

      {/* TWO PROMINENT ACTION CARDS: OFFER A RIDE & FIND A RIDE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CARD 1: OFFER A RIDE */}
        <div
          onClick={() => onNavigate('offer-ride')}
          className="group cursor-pointer bg-white rounded-3xl p-8 border-2 border-slate-200/90 hover:border-[#1769D2] hover:shadow-xl transition-all duration-300 relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="w-14 h-14 rounded-2xl bg-[#EAF3FF] text-[#1769D2] flex items-center justify-center group-hover:bg-[#1769D2] group-hover:text-white transition duration-300 shadow-md">
              <Bike className="w-7 h-7 stroke-[2.2]" />
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-[#1769D2] border border-blue-200">
              Rider Mode
            </span>
          </div>

          <div className="mt-6 space-y-2">
            <h2 className="text-2xl font-extrabold text-[#123F7A] group-hover:text-[#1769D2] transition">
              OFFER A RIDE
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Have an empty pillion seat on your bike? Publish your daily journey from Karmanghat, Champapet, or LB Nagar to share fuel costs and help a fellow commuter.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-[#1769D2]">
            <span>Create journey & route</span>
            <div className="w-8 h-8 rounded-full bg-[#EAF3FF] flex items-center justify-center group-hover:translate-x-1.5 transition">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* CARD 2: FIND A RIDE */}
        <div
          onClick={() => onNavigate('find-ride')}
          className="group cursor-pointer bg-white rounded-3xl p-8 border-2 border-slate-200/90 hover:border-emerald-600 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition duration-300 shadow-md">
              <Search className="w-7 h-7 stroke-[2.2]" />
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Passenger Mode
            </span>
          </div>

          <div className="mt-6 space-y-2">
            <h2 className="text-2xl font-extrabold text-[#123F7A] group-hover:text-emerald-700 transition">
              FIND A RIDE
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Need a ride along your route? Search active bikes heading your way with verified student riders, women-safety priority, and live GPS tracking.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-emerald-600">
            <span>Search compatible routes</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center group-hover:translate-x-1.5 transition">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

      </div>

      {/* PENDING REQUESTS NOTIFICATION ALERT (IF RIDER) */}
      {pendingRequestsCount > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-base">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>You have {pendingRequestsCount} Pending Ride Request{pendingRequestsCount > 1 ? 's' : ''}!</span>
            </div>
            <span className="text-xs font-bold text-amber-700">Immediate action required</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {riderRequests
              .filter(r => r.status === 'PENDING')
              .map(req => (
                <div key={req.id} className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={req.passenger?.profile_photo || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100'}
                        alt={req.passenger?.full_name}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-amber-300"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{req.passenger?.full_name}</p>
                        <p className="text-[11px] text-slate-500">{req.passenger?.college_or_org}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-[#1769D2] bg-blue-50 px-2 py-0.5 rounded-md">
                      {req.compatibility_score}% Match
                    </span>
                  </div>

                  <div className="text-xs space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <p className="text-slate-700"><b>Pickup:</b> {req.pickup_location}</p>
                    <p className="text-slate-700"><b>Dropoff:</b> {req.dropoff_location}</p>
                    <p className="text-slate-500 text-[11px]">Requested Departure: {req.requested_time}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleAcceptRequest(req.id)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition"
                    >
                      Accept & Lock Seat
                    </button>
                    <button
                      onClick={() => handleRejectRequest(req.id)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* CONFIRMED / ACTIVE RIDES BAR */}
      {activeBookings.length > 0 && (
        <div className="bg-[#EAF3FF] border-2 border-blue-300 rounded-3xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#123F7A] font-extrabold text-base">
              <Navigation className="w-5 h-5 text-[#1769D2] animate-bounce" />
              <span>Confirmed Rides Ready for Live Tracking</span>
            </div>
            <button
              onClick={() => onNavigate('my-rides')}
              className="text-xs font-bold text-[#1769D2] hover:underline"
            >
              View in My Rides
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeBookings.map(booking => (
              <div key={booking.id} className="bg-white rounded-2xl p-4 border border-blue-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      RIDE CONFIRMED
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-1">
                      {booking.pickup_location.split(',')[0]} → {booking.dropoff_location.split(',')[0]}
                    </h4>
                  </div>
                  <button
                    onClick={() => onOpenTracking(booking.ride_id)}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-[#1769D2] hover:bg-[#123F7A] shadow-md transition flex items-center gap-1.5"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Track Rider Live
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECENT COMMUNITY COMMUTER RIDES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-[#123F7A]">
              Currently Available Rides in Hyderabad
            </h3>
            <p className="text-xs text-slate-500">Live journeys published by verified daily commuters</p>
          </div>
          <button
            onClick={() => onNavigate('find-ride')}
            className="text-xs font-bold text-[#1769D2] hover:underline flex items-center gap-1"
          >
            <span>See all compatible rides</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {offeredRides.slice(0, 3).map((ride) => (
            <div
              key={ride.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={ride.rider?.profile_photo || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100'}
                    alt={ride.rider?.full_name}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/20"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900 leading-tight">{ride.rider?.full_name}</p>
                    <p className="text-[10px] text-slate-500">{ride.rider?.vehicle_model || 'Two Wheeler'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-[#1769D2]">₹{ride.fuel_contribution}</span>
                  <p className="text-[10px] text-slate-400">contribution</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                  <span className="text-slate-700 truncate">{ride.start_location}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#123F7A] mt-1 shrink-0" />
                  <span className="text-slate-700 truncate">{ride.destination}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <Clock className="w-3 h-3 text-[#1769D2]" />
                  {ride.departure_time}
                </span>
                {ride.women_only && (
                  <span className="text-pink-600 font-bold flex items-center gap-0.5">
                    <Shield className="w-3 h-3" />
                    Women Only
                  </span>
                )}
                <button
                  onClick={() => onNavigate('find-ride', { prefillRideId: ride.id })}
                  className="font-bold text-[#1769D2] hover:underline"
                >
                  Request Seat
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
