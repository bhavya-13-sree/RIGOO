import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { RatingReview } from '../types/index.ts';
import {
  User as UserIcon,
  Shield,
  CheckCircle2,
  Bike,
  Star,
  Phone,
  Mail,
  Building,
  Save,
  Check
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { currentUser, refreshUser } = useAuth();
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [vehicleModel, setVehicleModel] = useState(currentUser?.vehicle_model || '');
  const [vehicleNumber, setVehicleNumber] = useState(currentUser?.vehicle_number || '');
  const [collegeOrOrg, setCollegeOrOrg] = useState(currentUser?.college_or_org || '');
  const [ratings, setRatings] = useState<RatingReview[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadRatings();
    }
  }, [currentUser]);

  const loadRatings = async () => {
    if (!currentUser) return;
    try {
      const res = await api.getUserRatings(currentUser.id);
      setRatings(res.ratings || []);
    } catch (e) {
      // Ignored
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateProfile({
        bio,
        vehicle_model: vehicleModel,
        vehicle_number: vehicleNumber,
        college_or_org: collegeOrOrg,
      });
      await refreshUser();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err: any) {
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <img
          src={currentUser.profile_photo || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200'}
          alt={currentUser.full_name}
          className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-500/20 shadow-md"
        />
        <div className="space-y-1.5 text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-extrabold text-[#123F7A]">{currentUser.full_name}</h1>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              Verified Commuter
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {currentUser.college_or_org} · {currentUser.gender}, Age {currentUser.age}
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-slate-600">
            <span>⭐ <b>{currentUser.rating_avg}</b> Community Rating</span>
            <span>·</span>
            <span><b>{currentUser.total_rides_offered}</b> Rides Offered</span>
            <span>·</span>
            <span><b>{currentUser.total_rides_taken}</b> Rides Taken</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Profile Settings Form */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <h3 className="font-extrabold text-base text-[#123F7A]">
            Commuter Details & Vehicle
          </h3>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">College or Organization</label>
              <input
                type="text"
                value={collegeOrOrg}
                onChange={(e) => setCollegeOrOrg(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1769D2]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Commuter Bio</label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your daily commute routine..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1769D2]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Vehicle Model</label>
                <input
                  type="text"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  placeholder="e.g. TVS Jupiter 125"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1769D2]"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Vehicle Plate No</label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="e.g. TS 08 EK 4589"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1769D2]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-[#1769D2] hover:bg-[#123F7A] shadow-md transition flex items-center justify-center gap-1.5"
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{savedSuccess ? 'Saved Changes!' : 'Update Profile'}</span>
            </button>
          </form>
        </div>

        {/* Safety & Emergency Contact Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
            <h3 className="font-extrabold text-base text-[#123F7A] flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Registered Emergency Contact</span>
            </h3>

            {currentUser.emergency_contact ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{currentUser.emergency_contact.contact_name}</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Primary Contact
                  </span>
                </div>
                <p className="text-slate-600">Phone: {currentUser.emergency_contact.phone_number}</p>
                <p className="text-slate-600">Relationship: {currentUser.emergency_contact.relationship}</p>
              </div>
            ) : (
              <p className="text-slate-400 italic">No emergency contact registered.</p>
            )}

            <p className="text-[11px] text-slate-500">
              This contact receives automatic SMS notifications when you trigger Emergency SOS or share your live trip.
            </p>
          </div>

          {/* Ratings & Reviews List */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-[#123F7A]">
              Community Reviews ({ratings.length})
            </h3>
            {ratings.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No reviews yet.</p>
            ) : (
              <div className="space-y-3">
                {ratings.map((r) => (
                  <div key={r.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{r.reviewer_name}</span>
                      <span className="font-bold text-amber-500">{'⭐'.repeat(r.rating)}</span>
                    </div>
                    <p className="text-slate-600 italic">"{r.review}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
