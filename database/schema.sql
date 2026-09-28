-- ==============================================================
-- RIGOO — Share the Journey | AI-Powered Bike Pooling Platform
-- Co-founders: M. Rethika & H. Bhavya Sree
-- Production Database Schema (rigoo_db)
-- ==============================================================

CREATE DATABASE IF NOT EXISTS rigoo_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE rigoo_db;

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  mobile_number VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  age INT NOT NULL,
  gender ENUM('Female', 'Male', 'Non-binary', 'Other') NOT NULL,
  college_or_org VARCHAR(255) NOT NULL,
  profile_photo TEXT,
  bio TEXT,
  vehicle_model VARCHAR(100),
  vehicle_number VARCHAR(50),
  is_verified BOOLEAN DEFAULT FALSE,
  rating_avg DECIMAL(3,2) DEFAULT 5.00,
  total_rides_offered INT DEFAULT 0,
  total_rides_taken INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_gender (gender),
  INDEX idx_is_verified (is_verified)
) ENGINE=InnoDB;

-- 2. User Verifications
CREATE TABLE IF NOT EXISTS user_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  verification_type VARCHAR(50) NOT NULL, -- 'college_id', 'aadhaar', 'driver_license'
  document_number VARCHAR(100),
  status ENUM('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'VERIFIED',
  verified_at TIMESTAMP NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_verif (user_id, status)
) ENGINE=InnoDB;

-- 3. Emergency Contacts
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  relationship VARCHAR(100) NOT NULL,
  is_primary BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_contact (user_id)
) ENGINE=InnoDB;

-- 4. Offered Rides
CREATE TABLE IF NOT EXISTS offered_rides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rider_id INT NOT NULL,
  start_location VARCHAR(255) NOT NULL,
  start_lat DECIMAL(10, 7) NOT NULL,
  start_lng DECIMAL(10, 7) NOT NULL,
  start_place_id VARCHAR(255),
  destination VARCHAR(255) NOT NULL,
  dest_lat DECIMAL(10, 7) NOT NULL,
  dest_lng DECIMAL(10, 7) NOT NULL,
  dest_place_id VARCHAR(255),
  departure_date VARCHAR(20) NOT NULL, -- YYYY-MM-DD
  departure_time VARCHAR(20) NOT NULL, -- HH:MM
  available_seats INT NOT NULL DEFAULT 1,
  fuel_contribution DECIMAL(8, 2) NOT NULL,
  route_polyline MEDIUMTEXT,
  route_distance_km DECIMAL(6, 2) DEFAULT 0.00,
  route_duration_mins INT DEFAULT 0,
  pickup_preferences TEXT,
  women_only BOOLEAN DEFAULT FALSE,
  status ENUM('OFFERED', 'REQUESTED', 'ACCEPTED', 'PICKUP_STARTED', 'PASSENGER_PICKED_UP', 'TRIP_ACTIVE', 'COMPLETED', 'CANCELLED') DEFAULT 'OFFERED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (rider_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_rider_date (rider_id, departure_date),
  INDEX idx_status_date (status, departure_date)
) ENGINE=InnoDB;

-- 5. Ride Requests
CREATE TABLE IF NOT EXISTS ride_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ride_id INT NOT NULL,
  passenger_id INT NOT NULL,
  pickup_location VARCHAR(255) NOT NULL,
  pickup_lat DECIMAL(10, 7) NOT NULL,
  pickup_lng DECIMAL(10, 7) NOT NULL,
  dropoff_location VARCHAR(255) NOT NULL,
  dropoff_lat DECIMAL(10, 7) NOT NULL,
  dropoff_lng DECIMAL(10, 7) NOT NULL,
  requested_time VARCHAR(20),
  suggested_pickup_point VARCHAR(255),
  compatibility_score DECIMAL(5, 2) DEFAULT 0.00,
  status ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ride_id) REFERENCES offered_rides(id) ON DELETE CASCADE,
  FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_ride_passenger (ride_id, passenger_id),
  INDEX idx_req_status (status)
) ENGINE=InnoDB;

