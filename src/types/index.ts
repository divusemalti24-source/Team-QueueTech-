export type UserRole = 
  | 'guest' 
  | 'citizen' 
  | 'staff' 
  | 'supervisor' 
  | 'admin' 
  | 'kiosk' 
  | 'display'
  | 'super_admin';

export type StaffRole = 'staff' | 'supervisor' | 'admin';

export type OrganizationType = 
  | 'hospital' 
  | 'government' 
  | 'bank' 
  | 'university' 
  | 'airport' 
  | 'customer_service' 
  | 'other';

export type PriorityCategory = 
  | 'standard' 
  | 'senior' 
  | 'differently_abled' 
  | 'emergency' 
  | 'vip';

export type TokenStatus = 
  | 'WAITING' 
  | 'CALLED' 
  | 'IN_SERVICE' 
  | 'ON_HOLD' 
  | 'TRANSFERRED' 
  | 'COMPLETED' 
  | 'NO_SHOW' 
  | 'CANCELLED';

export type TokenType = 'DIGITAL' | 'PHYSICAL_KIOSK';

export type Language = 'en' | 'hi';
export type ThemeMode = 'light' | 'dark';

export type StaffPermission = 
  | 'TOKEN_CREATE'
  | 'TOKEN_VIEW_OWN'
  | 'TOKEN_CANCEL_OWN'
  | 'QUEUE_VIEW'
  | 'QUEUE_CALL_NEXT'
  | 'QUEUE_RECALL'
  | 'QUEUE_HOLD'
  | 'QUEUE_RESUME'
  | 'QUEUE_COMPLETE'
  | 'QUEUE_NO_SHOW'
  | 'QUEUE_TRANSFER'
  | 'STATION_MANAGE'
  | 'STAFF_VIEW'
  | 'STAFF_CREATE'
  | 'STAFF_DISABLE'
  | 'STAFF_ROLE_ASSIGN'
  | 'STAFF_INVITE_CREATE'
  | 'STAFF_ACCOUNT_MANAGE'
  | 'SERVICE_MANAGE'
  | 'QUEUE_MANAGE'
  | 'ORGANIZATION_MANAGE'
  | 'ANALYTICS_VIEW'
  | 'AUDIT_VIEW'
  | 'AUDIT_LOG_EXPORT';

