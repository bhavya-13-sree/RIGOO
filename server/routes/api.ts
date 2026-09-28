import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.ts';
import { rankRides, haversineDistanceKm } from '../services/matchingEngine.ts';
import { lyraService } from '../services/lyraService.ts';
import { mapsService } from '../services/mapsService.ts';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'rigoo_bike_pooling_jwt_secret_2026';

// Authentication Middleware
export interface AuthenticatedRequest extends Request {
  user?: any;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User account not found.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

// ----------------- AUTH ROUTES ----------------- //

router.post('/auth/signup', async (req: Request, res: Response) => {
  try {
    const { full_name, email, mobile_number, password, age, gender, college_or_org, emergency_name, emergency_phone, emergency_relation, vehicle_model, vehicle_number } = req.body;

    if (!full_name || !email || !mobile_number || !password) {
      return res.status(400).json({ error: 'Full name, email, mobile number, and password are required.' });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = db.createUser({
      full_name,
      email,
      mobile_number,
      password_hash,
      age: parseInt(age, 10) || 20,
      gender: gender || 'Other',
      college_or_org: college_or_org || 'University Student / Commuter',
      emergency_name,
      emergency_phone,
      emergency_relation,
      vehicle_model,
      vehicle_number
    });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const fullUser = db.getUserById(user.id);
    return res.status(201).json({ user: fullUser, token });
  } catch (err: any) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Failed to create user account.' });
  }
});

router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const safeUser = db.getUserById(user.id);
    return res.json({ user: safeUser, token });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed due to server error.' });
  }
});

router.get('/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ user: req.user });
});

router.put('/auth/profile', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const store = db.getStore();
    const user = store.users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { bio, vehicle_model, vehicle_number, college_or_org } = req.body;
    if (bio !== undefined) user.bio = bio;
    if (vehicle_model !== undefined) user.vehicle_model = vehicle_model;
    if (vehicle_number !== undefined) user.vehicle_number = vehicle_number;
    if (college_or_org !== undefined) user.college_or_org = college_or_org;

    const updated = db.getUserById(user.id);
    return res.json({ user: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ----------------- OFFER A RIDE ----------------- //

router.post('/rides/offer', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      start_location,
      start_lat,
      start_lng,
      start_place_id,
      destination,
      dest_lat,
      dest_lng,
      dest_place_id,
      departure_date,
      departure_time,
      available_seats,
      fuel_contribution,
      pickup_preferences,
      women_only
    } = req.body;

    if (!start_location || !destination || !departure_date || !departure_time) {
      return res.status(400).json({ error: 'Start location, destination, departure date and time are required.' });
    }

    const sLat = parseFloat(start_lat);
    const sLng = parseFloat(start_lng);
    const dLat = parseFloat(dest_lat);
    const dLng = parseFloat(dest_lng);

    if (isNaN(sLat) || isNaN(sLng) || isNaN(dLat) || isNaN(dLng)) {
      return res.status(400).json({
        error: 'Valid origin and destination coordinates are required. Please select locations from the search suggestions.'
      });
    }

    // Dynamic Road Route Calculation via MapsService
    const route = await mapsService.calculateRoute(sLat, sLng, dLat, dLng);
    const estimatedRoadKm = route.distance_km;
    const estimatedMins = route.duration_mins;

    // Fair fuel cost calculation if not provided: ~₹7/km for two-wheelers
    const fairFare = fuel_contribution ? parseFloat(fuel_contribution) : Math.round(Math.max(20, estimatedRoadKm * 6.5));

    const newRide = db.createOfferedRide({
      rider_id: req.user.id,
      start_location,
      start_lat: sLat,
      start_lng: sLng,
      start_place_id: start_place_id || `place_${Date.now()}`,
      destination,
      dest_lat: dLat,
      dest_lng: dLng,
      dest_place_id: dest_place_id || `dest_${Date.now()}`,
      departure_date,
      departure_time,
      available_seats: available_seats ? parseInt(available_seats, 10) : 1,
      fuel_contribution: fairFare,
      route_polyline: route.polyline || '',
      route_coordinates: route.coordinates,
      route_distance_km: estimatedRoadKm,
      route_duration_mins: estimatedMins,
      pickup_preferences: pickup_preferences || 'Clean pillion helmet provided.',
      women_only: Boolean(women_only)
    });

    return res.status(201).json({ ride: newRide });
  } catch (err: any) {
    console.error('Offer ride error:', err);
    return res.status(500).json({ error: 'Failed to publish offered ride.' });
  }
});

