import { parseEther, formatEther, keccak256, toBytes } from "viem";
import { readContract, writeContract } from "wagmi/actions";
import { config } from "../providers/Web3Provider";
import MyGovernorABI from "../contracts/MyGovernor.json";
import MyTokenABI from "../contracts/MyToken.json";
import TimelockControllerABI from "../contracts/TimelockController.json";

// Governor contract address from environment
export const GOVERNOR_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS ||
  "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

// Timelock contract address from environment
export const TIMELOCK_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_TIMELOCK_ADDRESS ||
  "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// Vote token contract address from environment
export const VOTE_TOKEN_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_VOTE_TOKEN_ADDRESS ||
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Contract ABIs from compiled artifacts
export const GOVERNOR_ABI = MyGovernorABI.abi;
export const TOKEN_ABI = MyTokenABI.abi;
export const TIMELOCK_ABI = TimelockControllerABI.abi;

export interface ProposalVotes {
  againstVotes: bigint;
  forVotes: bigint;
  abstainVotes: bigint;
}

export interface VoteParams {
  proposalId: string;
  support: 0 | 1 | 2; // 0: Against, 1: For, 2: Abstain
}

export interface ProposalDetails {
  proposalId: string;
  targets: string[];
  values: bigint[];
  calldatas: string[];
  descriptionHash: string;
}

export interface ProposalInfo {
  id: string;
  details: ProposalDetails;
  votes: ProposalVotes;
  state: ProposalState;
  description?: string;
}

export enum VoteType {
  Against = 0,
  For = 1,
  Abstain = 2,
}

export enum ProposalState {
  Pending = 0,
  Active = 1,
  Canceled = 2,
  Defeated = 3,
  Succeeded = 4,
  Queued = 5,
  Expired = 6,
  Executed = 7,
}

// Get voting power for an address (this would typically be called from a component using useReadContract)
export function getVotingPowerConfig(address: string, blockNumber?: bigint) {
  return {
    address: VOTE_TOKEN_CONTRACT_ADDRESS,
    abi: TOKEN_ABI,
    functionName: blockNumber ? "getPastVotes" : "getVotes",
    args: blockNumber
      ? [address as `0x${string}`, blockNumber]
      : [address as `0x${string}`],
  };
}

// Get proposal count from contract
export async function getProposalCount(): Promise<number> {
  try {
    console.log(
      "Getting proposal count from contract:",
      GOVERNOR_CONTRACT_ADDRESS,
    );
    const result = await readContract(config, {
      address: GOVERNOR_CONTRACT_ADDRESS as `0x${string}`,
      abi: GOVERNOR_ABI,
      functionName: "proposalCount",
    });
    console.log("Proposal count result:", result);
    return Number(result);
  } catch (error) {
    console.error("Error getting proposal count:", error);
    return 0;
  }
}

// Get proposal details by index
export async function getProposalDetails(
  index: number,
): Promise<ProposalDetails | null> {
  try {
    const result = (await readContract(config, {
      address: GOVERNOR_CONTRACT_ADDRESS as `0x${string}`,
      abi: GOVERNOR_ABI,
      functionName: "proposalDetailsAt",
      args: [BigInt(index)],
    })) as [bigint, string[], bigint[], string[], string];

    return {
      proposalId: result[0].toString(),
      targets: result[1],
      values: result[2],
      calldatas: result[3],
      descriptionHash: result[4],
    };
  } catch (error) {
    console.error("Error getting proposal details:", error);
    return null;
  }
}

// Get proposal ID from details
export async function getProposalId(
  targets: string[],
  values: bigint[],
  calldatas: string[],
  descriptionHash: string,
): Promise<string | null> {
  try {
    console.log("Getting proposal ID with args:", {
      targets,
      values,
      calldatas,
      descriptionHash,
    });
    const result = (await readContract(config, {
      address: GOVERNOR_CONTRACT_ADDRESS as `0x${string}`,
      abi: GOVERNOR_ABI,
      functionName: "getProposalId",
      args: [targets, values, calldatas, descriptionHash],
    })) as bigint;
    console.log("Proposal ID result:", result);
    return result.toString();
  } catch (error) {
    console.error("Error getting proposal ID:", error);
    console.error("Error details:", error);
    return null;
  }
}

// Calculate description hash and get onchain proposal ID
export async function calculateOnchainProposalId(
  targets: string[],
  values: string[],
  calldatas: string[],
  description: string,
): Promise<string | null> {
  try {
    console.log("🔢 Calculating onchain proposal ID...");

    // Calculate description hash
    const descriptionHash = keccak256(toBytes(description));
    console.log("📝 Description hash:", descriptionHash);

    // Convert values to bigint array
    const valueBigInts = values.map((v) => BigInt(v));

    // Get proposal ID from contract
    const proposalId = await getProposalId(
      targets,
      valueBigInts,
      calldatas,
      descriptionHash,
    );

    console.log("🆔 Calculated onchain proposal ID:", proposalId);
    return proposalId;
  } catch (error) {
    console.error("❌ Error calculating onchain proposal ID:", error);
    return null;
  }
}

