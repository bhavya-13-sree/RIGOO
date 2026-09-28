import React from 'react';
import {
  Bike,
  Shield,
  Zap,
  MapPin,
  Clock,
  Navigation,
  CheckCircle2,
  Users,
  Leaf,
  HeartHandshake,
  ArrowRight,
  Sparkles,
  PhoneCall,
  Search,
  Plus
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (isSignup?: boolean) => void;
  onExploreRides: () => void;
  onOfferRide: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
  onExploreRides,
  onOfferRide,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-200/80 bg-radial from-[#EAF3FF]/70 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Co-founders Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-blue-200 shadow-xs text-xs font-semibold text-[#123F7A]">
                <Sparkles className="w-3.5 h-3.5 text-[#1769D2]" />
                <span>Co-founded by M. Rethika & H. Bhavya Sree</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#123F7A] tracking-tight leading-[1.12]">
                  Share the Journey. <br />
                  <span className="text-[#1769D2]">Intelligent Bike Pooling</span> for Everyday Commuters.
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl">
                  RIGOO is not a commercial taxi service. We intelligently connect riders with an empty pillion seat to passengers travelling in the same direction—slashing commute costs, easing urban traffic, and ensuring women-first safety.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <button
                  onClick={() => onOpenAuth(true)}
                  className="px-7 py-3.5 rounded-xl font-bold text-base text-white bg-[#1769D2] hover:bg-[#123F7A] shadow-lg shadow-blue-500/25 transition transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Sign Up & Start Sharing
                </button>
                <button
                  onClick={onExploreRides}
                  className="px-7 py-3.5 rounded-xl font-bold text-base text-[#123F7A] bg-white border border-slate-300 hover:border-[#1769D2] hover:bg-[#EAF3FF]/40 shadow-xs transition flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5 text-[#1769D2]" />
                  Find a Ride Near You
                </button>
              </div>

              {/* Live Commuter Corridor Badge */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-slate-700 font-semibold">Active Hyderabad Corridors:</span>
                  <span>Karmanghat · LB Nagar · Champapet · Dilsukhnagar</span>
                </div>
              </div>

            </div>

            {/* Right Graphic / Interactive Route Illustration Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                {/* Visual Glassmorphism Card */}
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200/90 relative z-10 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#EAF3FF] flex items-center justify-center text-[#1769D2]">
                        <Bike className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sample Matched Corridor</p>
                        <h4 className="text-sm font-extrabold text-[#123F7A]">Karmanghat → LB Nagar Metro</h4>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      96% Match
                    </span>
                  </div>

                  {/* Rider Profile Mini */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <img
                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
                        alt="M. Rethika"
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/30"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900">M. Rethika</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <p className="text-[11px] text-slate-500">TVS Jupiter 125 · VNR Student</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-[#1769D2]">₹25</span>
                      <p className="text-[10px] text-slate-400">Fuel share</p>
                    </div>
                  </div>

                  {/* Route Timeline */}
                  <div className="space-y-3 pl-2 text-xs">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                      <div>
                        <p className="font-bold text-slate-800">Karmanghat Hanuman Temple</p>
                        <p className="text-slate-500 text-[11px]">Departure 08:30 AM · Rider Starts</p>
                      </div>
                    </div>

                    <div className="ml-1 w-0.5 h-6 bg-dashed border-l border-blue-300" />

                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-2.5 h-2.5 rounded-full bg-[#1769D2] ring-4 ring-blue-100" />
                      <div>
                        <p className="font-bold text-slate-800">Champapet Cross Road (Pickup Point)</p>
                        <p className="text-[#1769D2] font-semibold text-[11px]">Passenger Joins · Pillion Seat Reserved</p>
                      </div>
                    </div>

                    <div className="ml-1 w-0.5 h-6 bg-dashed border-l border-blue-300" />

                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-2.5 h-2.5 rounded-full bg-[#123F7A] ring-4 ring-indigo-100" />
                      <div>
                        <p className="font-bold text-slate-800">LB Nagar Metro Station</p>
                        <p className="text-slate-500 text-[11px]">Arrival 08:44 AM · Journey Completed</p>
                      </div>
                    </div>
                  </div>

                  {/* Highlights tag strip */}
                  <div className="pt-2 flex items-center justify-between text-[11px] font-semibold text-slate-600 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-emerald-600" />
                      Women Priority
                    </span>
                    <span className="flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5 text-blue-600" />
                      Live GPS Tracking
                    </span>
                    <span className="flex items-center gap-1">
                      <Leaf className="w-3.5 h-3.5 text-green-600" />
                      -1.8 kg CO₂
                    </span>
                  </div>

                </div>

                {/* Decorative glow */}
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-3xl blur-2xl -z-10" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#1769D2]">Simple, Safe & Transparent</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#123F7A] tracking-tight">
              How RIGOO Works
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Connecting daily commuters already heading the same way. No unnecessary commercial trips.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Step 1 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-[#1769D2] hover:shadow-md transition space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#EAF3FF] text-[#1769D2] font-black text-lg flex items-center justify-center border border-blue-200">
                01
              </div>
              <h3 className="font-bold text-lg text-slate-900">Offer or Find a Ride</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Riders post their planned commute (origin, destination, departure time). Passengers enter their pickup and drop-off points.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-[#1769D2] hover:shadow-md transition space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#EAF3FF] text-[#1769D2] font-black text-lg flex items-center justify-center border border-blue-200">
                02
              </div>
              <h3 className="font-bold text-lg text-slate-900">Get Intelligently Matched</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our deterministic engine evaluates road corridor overlap, time sync, detour km, and safety preferences with transparent match percentages.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-[#1769D2] hover:shadow-md transition space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#EAF3FF] text-[#1769D2] font-black text-lg flex items-center justify-center border border-blue-200">
                03
              </div>
              <h3 className="font-bold text-lg text-slate-900">Confirm Your Journey</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Passenger sends a ride request. Rider reviews the verified profile and accepts. The pillion seat is locked via database transaction.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-[#1769D2] hover:shadow-md transition space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#EAF3FF] text-[#1769D2] font-black text-lg flex items-center justify-center border border-blue-200">
                04
              </div>
              <h3 className="font-bold text-lg text-slate-900">Share the Ride & Live GPS</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Rider starts pickup navigation with real-time GPS tracking sent to passenger via Socket.IO, continuing until safe drop-off.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 5 Core Pillars Section */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#1769D2]">Engineered for Commuters</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#123F7A]">
              Why RIGOO is Different
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1769D2] flex items-center justify-center">
                <Navigation className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-slate-900">Actual Real-Time GPS Tracking</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                No simulated moving dots or hardcoded coordinates. Live position streaming from the device Geolocation API directly through Socket.IO with dynamic ETA and road route display.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-slate-900">Women-to-Women Safety Priority</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Verified female passengers can toggle dedicated women-only matching. Plus 1-click Emergency SOS dispatch to 112/1091 and temporary live trip-sharing links for parents.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-slate-900">Equitable Fuel Cost Sharing</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Strictly non-commercial. Transparent fuel calculation based on distance and bike fuel efficiency (~₹25 - ₹35 per ride). Both commuter and rider save money every single day.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Footer & Co-founder attribution */}
      <footer className="mt-auto bg-[#123F7A] text-white py-12 border-t border-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1769D2] flex items-center justify-center text-white">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg tracking-tight">RIGOO</h3>
                <p className="text-xs text-blue-200">Share the Journey · AI-Powered Bike Pooling</p>
              </div>
            </div>

            <div className="text-center md:text-right text-xs text-blue-200 space-y-1">
              <p className="font-semibold text-white">Co-founders:</p>
              <p>M. Rethika & H. Bhavya Sree</p>
              <p className="text-[11px] text-blue-300">Built for Smart, Sustainable Urban Mobility</p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-blue-300 gap-4">
            <p>© 2026 RIGOO Platform. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>Hyderabad Transit Project</span>
              <span>·</span>
              <span>Lyra AI Integration</span>
              <span>·</span>
              <span>MySQL rigoo_db</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};
