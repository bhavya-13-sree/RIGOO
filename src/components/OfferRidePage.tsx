import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { LocationPoint, RouteData } from '../types/index.ts';
import { InteractiveMap } from './InteractiveMap.tsx';
import { PlacesAutocompleteInput } from './PlacesAutocompleteInput.tsx';
import {
  Bike,
  Navigation,
  Shield,
  CheckCircle2,
  AlertCircle,
  Clock,
  Info,
  ExternalLink,
  Loader2
} from 'lucide-react';

interface OfferRidePageProps {
  onSuccess: () => void;
}

export const OfferRidePage: React.FC<OfferRidePageProps> = ({ onSuccess }) => {
  const { currentUser } = useAuth();

  // Selected locations - initialized to null to prevent hardcoded defaults
  const [startPoint, setStartPoint] = useState<LocationPoint | null>(null);
  const [destPoint, setDestPoint] = useState<LocationPoint | null>(null);

  // Dynamic route data fetched from backend
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Form states
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().slice(0, 10));
  const [departureTime, setDepartureTime] = useState('08:30');
  const [availableSeats] = useState(1);
  const [fuelContribution, setFuelContribution] = useState<number>(30);
  const [pickupPreferences, setPickupPreferences] = useState('Extra sanitized helmet provided. Please be ready at pickup on time.');
  const [womenOnly, setWomenOnly] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Calculate dynamic road route when both origin and destination are selected
  useEffect(() => {
    if (!startPoint || !destPoint) {
      setRouteData(null);
      setRouteError(null);
      return;
    }

    let isCancelled = false;
    const fetchDynamicRoute = async () => {
      setIsCalculatingRoute(true);
      setRouteError(null);
      try {
        const res = await api.getRoute(
          startPoint.lat,
          startPoint.lng,
          destPoint.lat,
          destPoint.lng
        );
        if (!isCancelled) {
          setRouteData(res.route);
          // Fair fuel cost calculation: ~₹6.5 / km
          const fairFare = Math.round(Math.max(20, res.route.distance_km * 6.5));
          setFuelContribution(fairFare);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Route calculation error:', err);
          setRouteError('Could not calculate a road route between these two locations. Please verify the selected places.');
          setRouteData(null);
        }
      } finally {
        if (!isCancelled) {
          setIsCalculatingRoute(false);
        }
      }
    };

    fetchDynamicRoute();

    return () => {
      isCancelled = true;
    };
  }, [startPoint, destPoint]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!startPoint) {
      setError('Please select and confirm a starting point from the search suggestions.');
      return;
    }

    if (!destPoint) {
      setError('Please select and confirm a destination from the search suggestions.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.offerRide({
        start_location: startPoint.description || startPoint.name,
        start_lat: startPoint.lat,
        start_lng: startPoint.lng,
        start_place_id: startPoint.place_id,
        destination: destPoint.description || destPoint.name,
        dest_lat: destPoint.lat,
        dest_lng: destPoint.lng,
        dest_place_id: destPoint.place_id,
        departure_date: departureDate,
        departure_time: departureTime,
        available_seats: availableSeats,
        fuel_contribution: fuelContribution,
        pickup_preferences: pickupPreferences,
        women_only: womenOnly,
      });

      setSuccessMsg('Your journey has been published to the RIGOO network with your exact route!');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to publish ride.');
    } finally {
      setLoading(false);
    }
  };

  const googleMapsDirectionsUrl = startPoint && destPoint
    ? api.getGoogleMapsDirectionsUrl(
        { address: startPoint.description, place_id: startPoint.place_id, lat: startPoint.lat, lng: startPoint.lng },
        { address: destPoint.description, place_id: destPoint.place_id, lat: destPoint.lat, lng: destPoint.lng }
      )
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF3FF] text-xs font-bold text-[#1769D2]">
          <Bike className="w-3.5 h-3.5" />
          <span>Rider Route Publisher</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#123F7A] tracking-tight">
          Offer a Ride — Share Your Journey
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Publish your planned commute to connect with verified commuters along your route. Universal location search supports any origin and destination with real road route geometry.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Form Inputs (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Universal Starting Point Input */}
            <PlacesAutocompleteInput
              label="Starting Point (Origin)"
              placeholder="Enter ANY origin (e.g. Karmanghat, Dilsukhnagar, LB Nagar...)"
              selectedLocation={startPoint}
              onLocationSelect={(loc) => setStartPoint(loc)}
              onLocationInvalidate={() => {
                setStartPoint(null);
                setRouteData(null);
              }}
              showCurrentLocationButton={true}
              required={true}
              helperText="Search any landmark, road, or city. Selecting from suggestions captures exact coordinates and Place ID."
              accentColor="#10B981"
            />

            {/* Universal Destination Input */}
            <PlacesAutocompleteInput
              label="Destination (End Point)"
              placeholder="Enter ANY destination (e.g. Gachibowli, Secunderabad, Uppal, Warangal...)"
              selectedLocation={destPoint}
              onLocationSelect={(loc) => setDestPoint(loc)}
              onLocationInvalidate={() => {
                setDestPoint(null);
                setRouteData(null);
              }}
              required={true}
              helperText="Selecting a destination calculates the road route, distance, and fair fuel contribution automatically."
              accentColor="#123F7A"
            />

            {/* Departure Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Departure Date</label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1769D2]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Departure Time</label>
                <div className="relative">
                  <input
                    type="time"
                    required
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1769D2]"
                  />
                </div>
              </div>
            </div>

            {/* Fuel Contribution & Seats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fuel Cost Contribution (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    required
                    min={15}
                    max={500}
                    value={fuelContribution}
                    onChange={(e) => setFuelContribution(parseInt(e.target.value, 10) || 20)}
                    className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-[#1769D2]"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Fair fuel cost sharing (~₹6.5/km for two-wheelers)
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Available Pillion Seat
                </label>
                <input
                  type="number"
                  disabled
                  value={availableSeats}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600 font-bold"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Standard 1 pillion seat on two-wheelers
                </p>
              </div>
            </div>

            {/* Women-Only Preference Toggle */}
            <div className="p-3.5 rounded-2xl bg-pink-50/70 border border-pink-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-pink-600" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Women-Only Ride Option</p>
                  <p className="text-[11px] text-slate-600">Restrict booking exclusively to verified female passengers</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={womenOnly}
                onChange={(e) => setWomenOnly(e.target.checked)}
                className="w-4 h-4 text-pink-600 rounded border-gray-300 focus:ring-pink-500"
              />
            </div>

            {/* Pickup Preferences / Guidelines */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pickup Instructions & Rider Preferences
              </label>
              <textarea
                rows={2}
                value={pickupPreferences}
                onChange={(e) => setPickupPreferences(e.target.value)}
                placeholder="e.g. Helmet provided. Please be ready at pickup on time."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1769D2]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !startPoint || !destPoint}
              className="w-full py-3.5 rounded-2xl font-extrabold text-sm text-white bg-[#1769D2] hover:bg-[#123F7A] shadow-lg shadow-blue-500/20 transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Ride...</span>
                </>
              ) : (
                'Publish Ride to Commuter Network'
              )}
            </button>
          </form>
        </div>

        {/* Map Preview & Calculations (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#123F7A] flex items-center gap-2">
                <Navigation className="w-4 h-4 text-[#1769D2]" />
                <span>Dynamic Road Route</span>
              </h3>
              {isCalculatingRoute && (
                <div className="flex items-center gap-1.5 text-xs text-[#1769D2] font-semibold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Routing...</span>
                </div>
              )}
            </div>

            {routeError && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{routeError}</span>
              </div>
            )}

            {/* Interactive Leaflet/Google hybrid Map */}
            <InteractiveMap
              start={startPoint ? { lat: startPoint.lat, lng: startPoint.lng, label: startPoint.name } : undefined}
              destination={destPoint ? { lat: destPoint.lat, lng: destPoint.lng, label: destPoint.name } : undefined}
              routeCoordinates={routeData?.coordinates}
              height="300px"
              showNavigationControls={false}
            />

            {/* Open Exact Locations in Google Maps Button */}
            {googleMapsDirectionsUrl ? (
              <a
                href={googleMapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl border border-blue-200 bg-[#EAF3FF] hover:bg-blue-100 text-[#1769D2] font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Same Locations in Google Maps Navigation</span>
              </a>
            ) : (
              <div className="text-center text-[11px] text-slate-400 py-1 font-medium">
                Select both locations to preview route and Google Maps navigation
              </div>
            )}

            {/* Route Stats Card */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Road Distance</p>
                <p className="text-base font-extrabold text-slate-900">
                  {routeData ? `${routeData.distance_km} km` : '—'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Est. Travel Time</p>
                <p className="text-base font-extrabold text-slate-900">
                  {routeData ? `~${routeData.duration_mins} mins` : '—'}
                </p>
              </div>
            </div>

            {/* Non-Commercial Policy Info */}
            <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-2 text-[11px] text-slate-600">
              <Info className="w-4 h-4 text-[#1769D2] shrink-0 mt-0.5" />
              <p>
                RIGOO is strictly non-commercial fuel sharing under the Motor Vehicles Act. Pillion contributions offset actual fuel costs without generating commercial taxi profits.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
