import React, { useState } from 'react';
import { useQueue } from '../../context/QueueContext';
import { calculateTurnStatus } from '../../utils/turnStatus';
import {
  User,
  Shield,
  Clock,
  CheckCircle2,
  Calendar,
  Bell,
  Smartphone,
  Mail,
  QrCode,
  AlertTriangle,
  FileText,
  LogOut,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Search,
  Lock,
  KeyRound,
  Download,
  Trash2,
  Building2,
  XCircle,
  RefreshCw
} from 'lucide-react';

interface UserDashboardProps {
  onOpenAuthModal?: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ onOpenAuthModal }) => {
  const {
    currentUser,
    tokens,
    currentOrg,
    userTokens,
    appointments,
    userActivities,
    notifications,
    cancelToken,
    checkInAtEntrance,
    cancelAppointment,
    updateUserProfile,
    revokeSession,
    revokeAllOtherSessions,
    linkGuestTokensByContact,
    deleteUserAccount,
    reAuthenticate,
    showToast,
    setCurrentView,
    logout
  } = useQueue();

  const [activeTab, setActiveTab] = useState<'overview' | 'tokens' | 'history' | 'appointments' | 'activity' | 'security' | 'profile'>('overview');

  // Security re-auth modal state
  const [showReAuthModal, setShowReAuthModal] = useState(false);
  const [reAuthPassword, setReAuthPassword] = useState('');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Profile Edit State
  const [editName, setEditName] = useState(currentUser.name);
  const [editEmail, setEditEmail] = useState(currentUser.email || '');
  const [editPhone, setEditPhone] = useState(currentUser.phone || '');
  const [editSms, setEditSms] = useState(currentUser.notificationPrefs?.sms ?? true);
  const [editWhatsapp, setEditWhatsapp] = useState(currentUser.notificationPrefs?.whatsapp ?? true);
  const [editEmailNotif, setEditEmailNotif] = useState(currentUser.notificationPrefs?.email ?? true);

  // Link Guest Token State
  const [linkContactInput, setLinkContactInput] = useState('');

  // Selected Token for Detail / QR Modal
  const [selectedTokenForQR, setSelectedTokenForQR] = useState<any | null>(null);

  // Filter for history
  const [historySearch, setHistorySearch] = useState('');

  const activeTokens = userTokens.filter(t => t.status === 'WAITING' || t.status === 'CALLED' || t.status === 'IN_SERVICE' || t.status === 'ON_HOLD');
  const pastTokens = userTokens.filter(t => t.status === 'COMPLETED' || t.status === 'CANCELLED' || t.status === 'NO_SHOW');

  const filteredPastTokens = pastTokens.filter(t => 
    t.tokenNumber.toLowerCase().includes(historySearch.toLowerCase()) ||
    t.serviceName.toLowerCase().includes(historySearch.toLowerCase())
  );

  const handleProtectedAction = (action: () => void) => {
    setPendingAction(() => action);
    setShowReAuthModal(true);
  };

  const confirmReAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (reAuthenticate(reAuthPassword)) {
      setShowReAuthModal(false);
      setReAuthPassword('');
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // If changing email or phone, require re-authentication
    const emailChanged = editEmail !== (currentUser.email || '');
    const phoneChanged = editPhone !== (currentUser.phone || '');

    if (emailChanged || phoneChanged) {
      handleProtectedAction(() => {
        updateUserProfile({
          name: editName,
          email: editEmail,
          phone: editPhone,
          notificationPrefs: {
            sms: editSms,
            whatsapp: editWhatsapp,
            email: editEmailNotif,
            inApp: true
          }
        });
      });
    } else {
      updateUserProfile({
        name: editName,
        notificationPrefs: {
          sms: editSms,
          whatsapp: editWhatsapp,
          email: editEmailNotif,
          inApp: true
        }
      });
    }
  };

  const handleExportData = () => {
    const userData = {
      profile: currentUser,
      activeTokens,
      serviceHistory: pastTokens,
      appointments,
      activities: userActivities,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `queueless_personal_data_${currentUser.id}.json`;
    a.click();
    showToast('Personal data archive downloaded.', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 pb-24">
      
      {/* 1. HEADER PROFILE HERO */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 p-1">
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={currentUser.name}
                  className="w-full h-full rounded-xl object-cover"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-slate-950 ring-4 ring-slate-900">
                <Shield className="w-3.5 h-3.5" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-3xl font-black">{currentUser.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold">
                  REGISTERED CITIZEN
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                {currentUser.email && <span>{currentUser.email}</span>}
                {currentUser.phone && <span>• +91 {currentUser.phone}</span>}
              </p>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700/80">
            <div className="text-center px-4 border-r border-slate-700">
              <span className="text-xl sm:text-2xl font-black text-sky-400">{activeTokens.length}</span>
              <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Active</span>
            </div>
            <div className="text-center px-4 border-r border-slate-700">
              <span className="text-xl sm:text-2xl font-black text-emerald-400">{pastTokens.length}</span>
              <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Past Visits</span>
            </div>
            <div className="text-center px-4">
              <span className="text-xl sm:text-2xl font-black text-purple-400">{appointments.length}</span>
              <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Bookings</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pt-6 mt-6 border-t border-slate-800 scrollbar-none">
          {[
            { id: 'overview', label: 'Overview', icon: Sparkles },
            { id: 'tokens', label: `Active Tokens (${activeTokens.length})`, icon: Clock },
            { id: 'history', label: 'Service History', icon: CheckCircle2 },
            { id: 'appointments', label: 'Appointments', icon: Calendar },
            { id: 'activity', label: 'Audit Timeline', icon: FileText },
            { id: 'security', label: 'Security & Sessions', icon: Shield },
            { id: 'profile', label: 'Profile Settings', icon: User }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-sky-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. TAB CONTENTS */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Active Live Token Banner */}
          {activeTokens.length > 0 ? (
            <div className="rounded-3xl bg-gradient-to-r from-sky-500/15 via-indigo-500/15 to-emerald-500/15 border-2 border-sky-500/30 p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-sky-600/30">
                    <Clock className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-sky-600 dark:text-sky-400">
                      Live Queue Status
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                      Token {activeTokens[0].tokenNumber}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black ${
                    activeTokens[0].status === 'CALLED'
                      ? 'bg-emerald-500 text-slate-950 animate-bounce'
                      : activeTokens[0].status === 'IN_SERVICE'
                      ? 'bg-sky-600 text-white'
                      : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  }`}>
                    {activeTokens[0].status === 'CALLED' ? 'NOW CALLING • REPORT TO COUNTER' : activeTokens[0].status}
                  </span>
                </div>
              </div>

              {/* Service & Window Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Service</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{activeTokens[0].serviceName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Secure Tracking Ref</span>
                  <span className="text-sm font-mono font-bold text-sky-600 dark:text-sky-400">{activeTokens[0].secureTrackingRef}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Staggered Arrival</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {activeTokens[0].staggeredWindow?.recommendedArrival || 'Immediate'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setSelectedTokenForQR(activeTokens[0])}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Show Lobby QR Pass</span>
                </button>
                {activeTokens[0].checkInStatus !== 'CHECKED_IN_ENTRANCE' && (
                  <button
                    onClick={() => checkInAtEntrance(activeTokens[0].id)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Check-In at Lobby</span>
                  </button>
                )}
                <button
                  onClick={() => cancelToken(activeTokens[0].id)}
                  className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-500/30 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Cancel Pass</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No active queue tokens right now</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Need to visit a hospital, bank, university desk or municipal office? Generate an instant token or book an appointment.
              </p>
              <button
                onClick={() => setCurrentView('citizen')}
                className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Get Digital Token Now
              </button>
            </div>
          )}

          {/* Quick 2-Column: Appointments & Recent History */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Upcoming Bookings */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <span>Upcoming Appointments</span>
                </div>
                <button
                  onClick={() => setActiveTab('appointments')}
                  className="text-xs text-sky-600 dark:text-sky-400 font-bold hover:underline"
                >
                  View all
                </button>
              </div>

              {appointments.length > 0 ? (
                <div className="space-y-3">
                  {appointments.slice(0, 2).map(apt => (
                    <div key={apt.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 block">{apt.bookingReference}</span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{apt.serviceName}</h4>
                        <p className="text-xs text-slate-500">{apt.orgName} • {apt.scheduledTime}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold shrink-0">
                        {apt.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">No upcoming appointments scheduled.</p>
              )}
            </div>

            {/* Recent Completed Tokens */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Recent Completed Visits</span>
                </div>
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-xs text-sky-600 dark:text-sky-400 font-bold hover:underline"
                >
                  View full history
                </button>
              </div>

              {pastTokens.length > 0 ? (
                <div className="space-y-3">
                  {pastTokens.slice(0, 2).map(t => (
                    <div key={t.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 block">{t.tokenNumber}</span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t.serviceName}</h4>
                        <p className="text-xs text-slate-500">{t.deptName}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold shrink-0">
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">No previous service history recorded.</p>
              )}
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE TOKENS */}
      {activeTab === 'tokens' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Active Queue Tokens</h2>
              <p className="text-xs text-slate-500">Live tokens currently active in service queues</p>
            </div>
            <button
              onClick={() => setCurrentView('citizen')}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              + Get Another Token
            </button>
          </div>

          {activeTokens.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeTokens.map(token => {
                const turn = calculateTurnStatus(token, tokens, currentOrg);
                return (
                  <div key={token.id} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-black">
                          {token.tokenNumber.slice(0, 3)}
                        </div>
                        <div>
                          <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400">{token.secureTrackingRef}</span>
                          <h3 className="text-xl font-black text-slate-900 dark:text-white">{token.tokenNumber}</h3>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        token.status === 'CALLED' ? 'bg-emerald-500 text-slate-950 animate-bounce' : 'bg-sky-500/20 text-sky-600 dark:text-sky-400'
                      }`}>
                        {turn.turnBadge}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <p className="text-slate-700 dark:text-slate-300 font-bold">{token.serviceName}</p>
                      <p className="text-slate-500">{token.deptName}</p>
                      <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {turn.isTurnNow ? "Now Calling" : turn.peopleAhead === 0 ? "Next Turn" : `${turn.peopleAhead} people ahead`}
                        </span>
                        <span>Now Serving: <strong className="text-slate-900 dark:text-white font-mono">{turn.nowServingTokenNumber}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => setSelectedTokenForQR(token)}
                        className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>QR Pass</span>
                      </button>
                      <button
                        onClick={() => cancelToken(token.id)}
                        className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-500/20 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-400">No active tokens found for your account.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SERVICE HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Universal Service History</h2>
              <p className="text-xs text-slate-500">Cross-organization records spanning Hospitals, Banks, Universities & Civic desks</p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                placeholder="Search history by token or service..."
                className="pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 w-64"
              />
            </div>
          </div>

          {filteredPastTokens.length > 0 ? (
            <div className="space-y-3">
              {filteredPastTokens.map(token => (
                <div key={token.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">{token.tokenNumber}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({token.secureTrackingRef})</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">{token.serviceName}</h4>
                      <p className="text-[11px] text-slate-400">{token.deptName} • Served at Counter {token.counterNumber || '1'}</p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between text-right">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                      {token.status}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">
                      {new Date(token.issuedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-400">No matching service records found.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Scheduled Appointments</h2>
              <p className="text-xs text-slate-500">Advance booked time slots and consultations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {appointments.map(apt => (
              <div key={apt.id} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="font-mono font-bold text-xs text-purple-600 dark:text-purple-400">{apt.bookingReference}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                    {apt.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{apt.serviceName}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{apt.orgName}</span>
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{apt.scheduledTime}</span>
                  </p>
                  {apt.notes && (
                    <p className="text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                      Note: {apt.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => cancelAppointment(apt.id)}
                    className="w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-500/20 transition-colors cursor-pointer"
                  >
                    Cancel Booking
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT TIMELINE */}
      {activeTab === 'activity' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Account Activity Timeline</h2>
            <p className="text-xs text-slate-500">Immutable chronological log of all interactions and security updates</p>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {userActivities.map(act => (
              <div key={act.id} className="relative group">
                <span className="absolute -left-6 top-1.5 w-4 h-4 rounded-full bg-sky-500 ring-4 ring-white dark:ring-slate-950"></span>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">{act.title}</span>
                    <span className="text-[10px] text-slate-400">{act.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-500">{act.description}</p>
                  <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 block pt-1">{act.orgName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: SECURITY & SESSIONS */}
      {activeTab === 'security' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Active Sessions */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-sky-500" />
                  <span>Authorized Devices & Active Sessions</span>
                </h3>
                <p className="text-xs text-slate-500">Manage devices currently logged into your QueueLess account</p>
              </div>

              <button
                onClick={revokeAllOtherSessions}
                className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-500/20 transition-colors cursor-pointer"
              >
                Revoke All Other Sessions
              </button>
            </div>

            <div className="space-y-3">
              {(currentUser.sessions || []).map(sess => (
                <div key={sess.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{sess.userAgent}</span>
                        {sess.isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">
                            CURRENT DEVICE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">IP: {sess.ipMasked} • {sess.lastActive}</p>
                    </div>
                  </div>

                  {!sess.isCurrent && (
                    <button
                      onClick={() => revokeSession(sess.id)}
                      className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Account Linking: Claim Historical Guest Tokens */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-purple-500" />
              <span>Link Previous Guest Bookings</span>
            </h3>
            <p className="text-xs text-slate-500">
              Enter a phone number or email used when booking previous guest tokens to link them to your personal profile.
            </p>

            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                value={linkContactInput}
                onChange={e => setLinkContactInput(e.target.value)}
                placeholder="Enter phone (e.g. 9811223344)..."
                className="flex-1 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={() => {
                  linkGuestTokensByContact(linkContactInput);
                  setLinkContactInput('');
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Claim Tokens
              </button>
            </div>
          </div>

          {/* Data Privacy & GDPR / DPDP Compliance */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-500" />
              <span>Data Portability & Retention</span>
            </h3>
            <p className="text-xs text-slate-500">
              Download your full personal data archive or request account deletion. Under data retention policies, personal identifying information is scrubbed while anonymous organization audit records remain intact.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleExportData}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Personal Data (JSON)</span>
              </button>

              <button
                onClick={() => handleProtectedAction(deleteUserAccount)}
                className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-500/20 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Account & Anonymize Records</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* TAB 7: PROFILE SETTINGS */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-in fade-in duration-200 max-w-2xl">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Profile & Preferences</h2>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Changing your email triggers identity re-verification.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Used for SMS dispatch chimes and entrance scanning.</p>
              </div>

              {/* Notification Toggles */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Dispatch Notification Channels</span>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
                  <span className="text-xs text-slate-700 dark:text-slate-300">SMS Alerts on Calling / Hold</span>
                  <input
                    type="checkbox"
                    checked={editSms}
                    onChange={e => setEditSms(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
                  <span className="text-xs text-slate-700 dark:text-slate-300">WhatsApp Staggered ETA Alerts</span>
                  <input
                    type="checkbox"
                    checked={editWhatsapp}
                    onChange={e => setEditWhatsapp(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
                  <span className="text-xs text-slate-700 dark:text-slate-300">Email Digital Pass & Receipts</span>
                  <input
                    type="checkbox"
                    checked={editEmailNotif}
                    onChange={e => setEditEmailNotif(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. RE-AUTHENTICATION MODAL FOR SENSITIVE ACTIONS */}
      {showReAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Security Re-Authentication Required</h3>
              <p className="text-xs text-slate-500">
                To complete this sensitive action (profile change, deletion, or session purge), please enter your account password or PIN.
              </p>
            </div>

            <form onSubmit={confirmReAuth} className="space-y-4 pt-2">
              <input
                type="password"
                value={reAuthPassword}
                onChange={e => setReAuthPassword(e.target.value)}
                placeholder="Enter password or PIN (e.g. 1234)..."
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowReAuthModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors"
                >
                  Confirm & Proceed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. QR PASS MODAL */}
      {selectedTokenForQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-6">
            <div>
              <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest">
                Digital Queue Pass
              </span>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{selectedTokenForQR.tokenNumber}</h3>
              <p className="text-xs text-slate-500">{selectedTokenForQR.serviceName}</p>
            </div>

            <div className="p-4 bg-white rounded-2xl shadow-inner inline-block mx-auto border-2 border-slate-100">
              <div className="w-44 h-44 bg-slate-900 rounded-xl p-3 flex flex-col items-center justify-center text-white relative">
                <QrCode className="w-28 h-28 text-white" />
                <span className="text-[9px] font-mono font-bold tracking-widest text-sky-400 mt-1 uppercase">
                  {selectedTokenForQR.tokenNumber}
                </span>
                <div className="absolute inset-0 border-2 border-dashed border-sky-400/40 rounded-xl pointer-events-none"></div>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-slate-400 block">Ref: {selectedTokenForQR.secureTrackingRef}</span>
              <p className="text-[11px] text-slate-500">Scan at Facility Lobby Pod to register physical arrival</p>
            </div>

            <button
              onClick={() => setSelectedTokenForQR(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs transition-colors"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
