import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { X, ShieldCheck, UserCheck, AlertCircle, Sparkles, Bike } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { login, signup, switchDemoUser } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('21');
  const [gender, setGender] = useState<'Female' | 'Male' | 'Non-binary' | 'Other'>('Female');
  const [collegeOrOrg, setCollegeOrOrg] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Parent');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!emergencyName || !emergencyPhone) {
      setError('Emergency contact is required for all RIGOO members for safety verification');
      return;
    }

    setLoading(true);
    try {
      await signup({
        full_name: fullName,
        email,
        mobile_number: mobile,
        password,
        age: parseInt(age, 10),
        gender,
        college_or_org: collegeOrOrg,
        emergency_name: emergencyName,
        emergency_phone: emergencyPhone,
        emergency_relation: emergencyRelation,
        vehicle_model: vehicleModel || undefined,
        vehicle_number: vehicleNumber || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (userEmail: string) => {
    setLoading(true);
    setError(null);
    try {
      await switchDemoUser(userEmail);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header bar */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-[#1769D2] to-[#123F7A] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Bike className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-xl tracking-tight">
                {mode === 'login' ? 'Sign In to RIGOO' : 'Join RIGOO Bike Pool'}
              </h3>
              <p className="text-xs text-blue-100">
                {mode === 'login'
                  ? 'Access your ride dashboard and live tracking'
                  : 'Single account to offer rides today & find rides tomorrow'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition ${
              mode === 'login'
                ? 'border-[#1769D2] text-[#1769D2] bg-blue-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('signup'); setError(null); }}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition ${
              mode === 'signup'
                ? 'border-[#1769D2] text-[#1769D2] bg-blue-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Demo Access Bar */}
          <div className="mb-6 p-3.5 rounded-2xl bg-[#EAF3FF] border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#1769D2]" />
              <span className="text-xs font-bold text-[#123F7A]">Hackathon Instant Demo Sign In:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo('rethika@rigoo.in')}
                className="p-2 rounded-xl bg-white border border-blue-200 text-left hover:border-[#1769D2] hover:shadow-xs transition"
              >
                <p className="font-bold text-slate-900">M. Rethika (Co-Founder)</p>
                <p className="text-[10px] text-blue-700 font-medium">Rider · TVS Jupiter · Karmanghat</p>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('ananya@gmail.com')}
                className="p-2 rounded-xl bg-white border border-blue-200 text-left hover:border-[#1769D2] hover:shadow-xs transition"
              >
                <p className="font-bold text-slate-900">Ananya Sharma</p>
                <p className="text-[10px] text-emerald-700 font-medium">Passenger · Champapet route</p>
              </button>
            </div>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. rethika@rigoo.in"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm text-white bg-[#1769D2] hover:bg-[#123F7A] shadow-md transition disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In to Account'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. M. Rethika"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1769D2]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@college.edu or gmail"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1769D2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1769D2]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    required
                    min={18}
                    max={80}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1769D2]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1769D2]"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">College or Organization</label>
                <input
                  type="text"
                  required
                  value={collegeOrOrg}
                  onChange={(e) => setCollegeOrOrg(e.target.value)}
                  placeholder="e.g. VNR VJIET / Tech Mahindra / Osmania Univ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1769D2]"
                />
              </div>

              {/* Emergency Contact Requirements */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#123F7A]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Mandatory Emergency Contact (For SOS & Safety)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="Contact Name (e.g. Parent)"
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                  <input
                    type="tel"
                    required
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="Emergency Mobile (+91)"
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                  <input
                    type="text"
                    required
                    value={emergencyRelation}
                    onChange={(e) => setEmergencyRelation(e.target.value)}
                    placeholder="Relation (e.g. Father, Sister)"
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Optional Vehicle Details (if rider) */}
              <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-2">
                <p className="text-xs font-bold text-slate-700">Vehicle Info (Optional - If offering rides)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="Model (e.g. TVS Jupiter 125)"
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="Vehicle Reg No (e.g. TS 08 EK 4589)"
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Create Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1769D2]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1769D2]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm text-white bg-[#1769D2] hover:bg-[#123F7A] shadow-md transition disabled:opacity-50"
              >
                {loading ? 'Creating Verified Account...' : 'Complete Registration & Join'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
