export interface SpendingPolicy {
  enabled: boolean;
  maxPerTransactionSOL: number;
  maxSessionBudgetSOL: number;
  currentSessionSpentSOL: number;
  requireManualApprovalAboveSOL: number;
  whitelistedServices: string[]; // empty means all allowed
  whitelistedRecipients: string[]; // empty means all allowed
  allowedNetworks: string[];
  allowedTokens: string[];
  autoPayEnabled: boolean;
  rateLimitPerHour: number;
  currentTxCountHour: number;
}

const STORAGE_KEY = "agent_x402_spending_policy";

export const defaultSpendingPolicy: SpendingPolicy = {
  enabled: true,
  maxPerTransactionSOL: 0.05,
  maxSessionBudgetSOL: 0.50,
  currentSessionSpentSOL: 0.025,
  requireManualApprovalAboveSOL: 0.01,
  whitelistedServices: [],
  whitelistedRecipients: [],
  allowedNetworks: ["solana-devnet", "solana-mainnet"],
  allowedTokens: ["SOL", "USDC"],
  autoPayEnabled: true,
  rateLimitPerHour: 50,
  currentTxCountHour: 3,
};

export function getSpendingPolicy(): SpendingPolicy {
  if (typeof window === "undefined") return defaultSpendingPolicy;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSpendingPolicy));
      return defaultSpendingPolicy;
    }
    return JSON.parse(raw);
  } catch {
    return defaultSpendingPolicy;
  }
}

export function saveSpendingPolicy(policy: SpendingPolicy): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(policy));
  } catch (err) {
    console.error("Failed to save spending policy:", err);
  }
}

export function evaluateSpendingPolicy(request: {
  serviceId?: string;
  recipient: string;
  amountSOL: number;
  token: string;
  network: string;
}): {
  allowed: boolean;
  requiresManualApproval: boolean;
  reason?: string;
} {
  const policy = getSpendingPolicy();

  if (!policy.enabled) {
    return { allowed: true, requiresManualApproval: false };
  }

  // 1. Network check
  if (!policy.allowedNetworks.includes(request.network)) {
    return {
      allowed: false,
      requiresManualApproval: false,
      reason: `Network ${request.network} is not in the allowed policy whitelist (${policy.allowedNetworks.join(", ")}).`,
    };
  }

  // 2. Token check
  if (!policy.allowedTokens.includes(request.token)) {
    return {
      allowed: false,
      requiresManualApproval: false,
      reason: `Token ${request.token} is not permitted by policy.`,
    };
  }

  // 3. Max per transaction
  if (request.amountSOL > policy.maxPerTransactionSOL) {
    return {
      allowed: false,
      requiresManualApproval: false,
      reason: `Requested ${request.amountSOL} SOL exceeds max per-transaction policy limit of ${policy.maxPerTransactionSOL} SOL.`,
    };
  }

  // 4. Session budget
  if (policy.currentSessionSpentSOL + request.amountSOL > policy.maxSessionBudgetSOL) {
    return {
      allowed: false,
      requiresManualApproval: false,
      reason: `Payment would exceed total session spending budget (${(policy.currentSessionSpentSOL + request.amountSOL).toFixed(3)} / ${policy.maxSessionBudgetSOL} SOL).`,
    };
  }

  // 5. Whitelisted services
  if (policy.whitelistedServices.length > 0 && request.serviceId) {
    if (!policy.whitelistedServices.includes(request.serviceId)) {
      return {
        allowed: false,
        requiresManualApproval: false,
        reason: `Service '${request.serviceId}' is not authorized in the policy whitelist.`,
      };
    }
  }

  // 6. Check if manual approval is required
  const requiresManualApproval =
    !policy.autoPayEnabled || request.amountSOL >= policy.requireManualApprovalAboveSOL;

  return {
    allowed: true,
    requiresManualApproval,
    reason: requiresManualApproval
      ? `Payment of ${request.amountSOL} SOL requires explicit human authorization (threshold: ${policy.requireManualApprovalAboveSOL} SOL).`
      : undefined,
  };
}

export function recordPolicySpend(amountSOL: number): void {
  const policy = getSpendingPolicy();
  policy.currentSessionSpentSOL = Number((policy.currentSessionSpentSOL + amountSOL).toFixed(4));
  policy.currentTxCountHour += 1;
  saveSpendingPolicy(policy);
}

export function resetSessionBudget(): void {
  const policy = getSpendingPolicy();
  policy.currentSessionSpentSOL = 0;
  saveSpendingPolicy(policy);
}
