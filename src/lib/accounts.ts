export interface WalletAccount {
  name: string;
  address: string;
  network: "base-sepolia" | "base";
  usdcBalance: number; // in USDC
  ethBalance: number;  // in ETH
}

export const PURCHASER_ADDRESS = "0x71C8390b14c33c30f4e24D73D5417937A81c324D";
export const SELLER_ADDRESS = "0x94B2E8193fAcf8702bDb31b31C39d48b11D60881";
export const FACILITATOR_ADDRESS = "0x4020FAC1111a8b92b058c49e1eF6a84391F0997e";

const STORAGE_KEY = "x402_starter_accounts_state";

export type TransactionStatus = "confirmed" | "pending" | "failed";

export interface CDPTransaction {
  id: string;
  hash: string;
  timestamp: string;
  from: string;
  to: string;
  amount: string;
  token: string;
  purpose: string;
  network: "base-sepolia" | "base";
  status: TransactionStatus;
  blockNumber?: number;
  gasFee?: string;
  type?: "x402-payment" | "faucet" | "mcp-call";
}

export interface SystemWallets {
  purchaser: WalletAccount;
  seller: WalletAccount;
  transactions: CDPTransaction[];
}

const defaultWallets: SystemWallets = {
  purchaser: {
    name: "Purchaser (AI Agent)",
    address: PURCHASER_ADDRESS,
    network: "base-sepolia",
    usdcBalance: 5.485,
    ethBalance: 0.05,
  },
  seller: {
    name: "Seller (API & MCP Host)",
    address: SELLER_ADDRESS,
    network: "base-sepolia",
    usdcBalance: 12.82,
    ethBalance: 0.12,
  },
  transactions: [
    {
      id: "tx-init-1",
      hash: "0x8f2d5e9b14c33c30f4e24d73d5417937a81c324d08e1a7b8e9f52a7c41d9e2b1",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      from: PURCHASER_ADDRESS,
      to: SELLER_ADDRESS,
      amount: "0.001 USDC",
      token: "USDC",
      purpose: "MCP Tool: get_random_number",
      network: "base-sepolia",
      status: "confirmed",
      blockNumber: 18241932,
      gasFee: "0.000012 ETH",
      type: "mcp-call",
    },
    {
      id: "tx-init-2",
      hash: "0x3d82a17f5c90b6a71e2f849c9523b10ea9b87642e88a7c134df987251bc210fa",
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      from: PURCHASER_ADDRESS,
      to: SELLER_ADDRESS,
      amount: "0.005 USDC",
      token: "USDC",
      purpose: "Protected API: /api/add computation",
      network: "base-sepolia",
      status: "confirmed",
      blockNumber: 18242480,
      gasFee: "0.000015 ETH",
      type: "x402-payment",
    },
  ],
};

export function getSystemWallets(): SystemWallets {
  if (typeof window === "undefined") return defaultWallets;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultWallets));
      return defaultWallets;
    }
    return JSON.parse(raw);
  } catch {
    return defaultWallets;
  }
}

export function saveSystemWallets(state: SystemWallets): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save wallets to localStorage", e);
  }
}

export function recordPayment(
  purpose: string,
  amountUsdc: number = 0.001
): { hash: string; tx: CDPTransaction } {
  const current = getSystemWallets();
  const txHash =
    "0x" +
    Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");

  const blockNumber = 18240000 + Math.floor(Math.random() * 5000);
  const newTx: CDPTransaction = {
    id: "tx-" + Date.now(),
    hash: txHash,
    timestamp: new Date().toISOString(),
    from: PURCHASER_ADDRESS,
    to: SELLER_ADDRESS,
    amount: `${amountUsdc} USDC`,
    token: "USDC",
    purpose,
    network: "base-sepolia",
    status: "confirmed",
    blockNumber,
    gasFee: "0.000014 ETH",
    type: "x402-payment",
  };

  const updated: SystemWallets = {
    purchaser: {
      ...current.purchaser,
      usdcBalance: Math.max(0, Number((current.purchaser.usdcBalance - amountUsdc).toFixed(4))),
    },
    seller: {
      ...current.seller,
      usdcBalance: Number((current.seller.usdcBalance + amountUsdc).toFixed(4)),
    },
    transactions: [newTx, ...current.transactions].slice(0, 50),
  };

  saveSystemWallets(updated);
  return { hash: txHash, tx: newTx };
}

export async function fetchPaymentHistory(): Promise<CDPTransaction[]> {
  // Simulate network RPC fetch from Coinbase CDP Node / Base Sepolia indexer
  await new Promise((resolve) => setTimeout(resolve, 400));
  const wallets = getSystemWallets();
  return wallets.transactions;
}

export function clearPaymentHistory(): void {
  const wallets = getSystemWallets();
  wallets.transactions = [];
  saveSystemWallets(wallets);
}

export function requestFaucetFunds(): SystemWallets {
  const current = getSystemWallets();
  const txHash =
    "0x" +
    Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");

  const faucetTx: CDPTransaction = {
    id: "tx-faucet-" + Date.now(),
    hash: txHash,
    timestamp: new Date().toISOString(),
    from: "0x0000000000000000000000000000000000000000 (Faucet)",
    to: PURCHASER_ADDRESS,
    amount: "+5.000 USDC",
    token: "USDC",
    purpose: "Coinbase CDP Testnet Faucet Dispensary",
    network: "base-sepolia",
    status: "confirmed",
    blockNumber: 18240000 + Math.floor(Math.random() * 5000),
    gasFee: "0.000000 ETH (Sponsored)",
    type: "faucet",
  };

  const updated: SystemWallets = {
    ...current,
    purchaser: {
      ...current.purchaser,
      usdcBalance: Number((current.purchaser.usdcBalance + 5.0).toFixed(4)),
    },
    transactions: [faucetTx, ...current.transactions].slice(0, 50),
  };
  saveSystemWallets(updated);
  return updated;
}
