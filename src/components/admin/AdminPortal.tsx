import React, { useState } from 'react';
import { useQueue } from '../../context/QueueContext';
import {
  Building2,
  Sliders,
  Users,
  Clock,
  Download,
  PlusCircle,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  BarChart3,
  KeyRound,
  ShieldAlert,
  Lock,
  Copy,
  UserCheck,
  UserX,
  FileText,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Service, Counter, StaffRole, StaffPermission } from '../../types';

interface AdminPortalProps {
  onOpenOnboardModal: () => void;
  onOpenHandoverModal: () => void;
  onOpenSecuritySuiteModal?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  onOpenOnboardModal,
  onOpenHandoverModal,
  onOpenSecuritySuiteModal
}) => {
  const {
    currentOrg,
    tokens,
    updateOrganization,
    exportAuditLogsCSV,
    showToast,
    staffInvitations,
    createStaffInvitation,
    revokeStaffInvitation,
    auditLogs
  } = useQueue();

  const [activeTab, setActiveTab] = useState<'analytics' | 'staff_lifecycle' | 'security_audit' | 'departments' | 'counters' | 'rules'>('analytics');

  // Stats calculation
  const totalTokens = tokens.length;
  const waitingTokens = tokens.filter(t => t.status === 'WAITING').length;
  const servedTokens = tokens.filter(t => t.status === 'COMPLETED').length;
  const noShows = tokens.filter(t => t.status === 'NO_SHOW').length;
  const noShowRate = totalTokens > 0 ? Math.round((noShows / totalTokens) * 100) : 0;

  // New Staff Invite state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<StaffRole>('staff');
  const [inviteDept, setInviteDept] = useState(currentOrg.departments[0]?.id || '');
  const [inviteExpiryHours, setInviteExpiryHours] = useState(48);

  // Audit filter state
  const [auditFilter, setAuditFilter] = useState<'ALL' | 'AUTH_FAILED' | 'CROSS_TENANT' | 'RATE_LIMIT' | 'MUTEX_LOCK' | 'STAFF_INVITE'>('ALL');

  // New Service form state
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCode, setNewServiceCode] = useState('');
  const [newServiceDeptId, setNewServiceDeptId] = useState(currentOrg.departments[0]?.id || '');
  const [newServiceAvgTime, setNewServiceAvgTime] = useState(5);

  // New Counter form state
  const [newCounterName, setNewCounterName] = useState('');
  const [newCounterOfficer, setNewCounterOfficer] = useState('');

  const handleGenerateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const defaultPermissions: StaffPermission[] = inviteRole === 'admin'
      ? ['QUEUE_VIEW', 'QUEUE_CALL_NEXT', 'QUEUE_TRANSFER', 'QUEUE_HOLD', 'QUEUE_RECALL', 'QUEUE_MANAGE', 'ANALYTICS_VIEW', 'ORGANIZATION_MANAGE', 'AUDIT_LOG_EXPORT', 'STAFF_INVITE_CREATE', 'STAFF_ACCOUNT_MANAGE']
      : inviteRole === 'supervisor'
      ? ['QUEUE_VIEW', 'QUEUE_CALL_NEXT', 'QUEUE_TRANSFER', 'QUEUE_HOLD', 'QUEUE_RECALL', 'QUEUE_MANAGE', 'ANALYTICS_VIEW']
      : ['QUEUE_VIEW', 'QUEUE_CALL_NEXT', 'QUEUE_TRANSFER', 'QUEUE_HOLD', 'QUEUE_RECALL'];

    const invite = createStaffInvitation({
      email: inviteEmail.trim(),
      role: inviteRole,
      deptId: inviteDept,
      permissions: defaultPermissions,
      expiresInHours: Number(inviteExpiryHours) || 48
    });

    setInviteEmail('');
    showToast(`Staff Invitation generated: ${invite.code}`, 'success');
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim() || !newServiceCode.trim() || !newServiceDeptId) return;

    const newSrv: Service = {
      id: `srv-${Date.now()}`,
      deptId: newServiceDeptId,
      name: newServiceName.trim(),
      nameHi: newServiceName.trim(),
      code: newServiceCode.trim().toUpperCase(),
      avgServiceTimeMinutes: Number(newServiceAvgTime) || 5,
      description: 'Configured queue service',
      isActive: true,
      requiresAuth: false,
      color: 'sky',
      iconName: 'Activity'
    };

    const updatedDepts = currentOrg.departments.map(d => {
      if (d.id === newServiceDeptId) {
        return { ...d, services: [...d.services, newSrv] };
      }
      return d;
    });

    updateOrganization({ ...currentOrg, departments: updatedDepts });
    setNewServiceName('');
    setNewServiceCode('');
    showToast(`Added new service: ${newSrv.name}`, 'success');
  };

  const handleAddCounter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCounterName.trim()) return;

    const newCnt: Counter = {
      id: `cnt-${Date.now()}`,
      number: String(currentOrg.counters.length + 1),
      name: newCounterName.trim(),
      deptId: currentOrg.departments[0]?.id || '',
      serviceIds: currentOrg.departments[0]?.services.map(s => s.id) || [],
      currentStaffId: `staff-${Date.now()}`,
      currentStaffName: newCounterOfficer.trim() || 'Assigned Officer',
      isOnline: true,
      isFlexCounter: false
    };

    updateOrganization({ ...currentOrg, counters: [...currentOrg.counters, newCnt] });
    setNewCounterName('');
    setNewCounterOfficer('');
    showToast(`Created Counter: ${newCnt.name}`, 'success');
  };

  const toggleCounterFlex = (counterId: string) => {
    const updatedCounters = currentOrg.counters.map(c => {
      if (c.id === counterId) {
        return { ...c, isFlexCounter: !c.isFlexCounter };
      }
      return c;
    });
    updateOrganization({ ...currentOrg, counters: updatedCounters });
    showToast('Updated counter allocation mode.', 'info');
  };

  const orgInvitations = staffInvitations.filter(i => i.orgId === currentOrg.id);

  const filteredLogs = auditLogs.filter(log => {
    if (auditFilter === 'ALL') return true;
    if (auditFilter === 'AUTH_FAILED') return log.status === 'DENIED' || log.threatCategory;
    if (auditFilter === 'CROSS_TENANT') return log.threatCategory?.includes('Cross-Tenant');
    if (auditFilter === 'RATE_LIMIT') return log.action.includes('RATE_LIMIT') || log.action.includes('LOCKOUT');
    if (auditFilter === 'MUTEX_LOCK') return log.action.includes('MUTEX') || log.action.includes('CONCURRENT');
    if (auditFilter === 'STAFF_INVITE') return log.action.includes('STAFF_INVITATION');
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 pb-20">
      
      {/* Header & Quick Action */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/30">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {currentOrg.name} • Admin Console
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-mono text-[10px] font-bold">
                ZERO-TRUST CONTROL
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Department triage rules, counter management, staff invitation lifecycle & tamper-evident audit logs
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenSecuritySuiteModal && (
            <button
              onClick={onOpenSecuritySuiteModal}
              className="px-4 py-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Run Threat Test Suite (15 Tests)</span>
            </button>
          )}

          <button
            onClick={exportAuditLogsCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-sky-500" />
            <span>Export Audit Trail (CSV)</span>
          </button>

          <button
            onClick={onOpenOnboardModal}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-sky-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Onboard Facility</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto no-scrollbar text-xs font-bold">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Operational Analytics
        </button>

        <button
          onClick={() => setActiveTab('staff_lifecycle')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'staff_lifecycle'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Staff Access & Invitations ({orgInvitations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security_audit')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'security_audit'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Audit Log Explorer ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'departments'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Departments & Services ({currentOrg.departments.length})
        </button>

        <button
          onClick={() => setActiveTab('counters')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'counters'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Counters & Flex Routing ({currentOrg.counters.length})
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'rules'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Priority Weights & Triage
        </button>
      </div>

      {/* TAB 1: OPERATIONAL ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Passes Issued</span>
              <p className="text-3xl font-black text-slate-900 dark:text-white font-mono">{totalTokens}</p>
              <span className="text-[11px] text-sky-500 font-bold">100% digital trace</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Waiting in Queue</span>
              <p className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">{waitingTokens}</p>
              <span className="text-[11px] text-amber-500 font-bold">Lobby load: Normal</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Successfully Served</span>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{servedTokens}</p>
              <span className="text-[11px] text-emerald-500 font-bold">Avg turnaround 4.5m</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">No-Show / Drop Rate</span>
              <p className="text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">{noShowRate}%</p>
              <span className="text-[11px] text-rose-500 font-bold">{noShows} abandoned</span>
            </div>
          </div>

          {/* Handover Specifications Callout */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-800 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="font-black text-base">Zero-Infrastructure Handover Specification</h3>
              </div>
              <p className="text-xs text-indigo-200 max-w-xl">
                Ready for immediate production pilot. Works on standard office PCs, smartphones, and low-cost tablets with zero dedicated server requirements.
              </p>
            </div>
            <button
              onClick={onOpenHandoverModal}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shrink-0 cursor-pointer shadow-md"
            >
              Open Handover Guide
            </button>
          </div>

        </div>
      )}

      {/* TAB 2: STAFF ACCESS & INVITATIONS */}
      {activeTab === 'staff_lifecycle' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Generate Invite Box */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-sky-500" />
                  <span>Issue Zero-Trust Staff Invitation Code</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Generate single-use cryptographic invitation tokens with custom role bindings and expiration timestamps.
                </p>
              </div>
            </div>

            <form onSubmit={handleGenerateInvite} className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Staff Work Email</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="doctor@hospital.org"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Role</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as StaffRole)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                >
                  <option value="staff">Staff Operator</option>
                  <option value="supervisor">Floor Supervisor</option>
                  <option value="admin">Organization Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Valid For (Hours)</label>
                <select
                  value={inviteExpiryHours}
                  onChange={e => setInviteExpiryHours(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                >
                  <option value="24">24 Hours</option>
                  <option value="48">48 Hours (Default)</option>
                  <option value="72">72 Hours</option>
                  <option value="168">7 Days</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-md shadow-sky-500/20"
                >
                  Generate Invitation Code
                </button>
              </div>
            </form>
          </div>

          {/* Active Invitations List */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Issued Invitation Codes & Status
            </h3>

            <div className="space-y-2.5">
              {orgInvitations.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No invitations issued for this organization yet.</p>
              ) : (
                orgInvitations.map(inv => {
                  const isExpired = new Date(inv.expiresAt).getTime() < Date.now();
                  return (
                    <div
                      key={inv.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono font-black text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md">
                            {inv.code}
                          </code>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 uppercase">
                            {inv.role}
                          </span>
                          {inv.isRedeemed && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              Redeemed by {inv.redeemedByName}
                            </span>
                          )}
                          {inv.isRevoked && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                              Revoked
                            </span>
                          )}
                          {isExpired && !inv.isRedeemed && !inv.isRevoked && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              Expired
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          Assigned to: <strong>{inv.email}</strong> • Expires: {new Date(inv.expiresAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(inv.code);
                            showToast(`Copied code ${inv.code}`, 'info');
                          }}
                          className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-sky-500 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </button>
                        {!inv.isRevoked && !inv.isRedeemed && (
                          <button
                            onClick={() => revokeStaffInvitation(inv.id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 text-xs font-bold cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: AUDIT LOG EXPLORER */}
      {activeTab === 'security_audit' && (
        <div className="space-y-6 animate-in fade-in">
          
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-indigo-500" />
                  <span>Real-Time Security & Compliance Audit Log</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Tamper-evident activity stream recording authorization decisions, threat blocks, rate-limit throttles, and staff operations.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'ALL', label: 'All Events' },
                  { id: 'AUTH_FAILED', label: 'Threats / Denied' },
                  { id: 'CROSS_TENANT', label: 'Cross-Tenant' },
                  { id: 'RATE_LIMIT', label: 'Rate Limiting' },
                  { id: 'MUTEX_LOCK', label: 'Concurrency' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setAuditFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      auditFilter === f.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Audit Log Items */}
            <div className="space-y-2 pt-2 max-h-[500px] overflow-y-auto">
              {filteredLogs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No audit entries matching filter.</p>
              ) : (
                filteredLogs.map(log => {
                  const isDenied = log.status === 'DENIED';
                  return (
                    <div
                      key={log.id}
                      className={`p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isDenied
                          ? 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/20'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                            isDenied ? 'bg-rose-500 text-white' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {log.status}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">{log.action}</span>
                          {log.threatCategory && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                              {log.threatCategory}
                            </span>
                          )}
                        </div>

                        <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                          User: <strong className="text-slate-800 dark:text-slate-200">{log.userName}</strong> ({log.userRole}) • Target: {log.target}
                        </p>
                        {log.details && (
                          <p className="text-[10px] text-slate-500 font-mono">
                            {JSON.stringify(log.details)}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono text-slate-400 block">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          IP: {log.ipAddress || '127.0.0.1'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: DEPARTMENTS & SERVICES */}
      {activeTab === 'departments' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Add Service Form */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Add New Service to Facility
            </h3>
            
            <form onSubmit={handleAddService} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Dept</label>
                <select
                  value={newServiceDeptId}
                  onChange={e => setNewServiceDeptId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                >
                  {currentOrg.departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  value={newServiceName}
                  onChange={e => setNewServiceName(e.target.value)}
                  placeholder="e.g. Blood Test"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Code (Prefix)</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={newServiceCode}
                  onChange={e => setNewServiceCode(e.target.value.toUpperCase())}
                  placeholder="BLD"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Add Service
                </button>
              </div>
            </form>
          </div>

          {/* Department List */}
          <div className="space-y-4">
            {currentOrg.departments.map(dept => (
              <div
                key={dept.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h4 className="font-black text-base text-slate-900 dark:text-white">{dept.name}</h4>
                    <p className="text-xs text-slate-400">{dept.description}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-xs font-bold">
                    {dept.services.length} active services
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {dept.services.map(srv => (
                    <div
                      key={srv.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                          {srv.code}
                        </span>
                        <span className="text-[10px] text-slate-400">~{srv.avgServiceTimeMinutes}m / turn</span>
                      </div>
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white pt-1">{srv.name}</h5>
                      <p className="text-[10px] text-slate-500 leading-tight">{srv.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* TAB 5: COUNTERS & FLEX ROUTING */}
      {activeTab === 'counters' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Add Counter */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Add New Counter Station
            </h3>
            
            <form onSubmit={handleAddCounter} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Counter Name</label>
                <input
                  type="text"
                  required
                  value={newCounterName}
                  onChange={e => setNewCounterName(e.target.value)}
                  placeholder="e.g. Counter 3 (Express)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assigned Officer</label>
                <input
                  type="text"
                  value={newCounterOfficer}
                  onChange={e => setNewCounterOfficer(e.target.value)}
                  placeholder="e.g. Dr. Verma"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Create Counter
                </button>
              </div>
            </form>
          </div>

          {/* Counters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentOrg.counters.map(c => (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <h4 className="font-black text-base text-slate-900 dark:text-white">{c.name}</h4>
                  </div>
                  <span className="font-mono text-xs text-slate-400 font-bold">Counter #{c.number}</span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <p>Officer: <strong className="text-slate-900 dark:text-white">{c.currentStaffName}</strong></p>
                  <p>Services assigned: {c.serviceIds.length} active</p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Flex Counter Mode</span>
                    <p className="text-[10px] text-slate-400">Can serve overflow queue during peak load</p>
                  </div>
                  <button
                    onClick={() => toggleCounterFlex(c.id)}
                    className="p-1 text-sky-600 dark:text-sky-400 hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    {c.isFlexCounter ? <ToggleRight className="w-8 h-8 text-sky-500" /> : <ToggleLeft className="w-8 h-8 text-slate-400" />}
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* TAB 6: RULES & PRIORITY */}
      {activeTab === 'rules' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Turn-Based Queue Display Configuration */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-sky-500" />
                <span>Citizen-Facing Queue Display Configuration</span>
              </h3>
              <p className="text-xs text-slate-500">
                QueueLess strictly uses turn-based progression by default (&quot;Next turn — be prepared&quot;, &quot;Your turn is coming up&quot;) instead of volatile minute-based estimations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Show Queue Position */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Show Queue Position (#)</span>
                  <p className="text-[11px] text-slate-500">Display numerical position in the waiting list</p>
                </div>
                <button
                  onClick={() => updateOrganization({
                    ...currentOrg,
                    rules: {
                      ...currentOrg.rules,
                      showQueuePosition: currentOrg.rules.showQueuePosition !== false ? false : true
                    }
                  })}
                  className="cursor-pointer text-slate-600 dark:text-slate-300"
                >
                  {currentOrg.rules.showQueuePosition !== false ? (
                    <ToggleRight className="w-8 h-8 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-400" />
                  )}
                </button>
              </div>

              {/* Show People Ahead */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Show People Ahead Count</span>
                  <p className="text-[11px] text-slate-500">Display count of preceding citizens waiting</p>
                </div>
                <button
                  onClick={() => updateOrganization({
                    ...currentOrg,
                    rules: {
                      ...currentOrg.rules,
                      showPeopleAhead: currentOrg.rules.showPeopleAhead !== false ? false : true
                    }
                  })}
                  className="cursor-pointer text-slate-600 dark:text-slate-300"
                >
                  {currentOrg.rules.showPeopleAhead !== false ? (
                    <ToggleRight className="w-8 h-8 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-400" />
                  )}
                </button>
              </div>

              {/* Show Estimated Time (OFF BY DEFAULT) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Show Estimated Minutes</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                      OFF (Default)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Universal best practice is OFF (Turn-based notifications)</p>
                </div>
                <button
                  onClick={() => updateOrganization({
                    ...currentOrg,
                    rules: {
                      ...currentOrg.rules,
                      showEstimatedTime: !currentOrg.rules.showEstimatedTime
                    }
                  })}
                  className="cursor-pointer text-slate-600 dark:text-slate-300"
                >
                  {currentOrg.rules.showEstimatedTime ? (
                    <ToggleRight className="w-8 h-8 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-400" />
                  )}
                </button>
              </div>

              {/* Show Assigned Counter */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Show Assigned Counter</span>
                  <p className="text-[11px] text-slate-500">Show counter and officer name when dispatched</p>
                </div>
                <button
                  onClick={() => updateOrganization({
                    ...currentOrg,
                    rules: {
                      ...currentOrg.rules,
                      showCounter: currentOrg.rules.showCounter !== false ? false : true
                    }
                  })}
                  className="cursor-pointer text-slate-600 dark:text-slate-300"
                >
                  {currentOrg.rules.showCounter !== false ? (
                    <ToggleRight className="w-8 h-8 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Triage Rules & Priority Weights */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Triage Rules & Priority Weights
              </h3>
              <p className="text-xs text-slate-500">
                The queue engine sorts next turns using deterministic priority scores to prevent queue starvation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 space-y-1">
                <span className="text-xs font-black text-rose-800 dark:text-rose-300">Emergency Triage (Weight: 100)</span>
                <p className="text-xs text-rose-600 dark:text-rose-400">Instantly bumps citizen to next available counter.</p>
              </div>

              <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900 space-y-1">
                <span className="text-xs font-black text-violet-800 dark:text-violet-300">Differently Abled (Weight: 50)</span>
                <p className="text-xs text-violet-600 dark:text-violet-400">Assisted priority access with minimal physical standing.</p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 space-y-1">
                <span className="text-xs font-black text-indigo-800 dark:text-indigo-300">Senior Citizen 60+ (Weight: 30)</span>
                <p className="text-xs text-indigo-600 dark:text-indigo-400">Elderly friendly fast-track allocation.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">Standard / General (Weight: 10)</span>
                <p className="text-xs text-slate-500">Standard chronological order based on token issuance.</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
