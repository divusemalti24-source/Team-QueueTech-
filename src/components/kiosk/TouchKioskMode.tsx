import React, { useState } from 'react';
import { useQueue } from '../../context/QueueContext';
import { PriorityCategory } from '../../types';
import {
  Touchpad,
  Globe,
  Printer,
  CheckCircle2,
  Users,
  ArrowLeft,
  Activity,
  Heart,
  Building2,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TouchKioskModeProps {
  onOpenReceiptModal: (token: any) => void;
}

export const TouchKioskMode: React.FC<TouchKioskModeProps> = ({ onOpenReceiptModal }) => {
  const {
    currentOrg,
    joinQueue,
    language,
    setLanguage,
    tokens
  } = useQueue();

  const [step, setStep] = useState<'SELECT_DEPT' | 'SELECT_SERVICE' | 'SELECT_PRIORITY' | 'CONFIRMED'>('SELECT_DEPT');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [generatedToken, setGeneratedToken] = useState<any>(null);

  const activeDept = currentOrg.departments.find(d => d.id === selectedDeptId);
  const activeService = activeDept?.services.find(s => s.id === selectedServiceId);

  const handleSelectDept = (deptId: string) => {
    setSelectedDeptId(deptId);
    setStep('SELECT_SERVICE');
  };

  const handleSelectService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setStep('SELECT_PRIORITY');
  };

  const handleSelectPriority = (priority: PriorityCategory) => {
    if (!selectedServiceId) return;

    const token = joinQueue({
      serviceId: selectedServiceId,
      citizenName: 'Physical Kiosk Citizen',
      priority,
      type: 'PHYSICAL_KIOSK'
    });

    setGeneratedToken(token);
    setStep('CONFIRMED');
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
  };

  const handleReset = () => {
    setStep('SELECT_DEPT');
    setSelectedDeptId('');
    setSelectedServiceId('');
    setGeneratedToken(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      
      {/* Kiosk Header */}
      <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Touchpad className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {currentOrg.name} • Self-Service Kiosk
            </h1>
            <p className="text-xs text-slate-400">
              {language === 'hi' ? 'स्पर्श स्क्रीन से 10 सेकंड में टोकन प्राप्त करें' : 'Touchscreen Self-Ticketing Terminal'}
            </p>
          </div>
        </div>

        {/* Big Language Switcher for Kiosk Accessibility */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
          className="px-5 py-3 rounded-2xl bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-black text-sm flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
        >
          <Globe className="w-4 h-4 text-sky-400" />
          <span>{language === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}</span>
        </button>
      </div>

      {/* Main Kiosk Step Container */}
      <div className="bg-slate-800/50 rounded-3xl p-6 sm:p-10 border border-slate-700 shadow-2xl min-h-[480px] flex flex-col justify-between">
        
        {/* STEP 1: SELECT DEPARTMENT */}
        {step === 'SELECT_DEPT' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="text-center space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-sky-400 font-bold">
                Step 1 of 3
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {language === 'hi' ? 'कृपया अपना विभाग चुनें' : 'Please Select Department'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {currentOrg.departments.map(dept => (
                <button
                  key={dept.id}
                  onClick={() => handleSelectDept(dept.id)}
                  className="p-6 rounded-3xl bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-sky-500 text-left transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-lg group"
                >
                  <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-sky-400 transition-colors">
                    {language === 'hi' ? dept.nameHi : dept.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {dept.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs text-sky-400 font-bold">
                    <span>{dept.services.length} services</span>
                    <span>Touch to select →</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: SELECT SERVICE */}
        {step === 'SELECT_SERVICE' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep('SELECT_DEPT')}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <span className="text-xs font-mono text-sky-400 font-bold">
                Step 2 of 3 • {language === 'hi' ? activeDept?.nameHi : activeDept?.name}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white text-center">
              {language === 'hi' ? 'सेवा चुनें' : 'Select Required Service'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {activeDept?.services.map(srv => {
                const waiting = tokens.filter(t => t.serviceId === srv.id && t.status === 'WAITING').length;

                return (
                  <button
                    key={srv.id}
                    onClick={() => handleSelectService(srv.id)}
                    className="p-6 rounded-3xl bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-indigo-500 text-left transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono font-bold text-xs border border-indigo-500/30">
                        {srv.code}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {waiting} waiting
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-white mt-3">
                      {language === 'hi' ? srv.nameHi : srv.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {srv.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: SELECT PRIORITY */}
        {step === 'SELECT_PRIORITY' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep('SELECT_SERVICE')}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <span className="text-xs font-mono text-sky-400 font-bold">
                Step 3 of 3 • Category
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white text-center">
              {language === 'hi' ? 'श्रेणी चुनें' : 'Choose Passenger / Citizen Category'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <button
                onClick={() => handleSelectPriority('standard')}
                className="p-6 rounded-3xl bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-sky-500 text-left transition-all active:scale-95 cursor-pointer"
              >
                <h4 className="text-lg font-black text-white">General / Standard</h4>
                <p className="text-xs text-slate-400 mt-1">Regular service queue</p>
              </button>

              <button
                onClick={() => handleSelectPriority('senior')}
                className="p-6 rounded-3xl bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-indigo-500 text-left transition-all active:scale-95 cursor-pointer"
              >
                <h4 className="text-lg font-black text-white">Senior Citizen (60+)</h4>
                <p className="text-xs text-slate-400 mt-1">Elderly priority triage</p>
              </button>

              <button
                onClick={() => handleSelectPriority('differently_abled')}
                className="p-6 rounded-3xl bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-violet-500 text-left transition-all active:scale-95 cursor-pointer"
              >
                <h4 className="text-lg font-black text-white">Differently Abled ♿</h4>
                <p className="text-xs text-slate-400 mt-1">Accessible assisted triage</p>
              </button>

              <button
                onClick={() => handleSelectPriority('emergency')}
                className="p-6 rounded-3xl bg-rose-950/60 hover:bg-rose-900/80 border-2 border-rose-600 text-left transition-all active:scale-95 cursor-pointer"
              >
                <h4 className="text-lg font-black text-white">Emergency Triage 🚨</h4>
                <p className="text-xs text-rose-200 mt-1">Immediate intervention queue</p>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: CONFIRMATION & TICKET PRINT */}
        {step === 'CONFIRMED' && generatedToken && (
          <div className="space-y-6 text-center animate-in fade-in zoom-in-95 py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                Ticket Issued Successfully
              </span>
              <div className="text-5xl sm:text-7xl font-black font-mono tracking-tight text-white py-2">
                {generatedToken.tokenNumber}
              </div>
              <p className="text-sm font-bold text-slate-300">
                {generatedToken.serviceName} • {generatedToken.deptName}
              </p>
            </div>

            <div className="max-w-xs mx-auto p-4 rounded-2xl bg-slate-900 border border-slate-700 text-xs text-slate-400 space-y-1">
              <p>Queue Position: <strong className="text-white">Confirmed & Registered</strong></p>
              <p>Please take your printed ticket below and watch the Waiting Hall display.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={() => onOpenReceiptModal(generatedToken)}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25"
              >
                <Printer className="w-5 h-5" />
                <span>View / Print Thermal Slip</span>
              </button>

              <button
                onClick={handleReset}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm cursor-pointer"
              >
                Issue Next Ticket
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