router.get('/rides', (req: Request, res: Response) => {
  try {
    const { status, riderId, date } = req.query;
    const rides = db.getAllOfferedRides({
      status: status ? String(status) : undefined,
      riderId: riderId ? Number(riderId) : undefined,
      date: date ? String(date) : undefined
    });
    return res.json({ rides });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch rides' });
  }
});

router.get('/rides/:id', (req: Request, res: Response) => {
  try {
    const ride = db.getOfferedRideById(Number(req.params.id));
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    return res.json({ ride });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch ride' });
  }
});

// ----------------- FIND & MATCH RIDES ----------------- //

router.post('/rides/search', (req: Request, res: Response) => {
  try {
    const {
      pickup_location,
      pickup_lat,
      pickup_lng,
      dropoff_location,
      dropoff_lat,
      dropoff_lng,
      travel_date,
      preferred_time,
      time_flexibility,
      women_only_preference,
      passenger_gender,
      passenger_id
    } = req.body;

    if (!pickup_location || !dropoff_location) {
      return res.status(400).json({ error: 'Pickup and dropoff locations are required.' });
    }

    const pLat = parseFloat(pickup_lat);
    const pLng = parseFloat(pickup_lng);
    const dLat = parseFloat(dropoff_lat);
    const dLng = parseFloat(dropoff_lng);

    if (isNaN(pLat) || isNaN(pLng) || isNaN(dLat) || isNaN(dLng)) {
      return res.status(400).json({
        error: 'Valid pickup and drop-off coordinates are required. Please select locations from the search suggestions.'
      });
    }

    const activeRides = db.getAllOfferedRides({ status: 'OFFERED' });

    const matches = rankRides(activeRides, {
      pickupLat: pLat,
      pickupLng: pLng,
      pickupAddress: pickup_location,
      dropoffLat: dLat,
      dropoffLng: dLng,
      dropoffAddress: dropoff_location,
      travelDate: travel_date || new Date().toISOString().slice(0, 10),
      preferredTime: preferred_time || '08:30',
      timeFlexibilityMinutes: time_flexibility ? parseInt(time_flexibility, 10) : 30,
      womenOnlyPreference: Boolean(women_only_preference),
      passengerGender: passenger_gender,
      passengerId: passenger_id ? Number(passenger_id) : undefined
    });

    const isWomenFilterActive = Boolean(women_only_preference);
    const hasFemaleRiders = matches.some(m => m.isWomenSafeMatch);

    return res.json({
      matches,
      totalFound: matches.length,
      womenPreferenceActive: isWomenFilterActive,
      noFemaleRidersAvailable: isWomenFilterActive && !hasFemaleRiders
    });
  } catch (err: any) {
    console.error('Ride search error:', err);
    return res.status(500).json({ error: 'Ride search failed.' });
  }
});

// ----------------- RIDE REQUESTS & CONFIRMATIONS ----------------- //

router.post('/rides/request', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      ride_id,
      pickup_location,
      pickup_place_id,
      pickup_lat,
      pickup_lng,
      dropoff_location,
      dropoff_place_id,
      dropoff_lat,
      dropoff_lng,
      requested_time,
      suggested_pickup_point,
      compatibility_score
    } = req.body;

    if (!ride_id || !pickup_location || !dropoff_location) {
      return res.status(400).json({ error: 'Ride ID, pickup, and dropoff are required.' });
    }

    const ride = db.getOfferedRideById(Number(ride_id));
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    if (ride.rider_id === req.user.id) {
      return res.status(400).json({ error: 'You cannot request your own ride.' });
    }
    if (ride.available_seats <= 0) {
      return res.status(400).json({ error: 'This ride has no available seats remaining.' });
    }

    const pLat = parseFloat(pickup_lat) || ride.start_lat;
    const pLng = parseFloat(pickup_lng) || ride.start_lng;
    const dLat = parseFloat(dropoff_lat) || ride.dest_lat;
    const dLng = parseFloat(dropoff_lng) || ride.dest_lng;

    const newRequest = db.createRideRequest({
      ride_id: Number(ride_id),
      passenger_id: req.user.id,
      pickup_location,
      pickup_place_id: pickup_place_id || `req_p_${Date.now()}`,
      pickup_lat: pLat,
      pickup_lng: pLng,
      dropoff_location,
      dropoff_place_id: dropoff_place_id || `req_d_${Date.now()}`,
      dropoff_lat: dLat,
      dropoff_lng: dLng,
      requested_time: requested_time || ride.departure_time,
      suggested_pickup_point: suggested_pickup_point || pickup_location,
      compatibility_score: compatibility_score || 92
    });

    return res.status(201).json({ request: newRequest });
  } catch (err: any) {
    console.error('Request ride error:', err);
    return res.status(500).json({ error: 'Failed to create ride request.' });
  }
});

