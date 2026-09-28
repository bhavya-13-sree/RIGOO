import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { ConfirmedRide, LiveLocation } from '../types/index.ts';
import { InteractiveMap } from './InteractiveMap.tsx';
import {
  Navigation,
  Shield,
  PhoneCall,
  Share2,
  CheckCircle2,
  X,
  Compass,
  MapPin,
  Play,
  Square,
  Copy,
  Check,
  Star,
  ExternalLink,
  Activity
} from 'lucide-react';

interface LiveTrackingModalProps {
  rideId: number;
  isOpen: boolean;
  onClose: () => void;
  onTripCompleted?: () => void;
}

export const LiveTrackingModal: React.FC<LiveTrackingModalProps> = ({
  rideId,
  isOpen,
  onClose,
  onTripCompleted,
}) => {
  const { currentUser } = useAuth();
  const [confirmedRide, setConfirmedRide] = useState<ConfirmedRide | null>(null);
  const [liveLocation, setLiveLocation] = useState<LiveLocation | null>(null);
  const [isRider, setIsRider] = useState(false);
  const [isPassenger, setIsPassenger] = useState(false);
  const [loading, setLoading] = useState(true);

  // GPS Watch state
  const [isWatchingGps, setIsWatchingGps] = useState(false);
  const [lastGpsError, setLastGpsError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // ETA & Distance
  const [remainingDistanceKm, setRemainingDistanceKm] = useState<number | null>(null);
  const [remainingEtaMins, setRemainingEtaMins] = useState<number | null>(null);
  const [statusText, setStatusText] = useState<string>('Connecting to live tracking...');

  // Share Token
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // SOS Modal
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosDispatched, setSosDispatched] = useState(false);
  const [sosDetails, setSosDetails] = useState<any>(null);

  // Rating Modal
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingVal, setRatingVal] = useState(5);
  const [reviewVal, setReviewVal] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    loadTrackingSession();

    // Initialize authenticated Socket.IO connection
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_ride', {
        ride_id: rideId,
        user_id: currentUser?.id,
      });
    });

    socket.on('ride_joined', (data) => {
      if (data.latest_location) {
        setLiveLocation(data.latest_location);
        calculateDynamicEta(data.latest_location.latitude, data.latest_location.longitude);
      }
    });

    socket.on('ride_location_changed', (data) => {
      setLiveLocation(data.location);
      calculateDynamicEta(data.location.latitude, data.location.longitude);
    });

    socket.on('trip_status_changed', (data) => {
      loadTrackingSession();
      if (data.status === 'COMPLETED') {
        stopGpsTracking();
        setShowRatingModal(true);
      }
    });

    socket.on('rider_arrived', (data) => {
      setStatusText(data.message || 'Rider has arrived at the pickup point!');
    });

    return () => {
      socket.disconnect();
      stopGpsTracking();
    };
  }, [isOpen, rideId]);

  const loadTrackingSession = async () => {
    try {
      const data = await api.getTrackingState(rideId);
      setConfirmedRide(data);
      setIsRider(Boolean(data.isRider));
      setIsPassenger(Boolean(data.isPassenger));
      if (data.latest_location) {
        setLiveLocation(data.latest_location);
        calculateDynamicEta(data.latest_location.latitude, data.latest_location.longitude);
      } else if (data.ride) {
        setRemainingDistanceKm(data.ride.route_distance_km || 5.0);
        setRemainingEtaMins(data.ride.route_duration_mins || 15);
      }

      // Determine initial status text
      const currentStatus = data.status || data.ride?.status;
      if (currentStatus === 'CONFIRMED' || currentStatus === 'ACCEPTED') {
        setStatusText('Ride confirmed. Rider can start pickup navigation.');
      } else if (currentStatus === 'PICKUP_STARTED') {
        setStatusText('Rider is on the way to passenger pickup point.');
      } else if (currentStatus === 'TRIP_ACTIVE') {
        setStatusText('Trip in progress en route to destination.');
      } else if (currentStatus === 'COMPLETED') {
        setStatusText('Journey completed safely.');
      }
    } catch (err) {
      console.warn('Failed to load tracking session');
    } finally {
      setLoading(false);
    }
  };

  const calculateDynamicEta = (riderLat: number, riderLng: number) => {
    if (!confirmedRide) return;
    const targetLat = confirmedRide.status === 'TRIP_ACTIVE'
      ? confirmedRide.ride?.dest_lat
      : confirmedRide.request?.pickup_lat;
    const targetLng = confirmedRide.status === 'TRIP_ACTIVE'
      ? confirmedRide.ride?.dest_lng
      : confirmedRide.request?.pickup_lng;

    if (targetLat === undefined || targetLng === undefined) return;

    const dLat = (targetLat - riderLat) * 111;
    const dLng = (targetLng - riderLng) * 111 * Math.cos(riderLat * 0.0174);
    const distKm = Math.max(0.1, Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * 1.25 * 10) / 10);
    const mins = Math.max(1, Math.round(distKm * 2.8));

    setRemainingDistanceKm(distKm);
    setRemainingEtaMins(mins);
  };

  // Actual Browser Geolocation API
  const startRealGpsTracking = () => {
    if (!navigator.geolocation) {
      setLastGpsError('Geolocation API is not supported by your browser.');
      return;
    }

    setLastGpsError(null);
    setIsWatchingGps(true);

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, heading, speed } = pos.coords;
        sendLocationUpdate(latitude, longitude, accuracy, heading || 0, speed || 0);
      },
      (err) => {
        setLastGpsError(`GPS Error: ${err.message}. Showing last known position.`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000,
      }
    );

    watchIdRef.current = id;
  };

  const stopGpsTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatchingGps(false);
  };

  const sendLocationUpdate = async (
    latitude: number,
    longitude: number,
    accuracy: number = 5,
    heading: number = 0,
    speed: number = 0
  ) => {
    // 1. Send via Socket.IO
    if (socketRef.current && currentUser) {
      socketRef.current.emit('rider_location_update', {
        ride_id: rideId,
        rider_id: currentUser.id,
        latitude,
        longitude,
        accuracy,
        heading,
        speed,
      });
    }

    // 2. Also persist to backend
    try {
      await api.updateLocation(rideId, { latitude, longitude, accuracy, heading, speed });
    } catch (e) {
      // Ignored for high frequency updates
    }
  };

  // Rider action: Start Pickup
  const handleStartPickup = async () => {
    try {
      await api.startPickup(rideId);
      startRealGpsTracking();
      if (socketRef.current && currentUser) {
        socketRef.current.emit('start_pickup', { ride_id: rideId, rider_id: currentUser.id });
      }
      await loadTrackingSession();
    } catch (err: any) {
      alert(err.message || 'Failed to start pickup');
    }
  };

  // Rider action: Start Trip
  const handleStartTrip = async () => {
    try {
      await api.startTrip(rideId);
      if (!isWatchingGps) {
        startRealGpsTracking();
      }
      if (socketRef.current && currentUser) {
        socketRef.current.emit('start_trip', { ride_id: rideId, rider_id: currentUser.id });
      }
      await loadTrackingSession();
    } catch (err: any) {
      alert(err.message || 'Failed to start trip');
    }
  };

  // Rider action: End Trip
  const handleEndTrip = async () => {
    try {
      await api.endTrip(rideId);
      stopGpsTracking();
      if (socketRef.current && currentUser) {
        socketRef.current.emit('end_trip', { ride_id: rideId, rider_id: currentUser.id });
      }
      await loadTrackingSession();
      setShowRatingModal(true);
    } catch (err: any) {
      alert(err.message || 'Failed to complete trip');
    }
  };

  // Generate trusted contact share link
  const handleGenerateShareToken = async () => {
    try {
      const res = await api.generateShareToken(rideId);
      setShareToken(`${window.location.origin}/?share=${res.shareToken}`);
      setShowShareModal(true);
    } catch (err: any) {
      alert('Failed to generate sharing link');
    }
  };

  const copyShareLink = () => {
    if (shareToken) {
      navigator.clipboard.writeText(shareToken);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  // Emergency SOS
  const handleTriggerSOS = async () => {
    try {
      const res = await api.triggerEmergencySOS({
        ride_id: rideId,
        latitude: liveLocation?.latitude,
        longitude: liveLocation?.longitude,
      });
      setSosDetails(res.alert);
      setSosDispatched(true);
    } catch (err: any) {
      alert('Failed to trigger emergency alert');
    }
  };

  // Submit Rating
  const handleSubmitRating = async () => {
    if (!confirmedRide || !currentUser) return;
    try {
      const revieweeId = isRider ? confirmedRide.passenger_id : confirmedRide.rider_id;
      await api.submitRating({
        ride_id: rideId,
        reviewee_id: revieweeId,
        rating: ratingVal,
        review: reviewVal,
        role: isRider ? 'RIDER' : 'PASSENGER',
      });
      setRatingSubmitted(true);
      setTimeout(() => {
        setShowRatingModal(false);
        if (onTripCompleted) onTripCompleted();
        onClose();
      }, 1500);
    } catch (err: any) {
      alert('Failed to record rating');
    }
  };

  if (!isOpen) return null;

  const rideState = confirmedRide?.status || confirmedRide?.ride?.status || 'OFFERED';
  const otherParty = isRider ? confirmedRide?.passenger : confirmedRide?.rider;

  // Construct official Google Maps URLs for Active Navigation using exact locations and Place IDs
  const activePickupNavUrl = confirmedRide && confirmedRide.request ? (() => {
    const originParam = liveLocation
      ? `${liveLocation.latitude},${liveLocation.longitude}`
      : encodeURIComponent(confirmedRide.ride?.start_location || '');
    const destParam = encodeURIComponent(confirmedRide.request.pickup_location);
    const placeIdParam = confirmedRide.request.pickup_place_id && !confirmedRide.request.pickup_place_id.startsWith('req_')
      ? `&destination_place_id=${confirmedRide.request.pickup_place_id}`
      : '';
    return `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}${placeIdParam}&travelmode=two_wheeler`;
  })() : null;

  const activeDestNavUrl = confirmedRide && confirmedRide.ride ? (() => {
    const originParam = liveLocation
      ? `${liveLocation.latitude},${liveLocation.longitude}`
      : encodeURIComponent(confirmedRide.request?.pickup_location || confirmedRide.ride.start_location);
    const destParam = encodeURIComponent(confirmedRide.ride.destination);
    const placeIdParam = confirmedRide.ride.dest_place_id && !confirmedRide.ride.dest_place_id.startsWith('dest_')
      ? `&destination_place_id=${confirmedRide.ride.dest_place_id}`
      : '';
    return `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}${placeIdParam}&travelmode=two_wheeler`;
  })() : null;

  const fullRouteNavUrl = confirmedRide && confirmedRide.ride ? api.getGoogleMapsDirectionsUrl(
    { address: confirmedRide.ride.start_location, place_id: confirmedRide.ride.start_place_id, lat: confirmedRide.ride.start_lat, lng: confirmedRide.ride.start_lng },
    { address: confirmedRide.ride.destination, place_id: confirmedRide.ride.dest_place_id, lat: confirmedRide.ride.dest_lat, lng: confirmedRide.ride.dest_lng }
  ) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#123F7A] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1769D2] flex items-center justify-center text-white shadow-md">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg tracking-tight">
                  RIGOO Live GPS Tracking
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500 text-white">
                  {rideState}
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Ride #{rideId} · Authenticated Socket.IO Channel: ride_{rideId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Share Live Trip Button */}
            <button
              onClick={handleGenerateShareToken}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center gap-1.5 transition"
              title="Share live journey with trusted contact"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share Trip</span>
            </button>

            {/* Emergency SOS Button */}
            <button
              onClick={() => setShowSosModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-black text-white flex items-center gap-1.5 shadow-md shadow-red-600/30 transition transform active:scale-95"
            >
              <Shield className="w-4 h-4 fill-white" />
              <span>SOS</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Notification Ticker */}
        <div className="bg-[#EAF3FF] px-6 py-2.5 border-b border-blue-200/80 flex items-center justify-between text-xs text-[#123F7A]">
          <div className="flex items-center gap-2 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <span>{statusText}</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            {remainingDistanceKm !== null && (
              <span>Remaining: <b className="text-[#1769D2]">{remainingDistanceKm} km</b></span>
            )}
            {remainingEtaMins !== null && (
              <span>ETA: <b className="text-[#1769D2]">~{remainingEtaMins} mins</b></span>
            )}
          </div>
        </div>

        {/* Main Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          
          {/* Map Column (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            <InteractiveMap
              start={confirmedRide?.ride ? {
                lat: confirmedRide.ride.start_lat,
                lng: confirmedRide.ride.start_lng,
                label: confirmedRide.ride.start_location,
              } : undefined}
              pickup={confirmedRide?.request ? {
                lat: confirmedRide.request.pickup_lat,
                lng: confirmedRide.request.pickup_lng,
                label: confirmedRide.request.pickup_location,
              } : undefined}
              destination={confirmedRide?.ride ? {
                lat: confirmedRide.ride.dest_lat,
                lng: confirmedRide.ride.dest_lng,
                label: confirmedRide.ride.destination,
              } : undefined}
              riderLocation={
                liveLocation
                  ? {
                      lat: liveLocation.latitude,
                      lng: liveLocation.longitude,
                      heading: liveLocation.heading,
                      speed: liveLocation.speed,
                    }
                  : undefined
              }
              routeCoordinates={confirmedRide?.ride?.route_coordinates}
              height="380px"
              showNavigationControls={false}
            />

            {/* GPS Telemetry Bar */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-600 gap-2">
              <div className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#1769D2]" />
                <span>
                  <b>GPS Status:</b> {isWatchingGps ? 'Hardware GPS Streaming (High Accuracy)' : (liveLocation ? 'Live Server Synced' : 'Awaiting GPS')}
                </span>
              </div>
              <div>
                <b>Latest Coordinate:</b>{' '}
                {liveLocation
                  ? `${liveLocation.latitude.toFixed(4)}, ${liveLocation.longitude.toFixed(4)}`
                  : 'Pending'}
              </div>
              {liveLocation?.speed !== undefined && liveLocation.speed > 0 && (
                <div>
                  <b>Speed:</b> {Math.round(liveLocation.speed * 3.6)} km/h
                </div>
              )}
              {lastGpsError && (
                <span className="text-amber-700 font-medium">{lastGpsError}</span>
              )}
            </div>

            {/* Official Google Maps Directions Launch Panel */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#123F7A] flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4 text-[#1769D2]" />
                  <span>Launch Official Google Maps Navigation</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400">Uses Exact Selected Place IDs</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activePickupNavUrl && (
                  <a
                    href={activePickupNavUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-white border border-blue-200 hover:bg-[#EAF3FF] text-[#1769D2] font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs text-center"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Navigate to Pickup</span>
                  </a>
                )}

                {activeDestNavUrl && (
                  <a
                    href={activeDestNavUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-white border border-blue-200 hover:bg-[#EAF3FF] text-[#123F7A] font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs text-center"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Navigate to Destination</span>
                  </a>
                )}
              </div>

              {fullRouteNavUrl && (
                <a
                  href={fullRouteNavUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-[11px] text-slate-500 hover:text-[#1769D2] font-semibold transition"
                >
                  View complete trip directions in Google Maps →
                </a>
              )}
            </div>

          </div>

          {/* Right Controls & Participant Details (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Participant Card */}
            <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isRider ? 'Confirmed Passenger' : 'Your Verified Rider'}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={otherParty?.profile_photo || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120'}
                    alt={otherParty?.full_name}
                    className="w-11 h-11 rounded-2xl object-cover ring-2 ring-blue-500/20"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-extrabold text-slate-900">{otherParty?.full_name}</h4>
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <p className="text-[11px] text-slate-500">{otherParty?.college_or_org}</p>
                    <p className="text-[11px] font-semibold text-slate-700">{otherParty?.mobile_number}</p>
                  </div>
                </div>

                <a
                  href={`tel:${otherParty?.mobile_number}`}
                  className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-[#1769D2] flex items-center justify-center hover:bg-blue-50 transition"
                  title="Call Co-traveler"
                >
                  <PhoneCall className="w-4 h-4" />
                </a>
              </div>

              {isPassenger && confirmedRide?.ride?.rider?.vehicle_model && (
                <div className="text-xs bg-white p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500">Vehicle:</span>
                  <span className="font-bold text-slate-800">
                    {confirmedRide.ride.rider.vehicle_model} ({confirmedRide.ride.rider.vehicle_number})
                  </span>
                </div>
              )}
            </div>

            {/* Journey Summary */}
            <div className="p-4 rounded-3xl bg-white border border-slate-200 space-y-2.5 text-xs">
              <div className="flex items-start gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Origin / Pickup</p>
                  <p className="font-bold text-slate-800">{confirmedRide?.request?.pickup_location || confirmedRide?.ride?.start_location}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#123F7A] mt-1 shrink-0" />
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Destination</p>
                  <p className="font-bold text-slate-800">{confirmedRide?.ride?.destination}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-bold">
                <span className="text-slate-600">Agreed Fuel Share:</span>
                <span className="text-sm font-black text-[#1769D2]">₹{confirmedRide?.agreed_fuel_contribution || 25}</span>
              </div>
            </div>

            {/* Rider Specific Lifecycle Controls */}
            {isRider && (
              <div className="space-y-2.5 pt-2">
                <p className="text-[11px] font-bold text-slate-700">Rider Trip Navigation & GPS Lifecycle:</p>

                {rideState === 'CONFIRMED' || rideState === 'ACCEPTED' ? (
                  <button
                    onClick={handleStartPickup}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-[#1769D2] hover:bg-[#123F7A] shadow-md transition flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Start Pickup Navigation (Enable Real GPS)
                  </button>
                ) : rideState === 'PICKUP_STARTED' ? (
                  <button
                    onClick={handleStartTrip}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Passenger Picked Up → Start Trip
                  </button>
                ) : rideState === 'TRIP_ACTIVE' ? (
                  <button
                    onClick={handleEndTrip}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 shadow-md transition flex items-center justify-center gap-2"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    Reached Destination → End Trip
                  </button>
                ) : (
                  <div className="p-3 text-center text-xs font-bold text-slate-500 bg-slate-100 rounded-xl">
                    Trip Completed
                  </div>
                )}
              </div>
            )}

            {/* Passenger Specific Status Card */}
            {isPassenger && (
              <div className="p-4 rounded-2xl bg-[#EAF3FF] border border-blue-200 text-xs space-y-2 text-[#123F7A]">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Passenger Live Tracking Active</span>
                </p>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Your rider’s actual GPS position updates automatically in real-time. Look out for vehicle {confirmedRide?.ride?.rider?.vehicle_number || ''}.
                </p>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* SHARE MODAL (Trusted Contact Link) */}
      {showShareModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-base text-[#123F7A] flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[#1769D2]" />
                <span>Share Live Journey</span>
              </h4>
              <button onClick={() => setShowShareModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Anyone with this secure link can track your live location and vehicle info in real time until this trip ends.
            </p>
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <input
                type="text"
                readOnly
                value={shareToken || ''}
                className="w-full bg-transparent text-slate-700 outline-none text-xs"
              />
              <button
                onClick={copyShareLink}
                className="px-3 py-1.5 rounded-lg bg-[#1769D2] text-white font-bold text-xs flex items-center gap-1 shrink-0"
              >
                {copiedShare ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedShare ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOS MODAL */}
      {showSosModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-red-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 border-2 border-red-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-red-600">
                <Shield className="w-6 h-6 fill-red-600 text-white" />
                <h3 className="font-black text-lg">EMERGENCY PROTOCOL</h3>
              </div>
              <button onClick={() => setShowSosModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {!sosDispatched ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Triggering SOS will immediately dispatch your GPS coordinates ({liveLocation ? `${liveLocation.latitude.toFixed(4)}, ${liveLocation.longitude.toFixed(4)}` : 'Current Location'}) to your emergency contact and local emergency services.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowSosModal(false)}
                    className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTriggerSOS}
                    className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-lg shadow-red-600/30 transition transform active:scale-95"
                  >
                    Confirm SOS Alert
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0" />
                  <span>EMERGENCY DISPATCH INITIATED</span>
                </div>
                <div className="space-y-2 text-xs text-slate-700">
                  <p className="font-bold">Hotlines Available:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href="tel:112"
                      className="p-2.5 bg-slate-100 rounded-xl text-center font-black text-slate-900 hover:bg-slate-200"
                    >
                      Dial 112 (Police)
                    </a>
                    <a
                      href="tel:1091"
                      className="p-2.5 bg-pink-100 rounded-xl text-center font-black text-pink-900 hover:bg-pink-200"
                    >
                      Dial 1091 (Women)
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => setShowSosModal(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
                >
                  Dismiss Notification
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RATING MODAL */}
      {showRatingModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-[#123F7A]">
              Trip Completed! Rate Your Co-traveler
            </h3>
            <p className="text-xs text-slate-500">
              How was your journey with {otherParty?.full_name}?
            </p>

            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRatingVal(star)}
                  className="p-1 text-amber-400 hover:scale-110 transition"
                >
                  <Star
                    className={`w-7 h-7 ${star <= ratingVal ? 'fill-amber-400' : 'text-slate-300'}`}
                  />
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={reviewVal}
              onChange={(e) => setReviewVal(e.target.value)}
              placeholder="Leave a short verified review (punctuality, helmet, safety)..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1769D2]"
            />

            {ratingSubmitted ? (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl text-center">
                Review recorded to user profile!
              </div>
            ) : (
              <button
                onClick={handleSubmitRating}
                className="w-full py-3 rounded-xl font-bold text-xs text-white bg-[#1769D2] hover:bg-[#123F7A] shadow-md transition"
              >
                Submit Rating & Return
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
