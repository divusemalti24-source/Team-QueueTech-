import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Organization,
  QueueToken,
  User,
  UserRole,
  Language,
  ThemeMode,
  AppNotification,
  AuditLogEntry,
  PriorityCategory,
  TokenType,
  StaffInvitation,
  Appointment,
  UserActivity,
  UserSession,
  StaffPermission
} from '../types';
import {
  DEFAULT_ORGANIZATIONS,
  INITIAL_MOCK_TOKENS,
  INITIAL_MOCK_APPOINTMENTS,
  INITIAL_MOCK_ACTIVITIES,
  DEFAULT_STAFF_INVITATIONS
} from '../data/defaultOrganizations';
import {
  SecurityEnforcer,
  rateLimiter,
  concurrencyMutex,
  generateSecureTokenRef,
  generateStaffInviteCode,
  sanitizeInput
} from '../lib/security';

export type AppView = 'citizen' | 'user_dashboard' | 'staff' | 'display' | 'kiosk' | 'admin' | 'security_suite';

interface QueueContextType {
  // Organizations
  organizations: Organization[];
  activeOrgId: string;
  currentOrg: Organization;
  switchOrganization: (orgId: string) => void;
  createOrganization: (org: Organization) => void;
  updateOrganization: (org: Organization) => void;

  // Tokens & Queue State
  tokens: QueueToken[];
  activeCitizenToken: QueueToken | null;
  setActiveCitizenTokenId: (id: string | null) => void;
  userTokens: QueueToken[]; // Tokens owned by logged-in registered user

  // Authentication & Identity
  currentUser: User;
  setCurrentUser: (user: User) => void;
  loginAsGuest: (name?: string, phone?: string) => void;
  loginAsRegisteredUser: (userData?: Partial<User>) => void;
  loginAsStaffWithInvite: (inviteCode: string, staffName: string) => { success: boolean; error?: string };
  loginAsDemoRole: (role: UserRole, customName?: string) => void;
  logout: () => void;
  reAuthenticate: (passwordOrOtp: string) => boolean;

  // View Navigation
  currentView: AppView;
  setCurrentView: (view: AppView) => void;

  // Settings & Localization
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;

  // Queue Operations (Guarded by Zero-Trust Authorization)
  joinQueue: (params: {
    serviceId: string;
    citizenName: string;
    citizenPhone?: string;
    citizenEmail?: string;
    priority?: PriorityCategory;
    type?: TokenType;
  }) => { success: boolean; token?: QueueToken; error?: string };

  callNext: (counterId: string) => Promise<{ success: boolean; token?: QueueToken; error?: string }>;
  skipAndCallNext: (counterId: string, currentTokenId?: string) => Promise<{ success: boolean; allUnavailable?: boolean; token?: QueueToken; error?: string }>;
  recallToken: (tokenId: string) => { success: boolean; error?: string };
  holdToken: (tokenId: string) => { success: boolean; error?: string };
  requeueToken: (tokenId: string) => { success: boolean; error?: string };
  resumeHeldToken: (tokenId: string) => { success: boolean; error?: string };
  startService: (tokenId: string) => { success: boolean; error?: string };
  completeService: (tokenId: string) => { success: boolean; error?: string };
  transferToken: (tokenId: string, targetServiceId: string) => { success: boolean; error?: string };
  markNoShow: (tokenId: string) => { success: boolean; error?: string };
  cancelToken: (tokenId: string) => { success: boolean; error?: string };
  checkInAtEntrance: (tokenId: string) => { success: boolean; error?: string };

  // Staff & Admin Authorization Management
  staffInvitations: StaffInvitation[];
  createStaffInvitation: (role: 'staff' | 'supervisor' | 'admin', intendedEmail?: string) => { success: boolean; invitation?: StaffInvitation; error?: string };
  revokeStaffInvitation: (invitationId: string) => { success: boolean; error?: string };
  disableStaffAccount: (staffId: string) => { success: boolean; error?: string };
  changeStaffRole: (staffId: string, newRole: UserRole) => { success: boolean; error?: string };

  // Registered User Management
  appointments: Appointment[];
  bookAppointment: (serviceId: string, scheduledTime: string, notes?: string) => { success: boolean; appointment?: Appointment; error?: string };
  cancelAppointment: (appointmentId: string) => { success: boolean; error?: string };
  userActivities: UserActivity[];
  updateUserProfile: (profile: Partial<User>) => { success: boolean; error?: string };
  revokeSession: (sessionId: string) => void;
  revokeAllOtherSessions: () => void;
  linkGuestTokensByContact: (phoneOrEmail: string) => number;
  deleteUserAccount: () => void;