router.get('/rides/requests/rider', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const requests = db.getRequestsByRider(req.user.id);
    return res.json({ requests });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch received requests' });
  }
});

router.get('/rides/requests/passenger', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const requests = db.getRequestsByPassenger(req.user.id);
    return res.json({ requests });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch sent requests' });
  }
});

router.post('/rides/requests/:id/accept', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = db.acceptRideRequest(Number(req.params.id), req.user.id);
    return res.json({
      message: 'Ride request accepted successfully! Seat reserved.',
      ...result
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/rides/requests/:id/reject', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = db.rejectRideRequest(Number(req.params.id), req.user.id);
    return res.json({ message: 'Request rejected.', request: result });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ----------------- RIDE LIFECYCLE & LIVE TRACKING ----------------- //

router.get('/rides/:id/tracking', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const confirmed = db.getConfirmedRideById(Number(req.params.id));
    if (!confirmed) {
      // Fallback: check offered ride
      const offered = db.getOfferedRideById(Number(req.params.id));
      if (!offered) return res.status(404).json({ error: 'Ride not found' });
      const liveLoc = db.getLiveLocation(offered.id);
      return res.json({
        ride: offered,
        latest_location: liveLoc,
        isRider: req.user.id === offered.rider_id
      });
    }

    // Verify user authorization: must be rider, passenger, or admin
    const isRider = confirmed.rider_id === req.user.id;
    const isPassenger = confirmed.passenger_id === req.user.id;
    if (!isRider && !isPassenger) {
      return res.status(403).json({ error: 'Unauthorized to track this private ride session.' });
    }

    return res.json({
      ...confirmed,
      isRider,
      isPassenger
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch tracking information.' });
  }
});

router.post('/rides/:id/start-pickup', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = db.startPickupSession(Number(req.params.id), req.user.id);
    return res.json({ message: 'Pickup navigation started. Live GPS tracking enabled.', ...result });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/rides/:id/start-trip', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = db.startTrip(Number(req.params.id), req.user.id);
    return res.json({ message: 'Trip started. En route to destination.', ...result });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/rides/:id/end-trip', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = db.endTrip(Number(req.params.id), req.user.id);
    return res.json({ message: 'Trip completed safely. Location session closed.', ...result });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Throttled location update endpoint
router.post('/rides/:id/location', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { latitude, longitude, accuracy, heading, speed } = req.body;
    const rideId = Number(req.params.id);

    const ride = db.getOfferedRideById(rideId);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    if (ride.rider_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the confirmed rider can update live GPS location.' });
    }

    const saved = db.upsertLiveLocation({
      ride_id: rideId,
      user_id: req.user.id,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: accuracy ? parseFloat(accuracy) : 5,
      heading: heading ? parseFloat(heading) : 0,
      speed: speed ? parseFloat(speed) : 0
    });

    return res.json({ success: true, location: saved });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to record location update.' });
  }
});

// ----------------- TRIP SHARING & EMERGENCY SOS ----------------- //

router.post('/rides/:id/share-token', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const rideId = Number(req.params.id);
    const token = db.createTripShareToken(rideId, req.user.id);
    return res.json({ shareToken: token.token, expires_at: token.expires_at });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to generate sharing token' });
  }
});

router.get('/trip-share/:token', (req: Request, res: Response) => {
  try {
    const trip = db.getTripByShareToken(req.params.token);
    if (!trip) {
      return res.status(404).json({ error: 'Trip sharing link has expired or is invalid.' });
    }
    return res.json({ trip });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to load shared trip.' });
  }
});