-- 6. Ride Matches (deterministic cache & history)
CREATE TABLE IF NOT EXISTS ride_matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ride_id INT NOT NULL,
  passenger_id INT NOT NULL,
  route_overlap_pct DECIMAL(5, 2) NOT NULL,
  detour_distance_km DECIMAL(5, 2) NOT NULL,
  time_diff_minutes INT NOT NULL,
  pickup_proximity_km DECIMAL(5, 2) NOT NULL,
  overall_score DECIMAL(5, 2) NOT NULL,
  suggested_pickup_lat DECIMAL(10, 7),
  suggested_pickup_lng DECIMAL(10, 7),
  suggested_pickup_address VARCHAR(255),
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ride_id) REFERENCES offered_rides(id) ON DELETE CASCADE,
  FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Confirmed Rides
CREATE TABLE IF NOT EXISTS confirmed_rides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ride_id INT NOT NULL,
  request_id INT NOT NULL,
  rider_id INT NOT NULL,
  passenger_id INT NOT NULL,
  agreed_fuel_contribution DECIMAL(8, 2) NOT NULL,
  status ENUM('CONFIRMED', 'PICKUP_STARTED', 'PASSENGER_PICKED_UP', 'TRIP_ACTIVE', 'COMPLETED', 'CANCELLED') DEFAULT 'CONFIRMED',
  pickup_started_at TIMESTAMP NULL,
  actual_pickup_at TIMESTAMP NULL,
  trip_started_at TIMESTAMP NULL,
  actual_completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ride_id) REFERENCES offered_rides(id) ON DELETE CASCADE,
  FOREIGN KEY (request_id) REFERENCES ride_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (rider_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_confirmed_status (status)
) ENGINE=InnoDB;

-- 8. Live Locations (Upserted real GPS position per active ride)
CREATE TABLE IF NOT EXISTS live_locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ride_id INT NOT NULL UNIQUE,
  user_id INT NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  accuracy DECIMAL(6, 2) DEFAULT 0.00,
  heading DECIMAL(5, 2) DEFAULT 0.00,
  speed DECIMAL(5, 2) DEFAULT 0.00,
  recorded_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ride_id) REFERENCES offered_rides(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_ride_loc (ride_id)
) ENGINE=InnoDB;

-- 9. Trip Tracking Sessions
CREATE TABLE IF NOT EXISTS trip_tracking_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ride_id INT NOT NULL,
  rider_id INT NOT NULL,
  passenger_id INT,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  tracking_status ENUM('INITIALIZING', 'PICKUP_ACTIVE', 'TRIP_ACTIVE', 'ENDED') DEFAULT 'INITIALIZING',
  last_location_at TIMESTAMP NULL,
  FOREIGN KEY (ride_id) REFERENCES offered_rides(id) ON DELETE CASCADE,
  FOREIGN KEY (rider_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_active_session (ride_id, tracking_status)
) ENGINE=InnoDB;

-- 10. Trip Sharing Tokens (Temporary secure public share link for trusted contacts)
CREATE TABLE IF NOT EXISTS trip_sharing_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ride_id INT NOT NULL,
  user_id INT NOT NULL,
  token VARCHAR(128) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ride_id) REFERENCES offered_rides(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token)
) ENGINE=InnoDB;

-- 11. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  related_ride_id INT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_unread (user_id, is_read)
) ENGINE=InnoDB;

-- 12. Ratings & Reviews
CREATE TABLE IF NOT EXISTS ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ride_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  reviewee_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  role ENUM('RIDER', 'PASSENGER') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ride_id) REFERENCES offered_rides(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reviewee (reviewee_id)
) ENGINE=InnoDB;

-- 13. Ride History (Persisted archival of completed trips)
CREATE TABLE IF NOT EXISTS ride_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  confirmed_ride_id INT NOT NULL,
  rider_id INT NOT NULL,
  passenger_id INT NOT NULL,
  start_location VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  departure_time VARCHAR(30) NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fuel_contribution DECIMAL(8, 2) NOT NULL,
  distance_km DECIMAL(6, 2) DEFAULT 0.00,
  duration_mins INT DEFAULT 0,
  status VARCHAR(30) DEFAULT 'COMPLETED',
  FOREIGN KEY (rider_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_rider_hist (rider_id),
  INDEX idx_pass_hist (passenger_id)
) ENGINE=InnoDB;
