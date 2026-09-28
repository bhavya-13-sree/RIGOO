export interface LocationPoint {
  name: string;
  description: string;
  address?: string;
  place_id: string;
  lat: number;
  lng: number;
}

export interface RouteData {
  distance_km: number;
  duration_mins: number;
  coordinates: Array<[number, number]>;
  polyline?: string;
}

export interface EmergencyContact {
  id?: number;
  user_id?: number;
  contact_name: string;
  phone_number: string;
  relationship: string;
  is_primary?: boolean;
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  mobile_number: string;
  age: number;
  gender: 'Female' | 'Male' | 'Non-binary' | 'Other';
  college_or_org: string;
  profile_photo: string;
  bio?: string;
  vehicle_model?: string;
  vehicle_number?: string;
  is_verified: boolean;
  rating_avg: number;
  total_rides_offered: number;
  total_rides_taken: number;
  created_at: string;
  emergency_contact?: EmergencyContact | null;
  verification?: {
    status: 'PENDING' | 'VERIFIED' | 'REJECTED';
    verification_type?: string;
  };
}

export interface OfferedRide {
  id: number;
  rider_id: number;
  rider?: User;
  start_location: string;
  start_lat: number;
  start_lng: number;
  start_place_id?: string;
  destination: string;
  dest_lat: number;
  dest_lng: number;
  dest_place_id?: string;
  departure_date: string;
  departure_time: string;
  available_seats: number;
  fuel_contribution: number;
  route_polyline?: string;
  route_coordinates?: Array<[number, number]>;
  route_distance_km: number;
  route_duration_mins: number;
  pickup_preferences?: string;
  women_only: boolean;
  status: 'OFFERED' | 'REQUESTED' | 'ACCEPTED' | 'PICKUP_STARTED' | 'PASSENGER_PICKED_UP' | 'TRIP_ACTIVE' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
}

export interface RideRequest {
  id: number;
  ride_id: number;
  passenger_id: number;
  pickup_location: string;
  pickup_place_id?: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_location: string;
  dropoff_place_id?: string;
  dropoff_lat: number;
  dropoff_lng: number;
  requested_time: string;
  suggested_pickup_point?: string;
  compatibility_score: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  created_at: string;
  passenger?: User;
  ride?: OfferedRide;
}

export interface MatchResult {
  ride: OfferedRide;
  compatibilityScore: number;
  pickupProximityKm: number;
  destinationProximityKm: number;
  timeDiffMinutes: number;
  suggestedPickupPoint: string;
  suggestedPickupLat: number;
  suggestedPickupLng: number;
  matchReasons: string[];
  detourDistanceKm: number;
  isWomenSafeMatch: boolean;
}

export interface ConfirmedRide {
  id: number;
  ride_id: number;
  request_id: number;
  rider_id: number;
  passenger_id: number;
  agreed_fuel_contribution: number;
  status: 'CONFIRMED' | 'PICKUP_STARTED' | 'PASSENGER_PICKED_UP' | 'TRIP_ACTIVE' | 'COMPLETED' | 'CANCELLED';
  pickup_started_at?: string;
  actual_pickup_at?: string;
  trip_started_at?: string;
  actual_completed_at?: string;
  created_at: string;
  ride?: OfferedRide;
  request?: RideRequest;
  rider?: User;
  passenger?: User;
  latest_location?: LiveLocation | null;
}

export interface LiveLocation {
  id: number;
  ride_id: number;
  user_id: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  heading: number;
  speed: number;
  recorded_at: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  related_ride_id?: number | null;
  is_read: boolean;
  created_at: string;
}

export interface RatingReview {
  id: number;
  ride_id: number;
  reviewer_id: number;
  reviewee_id: number;
  rating: number;
  review: string;
  role: 'RIDER' | 'PASSENGER';
  created_at: string;
  reviewer_name?: string;
  reviewer_photo?: string;
}

export interface RideHistoryItem {
  id: number;
  confirmed_ride_id: number;
  rider_id: number;
  passenger_id: number;
  start_location: string;
  destination: string;
  departure_time: string;
  completed_at: string;
  fuel_contribution: number;
  distance_km: number;
  duration_mins: number;
  status: string;
}
