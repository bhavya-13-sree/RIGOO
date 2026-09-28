# RIGOO — Share the Journey

> **AI-Powered Bike Pooling Platform**  
> Connecting daily commuters for verified route matching, safe pillion pooling, real-time GPS tracking, and equitable fuel cost splitting.

---

## 👥 Team Information
* **Team Name:** Co-Founders
* **Team Members:**
  * **M. Rethika** — Co-Founder & Product Architect
  * **H. Bhavya Sree** — Co-Founder & Tech Lead

---

## 📖 Project Description

**RIGOO** is an AI-powered, community-driven bike-pooling platform engineered to solve the urban daily commute crisis. Unlike commercial ride-hailing services (e.g., Rapido, Uber, Ola), RIGOO is non-commercial: it connects fellow students, engineers, and office commuters who are already traveling along the same corridor at approximately the same time.

Riders with an empty pillion seat publish their planned daily commute route, and passengers traveling along that corridor find compatible matches. Commuters equitably share the actual fuel expenses under the Motor Vehicles Act guidelines, drastically cutting personal travel costs, minimizing carbon emissions, and reducing urban traffic congestion.

Key highlights include a **Women-Only Commuter Filter**, verified institutional & college profiles, **Lyra AI (RideMate)** commuter copilot, live GPS road tracking via Socket.IO, trusted-contact live trip sharing, and instant SOS safety broadcast.

---

## 💻 Technologies Used

### Frontend
* **React 19** (`react`, `react-dom`) — High-performance reactive UI architecture
* **TypeScript** — End-to-end type safety and maintainable contracts
* **Vite** — Lightning-fast build tooling and modern ES module bundling
* **Tailwind CSS v4** — Utility-first, responsive, accessible design system
* **Leaflet & OpenStreetMap** — Interactive interactive map rendering, dynamic polyline waypoints, and markers
* **Lucide React** — Crisp icon system for intuitive UX
* **Socket.IO Client** — Low-latency bi-directional WebSocket communication for real-time GPS telemetry

### Backend
* **Node.js** & **Express.js** — Scalable RESTful API server and request routing
* **Socket.IO Server** — Real-time event engine for instant ride requests, acceptances, and live GPS broadcasting
* **JSON Web Tokens (JWT)** & **Bcrypt.js** — Secure stateless authentication and salted password hashing
* **Photon & OpenStreetMap Nominatim Engine** — Global keyless location autocomplete, reverse-geocoding, and road routing

### Database & Persistence
* **MySQL 8.0+** (`mysql2/promise`) — Relational database with full ACID transactions and connection pooling (`rigoo_db`)
* **Built-in Resilient Relational Store** — Zero-setup local persistent fallback engine (`data/rigoo_store.json`), allowing instant full-stack execution even when a standalone MySQL daemon is offline

### AI & Intelligence
* **@google/genai** (Google Gemini 2.5 / 3.8 Flash) — RideMate Commuter Copilot for route optimization, safety advisories, and weather awareness
* **Deterministic Matching Engine** — Multi-factor scoring combining Haversine spatial proximity, corridor detour tolerance, departure time alignment, and mutual safety preferences

---

## 🚀 Key Features

1. **Intelligent Route Matching:**
   * Multi-variable matching algorithm that analyzes route corridors, pickup proximity, departure time tolerance, and verified rating.
   * Universal location search with dynamic road-network routing.

2. **Safety First & Women-Only Mode:**
   * **Women-Only Filter:** Female riders and passengers can restrict matches exclusively to verified female commuters.
   * **Verified Profiles:** College ID, employee badge, and government identity document verification badges.
   * **Emergency Contacts & SOS:** 1-tap emergency alert broadcast with geolocation coordinates to saved contacts and local helplines.

3. **Real-Time GPS Tracking & Live Trip Sharing:**
   * Live rider location broadcasting via WebSockets with dynamic recalculation of road ETA and remaining distance.
   * Direct **"Open in Google Maps Navigation"** launch with exact origin and destination coordinates.
   * Secure, shareable web link with expiring access tokens for family and trusted friends to track the journey live in any browser without signing in.

4. **Transparent Cost Sharing:**
   * Automatic calculation of fair fuel reimbursement based on actual kilometers traveled.
   * Integrated UPI ID settlement and post-ride receipt archival.

5. **Mutual Rating & Ride History:**
   * Two-way 1-to-5 star rating and feedback system to build a trusted commuter community.
   * Detailed ride history dashboard with total kilometers pooled, money saved, and carbon emissions averted.

6. **RideMate AI Copilot (Lyra AI):**
   * Context-aware commute assistant answering questions about route conditions, pickup safety tips, and weather advisories.

