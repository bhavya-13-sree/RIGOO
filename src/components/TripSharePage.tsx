import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { InteractiveMap } from './InteractiveMap.tsx';
import {
  Bike,
  Shield,
  Navigation,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface TripSharePageProps {
  token: string;
  onGoHome: () => void;
}

export const TripSharePage: React.FC<TripSharePageProps> = ({ token, onGoHome }) => {
  const [tripData, setTripData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSharedTrip();
    const interval = setInterval(loadSharedTrip, 6000);
    return () => clearInterval(interval);
  }, [token]);

  const loadSharedTrip = async () => {
    try {
      const res = await api.getSharedTrip(token);
      setTripData(res.trip);
    } catch (err: any) {
      setError(err.message || 'Shared trip link has expired or is invalid.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="text-center space-y-3">
          <Navigation className="w-10 h-10 text-[#1769D2] animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-700">Connecting to secure live trip feed...</p>
        </div>
      </div>
    );
  }

  if (error || !tripData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-slate-200 shadow-xl space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-extrabold text-slate-900">Trip Sharing Link Inactive</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {error || 'This live tracking session has ended or the link has expired.'}
          </p>
          <button
            onClick={onGoHome}
            className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-[#1769D2]"
          >
            Visit RIGOO Platform
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-[#123F7A] text-white p-6 rounded-3xl shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1769D2] flex items-center justify-center">
              <Bike className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight">RIGOO Live Trip Watch</h1>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500 text-white">
                  {tripData.status}
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Authorized Trusted-Contact Real-Time Tracking Link
              </p>
            </div>
          </div>
          <button
            onClick={onGoHome}
            className="text-xs font-bold text-blue-200 hover:text-white"
          >
            RIGOO Home
          </button>
        </div>

        {/* Map */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <InteractiveMap
            start={tripData.start_lat ? {
              lat: tripData.start_lat,
              lng: tripData.start_lng,
              label: tripData.start_location,
            } : undefined}
            destination={tripData.dest_lat ? {
              lat: tripData.dest_lat,
              lng: tripData.dest_lng,
              label: tripData.destination,
            } : undefined}
            routeCoordinates={tripData.route_coordinates}
            riderLocation={
              tripData.latest_location
                ? {
                    lat: tripData.latest_location.latitude,
                    lng: tripData.latest_location.longitude,
                  }
                : undefined
            }
            height="380px"
            showNavigationControls={true}
          />

          {/* Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <p className="font-bold text-slate-400 text-[10px] uppercase">Rider & Vehicle</p>
              <div className="flex items-center gap-2.5">
                <img
                  src={tripData.rider?.profile_photo || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100'}
                  alt={tripData.rider?.full_name}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <p className="font-bold text-slate-900">{tripData.rider?.full_name}</p>
                  <p className="text-slate-500 text-[11px]">
                    {tripData.rider?.vehicle_model} ({tripData.rider?.vehicle_number})
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-1">
              <p className="font-bold text-[#123F7A] text-[10px] uppercase">Passenger Travelling</p>
              <p className="font-extrabold text-sm text-slate-900">{tripData.passenger_name || 'Passenger'}</p>
              <p className="text-slate-600 text-[11px]">
                {tripData.start_location.split(',')[0]} → {tripData.destination.split(',')[0]}
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-center text-[11px] text-slate-500">
            This tracking link is temporary and strictly expires once the trip is marked completed in MySQL.
          </div>
        </div>

      </div>
    </div>
  );
};
