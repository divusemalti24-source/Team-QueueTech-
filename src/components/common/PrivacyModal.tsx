import React from 'react';
import { X, ShieldCheck, Lock, EyeOff, Database, CheckCircle2, Trash2 } from 'lucide-react';
import { useQueue } from '../../context/QueueContext';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useQueue();

  if (!isOpen) return null;

  const handleClearPersonalData = () => {
    try {
      localStorage.removeItem('queueless_active_token_v2');
      localStorage.removeItem('queueless_user_v2');
      showToast('Local personal data cleared from this device.', 'success');
      onClose();
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Privacy-By-Design Architecture
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data minimization & privacy policy
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

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-1">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-xs">
              <EyeOff className="w-4 h-4" />
              <span>Masked Public Displays</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Waiting room TV displays never expose phone numbers or personal identifiers—only anonymous token codes (e.g. MED-101).
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-1">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              <Database className="w-4 h-4" />
              <span>Data Minimization</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Only minimum operational fields required for dispatching queue turns are processed. No demographic surveillance.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-1">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
              <Lock className="w-4 h-4" />
              <span>Tenant Data Isolation</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Each organization's queues, staff logs, and metrics are isolated. Organization A cannot access Organization B's tokens.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-1">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Guest & Anonymous Option</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Citizens can join public queues as anonymous guests without mandating persistent account creation.
            </p>
          </div>
        </div>

        {/* User Right to Erasure */}
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-3">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs">
            <Trash2 className="w-4 h-4" />
            <span>Right to Erasure (Clear Local Session)</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            You can instantly purge all active token identifiers and session cache stored in this browser session with 1 click.
          </p>
          <button
            onClick={handleClearPersonalData}
            className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Purge My Local Token Cache
          </button>
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Privacy Policy
          </button>
        </div>

      </div>
    </div>
  );
};
