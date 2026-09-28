import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { OfferedRide, RideRequest } from '../types/index.ts';
import {
  Bike,
  Navigation,
  Clock,
  Shield,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Check,
  ChevronRight,
  MapPin,
  Calendar,
  Users
} from 'lucide-react';

interface MyRidesPageProps {
  onOpenTracking: (rideId: number) => void;
  onNavigateOffer: () => void;
  onNavigateFind: () => void;
}

export const MyRidesPage: React.FC<MyRidesPageProps> = ({
  onOpenTracking,
  onNavigateOffer,
  onNavigateFind,
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'offered' | 'requested'>('offered');
  const [offeredRides, setOfferedRides] = useState<OfferedRide[]>([]);
  const [riderRequests, setRiderRequests] = useState<RideRequest[]>([]);
  const [passengerRequests, setPassengerRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [ridesRes, riderReqRes, passReqRes] = await Promise.all([
        api.getRides({ riderId: currentUser.id }),
        api.getRiderRequests(),
        api.getPassengerRequests(),
      ]);
      setOfferedRides(ridesRes.rides || []);
      setRiderRequests(riderReqRes.requests || []);
      setPassengerRequests(passReqRes.requests || []);
    } catch (err) {
      console.warn('Failed to load my rides');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: number) => {
    try {
      const res = await api.acceptRequest(requestId);
      await loadData();
      if (res.confirmed) {
        onOpenTracking(res.confirmed.ride_id);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to accept request');
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      await api.rejectRequest(requestId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to reject request');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#123F7A] tracking-tight">
            My Rides & Active Sessions
          </h1>
          <p className="text-sm text-slate-600">
            Manage your offered journeys, pending passenger requests, and active trip tracking.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('offered')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'offered'
                ? 'bg-white text-[#1769D2] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rides I Am Offering ({offeredRides.length})
          </button>
          <button
            onClick={() => setActiveTab('requested')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'requested'
                ? 'bg-white text-[#1769D2] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rides I Have Requested ({passengerRequests.length})
          </button>
        </div>
      </div>

      {/* TAB 1: RIDES OFFERED BY USER */}
      {activeTab === 'offered' && (
        <div className="space-y-6">
          {offeredRides.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
              <Bike className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-base text-slate-800">You Haven’t Offered Any Rides Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Have an empty pillion seat on your bike? Publish your daily route from Karmanghat or Champapet to share fuel costs!
              </p>
              <button
                onClick={onNavigateOffer}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#1769D2] hover:bg-[#123F7A] shadow-md transition"
              >
                Offer a Ride Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {offeredRides.map((ride) => {
                const requestsForThisRide = riderRequests.filter(r => r.ride_id === ride.id);
                const hasAccepted = requestsForThisRide.some(r => r.status === 'ACCEPTED');

                return (
                  <div
                    key={ride.id}
                    className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-xs space-y-5"
                  >
                    {/* Top Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-[#1769D2] border border-blue-200">
                            Ride #{ride.id} · {ride.status}
                          </span>
                          {ride.women_only && (
                            <span className="text-[10px] font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded flex items-center gap-1 border border-pink-200">
                              <Shield className="w-3 h-3 text-pink-600" />
                              Women Only
                            </span>
                          )}
                        </div>
                        <h3 className="font-extrabold text-base text-[#123F7A] mt-1">
                          {ride.start_location.split(',')[0]} → {ride.destination.split(',')[0]}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-900">{ride.departure_time}</p>
                          <p className="text-[10px] text-slate-400">{ride.departure_date}</p>
                        </div>
                        <button
                          onClick={() => onOpenTracking(ride.id)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1769D2] hover:bg-[#123F7A] shadow-md transition flex items-center gap-1.5"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Live Tracking</span>
                        </button>
                      </div>
                    </div>

                    {/* Route Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-bold">Seats Left</p>
                        <p className="font-extrabold text-slate-800">{ride.available_seats} Pillion</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-bold">Fuel Share</p>
                        <p className="font-extrabold text-[#1769D2]">₹{ride.fuel_contribution}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-bold">Instructions</p>
                        <p className="text-slate-600 truncate">{ride.pickup_preferences || 'Helmet provided'}</p>
                      </div>
                    </div>

                    {/* Pending & Confirmed Passenger Requests for this ride */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                        Passenger Requests for this Ride ({requestsForThisRide.length})
                      </h4>

                      {requestsForThisRide.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No passenger requests received yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {requestsForThisRide.map((req) => (
                            <div
                              key={req.id}
                              className={`p-3.5 rounded-2xl border text-xs space-y-2.5 transition ${
                                req.status === 'ACCEPTED'
                                  ? 'bg-emerald-50/60 border-emerald-300'
                                  : req.status === 'REJECTED'
                                  ? 'bg-slate-50 border-slate-200 opacity-60'
                                  : 'bg-white border-amber-300 shadow-xs'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={req.passenger?.profile_photo || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100'}
                                    alt={req.passenger?.full_name}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                  <div>
                                    <p className="font-bold text-slate-900">{req.passenger?.full_name}</p>
                                    <p className="text-[10px] text-slate-500">{req.passenger?.college_or_org}</p>
                                  </div>
                                </div>
                                <span
                                  className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                                    req.status === 'ACCEPTED'
                                      ? 'bg-emerald-200 text-emerald-900'
                                      : req.status === 'REJECTED'
                                      ? 'bg-slate-200 text-slate-700'
                                      : 'bg-amber-100 text-amber-900'
                                  }`}
                                >
                                  {req.status}
                                </span>
                              </div>

                              <div className="text-[11px] text-slate-600 bg-white/70 p-2 rounded-xl">
                                <p><b>Pickup:</b> {req.pickup_location}</p>
                                <p><b>Dropoff:</b> {req.dropoff_location}</p>
                              </div>

                              {req.status === 'PENDING' && (
                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    onClick={() => handleAccept(req.id)}
                                    className="flex-1 py-1.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 text-xs shadow-xs transition"
                                  >
                                    Accept & Lock Seat
                                  </button>
                                  <button
                                    onClick={() => handleReject(req.id)}
                                    className="px-3 py-1.5 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs transition"
                                  >
                                    Decline
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RIDES REQUESTED BY USER */}
      {activeTab === 'requested' && (
        <div className="space-y-6">
          {passengerRequests.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-base text-slate-800">No Ride Requests Sent Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Need to travel today? Search compatible routes and request a verified commuter bike!
              </p>
              <button
                onClick={onNavigateFind}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#1769D2] hover:bg-[#123F7A] shadow-md transition"
              >
                Find a Ride
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {passengerRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={req.ride?.rider?.profile_photo || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120'}
                        alt={req.ride?.rider?.full_name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/20"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{req.ride?.rider?.full_name}</p>
                        <p className="text-[10px] text-slate-500">{req.ride?.rider?.vehicle_model || 'Two Wheeler'}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        req.status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : req.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <p className="text-slate-700"><b>Pickup:</b> {req.pickup_location}</p>
                    <p className="text-slate-700"><b>Dropoff:</b> {req.dropoff_location}</p>
                    <p className="text-slate-500 text-[11px]">Departure: {req.requested_time}</p>
                  </div>

                  {req.status === 'ACCEPTED' && (
                    <button
                      onClick={() => onOpenTracking(req.ride_id)}
                      className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-[#1769D2] hover:bg-[#123F7A] shadow-md transition flex items-center justify-center gap-1.5"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Track Rider Live (GPS Active)
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
