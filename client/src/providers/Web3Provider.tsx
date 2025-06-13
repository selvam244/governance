"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  sepolia,
  arbitrumSepolia,
} from "wagmi/chains";
import { defineChain } from "viem";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { WalletProvider } from "../contexts/WalletContext";

const hardhatLocal = defineChain({
  id: 31337,
  name: "Hardhat Network",
  nativeCurrency: {
    decimals: 18,
    name: "Hardhat Token",
    symbol: "HDT",
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
      webSocket: ["ws://127.0.0.1:8545"],
    },
  },
  blockExplorers: {
    default: { name: "Explorer", url: "" },
  },
});

export const config = getDefaultConfig({
  appName: "OpenLedger Governance",
  projectId: "YOUR_PROJECT_ID", // Get this from WalletConnect Cloud
  chains: [
    arbitrum,
    mainnet,
    polygon,
    optimism,
    hardhatLocal,
    sepolia,
    arbitrumSepolia,
  ],
  ssr: true,
});

const queryClient = new QueryClient();

export default function Web3Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <WalletProvider>{children}</WalletProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
