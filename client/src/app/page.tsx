"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "../contexts/WalletContext";
import {
  GOVERNOR_CONTRACT_ADDRESS,
  TIMELOCK_CONTRACT_ADDRESS,
  VOTE_TOKEN_CONTRACT_ADDRESS,
  getProposalCount,
  getProposalThreshold,
  getVotingDelay,
  getVotingPeriod,
  formatVoteCount,
  getNetworkInfo,
  isSupportedNetwork,
  getTokenSymbol,
} from "../utils/governance";

interface GovernanceStats {
  totalProposals: number;
  proposalThreshold: string;
  votingDelay: string;
  votingPeriod: string;
  tokenSymbol: string;
}

export default function Home() {
  const { address, isConnected, chainId, isAuthenticated } = useWallet();
  const [stats, setStats] = useState<GovernanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState<string>("");
  const isCorrectNetwork = isSupportedNetwork(chainId);

  useEffect(() => {
    loadGovernanceStats();
  }, []);

  const loadGovernanceStats = async () => {
    try {
      setLoading(true);
      const [
        totalProposals,
        proposalThreshold,
        votingDelay,
        votingPeriod,
        tokenSymbol,
      ] = await Promise.all([
        getProposalCount(),
        getProposalThreshold(),
        getVotingDelay(),
        getVotingPeriod(),
        getTokenSymbol(),
      ]);

      setStats({
        totalProposals,
        proposalThreshold: proposalThreshold
          ? formatVoteCount(proposalThreshold)
          : "0",
        votingDelay: votingDelay ? votingDelay.toString() : "0",
        votingPeriod: votingPeriod ? votingPeriod.toString() : "0",
        tokenSymbol,
      });
    } catch (error) {
      console.error("Error loading governance stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(type);
      setTimeout(() => setCopiedAddress(""), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const contracts = [
    {
      name: "Governance Contract",
      address: GOVERNOR_CONTRACT_ADDRESS,
      icon: "🏛️",
      description: "Main governance logic and proposal management",
      color: "from-blue-500 to-blue-600",
    },
    {
      name: "Timelock Contract",
      address: TIMELOCK_CONTRACT_ADDRESS,
      icon: "⏰",
      description: "Delayed execution of approved proposals",
      color: "from-purple-500 to-purple-600",
    },
    {
      name: "Voting Token Contract",
      address: VOTE_TOKEN_CONTRACT_ADDRESS,
      icon: "🪙",
      description: "Governance token for voting power",
      color: "from-green-500 to-green-600",
    },
  ];

  const statsCards = [
    {
      title: "Total Proposals",
      value: stats?.totalProposals.toString() || "0",
      icon: "📋",
      description: "Proposals created to date",
      color: "from-orange-500 to-red-500",
    },
    {
      title: "Proposal Threshold",
      value: `${stats?.proposalThreshold || "0"} ${stats?.tokenSymbol || "TOKEN"}`,
      icon: "🎯",
      description: "Tokens needed to create proposals",
      color: "from-cyan-500 to-blue-500",
    },
    {
      title: "Voting Delay",
      value: `${stats?.votingDelay || "0"} blocks`,
      icon: "⏳",
      description: "Delay before voting starts",
      color: "from-violet-500 to-purple-500",
    },
    {
      title: "Voting Period",
      value: `${stats?.votingPeriod || "0"} blocks`,
      icon: "🗳️",
      description: "Duration of voting period",
      color: "from-emerald-500 to-green-500",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-8">
            <span className="text-3xl">🏛️</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            OpenLedger Governance
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Decentralized governance powered by the community. Create proposals,
            vote on decisions, and shape the future of the protocol together.
          </p>

          {isConnected && (
            <div className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-md">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">
                Connected to {getNetworkInfo(chainId).name}
              </span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Link
            href="/proposals"
            className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              View Proposals
            </h3>
            <p className="text-gray-600">
              Browse and vote on active governance proposals
            </p>
            <div className="mt-4 text-blue-600 group-hover:text-blue-700 font-medium">
              Explore proposals →
            </div>
          </Link>

          {isConnected && isAuthenticated ? (
            <Link
              href="/proposals/new"
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="text-4xl mb-4">✏️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Create Proposal
              </h3>
              <p className="text-gray-600">
                Submit new proposals for community voting
              </p>
              <div className="mt-4 text-green-600 group-hover:text-green-700 font-medium">
                Start creating →
              </div>
            </Link>
          ) : (
            <div className="group bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200 opacity-60">
              <div className="text-4xl mb-4">✏️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Create Proposal
              </h3>
              <p className="text-gray-600 mb-4">
                Submit new proposals for community voting
              </p>
              <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                {!isConnected
                  ? "Connect wallet & sign in required"
                  : "Sign in required"}
              </div>
            </div>
          )}

          <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Learn More
            </h3>
            <p className="text-gray-600">
              Understand how governance works and get involved
            </p>
            <div className="mt-4 text-purple-600 group-hover:text-purple-700 font-medium">
              Documentation →
            </div>
          </div>
        </div>

        {/* Governance Statistics */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Governance Statistics
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading governance data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsCards.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl mb-4`}
                  >
                    <span className="text-xl">{stat.icon}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {stat.title}
                  </h3>
                  <div className="text-2xl font-bold text-gray-800 mb-2">
                    {stat.value}
                  </div>
                  <p className="text-sm text-gray-600">{stat.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contract Addresses */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Smart Contract Addresses
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {contracts.map((contract, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${contract.color} rounded-2xl mb-6`}
                >
                  <span className="text-2xl">{contract.icon}</span>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {contract.name}
                </h3>

                <p className="text-gray-600 mb-6">{contract.description}</p>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <code className="text-sm text-gray-800 font-mono">
                      {formatAddress(contract.address)}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(contract.address, contract.name)
                      }
                      className="ml-2 p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Copy full address"
                    >
                      {copiedAddress === contract.name ? (
                        <svg
                          className="w-4 h-4 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>

                  {copiedAddress === contract.name && (
                    <div className="mt-2 text-xs text-green-600 font-medium">
                      ✓ Address copied to clipboard
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Participate?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join the community and help shape the future of OpenLedger
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/proposals"
              className="bg-white text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              Browse Proposals
            </Link>
            {isConnected && isAuthenticated && (
              <Link
                href="/proposals/new"
                className="bg-blue-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-400 transition-colors border border-blue-400"
              >
                Create Proposal
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
