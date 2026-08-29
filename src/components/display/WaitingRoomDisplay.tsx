import React, { useState, useEffect } from 'react';
import { useQueue } from '../../context/QueueContext';
import {
  Tv,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sparkles,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';

export const WaitingRoomDisplay: React.FC = () => {
  const {
    currentOrg,
    tokens,
    playVoiceChime,
    language,
    showToast
  } = useQueue();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(err => console.error(err));
      setIsFullscreen(false);
    }
  };

  // Called / Serving tokens
  const activeServing = tokens.filter(t => t.status === 'CALLED' || t.status === 'IN_SERVICE');
  
  // Next 8 waiting tokens
  const upcomingQueue = tokens.filter(t => t.status === 'WAITING').slice(0, 8);

  // Recently completed 4 tokens
  const recentlyServed = tokens.filter(t => t.status === 'COMPLETED').slice(-4);

  return (
    <div className={`min-h-screen bg-slate-950 text-white font-sans ${isFullscreen ? 'p-4 sm:p-8' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'}`}>
      
      {/* Top TV Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{currentOrg.name}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Waiting Hall Live Display • Privacy Masked Feed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-center">
            <span className="text-lg font-black text-white">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <p className="text-[10px] text-slate-400">
              {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>

          <button
            onClick={() => {
              setAudioEnabled(!audioEnabled);
              showToast(audioEnabled ? 'Display audio muted.' : 'Voice announcements enabled.', 'info');
            }}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Toggle Voice Announcements"
          >
            {audioEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-rose-400" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Toggle Fullscreen TV Mode"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5 text-sky-400" />}
          </button>
        </div>
      </div>

      {/* Main TV Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
        
        {/* Left 2 Cols: NOW SERVING COUNTERS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-lg font-black text-white uppercase tracking-wider">
                Now Calling / Active Counters
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Report immediately when your token flashes
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentOrg.counters.map(counter => {
              const active = tokens.find(
                t => t.assignedCounterId === counter.id && (t.status === 'CALLED' || t.status === 'IN_SERVICE')
              );

              return (
                <div
                  key={counter.id}
                  className={`p-6 rounded-3xl border transition-all relative overflow-hidden ${
                    active?.status === 'CALLED'
                      ? 'bg-gradient-to-br from-emerald-950/80 via-slate-900 to-emerald-950/60 border-emerald-500 ring-4 ring-emerald-500/20 shadow-2xl animate-pulse'
                      : active?.status === 'IN_SERVICE'
                      ? 'bg-slate-900/90 border-sky-500/60 shadow-lg'
                      : 'bg-slate-900/40 border-slate-800/80 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-mono uppercase tracking-wider font-bold text-sky-400">
                      {counter.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                      active ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {active?.status || 'AVAILABLE'}
                    </span>
                  </div>

                  <div className="py-6 text-center space-y-2">
                    {active ? (
                      <>
                        <div className="text-4xl sm:text-6xl font-black font-mono tracking-tight text-white">
                          {active.tokenNumber}
                        </div>
                        <p className="text-xs font-bold text-slate-300">
                          {active.serviceName}
                        </p>
                        <span className="inline-block text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 uppercase">
                          Priority: {active.priority}
                        </span>
                      </>
                    ) : (
                      <div className="py-6 text-slate-500 text-sm font-mono">
                        --- Awaiting Next Turn ---
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Staff: {counter.currentStaffName || 'Officer'}</span>
                    <span className="text-emerald-400 font-mono">Counter #{counter.number}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Broadcast Ticker */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3 overflow-hidden text-xs text-slate-300">
            <span className="px-2.5 py-1 rounded-lg bg-sky-500 text-slate-950 font-bold text-[10px] uppercase shrink-0">
              Advisory
            </span>
            <div className="truncate text-slate-400">
              Please have your physical documents or mobile verification ready when proceeding to your designated counter.
            </div>
          </div>
        </div>

        {/* Right 1 Col: UPCOMING TOKENS */}
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>Next in Line ({upcomingQueue.length})</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Deterministic</span>
            </div>

            {upcomingQueue.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No upcoming tokens waiting.</p>
            ) : (
              <div className="space-y-2">
                {upcomingQueue.map((t, idx) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center font-mono text-xs font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="text-sm font-black font-mono text-white">
                          {t.tokenNumber}
                        </span>
                        <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                          {t.serviceName}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                        idx === 0 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse' 
                          : idx <= 2 
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {idx === 0 ? 'Next Turn' : idx <= 2 ? 'Approaching' : `Turn #${idx + 1}`}
                      </span>
                      <p className="text-[10px] text-slate-500 uppercase mt-0.5">{t.priority}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Privacy Note */}
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-[11px] text-slate-500 space-y-1">
            <p className="font-bold text-slate-400">🛡️ Public Display Privacy Standard</p>
            <p>Citizen phone numbers and private credentials are never displayed on public waiting displays.</p>
          </div>
        </div>

      </div>

    </div>
  );
};
