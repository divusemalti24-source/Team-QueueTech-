import React, { useState } from 'react';
import { useQueue } from '../../context/QueueContext';
import {
  X,
  PlayCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Users,
  ShieldCheck,
  Tv,
  Touchpad,
  BarChart3,
  Volume2,
  Zap,
  Activity
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface JudgeDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JudgeDemoModal: React.FC<JudgeDemoModalProps> = ({ isOpen, onClose }) => {
  const {
    currentOrg,
    switchOrganization,
    joinQueue,
    callNext,
    completeService,
    tokens,
    setCurrentView,
    playVoiceChime,
    showToast
  } = useQueue();

  const [activeStep, setActiveStep] = useState(1);

  if (!isOpen) return null;

  const DEMO_STEPS = [
    {
      step: 1,
      title: 'Problem & Value Proposition (0:00 - 0:30)',
      desc: 'Physical queues waste millions of human hours and create lobby congestion. QueueLess unifies digital mobile booking and physical thermal kiosks into one central queue engine.',
      actionLabel: '1. View Citizen Booking Experience',
      onRun: () => {
        setCurrentView('citizen');
        showToast('Navigated to Citizen Portal.', 'info');
      }
    },
    {
      step: 2,
      title: 'Generate Live Digital Token (0:30 - 1:00)',
      desc: 'Citizen joins queue remotely in 1 step. System calculates deterministic wait time (People ahead × Avg service time) and issues Staggered Arrival Window.',
      actionLabel: '2. Generate Instant Live Token (Pooja)',
      onRun: () => {
        const srv = currentOrg.departments[0]?.services[0];
        if (srv) {
          const tok = joinQueue({
            serviceId: srv.id,
            citizenName: 'Pooja Sundaram (Judge Demo)',
            citizenPhone: '9811223344',
            priority: 'standard',
            type: 'DIGITAL'
          });
          setCurrentView('citizen');
          showToast(`Generated Token ${tok.tokenNumber} for Citizen Portal!`, 'success');
        }
      }
    },
    {
      step: 3,
      title: 'Entrance QR Check-In & Physical Kiosk (1:00 - 1:30)',
      desc: 'Equal access for all citizens: Non-smartphone users get printed thermal tickets at touchscreen kiosk. Digital users verify arrival via Entrance QR pod.',
      actionLabel: '3. Test Touch Kiosk Terminal',
      onRun: () => {
        setCurrentView('kiosk');
        showToast('Switched to Touch Kiosk Mode.', 'info');
      }
    },
    {
      step: 4,
      title: 'Staff Operational Console & Call Next (1:30 - 2:00)',
      desc: 'Officer clicks "Call Next". The queue engine triages by priority weight, assigns the counter, and triggers real-time audio calling in English & Hindi.',
      actionLabel: '4. Staff Console: Call Next Token',
      onRun: () => {
        setCurrentView('staff');
        const counter = currentOrg.counters[0];
        if (counter) {
          const called = callNext(counter.id);
          if (called) {
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
          }
        }
      }
    },
    {
      step: 5,
      title: 'Fullscreen Waiting TV & Voice Announcement (2:00 - 2:30)',
      desc: 'Waiting room TV display flashes with high-contrast active counter cards while speech synthesizer speaks the bilingual announcement.',
      actionLabel: '5. View Waiting Room TV Display',
      onRun: () => {
        setCurrentView('display');
        playVoiceChime(`Token ${tokens[0]?.tokenNumber || 'MED-101'}, please proceed to Counter 1.`);
        showToast('Switched to Fullscreen Waiting TV with audio chime.', 'info');
      }
    },
    {
      step: 6,
      title: 'Complete Service & Real-Time Analytics (2:30 - 3:00)',
      desc: 'Staff marks service complete. Real-time counter throughput, average wait times, and privacy audit trails update instantly.',
      actionLabel: '6. Complete Service & View Admin Hub',
      onRun: () => {
        const calledToken = tokens.find(t => t.status === 'CALLED' || t.status === 'IN_SERVICE');
        if (calledToken) {
          completeService(calledToken.id);
        }
        setCurrentView('admin');
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
        showToast('Service completed! Viewing Admin Analytics & Impact Hub.', 'success');
      }
    }
  ];

  const currentStepData = DEMO_STEPS.find(s => s.step === activeStep) || DEMO_STEPS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center text-slate-950 shadow-md shadow-orange-500/20">
              <PlayCircle className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  3-Minute SIH Presentation Tour
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono text-[10px] font-bold">
                  Step {activeStep} of 6
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Execute the end-to-end killer demo live for hackathon evaluators
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Pills */}
        <div className="grid grid-cols-6 gap-1.5">
          {DEMO_STEPS.map(s => (
            <button
              key={s.step}
              onClick={() => setActiveStep(s.step)}
              className={`h-2 rounded-full transition-all ${
                s.step === activeStep
                  ? 'bg-amber-500 ring-2 ring-amber-400/40'
                  : s.step < activeStep
                  ? 'bg-emerald-500'
                  : 'bg-slate-200 dark:bg-slate-800'
              }`}
              title={s.title}
            />
          ))}
        </div>

        {/* Active Step Content Card */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-600 dark:text-amber-400">
              Pitch Segment #{currentStepData.step}
            </span>
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              {currentStepData.title}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
              {currentStepData.desc}
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                currentStepData.onRun();
                if (activeStep < DEMO_STEPS.length) {
                  setActiveStep(activeStep + 1);
                }
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-transform active:scale-[0.98] cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{currentStepData.actionLabel} & Next</span>
            </button>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <button
            disabled={activeStep === 1}
            onClick={() => setActiveStep(activeStep - 1)}
            className="px-3 py-2 rounded-xl font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Previous Step
          </button>

          <span className="text-slate-400 text-[11px]">
            Target: {currentOrg.name}
          </span>

          <button
            disabled={activeStep === DEMO_STEPS.length}
            onClick={() => setActiveStep(activeStep + 1)}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <span>Next Step</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
