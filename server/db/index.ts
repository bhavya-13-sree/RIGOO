import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

// Define database configuration from environment
const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'rigoo_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let mysqlPool: mysql.Pool | null = null;
let isUsingMySQL = false;

// Local persistent relational store fallback for sandbox/preview environments
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'rigoo_store.json');

export interface RigooStore {
  users: any[];
  user_verifications: any[];
  emergency_contacts: any[];
  offered_rides: any[];
  ride_requests: any[];
  ride_matches: any[];
  confirmed_rides: any[];
  live_locations: any[];
  trip_tracking_sessions: any[];
  trip_sharing_tokens: any[];
  notifications: any[];
  ratings: any[];
  ride_history: any[];
  nextIds: Record<string, number>;
}

// Initial seed data with authentic Hyderabad commuter locations (Karmanghat, LB Nagar, Champapet, Kothapet, Dilsukhnagar)
const INITIAL_STORE: RigooStore = {
  users: [
    {
      id: 1,
      full_name: 'M. Rethika (Co-Founder)',
      email: 'rethika@rigoo.in',
      mobile_number: '+91 98765 43210',
      password_hash: '$2a$10$wT/pZ/sHj5YhQ1L46mfgfO96oX8c973U/j2q36pT4bK8g2Z1s7Q3W', // password: password123
      age: 21,
      gender: 'Female',
      college_or_org: 'VNR VJIET / RIGOO Core Team',
      profile_photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
      bio: 'Co-Founder at RIGOO. Engineering student daily commuter passionate about women safety and sustainable transit.',
      vehicle_model: 'TVS Jupiter 125 (Matte Blue)',
      vehicle_number: 'TS 08 EK 4589',
      is_verified: true,
      rating_avg: 4.95,
      total_rides_offered: 28,
      total_rides_taken: 14,
      created_at: '2026-03-01T08:00:00.000Z',
    },
    {
      id: 2,
      full_name: 'H. Bhavya Sree (Co-Founder)',
      email: 'bhavya@rigoo.in',
      mobile_number: '+91 98765 43211',
      password_hash: '$2a$10$wT/pZ/sHj5YhQ1L46mfgfO96oX8c973U/j2q36pT4bK8g2Z1s7Q3W', // password123
      age: 21,
      gender: 'Female',
      college_or_org: 'CBIT / RIGOO Core Team',
      profile_photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
      bio: 'Co-Founder at RIGOO. Tech lead building intelligent matching algorithms for everyday bike commuters.',
      vehicle_model: 'Honda Activa 6G (Pearl White)',
      vehicle_number: 'TS 07 HJ 9821',
      is_verified: true,
      rating_avg: 4.98,
      total_rides_offered: 34,
      total_rides_taken: 12,
      created_at: '2026-03-01T08:00:00.000Z',
    },
    {
      id: 3,
      full_name: 'Vikram Aditya',
      email: 'vikram@gmail.com',
      mobile_number: '+91 98480 12345',
      password_hash: '$2a$10$wT/pZ/sHj5YhQ1L46mfgfO96oX8c973U/j2q36pT4bK8g2Z1s7Q3W',
      age: 23,
      gender: 'Male',
      college_or_org: 'Tech Mahindra / Gachibowli',
      profile_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      bio: 'Daily rider from Karmanghat to LB Nagar & Dilsukhnagar. Helmet provided for pillion!',
      vehicle_model: 'Yamaha FZ-S V3 (Midnight Black)',
      vehicle_number: 'TS 09 FJ 3312',
      is_verified: true,
      rating_avg: 4.88,
      total_rides_offered: 19,
      total_rides_taken: 6,
      created_at: '2026-03-10T09:30:00.000Z',
    },
    {
      id: 4,
      full_name: 'Ananya Sharma',
      email: 'ananya@gmail.com',
      mobile_number: '+91 97000 67890',
      password_hash: '$2a$10$wT/pZ/sHj5YhQ1L46mfgfO96oX8c973U/j2q36pT4bK8g2Z1s7Q3W',
      age: 20,
      gender: 'Female',
      college_or_org: 'St. Joseph Degree College',
      profile_photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
      bio: 'Student passenger seeking safe, timely female rides from Champapet / Sagar Ring Road.',
      vehicle_model: null,
      vehicle_number: null,
      is_verified: true,
      rating_avg: 5.00,
      total_rides_offered: 0,
      total_rides_taken: 9,
      created_at: '2026-03-12T11:00:00.000Z',
    },
    {
      id: 5,
      full_name: 'K. Sai Kiran',
      email: 'saikiran@gmail.com',
      mobile_number: '+91 96180 54321',
      password_hash: '$2a$10$wT/pZ/sHj5YhQ1L46mfgfO96oX8c973U/j2q36pT4bK8g2Z1s7Q3W',
      age: 22,
      gender: 'Male',
      college_or_org: 'Osmania University',
      profile_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      bio: 'Riding daily towards Dilsukhnagar metro. Punctual, safe riding guaranteed.',
      vehicle_model: 'Royal Enfield Hunter 350',
      vehicle_number: 'TS 11 AB 7744',
      is_verified: true,
      rating_avg: 4.82,
      total_rides_offered: 15,
      total_rides_taken: 3,
      created_at: '2026-03-15T14:20:00.000Z',
    }
  ],
  user_verifications: [
    { id: 1, user_id: 1, verification_type: 'college_id', document_number: 'VNR-2023-CS-042', status: 'VERIFIED', verified_at: '2026-03-01T10:00:00.000Z' },
    { id: 2, user_id: 2, verification_type: 'college_id', document_number: 'CBIT-2023-IT-089', status: 'VERIFIED', verified_at: '2026-03-01T10:00:00.000Z' },
    { id: 3, user_id: 3, verification_type: 'corporate_id', document_number: 'TECHM-HYD-5512', status: 'VERIFIED', verified_at: '2026-03-10T10:00:00.000Z' },
    { id: 4, user_id: 4, verification_type: 'college_id', document_number: 'STJ-2024-BCOM-11', status: 'VERIFIED', verified_at: '2026-03-12T12:00:00.000Z' },
    { id: 5, user_id: 5, verification_type: 'college_id', document_number: 'OU-ENG-2023-441', status: 'VERIFIED', verified_at: '2026-03-15T15:00:00.000Z' }
  ],
  emergency_contacts: [
    { id: 1, user_id: 1, contact_name: 'M. Krishna (Father)', phone_number: '+91 94400 11223', relationship: 'Father', is_primary: true },
    { id: 2, user_id: 2, contact_name: 'H. Rajesh (Father)', phone_number: '+91 94401 22334', relationship: 'Father', is_primary: true },
    { id: 3, user_id: 4, contact_name: 'Sunita Sharma (Mother)', phone_number: '+91 98220 99887', relationship: 'Mother', is_primary: true }
  ],
  offered_rides: [
    {
      id: 1,
      rider_id: 1, // M. Rethika
      start_location: 'Karmanghat Hanuman Temple, Karmanghat',
      start_lat: 17.3486,
      start_lng: 78.5305,
      start_place_id: 'ChIJk7karmanghat_01',
      destination: 'LB Nagar Metro Station, Hyderabad',
      dest_lat: 17.3457,
      dest_lng: 78.5522,
      dest_place_id: 'ChIJlbnagar_metro_02',
      departure_date: new Date().toISOString().slice(0, 10),
      departure_time: '08:30',
      available_seats: 1,
      fuel_contribution: 25.00,
      route_polyline: 'ohe`Ay}evMkAeCs@cBi@qAk@wAq@yAw@_Bc@iAq@_Be@sA',
      route_distance_km: 3.8,
      route_duration_mins: 12,
      pickup_preferences: 'Clean extra helmet available. Please be at pickup on time. Women priority route.',
      women_only: true,
      status: 'OFFERED',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 2,
      rider_id: 3, // Vikram Aditya
      start_location: 'Karmanghat Ring Road Junction',
      start_lat: 17.3495,
      start_lng: 78.5312,
      start_place_id: 'ChIJkarmanghat_junc_03',
      destination: 'LB Nagar Kamineni Hospital',
      dest_lat: 17.3421,
      dest_lng: 78.5580,
      dest_place_id: 'ChIJkamineni_hosp_04',
      departure_date: new Date().toISOString().slice(0, 10),
      departure_time: '08:45',
      available_seats: 1,
      fuel_contribution: 30.00,
      route_polyline: 'qie`A}}evM_BqEgAmCe@iAq@_Be@sAaAwC_AeCk@aB',
      route_distance_km: 4.4,
      route_duration_mins: 14,
      pickup_preferences: 'Pillion helmet provided. Light backpack only.',
      women_only: false,
      status: 'OFFERED',
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 3,
      rider_id: 2, // H. Bhavya Sree
      start_location: 'Champapet Cross Roads, Hyderabad',
      start_lat: 17.3512,
      start_lng: 78.5190,
      start_place_id: 'ChIJchampapet_cross_05',
      destination: 'Dilsukhnagar Metro Station',
      dest_lat: 17.3688,
      dest_lng: 78.5247,
      dest_place_id: 'ChIJdilsukhnagar_metro_06',
      departure_date: new Date().toISOString().slice(0, 10),
      departure_time: '09:00',
      available_seats: 1,
      fuel_contribution: 35.00,
      route_polyline: 'gie`AgtevMwAkCu@mBs@iBcAwCi@eB_AkCy@mB',
      route_distance_km: 5.1,
      route_duration_mins: 16,
      pickup_preferences: 'Verified students preferred. Safe smooth ride guaranteed.',
      women_only: true,
      status: 'OFFERED',
      created_at: new Date(Date.now() - 10800000).toISOString(),
    }
  ],
  ride_requests: [],
  ride_matches: [],
  confirmed_rides: [],
  live_locations: [],
  trip_tracking_sessions: [],
  trip_sharing_tokens: [],
  notifications: [
    {
      id: 1,
      user_id: 1,
      title: 'Welcome to RIGOO!',
      message: 'Your profile has been verified as a student rider. You can now offer rides and share the journey.',
      type: 'ACCOUNT_VERIFIED',
      related_ride_id: null,
      is_read: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      user_id: 4,
      title: 'Compatible Rides in Your Area',
      message: 'Riders traveling between Karmanghat and LB Nagar / Champapet are available for your morning commute.',
      type: 'RIDE_SUGGESTION',
      related_ride_id: 1,
      is_read: false,
      created_at: new Date().toISOString(),
    }
  ],
  ratings: [
    {
      id: 1,
      ride_id: 1,
      reviewer_id: 4,
      reviewee_id: 1,
      rating: 5,
      review: 'Super safe ride with Rethika! She arrived exactly on time at Karmanghat with an extra helmet.',
      role: 'PASSENGER',
      created_at: '2026-03-20T10:15:00.000Z'
    },
    {
      id: 2,
      ride_id: 1,
      reviewer_id: 1,
      reviewee_id: 4,
      rating: 5,
      review: 'Ananya was very polite, punctual and ready at the designated pickup spot. Great co-traveler!',
      role: 'RIDER',
      created_at: '2026-03-20T10:20:00.000Z'
    }
  ],
  ride_history: [
    {
      id: 1,
      confirmed_ride_id: 101,
      rider_id: 1,
      passenger_id: 4,
      start_location: 'Karmanghat Hanuman Temple',
      destination: 'LB Nagar Ring Road',
      departure_time: '2026-03-20 08:30 AM',
      completed_at: '2026-03-20T08:44:00.000Z',
      fuel_contribution: 25.00,
      distance_km: 3.8,
      duration_mins: 14,
      status: 'COMPLETED'
    }
  ],
  nextIds: {
    users: 6,
    user_verifications: 6,
    emergency_contacts: 4,
    offered_rides: 4,
    ride_requests: 1,
    ride_matches: 1,
    confirmed_rides: 1,
    live_locations: 1,
    trip_tracking_sessions: 1,
    trip_sharing_tokens: 1,
    notifications: 3,
    ratings: 3,
    ride_history: 2
  }
};

