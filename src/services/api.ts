import {
  User,
  OfferedRide,
  RideRequest,
  ConfirmedRide,
  LiveLocation,
  MatchResult,
  NotificationItem,
  RatingReview,
  RideHistoryItem,
  LocationPoint,
  RouteData
} from '../types/index.ts';

const TOKEN_KEY = 'rigoo_auth_token';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  setToken: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  getToken: () => localStorage.getItem(TOKEN_KEY),
  clearToken: () => {
    localStorage.removeItem(TOKEN_KEY);
  },

  // Auth
  signup: async (data: any): Promise<{ user: User; token: string }> => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Signup failed');
    return json;
  },

  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Login failed');
    return json;
  },

  getCurrentUser: async (): Promise<{ user: User }> => {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch user');
    return json;
  },

  updateProfile: async (data: any): Promise<{ user: User }> => {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update profile');
    return json;
  },

  // Rides
  offerRide: async (data: any): Promise<{ ride: OfferedRide }> => {
    const res = await fetch('/api/rides/offer', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to offer ride');
    return json;
  },

  getRides: async (filters: { status?: string; riderId?: number; date?: string } = {}): Promise<{ rides: OfferedRide[] }> => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.riderId) params.append('riderId', String(filters.riderId));
    if (filters.date) params.append('date', filters.date);

    const res = await fetch(`/api/rides?${params.toString()}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load rides');
    return json;
  },

  getRideById: async (id: number): Promise<{ ride: OfferedRide }> => {
    const res = await fetch(`/api/rides/${id}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load ride');
    return json;
  },

  // Search & Match
  searchRides: async (data: any): Promise<{
    matches: MatchResult[];
    totalFound: number;
    womenPreferenceActive: boolean;
    noFemaleRidersAvailable: boolean;
  }> => {
    const res = await fetch('/api/rides/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Search failed');
    return json;
  },

  // Requests
  requestRide: async (data: any): Promise<{ request: RideRequest }> => {
    const res = await fetch('/api/rides/request', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to send ride request');
    return json;
  },

  getRiderRequests: async (): Promise<{ requests: RideRequest[] }> => {
    const res = await fetch('/api/rides/requests/rider', {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load rider requests');
    return json;
  },

  getPassengerRequests: async (): Promise<{ requests: RideRequest[] }> => {
    const res = await fetch('/api/rides/requests/passenger', {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load passenger requests');
    return json;
  },

  acceptRequest: async (requestId: number): Promise<any> => {
    const res = await fetch(`/api/rides/requests/${requestId}/accept`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to accept request');
    return json;
  },

  rejectRequest: async (requestId: number): Promise<any> => {
    const res = await fetch(`/api/rides/requests/${requestId}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to reject request');
    return json;
  },

  // Tracking & Lifecycle
  getTrackingState: async (rideId: number): Promise<any> => {
    const res = await fetch(`/api/rides/${rideId}/tracking`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to get tracking info');
    return json;
  },

  startPickup: async (rideId: number): Promise<any> => {
    const res = await fetch(`/api/rides/${rideId}/start-pickup`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to start pickup');
    return json;
  },

  startTrip: async (rideId: number): Promise<any> => {
    const res = await fetch(`/api/rides/${rideId}/start-trip`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to start trip');
    return json;
  },

  endTrip: async (rideId: number): Promise<any> => {
    const res = await fetch(`/api/rides/${rideId}/end-trip`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to end trip');
    return json;
  },

  updateLocation: async (rideId: number, data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    heading?: number;
    speed?: number;
  }): Promise<{ success: boolean; location: LiveLocation }> => {
    const res = await fetch(`/api/rides/${rideId}/location`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to record location');
    return json;
  },

  // Sharing & SOS
  generateShareToken: async (rideId: number): Promise<{ shareToken: string; expires_at: string }> => {
    const res = await fetch(`/api/rides/${rideId}/share-token`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create share link');
    return json;
  },

  getSharedTrip: async (token: string): Promise<any> => {
    const res = await fetch(`/api/trip-share/${token}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Shared trip not found');
    return json;
  },

  triggerEmergencySOS: async (data: {
    ride_id?: number;
    latitude?: number;
    longitude?: number;
    address?: string;
  }): Promise<any> => {
    const res = await fetch('/api/safety/sos', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to trigger SOS');
    return json;
  },

  // Ratings
  submitRating: async (data: {
    ride_id: number;
    reviewee_id: number;
    rating: number;
    review: string;
    role: 'RIDER' | 'PASSENGER';
  }): Promise<{ rating: RatingReview }> => {
    const res = await fetch('/api/ratings', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to submit review');
    return json;
  },

  getUserRatings: async (userId: number): Promise<{ ratings: RatingReview[] }> => {
    const res = await fetch(`/api/users/${userId}/ratings`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch reviews');
    return json;
  },

  // History & Notifications
  getHistory: async (): Promise<{ history: RideHistoryItem[] }> => {
    const res = await fetch('/api/history', {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load history');
    return json;
  },

  getNotifications: async (): Promise<{ notifications: NotificationItem[] }> => {
    const res = await fetch('/api/notifications', {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load notifications');
    return json;
  },

  markNotificationRead: async (id: number): Promise<any> => {
    const res = await fetch(`/api/notifications/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json;
  },

  // Lyra AI / RideMate
  chatWithAI: async (message: string, currentUser?: User | null): Promise<{
    text: string;
    suggestedActions?: Array<{ label: string; action: string; payload?: any }>;
    matchedRides?: OfferedRide[];
  }> => {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, currentUser }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'AI assistant request failed');
    return json;
  },

  // Autocomplete & Maps
  getAutocomplete: async (input: string): Promise<LocationPoint[]> => {
    const res = await fetch(`/api/maps/autocomplete?input=${encodeURIComponent(input)}`);
    const json = await res.json();
    return json.predictions || [];
  },

  reverseGeocode: async (lat: number, lng: number): Promise<{ location: LocationPoint }> => {
    const res = await fetch(`/api/maps/reverse-geocode?lat=${lat}&lng=${lng}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to resolve location');
    return json;
  },

  getRoute: async (originLat: number, originLng: number, destLat: number, destLng: number): Promise<{ route: RouteData }> => {
    const res = await fetch(`/api/maps/route?origin_lat=${originLat}&origin_lng=${originLng}&dest_lat=${destLat}&dest_lng=${destLng}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to calculate route');
    return json;
  },

  /**
   * Official Google Maps Directions URL construction with EXACT locations and Place IDs
   */
  getGoogleMapsDirectionsUrl: (
    origin: { address?: string; place_id?: string; lat?: number; lng?: number },
    destination: { address?: string; place_id?: string; lat?: number; lng?: number }
  ): string => {
    const params = new URLSearchParams();
    params.set('api', '1');
    params.set('travelmode', 'two_wheeler');

    if (origin.address) {
      params.set('origin', origin.address);
    } else if (origin.lat !== undefined && origin.lng !== undefined) {
      params.set('origin', `${origin.lat},${origin.lng}`);
    }

    if (origin.place_id && !origin.place_id.startsWith('place_') && !origin.place_id.startsWith('gps_')) {
      params.set('origin_place_id', origin.place_id);
    }

    if (destination.address) {
      params.set('destination', destination.address);
    } else if (destination.lat !== undefined && destination.lng !== undefined) {
      params.set('destination', `${destination.lat},${destination.lng}`);
    }

    if (destination.place_id && !destination.place_id.startsWith('dest_') && !destination.place_id.startsWith('gps_')) {
      params.set('destination_place_id', destination.place_id);
    }

    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }
};
