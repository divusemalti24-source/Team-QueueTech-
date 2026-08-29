import React, { useState } from 'react';
import { useQueue } from '../../context/QueueContext';
import { Organization, OrganizationType } from '../../types';
import { X, Building2, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface OnboardOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardOrgModal: React.FC<OnboardOrgModalProps> = ({ isOpen, onClose }) => {
  const { createOrganization } = useQueue();

  const [name, setName] = useState('');
  const [nameHi, setNameHi] = useState('');
  const [tagline, setTagline] = useState('');
  const [type, setType] = useState<OrganizationType>('hospital');
  const [brandColor, setBrandColor] = useState('#0284c7');

  const [deptName, setDeptName] = useState('General Services');
  const [serviceName, setServiceName] = useState('Standard Consultation');
  const [serviceCode, setServiceCode] = useState('SRV');
  const [avgServiceTime, setAvgServiceTime] = useState(5);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const orgId = `org-custom-${Date.now()}`;
    const deptId = `dept-1-${Date.now()}`;
    const serviceId = `srv-1-${Date.now()}`;

    const newOrg: Organization = {
      id: orgId,
      name: name.trim(),
      nameHi: nameHi.trim() || name.trim(),
      tagline: tagline.trim() || 'Smart Queue Orchestration System',
      type,
      logoIcon: 'Building2',
      brandColor,
      departments: [
        {
          id: deptId,
          name: deptName.trim(),
          nameHi: deptName.trim(),
          description: 'Primary department for service delivery',
          services: [
            {
              id: serviceId,
              deptId,
              name: serviceName.trim(),
              nameHi: serviceName.trim(),
              code: serviceCode.trim().toUpperCase() || 'SRV',
              avgServiceTimeMinutes: avgServiceTime,
              description: 'Standard queue service',
              isActive: true,
              requiresAuth: false,
              color: 'cyan',
              iconName: 'Activity'
            }
          ]
        }
      ],
      counters: [
        {
          id: `cnt-1-${Date.now()}`,
          number: '1',
          name: 'Counter 1',
          deptId,
          serviceIds: [serviceId],
          currentStaffId: `staff-1-${Date.now()}`,
          currentStaffName: 'Officer In-Charge',
          isOnline: true,
          isFlexCounter: false
        },
        {
          id: `cnt-2-${Date.now()}`,
          number: '2',
          name: 'Counter 2',
          deptId,
          serviceIds: [serviceId],
          currentStaffId: `staff-2-${Date.now()}`,
          currentStaffName: 'Associate Officer',
          isOnline: true,
          isFlexCounter: false
        }
      ],
      rules: {
        allowGuestAccess: true,
        requirePhoneForDigital: true,
        graceHoldMinutes: 5,
        enableStaggeredArrival: true,
        enableVoiceAnnouncements: true,
        maxActiveTokensPerUser: 5,
        tokenCooldownMinutes: 30,
        showQueuePosition: true,
        showPeopleAhead: true,
        showEstimatedTime: false, // OFF by default
        showCounter: true,
        showServiceStatus: true,
        priorityWeights: {
          emergency: 100,
          differently_abled: 50,
          senior: 30,
          standard: 10
        }
      },
      integrations: {
        sms: { enabled: true, provider: 'Standard SMS API', status: 'unconfigured' },
        email: { enabled: true, provider: 'Institutional SMTP', status: 'unconfigured' },
        thermalPrinter: { enabled: true, status: 'configured' },
        webhooks: { enabled: false, status: 'unconfigured' }
      }
    };

    createOrganization(newOrg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Onboard New Organization
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Setup your facility queue system in under 60 seconds
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Organization Name (English) *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Apex Health Clinic"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Organization Name (Hindi)
              </label>
              <input
                type="text"
                value={nameHi}
                onChange={e => setNameHi(e.target.value)}
                placeholder="उदा. एपेक्स स्वास्थ्य क्लिनिक"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Organization Sector / Type
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as OrganizationType)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
              >
                <option value="hospital">🏥 Hospital / Healthcare</option>
                <option value="government">🏛️ Government / Civic Office</option>
                <option value="bank">🏦 Bank / Financial Branch</option>
                <option value="university">🎓 University / College</option>
                <option value="airport">✈️ Airport / Transit Counter</option>
                <option value="customer_service">🏢 Corporate / Customer Service</option>
                <option value="other">🌐 Other Public Service</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tagline / Purpose
              </label>
              <input
                type="text"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                placeholder="e.g. Outpatient Care & Diagnostics"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Initial Department & Primary Service
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Department</label>
                <input
                  type="text"
                  value={deptName}
                  onChange={e => setDeptName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Service Name</label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={e => setServiceName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Token Prefix (Code)</label>
                <input
                  type="text"
                  maxLength={4}
                  value={serviceCode}
                  onChange={e => setServiceCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md shadow-sky-500/20"
            >
              Save & Launch Organization
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
