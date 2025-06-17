"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useSignMessage,
} from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { authenticateUser, formatApiError } from "../utils/api";

interface WalletContextType {
  address: string | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  balance: string | undefined;
  connect: () => void;
  disconnect: () => void;
  chainId: number | undefined;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  authenticate: () => Promise<void>;
  authError: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, chainId } = useAccount();
  const { isPending: isConnecting } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const { signMessageAsync } = useSignMessage();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [lastAuthenticatedAddress, setLastAuthenticatedAddress] = useState<
    string | null
  >(null);

  const { data: balance } = useBalance({
    address: address,
  });

  // Reset authentication state when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setIsAuthenticated(false);
      setAuthError(null);
      setLastAuthenticatedAddress(null);
    }
  }, [isConnected]);

  // Reset authentication state when address changes
  useEffect(() => {
    if (
      address &&
      lastAuthenticatedAddress &&
      address !== lastAuthenticatedAddress
    ) {
      console.log(
        "🔄 Wallet address changed from",
        lastAuthenticatedAddress,
        "to",
        address,
      );
      console.log("🔓 Resetting authentication state for new address");
      setIsAuthenticated(false);
      setAuthError(null);
      setLastAuthenticatedAddress(null);
    }
  }, [address, lastAuthenticatedAddress]);

  const authenticate = async () => {
    if (!address || !isConnected) {
      setAuthError("Please connect your wallet first");
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const message = "Please sign this message to authenticate";

      console.log("🔐 Starting authentication for address:", address);
      console.log("📝 Message to sign:", message);

      const signature = await signMessageAsync({
        message,
      });

      console.log("✍️ Signature received:", signature);
      console.log("📏 Signature length:", signature.length);
      console.log("🔗 Signature starts with:", signature.substring(0, 10));

      // Send signature to your API using the utility function
      const data = await authenticateUser(message, signature, address);
      console.log("✅ Authentication successful:", data);

      setIsAuthenticated(true);
      setAuthError(null);
      setLastAuthenticatedAddress(address);
    } catch (error) {
      console.error("❌ Authentication error:", error);
      setAuthError(formatApiError(error));
      setIsAuthenticated(false);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const connect = async () => {
    if (openConnectModal) {
      openConnectModal();
    }
  };

  const disconnect = () => {
    wagmiDisconnect();
    setIsAuthenticated(false);
    setAuthError(null);
    setLastAuthenticatedAddress(null);
  };

  const value: WalletContextType = {
    address,
    isConnected,
    isConnecting,
    balance: balance?.formatted,
    connect,
    disconnect,
    chainId,
    isAuthenticated,
    isAuthenticating,
    authenticate,
    authError,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
