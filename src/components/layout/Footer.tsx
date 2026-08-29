import React from 'react';
import { Layers, ShieldCheck, HeartHandshake, FileText, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  onOpenPrivacyModal: () => void;
  onOpenHandoverModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenPrivacyModal,
  onOpenHandoverModal
}) => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Platform identity */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-base font-black text-white tracking-tight">
                Queue<span className="text-sky-400">Less</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-800">
                v2.4 Universal
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              An intelligent queue orchestration platform designed for public-service delivery across hospitals, government civic centres, banks, and academic institutions.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Single Unified Queue
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Physical Kiosk & Digital Web
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Privacy-First Architecture
              </span>
            </div>
          </div>

          {/* Col 2: Deployment & Compliance */}
          <div className="space-y-2.5">
            <p className="font-bold text-white uppercase tracking-wider text-[11px]">
              Compliance & Specs
            </p>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={onOpenPrivacyModal}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                  <span>Privacy-By-Design Policy</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenHandoverModal}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Zero-Infra Handover Guide</span>
                </button>
              </li>
              <li className="text-[11px] text-slate-400">
                Data Minimization: No permanent PII storage in browser storage.
              </li>
            </ul>
          </div>

          {/* Col 3: Target Deployments */}
          <div className="space-y-2.5">
            <p className="font-bold text-white uppercase tracking-wider text-[11px]">
              Universal Deployments
            </p>
            <ul className="space-y-1.5 text-[11px]">
              <li className="text-slate-400">🏥 Hospitals & Diagnostic Centres</li>
              <li className="text-slate-400">🏛️ Transport & Civic Municipalities</li>
              <li className="text-slate-400">🏦 Banking & Financial Branches</li>
              <li className="text-slate-400">🎓 Universities & Colleges</li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>© 2026 QueueLess Universal Platform. Built for Smart India Hackathon & Open Governance.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              100% Operational MVP
            </span>
            <span>WCAG 2.1 AA Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