  // Security, OTP & Feedback
  requestOtp: (identifier: string, channel?: 'sms' | 'email') => { success: boolean; waitSeconds?: number; simulatedCode?: string; error?: string };
  verifyOtp: (identifier: string, code: string) => { success: boolean; error?: string; remainingAttempts?: number };
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  auditLogs: AuditLogEntry[];
  exportAuditLogsCSV: () => void;
  playVoiceChime: (message: string, lang?: Language) => void;
  toastMessage: { text: string; type: 'success' | 'info' | 'warning' | 'error' } | null;
  showToast: (text: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  
  // Real-time Queue Stats
  stats: {
    totalWaiting: number;
    totalServedToday: number;
    avgWaitMinutes: number;
    noShowCount: number;
    activeCounters: number;
  };
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ORGS: 'queueless_orgs_v3',
  ACTIVE_ORG: 'queueless_active_org_v3',
  TOKENS: 'queueless_tokens_v3',
  USER: 'queueless_user_v3',
  ACTIVE_TOKEN: 'queueless_active_token_v3',
  LANG: 'queueless_lang_v3',
  THEME: 'queueless_theme_v3',
  LOGS: 'queueless_audit_logs_v3',
  NOTIFS: 'queueless_notifs_v3',
  INVITES: 'queueless_invites_v3',
  APPOINTMENTS: 'queueless_apts_v3',
  ACTIVITIES: 'queueless_acts_v3'
};

const DEFAULT_GUEST_USER: User = {
  id: 'usr-guest-anon',
  name: 'Guest Citizen',
  role: 'guest',
  isGuest: true,
  authProvider: 'guest'
};

const DEFAULT_REGISTERED_USER: User = {
  id: 'usr-pooja-101',
  name: 'Pooja Sundaram',
  email: 'pooja.sundaram@example.com',
  phone: '9811223344',
  role: 'citizen',
  isGuest: false,
  emailVerified: true,
  phoneVerified: true,
  authProvider: 'google',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  notificationPrefs: { sms: true, email: true, inApp: true },
  sessions: [
    {
      id: 'sess-1',
      userId: 'usr-pooja-101',
      userAgent: 'Chrome on macOS (Current Device)',
      ipMasked: '192.168.1.***',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      lastActive: 'Active Now',
      isCurrent: true
    },
    {
      id: 'sess-2',
      userId: 'usr-pooja-101',
      userAgent: 'Safari on iPhone 15 Pro',
      ipMasked: '103.21.24.***',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      lastActive: '3 hours ago',
      isCurrent: false
    }
  ]
};

export const QueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Organizations State
  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORGS);
      return saved ? JSON.parse(saved) : DEFAULT_ORGANIZATIONS;
    } catch {
      return DEFAULT_ORGANIZATIONS;
    }
  });

  const [activeOrgId, setActiveOrgId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_ORG) || 'org-hospital';
    } catch {
      return 'org-hospital';
    }
  });

  const currentOrg = useMemo(() => {
    return organizations.find(o => o.id === activeOrgId) || organizations[0] || DEFAULT_ORGANIZATIONS[0];
  }, [organizations, activeOrgId]);

  // 2. Tokens State
  const [tokens, setTokens] = useState<QueueToken[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TOKENS);
      return saved ? JSON.parse(saved) : INITIAL_MOCK_TOKENS;
    } catch {
      return INITIAL_MOCK_TOKENS;
    }
  });

  // 3. User & Auth State
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_REGISTERED_USER; // Default to registered user for rich dashboard demonstration
  });

  const [activeCitizenTokenId, setActiveCitizenTokenIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_TOKEN) || 'tok-102';
    } catch {
      return 'tok-102';
    }
  });

  // 4. Staff Invitations State
  const [staffInvitations, setStaffInvitations] = useState<StaffInvitation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVITES);
      return saved ? JSON.parse(saved) : DEFAULT_STAFF_INVITATIONS;
    } catch {
      return DEFAULT_STAFF_INVITATIONS;
    }
  });

  // 5. Appointments & Activities
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      return saved ? JSON.parse(saved) : INITIAL_MOCK_APPOINTMENTS;
    } catch {
      return INITIAL_MOCK_APPOINTMENTS;
    }
  });

  const [userActivities, setUserActivities] = useState<UserActivity[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      return saved ? JSON.parse(saved) : INITIAL_MOCK_ACTIVITIES;
    } catch {
      return INITIAL_MOCK_ACTIVITIES;
    }
  });

  // 6. App View State
  const [currentView, setCurrentView] = useState<AppView>('citizen');

  // 7. Language & Theme
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEYS.LANG) as Language) || 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (l: Language) => setLanguageState(l);

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEYS.THEME) as ThemeMode) || 'light';
    } catch {
      return 'light';
    }
  });

  const setTheme = (t: ThemeMode) => setThemeState(t);

  // 8. Notifications & Logs
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFS);
      return saved ? JSON.parse(saved) : [
        {
          id: 'notif-1',
          tokenNumber: 'MED-102',
          title: 'Queue Position Update',
          message: 'You have 1 person ahead of you. Estimated turn in ~3 minutes.',
          channel: 'IN_APP',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: false,
          status: 'DELIVERED'
        }
      ];
    } catch {
      return [];
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warning' | 'error' } | null>(null);

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORGS, JSON.stringify(organizations));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ORG, activeOrgId);
      localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
      if (activeCitizenTokenId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_TOKEN, activeCitizenTokenId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_TOKEN);
      }
      localStorage.setItem(STORAGE_KEYS.LANG, language);
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
      localStorage.setItem(STORAGE_KEYS.NOTIFS, JSON.stringify(notifications));
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(auditLogs));
      localStorage.setItem(STORAGE_KEYS.INVITES, JSON.stringify(staffInvitations));
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(userActivities));
    } catch (e) {
      console.warn('Storage sync error:', e);
    }
  }, [
    organizations,
    activeOrgId,
    tokens,
    currentUser,
    activeCitizenTokenId,
    language,
    theme,
    notifications,
    auditLogs,
    staffInvitations,
    appointments,
    userActivities
  ]);

  // Apply dark/light class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const showToast = (text: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const addAuditLog = (
    action: string,
    targetTokenId?: string,
    maskedDetails?: string,
    threatLevel: 'INFO' | 'WARNING' | 'ALERT' | 'SECURITY_BLOCKED' = 'INFO'
  ) => {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actor: currentUser.name || 'System',
      role: currentUser.role,
      action: sanitizeInput(action),
      targetTokenId,
      targetOrgId: currentOrg.id,
      maskedDetails: maskedDetails ? sanitizeInput(maskedDetails) : 'Standard verified operation',
      ipAddress: '192.168.1.***',
      threatLevel
    };
    setAuditLogs(prev => [entry, ...prev.slice(0, 200)]);
  };

  const addNotification = (
    title: string,
    message: string,
    tokenNumber: string,
    channel: 'IN_APP' | 'SMS' | 'EMAIL' = 'IN_APP'
  ) => {
    const notif: AppNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tokenNumber,
      title,
      message,
      channel,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      status: 'DELIVERED'
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const addUserActivity = (
    type: UserActivity['type'],
    title: string,
    description: string,
    orgName = currentOrg.name
  ) => {
    if (currentUser.isGuest) return;
    const act: UserActivity = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: currentUser.id,
      timestamp: 'Just now',
      type,
      title,
      description,
      orgName
    };
    setUserActivities(prev => [act, ...prev]);
  };

  const playVoiceChime = (message: string, lang: Language = language) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  // Active Citizen Token derived
  const activeCitizenToken = useMemo(() => {
    if (!activeCitizenTokenId) return null;
    return tokens.find(t => t.id === activeCitizenTokenId && t.status !== 'COMPLETED' && t.status !== 'CANCELLED') || null;
  }, [tokens, activeCitizenTokenId]);

  // Tokens belonging to the logged-in registered user
  const userTokens = useMemo(() => {
    if (currentUser.isGuest) return [];
    return tokens.filter(t => 
      t.userId === currentUser.id ||
      (currentUser.phone && t.citizenPhone && t.citizenPhone.includes(currentUser.phone.slice(-4))) ||
      (currentUser.email && t.citizenEmail === currentUser.email)
    );
  }, [tokens, currentUser]);

  const setActiveCitizenTokenId = (id: string | null) => {
    setActiveCitizenTokenIdState(id);
  };

  // Organization Switching
  const switchOrganization = (orgId: string) => {
    const found = organizations.find(o => o.id === orgId);
    if (found) {
      setActiveOrgId(orgId);
      showToast(`Switched organization to ${found.name}`, 'info');
      addAuditLog(`Switched Organization to ${found.name}`, undefined, `Org ID: ${orgId}`);
    }
  };

  const createOrganization = (org: Organization) => {
    // Only super_admin or admin can create orgs
    const auth = SecurityEnforcer.authorizeRole(currentUser, ['admin', 'super_admin']);
    if (!auth.allowed) {
      showToast(auth.reason || 'Unauthorized to create organization.', 'error');
      addAuditLog('UNAUTHORIZED Organization Creation Attempt', undefined, auth.reason, 'SECURITY_BLOCKED');
      return;
    }

    setOrganizations(prev => [...prev, org]);
    setActiveOrgId(org.id);
    showToast(`New Organization "${org.name}" successfully onboarded!`, 'success');
    addAuditLog(`Created new Organization: ${org.name}`);
  };

  const updateOrganization = (org: Organization) => {
    const auth = SecurityEnforcer.authorizePermission(currentUser, 'ORGANIZATION_MANAGE', org.id);
    if (!auth.allowed) {
      showToast(auth.reason || 'Unauthorized to update organization settings.', 'error');
      addAuditLog('UNAUTHORIZED Organization Settings Update Attempt', undefined, auth.reason, 'SECURITY_BLOCKED');
      return;
    }

    setOrganizations(prev => prev.map(o => o.id === org.id ? org : o));
    showToast(`Organization settings updated.`, 'success');
    addAuditLog(`Updated Organization Settings: ${org.name}`);
  };

  // ----------------------------------------------------
  // AUTHENTICATION METHODS
  // ----------------------------------------------------
  const loginAsGuest = (name = 'Guest Citizen', phone?: string) => {
    const guestUser: User = {
      id: `usr-guest-${Date.now()}`,
      name: sanitizeInput(name),
      phone: phone ? sanitizeInput(phone) : undefined,
      role: 'guest',
      isGuest: true,
      authProvider: 'guest'
    };
    setCurrentUser(guestUser);
    showToast(`Continuing as Guest (${guestUser.name})`, 'info');
    addAuditLog('Guest Session Initiated', undefined, 'No account required');
  };

  const loginAsRegisteredUser = (userData?: Partial<User>) => {
    const user: User = {
      ...DEFAULT_REGISTERED_USER,
      ...userData,
      id: userData?.id || `usr-${Date.now()}`,
      role: 'citizen',
      isGuest: false,
      lastLoginAt: new Date().toISOString()
    };
    setCurrentUser(user);
    showToast(`Welcome back, ${user.name}!`, 'success');
    addAuditLog(`User Signed In: ${user.name}`, undefined, `Auth: ${user.authProvider || 'Registered'}`);
    addUserActivity('PROFILE_UPDATED', 'Signed into QueueLess', 'Authenticated session established');
  };

  const loginAsStaffWithInvite = (inviteCode: string, staffName: string): { success: boolean; error?: string } => {
    const code = inviteCode.trim().toUpperCase();
    const invite = staffInvitations.find(i => i.code === code);

    if (!invite) {
      addAuditLog('Staff Login Failed: Invalid Code', undefined, `Attempted code: ${code}`, 'ALERT');
      return { success: false, error: 'Invalid Staff Invitation Code. Please contact your Organization Administrator.' };
    }

    if (invite.isRevoked) {
      addAuditLog('Staff Login Failed: Code Revoked', undefined, `Code ${code} is revoked`, 'SECURITY_BLOCKED');
      return { success: false, error: 'This Staff Invitation Code has been revoked by the Administrator.' };
    }

    if (invite.isUsed) {
      addAuditLog('Staff Login Failed: Code Already Used', undefined, `Code ${code} was previously used by ${invite.usedBy}`, 'SECURITY_BLOCKED');
      return { success: false, error: 'This single-use Staff Invitation Code has already been redeemed.' };
    }

    if (new Date(invite.expiresAt).getTime() < Date.now()) {
      addAuditLog('Staff Login Failed: Code Expired', undefined, `Code ${code} expired at ${invite.expiresAt}`, 'WARNING');
      return { success: false, error: 'This Staff Invitation Code has expired. Please request a fresh invitation.' };
    }

    // Mark invitation as redeemed
    setStaffInvitations(prev => prev.map(i => i.id === invite.id ? { ...i, isUsed: true, usedBy: staffName } : i));

    const targetOrg = organizations.find(o => o.id === invite.orgId) || currentOrg;
    const assignedCounter = targetOrg.counters[0];

    const staffUser: User = {
      id: `usr-staff-${Date.now()}`,
      name: sanitizeInput(staffName),
      role: invite.role,
      orgId: targetOrg.id,
      assignedCounterId: assignedCounter?.id,
      isGuest: false,
      authProvider: 'staff_invitation',
      staffInvitationCodeUsed: code,
      lastLoginAt: new Date().toISOString()
    };

    setActiveOrgId(targetOrg.id);
    setCurrentUser(staffUser);
    setCurrentView(invite.role === 'admin' ? 'admin' : 'staff');

    showToast(`Staff Authorization Granted: ${staffUser.name} (${invite.role.toUpperCase()})`, 'success');
    addAuditLog(`Staff Authorized & Registered: ${staffUser.name}`, undefined, `Org: ${targetOrg.name}, Role: ${invite.role}, Code: ${code}`);

    return { success: true };
  };

  const loginAsDemoRole = (role: UserRole, customName?: string) => {
    let name = customName || 'User';
    let assignedCounterId: string | undefined = undefined;
    let orgId: string | undefined = undefined;

    if (role === 'guest') {
      name = 'Guest Citizen';
    } else if (role === 'citizen') {
      name = customName || 'Pooja Sundaram (Registered User)';
    } else if (role === 'staff') {
      name = customName || (currentOrg.counters[0]?.currentStaffName || 'Dr. Sharma (Staff Officer)');
      assignedCounterId = currentOrg.counters[0]?.id;
      orgId = currentOrg.id;
    } else if (role === 'supervisor') {
      name = customName || 'V. Raman (Floor Supervisor)';
      orgId = currentOrg.id;
    } else if (role === 'admin') {
      name = customName || 'Executive Administrator';
      orgId = currentOrg.id;
    } else if (role === 'super_admin') {
      name = 'Platform Super Administrator';
    } else if (role === 'kiosk') {
      name = 'Touch Kiosk Terminal';
      orgId = currentOrg.id;
    } else if (role === 'display') {
      name = 'Public Waiting Display';
      orgId = currentOrg.id;
    }

    const newUser: User = {
      id: role === 'citizen' ? 'usr-pooja-101' : `usr-${Date.now()}`,
      name,
      role,
      orgId,
      assignedCounterId,
      isGuest: role === 'guest',
      authProvider: role === 'guest' ? 'guest' : 'google',
      lastLoginAt: new Date().toISOString()
    };

    setCurrentUser(newUser);
    showToast(`Switched Demo Identity to: ${role.toUpperCase()}`, 'info');
    addAuditLog(`Demo Identity Switched to ${role.toUpperCase()}`);

    if (role === 'guest') setCurrentView('citizen');
    else if (role === 'citizen') setCurrentView('user_dashboard');
    else if (role === 'staff' || role === 'supervisor') setCurrentView('staff');
    else if (role === 'display') setCurrentView('display');
    else if (role === 'kiosk') setCurrentView('kiosk');
    else if (role === 'admin' || role === 'super_admin') setCurrentView('admin');
  };

  const logout = () => {
    setCurrentUser(DEFAULT_GUEST_USER);
    setCurrentView('citizen');
    showToast('Session terminated. You are now logged out.', 'info');
    addAuditLog('User Session Terminated / Logged Out');
  };

  const reAuthenticate = (passwordOrOtp: string): boolean => {
    if (passwordOrOtp.trim().length >= 4) {
      showToast('Identity re-verified successfully.', 'success');
      addAuditLog('Sensitive Action Re-Authentication Successful');
      return true;
    }
    showToast('Re-authentication failed. Invalid credential.', 'error');
    addAuditLog('Sensitive Action Re-Authentication FAILED', undefined, undefined, 'ALERT');
    return false;
  };

  // ----------------------------------------------------
  // OTP RATE-LIMITING & VERIFICATION ENGINE
  // ----------------------------------------------------
  const requestOtp = (identifier: string, channel: 'sms' | 'email' = 'sms'): { success: boolean; waitSeconds?: number; simulatedCode?: string; error?: string } => {
    const cleanId = identifier.trim();
    if (!cleanId) {
      return { success: false, error: 'Please enter a valid mobile number or email address.' };
    }
    const rateCheck = rateLimiter.canRequestOtp(cleanId);

    if (!rateCheck.allowed) {
      addAuditLog('OTP Request Throttled', undefined, `Target: ${cleanId}, Wait: ${rateCheck.waitSeconds}s`, 'WARNING');
      return {
        success: false,
        waitSeconds: rateCheck.waitSeconds,
        error: `Please wait ${rateCheck.waitSeconds}s before requesting a new OTP.`
      };
    }

    // In demo mode, generate deterministic 6-digit code for review
    const simulatedCode = '742918';
    const masked = cleanId.includes('@')
      ? cleanId.replace(/(.{2})(.*)(@.*)/, '$1***$3')
      : cleanId.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');

    addAuditLog(`OTP Sent via ${channel.toUpperCase()}`, undefined, `Masked: ${masked}`);
    return { success: true, simulatedCode };
  };

  const verifyOtp = (identifier: string, code: string): { success: boolean; error?: string; remainingAttempts?: number } => {
    const cleanId = identifier.trim();
    const cleanCode = code.trim();

    // Valid demo code or standard simulated OTP
    if (cleanCode === '742918' || cleanCode === '123456') {
      rateLimiter.clearOtpState(cleanId);
      addAuditLog('OTP Verified Successfully', undefined, `Target: ${cleanId}`);
      return { success: true };
    }

    const failRecord = rateLimiter.recordFailedOtp(cleanId);
    if (failRecord.locked) {
      addAuditLog('OTP Verification Locked: Brute Force Prevention', undefined, `Target: ${cleanId}`, 'SECURITY_BLOCKED');
      return {
        success: false,
        remainingAttempts: 0,
        error: 'Too many failed OTP attempts. This contact has been temporarily locked for 5 minutes.'
      };
    }

    addAuditLog('OTP Verification Failed', undefined, `Remaining attempts: ${failRecord.remainingAttempts}`, 'WARNING');
    return {
      success: false,
      remainingAttempts: failRecord.remainingAttempts,
      error: `Invalid OTP code. ${failRecord.remainingAttempts} attempt(s) remaining.`
    };
  };

  // ----------------------------------------------------
  // QUEUE OPERATIONS (WITH ZERO-TRUST ENFORCEMENT)
  // ----------------------------------------------------
  const joinQueue = ({
    serviceId,
    citizenName,
    citizenPhone,
    citizenEmail,
    priority = 'standard',
    type = 'DIGITAL'
  }: {
    serviceId: string;
    citizenName: string;
    citizenPhone?: string;
    citizenEmail?: string;
    priority?: PriorityCategory;
    type?: TokenType;
  }): { success: boolean; token?: QueueToken; error?: string } => {
    // 1. Rate Limiting Check
    const citizenIdentifier = citizenPhone || citizenEmail || currentUser.id || 'anonymous';
    const rateCheck = rateLimiter.canCreateToken(citizenIdentifier, currentOrg.rules.maxActiveTokensPerUser || 3);
    if (!rateCheck.allowed) {
      showToast(rateCheck.reason || 'Token limit reached.', 'error');
      addAuditLog('Token Creation Throttled', undefined, rateCheck.reason, 'WARNING');
      return { success: false, error: rateCheck.reason };
    }

    // 2. Find service & department in current active organization
    let targetService = null;
    let targetDept = null;

    for (const dept of currentOrg.departments) {
      const srv = dept.services.find(s => s.id === serviceId);
      if (srv) {
        targetService = srv;
        targetDept = dept;
        break;
      }
    }

    if (!targetService || !targetDept) {
      targetDept = currentOrg.departments[0];
      targetService = targetDept.services[0];
    }

    // 3. Duplicate Active Token Check for this user / contact in this specific service
    const existingActiveToken = tokens.find(t =>
      t.orgId === currentOrg.id &&
      t.serviceId === targetService.id &&
      (t.status === 'WAITING' || t.status === 'CALLED' || t.status === 'IN_SERVICE' || t.status === 'ON_HOLD') &&
      (
        (citizenPhone && t.citizenPhone === citizenPhone) ||
        (citizenEmail && t.citizenEmail === citizenEmail) ||
        (!currentUser.isGuest && t.userId === currentUser.id)
      )
    );

    if (existingActiveToken) {
      setActiveCitizenTokenId(existingActiveToken.id);
      showToast(`You already have an active pass (${existingActiveToken.tokenNumber}) for ${existingActiveToken.serviceName}.`, 'info');
      return { success: true, token: existingActiveToken };
    }

    // Count existing tokens
    const existingForService = tokens.filter(
      t => t.orgId === currentOrg.id && t.serviceId === targetService.id && (t.status === 'WAITING' || t.status === 'IN_SERVICE' || t.status === 'CALLED')
    );
    const tokenSeq = existingForService.length + 101;
    const tokenNumber = `${targetService.code}-${tokenSeq}`;

    // Estimated wait
    const peopleWaiting = tokens.filter(t => t.orgId === currentOrg.id && t.serviceId === targetService.id && t.status === 'WAITING').length;
    const estimatedWaitMinutes = Math.max(2, peopleWaiting * targetService.avgServiceTimeMinutes);

    // Staggered Arrival Window
    const now = new Date();
    const recommendedArrivalMs = now.getTime() + Math.max(0, (estimatedWaitMinutes - 5) * 60 * 1000);
    const windowStartMs = recommendedArrivalMs - 5 * 60 * 1000;
    const windowEndMs = recommendedArrivalMs + 10 * 60 * 1000;

    const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const secureTrackingRef = generateSecureTokenRef();

    const newToken: QueueToken = {
      id: `tok-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tokenNumber,
      secureTrackingRef,
      orgId: currentOrg.id,
      deptId: targetDept.id,
      deptName: targetDept.name,
      serviceId: targetService.id,
      serviceName: targetService.name,
      serviceNameHi: targetService.nameHi,
      citizenName: sanitizeInput(citizenName) || 'Citizen',
      citizenPhone: citizenPhone ? sanitizeInput(citizenPhone) : undefined,
      citizenEmail: citizenEmail ? sanitizeInput(citizenEmail) : undefined,
      userId: !currentUser.isGuest ? currentUser.id : undefined,
      type,
      priority,
      status: 'WAITING',
      issuedAt: now.toISOString(),
      estimatedWaitMinutes,
      checkInStatus: type === 'PHYSICAL_KIOSK' ? 'CHECKED_IN_ENTRANCE' : 'NOT_ARRIVED',
      staggeredWindow: {
        recommendedArrival: formatTime(new Date(recommendedArrivalMs)),
        windowStart: formatTime(new Date(windowStartMs)),
        windowEnd: formatTime(new Date(windowEndMs))
      },
      concurrencyVersion: 1
    };

    setTokens(prev => [...prev, newToken]);
    setActiveCitizenTokenId(newToken.id);

    // Activity & Notifications
    const msg = `Token ${newToken.tokenNumber} confirmed for ${newToken.serviceName}. Ref: ${secureTrackingRef}.`;
    addNotification('Token Generated', msg, newToken.tokenNumber);
    addAuditLog(`Generated ${type} Token ${newToken.tokenNumber}`, newToken.id, `Service: ${newToken.serviceName}, Ref: ${secureTrackingRef}`);
    addUserActivity('TOKEN_CREATED', `Booked Token ${newToken.tokenNumber}`, `Service: ${newToken.serviceName} at ${currentOrg.name}`);
    showToast(`Token ${newToken.tokenNumber} created!`, 'success');

    return { success: true, token: newToken };
  };

  const callNext = async (counterId: string): Promise<{ success: boolean; token?: QueueToken; error?: string }> => {
    // 1. Authorization Verification (Zero-Trust)
    const auth = SecurityEnforcer.authorizePermission(currentUser, 'QUEUE_CALL_NEXT', currentOrg.id);
    if (!auth.allowed) {
      showToast(auth.reason || 'Access Denied: Staff authorization required.', 'error');
      addAuditLog('UNAUTHORIZED Call Next Attempt', undefined, auth.reason, 'SECURITY_BLOCKED');
      return { success: false, error: auth.reason };
    }

    // 2. Concurrency Lock (Atomic Mutex Guard against race conditions)
    const lockKey = `call_next_${currentOrg.id}_${counterId}`;
    const acquired = await concurrencyMutex.acquireLock(lockKey);
    if (!acquired) {
      showToast('Concurrent request detected. Please wait.', 'warning');
      addAuditLog('Race Condition Prevented on Call Next', undefined, `Counter: ${counterId}`, 'WARNING');
      return { success: false, error: 'Counter is currently busy processing another dispatch.' };
    }

    try {
      const counter = currentOrg.counters.find(c => c.id === counterId);
      if (!counter) {
        showToast('Counter not found in this organization.', 'error');
        return { success: false, error: 'Counter not found.' };
      }

      // Filter eligible waiting tokens for this counter's services in this org
      const eligibleTokens = tokens.filter(t => 
        t.orgId === currentOrg.id &&
        t.status === 'WAITING' &&
        (counter.isFlexCounter || counter.serviceIds.includes(t.serviceId))
      );

      if (eligibleTokens.length === 0) {
        showToast(`No citizens waiting for Counter ${counter.number}.`, 'info');
        return { success: false, error: 'Queue is currently empty for this counter.' };
      }

      // Sort by Priority & Arrival Time
      const priorityWeights = currentOrg.rules.priorityWeights;
      const sorted = [...eligibleTokens].sort((a, b) => {
        const weightA = priorityWeights[a.priority] || 10;
        const weightB = priorityWeights[b.priority] || 10;
        if (weightB !== weightA) return weightB - weightA;
        return new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime();
      });

      const nextToken = sorted[0];
      const now = new Date().toISOString();

      setTokens(prev => prev.map(t => {
        if (t.id === nextToken.id) {
          return {
            ...t,
            status: 'CALLED',
            counterId: counter.id,
            counterNumber: counter.number,
            staffName: counter.currentStaffName || currentUser.name,
            calledAt: now,
            isTemporarilySkipped: false,
            estimatedWaitMinutes: 0,
            concurrencyVersion: (t.concurrencyVersion || 1) + 1
          };
        }
        return t;
      }));

      const voiceAnnouncement = language === 'hi'
        ? `टोकन संख्या ${nextToken.tokenNumber}, कृपया काउंटर ${counter.number} पर आएं।`
        : `Attention please. Token number ${nextToken.tokenNumber.split('').join(' ')}, please proceed to Counter ${counter.number}.`;

      playVoiceChime(voiceAnnouncement);

      addNotification(
        'Now Calling!',
        `Token ${nextToken.tokenNumber} called at Counter ${counter.number}. Please proceed immediately.`,
        nextToken.tokenNumber
      );

      addAuditLog(`Counter ${counter.number} called Token ${nextToken.tokenNumber}`, nextToken.id, `Operator: ${currentUser.name}`);
      showToast(`Calling Token ${nextToken.tokenNumber} at Counter ${counter.number}`, 'success');

      return { success: true, token: nextToken };
    } finally {
      concurrencyMutex.releaseLock(lockKey);
    }
  };

  // Smart Skip & Re-Queue Method
  const skipAndCallNext = async (counterId: string, currentTokenId?: string): Promise<{ success: boolean; allUnavailable?: boolean; token?: QueueToken; error?: string }> => {
    const auth = SecurityEnforcer.authorizePermission(currentUser, 'QUEUE_CALL_NEXT', currentOrg.id);
    if (!auth.allowed) {
      showToast(auth.reason || 'Access Denied: Staff authorization required.', 'error');
      addAuditLog('UNAUTHORIZED Smart Skip Attempt', currentTokenId, auth.reason, 'SECURITY_BLOCKED');
      return { success: false, error: auth.reason };
    }

    const lockKey = `call_next_${currentOrg.id}_${counterId}`;
    const acquired = await concurrencyMutex.acquireLock(lockKey);
    if (!acquired) {
      showToast('Concurrent request detected. Please wait.', 'warning');
      return { success: false, error: 'Counter is currently busy processing another dispatch.' };
    }

    try {
      const counter = currentOrg.counters.find(c => c.id === counterId);
      if (!counter) return { success: false, error: 'Counter not found.' };

      const now = new Date().toISOString();
      let targetCurrentTokenId = currentTokenId;

      if (!targetCurrentTokenId) {
        const activeAtCounter = tokens.find(t => t.orgId === currentOrg.id && t.counterId === counterId && (t.status === 'CALLED' || t.status === 'IN_SERVICE'));
        if (activeAtCounter) {
          targetCurrentTokenId = activeAtCounter.id;
        }
      }

      let skippedTokenNumber = '';
      if (targetCurrentTokenId) {
        const tokenToSkip = tokens.find(t => t.id === targetCurrentTokenId);
        if (tokenToSkip) {
          skippedTokenNumber = tokenToSkip.tokenNumber;
          setTokens(prev => prev.map(t => {
            if (t.id === targetCurrentTokenId) {
              return {
                ...t,
                status: 'ON_HOLD',
                isTemporarilySkipped: true,
                skipCount: (t.skipCount || 0) + 1,
                lastSkippedAt: now,
                holdExpiresAt: new Date(Date.now() + (currentOrg.rules.graceHoldMinutes || 10) * 60 * 1000).toISOString()
              };
            }
            return t;
          }));

          addNotification(
            'Token Temporarily Skipped',
            `Token ${tokenToSkip.tokenNumber} was temporarily skipped due to response timeout. It remains active on hold and can be recalled anytime.`,
            tokenToSkip.tokenNumber
          );
          addAuditLog(`Smart Skip: Token ${tokenToSkip.tokenNumber} placed on Hold (Re-Queue)`, tokenToSkip.id, `Counter: ${counter.number}, Staff: ${currentUser.name}`);
        }
      }

      const eligibleTokens = tokens.filter(t => 
        t.orgId === currentOrg.id &&
        t.status === 'WAITING' &&
        (counter.isFlexCounter || counter.serviceIds.includes(t.serviceId))
      );

      if (eligibleTokens.length === 0) {
        showToast(
          skippedTokenNumber 
            ? `Token ${skippedTokenNumber} moved to hold. No available users found in line.` 
            : 'No available users found. Waiting for queue response.',
          'info'
        );
        return { success: true, allUnavailable: true };
      }

      const priorityWeights = currentOrg.rules.priorityWeights;
      const sorted = [...eligibleTokens].sort((a, b) => {
        const weightA = priorityWeights[a.priority] || 10;
        const weightB = priorityWeights[b.priority] || 10;
        if (weightB !== weightA) return weightB - weightA;
        return new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime();
      });

      const nextToken = sorted[0];

      setTokens(prev => prev.map(t => {
        if (t.id === nextToken.id) {
          return {
            ...t,
            status: 'CALLED',
            counterId: counter.id,
            counterNumber: counter.number,
            staffName: counter.currentStaffName || currentUser.name,
            calledAt: now,
            isTemporarilySkipped: false,
            estimatedWaitMinutes: 0,
            concurrencyVersion: (t.concurrencyVersion || 1) + 1
          };
        }
        return t;
      }));

      const voiceAnnouncement = language === 'hi'
        ? `टोकन संख्या ${nextToken.tokenNumber}, कृपया काउंटर ${counter.number} पर आएं।`
        : `Attention please. Token number ${nextToken.tokenNumber.split('').join(' ')}, please proceed to Counter ${counter.number}.`;

      playVoiceChime(voiceAnnouncement);

      addNotification(
        'Now Calling!',
        `Token ${nextToken.tokenNumber} called at Counter ${counter.number}. Please proceed immediately.`,
        nextToken.tokenNumber
      );

      addAuditLog(`Counter ${counter.number} called Token ${nextToken.tokenNumber} (via Smart Skip)`, nextToken.id, `Operator: ${currentUser.name}`);
      showToast(
        skippedTokenNumber 
          ? `Skipped ${skippedTokenNumber} ➔ Now Calling ${nextToken.tokenNumber} at Counter ${counter.number}` 
          : `Calling Token ${nextToken.tokenNumber} at Counter ${counter.number}`, 
        'success'
      );

      return { success: true, token: nextToken };
    } finally {
      concurrencyMutex.releaseLock(lockKey);
    }
  };

  const startService = (tokenId: string): { success: boolean; error?: string } => {
    const auth = SecurityEnforcer.authorizePermission(currentUser, 'QUEUE_COMPLETE', currentOrg.id);
    if (!auth.allowed) {
      showToast(auth.reason || 'Unauthorized.', 'error');
      addAuditLog('UNAUTHORIZED Start Service Attempt', tokenId, auth.reason, 'SECURITY_BLOCKED');
      return { success: false, error: auth.reason };
    }

    const token = tokens.find(t => t.id === tokenId && t.orgId === currentOrg.id);
    if (!token) return { success: false, error: 'Token not found.' };

    const now = new Date().toISOString();
    setTokens(prev => prev.map(t => {
      if (t.id === tokenId) {
        return {
          ...t,
          status: 'IN_SERVICE',
          serviceStartedAt: now,
          isTemporarilySkipped: false
        };
      }
      return t;
    }));

    addAuditLog(`Started consultation for Token ${token.tokenNumber}`, token.id, `Counter: ${token.counterNumber || '1'}, Staff: ${currentUser.name}`);
    showToast(`Citizen present: Consultation started for Token ${token.tokenNumber}`, 'success');
    return { success: true };
  };

  const requeueToken = (tokenId: string): { success: boolean; error?: string } => {
    const auth = SecurityEnforcer.authorizePermission(currentUser, 'QUEUE_HOLD', currentOrg.id);
    if (!auth.allowed) {
      showToast(auth.reason || 'Unauthorized.', 'error');
      addAuditLog('UNAUTHORIZED Re-Queue Attempt', tokenId, auth.reason, 'SECURITY_BLOCKED');
      return { success: false, error: auth.reason };
    }

    const token = tokens.find(t => t.id === tokenId && t.orgId === currentOrg.id);
    if (!token) return { success: false, error: 'Token not found.' };

    setTokens(prev => prev.map(t => {
      if (t.id === tokenId) {
        return {
          ...t,
          status: 'WAITING',
          isTemporarilySkipped: false,
          holdExpiresAt: undefined,
          counterId: undefined,
          counterNumber: undefined
        };
      }
      return t;
    }));

    addNotification('Token Returned to Line', `Token ${token.tokenNumber} has been re-queued to active waiting status.`, token.tokenNumber);
    addAuditLog(`Re-queued Token ${token.tokenNumber} back to active line`, token.id, `Staff: ${currentUser.name}`);
    showToast(`Token ${token.tokenNumber} returned to active waiting queue.`, 'info');
    return { success: true };
  };

  const recallToken = (tokenId: string): { success: boolean; error?: string } => {
    const auth = SecurityEnforcer.authorizePermission(currentUser, 'QUEUE_RECALL', currentOrg.id);
    if (!auth.allowed) {
      showToast(auth.reason || 'Unauthorized.', 'error');
      addAuditLog('UNAUTHORIZED Recall Attempt', tokenId, auth.reason, 'SECURITY_BLOCKED');
      return { success: false, error: auth.reason };
    }

    const token = tokens.find(t => t.id === tokenId && t.orgId === currentOrg.id);
    if (!token) return { success: false, error: 'Token not found.' };

    const counterNum = token.counterNumber || '1';
    const announcement = language === 'hi'
      ? `पुनः सूचना। टोकन संख्या ${token.tokenNumber}, काउंटर ${counterNum} पर संपर्क करें।`
      : `Repeat call. Token number ${token.tokenNumber.split('').join(' ')}, please report to Counter ${counterNum}.`;

    playVoiceChime(announcement);
    showToast(`Re-announced Token ${token.tokenNumber}`, 'info');
    addAuditLog(`Re-announced Token ${token.tokenNumber}`, token.id);
    return { success: true };
  };

  const holdToken = (tokenId: string): { success: boolean; error?: string } => {
    const auth = SecurityEnforcer.authorizePermission(currentUser, 'QUEUE_HOLD', currentOrg.id);
    if (!auth.allowed) {
      showToast(auth.reason || 'Unauthorized.', 'error');
      addAuditLog('UNAUTHORIZED Hold Attempt', tokenId, auth.reason, 'SECURITY_BLOCKED');
      return { success: false, error: auth.reason };
    }

    const token = tokens.find(t => t.id === tokenId && t.orgId === currentOrg.id);
    if (!token) return { success: false, error: 'Token not found.' };

    const expiresAt = new Date(Date.now() + (currentOrg.rules.graceHoldMinutes || 5) * 60 * 1000).toISOString();

    setTokens(prev => prev.map(t => {
      if (t.id === tokenId) {
        return {
          ...t,
          status: 'ON_HOLD',
          holdExpiresAt: expiresAt
        };
      }
      return t;
    }));

    addNotification('Token On Grace Hold', `Token ${token.tokenNumber} placed on 5-min grace hold.`, token.tokenNumber);
    addAuditLog(`Placed Token ${token.tokenNumber} on Grace Hold (5 mins)`, token.id);
    showToast(`Token ${token.tokenNumber} placed on 5-minute hold.`, 'warning');
    return { success: true };
  };

  const resumeHeldToken = (tokenId: string): { success: boolean; error?: string } => {
    const auth = SecurityEnforcer.authorizePermission(currentUser, 'QUEUE_RESUME', currentOrg.id);
    if (!auth.allowed) {
      showToast(auth.reason || 'Unauthorized.', 'error');
      addAuditLog('UNAUTHORIZED Resume Attempt', tokenId, auth.reason, 'SECURITY_BLOCKED');
      return { success: false, error: auth.reason };
    }

    const token = tokens.find(t => t.id === tokenId && t.orgId === currentOrg.id);
    if (!token) return { success: false, error: 'Token not found.' };

    setTokens(prev => prev.map(t => {
      if (t.id === tokenId) {
        return {
          ...t,
          status: 'WAITING',
          priority: 'emergency', // Fast-track recovery to head of queue
          holdExpiresAt: undefined
        };
      }
      return t;
    }));

    showToast(`Token ${token.tokenNumber} returned to front of queue.`, 'success');
    addAuditLog(`Resumed held Token ${token.tokenNumber} with fast-track recovery`, token.id);
    return { success: true };
  };

  const completeService = (tokenId: string): { success: boolean; error?: string } => {
    const auth = SecurityEnforcer.authorizePermission(currentUser, 'QUEUE_COMPLETE', currentOrg.id);
    if (!auth.allowed) {
      showToast(auth.reason || 'Unauthorized.', 'error');
      addAuditLog('UNAUTHORIZED Complete Service Attempt', tokenId, auth.reason, 'SECURITY_BLOCKED');
      return { success: false, error: auth.reason };
    }

    const token = tokens.find(t => t.id === tokenId && t.orgId === currentOrg.id);
    if (!token) return { success: false, error: 'Token not found.' };

    const now = new Date().toISOString();

    setTokens(prev => prev.map(t => {
      if (t.id === tokenId) {
        return {
          ...t,
          status: 'COMPLETED',
          completedAt: now
        };
      }
      return t;
    }));

    addNotification('Service Completed', `Service completed for Token ${token.tokenNumber}. Thank you!`, token.tokenNumber);
    addAuditLog(`Completed service for Token ${token.tokenNumber}`, token.id);
    showToast(`Token ${token.tokenNumber} marked completed.`, 'success');
    return { success: true };
  };

  const transferToken = (tokenId: string, targetServiceId: string): { success: boolean; error?: string } => {
    const auth = SecurityEnforcer.authorizePermission(currentUser, 'QUEUE_TRANSFER', currentOrg.id);
    if (!auth.allowed) {
      showToast(auth.reason || 'Unauthorized.', 'error');
      addAuditLog('UNAUTHORIZED Transfer Attempt', tokenId, auth.reason, 'SECURITY_BLOCKED');
      return { success: false, error: auth.reason };
    }

    const token = tokens.find(t => t.id === tokenId && t.orgId === currentOrg.id);
    if (!token) return { success: false, error: 'Token not found.' };

    let targetService = null;
    let targetDept = null;

    for (const dept of currentOrg.departments) {
      const srv = dept.services.find(s => s.id === targetServiceId);
      if (srv) {
        targetService = srv;
        targetDept = dept;
        break;
      }
    }

    if (!targetService || !targetDept) return { success: false, error: 'Target service not found.' };

    setTokens(prev => prev.map(t => {
      if (t.id === tokenId) {
        return {
          ...t,
          deptId: targetDept!.id,
          deptName: targetDept!.name,
          serviceId: targetService!.id,
          serviceName: targetService!.name,
          serviceNameHi: targetService!.nameHi,
          status: 'WAITING',
          counterId: undefined,
          counterNumber: undefined,
          priority: 'emergency', // High priority continuous care pass
          transferredFrom: token.serviceName
        };
      }
      return t;
    }));

    showToast(`Transferred Token ${token.tokenNumber} to ${targetService.name}!`, 'success');
    addAuditLog(`Transferred Token ${token.tokenNumber} to ${targetService.name}`, token.id);
    return { success: true };
  };

  const markNoShow = (tokenId: string): { success: boolean; error?: string } => {
    const auth = SecurityEnforcer.authorizePermission(currentUser, 'QUEUE_NO_SHOW', currentOrg.id);
    if (!auth.allowed) {
      showToast(auth.reason || 'Unauthorized.', 'error');
      addAuditLog('UNAUTHORIZED No-Show Attempt', tokenId, auth.reason, 'SECURITY_BLOCKED');
      return { success: false, error: auth.reason };
    }

    const token = tokens.find(t => t.id === tokenId && t.orgId === currentOrg.id);
    if (!token) return { success: false, error: 'Token not found.' };

    setTokens(prev => prev.map(t => {
      if (t.id === tokenId) {
        return {
          ...t,
          status: 'NO_SHOW'
        };
      }
      return t;
    }));

    addNotification('Marked No-Show', `Token ${token.tokenNumber} marked as no-show after multiple calls.`, token.tokenNumber);
    addAuditLog(`Marked Token ${token.tokenNumber} as NO_SHOW`, token.id);
    showToast(`Token ${token.tokenNumber} marked as No-Show.`, 'error');
    return { success: true };
  };

  const cancelToken = (tokenId: string): { success: boolean; error?: string } => {
    const token = tokens.find(t => t.id === tokenId);
    if (!token) return { success: false, error: 'Token not found.' };

    // Ownership check: must be owner user OR active guest session OR authorized staff
    const isOwner = (!currentUser.isGuest && token.userId === currentUser.id) || activeCitizenTokenId === tokenId;
    const isStaff = currentUser.role === 'staff' || currentUser.role === 'supervisor' || currentUser.role === 'admin';

    if (!isOwner && !isStaff) {
      showToast('Access Denied: You do not have permission to cancel this token.', 'error');
      addAuditLog('UNAUTHORIZED Token Cancellation Attempt', tokenId, undefined, 'SECURITY_BLOCKED');
      return { success: false, error: 'Unauthorized.' };
    }

    setTokens(prev => prev.map(t => {
      if (t.id === tokenId) {
        return {
          ...t,
          status: 'CANCELLED'
        };
      }
      return t;
    }));

    if (activeCitizenTokenId === tokenId) {
      setActiveCitizenTokenId(null);
    }

    showToast('Token cancelled successfully.', 'info');
    addAuditLog(`Cancelled Token ${token.tokenNumber}`, tokenId);
    addUserActivity('TOKEN_CANCELLED', `Cancelled Token ${token.tokenNumber}`, `Service: ${token.serviceName}`);
    return { success: true };
  };

  const checkInAtEntrance = (tokenId: string): { success: boolean; error?: string } => {
    setTokens(prev => prev.map(t => {
      if (t.id === tokenId) {
        return {
          ...t,
          checkInStatus: 'CHECKED_IN_ENTRANCE'
        };
      }
      return t;
    }));

    showToast(`Arrival verified! You are checked into the lobby.`, 'success');
    addAuditLog(`Entrance QR Check-In verified`, tokenId);
    addUserActivity('CHECK_IN', 'Lobby QR Check-In Verified', 'Arrival registered at facility pod');
    return { success: true };
  };

  // ----------------------------------------------------
  // STAFF INVITATION & MANAGEMENT (ADMIN ONLY)
  // ----------------------------------------------------
  const createStaffInvitation = (
    role: 'staff' | 'supervisor' | 'admin',
    intendedEmail?: string
  ): { success: boolean; invitation?: StaffInvitation; error?: string } => {
    const auth = SecurityEnforcer.authorizePermission(currentUser, 'STAFF_CREATE', currentOrg.id);
    if (!auth.allowed) {
      showToast(auth.reason || 'Unauthorized.', 'error');
      addAuditLog('UNAUTHORIZED Staff Invitation Creation Attempt', undefined, auth.reason, 'SECURITY_BLOCKED');
      return { success: false, error: auth.reason };
    }

    const newInvite: StaffInvitation = {
      id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      code: generateStaffInviteCode(role === 'supervisor' ? 'SUP' : role === 'admin' ? 'ADM' : 'STF'),
      orgId: currentOrg.id,
      orgName: currentOrg.name,
      role,
      intendedEmail: intendedEmail ? sanitizeInput(intendedEmail) : undefined,
      createdBy: currentUser.name,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), // 7 days
      isUsed: false,
      isRevoked: false
    };

    setStaffInvitations(prev => [newInvite, ...prev]);
    showToast(`Created Staff Invitation: ${newInvite.code}`, 'success');
    addAuditLog(`Created Staff Invitation: ${newInvite.code}`, undefined, `Role: ${role}, Org: ${currentOrg.name}`);
    return { success: true, invitation: newInvite };
  };

  const revokeStaffInvitation = (invitationId: string): { success: boolean; error?: string } => {
    const auth = SecurityEnforcer.authorizePermission(currentUser, 'STAFF_DISABLE', currentOrg.id);
    if (!auth.allowed) {
      showToast(auth.reason || 'Unauthorized.', 'error');
      return { success: false, error: auth.reason };
    }

    setStaffInvitations(prev => prev.map(i => i.id === invitationId ? { ...i, isRevoked: true } : i));
    showToast('Staff invitation revoked.', 'info');
    addAuditLog(`Revoked Staff Invitation ID: ${invitationId}`);
    return { success: true };
  };

  const disableStaffAccount = (staffId: string): { success: boolean; error?: string } => {
    const auth = SecurityEnforcer.authorizePermission(currentUser, 'STAFF_DISABLE', currentOrg.id);
    if (!auth.allowed) {
      showToast(auth.reason || 'Unauthorized.', 'error');
      return { success: false, error: auth.reason };
    }

    // If currently logged in as this staff member, disable their session
    if (currentUser.id === staffId) {
      setCurrentUser(prev => ({ ...prev, isStaffDisabled: true }));
    }

    showToast('Staff account deactivated and sessions invalidated.', 'warning');
    addAuditLog(`Deactivated Staff Account: ${staffId}`, undefined, undefined, 'WARNING');
    return { success: true };
  };

  const changeStaffRole = (staffId: string, newRole: UserRole): { success: boolean; error?: string } => {
    const auth = SecurityEnforcer.authorizePermission(currentUser, 'STAFF_ROLE_ASSIGN', currentOrg.id);
    if (!auth.allowed) {
      showToast(auth.reason || 'Unauthorized.', 'error');
      return { success: false, error: auth.reason };
    }

    if (currentUser.id === staffId) {
      setCurrentUser(prev => ({ ...prev, role: newRole }));
    }

    showToast(`Staff role updated to ${newRole.toUpperCase()}.`, 'success');
    addAuditLog(`Assigned Role ${newRole.toUpperCase()} to Staff: ${staffId}`);
    return { success: true };
  };

  // ----------------------------------------------------
  // REGISTERED USER OPERATIONS (USER DASHBOARD)
  // ----------------------------------------------------
  const bookAppointment = (
    serviceId: string,
    scheduledTime: string,
    notes?: string
  ): { success: boolean; appointment?: Appointment; error?: string } => {
    if (currentUser.isGuest) {
      return { success: false, error: 'Please log in or create an account to book advance appointments.' };
    }

    let service = null;
    for (const dept of currentOrg.departments) {
      const s = dept.services.find(srv => srv.id === serviceId);
      if (s) {
        service = s;
        break;
      }
    }

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      userId: currentUser.id,
      orgId: currentOrg.id,
      orgName: currentOrg.name,
      serviceId,
      serviceName: service?.name || 'General Service',
      scheduledTime: sanitizeInput(scheduledTime),
      status: 'CONFIRMED',
      bookingReference: `APT-${currentOrg.type.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: notes ? sanitizeInput(notes) : undefined
    };

    setAppointments(prev => [newApt, ...prev]);
    showToast(`Appointment confirmed! Reference: ${newApt.bookingReference}`, 'success');
    addAuditLog(`Booked Appointment: ${newApt.bookingReference}`, undefined, `Service: ${newApt.serviceName}`);
    addUserActivity('APPOINTMENT_BOOKED', `Booked appointment for ${newApt.serviceName}`, `Ref: ${newApt.bookingReference}`);
    return { success: true, appointment: newApt };
  };

  const cancelAppointment = (appointmentId: string): { success: boolean; error?: string } => {
    setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status: 'CANCELLED' } : a));
    showToast('Appointment cancelled.', 'info');
    addAuditLog(`Cancelled Appointment: ${appointmentId}`);
    addUserActivity('SECURITY_CHANGED', 'Cancelled appointment booking', `ID: ${appointmentId}`);
    return { success: true };
  };

  const updateUserProfile = (profile: Partial<User>): { success: boolean; error?: string } => {
    setCurrentUser(prev => ({
      ...prev,
      ...profile,
      name: profile.name ? sanitizeInput(profile.name) : prev.name,
      email: profile.email ? sanitizeInput(profile.email) : prev.email,
      phone: profile.phone ? sanitizeInput(profile.phone) : prev.phone
    }));

    showToast('Personal profile and notification preferences saved.', 'success');
    addAuditLog('User Profile Updated');
    addUserActivity('PROFILE_UPDATED', 'Updated Personal Profile', 'Contact and preferences updated');
    return { success: true };
  };

  const revokeSession = (sessionId: string) => {
    setCurrentUser(prev => ({
      ...prev,
      sessions: prev.sessions?.filter(s => s.id !== sessionId)
    }));
    showToast('Device session revoked.', 'info');
    addAuditLog(`Revoked Session: ${sessionId}`);
    addUserActivity('SESSION_REVOKED', 'Revoked device session', `Session ID: ${sessionId}`);
  };

  const revokeAllOtherSessions = () => {
    setCurrentUser(prev => ({
      ...prev,
      sessions: prev.sessions?.filter(s => s.isCurrent)
    }));
    showToast('All other device sessions have been invalidated.', 'success');
    addAuditLog('Revoked All Other User Sessions');
    addUserActivity('SESSION_REVOKED', 'Invalidated all other devices', 'High-security session cleanup');
  };

  const linkGuestTokensByContact = (phoneOrEmail: string): number => {
    const cleanContact = phoneOrEmail.trim();
    if (!cleanContact) return 0;

    let matchedCount = 0;
    setTokens(prev => prev.map(t => {
      if (!t.userId && (
        (t.citizenPhone && t.citizenPhone.includes(cleanContact.slice(-4))) ||
        (t.citizenEmail && t.citizenEmail.toLowerCase() === cleanContact.toLowerCase())
      )) {
        matchedCount++;
        return {
          ...t,
          userId: currentUser.id
        };
      }
      return t;
    }));

    if (matchedCount > 0) {
      showToast(`Linked ${matchedCount} previous guest token(s) to your account!`, 'success');
      addAuditLog(`Linked ${matchedCount} Guest Tokens to User Account: ${currentUser.id}`);
      addUserActivity('PROFILE_UPDATED', `Linked ${matchedCount} historical tokens`, 'Identity claim verified');
    } else {
      showToast('No unlinked guest tokens matching this contact were found.', 'info');
    }
    return matchedCount;
  };

  const deleteUserAccount = () => {
    // Separate personal data deletion from anonymized audit retention
    addAuditLog('User Requested GDPR/DPDP Account Deletion', undefined, 'PII Anonymized, operational records preserved');
    logout();
    showToast('Your personal account and credentials have been permanently deleted.', 'info');
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const exportAuditLogsCSV = () => {
    const headers = ['ID,Timestamp,Actor,Role,Action,ThreatLevel,TargetToken,OrgID,MaskedDetails,IP'];
    const rows = auditLogs.map(l => 
      `"${l.id}","${l.timestamp}","${l.actor}","${l.role}","${l.action}","${l.threatLevel || 'INFO'}","${l.targetTokenId || ''}","${l.targetOrgId || ''}","${l.maskedDetails}","${l.ipAddress || ''}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `queueless_security_audit_${currentOrg.id}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Audit Log CSV exported successfully.', 'success');
  };

  // Real-time Queue Stats for Active Org
  const stats = useMemo(() => {
    const orgTokens = tokens.filter(t => t.orgId === currentOrg.id);
    const waiting = orgTokens.filter(t => t.status === 'WAITING').length;
    const served = orgTokens.filter(t => t.status === 'COMPLETED').length;
    const noShows = orgTokens.filter(t => t.status === 'NO_SHOW').length;
    const activeCounters = currentOrg.counters.filter(c => c.isOnline).length;
    
    const avgWait = waiting > 0 ? Math.round((waiting * 5) / Math.max(1, activeCounters)) : 0;

    return {
      totalWaiting: waiting,
      totalServedToday: served,
      avgWaitMinutes: avgWait,
      noShowCount: noShows,
      activeCounters
    };
  }, [tokens, currentOrg]);

  return (
    <QueueContext.Provider
      value={{
        organizations,
        activeOrgId,
        currentOrg,
        switchOrganization,
        createOrganization,
        updateOrganization,

        tokens: tokens.filter(t => t.orgId === currentOrg.id),
        activeCitizenToken,
        setActiveCitizenTokenId,
        userTokens,

        currentUser,
        setCurrentUser,
        loginAsGuest,
        loginAsRegisteredUser,
        loginAsStaffWithInvite,
        loginAsDemoRole,
        logout,
        reAuthenticate,

        currentView,
        setCurrentView,

        language,
        setLanguage,
        theme,
        setTheme,

        joinQueue,
        callNext,
        skipAndCallNext,
        recallToken,
        holdToken,
        requeueToken,
        resumeHeldToken,
        startService,
        completeService,
        transferToken,
        markNoShow,
        cancelToken,
        checkInAtEntrance,

        staffInvitations,
        createStaffInvitation,
        revokeStaffInvitation,
        disableStaffAccount,
        changeStaffRole,

        appointments,
        bookAppointment,
        cancelAppointment,
        userActivities,
        updateUserProfile,
        revokeSession,
        revokeAllOtherSessions,
        linkGuestTokensByContact,
        deleteUserAccount,

        requestOtp,
        verifyOtp,
        notifications,
        markNotificationAsRead,
        clearNotifications,
        auditLogs,
        exportAuditLogsCSV,
        playVoiceChime,
        toastMessage,
        showToast,
        stats
      }}
    >
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};