// Get proposal votes by proposal ID
export async function getProposalVotes(
  proposalId: string,
): Promise<ProposalVotes | null> {
  try {
    const result = (await readContract(config, {
      address: GOVERNOR_CONTRACT_ADDRESS as `0x${string}`,
      abi: GOVERNOR_ABI,
      functionName: "proposalVotes",
      args: [BigInt(proposalId)],
    })) as [bigint, bigint, bigint];

    return {
      againstVotes: result[0],
      forVotes: result[1],
      abstainVotes: result[2],
    };
  } catch (error) {
    console.error("Error getting proposal votes:", error);
    return null;
  }
}

// Get proposal state by proposal ID
export async function getProposalState(
  proposalId: string,
): Promise<ProposalState | null> {
  try {
    const result = await readContract(config, {
      address: GOVERNOR_CONTRACT_ADDRESS as `0x${string}`,
      abi: GOVERNOR_ABI,
      functionName: "state",
      args: [BigInt(proposalId)],
    });
    return Number(result) as ProposalState;
  } catch (error) {
    console.error("Error getting proposal state:", error);
    return null;
  }
}

// Get proposal proposer by proposal ID
export async function getProposalProposer(
  proposalId: string,
): Promise<string | null> {
  try {
    const result = await readContract(config, {
      address: GOVERNOR_CONTRACT_ADDRESS as `0x${string}`,
      abi: GOVERNOR_ABI,
      functionName: "proposalProposer",
      args: [BigInt(proposalId)],
    });
    return result as string;
  } catch (error) {
    console.error("Error getting proposal proposer:", error);
    return null;
  }
}

// Get proposal snapshot (vote start block) by proposal ID
export async function getProposalSnapshot(
  proposalId: string,
): Promise<bigint | null> {
  try {
    const result = await readContract(config, {
      address: GOVERNOR_CONTRACT_ADDRESS as `0x${string}`,
      abi: GOVERNOR_ABI,
      functionName: "proposalSnapshot",
      args: [BigInt(proposalId)],
    });
    return result as bigint;
  } catch (error) {
    console.error("Error getting proposal snapshot:", error);
    return null;
  }
}

// Get proposal deadline (vote end block) by proposal ID
export async function getProposalDeadline(
  proposalId: string,
): Promise<bigint | null> {
  try {
    const result = await readContract(config, {
      address: GOVERNOR_CONTRACT_ADDRESS as `0x${string}`,
      abi: GOVERNOR_ABI,
      functionName: "proposalDeadline",
      args: [BigInt(proposalId)],
    });
    return result as bigint;
  } catch (error) {
    console.error("Error getting proposal deadline:", error);
    return null;
  }
}

// Get quorum required at a specific timepoint
export async function getQuorum(timepoint: bigint): Promise<bigint | null> {
  try {
    const result = await readContract(config, {
      address: GOVERNOR_CONTRACT_ADDRESS as `0x${string}`,
      abi: GOVERNOR_ABI,
      functionName: "quorum",
      args: [timepoint],
    });
    return result as bigint;
  } catch (error) {
    console.error("Error getting quorum:", error);
    return null;
  }
}

// Get proposal threshold
export async function getProposalThreshold(): Promise<bigint | null> {
  try {
    const result = await readContract(config, {
      address: GOVERNOR_CONTRACT_ADDRESS as `0x${string}`,
      abi: GOVERNOR_ABI,
      functionName: "proposalThreshold",
    });
    return result as bigint;
  } catch (error) {
    console.error("Error getting proposal threshold:", error);
    return null;
  }
}

// Get voting delay
export async function getVotingDelay(): Promise<bigint | null> {
  try {
    const result = await readContract(config, {
      address: GOVERNOR_CONTRACT_ADDRESS as `0x${string}`,
      abi: GOVERNOR_ABI,
      functionName: "votingDelay",
    });
    return result as bigint;
  } catch (error) {
    console.error("Error getting voting delay:", error);
    return null;
  }
}

// Get voting period
export async function getVotingPeriod(): Promise<bigint | null> {
  try {
    const result = await readContract(config, {
      address: GOVERNOR_CONTRACT_ADDRESS as `0x${string}`,
      abi: GOVERNOR_ABI,
      functionName: "votingPeriod",
    });
    return result as bigint;
  } catch (error) {
    console.error("Error getting voting period:", error);
    return null;
  }
}

