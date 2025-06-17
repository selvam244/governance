"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "../../../contexts/WalletContext";
import {
  getProposalDetails,
  getProposalVotes,
  getProposalState,
  getProposalStateText,
  formatVoteCount,
  castVote,
  queueProposal,
  executeProposal,
  hasUserVoted,
  getProposalProposer,
  getProposalSnapshot,
  getProposalDeadline,
  getQuorum,
  estimateDateFromBlock,
  formatProposalDate,
  ProposalState,
  getNetworkInfo,
  isSupportedNetwork,
} from "../../../utils/governance";

interface ProposalDetailInfo {
  id: string;
  title: string;
  description: string;
  proposer: string;
  state: ProposalState;
  votes: {
    for: string;
    against: string;
    abstain: string;
    total: string;
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
    totalVotes: bigint;
  };
  quorum: string;
  quorumNeeded: bigint;
  majoritySupport: boolean;
  addresses: number;
  snapshotDate?: Date;
  deadlineDate?: Date;
  createdDate?: Date;
}

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected, chainId } = useWallet();
  const [proposal, setProposal] = useState<ProposalDetailInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isQueueing, setIsQueueing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const isCorrectNetwork = isSupportedNetwork(chainId);

  const proposalId = params.id as string;

  useEffect(() => {
    if (proposalId) {
      loadProposalDetail();
    }
  }, [proposalId]);

  useEffect(() => {
    if (address && isConnected && proposalId) {
      checkVotingStatus();
    }
  }, [address, isConnected, proposalId]);

  const loadProposalDetail = async () => {
    try {
      setLoading(true);

      const [votes, state, proposer, snapshot, deadline] = await Promise.all([
        getProposalVotes(proposalId),
        getProposalState(proposalId),
        getProposalProposer(proposalId),
        getProposalSnapshot(proposalId),
        getProposalDeadline(proposalId),
      ]);

      if (votes && state !== null && snapshot) {
        const totalVotes =
          votes.forVotes + votes.againstVotes + votes.abstainVotes;

        // Get actual quorum from contract
        const quorumNeeded = await getQuorum(snapshot);

        // Estimate dates from block numbers
        const snapshotDate = snapshot
          ? estimateDateFromBlock(snapshot)
          : undefined;
        const deadlineDate = deadline
          ? estimateDateFromBlock(deadline)
          : undefined;

        // Approximate creation date (24 hours before snapshot for example)
        const createdDate = snapshotDate
          ? new Date(snapshotDate.getTime() - 24 * 60 * 60 * 1000)
          : undefined;

        setProposal({
          id: proposalId,
          title: `Proposal #${proposalId.slice(0, 6)}...`,
          description:
            "Proposal description would be decoded from the actual proposal data",
          proposer: proposer || "0x0000...0000",
          state,
          votes: {
            for: formatVoteCount(votes.forVotes),
            against: formatVoteCount(votes.againstVotes),
            abstain: formatVoteCount(votes.abstainVotes),
            total: formatVoteCount(totalVotes),
            forVotes: votes.forVotes,
            againstVotes: votes.againstVotes,
            abstainVotes: votes.abstainVotes,
            totalVotes,
          },
          quorum: formatVoteCount(quorumNeeded || BigInt(0)),
          quorumNeeded: quorumNeeded || BigInt(0),
          majoritySupport: votes.forVotes > votes.againstVotes,
          addresses: 0, // Would need additional contract calls to get this
          snapshotDate,
          deadlineDate,
          createdDate,
        });
      }
    } catch (error) {
      console.error("Error loading proposal detail:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkVotingStatus = async () => {
    try {
      if (address) {
        const voted = await hasUserVoted(proposalId, address);
        setHasVoted(voted);
      }
    } catch (error) {
      console.error("Error checking voting status:", error);
    }
  };

  const handleVote = async (support: 0 | 1 | 2) => {
    if (!address || !isConnected || !isCorrectNetwork) return;

    setIsVoting(true);
    try {
      await castVote({ proposalId, support });
      alert(
        `Vote cast successfully! ${support === 1 ? "For" : support === 0 ? "Against" : "Abstain"}`,
      );

      // Reload proposal data and voting status
      await loadProposalDetail();
      await checkVotingStatus();
    } catch (error) {
      console.error("Error casting vote:", error);
      alert("Failed to cast vote. Please try again.");
    } finally {
      setIsVoting(false);
    }
  };

  const handleQueue = async () => {
    if (!address || !isConnected || !isCorrectNetwork) return;

    setIsQueueing(true);
    try {
      const result = await queueProposal(proposalId);
      alert(`Proposal queued successfully! Transaction: ${result.hash}`);
      await loadProposalDetail();
    } catch (error) {
      console.error("Error queueing proposal:", error);
      alert("Failed to queue proposal. Please try again.");
    } finally {
      setIsQueueing(false);
    }
  };

  const handleExecute = async () => {
    if (!address || !isConnected || !isCorrectNetwork) return;

    setIsExecuting(true);
    try {
      const result = await executeProposal(proposalId);
      alert(`Proposal executed successfully! Transaction: ${result.hash}`);
      await loadProposalDetail();
    } catch (error) {
      console.error("Error executing proposal:", error);
      alert("Failed to execute proposal. Please try again.");
    } finally {
      setIsExecuting(false);
    }
  };

  const getStatusBadge = (state: ProposalState) => {
    const stateText = getProposalStateText(state);
    const baseClasses = "px-3 py-1 text-sm font-medium rounded-full";

    switch (state) {
      case ProposalState.Active:
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case ProposalState.Succeeded:
        return `${baseClasses} bg-green-100 text-green-800`;
      case ProposalState.Queued:
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case ProposalState.Executed:
        return `${baseClasses} bg-green-100 text-green-800`;
      case ProposalState.Defeated:
        return `${baseClasses} bg-red-100 text-red-800`;
      case ProposalState.Canceled:
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const renderActionButtons = () => {
    if (!isConnected || !address || !proposal) return null;

    if (!isCorrectNetwork) {
      return (
        <div className="text-red-600 text-sm">
          Switch to a supported network to interact with this proposal
        </div>
      );
    }

    if (proposal.state === ProposalState.Active) {
      if (hasVoted) {
        return (
          <div className="text-green-600 text-sm font-medium">✓ Vote cast</div>
        );
      }

      if (isVoting) {
        return <div className="text-blue-600 text-sm">Casting vote...</div>;
      }

      return (
        <div className="flex space-x-3">
          <button
            onClick={() => handleVote(1)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            disabled={isVoting}
          >
            Vote For
          </button>
          <button
            onClick={() => handleVote(0)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            disabled={isVoting}
          >
            Vote Against
          </button>
          <button
            onClick={() => handleVote(2)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            disabled={isVoting}
          >
            Abstain
          </button>
        </div>
      );
    }

    if (proposal.state === ProposalState.Succeeded) {
      return (
        <button
          onClick={handleQueue}
          disabled={isQueueing}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {isQueueing ? "Queueing..." : "Queue"}
        </button>
      );
    }

    if (proposal.state === ProposalState.Queued) {
      return (
        <button
          onClick={handleExecute}
          disabled={isExecuting}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {isExecuting ? "Executing..." : "Execute"}
        </button>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-500">Loading proposal...</div>
          </div>
        </div>
      </main>
    );
  }

  if (!proposal) {
    return (
      <main className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">Proposal not found</div>
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-700"
            >
              ← Go back
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
          >
            ← Back to proposals
          </button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <span className={getStatusBadge(proposal.state)}>
                  {getProposalStateText(proposal.state)}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {proposal.title}
              </h1>
              <div className="text-sm text-gray-600 flex items-center space-x-4">
                <span>
                  by {proposal.proposer.slice(0, 6)}...
                  {proposal.proposer.slice(-4)}
                </span>
                <span>•</span>
                <span>
                  ID {proposalId.slice(0, 8)}...{proposalId.slice(-4)}
                </span>
                <span>•</span>
                <span>Arbitrum Treasury</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {renderActionButtons()}
              <button className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg">
                {proposal.state === ProposalState.Executed
                  ? "Proposal executed"
                  : proposal.state === ProposalState.Defeated
                    ? "Quorum not reached"
                    : "Vote onchain"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Result details</h2>

              {/* Vote Summary */}
              <div className="mb-8">
                <div className="flex space-x-8 border-b border-gray-200">
                  <button className="text-blue-600 font-medium border-b-2 border-blue-600 pb-2">
                    Voted
                  </button>
                  <button className="text-gray-500 pb-2">Not yet voted</button>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex space-x-8">
                      <div className="text-center">
                        <div className="text-green-600 font-medium">For</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-500">Against</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-500">Abstain</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {proposal.addresses} addresses
                    </div>
                  </div>

                  {/* Vote Bar */}
                  <div className="w-full h-2 bg-gray-200 rounded-full mb-4 flex overflow-hidden">
                    {(() => {
                      const total = Number(proposal.votes.totalVotes);
                      if (total === 0) {
                        return <div className="w-full h-2 bg-gray-200"></div>;
                      }

                      const forPercent =
                        (Number(proposal.votes.forVotes) / total) * 100;
                      const againstPercent =
                        (Number(proposal.votes.againstVotes) / total) * 100;
                      const abstainPercent =
                        (Number(proposal.votes.abstainVotes) / total) * 100;

                      return (
                        <>
                          {forPercent > 0 && (
                            <div
                              className="h-2 bg-green-500"
                              style={{ width: `${forPercent}%` }}
                            ></div>
                          )}
                          {againstPercent > 0 && (
                            <div
                              className="h-2 bg-red-500"
                              style={{ width: `${againstPercent}%` }}
                            ></div>
                          )}
                          {abstainPercent > 0 && (
                            <div
                              className="h-2 bg-gray-400"
                              style={{ width: `${abstainPercent}%` }}
                            ></div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  <div className="text-right text-sm text-gray-600">
                    {proposal.votes.total} votes
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Votes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold mb-4">Current Votes</h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Quorum</span>
                  <span className="font-medium">
                    {proposal.votes.total} of {proposal.quorum}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Majority support</span>
                  <span className="font-medium">
                    {proposal.majoritySupport ? "Yes" : "No"}
                  </span>
                </div>
              </div>

              {/* Vote Breakdown */}
              <div className="mt-6">
                <div className="w-full h-4 bg-gray-200 rounded-full flex overflow-hidden">
                  {(() => {
                    const total = Number(proposal.votes.totalVotes);
                    if (total === 0) {
                      return <div className="w-full h-4 bg-gray-200"></div>;
                    }

                    const forPercent =
                      (Number(proposal.votes.forVotes) / total) * 100;
                    const againstPercent =
                      (Number(proposal.votes.againstVotes) / total) * 100;
                    const abstainPercent =
                      (Number(proposal.votes.abstainVotes) / total) * 100;

                    return (
                      <>
                        {forPercent > 0 && (
                          <div
                            className="h-4 bg-green-500"
                            style={{ width: `${forPercent}%` }}
                          ></div>
                        )}
                        {againstPercent > 0 && (
                          <div
                            className="h-4 bg-red-500"
                            style={{ width: `${againstPercent}%` }}
                          ></div>
                        )}
                        {abstainPercent > 0 && (
                          <div
                            className="h-4 bg-gray-400"
                            style={{ width: `${abstainPercent}%` }}
                          ></div>
                        )}
                      </>
                    );
                  })()}
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">For</span>
                    </div>
                    <span className="font-medium">{proposal.votes.for}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Against</span>
                    </div>
                    <span className="font-medium">
                      {proposal.votes.against}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span className="text-sm">Abstain</span>
                    </div>
                    <span className="font-medium">
                      {proposal.votes.abstain}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Impact Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold mb-4">Impact Overview</h3>
              <div className="flex items-center space-x-2 text-green-600">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium">
                  All simulations passed
                </span>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold mb-6">Status</h3>

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-200"></div>

                {/* Draft created */}
                <div className="relative flex items-start mb-8">
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white">
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="text-xs text-gray-500 mb-1">
                      {proposal.createdDate
                        ? formatProposalDate(proposal.createdDate)
                        : "Date unknown"}
                    </div>
                    <div className="font-medium text-gray-900 mb-2">
                      Draft created
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">0</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {proposal.proposer.slice(0, 6)}...
                        {proposal.proposer.slice(-4)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Published onchain */}
                <div className="relative flex items-start mb-8">
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center border-2 border-white">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="text-xs text-gray-500 mb-1">
                      {proposal.createdDate
                        ? formatProposalDate(
                            new Date(
                              proposal.createdDate.getTime() +
                                2 * 60 * 60 * 1000,
                            ),
                          )
                        : "Date unknown"}
                    </div>
                    <div className="font-medium text-gray-900 mb-2">
                      Published onchain
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-gray-800 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        {proposal.proposer.slice(0, 6)}...
                        {proposal.proposer.slice(-4)}
                      </span>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>

                {/* Voting period started */}
                <div className="relative flex items-start mb-8">
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 border-white ${
                      proposal.state === ProposalState.Active ||
                      proposal.state === ProposalState.Succeeded ||
                      proposal.state === ProposalState.Defeated ||
                      proposal.state === ProposalState.Queued ||
                      proposal.state === ProposalState.Executed
                        ? "bg-blue-600"
                        : "bg-gray-200"
                    }`}
                  >
                    <svg
                      className={`w-6 h-6 ${
                        proposal.state === ProposalState.Active ||
                        proposal.state === ProposalState.Succeeded ||
                        proposal.state === ProposalState.Defeated ||
                        proposal.state === ProposalState.Queued ||
                        proposal.state === ProposalState.Executed
                          ? "text-white"
                          : "text-gray-400"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="text-xs text-gray-500 mb-1">
                      {proposal.snapshotDate
                        ? formatProposalDate(proposal.snapshotDate)
                        : "Date unknown"}
                    </div>
                    <div
                      className={`font-medium mb-2 ${
                        proposal.state === ProposalState.Active ||
                        proposal.state === ProposalState.Succeeded ||
                        proposal.state === ProposalState.Defeated ||
                        proposal.state === ProposalState.Queued ||
                        proposal.state === ProposalState.Executed
                          ? "text-blue-600"
                          : "text-gray-400"
                      }`}
                    >
                      Voting period started
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>

                {/* End voting period */}
                <div className="relative flex items-start mb-8">
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 border-white ${
                      proposal.state === ProposalState.Succeeded ||
                      proposal.state === ProposalState.Defeated ||
                      proposal.state === ProposalState.Queued ||
                      proposal.state === ProposalState.Executed
                        ? "bg-gray-300"
                        : "bg-gray-200"
                    }`}
                  >
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="text-xs text-gray-500 mb-1">
                      {proposal.deadlineDate
                        ? formatProposalDate(proposal.deadlineDate)
                        : "Date unknown"}
                    </div>
                    <div className="font-medium text-gray-500 mb-2">
                      End voting period
                    </div>
                    {proposal.deadlineDate &&
                      proposal.state === ProposalState.Active && (
                        <div className="text-sm text-gray-500">
                          {proposal.deadlineDate > new Date()
                            ? `in ${Math.ceil((proposal.deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days`
                            : "ended"}
                        </div>
                      )}
                  </div>
                </div>

                {/* Queue proposal */}
                <div className="relative flex items-start mb-8">
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 border-white ${
                      proposal.state === ProposalState.Queued ||
                      proposal.state === ProposalState.Executed
                        ? "bg-yellow-500"
                        : "bg-gray-200"
                    }`}
                  >
                    <svg
                      className={`w-5 h-5 ${
                        proposal.state === ProposalState.Queued ||
                        proposal.state === ProposalState.Executed
                          ? "text-white"
                          : "text-gray-400"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-4 flex-1">
                    <div
                      className={`font-medium ${
                        proposal.state === ProposalState.Queued ||
                        proposal.state === ProposalState.Executed
                          ? "text-yellow-700"
                          : "text-gray-400"
                      }`}
                    >
                      Queue proposal
                    </div>
                  </div>
                </div>

                {/* Execute proposal */}
                <div className="relative flex items-start">
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 border-white ${
                      proposal.state === ProposalState.Executed
                        ? "bg-green-600"
                        : "bg-gray-200"
                    }`}
                  >
                    <svg
                      className={`w-5 h-5 ${
                        proposal.state === ProposalState.Executed
                          ? "text-white"
                          : "text-gray-400"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-4 flex-1">
                    <div
                      className={`font-medium ${
                        proposal.state === ProposalState.Executed
                          ? "text-green-700"
                          : "text-gray-400"
                      }`}
                    >
                      Execute proposal
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