---

## 🗄️ Database Schema (`rigoo_db`)

The complete production MySQL schema is located in `/database/schema.sql`. It defines 13 interconnected relational tables:

1. `users` — Commuter profiles, authentication credentials, vehicle details, verification status.
2. `user_verifications` — Document verification records (College ID, Aadhaar, Driver License).
3. `emergency_contacts` — Trusted contacts for emergency SOS and live tracking broadcasts.
4. `offered_rides` — Rides published by bike owners with route coordinates, seats, and fuel contribution.
5. `ride_requests` — Booking requests created by passengers.
6. `ride_matches` — Compatibility scores, detour estimates, and match history.
7. `confirmed_rides` — Accepted rides with locked pillion seat and real-time lifecycle tracking.
8. `live_locations` — Up-to-the-second GPS telemetry upserted by active riders.
9. `trip_tracking_sessions` — Active tracking session state (`PENDING_PICKUP`, `IN_TRANSIT`, `COMPLETED`).
10. `trip_sharing_tokens` — Secure public tokens for external emergency and family live-tracking links.
11. `notifications` — In-app alerts for ride offers, acceptances, and status updates.
12. `ratings` — Verified post-ride reviews, badges, and star ratings.
13. `ride_history` — Permanent historical archive of completed journeys and cost savings.

---

## ⚙️ Required Environment Variables

Configure these variables by copying `.env.example` to `.env`:

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `JWT_SECRET` | **Yes** | Secret string used to sign and verify JSON Web Tokens | `your_jwt_secret_key_here` |
| `APP_URL` | No | Base application URL | `http://localhost:3000` |
| `GEMINI_API_KEY` | Optional | API key for Gemini AI / RideMate Copilot | `your_gemini_api_key_here` |
| `MYSQL_HOST` | Optional | MySQL server host (defaults to `localhost`) | `localhost` |
| `MYSQL_PORT` | Optional | MySQL server port (defaults to `3306`) | `3306` |
| `MYSQL_USER` | Optional | MySQL username (defaults to `root`) | `root` |
| `MYSQL_PASSWORD` | Optional | MySQL database password | `your_mysql_password_here` |
| `MYSQL_DATABASE` | Optional | MySQL database name | `rigoo_db` |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional | Google Maps API key (dynamic keyless fallback active by default) | `your_google_maps_key` |

> **Note:** If MySQL credentials are not supplied or the database server is not running, RIGOO automatically falls back to its built-in relational engine (`data/rigoo_store.json`), allowing instant full-stack evaluation with zero configuration.

---

## 🛠️ Installation & Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/balnegouthami-rgb/RIGO-Ride.Share.Go.git
cd RIGO-Ride.Share.Go
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
```bash
cp .env.example .env
```
*(Optionally edit `.env` to customize your JWT secret or database settings.)*

### 4. (Optional) Set up MySQL Database
If you wish to use a local MySQL server:
```bash
mysql -u root -p < database/schema.sql
```
*(If you skip this step, RIGOO will automatically run using its built-in persistent storage engine.)*

---

## 🚦 How to Run the Frontend and Backend

RIGOO is architected with a unified full-stack development and production server that serves the Express API, Socket.IO WebSockets, and the Vite React frontend concurrently on a single port (`3000`).

### Development Mode (Frontend + Backend Concurrently)
```bash
npm run dev
```
* **Unified Server URL:** `http://localhost:3000`
* Hot-reloading frontend and live backend API reloading via `tsx`.

### Production Build & Launch
1. Build the frontend production assets:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm start
   ```

### Type Checking & Validation
```bash
npm run lint
```

---

## 🧪 Testing the Live Ride Workflow

RIGOO includes built-in test accounts for both co-founders to easily test the end-to-end bike-pooling lifecycle:

1. **Rider Account (Offer Ride):**
   * **Email:** `rethika@rigoo.in`
   * **Password:** `password123`
   * Go to **"Offer Ride"**, enter your departure location and destination, choose departure time, and publish the ride.

2. **Passenger Account (Find Ride):**
   * **Email:** `bhavya@rigoo.in`
   * **Password:** `password123`
   * Go to **"Find Ride"**, search for the matching commute corridor, view compatibility scores, and send a join request.

3. **Acceptance & Real-Time Tracking:**
   * The rider receives an instant notification and accepts the request.
   * Both participants enter the **Live Tracking** screen with real-time GPS telemetry, interactive route map, SOS broadcast, and one-click Google Maps navigation.

---

## 📄 License

This project is licensed under the MIT License — built with passion for sustainable urban mobility and commuter safety by **M. Rethika** & **H. Bhavya Sree**.
