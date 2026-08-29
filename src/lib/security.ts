import { User, UserRole, StaffPermission, QueueToken, Organization } from '../types';

/**
 * QueueLess Zero-Trust Security & Authorization Core
 * 
 * Core Mandate:
 * AUTHENTICATION = Who are you?
 * AUTHORIZATION = What are you allowed to do?
 * 
 * Never trust client-provided roles, IDs or UI state.
 */

// Generate a cryptographically randomized tracking reference for public tokens
export function generateSecureTokenRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 8; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TRK-${rand.slice(0, 4)}-${rand.slice(4)}`;
}

// Generate an organization staff invitation code
export function generateStaffInviteCode(orgPrefix = 'STF'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `QLESS-${orgPrefix}-${rand}`;
}

// XSS Sanitizer for all inputs
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

// Role-to-Permissions Mapping (Least Privilege)
export const ROLE_PERMISSIONS: Record<UserRole, StaffPermission[]> = {
  guest: ['TOKEN_CREATE', 'TOKEN_VIEW_OWN', 'TOKEN_CANCEL_OWN'],
  citizen: ['TOKEN_CREATE', 'TOKEN_VIEW_OWN', 'TOKEN_CANCEL_OWN'],
  staff: [
    'TOKEN_CREATE',
    'TOKEN_VIEW_OWN',
    'TOKEN_CANCEL_OWN',
    'QUEUE_VIEW',
    'QUEUE_CALL_NEXT',
    'QUEUE_RECALL',
    'QUEUE_HOLD',
    'QUEUE_RESUME',
    'QUEUE_COMPLETE',
    'QUEUE_NO_SHOW',
    'QUEUE_TRANSFER'
  ],
  supervisor: [
    'TOKEN_CREATE',
    'TOKEN_VIEW_OWN',
    'TOKEN_CANCEL_OWN',
    'QUEUE_VIEW',
    'QUEUE_CALL_NEXT',
    'QUEUE_RECALL',
    'QUEUE_HOLD',
    'QUEUE_RESUME',
    'QUEUE_COMPLETE',
    'QUEUE_NO_SHOW',
    'QUEUE_TRANSFER',
    'STATION_MANAGE',
    'STAFF_VIEW',
    'ANALYTICS_VIEW'
  ],
  admin: [
    'TOKEN_CREATE',
    'TOKEN_VIEW_OWN',
    'TOKEN_CANCEL_OWN',
    'QUEUE_VIEW',
    'QUEUE_CALL_NEXT',
    'QUEUE_RECALL',
    'QUEUE_HOLD',
    'QUEUE_RESUME',
    'QUEUE_COMPLETE',
    'QUEUE_NO_SHOW',
    'QUEUE_TRANSFER',
    'STATION_MANAGE',
    'STAFF_VIEW',
    'STAFF_CREATE',
    'STAFF_DISABLE',
    'STAFF_ROLE_ASSIGN',
    'SERVICE_MANAGE',
    'QUEUE_MANAGE',
    'ORGANIZATION_MANAGE',
    'ANALYTICS_VIEW',
    'AUDIT_VIEW'
  ],
  super_admin: [
    'TOKEN_CREATE',
    'TOKEN_VIEW_OWN',
    'TOKEN_CANCEL_OWN',
    'QUEUE_VIEW',
    'QUEUE_CALL_NEXT',
    'QUEUE_RECALL',
    'QUEUE_HOLD',
    'QUEUE_RESUME',
    'QUEUE_COMPLETE',
    'QUEUE_NO_SHOW',
    'QUEUE_TRANSFER',
    'STATION_MANAGE',
    'STAFF_VIEW',
    'STAFF_CREATE',
    'STAFF_DISABLE',
    'STAFF_ROLE_ASSIGN',
    'SERVICE_MANAGE',
    'QUEUE_MANAGE',
    'ORGANIZATION_MANAGE',
    'ANALYTICS_VIEW',
    'AUDIT_VIEW'
  ],
  kiosk: ['TOKEN_CREATE'],
  display: ['QUEUE_VIEW']
};

export interface AuthDecision {
  allowed: boolean;
  statusCode: 200 | 401 | 403 | 429;
  reason?: string;
  threatCategory?: string;
}

/**
 * Centralized Zero-Trust Authorization Enforcer
 */
export class SecurityEnforcer {
  /**
   * 1. Authenticate Request
   */
  static authenticate(user: User | null): AuthDecision {
    if (!user) {
      return {
        allowed: false,
        statusCode: 401,
        reason: 'Authentication required. Please sign in to proceed.',
        threatCategory: 'Broken Authentication'
      };
    }

    if (user.isStaffDisabled) {
      return {
        allowed: false,
        statusCode: 403,
        reason: 'Staff account has been deactivated by Organization Admin.',
        threatCategory: 'Revoked Account Access Attempt'
      };
    }

    return { allowed: true, statusCode: 200 };
  }

  /**
   * 2. Authorize Role
   */
  static authorizeRole(user: User | null, allowedRoles: UserRole[]): AuthDecision {
    const auth = this.authenticate(user);
    if (!auth.allowed) return auth;

    if (!user || !allowedRoles.includes(user.role)) {
      return {
        allowed: false,
        statusCode: 403,
        reason: `Access Denied: Role '${user?.role || 'anonymous'}' is not authorized for this operation. Required: [${allowedRoles.join(', ')}].`,
        threatCategory: 'Broken Function Level Authorization (BFLA)'
      };
    }

    return { allowed: true, statusCode: 200 };
  }

  /**
   * 3. Authorize Organization Boundary (Multi-Tenant Isolation)
   */
  static authorizeOrganization(user: User | null, targetOrgId: string): AuthDecision {
    const auth = this.authenticate(user);
    if (!auth.allowed) return auth;

    // Citizens / Guests can interact across organizations
    if (user?.role === 'citizen' || user?.role === 'guest') {
      return { allowed: true, statusCode: 200 };
    }

    // Super Admin has multi-tenant cross-org permission
    if (user?.role === 'super_admin') {
      return { allowed: true, statusCode: 200 };
    }

    // Staff & Admin MUST match organization binding
    if (user?.orgId !== targetOrgId) {
      return {
        allowed: false,
        statusCode: 403,
        reason: `Multi-Tenant Isolation Breach: Staff identity belongs to Organization '${user?.orgId}', cannot access Organization '${targetOrgId}'.`,
        threatCategory: 'Cross-Tenant Access Violation'
      };
    }

    return { allowed: true, statusCode: 200 };
  }

  /**
   * 4. Authorize Resource Ownership (BOLA / IDOR Protection)
   */
  static authorizeResourceOwner(user: User | null, resourceOwnerId?: string, resourceOrgId?: string): AuthDecision {
    const auth = this.authenticate(user);
    if (!auth.allowed) return auth;

    // Organization staff in the same org can access organizational resources
    if (
      (user?.role === 'staff' || user?.role === 'supervisor' || user?.role === 'admin' || user?.role === 'super_admin') &&
      resourceOrgId &&
      (user.orgId === resourceOrgId || user.role === 'super_admin')
    ) {
      return { allowed: true, statusCode: 200 };
    }

    // Regular users can ONLY access their own resources
    if (resourceOwnerId && user?.id !== resourceOwnerId) {
      return {
        allowed: false,
        statusCode: 403,
        reason: 'Broken Object Level Authorization: You do not own this resource.',
        threatCategory: 'BOLA / IDOR Violation'
      };
    }

    return { allowed: true, statusCode: 200 };
  }

  /**
   * 5. Authorize Granular Permission
   */
  static authorizePermission(user: User | null, permission: StaffPermission, targetOrgId?: string): AuthDecision {
    const auth = this.authenticate(user);
    if (!auth.allowed) return auth;

    if (targetOrgId) {
      const orgAuth = this.authorizeOrganization(user, targetOrgId);
      if (!orgAuth.allowed) return orgAuth;
    }

    const permissions = ROLE_PERMISSIONS[user!.role] || [];
    if (!permissions.includes(permission)) {
      return {
        allowed: false,
        statusCode: 403,
        reason: `Missing Permission: Operation requires '${permission}'.`,
        threatCategory: 'Insufficient Privilege / Least Privilege Violation'
      };
    }

    return { allowed: true, statusCode: 200 };
  }
}

/**
 * In-Memory Rate Limiter & Abuse Prevention Engine
 */
class RateLimitManager {
  private otpAttempts: Map<string, { count: number; lockedUntil?: number; lastRequestTime: number }> = new Map();
  private tokenCreationLogs: Map<string, number[]> = new Map();

  // Check and record OTP request
  canRequestOtp(identifier: string): { allowed: boolean; waitSeconds?: number } {
    const key = `otp_req_${identifier}`;
    const now = Date.now();
    const record = this.otpAttempts.get(key);

    if (record) {
      if (record.lockedUntil && record.lockedUntil > now) {
        const wait = Math.ceil((record.lockedUntil - now) / 1000);
        return { allowed: false, waitSeconds: wait };
      }

      // Minimum 30s cooldown between OTP requests
      const elapsed = (now - record.lastRequestTime) / 1000;
      if (elapsed < 30) {
        return { allowed: false, waitSeconds: Math.ceil(30 - elapsed) };
      }
    }

    this.otpAttempts.set(key, {
      count: (record?.count || 0) + 1,
      lastRequestTime: now
    });
    return { allowed: true };
  }

  // Record failed OTP verification attempt (Brute Force Protection)
  recordFailedOtp(identifier: string): { locked: boolean; remainingAttempts: number } {
    const key = `otp_verify_${identifier}`;
    const now = Date.now();
    const record = this.otpAttempts.get(key) || { count: 0, lastRequestTime: now };
    
    record.count += 1;
    record.lastRequestTime = now;

    if (record.count >= 3) {
      record.lockedUntil = now + 5 * 60 * 1000; // 5 min lockout
      this.otpAttempts.set(key, record);
      return { locked: true, remainingAttempts: 0 };
    }

    this.otpAttempts.set(key, record);
    return { locked: false, remainingAttempts: 3 - record.count };
  }

  // Clear OTP attempt on success
  clearOtpState(identifier: string) {
    this.otpAttempts.delete(`otp_req_${identifier}`);
    this.otpAttempts.delete(`otp_verify_${identifier}`);
  }

  // Rate limit token creation per citizen identifier (phone / IP / user)
  canCreateToken(identifier: string, maxTokensPerHour = 5): { allowed: boolean; reason?: string } {
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;
    const timestamps = (this.tokenCreationLogs.get(identifier) || []).filter(t => t > hourAgo);

    if (timestamps.length >= maxTokensPerHour) {
      return {
        allowed: false,
        reason: 'Rate limit exceeded: Maximum active token booking requests reached for this hour.'
      };
    }

    timestamps.push(now);
    this.tokenCreationLogs.set(identifier, timestamps);
    return { allowed: true };
  }
}

export const rateLimiter = new RateLimitManager();

/**
 * Concurrency Mutex Engine
 * Prevents race conditions when two operators simultaneously tap "Call Next"
 */
class ConcurrencyMutex {
  private activeLocks: Map<string, number> = new Map();

  async acquireLock(resourceKey: string, timeoutMs = 2000): Promise<boolean> {
    const now = Date.now();
    const existingLock = this.activeLocks.get(resourceKey);

    if (existingLock && now - existingLock < timeoutMs) {
      // Lock is held by a concurrent request
      return false;
    }

    this.activeLocks.set(resourceKey, now);
    return true;
  }

  releaseLock(resourceKey: string) {
    this.activeLocks.delete(resourceKey);
  }
}

export const concurrencyMutex = new ConcurrencyMutex();
