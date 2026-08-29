import React, { useState, useEffect } from 'react';
import { useQueue } from '../../context/QueueContext';
import { QueueToken } from '../../types';
import {
  ShieldCheck,
  PhoneCall,
  CheckCircle2,
  Clock,
  Volume2,
  PauseCircle,
  XCircle,
  ArrowRightLeft,
  Users,
  ChevronRight,
  Sparkles,
  Smartphone,
  Printer,
  AlertCircle,
  FastForward,
  RotateCcw,
  UserCheck,
  Timer
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const StaffDashboard: React.FC = () => {
  const {
    currentOrg,
    tokens,
    callNext,
    skipAndCallNext,
    startService,
    requeueToken,
    completeService,
    holdToken,
    markNoShow,
    transferToken,
    playVoiceChime,
    showToast,
    updateOrganization
  } = useQueue();

  const [selectedCounterId, setSelectedCounterId] = useState<string>(
    currentOrg.counters[0]?.id || ''
  );
  const [transferModalToken, setTransferModalToken] = useState<QueueToken | null>(null);
  const [targetDeptId, setTargetDeptId] = useState<string>('');
  const [targetServiceId, setTargetServiceId] = useState<string>('');
  const [serviceTimerSeconds, setServiceTimerSeconds] = useState(0);
  const [responseTimerSeconds, setResponseTimerSeconds] = useState(0);

  const selectedCounter = currentOrg.counters.find(c => c.id === selectedCounterId) || currentOrg.counters[0];

  // Find token currently CALLED or IN_SERVICE at this counter
  const currentActiveToken = tokens.find(
    t => (t.counterId === selectedCounter?.id || t.assignedCounterId === selectedCounter?.id) &&
         (t.status === 'CALLED' || t.status === 'IN_SERVICE')
  );

  // Eligible waiting tokens for this counter
  const waitingTokens = tokens.filter(t => {
    if (t.status !== 'WAITING') return false;
    if (selectedCounter?.isFlexCounter) return true;
    return selectedCounter?.serviceIds.includes(t.serviceId);
  });

  // Held and Temporarily Skipped tokens
  const heldTokens = tokens.filter(t => t.status === 'ON_HOLD');

  // Completed today
  const completedToday = tokens.filter(t => t.status === 'COMPLETED');

  // Configured response window for citizen arrival
  const responseWindowSeconds = currentOrg.rules.responseWindowSeconds || 30;

  // Elapsed timer for active consultation
  useEffect(() => {
    let interval: any = null;
    if (currentActiveToken && currentActiveToken.status === 'IN_SERVICE') {
      interval = setInterval(() => {
        setServiceTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setServiceTimerSeconds(0);
    }
    return () => clearInterval(interval);
  }, [currentActiveToken?.id, currentActiveToken?.status]);

  // Response countdown timer for CALLED state
  useEffect(() => {
    let interval: any = null;
    if (currentActiveToken && currentActiveToken.status === 'CALLED') {
      const calledAtTime = currentActiveToken.calledAt ? new Date(currentActiveToken.calledAt).getTime() : Date.now();
      const calculateRemaining = () => {
        const elapsed = Math.floor((Date.now() - calledAtTime) / 1000);
        return Math.max(0, responseWindowSeconds - elapsed);
      };

      setResponseTimerSeconds(calculateRemaining());
      interval = setInterval(() => {
        setResponseTimerSeconds(calculateRemaining());
      }, 1000);
    } else {
      setResponseTimerSeconds(0);
    }
    return () => clearInterval(interval);
  }, [currentActiveToken?.id, currentActiveToken?.status, currentActiveToken?.calledAt, responseWindowSeconds]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCallNext = async () => {
    if (!selectedCounter) return;
    const res = await callNext(selectedCounter.id);
    if (res.success && res.token) {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    }
  };

  const handleSmartSkip = async () => {
    if (!selectedCounter) return;
    const res = await skipAndCallNext(selectedCounter.id, currentActiveToken?.id);
    if (res.success && res.token) {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    }
  };

  const handleStartService = () => {
    if (!currentActiveToken) return;
    startService(currentActiveToken.id);
  };

  const handleRepeatChime = () => {
    if (!currentActiveToken || !selectedCounter) return;
    playVoiceChime(
      `Token ${currentActiveToken.tokenNumber}, please proceed to Counter ${selectedCounter.number}.`
    );
    showToast(`Voice chime repeated for ${currentActiveToken.tokenNumber}`, 'info');
  };

  const handleComplete = () => {
    if (!currentActiveToken) return;
    completeService(currentActiveToken.id);
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.5 } });
  };

  const handleExecuteTransfer = () => {
    if (!transferModalToken || !targetServiceId || !targetDeptId) return;
    transferToken(transferModalToken.id, targetServiceId);
    setTransferModalToken(null);
  };

  const handleUpdateResponseWindow = (seconds: number) => {
    updateOrganization(currentOrg.id, {
      rules: {
        ...currentOrg.rules,
        responseWindowSeconds: seconds
      }
    });
    showToast(`Citizen response window updated to ${seconds} seconds`, 'info');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 pb-20">
      
      {/* Header & Counter Selector Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Staff Counter Console
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">
                LIVE TERMINAL
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {currentOrg.name} • Operational Dispatch & Smart Skip
            </p>
          </div>
        </div>

        {/* Counter & Response Window Switchers */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              Operating Counter:
            </label>
            <select
              value={selectedCounterId}
              onChange={e => setSelectedCounterId(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {currentOrg.counters.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.currentStaffName || 'Staff'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <Timer className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Window:</span>
            <select
              value={responseWindowSeconds}
              onChange={e => handleUpdateResponseWindow(Number(e.target.value))}
              className="bg-transparent font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs outline-none cursor-pointer"
            >
              <option value={15}>15s</option>
              <option value={30}>30s</option>
              <option value={45}>45s</option>
              <option value={60}>60s</option>
            </select>
          </div>
        </div>
      </div>

      {/* Primary Grid: Active Serving Box & Queue Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Currently Active Consultation Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${currentActiveToken?.status === 'IN_SERVICE' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-pulse'}`}></span>
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-indigo-300">
                  {selectedCounter?.name} • {currentActiveToken ? (currentActiveToken.status === 'IN_SERVICE' ? 'Active Consultation' : 'Calling Citizen') : 'Ready For Dispatch'}
                </span>
              </div>
              
              {currentActiveToken && (
                <div className="flex items-center gap-2 font-mono text-xs bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>
                    {currentActiveToken.status === 'IN_SERVICE'
                      ? `Session Elapsed: ${formatTimer(serviceTimerSeconds)}`
                      : `Response Window: ${responseTimerSeconds}s remaining`}
                  </span>
                </div>
              )}
            </div>

            {currentActiveToken ? (
              <div className="space-y-6 animate-in fade-in">
                
                {/* Calling vs In-Service Banner */}
                {currentActiveToken.status === 'CALLED' && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-amber-400 animate-bounce" />
                      <span className="font-bold">
                        Awaiting citizen response. {responseTimerSeconds === 0 ? 'Window expired — Smart Skip or Recall recommended.' : `Response window active (${responseTimerSeconds}s).`}
                      </span>
                    </div>
                    {responseTimerSeconds === 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] uppercase">
                        Window Expired
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-4xl sm:text-6xl font-black tracking-tight text-white">
                      {currentActiveToken.tokenNumber}
                    </span>
                    <p className="text-sm font-bold text-indigo-200">
                      {currentActiveToken.citizenName} • {currentActiveToken.serviceName}
                    </p>
                    <p className="text-xs text-slate-400">
                      Department: {currentActiveToken.deptName} • Channel: {currentActiveToken.type}
                    </p>
                  </div>

                  <div className="flex flex-col items-start sm:items-end gap-2">
                    <span className="px-3.5 py-1.5 rounded-full bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider">
                      Priority: {currentActiveToken.priority}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Issued: {new Date(currentActiveToken.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  
                  {currentActiveToken.status === 'CALLED' ? (
                    <>
                      <button
                        onClick={handleStartService}
                        className="py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/25"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Start Consultation</span>
                      </button>

                      <button
                        onClick={handleSmartSkip}
                        className="py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-lg shadow-amber-500/25"
                        title="Move to temporary hold without canceling and call next waiting citizen"
                      >
                        <FastForward className="w-4 h-4" />
                        <span>Smart Skip & Next</span>
                      </button>

                      <button
                        onClick={handleRepeatChime}
                        className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                      >
                        <Volume2 className="w-4 h-4 text-sky-400" />
                        <span>Repeat Chime</span>
                      </button>

                      <button
                        onClick={() => holdToken(currentActiveToken.id)}
                        className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                      >
                        <PauseCircle className="w-4 h-4" />
                        <span>Place on Hold</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleComplete}
                        className="py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/25"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Complete Turn</span>
                      </button>

                      <button
                        onClick={() => setTransferModalToken(currentActiveToken)}
                        className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                        <span>Transfer Token</span>
                      </button>

                      <button
                        onClick={() => holdToken(currentActiveToken.id)}
                        className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                      >
                        <PauseCircle className="w-4 h-4" />
                        <span>Place on Hold</span>
                      </button>

                      <button
                        onClick={() => markNoShow(currentActiveToken.id)}
                        className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Mark No-Show</span>
                      </button>
                    </>
                  )}

                </div>
              </div>
            ) : (
              <div className="py-10 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">Counter is Ready</h3>
                  <p className="text-xs text-slate-400">
                    {waitingTokens.length} citizens are currently waiting in line for this counter.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={handleCallNext}
                    disabled={waitingTokens.length === 0}
                    className="py-4 px-8 rounded-2xl bg-gradient-to-r from-sky-400 via-indigo-500 to-sky-400 hover:from-sky-300 hover:to-indigo-400 text-slate-950 font-black text-sm transition-transform active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-xl shadow-indigo-500/30 cursor-pointer inline-flex items-center gap-2"
                  >
                    <PhoneCall className="w-4 h-4 fill-current" />
                    <span>Call Next Token in Queue</span>
                  </button>

                  {heldTokens.length > 0 && (
                    <button
                      onClick={handleSmartSkip}
                      className="py-4 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs transition-colors border border-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <FastForward className="w-4 h-4" />
                      <span>Smart Triage Next</span>
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Waiting Tokens Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Live Queue Waiting Line ({waitingTokens.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ordered by priority category & deterministic arrival time
                </p>
              </div>
            </div>

            {waitingTokens.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No citizens currently waiting in this service queue.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="pb-3">Token #</th>
                      <th className="pb-3">Citizen</th>
                      <th className="pb-3">Service</th>
                      <th className="pb-3">Priority</th>
                      <th className="pb-3">Lobby Status</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {waitingTokens.map(token => (
                      <tr key={token.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 font-black text-slate-900 dark:text-white font-mono">
                          {token.tokenNumber}
                        </td>
                        <td className="py-3 text-slate-700 dark:text-slate-300">
                          {token.citizenName}
                        </td>
                        <td className="py-3 text-slate-500 dark:text-slate-400">
                          {token.serviceName}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            token.priority === 'emergency' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                            token.priority === 'differently_abled' ? 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300' :
                            token.priority === 'senior' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' :
                            'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {token.priority}
                          </span>
                        </td>
                        <td className="py-3">
                          {token.checkInStatus === 'CHECKED_IN_ENTRANCE' ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Present in Lobby
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">En Route</span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => {
                              callNext(selectedCounter.id);
                            }}
                            className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors cursor-pointer"
                          >
                            Call Direct
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right 1 Col: Held Tokens & Operations Stats */}
        <div className="space-y-6">
          
          {/* Held / Skipped Tokens Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Held & Re-Queue List ({heldTokens.length})
                </h3>
                <p className="text-[10px] text-slate-400">
                  Temporarily skipped or paused tokens
                </p>
              </div>
              <PauseCircle className="w-4 h-4 text-amber-500" />
            </div>

            {heldTokens.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No tokens currently on hold or re-queue list.</p>
            ) : (
              <div className="space-y-2.5">
                {heldTokens.map(token => (
                  <div
                    key={token.id}
                    className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs font-mono text-amber-900 dark:text-amber-200">
                            {token.tokenNumber}
                          </span>
                          {token.isTemporarilySkipped && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-[9px] font-bold">
                              Skipped #{token.skipCount || 1}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-amber-700 dark:text-amber-300">
                          {token.citizenName} • {token.serviceName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-amber-200/60 dark:border-amber-900/40">
                      <button
                        onClick={() => callNext(selectedCounter.id)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-colors cursor-pointer"
                        title="Recall directly to this counter"
                      >
                        Recall Now
                      </button>

                      <button
                        onClick={() => requeueToken(token.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                        title="Return token to active waiting line at back of queue"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Re-Queue</span>
                      </button>

                      <button
                        onClick={() => markNoShow(token.id)}
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950 transition-colors"
                        title="Mark No-Show"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Counter Stats */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Shift Productivity
            </h3>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Served Today</span>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {completedToday.length}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Smart Skips</span>
                <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {heldTokens.filter(t => t.isTemporarilySkipped).length}
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Transfer Token Modal */}
      {transferModalToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 max-w-md w-full space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Transfer Token {transferModalToken.tokenNumber}
            </h3>
            <p className="text-xs text-slate-500">
              Route this citizen to a secondary department or counter without losing queue priority.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Destination Department
                </label>
                <select
                  value={targetDeptId}
                  onChange={e => {
                    setTargetDeptId(e.target.value);
                    const d = currentOrg.departments.find(dept => dept.id === e.target.value);
                    setTargetServiceId(d?.services[0]?.id || '');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                >
                  <option value="">Select Department...</option>
                  {currentOrg.departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Destination Service
                </label>
                <select
                  value={targetServiceId}
                  onChange={e => setTargetServiceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                >
                  <option value="">Select Service...</option>
                  {currentOrg.departments.find(d => d.id === targetDeptId)?.services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setTransferModalToken(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteTransfer}
                disabled={!targetServiceId}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs disabled:opacity-30 cursor-pointer"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