// Helper function to estimate date from block number (rough approximation)
export function estimateDateFromBlock(blockNumber: bigint): Date {
  // Assuming ~12 second block time for Ethereum/Hardhat
  // This is a rough estimate - in production you'd want to use a proper block timestamp API
  const currentBlock = Date.now() / 1000; // Current timestamp
  const estimatedBlockTime = 12; // seconds per block
  const currentBlockNumber = Math.floor(currentBlock / estimatedBlockTime);

  const blockDifference = Number(blockNumber) - currentBlockNumber;
  const timeDifference = blockDifference * estimatedBlockTime * 1000; // Convert to milliseconds

  return new Date(Date.now() + timeDifference);
}

// Format date for display
export function formatProposalDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Get token balance for an address
export async function getTokenBalance(address: string): Promise<string> {
  try {
    const result = await readContract(config, {
      address: VOTE_TOKEN_CONTRACT_ADDRESS as `0x${string}`,
      abi: TOKEN_ABI,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
    });
    return formatEther(result as bigint);
  } catch (error) {
    console.error("Error getting token balance:", error);
    return "0";
  }
}

// Get voting power for an address
export async function getVotingPower(
  address: string,
  blockNumber?: bigint,
): Promise<string> {
  try {
    const result = await readContract(config, {
      address: VOTE_TOKEN_CONTRACT_ADDRESS as `0x${string}`,
      abi: TOKEN_ABI,
      functionName: blockNumber ? "getPastVotes" : "getVotes",
      args: blockNumber
        ? [address as `0x${string}`, blockNumber]
        : [address as `0x${string}`],
    });
    return formatEther(result as bigint);
  } catch (error) {
    console.error("Error getting voting power:", error);
    return "0";
  }
}

// Delegate voting power to self or another address
export async function delegateVotes(delegatee: string) {
  try {
    const result = await writeContract(config, {
      address: VOTE_TOKEN_CONTRACT_ADDRESS as `0x${string}`,
      abi: TOKEN_ABI,
      functionName: "delegate",
      args: [delegatee as `0x${string}`],
    });

    return { hash: result };
  } catch (error) {
    console.error("Error delegating votes:", error);
    throw error;
  }
}

// Get current delegate for an address
export async function getCurrentDelegate(address: string): Promise<string> {
  try {
    const result = await readContract(config, {
      address: VOTE_TOKEN_CONTRACT_ADDRESS as `0x${string}`,
      abi: TOKEN_ABI,
      functionName: "delegates",
      args: [address as `0x${string}`],
    });
    return result as string;
  } catch (error) {
    console.error("Error getting current delegate:", error);
    return "0x0000000000000000000000000000000000000000";
  }
}

// Get token symbol
export async function getTokenSymbol(): Promise<string> {
  try {
    const result = await readContract(config, {
      address: VOTE_TOKEN_CONTRACT_ADDRESS as `0x${string}`,
      abi: TOKEN_ABI,
      functionName: "symbol",
    });
    return result as string;
  } catch (error) {
    console.error("Error getting token symbol:", error);
    return "TOKEN";
  }
}

// Check if user has voted on a proposal
export async function hasUserVoted(
  proposalId: string,
  userAddress: string,
): Promise<boolean> {
  try {
    const result = await readContract(config, {
      address: GOVERNOR_CONTRACT_ADDRESS as `0x${string}`,
      abi: GOVERNOR_ABI,
      functionName: "hasVoted",
      args: [BigInt(proposalId), userAddress as `0x${string}`],
    });
    return Boolean(result);
  } catch (error) {
    console.error("Error checking if user voted:", error);
    return false;
  }
}

// Get multiple proposals with pagination
export async function getProposals(
  startIndex: number = 0,
  count: number = 10,
): Promise<ProposalInfo[]> {
  try {
    const totalCount = await getProposalCount();
    console.log("Total proposal count:", totalCount);

    if (totalCount === 0) {
      console.log("No proposals found");
      return [];
    }

    const endIndex = Math.min(startIndex + count, totalCount);
    const proposals: ProposalInfo[] = [];

    for (let i = startIndex; i < endIndex; i++) {
      console.log(`Loading proposal at index ${i}`);
      const details = await getProposalDetails(i);
      if (!details) {
        console.log(`No details found for proposal at index ${i}`);
        continue;
      }

      const proposalId = details.proposalId;
      console.log(`Loading votes and state for proposal ID ${proposalId}`);
      const [votes, state] = await Promise.all([
        getProposalVotes(proposalId),
        getProposalState(proposalId),
      ]);

      if (votes !== null && state !== null) {
        proposals.push({
          id: proposalId,
          details,
          votes,
          state,
        });
        console.log(`Successfully loaded proposal ${proposalId}`);
      } else {
        console.log(`Failed to load votes or state for proposal ${proposalId}`);
      }
    }

    console.log(`Loaded ${proposals.length} proposals`);
    return proposals;
  } catch (error) {
    console.error("Error getting proposals:", error);
    return [];
  }
}