export interface UserSession {
  id: string;
  userId: string;
  userAgent: string;
  ipMasked: string;
  createdAt: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface UserActivity {
  id: string;
  userId: string;
  timestamp: string;
  type: 'TOKEN_CREATED' | 'TOKEN_CANCELLED' | 'PROFILE_UPDATED' | 'SECURITY_CHANGED' | 'SESSION_REVOKED' | 'CHECK_IN' | 'APPOINTMENT_BOOKED';
  title: string;
  description: string;
  orgName: string;
}

export interface Appointment {
  id: string;
  userId: string;
  orgId: string;
  orgName: string;
  serviceId: string;
  serviceName: string;
  scheduledTime: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';
  bookingReference: string;
  counterEstimated?: string;
  notes?: string;
}

export interface StaffInvitation {
  id: string;
  code: string; // e.g. QLESS-STF-8F4K29
  orgId: string;
  orgName?: string;
  email?: string;
  intendedEmail?: string;
  intendedMobile?: string;
  role: StaffRole;
  deptId?: string;
  permissions?: StaffPermission[];
  createdAt: string;
  expiresAt: string;
  isUsed?: boolean;
  isRedeemed?: boolean;
  redeemedAt?: string;
  redeemedByName?: string;
  usedBy?: string;
  isRevoked: boolean;
  createdBy?: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  orgId?: string; // Authorized organization for staff/admin
  orgMemberships?: Array<{
    orgId: string;
    orgName: string;
    role: UserRole;
    permissions: StaffPermission[];
  }>;
  assignedCounterId?: string;
  avatar?: string;
  isGuest: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  authProvider?: 'google' | 'email_otp' | 'mobile_otp' | 'staff_invitation' | 'guest';
  sessions?: UserSession[];
  notificationPrefs?: {
    sms: boolean;
    email: boolean;
    inApp: boolean;
  };
  isStaffDisabled?: boolean;
  staffInvitationCodeUsed?: string;
  lastLoginAt?: string;
}

export interface Service {
  id: string;
  deptId: string;
  name: string;
  nameHi: string;
  code: string;
  avgServiceTimeMinutes: number;
  description: string;
  isActive: boolean;
  requiresAuth: boolean;
  color: string;
  iconName: string;
}

export interface Department {
  id: string;
  name: string;
  nameHi: string;
  description: string;
  services: Service[];
}

export interface Counter {
  id: string;
  number: string;
  name: string;
  deptId: string;
  serviceIds: string[];
  currentStaffId?: string;
  currentStaffName?: string;
  isOnline: boolean;
  isFlexCounter?: boolean;
  servingTokenId?: string;
}

export interface QueueToken {
  id: string;
  tokenNumber: string;
  secureTrackingRef: string; // Random unguessable reference for tracking e.g. TRK-9F8A2B
  orgId: string;
  deptId: string;
  deptName: string;
  serviceId: string;
  serviceName: string;
  serviceNameHi: string;
  citizenName: string;
  citizenPhone?: string;
  citizenEmail?: string;
  userId?: string; // Linked registered user ID for BOLA/IDOR verification
  type: TokenType;
  priority: PriorityCategory;
  status: TokenStatus;
  counterId?: string;
  counterNumber?: string;
  staffName?: string;
  assignedCounterId?: string;
  assignedCounterNumber?: string;
  issuedAt: string; // ISO String
  calledAt?: string;
  serviceStartedAt?: string;
  completedAt?: string;
  estimatedWaitMinutes: number;
  holdExpiresAt?: string;
  isTemporarilySkipped?: boolean;
  skipCount?: number;
  lastSkippedAt?: string;
  transferredFrom?: string;
  linkedJourney?: {
    currentStep: number;
    steps: Array<{
      stepNumber: number;
      serviceName: string;
      status: 'pending' | 'active' | 'completed';
    }>;
  };
  checkInStatus: 'NOT_ARRIVED' | 'CHECKED_IN_ENTRANCE';
  staggeredWindow?: {
    recommendedArrival: string;
    windowStart: string;
    windowEnd: string;
  };
  concurrencyVersion?: number; // Mutex / atomic update guard
}

export interface Organization {
  id: string;
  name: string;
  nameHi: string;
  tagline: string;
  type: OrganizationType;
  logoIcon: string;
  brandColor: string;
  departments: Department[];
  counters: Counter[];
  rules: {
    allowGuestAccess: boolean;
    requirePhoneForDigital: boolean;
    graceHoldMinutes: number;
    enableStaggeredArrival: boolean;
    enableVoiceAnnouncements: boolean;
    maxActiveTokensPerUser: number;
    tokenCooldownMinutes: number;
    responseWindowSeconds?: number;
    smartSkipEnabled?: boolean;
    showQueuePosition?: boolean;
    showPeopleAhead?: boolean;
    showEstimatedTime?: boolean; // OFF by default
    showCounter?: boolean;
    showServiceStatus?: boolean;
    priorityWeights: {
      emergency: number;
      differently_abled: number;
      senior: number;
      standard: number;
      vip?: number;
    };
  };
  integrations: {
    sms: { enabled: boolean; provider: string; status: 'configured' | 'unconfigured' };
    email: { enabled: boolean; provider: string; status: 'configured' | 'unconfigured' };
    thermalPrinter: { enabled: boolean; status: 'configured' | 'unconfigured' };
    webhooks: { enabled: boolean; status: 'configured' | 'unconfigured' };
  };
}

export interface AppNotification {
  id: string;
  tokenNumber: string;
  title: string;
  message: string;
  channel: 'IN_APP' | 'SMS' | 'EMAIL';
  timestamp: string;
  read: boolean;
  status: 'DELIVERED' | 'CONFIG_REQUIRED';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor?: string;
  userId?: string;
  userName?: string;
  userRole?: UserRole;
  role?: UserRole;
  action: string;
  status?: 'ALLOWED' | 'DENIED' | 'FLAGGED';
  statusCode?: number;
  threatCategory?: string;
  target?: string;
  targetTokenId?: string;
  targetOrgId?: string;
  details?: any;
  maskedDetails?: string;
  ipAddress?: string;
  threatLevel?: 'INFO' | 'WARNING' | 'ALERT' | 'SECURITY_BLOCKED';
}
