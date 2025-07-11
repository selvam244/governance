"use client";

import React from "react";
import { useWallet } from "../../contexts/WalletContext";
import { useAccount, useChainId } from "wagmi";

export default function WalletInfo() {
  const {
    address,
    isConnected,
    balance,
    disconnect,
    isAuthenticated,
    isAuthenticating,
    authenticate,
    authError,
  } = useWallet();
  const chainId = useChainId();

  if (!isConnected || !address) {
    return null;
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (bal: string | undefined) => {
    if (!bal) return "0";
    return parseFloat(bal).toFixed(4);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Wallet Connected
          </h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Address:</span>
              <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                {formatAddress(address)}
              </span>
            </div>
            {balance && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Balance:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatBalance(balance)} ETH
                </span>
              </div>
            )}
            {chainId && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Network:</span>
                <span className="text-sm font-semibold text-blue-600">
                  {chainId === 42161 ? "Arbitrum One" : `Chain ${chainId}`}
                </span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Status:</span>
              {isAuthenticated ? (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-green-600">
                    Authenticated
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-yellow-600">
                    Not Authenticated
                  </span>
                  <button
                    onClick={authenticate}
                    disabled={isAuthenticating}
                    className="text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-2 py-1 rounded transition-colors"
                  >
                    {isAuthenticating ? "Signing..." : "Sign In"}
                  </button>
                </div>
              )}
            </div>
            {authError && (
              <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                {authError}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col space-y-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <button
            onClick={() => disconnect()}
            className="text-xs text-gray-500 hover:text-red-600 transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}