// Cast a vote on a proposal
export async function castVote({ proposalId, support }: VoteParams) {
  try {
    const result = await writeContract(config, {
      address: GOVERNOR_CONTRACT_ADDRESS as `0x${string}`,
      abi: GOVERNOR_ABI,
      functionName: "castVote",
      args: [BigInt(proposalId), support],
    });

    return { hash: result };
  } catch (error) {
    console.error("Error casting vote:", error);
    throw error;
  }
}

// Queue a succeeded proposal
export async function queueProposal(proposalId: string) {
  try {
    const result = await writeContract(config, {
      address: GOVERNOR_CONTRACT_ADDRESS as `0x${string}`,
      abi: GOVERNOR_ABI,
      functionName: "queue",
      args: [BigInt(proposalId)],
    });

    return { hash: result };
  } catch (error) {
    console.error("Error queueing proposal:", error);
    throw error;
  }
}

// Execute a queued proposal
export async function executeProposal(proposalId: string) {
  try {
    const result = await writeContract(config, {
      address: GOVERNOR_CONTRACT_ADDRESS as `0x${string}`,
      abi: GOVERNOR_ABI,
      functionName: "execute",
      args: [BigInt(proposalId)],
    });

    return { hash: result };
  } catch (error) {
    console.error("Error executing proposal:", error);
    throw error;
  }
}

// Create a new proposal
export async function createProposal(
  targets: string[],
  values: string[],
  calldatas: string[],
  description: string,
) {
  try {
    const valuesAsBigInt = values.map((v) => BigInt(v));

    const result = await writeContract(config, {
      address: GOVERNOR_CONTRACT_ADDRESS as `0x${string}`,
      abi: GOVERNOR_ABI,
      functionName: "propose",
      args: [targets, valuesAsBigInt, calldatas, description],
    });

    return { hash: result };
  } catch (error) {
    console.error("Error creating proposal:", error);
    throw error;
  }
}

// Format vote count for display
export function formatVoteCount(votes: bigint): string {
  const voteString = formatEther(votes);
  const voteNumber = parseFloat(voteString);

  if (voteNumber >= 1000000) {
    return `${(voteNumber / 1000000).toFixed(2)}M`;
  } else if (voteNumber >= 1000) {
    return `${(voteNumber / 1000).toFixed(2)}K`;
  } else {
    return voteNumber.toFixed(2);
  }
}

// Get proposal state text
export function getProposalStateText(state: ProposalState): string {
  switch (state) {
    case ProposalState.Pending:
      return "PENDING";
    case ProposalState.Active:
      return "ACTIVE";
    case ProposalState.Canceled:
      return "CANCELED";
    case ProposalState.Defeated:
      return "DEFEATED";
    case ProposalState.Succeeded:
      return "SUCCEEDED";
    case ProposalState.Queued:
      return "QUEUED";
    case ProposalState.Expired:
      return "EXPIRED";
    case ProposalState.Executed:
      return "EXECUTED";
    default:
      return "UNKNOWN";
  }
}

// Get vote support text
export function getVoteSupportText(support: 0 | 1 | 2): string {
  switch (support) {
    case 0:
      return "Against";
    case 1:
      return "For";
    case 2:
      return "Abstain";
    default:
      return "Unknown";
  }
}

// Check if user is connected to a supported network (now supports all networks)
export function isSupportedNetwork(chainId: number | undefined): boolean {
  // Allow all networks including Hardhat (31337), Arbitrum (42161), Ethereum mainnet (1), etc.
  return chainId !== undefined && chainId > 0;
}

// Get network information
export function getNetworkInfo(chainId: number | undefined): {
  name: string;
  symbol: string;
} {
  switch (chainId) {
    case 1:
      return { name: "Ethereum Mainnet", symbol: "ETH" };
    case 42161:
      return { name: "Arbitrum One", symbol: "ARB" };
    case 31337:
      return { name: "Hardhat Network", symbol: "HDT" };
    case 11155111:
      return { name: "Sepolia Testnet", symbol: "SEP" };
    case 421614:
      return { name: "Arbitrum Sepolia", symbol: "ARB" };
    case 137:
      return { name: "Polygon", symbol: "MATIC" };
    case 56:
      return { name: "BSC", symbol: "BNB" };
    case 10:
      return { name: "Optimism", symbol: "OP" };
    case 8453:
      return { name: "Base", symbol: "ETH" };
    default:
      return { name: `Chain ${chainId}`, symbol: "ETH" };
  }
}

// Legacy function for backward compatibility
export function isArbitrumNetwork(chainId: number | undefined): boolean {
  return isSupportedNetwork(chainId);
}
