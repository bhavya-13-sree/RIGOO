import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { OfferRidePage } from './components/OfferRidePage.tsx';
import { FindRidePage } from './components/FindRidePage.tsx';
import { MyRidesPage } from './components/MyRidesPage.tsx';
import { RideHistoryPage } from './components/RideHistoryPage.tsx';
import { SafetyCenterPage } from './components/SafetyCenterPage.tsx';
import { ProfilePage } from './components/ProfilePage.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { LiveTrackingModal } from './components/LiveTrackingModal.tsx';
import { TripSharePage } from './components/TripSharePage.tsx';
import { RideMateAIFloating } from './components/RideMateAIFloating.tsx';

function MainAppContent() {
  const { currentUser, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'login' | 'signup'>('login');

  // Tracking Modal State
  const [trackingRideId, setTrackingRideId] = useState<number | null>(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);

  // Tab navigation payload
  const [tabPayload, setTabPayload] = useState<any>(null);

  // Check URL params for trusted contact trip share (?share=TOKEN)
  const [shareToken, setShareToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('share');
    if (token) {
      setShareToken(token);
    }
  }, []);

  // Update tab default based on auth
  useEffect(() => {
    if (!currentUser && !loading) {
      setCurrentTab('landing');
    } else if (currentUser && currentTab === 'landing') {
      setCurrentTab('dashboard');
    }
  }, [currentUser, loading]);

  const handleOpenAuth = (isSignup: boolean = false) => {
    setAuthModalInitialMode(isSignup ? 'signup' : 'login');
    setAuthModalOpen(true);
  };

  const handleNavigate = (tab: string, payload?: any) => {
    if (!currentUser && tab !== 'landing') {
      handleOpenAuth(false);
      return;
    }
    setTabPayload(payload);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenTracking = (rideId: number) => {
    setTrackingRideId(rideId);
    setIsTrackingOpen(true);
  };

  // If viewing via public trip sharing link
  if (shareToken) {
    return (
      <TripSharePage
        token={shareToken}
        onGoHome={() => {
          window.history.replaceState({}, '', window.location.pathname);
          setShareToken(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-[#172B4D] flex flex-col font-sans">
      {/* Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={handleNavigate}
        onOpenAuth={() => handleOpenAuth(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'landing' && (
          <LandingPage
            onOpenAuth={handleOpenAuth}
            onExploreRides={() => handleNavigate('find-ride')}
            onOfferRide={() => handleNavigate('offer-ride')}
          />
        )}

        {currentTab === 'dashboard' && currentUser && (
          <Dashboard
            onNavigate={handleNavigate}
            onOpenTracking={handleOpenTracking}
          />
        )}

        {currentTab === 'offer-ride' && currentUser && (
          <OfferRidePage
            onSuccess={() => handleNavigate('my-rides')}
          />
        )}

        {currentTab === 'find-ride' && (
          <FindRidePage
            prefillRideId={tabPayload?.prefillRideId}
            onRequestSubmitted={(rideId) => {
              handleNavigate('my-rides');
              handleOpenTracking(rideId);
            }}
          />
        )}

        {currentTab === 'my-rides' && currentUser && (
          <MyRidesPage
            onOpenTracking={handleOpenTracking}
            onNavigateOffer={() => handleNavigate('offer-ride')}
            onNavigateFind={() => handleNavigate('find-ride')}
          />
        )}

        {currentTab === 'ride-history' && currentUser && (
          <RideHistoryPage />
        )}

        {currentTab === 'safety' && (
          <SafetyCenterPage />
        )}

        {currentTab === 'profile' && currentUser && (
          <ProfilePage />
        )}
      </main>

      {/* Floating RideMate AI Assistant on all authenticated screens */}
      {currentUser && (
        <RideMateAIFloating onNavigateTab={handleNavigate} />
      )}

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalInitialMode}
      />

      {isTrackingOpen && trackingRideId && (
        <LiveTrackingModal
          rideId={trackingRideId}
          isOpen={isTrackingOpen}
          onClose={() => {
            setIsTrackingOpen(false);
            setTrackingRideId(null);
          }}
          onTripCompleted={() => {
            handleNavigate('ride-history');
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
