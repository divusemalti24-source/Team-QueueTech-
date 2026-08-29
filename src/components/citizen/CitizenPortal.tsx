import React, { useState } from 'react';
import { useQueue } from '../../context/QueueContext';
import { PriorityCategory } from '../../types';
import { calculateTurnStatus } from '../../utils/turnStatus';
import {
  Activity,
  QrCode,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  Printer,
  XCircle,
  Search,
  ChevronRight,
  Shield,
  Smartphone,
  Sparkles,
  ArrowRight,
  Stethoscope,
  Building2,
  FileCheck,
  CreditCard,
  GraduationCap,
  BellRing
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CitizenPortalProps {
  onOpenReceiptModal: (token: any) => void;
}

export const CitizenPortal: React.FC<CitizenPortalProps> = ({ onOpenReceiptModal }) => {
  const {
    currentOrg,
    tokens,
    activeCitizenToken,
    setActiveCitizenTokenId,
    joinQueue,
    cancelToken,
    checkInAtEntrance,
    language,
    showToast
  } = useQueue();

  // Form states
  const [selectedDeptId, setSelectedDeptId] = useState<string>(
    currentOrg.departments[0]?.id || ''
  );
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    currentOrg.departments[0]?.services[0]?.id || ''
  );
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');
  const [priority, setPriority] = useState<PriorityCategory>('standard');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileTab, setMobileTab] = useState<'status' | 'booking'>('booking');

  const activeDept = currentOrg.departments.find(d => d.id === selectedDeptId) || currentOrg.departments[0];
  const activeService = activeDept?.services.find(s => s.id === selectedServiceId) || activeDept?.services[0];

  // Calculate Turn-Based Status (No misleading time promises)
  const turnStatus = calculateTurnStatus(activeCitizenToken, tokens, currentOrg);
  const peopleAhead = turnStatus.peopleAhead;

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId) return;

    const token = joinQueue({
      serviceId: selectedServiceId,
      citizenName: citizenName || 'Citizen',
      citizenPhone: citizenPhone || undefined,
      priority,
      type: 'DIGITAL'
    });

    confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
    setMobileTab('status');
    setCitizenName('');
    setCitizenPhone('');
  };

  const handleSearchExisting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.trim().toLowerCase();
    const found = tokens.find(t => 
      t.tokenNumber.toLowerCase() === query || 
      (t.citizenPhone && t.citizenPhone.includes(query))
    );

    if (found) {
      setActiveCitizenTokenId(found.id);
      showToast(`Found live token ${found.tokenNumber}!`, 'success');
      setMobileTab('status');
      setSearchQuery('');
    } else {
      showToast('No active token matching your query was found.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 pb-28 md:pb-12">
      
      {/* 1. HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 p-6 sm:p-10 border border-slate-800 shadow-xl text-white">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            <span>{currentOrg.name}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            {language === 'hi' ? 'पंक्ति में खड़े हुए बिना अपनी बारी पाएं।' : 'Join the queue without standing in it.'}
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
            {language === 'hi'
              ? 'डिजिटल टोकन प्राप्त करें, घर या कार्यालय से कतार की स्थिति ट्रैक करें और समय पर पहुंचें।'
              : 'Generate a secure digital pass, track your position in real-time from anywhere, and receive staggered arrival alerts.'}
          </p>

          {/* Quick Search Existing Token Bar */}
          <form onSubmit={handleSearchExisting} className="pt-2 flex flex-col sm:flex-row gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Find existing token (e.g. MED-102)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors shrink-0 cursor-pointer"
            >
              Track Token
            </button>
          </form>
        </div>

        {/* Decorative backdrop shapes */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-80 h-80 rounded-full bg-sky-600/10 blur-3xl pointer-events-none"></div>
      </div>

      {/* 2. ACTIVE TOKEN PROMINENT CARD (TURN-BASED STATUS) */}
      {activeCitizenToken && (
        <div className={`rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200 border-2 transition-all ${
          turnStatus.isTurnNow
            ? 'bg-gradient-to-r from-emerald-500/15 via-slate-900 to-emerald-500/15 border-emerald-500 ring-4 ring-emerald-500/20'
            : turnStatus.isNextTurn
            ? 'bg-gradient-to-r from-indigo-500/15 via-slate-900 to-indigo-500/15 border-indigo-500 ring-2 ring-indigo-500/30'
            : 'bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-emerald-500/10 border-sky-500/30'
        }`}>
          {/* Top header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-md ${
                turnStatus.isTurnNow
                  ? 'bg-emerald-500 text-slate-950 animate-bounce'
                  : turnStatus.isNextTurn
                  ? 'bg-indigo-600 text-white'
                  : 'bg-sky-600 text-white'
              }`}>
                {turnStatus.isTurnNow ? <BellRing className="w-6 h-6 animate-spin" /> : <Activity className="w-6 h-6 animate-pulse" />}
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-sky-600 dark:text-sky-400">
                  Your Turn Status
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{turnStatus.headline}</span>
                </h3>
              </div>
            </div>

            {/* Prominent Turn Badge */}
            <div className="flex items-center gap-2">
              <span className={`px-4 py-2 rounded-full font-black text-xs flex items-center gap-2 ${turnStatus.colorClass.badgeBg} ${turnStatus.colorClass.badgeText} ${turnStatus.colorClass.glow}`}>
                {turnStatus.isTurnNow && <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping"></span>}
                {turnStatus.isNextTurn && <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>}
                <span>{turnStatus.turnBadge}</span>
              </span>
            </div>
          </div>

          {/* Turn-Based 4-Grid Status Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {/* 1. YOUR TOKEN */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Your Token</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                {activeCitizenToken.tokenNumber}
              </p>
              <span className="text-[10px] text-slate-500 truncate block">{activeCitizenToken.serviceName}</span>
            </div>

            {/* 2. NOW SERVING */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Now Serving</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                {turnStatus.nowServingTokenNumber}
              </p>
              <span className="text-[10px] text-slate-500">Live Station</span>
            </div>

            {/* 3. TURN POSITION / PEOPLE AHEAD */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Queue Position</span>
              <p className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono mt-1">
                {turnStatus.isTurnNow ? '0 (Your Turn)' : `#${turnStatus.queuePosition}`}
              </p>
              <span className="text-[10px] text-slate-500 font-medium">
                {turnStatus.peopleAhead === 0 ? 'Next in line' : `${turnStatus.peopleAhead} people ahead`}
              </span>
            </div>

            {/* 4. DESIGNATED COUNTER / STATUS */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Designated Counter</span>
              <p className={`text-2xl font-black mt-1 font-mono ${turnStatus.isTurnNow ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                {activeCitizenToken.counterNumber ? `Counter ${activeCitizenToken.counterNumber}` : (turnStatus.isNextTurn ? 'Allocating...' : 'On Call')}
              </p>
              <span className="text-[10px] text-slate-500 truncate block">{activeCitizenToken.staffName || 'Officer Window'}</span>
            </div>
          </div>

          {/* Turn Guidance Advisory */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs">
            <div className="space-y-0.5 text-center sm:text-left">
              <span className="text-[10px] font-bold uppercase text-sky-600 dark:text-sky-400">
                Live Turn Guidance
              </span>
              <p className="text-slate-700 dark:text-slate-300">
                {turnStatus.subtext}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeCitizenToken.checkInStatus !== 'CHECKED_IN_ENTRANCE' && (
                <button
                  onClick={() => checkInAtEntrance(activeCitizenToken.id)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verify Lobby Arrival</span>
                </button>
              )}

              <button
                onClick={() => onOpenReceiptModal(activeCitizenToken)}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-sky-500" />
                <span>Thermal Slip</span>
              </button>

              <button
                onClick={() => cancelToken(activeCitizenToken.id)}
                className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel Pass</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. FAST 1-STEP JOIN QUEUE FORM */}
      <div id="booking-section" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {language === 'hi' ? 'नया कतार टोकन जनरेट करें' : 'Generate New Queue Token'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select your required service and confirm in 1 click
              </p>
            </div>

            <form onSubmit={handleJoin} className="space-y-6">
              
              {/* Department Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  1. Select Department
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {currentOrg.departments.map(dept => (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => {
                        setSelectedDeptId(dept.id);
                        setSelectedServiceId(dept.services[0]?.id || '');
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        dept.id === selectedDeptId
                          ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-700 dark:text-sky-300 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <h4 className="font-bold text-xs truncate">
                        {language === 'hi' ? dept.nameHi : dept.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {dept.services.length} services available
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  2. Select Service
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeDept?.services.map(srv => {
                    const waitingCount = tokens.filter(t => t.serviceId === srv.id && t.status === 'WAITING').length;
                    const isSelected = srv.id === selectedServiceId;

                    return (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => setSelectedServiceId(srv.id)}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? 'bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-950/50 dark:to-indigo-950/50 border-sky-500 ring-2 ring-sky-500/20'
                            : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {srv.code}
                            </span>
                            <h4 className="font-black text-sm text-slate-900 dark:text-white mt-1">
                              {language === 'hi' ? srv.nameHi : srv.name}
                            </h4>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            Turn-Based Dispatch
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                          {srv.description}
                        </p>

                        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Live queue length:</span>
                          <span className="font-bold text-slate-900 dark:text-white font-mono">
                            {waitingCount} waiting
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority Category */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  3. Priority Category / Triage
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriority('standard')}
                    className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                      priority === 'standard'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('senior')}
                    className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                      priority === 'senior'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Senior (60+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('differently_abled')}
                    className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                      priority === 'differently_abled'
                        ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Diff. Abled ♿
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('emergency')}
                    className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                      priority === 'emergency'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Emergency 🚨
                  </button>
                </div>
              </div>

              {/* Citizen Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Your Name (Optional / Guest Mode)
                  </label>
                  <input
                    type="text"
                    value={citizenName}
                    onChange={e => setCitizenName(e.target.value)}
                    placeholder="e.g. Rameshwar Lal"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number (For Turn SMS)
                  </label>
                  <input
                    type="tel"
                    value={citizenPhone}
                    onChange={e => setCitizenPhone(e.target.value)}
                    placeholder="e.g. 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-sky-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-sky-500/25 transition-transform active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Generate Instant Queue Pass</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </form>

          </div>
        </div>

        {/* Right 1 Col: Live Service Counters & Info */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Live Counter Status
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </div>

            <div className="space-y-2.5">
              {currentOrg.counters.map(counter => (
                <div
                  key={counter.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {counter.name}
                    </span>
                    <p className="text-[10px] text-slate-400">
                      Staff: {counter.currentStaffName || 'Assigned Officer'}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">
                    ONLINE
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Shield className="w-4 h-4 text-indigo-500" />
                <span>Fair Queue Guarantee</span>
              </div>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
                Tokens are processed strictly in transparent chronological and prioritized order. No queue jumping.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* 4. PERSISTENT MOBILE STICKY NAVIGATION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 px-4 py-2 pb-[max(0.65rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-2">
          
          <button
            onClick={() => {
              setMobileTab('status');
              if (activeCitizenToken) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                showToast('No active token. Generate a pass below.', 'info');
              }
            }}
            className={`py-2.5 px-3 rounded-2xl flex flex-col items-center justify-center min-h-[50px] transition-all ${
              mobileTab === 'status' && activeCitizenToken
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black shadow-lg shadow-sky-500/30 ring-2 ring-sky-400/50'
                : 'bg-slate-900 border border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span>Token Status</span>
              {activeCitizenToken && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {activeCitizenToken ? `${activeCitizenToken.tokenNumber} • ${turnStatus.turnBadge}` : 'No active pass'}
            </span>
          </button>

          <button
            onClick={() => {
              setMobileTab('booking');
              const el = document.getElementById('booking-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`py-2.5 px-3 rounded-2xl flex flex-col items-center justify-center min-h-[50px] transition-all ${
              mobileTab === 'booking'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black shadow-lg shadow-sky-500/30 ring-2 ring-sky-400/50'
                : 'bg-slate-900 border border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>New Booking</span>
            </div>
            <span className="text-[10px] text-slate-400">1-Step Queue Pass</span>
          </button>

        </div>
      </div>

    </div>
  );
};
