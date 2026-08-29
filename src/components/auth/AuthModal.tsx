import React, { useState } from 'react';
import { useQueue } from '../../context/QueueContext';
import { UserRole } from '../../types';
import {
  X,
  ShieldCheck,
  User,
  Users,
  Building2,
  Tv,
  Touchpad,
  CheckCircle2,
  Lock,
  Smartphone,
  Mail,
  KeyRound,
  Sparkles,
  AlertCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    loginAsGuest,
    loginAsRegisteredUser,
    loginAsStaffWithInvite,
    loginAsDemoRole,
    logout,
    currentOrg,
    requestOtp,
    verifyOtp,
    showToast,
    staffInvitations
  } = useQueue();

  const [authMethod, setAuthMethod] = useState<'citizen_auth' | 'staff_invite' | 'demo_roles'>('citizen_auth');
  
  // Citizen Auth State
  const [citizenMode, setCitizenMode] = useState<'google' | 'otp' | 'email'>('google');
  const [mobileInput, setMobileInput] = useState('9811223344');
  const [emailInput, setEmailInput] = useState('pooja.sundaram@example.com');
  const [nameInput, setNameInput] = useState('Pooja Sundaram');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpCooldown, setOtpCooldown] = useState<number | undefined>();

  // Staff Invitation State
  const [inviteCodeInput, setInviteCodeInput] = useState('QLESS-STF-8F4K29');
  const [staffNameInput, setStaffNameInput] = useState('Dr. Anil Sharma');
  const [staffError, setStaffError] = useState('');

  if (!isOpen) return null;

  const handleGoogleSignIn = () => {
    loginAsRegisteredUser({
      name: 'Pooja Sundaram',
      email: 'pooja.sundaram@example.com',
      phone: '9811223344',
      authProvider: 'google',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    });
    onClose();
  };

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    if (mobileInput.length < 10) {
      setOtpError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const res = requestOtp(mobileInput);
    if (!res.success) {
      setOtpError(res.error || 'Rate limited');
      setOtpCooldown(res.waitSeconds);
      return;
    }

    setOtpSent(true);
    setSimulatedOtp(res.simulatedCode || '742918');
    setOtpCode(res.simulatedCode || '742918'); // Pre-fill in demo for convenience
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    const res = verifyOtp(mobileInput, otpCode);

    if (!res.success) {
      setOtpError(res.error || 'Invalid OTP');
      return;
    }

    loginAsRegisteredUser({
      name: nameInput || `Citizen (${mobileInput.slice(-4)})`,
      phone: mobileInput,
      authProvider: 'mobile_otp'
    });
    onClose();
  };

  const handleStaffInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');

    if (!inviteCodeInput.trim()) {
      setStaffError('Please enter the Staff Invitation Code provided by your Organization Administrator.');
      return;
    }

    if (!staffNameInput.trim()) {
      setStaffError('Please enter your full name.');
      return;
    }

    const res = loginAsStaffWithInvite(inviteCodeInput, staffNameInput);
    if (!res.success) {
      setStaffError(res.error || 'Invalid invitation code.');
      return;
    }

    onClose();
  };

  const handleRoleSelect = (role: UserRole) => {
    loginAsDemoRole(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                QueueLess Identity & Access Portal
              </h3>
              <p className="text-xs text-slate-500">
                Zero-Trust Authentication & Role-Based Authorization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Session Pill */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 block">
              Active Authenticated Session
            </span>
            <p className="text-sm font-black text-slate-900 dark:text-white">
              {currentUser.name}
            </p>
            <span className="inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 mt-1 uppercase">
              Role: {currentUser.role} {currentUser.isGuest ? '(Guest)' : ''}
            </span>
          </div>
          {!currentUser.isGuest ? (
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          ) : (
            <span className="text-[10px] font-bold text-slate-400">Guest Pass Active</span>
          )}
        </div>

        {/* Main Tab Navigation */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-xs font-bold">
          <button
            onClick={() => setAuthMethod('citizen_auth')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              authMethod === 'citizen_auth'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Citizen Sign In
          </button>
          <button
            onClick={() => setAuthMethod('staff_invite')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              authMethod === 'staff_invite'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Staff Invitation
          </button>
          <button
            onClick={() => setAuthMethod('demo_roles')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              authMethod === 'demo_roles'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Demo Roles
          </button>
        </div>

        {/* TAB 1: CITIZEN AUTH */}
        {authMethod === 'citizen_auth' && (
          <div className="space-y-4">
            
            {/* Quick Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-bold text-xs text-slate-800 dark:text-white flex items-center justify-center gap-3 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google (Instant Verified Citizen)</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Or Mobile OTP</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            {/* Mobile OTP Form */}
            {!otpSent ? (
              <form onSubmit={handleRequestOtp} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    placeholder="Enter your name..."
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    10-Digit Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                      +91
                    </div>
                    <input
                      type="tel"
                      value={mobileInput}
                      onChange={e => setMobileInput(e.target.value)}
                      placeholder="9876543210"
                      maxLength={10}
                      className="flex-1 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                {otpError && (
                  <p className="text-xs text-rose-500 font-bold">{otpError}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Send Verification OTP
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300">
                  <span>Demo OTP Sent! Simulated code: </span>
                  <strong className="font-mono">{simulatedOtp}</strong>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Enter 6-Digit OTP
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    maxLength={6}
                    autoFocus
                    placeholder="742918"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono tracking-widest text-center text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {otpError && (
                  <p className="text-xs text-rose-500 font-bold">{otpError}</p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs"
                  >
                    Verify & Enter Dashboard
                  </button>
                </div>
              </form>
            )}

            {/* Anonymous Guest Button */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  loginAsGuest();
                  onClose();
                }}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold hover:underline cursor-pointer"
              >
                No account? Continue as Guest →
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: STAFF INVITATION */}
        {authMethod === 'staff_invite' && (
          <form onSubmit={handleStaffInviteSubmit} className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                <span>Zero-Trust Staff Registration</span>
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Staff accounts require an official single-use invitation code generated by the Organization Admin.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Staff Invitation Code
              </label>
              <input
                type="text"
                value={inviteCodeInput}
                onChange={e => setInviteCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. QLESS-STF-8F4K29"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px]">
                <span className="text-slate-400">Available Demo Codes:</span>
                <button
                  type="button"
                  onClick={() => setInviteCodeInput('QLESS-STF-8F4K29')}
                  className="font-mono text-emerald-600 dark:text-emerald-400 underline font-bold"
                >
                  QLESS-STF-8F4K29 (Staff)
                </button>
                <button
                  type="button"
                  onClick={() => setInviteCodeInput('QLESS-SUP-3M7X11')}
                  className="font-mono text-purple-600 dark:text-purple-400 underline font-bold"
                >
                  QLESS-SUP-3M7X11 (Supervisor)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Your Full Name & Designation
              </label>
              <input
                type="text"
                value={staffNameInput}
                onChange={e => setStaffNameInput(e.target.value)}
                placeholder="e.g. Dr. Anil Sharma"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {staffError && (
              <p className="text-xs text-rose-500 font-bold">{staffError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Validate Code & Open Staff Console</span>
            </button>
          </form>
        )}

        {/* TAB 3: DEMO ROLES */}
        {authMethod === 'demo_roles' && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Select any role to test its specific capabilities and strict authorization boundaries:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              {/* Guest */}
              <button
                onClick={() => handleRoleSelect('guest')}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-sky-500 bg-white dark:bg-slate-900 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-slate-900 dark:text-white">Guest Citizen</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500">
                    No Auth
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Get token, view wait time, check-in. Cannot access staff or admin.</p>
              </button>

              {/* Registered Citizen */}
              <button
                onClick={() => handleRoleSelect('citizen')}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-sky-500 bg-white dark:bg-slate-900 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-slate-900 dark:text-white">Registered User</span>
                  <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-[10px] font-bold text-sky-600 dark:text-sky-400">
                    Personal Portal
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">My QueueLess: multi-org tokens, service history, appointments & sessions.</p>
              </button>

              {/* Staff Operator */}
              <button
                onClick={() => handleRoleSelect('staff')}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 bg-white dark:bg-slate-900 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-slate-900 dark:text-white">Staff Operator</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Counter Station
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Call next with mutex locking, hold, complete, transfer, and voice chime.</p>
              </button>

              {/* Supervisor */}
              <button
                onClick={() => handleRoleSelect('supervisor')}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 bg-white dark:bg-slate-900 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-slate-900 dark:text-white">Floor Supervisor</span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                    Queue Monitor
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Station reassignment, flex counters, and floor load balancing.</p>
              </button>

              {/* Organization Admin */}
              <button
                onClick={() => handleRoleSelect('admin')}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 bg-white dark:bg-slate-900 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-slate-900 dark:text-white">Org Administrator</span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    Full Control
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Staff invites, account revocation, service/counter config & audit logs.</p>
              </button>

              {/* Super Admin */}
              <button
                onClick={() => handleRoleSelect('super_admin')}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 bg-white dark:bg-slate-900 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-slate-900 dark:text-white">Super Admin</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    Platform Owner
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Onboard new organizations and cross-tenant platform management.</p>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
