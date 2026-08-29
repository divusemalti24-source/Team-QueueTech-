import { QueueToken, Organization } from '../types';

export interface TurnStatusResult {
  state: 'WAITING' | 'APPROACHING' | 'NEXT' | 'CALLED' | 'IN_SERVICE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'TRANSFERRED';
  turnBadge: string;
  headline: string;
  subtext: string;
  nowServingTokenNumber: string;
  peopleAhead: number;
  queuePosition: number;
  assignedCounter: string;
  isTurnNow: boolean;
  isNextTurn: boolean;
  isApproaching: boolean;
  colorClass: {
    badgeBg: string;
    badgeText: string;
    border: string;
    glow: string;
  };
}

/**
 * Deterministically computes the universal Turn-Based Queue Status
 * without relying on misleading minute-based time estimates.
 */
export function calculateTurnStatus(
  token: QueueToken | null | undefined,
  allTokens: QueueToken[],
  org?: Organization
): TurnStatusResult {
  if (!token) {
    return {
      state: 'WAITING',
      turnBadge: 'NO ACTIVE PASS',
      headline: 'No Active Pass',
      subtext: 'Generate an instant digital pass to join the queue.',
      nowServingTokenNumber: '---',
      peopleAhead: 0,
      queuePosition: 0,
      assignedCounter: 'Pending',
      isTurnNow: false,
      isNextTurn: false,
      isApproaching: false,
      colorClass: {
        badgeBg: 'bg-slate-800',
        badgeText: 'text-slate-300',
        border: 'border-slate-700',
        glow: 'shadow-none'
      }
    };
  }

  // 1. Identify currently serving/calling token for this service or organization
  const activeServing = allTokens.find(
    t => t.orgId === token.orgId &&
         t.serviceId === token.serviceId &&
         (t.status === 'CALLED' || t.status === 'IN_SERVICE')
  ) || allTokens.find(
    t => t.orgId === token.orgId &&
         (t.status === 'CALLED' || t.status === 'IN_SERVICE')
  );

  const nowServingTokenNumber = activeServing ? activeServing.tokenNumber : 'None (Next in Line)';

  const assignedCounter = token.counterNumber ? `Counter ${token.counterNumber}` : 'Auto-allocating';

  // 2. Handle non-waiting active terminal states
  if (token.status === 'CALLED') {
    return {
      state: 'CALLED',
      turnBadge: "IT'S YOUR TURN",
      headline: `Please proceed to ${token.counterNumber ? `Counter ${token.counterNumber}` : 'your assigned counter'}`,
      subtext: 'Your token is now being called. Please proceed immediately.',
      nowServingTokenNumber: token.tokenNumber,
      peopleAhead: 0,
      queuePosition: 0,
      assignedCounter,
      isTurnNow: true,
      isNextTurn: false,
      isApproaching: false,
      colorClass: {
        badgeBg: 'bg-emerald-500',
        badgeText: 'text-slate-950',
        border: 'border-emerald-500 ring-4 ring-emerald-500/20',
        glow: 'shadow-lg shadow-emerald-500/30'
      }
    };
  }

  if (token.status === 'IN_SERVICE') {
    return {
      state: 'IN_SERVICE',
      turnBadge: 'IN SERVICE',
      headline: 'Service in progress.',
      subtext: `Currently being served at ${assignedCounter}.`,
      nowServingTokenNumber: token.tokenNumber,
      peopleAhead: 0,
      queuePosition: 0,
      assignedCounter,
      isTurnNow: false,
      isNextTurn: false,
      isApproaching: false,
      colorClass: {
        badgeBg: 'bg-sky-600',
        badgeText: 'text-white',
        border: 'border-sky-500',
        glow: 'shadow-md shadow-sky-500/20'
      }
    };
  }

  if (token.status === 'ON_HOLD') {
    return {
      state: 'ON_HOLD',
      turnBadge: 'ON HOLD',
      headline: '5-Minute Grace Hold Active',
      subtext: 'Please approach the counter officer to resume your turn.',
      nowServingTokenNumber,
      peopleAhead: 0,
      queuePosition: 0,
      assignedCounter,
      isTurnNow: false,
      isNextTurn: false,
      isApproaching: false,
      colorClass: {
        badgeBg: 'bg-amber-500',
        badgeText: 'text-slate-950',
        border: 'border-amber-500',
        glow: 'shadow-md shadow-amber-500/20'
      }
    };
  }

  if (token.status === 'COMPLETED') {
    return {
      state: 'COMPLETED',
      turnBadge: 'COMPLETED',
      headline: 'Service completed.',
      subtext: 'Your turn has been completed successfully.',
      nowServingTokenNumber,
      peopleAhead: 0,
      queuePosition: 0,
      assignedCounter,
      isTurnNow: false,
      isNextTurn: false,
      isApproaching: false,
      colorClass: {
        badgeBg: 'bg-slate-700',
        badgeText: 'text-slate-200',
        border: 'border-slate-700',
        glow: 'shadow-none'
      }
    };
  }

  if (token.status === 'CANCELLED' || token.status === 'NO_SHOW') {
    return {
      state: token.status,
      turnBadge: token.status === 'CANCELLED' ? 'CANCELLED' : 'MISSED TURN',
      headline: 'Pass Inactive',
      subtext: 'This pass is no longer active in the waiting queue.',
      nowServingTokenNumber,
      peopleAhead: 0,
      queuePosition: 0,
      assignedCounter,
      isTurnNow: false,
      isNextTurn: false,
      isApproaching: false,
      colorClass: {
        badgeBg: 'bg-rose-500/20',
        badgeText: 'text-rose-400',
        border: 'border-rose-500/30',
        glow: 'shadow-none'
      }
    };
  }

  // 3. For WAITING tokens: Determine deterministic rank in the line
  const priorityWeights = org?.rules?.priorityWeights || {
    emergency: 100,
    differently_abled: 50,
    senior: 30,
    standard: 10,
    vip: 80
  };

  const waitingForService = allTokens
    .filter(t => t.orgId === token.orgId && t.serviceId === token.serviceId && t.status === 'WAITING')
    .sort((a, b) => {
      const weightA = priorityWeights[a.priority] || 10;
      const weightB = priorityWeights[b.priority] || 10;
      if (weightB !== weightA) return weightB - weightA;
      return new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime();
    });

  const index = waitingForService.findIndex(t => t.id === token.id);
  const peopleAhead = index >= 0 ? index : 0;
  const queuePosition = peopleAhead + 1;

  // 4. Multi-stage Turn Progression messaging
  if (peopleAhead === 0) {
    // Next in line
    return {
      state: 'NEXT',
      turnBadge: 'NEXT TURN — BE PREPARED',
      headline: "You're next — please be ready.",
      subtext: 'Next turn — be prepared. Your counter will be announced momentarily.',
      nowServingTokenNumber,
      peopleAhead: 0,
      queuePosition: 1,
      assignedCounter,
      isTurnNow: false,
      isNextTurn: true,
      isApproaching: true,
      colorClass: {
        badgeBg: 'bg-indigo-600',
        badgeText: 'text-white',
        border: 'border-indigo-500 ring-2 ring-indigo-500/30',
        glow: 'shadow-lg shadow-indigo-500/25'
      }
    };
  }

  if (peopleAhead <= 2) {
    // Close to turn (Position 2 or 3)
    return {
      state: 'APPROACHING',
      turnBadge: 'YOUR TURN IS COMING UP',
      headline: 'Your turn is coming up.',
      subtext: `Only ${peopleAhead} ${peopleAhead === 1 ? 'person' : 'people'} ahead. Please stay nearby.`,
      nowServingTokenNumber,
      peopleAhead,
      queuePosition,
      assignedCounter,
      isTurnNow: false,
      isNextTurn: false,
      isApproaching: true,
      colorClass: {
        badgeBg: 'bg-sky-500/20',
        badgeText: 'text-sky-600 dark:text-sky-300',
        border: 'border-sky-500/40',
        glow: 'shadow-sm'
      }
    };
  }

  // Position far away
  return {
    state: 'WAITING',
    turnBadge: 'WAITING IN QUEUE',
    headline: 'Your turn is approaching.',
    subtext: "You're in the queue. Please keep your phone nearby.",
    nowServingTokenNumber,
    peopleAhead,
    queuePosition,
    assignedCounter,
    isTurnNow: false,
    isNextTurn: false,
    isApproaching: false,
    colorClass: {
      badgeBg: 'bg-slate-200 dark:bg-slate-800',
      badgeText: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-300 dark:border-slate-700',
      glow: 'shadow-none'
    }
  };
}