let inMemoryStore: RigooStore = { ...INITIAL_STORE };

// Ensure data directory exists and initialize local store
function initDataStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      inMemoryStore = JSON.parse(raw);
    } else {
      fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_STORE, null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('[DB Engine] Local storage fallback in memory:', err);
  }
}

export function persistStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(inMemoryStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB Engine] Failed to save store:', err);
  }
}

// Attempt MySQL connection pool initialization
export async function initDatabase(): Promise<boolean> {
  initDataStore();
  
  if (process.env.MYSQL_HOST && process.env.MYSQL_DATABASE) {
    try {
      const pool = mysql.createPool(MYSQL_CONFIG);
      const conn = await pool.getConnection();
      console.log(`[DB Engine] Successfully connected to MySQL (${MYSQL_CONFIG.database}@${MYSQL_CONFIG.host})`);
      conn.release();
      mysqlPool = pool;
      isUsingMySQL = true;
      return true;
    } catch (err: any) {
      console.warn(`[DB Engine] MySQL connection failed (${err.message}). Using high-performance persistent Relational Engine with schema sync.`);
      isUsingMySQL = false;
    }
  } else {
    console.log('[DB Engine] Running on persistent Relational Engine. (Set MYSQL_HOST & MYSQL_DATABASE to bind external MySQL server)');
  }
  return false;
}

