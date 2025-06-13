'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';

interface WalletContextType {
  address: string | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  balance: string | undefined;
  connect: () => void;
  disconnect: () => void;
  chainId: number | undefined;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, chainId } = useAccount();
  const { isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  
  const { data: balance } = useBalance({
    address: address,
  });

  const connect = () => {
    if (openConnectModal) {
      openConnectModal();
    }
  };

  const value: WalletContextType = {
    address,
    isConnected,
    isConnecting,
    balance: balance?.formatted,
    connect,
    disconnect,
    chainId,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}