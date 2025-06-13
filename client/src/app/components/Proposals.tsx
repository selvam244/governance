"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "../../contexts/WalletContext";
import {
  castVote,
  hasUserVoted,
  getVotingPower,
  isSupportedNetwork,
  getNetworkInfo,
  getProposals,
  ProposalInfo,
  ProposalState,
  getProposalStateText,
  formatVoteCount,
} from "../../utils/governance";

interface DisplayProposal {
  id: string;
  title: string;
  status: string;
  type: "CONSTITUTIONAL" | "NON-CONSTITUTIONAL" | "REGULAR";
  date?: string;
  organization: string;
  votesFor: string;
  votesAgainst: string;
  totalVotes: string;
  addresses: number;
}

interface VotingState {
  [proposalId: string]: {
    hasVoted: boolean;
    isVoting: boolean;
  };
}

const getStatusBadge = (status: string) => {
  const baseClasses = "px-2 py-1 text-xs font-medium rounded-md";

  switch (status) {
    case "ACTIVE":
      return `${baseClasses} bg-blue-100 text-blue-800`;
    case "EXECUTED":
      return `${baseClasses} bg-green-100 text-green-800`;
    case "EXECUTED ON L2":
      return `${baseClasses} bg-green-100 text-green-800`;
    case "DEFEATED":
      return `${baseClasses} bg-red-100 text-red-800`;
    case "CANCELED":
      return `${baseClasses} bg-gray-100 text-gray-800`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`;
  }
};

export default function Proposals() {
  const { address, isConnected, chainId } = useWallet();
  const [votingPower, setVotingPower] = useState<string>("0");
  const [votingState, setVotingState] = useState<VotingState>({});
  const [proposals, setProposals] = useState<DisplayProposal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const isCorrectNetwork = isSupportedNetwork(chainId);

  useEffect(() => {
    // Reset state when address changes
    setVotingPower("0");
    setVotingState({});
    setProposals([]);
    setLoading(true);

    loadProposals();

    if (address && isConnected && isCorrectNetwork) {
      console.log("Loading data for address:", address);
      loadVotingPower();
    }
  }, [address, isConnected, isCorrectNetwork]);

  // Load voting states after proposals are loaded
  useEffect(() => {
    if (address && isConnected && isCorrectNetwork && proposals.length > 0) {
      loadVotingStates();
    }
  }, [address, isConnected, isCorrectNetwork, proposals]);

  const loadVotingPower = async () => {
    if (!address) return;
    try {
      console.log("Loading voting power for:", address);
      const power = await getVotingPower(address);
      console.log("Voting power loaded:", power);
      setVotingPower(power);
    } catch (error) {
      console.error("Error loading voting power:", error);
    }
  };

  const loadProposals = async () => {
    try {
      setLoading(true);
      const contractProposals = await getProposals(0, 10);

      const displayProposals: DisplayProposal[] = contractProposals.map(
        (proposal, index) => ({
          id: proposal.id,
          title: `Proposal #${index + 1}`, // You can decode description from proposal details if needed
          status: getProposalStateText(proposal.state),
          type: "REGULAR" as const, // You can determine this from proposal details if needed
          organization: "DAO",
          votesFor: formatVoteCount(proposal.votes.forVotes),
          votesAgainst: formatVoteCount(proposal.votes.againstVotes),
          totalVotes: formatVoteCount(
            proposal.votes.forVotes +
              proposal.votes.againstVotes +
              proposal.votes.abstainVotes,
          ),
          addresses: 0, // This would require additional contract calls to get voter count
        }),
      );

      setProposals(displayProposals);
    } catch (error) {
      console.error("Error loading proposals:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadVotingStates = async () => {
    if (!address || proposals.length === 0) return;
    const states: VotingState = {};

    for (const proposal of proposals) {
      try {
        const hasVoted = await hasUserVoted(proposal.id, address);
        states[proposal.id] = {
          hasVoted,
          isVoting: false,
        };
      } catch (error) {
        console.error(
          `Error checking vote status for proposal ${proposal.id}:`,
          error,
        );
        states[proposal.id] = {
          hasVoted: false,
          isVoting: false,
        };
      }
    }

    setVotingState(states);
  };

  const handleVote = async (proposalId: string, support: 0 | 1) => {
    if (!address || !isConnected || !isCorrectNetwork) return;

    setVotingState((prev) => ({
      ...prev,
      [proposalId]: {
        ...prev[proposalId],
        isVoting: true,
      },
    }));

    try {
      await castVote({ proposalId, support });

      // Update local state
      setVotingState((prev) => ({
        ...prev,
        [proposalId]: {
          hasVoted: true,
          isVoting: false,
        },
      }));

      // Show success message
      alert(`Vote cast successfully! ${support === 1 ? "For" : "Against"}`);
    } catch (error) {
      console.error("Error casting vote:", error);
      alert("Failed to cast vote. Please try again.");

      setVotingState((prev) => ({
        ...prev,
        [proposalId]: {
          ...prev[proposalId],
          isVoting: false,
        },
      }));
    }
  };

  const renderVotingButtons = (proposal: DisplayProposal) => {
    if (!isConnected || !address) {
      return (
        <div className="text-xs text-gray-500 mt-2">Connect wallet to vote</div>
      );
    }

    if (!isCorrectNetwork) {
      return (
        <div className="text-xs text-red-500 mt-2">
          Switch to a supported network to vote
        </div>
      );
    }

    if (proposal.status !== "ACTIVE") {
      return <div className="text-xs text-gray-500 mt-2">Voting ended</div>;
    }

    const state = votingState[proposal.id];

    if (state?.hasVoted) {
      return (
        <div className="text-xs text-green-600 mt-2 font-medium">
          ✓ Vote cast
        </div>
      );
    }

    if (state?.isVoting) {
      return <div className="text-xs text-blue-600 mt-2">Casting vote...</div>;
    }

    return (
      <div className="flex space-x-2 mt-2">
        <button
          onClick={() => handleVote(proposal.id, 1)}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
          disabled={state?.isVoting}
        >
          Vote For
        </button>
        <button
          onClick={() => handleVote(proposal.id, 0)}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
          disabled={state?.isVoting}
        >
          Vote Against
        </button>
      </div>
    );
  };

  return (
    <div
      key={address || "no-address"}
      className="bg-white rounded-lg shadow-sm border border-gray-200"
    >
      <div className="border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <button className="text-blue-600 font-semibold border-b-2 border-blue-600 pb-2">
                Onchain
              </button>
              {isConnected && (
                <div className="flex items-center space-x-6">
                  <div className="text-sm text-gray-600">
                    Network:{" "}
                    <span className="font-semibold text-green-600">
                      {getNetworkInfo(chainId).name}
                    </span>
                  </div>
                  {votingPower !== "0" && (
                    <div className="text-sm text-gray-600">
                      Voting Power:{" "}
                      <span className="font-semibold text-blue-600">
                        {parseFloat(votingPower).toFixed(2)}{" "}
                        {getNetworkInfo(chainId).symbol}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            {isConnected && (
              <Link
                href="/proposals/new"
                className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium flex items-center"
              >
                <span className="mr-2">+</span>
                New proposal
              </Link>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">Loading proposals...</div>
        </div>
      ) : proposals.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="text-gray-500 mb-2">No proposals found</div>
            <div className="text-sm text-gray-400">
              Create the first proposal to get started
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Proposal
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Votes for
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Votes against
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Total votes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {proposals.map((proposal) => (
                <tr
                  key={proposal.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-6 w-1/2">
                    <div className="max-w-md">
                      <div className="text-sm font-medium text-gray-900 mb-2 leading-tight">
                        {proposal.title}
                      </div>
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={getStatusBadge(proposal.status)}>
                          {proposal.status}
                        </span>
                        {proposal.date && (
                          <span className="text-xs text-gray-500">
                            {proposal.date}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {proposal.organization}
                      </div>
                      {renderVotingButtons(proposal)}
                    </div>
                  </td>
                  <td className="px-6 py-6 w-1/6">
                    <div className="text-sm font-semibold text-green-600 mb-1">
                      {proposal.votesFor}
                    </div>
                    <div className="w-16 h-1 bg-gray-200 rounded-full">
                      <div
                        className="h-1 bg-green-500 rounded-full"
                        style={{ width: "75%" }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-6 w-1/6">
                    <div className="text-sm font-semibold text-red-600 mb-1">
                      {proposal.votesAgainst}
                    </div>
                    <div className="w-16 h-1 bg-gray-200 rounded-full">
                      <div
                        className="h-1 bg-red-500 rounded-full"
                        style={{ width: "25%" }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-6 w-1/6 text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {proposal.totalVotes}
                    </div>
                    <div className="text-xs text-gray-500">
                      {proposal.addresses} addresses
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