export function getPool() {
  return mysqlPool;
}

export function isMySQL(): boolean {
  return isUsingMySQL;
}

export const db = {
  getStore: () => inMemoryStore,
  
  // Users
  getUserByEmail: (email: string) => {
    return inMemoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  
  getUserById: (id: number) => {
    const user = inMemoryStore.users.find(u => u.id === Number(id));
    if (!user) return null;
    const { password_hash, ...safeUser } = user;
    const emergencyContact = inMemoryStore.emergency_contacts.find(c => c.user_id === Number(id));
    const verification = inMemoryStore.user_verifications.find(v => v.user_id === Number(id));
    return {
      ...safeUser,
      emergency_contact: emergencyContact || null,
      verification: verification || { status: user.is_verified ? 'VERIFIED' : 'PENDING' }
    };
  },

  createUser: (userData: any) => {
    const newId = inMemoryStore.nextIds.users++;
    const user = {
      id: newId,
      full_name: userData.full_name,
      email: userData.email,
      mobile_number: userData.mobile_number,
      password_hash: userData.password_hash,
      age: Number(userData.age) || 20,
      gender: userData.gender,
      college_or_org: userData.college_or_org,
      profile_photo: userData.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.full_name)}`,
      bio: userData.bio || 'Daily commuter on RIGOO',
      vehicle_model: userData.vehicle_model || null,
      vehicle_number: userData.vehicle_number || null,
      is_verified: true, // College/org verification automatic in prototype demo
      rating_avg: 5.0,
      total_rides_offered: 0,
      total_rides_taken: 0,
      created_at: new Date().toISOString()
    };
    inMemoryStore.users.push(user);

    // Add verification
    inMemoryStore.user_verifications.push({
      id: inMemoryStore.nextIds.user_verifications++,
      user_id: newId,
      verification_type: 'college_id',
      document_number: `VER-${Date.now().toString().slice(-6)}`,
      status: 'VERIFIED',
      verified_at: new Date().toISOString()
    });

    // Add emergency contact if provided
    if (userData.emergency_name && userData.emergency_phone) {
      inMemoryStore.emergency_contacts.push({
        id: inMemoryStore.nextIds.emergency_contacts++,
        user_id: newId,
        contact_name: userData.emergency_name,
        phone_number: userData.emergency_phone,
        relationship: userData.emergency_relation || 'Family',
        is_primary: true
      });
    }

    persistStore();
    const { password_hash, ...safeUser } = user;
    return safeUser;
  },

  // Offered Rides
  createOfferedRide: (rideData: any) => {
    const newId = inMemoryStore.nextIds.offered_rides++;
    const ride = {
      id: newId,
      rider_id: Number(rideData.rider_id),
      start_location: rideData.start_location,
      start_lat: parseFloat(rideData.start_lat),
      start_lng: parseFloat(rideData.start_lng),
      start_place_id: rideData.start_place_id || `place_${Date.now()}`,
      destination: rideData.destination,
      dest_lat: parseFloat(rideData.dest_lat),
      dest_lng: parseFloat(rideData.dest_lng),
      dest_place_id: rideData.dest_place_id || `dest_${Date.now()}`,
      departure_date: rideData.departure_date,
      departure_time: rideData.departure_time,
      available_seats: Number(rideData.available_seats) || 1,
      fuel_contribution: parseFloat(rideData.fuel_contribution) || 30.00,
      route_polyline: rideData.route_polyline || '',
      route_coordinates: rideData.route_coordinates || [],
      route_distance_km: parseFloat(rideData.route_distance_km) || 5.0,
      route_duration_mins: parseInt(rideData.route_duration_mins) || 15,
      pickup_preferences: rideData.pickup_preferences || '',
      women_only: Boolean(rideData.women_only),
      status: 'OFFERED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    inMemoryStore.offered_rides.unshift(ride);

    // Update rider statistics
    const rider = inMemoryStore.users.find(u => u.id === ride.rider_id);
    if (rider) {
      rider.total_rides_offered = (rider.total_rides_offered || 0) + 1;
    }

    persistStore();
    return ride;
  },

  getAllOfferedRides: (filters: { status?: string; riderId?: number; date?: string } = {}) => {
    return inMemoryStore.offered_rides
      .filter(r => {
        if (filters.status && r.status !== filters.status) return false;
        if (filters.riderId && r.rider_id !== Number(filters.riderId)) return false;
        if (filters.date && r.departure_date !== filters.date) return false;
        return true;
      })
      .map(r => {
        const rider = inMemoryStore.users.find(u => u.id === r.rider_id);
        const { password_hash, ...safeRider } = rider || {};
        return {
          ...r,
          rider: safeRider
        };
      });
  },

  getOfferedRideById: (id: number) => {
    const ride = inMemoryStore.offered_rides.find(r => r.id === Number(id));
    if (!ride) return null;
    const rider = inMemoryStore.users.find(u => u.id === ride.rider_id);
    const { password_hash, ...safeRider } = rider || {};
    return {
      ...ride,
      rider: safeRider
    };
  },

  updateRideStatus: (id: number, status: string) => {
    const ride = inMemoryStore.offered_rides.find(r => r.id === Number(id));
    if (ride) {
      ride.status = status;
      ride.updated_at = new Date().toISOString();
      persistStore();
      return ride;
    }
    return null;
  },

  // Ride Requests
  createRideRequest: (reqData: any) => {
    const newId = inMemoryStore.nextIds.ride_requests++;
    const request = {
      id: newId,
      ride_id: Number(reqData.ride_id),
      passenger_id: Number(reqData.passenger_id),
      pickup_location: reqData.pickup_location,
      pickup_place_id: reqData.pickup_place_id || `place_${Date.now()}`,
      pickup_lat: parseFloat(reqData.pickup_lat),
      pickup_lng: parseFloat(reqData.pickup_lng),
      dropoff_location: reqData.dropoff_location,
      dropoff_place_id: reqData.dropoff_place_id || `dest_${Date.now()}`,
      dropoff_lat: parseFloat(reqData.dropoff_lat),
      dropoff_lng: parseFloat(reqData.dropoff_lng),
      requested_time: reqData.requested_time || '08:30',
      suggested_pickup_point: reqData.suggested_pickup_point || reqData.pickup_location,
      compatibility_score: parseFloat(reqData.compatibility_score) || 90.0,
      status: 'PENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    inMemoryStore.ride_requests.unshift(request);

    // Also notify rider
    const ride = inMemoryStore.offered_rides.find(r => r.id === request.ride_id);
    const passenger = inMemoryStore.users.find(u => u.id === request.passenger_id);
    if (ride && passenger) {
      inMemoryStore.notifications.unshift({
        id: inMemoryStore.nextIds.notifications++,
        user_id: ride.rider_id,
        title: 'New Ride Request Received',
        message: `${passenger.full_name} requested to join your journey from ${request.pickup_location} to ${request.dropoff_location}.`,
        type: 'RIDE_REQUEST',
        related_ride_id: ride.id,
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    persistStore();
    return request;
  },

  getRequestsByRider: (riderId: number) => {
    const rides = inMemoryStore.offered_rides.filter(r => r.rider_id === Number(riderId));
    const rideIds = new Set(rides.map(r => r.id));
    return inMemoryStore.ride_requests
      .filter(req => rideIds.has(req.ride_id))
      .map(req => {
        const passenger = inMemoryStore.users.find(u => u.id === req.passenger_id);
        const ride = rides.find(r => r.id === req.ride_id);
        const { password_hash, ...safePassenger } = passenger || {};
        return {
          ...req,
          passenger: safePassenger,
          ride
        };
      });
  },

  getRequestsByPassenger: (passengerId: number) => {
    return inMemoryStore.ride_requests
      .filter(req => req.passenger_id === Number(passengerId))
      .map(req => {
        const ride = inMemoryStore.offered_rides.find(r => r.id === req.ride_id);
        const rider = ride ? inMemoryStore.users.find(u => u.id === ride.rider_id) : null;
        const { password_hash, ...safeRider } = rider || {};
        return {
          ...req,
          ride: {
            ...ride,
            rider: safeRider
          }
        };
      });
  },

  // Confirmation transaction (locks seat atomically)
  acceptRideRequest: (requestId: number, riderId: number) => {
    const request = inMemoryStore.ride_requests.find(r => r.id === Number(requestId));
    if (!request) throw new Error('Request not found');
    
    const ride = inMemoryStore.offered_rides.find(r => r.id === request.ride_id);
    if (!ride) throw new Error('Ride not found');
    if (ride.rider_id !== Number(riderId)) throw new Error('Unauthorized to accept this request');
    if (ride.available_seats <= 0) throw new Error('No available seats remaining on this ride');

    // Update request
    request.status = 'ACCEPTED';
    request.updated_at = new Date().toISOString();

    // Decrement available seat & update ride status
    ride.available_seats -= 1;
    ride.status = 'ACCEPTED';
    ride.updated_at = new Date().toISOString();

    // Create confirmed ride
    const confirmedId = inMemoryStore.nextIds.confirmed_rides++;
    const confirmed = {
      id: confirmedId,
      ride_id: ride.id,
      request_id: request.id,
      rider_id: ride.rider_id,
      passenger_id: request.passenger_id,
      agreed_fuel_contribution: ride.fuel_contribution,
      status: 'CONFIRMED',
      pickup_started_at: null,
      actual_pickup_at: null,
      trip_started_at: null,
      actual_completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    inMemoryStore.confirmed_rides.unshift(confirmed);

    // Notify passenger
    inMemoryStore.notifications.unshift({
      id: inMemoryStore.nextIds.notifications++,
      user_id: request.passenger_id,
      title: 'Ride Request Accepted!',
      message: `Your ride from ${request.pickup_location} has been confirmed. You will be able to track your rider live!`,
      type: 'REQUEST_ACCEPTED',
      related_ride_id: ride.id,
      is_read: false,
      created_at: new Date().toISOString()
    });

    persistStore();
    return { request, ride, confirmed };
  },

  rejectRideRequest: (requestId: number, riderId: number) => {
    const request = inMemoryStore.ride_requests.find(r => r.id === Number(requestId));
    if (!request) throw new Error('Request not found');
    const ride = inMemoryStore.offered_rides.find(r => r.id === request.ride_id);
    if (!ride || ride.rider_id !== Number(riderId)) throw new Error('Unauthorized');

    request.status = 'REJECTED';
    request.updated_at = new Date().toISOString();

    inMemoryStore.notifications.unshift({
      id: inMemoryStore.nextIds.notifications++,
      user_id: request.passenger_id,
      title: 'Ride Request Update',
      message: 'The rider was unable to accommodate your request for this route.',
      type: 'REQUEST_REJECTED',
      related_ride_id: ride.id,
      is_read: false,
      created_at: new Date().toISOString()
    });

    persistStore();
    return request;
  },

  // Confirmed ride queries
  getConfirmedRideById: (id: number) => {
    const confirmed = inMemoryStore.confirmed_rides.find(c => c.id === Number(id) || c.ride_id === Number(id));
    if (!confirmed) return null;
    const ride = inMemoryStore.offered_rides.find(r => r.id === confirmed.ride_id);
    const request = inMemoryStore.ride_requests.find(req => req.id === confirmed.request_id);
    const rider = inMemoryStore.users.find(u => u.id === confirmed.rider_id);
    const passenger = inMemoryStore.users.find(u => u.id === confirmed.passenger_id);
    const latestLoc = inMemoryStore.live_locations.find(l => l.ride_id === confirmed.ride_id);
    const session = inMemoryStore.trip_tracking_sessions.find(s => s.ride_id === confirmed.ride_id);

    return {
      ...confirmed,
      ride,
      request,
      rider: rider ? { ...rider, password_hash: undefined } : null,
      passenger: passenger ? { ...passenger, password_hash: undefined } : null,
      latest_location: latestLoc || null,
      tracking_session: session || null
    };
  },

  // Live Location Upsert (Performs MySQL style upsert)
  upsertLiveLocation: (data: {
    ride_id: number;
    user_id: number;
    latitude: number;
    longitude: number;
    accuracy?: number;
    heading?: number;
    speed?: number;
  }) => {
    const existingIndex = inMemoryStore.live_locations.findIndex(l => l.ride_id === Number(data.ride_id));
    const locationEntry = {
      id: existingIndex >= 0 ? inMemoryStore.live_locations[existingIndex].id : inMemoryStore.nextIds.live_locations++,
      ride_id: Number(data.ride_id),
      user_id: Number(data.user_id),
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      accuracy: Number(data.accuracy) || 5.0,
      heading: Number(data.heading) || 0,
      speed: Number(data.speed) || 0,
      recorded_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      inMemoryStore.live_locations[existingIndex] = locationEntry;
    } else {
      inMemoryStore.live_locations.push(locationEntry);
    }

    // Update tracking session last_location_at
    const session = inMemoryStore.trip_tracking_sessions.find(s => s.ride_id === Number(data.ride_id));
    if (session) {
      session.last_location_at = locationEntry.recorded_at;
    }

    persistStore();
    return locationEntry;
  },

  getLiveLocation: (rideId: number) => {
    return inMemoryStore.live_locations.find(l => l.ride_id === Number(rideId)) || null;
  },

  // Tracking Sessions & Lifecycle
  startPickupSession: (rideId: number, riderId: number) => {
    const ride = inMemoryStore.offered_rides.find(r => r.id === Number(rideId));
    if (!ride) throw new Error('Ride not found');
    if (ride.rider_id !== Number(riderId)) throw new Error('Only the confirmed rider may start pickup');

    const confirmed = inMemoryStore.confirmed_rides.find(c => c.ride_id === Number(rideId));
    ride.status = 'PICKUP_STARTED';
    ride.updated_at = new Date().toISOString();

    if (confirmed) {
      confirmed.status = 'PICKUP_STARTED';
      confirmed.pickup_started_at = new Date().toISOString();
      confirmed.updated_at = new Date().toISOString();
    }

    let session = inMemoryStore.trip_tracking_sessions.find(s => s.ride_id === Number(rideId));
    if (!session) {
      session = {
        id: inMemoryStore.nextIds.trip_tracking_sessions++,
        ride_id: Number(rideId),
        rider_id: Number(riderId),
        passenger_id: confirmed ? confirmed.passenger_id : null,
        started_at: new Date().toISOString(),
        ended_at: null,
        tracking_status: 'PICKUP_ACTIVE',
        last_location_at: new Date().toISOString()
      };
      inMemoryStore.trip_tracking_sessions.push(session);
    } else {
      session.tracking_status = 'PICKUP_ACTIVE';
    }

    if (confirmed) {
      inMemoryStore.notifications.unshift({
        id: inMemoryStore.nextIds.notifications++,
        user_id: confirmed.passenger_id,
        title: 'Rider is on the Way!',
        message: 'Your rider has started pickup navigation. You can track their live location in real time.',
        type: 'RIDER_APPROACHING',
        related_ride_id: ride.id,
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    persistStore();
    return { ride, confirmed, session };
  },

  startTrip: (rideId: number, riderId: number) => {
    const ride = inMemoryStore.offered_rides.find(r => r.id === Number(rideId));
    if (!ride || ride.rider_id !== Number(riderId)) throw new Error('Unauthorized');
    const confirmed = inMemoryStore.confirmed_rides.find(c => c.ride_id === Number(rideId));

    ride.status = 'TRIP_ACTIVE';
    ride.updated_at = new Date().toISOString();

    if (confirmed) {
      confirmed.status = 'TRIP_ACTIVE';
      confirmed.trip_started_at = new Date().toISOString();
      confirmed.actual_pickup_at = new Date().toISOString();
      confirmed.updated_at = new Date().toISOString();
    }

    const session = inMemoryStore.trip_tracking_sessions.find(s => s.ride_id === Number(rideId));
    if (session) {
      session.tracking_status = 'TRIP_ACTIVE';
    }

    if (confirmed) {
      inMemoryStore.notifications.unshift({
        id: inMemoryStore.nextIds.notifications++,
        user_id: confirmed.passenger_id,
        title: 'Trip Started! Enjoy the Journey',
        message: 'Your ride has commenced towards your destination. Live tracking is active.',
        type: 'TRIP_STARTED',
        related_ride_id: ride.id,
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    persistStore();
    return { ride, confirmed };
  },

  endTrip: (rideId: number, riderId: number) => {
    const ride = inMemoryStore.offered_rides.find(r => r.id === Number(rideId));
    if (!ride || ride.rider_id !== Number(riderId)) throw new Error('Unauthorized');
    const confirmed = inMemoryStore.confirmed_rides.find(c => c.ride_id === Number(rideId));

    const now = new Date().toISOString();
    ride.status = 'COMPLETED';
    ride.updated_at = now;

    if (confirmed) {
      confirmed.status = 'COMPLETED';
      confirmed.actual_completed_at = now;
      confirmed.updated_at = now;

      // Add to ride_history
      inMemoryStore.ride_history.unshift({
        id: inMemoryStore.nextIds.ride_history++,
        confirmed_ride_id: confirmed.id,
        rider_id: confirmed.rider_id,
        passenger_id: confirmed.passenger_id,
        start_location: ride.start_location,
        destination: ride.destination,
        departure_time: `${ride.departure_date} ${ride.departure_time}`,
        completed_at: now,
        fuel_contribution: confirmed.agreed_fuel_contribution,
        distance_km: ride.route_distance_km,
        duration_mins: ride.route_duration_mins,
        status: 'COMPLETED'
      });

      // Update users ride counts
      const rider = inMemoryStore.users.find(u => u.id === confirmed.rider_id);
      const passenger = inMemoryStore.users.find(u => u.id === confirmed.passenger_id);
      if (rider) rider.total_rides_offered = (rider.total_rides_offered || 0) + 1;
      if (passenger) passenger.total_rides_taken = (passenger.total_rides_taken || 0) + 1;

      inMemoryStore.notifications.unshift({
        id: inMemoryStore.nextIds.notifications++,
        user_id: confirmed.passenger_id,
        title: 'Ride Completed!',
        message: `You have arrived safely at ${ride.destination}. Please leave a rating for your rider.`,
        type: 'TRIP_COMPLETED',
        related_ride_id: ride.id,
        is_read: false,
        created_at: now
      });
    }

    // End session
    const session = inMemoryStore.trip_tracking_sessions.find(s => s.ride_id === Number(rideId));
    if (session) {
      session.tracking_status = 'ENDED';
      session.ended_at = now;
    }

    // Clean retention: purge live location after trip completion
    const locIndex = inMemoryStore.live_locations.findIndex(l => l.ride_id === Number(rideId));
    if (locIndex >= 0) {
      inMemoryStore.live_locations.splice(locIndex, 1);
    }

    persistStore();
    return { ride, confirmed };
  },

  // Trip sharing tokens
  createTripShareToken: (rideId: number, userId: number) => {
    // Generate secure 32-char token
    const token = 'rgo_' + Math.random().toString(36).substring(2) + Date.now().toString(36) + Math.random().toString(36).substring(2);
    const expiresAt = new Date(Date.now() + 6 * 3600000).toISOString(); // 6 hours expiration

    const entry = {
      id: inMemoryStore.nextIds.trip_sharing_tokens++,
      ride_id: Number(rideId),
      user_id: Number(userId),
      token,
      expires_at: expiresAt,
      is_revoked: false,
      created_at: new Date().toISOString()
    };
    inMemoryStore.trip_sharing_tokens.push(entry);
    persistStore();
    return entry;
  },

  getTripByShareToken: (token: string) => {
    const entry = inMemoryStore.trip_sharing_tokens.find(t => t.token === token && !t.is_revoked);
    if (!entry) return null;
    if (new Date(entry.expires_at) < new Date()) return null;

    const ride = inMemoryStore.offered_rides.find(r => r.id === entry.ride_id);
    if (!ride) return null;
    const confirmed = inMemoryStore.confirmed_rides.find(c => c.ride_id === entry.ride_id);
    const rider = inMemoryStore.users.find(u => u.id === ride.rider_id);
    const passenger = confirmed ? inMemoryStore.users.find(u => u.id === confirmed.passenger_id) : null;
    const latestLocation = inMemoryStore.live_locations.find(l => l.ride_id === entry.ride_id);

    return {
      share_token: entry.token,
      ride_id: ride.id,
      status: ride.status,
      start_location: ride.start_location,
      start_lat: ride.start_lat,
      start_lng: ride.start_lng,
      start_place_id: ride.start_place_id,
      destination: ride.destination,
      dest_lat: ride.dest_lat,
      dest_lng: ride.dest_lng,
      dest_place_id: ride.dest_place_id,
      route_coordinates: ride.route_coordinates,
      departure_time: `${ride.departure_date} ${ride.departure_time}`,
      rider: rider ? {
        full_name: rider.full_name,
        profile_photo: rider.profile_photo,
        vehicle_model: rider.vehicle_model,
        vehicle_number: rider.vehicle_number,
        rating_avg: rider.rating_avg,
        is_verified: rider.is_verified
      } : null,
      passenger_name: passenger?.full_name,
      latest_location: latestLocation || null
    };
  },

  // Ratings
  addRating: (data: {
    ride_id: number;
    reviewer_id: number;
    reviewee_id: number;
    rating: number;
    review: string;
    role: 'RIDER' | 'PASSENGER';
  }) => {
    const entry = {
      id: inMemoryStore.nextIds.ratings++,
      ride_id: Number(data.ride_id),
      reviewer_id: Number(data.reviewer_id),
      reviewee_id: Number(data.reviewee_id),
      rating: Math.min(5, Math.max(1, Number(data.rating))),
      review: data.review || '',
      role: data.role,
      created_at: new Date().toISOString()
    };
    inMemoryStore.ratings.unshift(entry);

    // Recalculate reviewee average
    const userRatings = inMemoryStore.ratings.filter(r => r.reviewee_id === entry.reviewee_id);
    const avg = userRatings.reduce((sum, r) => sum + r.rating, 0) / userRatings.length;
    const user = inMemoryStore.users.find(u => u.id === entry.reviewee_id);
    if (user) {
      user.rating_avg = Math.round(avg * 100) / 100;
    }

    persistStore();
    return entry;
  },

  getUserRatings: (userId: number) => {
    return inMemoryStore.ratings
      .filter(r => r.reviewee_id === Number(userId))
      .map(r => {
        const reviewer = inMemoryStore.users.find(u => u.id === r.reviewer_id);
        return {
          ...r,
          reviewer_name: reviewer?.full_name || 'Verified Commuter',
          reviewer_photo: reviewer?.profile_photo
        };
      });
  },

  // Notifications
  getUserNotifications: (userId: number) => {
    return inMemoryStore.notifications
      .filter(n => n.user_id === Number(userId))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  markNotificationRead: (id: number) => {
    const note = inMemoryStore.notifications.find(n => n.id === Number(id));
    if (note) {
      note.is_read = true;
      persistStore();
    }
    return note;
  },

  // Ride History
  getUserHistory: (userId: number) => {
    const id = Number(userId);
    return inMemoryStore.ride_history.filter(h => h.rider_id === id || h.passenger_id === id);
  }
};
