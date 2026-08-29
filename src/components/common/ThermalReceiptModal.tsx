import React, { useEffect, useRef } from 'react';
import { QueueToken, Organization } from '../../types';
import { X, Printer, CheckCircle2, QrCode } from 'lucide-react';
import QRCode from 'qrcode';

interface ThermalReceiptModalProps {
  token: QueueToken | null;
  org: Organization;
  isOpen: boolean;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  token,
  org,
  isOpen,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (isOpen && token && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        JSON.stringify({
          tokenId: token.id,
          tokenNumber: token.tokenNumber,
          orgId: token.orgId,
          serviceId: token.serviceId
        }),
        { width: 120, margin: 1 }
      ).catch(err => console.error(err));
    }
  }, [isOpen, token]);

  if (!isOpen || !token) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 relative border border-slate-200">
        
        {/* Actions Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Printer className="w-4 h-4 text-sky-600" />
            <span>Thermal Paper Slip</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Realistic Thermal Receipt Slip */}
        <div className="bg-[#fafaf9] p-5 rounded-2xl border-2 border-dashed border-slate-300 font-mono text-slate-800 text-center space-y-3 shadow-inner">
          <div className="space-y-0.5">
            <h4 className="font-extrabold text-sm uppercase tracking-tight text-slate-950">
              {org.name}
            </h4>
            <p className="text-[10px] text-slate-500">{org.tagline}</p>
          </div>

          <div className="border-t border-b border-dashed border-slate-400 py-3 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              Your Queue Token
            </span>
            <div className="text-3xl font-black text-slate-950 tracking-wider">
              {token.tokenNumber}
            </div>
            <div className="text-xs font-bold text-sky-700">
              {token.serviceName}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-left text-[11px] py-1 border-b border-dashed border-slate-400">
            <div>
              <span className="text-[9px] text-slate-400 uppercase">Department:</span>
              <p className="font-bold truncate">{token.deptName}</p>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase">Issued Time:</span>
              <p className="font-bold">{new Date(token.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase">Priority:</span>
              <p className="font-bold uppercase text-indigo-700">{token.priority}</p>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase">Turn Mode:</span>
              <p className="font-bold text-sky-700">Live Turn Call</p>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center pt-1 space-y-1">
            <canvas ref={canvasRef} className="rounded-lg shadow-xs" />
            <span className="text-[9px] text-slate-400">Scan at entrance pod for instant check-in</span>
          </div>

          <div className="pt-2 text-[9px] text-slate-400 text-center leading-tight">
            Please watch the Waiting Hall display. When your turn is called, proceed to your designated counter.
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Thermal Ticket</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