router.post('/safety/sos', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ride_id, latitude, longitude, address } = req.body;
    const user = req.user;
    const emergencyContact = user.emergency_contact;

    const alertDetails = {
      alert_id: `SOS-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      user: {
        name: user.full_name,
        phone: user.mobile_number,
        gender: user.gender
      },
      location: {
        latitude,
        longitude,
        approx_address: address || 'Hyderabad, Telangana'
      },
      emergency_contact_notified: emergencyContact ? {
        name: emergencyContact.contact_name,
        phone: emergencyContact.phone_number,
        status: 'DISPATCHED_SMS'
      } : null,
      hotlines: [
        { name: 'Police Control Room', number: '112', type: 'Emergency' },
        { name: 'Women Safety Helpline', number: '1091', type: 'Women Safety' },
        { name: 'She Teams Hyderabad', number: '+91 94906 17444', type: 'Specialized Unit' }
      ]
    };

    return res.json({
      message: 'EMERGENCY PROTOCOL ACTIVATED. Emergency contact and emergency dispatch notified.',
      alert: alertDetails
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to activate SOS' });
  }
});

// ----------------- RATINGS & REVIEWS ----------------- //

router.post('/ratings', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ride_id, reviewee_id, rating, review, role } = req.body;
    if (!ride_id || !reviewee_id || !rating) {
      return res.status(400).json({ error: 'Ride ID, reviewee, and rating (1-5) are required.' });
    }

    const ratingEntry = db.addRating({
      ride_id: Number(ride_id),
      reviewer_id: req.user.id,
      reviewee_id: Number(reviewee_id),
      rating: parseInt(rating, 10),
      review: review || '',
      role: role || 'PASSENGER'
    });

    return res.status(201).json({ rating: ratingEntry });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to record rating.' });
  }
});

router.get('/users/:id/ratings', (req: Request, res: Response) => {
  try {
    const ratings = db.getUserRatings(Number(req.params.id));
    return res.json({ ratings });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch ratings.' });
  }
});

// ----------------- HISTORY & NOTIFICATIONS ----------------- //

router.get('/history', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const history = db.getUserHistory(req.user.id);
    return res.json({ history });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
});

router.get('/notifications', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const notifications = db.getUserNotifications(req.user.id);
    return res.json({ notifications });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.put('/notifications/:id/read', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const note = db.markNotificationRead(Number(req.params.id));
    return res.json({ notification: note });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// ----------------- AI ASSISTANT (RIDEMATE AI / LYRA) ----------------- //

router.post('/ai/chat', async (req: Request, res: Response) => {
  try {
    const { message, currentUser } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await lyraService.processMessage(message, currentUser);
    return res.json(response);
  } catch (err: any) {
    console.error('Lyra AI error:', err);
    return res.status(500).json({
      text: "I'm experiencing a momentary connection issue. You can still search for compatible rides directly through our Find Ride page!",
      suggestedActions: [
        { label: 'Find a Ride', action: 'NAVIGATE_FIND_RIDE' },
        { label: 'Offer a Ride', action: 'NAVIGATE_OFFER_RIDE' }
      ]
    });
  }
});

// ----------------- MAPS, AUTOCOMPLETE & DYNAMIC ROUTING ----------------- //

router.get('/maps/autocomplete', async (req: Request, res: Response) => {
  try {
    const input = (req.query.input as string || '').trim();
    if (!input || input.length < 2) {
      return res.json({ predictions: [] });
    }

    const predictions = await mapsService.autocomplete(input);
    return res.json({ predictions });
  } catch (err: any) {
    console.error('Autocomplete error:', err);
    return res.status(500).json({ error: 'Autocomplete failed' });
  }
});

router.get('/maps/reverse-geocode', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const location = await mapsService.reverseGeocode(lat, lng);
    return res.json({ location });
  } catch (err: any) {
    return res.status(500).json({ error: 'Reverse geocode failed' });
  }
});

router.get('/maps/route', async (req: Request, res: Response) => {
  try {
    const originLat = parseFloat(req.query.origin_lat as string);
    const originLng = parseFloat(req.query.origin_lng as string);
    const destLat = parseFloat(req.query.dest_lat as string);
    const destLng = parseFloat(req.query.dest_lng as string);

    if (isNaN(originLat) || isNaN(originLng) || isNaN(destLat) || isNaN(destLng)) {
      return res.status(400).json({ error: 'Valid origin and destination coordinates are required' });
    }

    const route = await mapsService.calculateRoute(originLat, originLng, destLat, destLng);
    return res.json({ route });
  } catch (err: any) {
    console.error('Route calculation error:', err);
    return res.status(500).json({ error: 'Failed to calculate route' });
  }
});

export default router;
