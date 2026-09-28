import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { MatchResult, LocationPoint, RouteData } from '../types/index.ts';
import { InteractiveMap } from './InteractiveMap.tsx';
import { PlacesAutocompleteInput } from './PlacesAutocompleteInput.tsx';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Bike,
  Shield,
  Loader2,
  ExternalLink,
  MapPin,
  Clock,
  X
} from 'lucide-react';

interface FindRidePageProps {
  prefillRideId?: number;
  onRequestSubmitted: (rideId: number) => void;
}

export const FindRidePage: React.FC<FindRidePageProps> = ({ onRequestSubmitted }) => {
  const { currentUser } = useAuth();

  // Search parameters - initialized to null, completely free of hardcoded locations
  const [pickupPoint, setPickupPoint] = useState<LocationPoint | null>(null);
  const [dropoffPoint, setDropoffPoint] = useState<LocationPoint | null>(null);

  const [travelDate, setTravelDate] = useState(new Date().toISOString().slice(0, 10));
  const [preferredTime, setPreferredTime] = useState('08:30');
  const [timeFlexibility, setTimeFlexibility] = useState(30);
  const [womenOnlyPreference, setWomenOnlyPreference] = useState(false);

  // Dynamic route preview between pickup and dropoff
  const [routeData, setRouteData] = useState<RouteData | null>(null);

  // Results state
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [noFemaleRiders, setNoFemaleRiders] = useState(false);
  const [selectedRideForRequest, setSelectedRideForRequest] = useState<MatchResult | null>(null);

  // Request modal state
  const [requestNotes, setRequestNotes] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  // When both pickup and dropoff points change, compute dynamic route preview
  useEffect(() => {
    if (!pickupPoint || !dropoffPoint) {
      setRouteData(null);
      return;
    }

    let isCancelled = false;
    api.getRoute(pickupPoint.lat, pickupPoint.lng, dropoffPoint.lat, dropoffPoint.lng)
      .then((res) => {
        if (!isCancelled) {
          setRouteData(res.route);
        }
      })
      .catch(() => {
        if (!isCancelled) setRouteData(null);
      });

    return () => {
      isCancelled = true;
    };
  }, [pickupPoint, dropoffPoint]);

  const executeSearch = async (overrideWomenPref?: boolean) => {
    if (!pickupPoint) {
      setSearchError('Please search and select a verified pickup location from suggestions.');
      return;
    }

    if (!dropoffPoint) {
      setSearchError('Please search and select a verified destination from suggestions.');
      return;
    }

    setLoading(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const res = await api.searchRides({
        pickup_location: pickupPoint.description || pickupPoint.name,
        pickup_place_id: pickupPoint.place_id,
        pickup_lat: pickupPoint.lat,
        pickup_lng: pickupPoint.lng,
        dropoff_location: dropoffPoint.description || dropoffPoint.name,
        dropoff_place_id: dropoffPoint.place_id,
        dropoff_lat: dropoffPoint.lat,
        dropoff_lng: dropoffPoint.lng,
        travel_date: travelDate,
        preferred_time: preferredTime,
        time_flexibility: timeFlexibility,
        women_only_preference: overrideWomenPref !== undefined ? overrideWomenPref : womenOnlyPreference,
        passenger_gender: currentUser?.gender,
        passenger_id: currentUser?.id,
      });

      setMatches(res.matches || []);
      setNoFemaleRiders(Boolean(res.noFemaleRidersAvailable));
    } catch (err: any) {
      console.warn('Ride search failed:', err);
      setSearchError(err.message || 'Ride search failed. Please verify the locations.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRequest = async () => {
    if (!selectedRideForRequest || !currentUser || !pickupPoint || !dropoffPoint) return;
    setRequestLoading(true);

    try {
      await api.requestRide({
        ride_id: selectedRideForRequest.ride.id,
        pickup_location: pickupPoint.description || pickupPoint.name,
        pickup_place_id: pickupPoint.place_id,
        pickup_lat: pickupPoint.lat,
        pickup_lng: pickupPoint.lng,
        dropoff_location: dropoffPoint.description || dropoffPoint.name,
        dropoff_place_id: dropoffPoint.place_id,
        dropoff_lat: dropoffPoint.lat,
        dropoff_lng: dropoffPoint.lng,
        requested_time: preferredTime,
        suggested_pickup_point: selectedRideForRequest.suggestedPickupPoint,
        compatibility_score: selectedRideForRequest.compatibilityScore,
      });

      setRequestSuccess(true);
      setTimeout(() => {
        const rideId = selectedRideForRequest.ride.id;
        setSelectedRideForRequest(null);
        setRequestSuccess(false);
        onRequestSubmitted(rideId);
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to submit request');
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">
          <Search className="w-3.5 h-3.5" />
          <span>Intelligent Matching Engine</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#123F7A] tracking-tight">
          Find a Ride — Share the Journey
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Search verified riders heading your direction. Universal location search matches routes anywhere using real road geometry, pickup proximity, and departure time synchronization.
        </p>
      </div>

      {searchError && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{searchError}</span>
        </div>
      )}

      {/* Search Filter Panel */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
          
          {/* Pickup Universal Input */}
          <div className="lg:col-span-4">
            <PlacesAutocompleteInput
              label="Pickup Location"
              placeholder="Enter ANY pickup (e.g. Karmanghat, Champapet, Secunderabad...)"
              selectedLocation={pickupPoint}
              onLocationSelect={(loc) => {
                setPickupPoint(loc);
                setSearchError(null);
              }}
              onLocationInvalidate={() => {
                setPickupPoint(null);
                setMatches([]);
              }}
              showCurrentLocationButton={true}
              required={true}
              accentColor="#10B981"
            />
          </div>

          {/* Destination Universal Input */}
          <div className="lg:col-span-4">
            <PlacesAutocompleteInput
              label="Destination / Drop-off"
              placeholder="Enter ANY destination (e.g. Gachibowli, LB Nagar, Warangal...)"
              selectedLocation={dropoffPoint}
              onLocationSelect={(loc) => {
                setDropoffPoint(loc);
                setSearchError(null);
              }}
              onLocationInvalidate={() => {
                setDropoffPoint(null);
                setMatches([]);
              }}
              required={true}
              accentColor="#123F7A"
            />
          </div>

          {/* Time & Flexibility */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Time & Window
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="time"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full px-2.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1769D2]"
              />
              <select
                value={timeFlexibility}
                onChange={(e) => setTimeFlexibility(Number(e.target.value))}
                className="px-2 py-2.5 rounded-xl border border-slate-300 text-xs bg-white shrink-0 font-semibold"
              >
                <option value={15}>±15m</option>
                <option value={30}>±30m</option>
                <option value={45}>±45m</option>
              </select>
            </div>
          </div>

          {/* Search Button */}
          <div className="lg:col-span-2 flex items-end">
            <button
              onClick={() => executeSearch()}
              disabled={loading || !pickupPoint || !dropoffPoint}
              className="w-full py-3 rounded-xl font-bold text-xs text-white bg-[#1769D2] hover:bg-[#123F7A] shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Matching...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Find Rides</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Dynamic Route Map Preview when locations are selected */}
        {pickupPoint && dropoffPoint && (
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#123F7A] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#1769D2]" />
                <span>Selected Search Corridor</span>
              </span>
              {routeData && (
                <span className="font-bold text-slate-700">
                  Road distance: <b className="text-[#1769D2]">{routeData.distance_km} km</b> · Travel time: ~{routeData.duration_mins} mins
                </span>
              )}
            </div>
            <InteractiveMap
              start={{ lat: pickupPoint.lat, lng: pickupPoint.lng, label: pickupPoint.name }}
              destination={{ lat: dropoffPoint.lat, lng: dropoffPoint.lng, label: dropoffPoint.name }}
              routeCoordinates={routeData?.coordinates}
              height="220px"
              showNavigationControls={true}
            />
          </div>
        )}

        {/* Women-to-Women Filter Bar (Section 10 Requirement) */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const nextVal = !womenOnlyPreference;
                setWomenOnlyPreference(nextVal);
                if (pickupPoint && dropoffPoint) {
                  executeSearch(nextVal);
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                womenOnlyPreference
                  ? 'bg-pink-50 border-pink-300 text-pink-700 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Shield className={`w-3.5 h-3.5 ${womenOnlyPreference ? 'text-pink-600 fill-pink-100' : 'text-slate-400'}`} />
              <span>Women Rider Priority Filter</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${womenOnlyPreference ? 'bg-pink-200/80 text-pink-900' : 'bg-slate-200 text-slate-600'}`}>
                {womenOnlyPreference ? 'Active' : 'Off'}
              </span>
            </button>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Prioritizes verified women riders
            </span>
          </div>

          <p className="text-[11px] text-slate-400">
            {matches.length} compatible ride{matches.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      {/* WOMEN SAFETY FALLBACK BANNER */}
      {noFemaleRiders && (
        <div className="p-5 rounded-3xl bg-pink-50/90 border-2 border-pink-200 space-y-3">
          <div className="flex items-center gap-2.5 text-pink-900 font-extrabold text-sm">
            <AlertCircle className="w-5 h-5 text-pink-600 shrink-0" />
            <span>No compatible female rider is currently available.</span>
          </div>
          <p className="text-xs text-pink-800 leading-relaxed">
            There are currently no verified women riders matching your exact departure time along this corridor. As per our safety standards, we never automatically substitute an alternative rider without your explicit consent.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => executeSearch()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-pink-700 border border-pink-300 hover:bg-pink-100 transition"
            >
              Keep Searching Female Riders
            </button>
            <button
              onClick={() => {
                setWomenOnlyPreference(false);
                executeSearch(false);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-pink-600 text-white hover:bg-pink-700 shadow-sm transition"
            >
              View Other Verified Riders
            </button>
          </div>
        </div>
      )}

      {/* MATCHED RIDES RESULTS */}
      <div className="space-y-4">
        <h3 className="text-lg font-extrabold text-[#123F7A]">
          Matched Rides Sorted by Compatibility Score
        </h3>

        {hasSearched && matches.length === 0 && !loading && (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <Bike className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-800">No Compatible Commute Routes Found</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No active riders match your departure time and corridor. Try adjusting your departure time flexibility (±30m) or publish an offered ride instead!
            </p>
          </div>
        )}

        {!hasSearched && (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-2">
            <Search className="w-10 h-10 text-[#1769D2]/40 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">Enter Your Pickup and Destination Above</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Select any two locations across Hyderabad or anywhere in India to search active compatible journeys.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matches.map((match) => {
            const directionsUrl = api.getGoogleMapsDirectionsUrl(
              { address: match.ride.start_location, place_id: match.ride.start_place_id, lat: match.ride.start_lat, lng: match.ride.start_lng },
              { address: match.ride.destination, place_id: match.ride.dest_place_id, lat: match.ride.dest_lat, lng: match.ride.dest_lng }
            );

            return (
              <div
                key={match.ride.id}
                className="bg-white rounded-3xl p-6 border-2 border-slate-200/80 hover:border-[#1769D2] hover:shadow-lg transition space-y-5 relative overflow-hidden"
              >
                {/* Top Rider Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={match.ride.rider?.profile_photo || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120'}
                      alt={match.ride.rider?.full_name}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-blue-500/20 shadow-xs"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-extrabold text-slate-900">{match.ride.rider?.full_name}</h4>
                        {match.ride.rider?.is_verified && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        {match.ride.rider?.college_or_org} · ⭐ {match.ride.rider?.rating_avg || 5.0}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {match.ride.rider?.vehicle_model || 'Two-Wheeler'} ({match.ride.rider?.vehicle_number || 'TS registered'})
                      </p>
                    </div>
                  </div>

                  {/* Compatibility Score Pill */}
                  <div className="text-right space-y-1">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#EAF3FF] text-[#1769D2] border border-blue-200">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="text-xs font-black">{match.compatibilityScore}% Match</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {match.detourDistanceKm} km detour
                    </p>
                  </div>
                </div>

                {/* Journey Details */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                    <div>
                      <p className="text-slate-400 text-[10px] uppercase font-bold">Rider Start</p>
                      <p className="font-semibold text-slate-800">{match.ride.start_location}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                    <div>
                      <p className="text-amber-800 text-[10px] uppercase font-bold">Suggested Pickup Point</p>
                      <p className="font-semibold text-slate-800">{match.suggestedPickupPoint}</p>
                      <p className="text-[10px] text-slate-400">
                        Approx {match.pickupProximityKm} km from your requested location
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#123F7A] mt-1 shrink-0" />
                    <div>
                      <p className="text-slate-400 text-[10px] uppercase font-bold">Rider Destination</p>
                      <p className="font-semibold text-slate-800">{match.ride.destination}</p>
                    </div>
                  </div>
                </div>

                {/* Match Factors / Reasons */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-[11px] text-slate-600">
                  <p className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">
                    Deterministic Match Criteria:
                  </p>
                  {match.matchReasons.map((reason, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>

                {/* Open in Google Maps */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-[#1769D2] hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>View Rider's Route in Google Maps</span>
                  </a>
                </div>

                {/* Footer with Price and Action */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-lg font-black text-[#1769D2]">₹{match.ride.fuel_contribution}</span>
                    <span className="text-xs text-slate-400 font-medium ml-1">fuel contribution</span>
                  </div>

                  <button
                    onClick={() => setSelectedRideForRequest(match)}
                    className="px-5 py-2.5 rounded-xl font-extrabold text-xs text-white bg-[#1769D2] hover:bg-[#123F7A] shadow-md transition transform active:scale-95 flex items-center gap-1.5"
                  >
                    <span>Request Ride</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIDE REQUEST MODAL */}
      {selectedRideForRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-[#123F7A] flex items-center gap-2">
                <Bike className="w-5 h-5 text-[#1769D2]" />
                <span>Confirm Ride Request</span>
              </h3>
              <button
                onClick={() => setSelectedRideForRequest(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs space-y-2">
              <p className="font-bold text-[#123F7A]">
                Requesting ride with {selectedRideForRequest.ride.rider?.full_name}
              </p>
              <div className="text-slate-600 space-y-1">
                <p><b>Your Pickup:</b> {pickupPoint?.description}</p>
                <p><b>Your Dropoff:</b> {dropoffPoint?.description}</p>
                <p><b>Rider Departure:</b> {selectedRideForRequest.ride.departure_time}</p>
                <p><b>Agreed Fuel Share:</b> ₹{selectedRideForRequest.ride.fuel_contribution}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Note for Rider (Optional)
              </label>
              <textarea
                rows={2}
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                placeholder="e.g. I will be wearing a blue jacket standing outside the metro exit."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1769D2]"
              />
            </div>

            {requestSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Ride request sent! You will be notified when accepted.</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedRideForRequest(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={requestLoading || requestSuccess}
                onClick={handleConfirmRequest}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1769D2] hover:bg-[#123F7A] shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {requestLoading ? 'Sending Request...' : 'Send Request to Rider'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
