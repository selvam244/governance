import { parseEther, formatEther } from "viem";
import { readContract, writeContract } from "wagmi/actions";
import { config } from "../providers/Web3Provider";
import MyGovernorABI from "../contracts/MyGovernor.json";
import MyTokenABI from "../contracts/MyToken.json";
import TimelockControllerABI from "../contracts/TimelockController.json";

// Governor contract address from environment
export const GOVERNOR_CONTRACT_ADDRESS =
  "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

// Timelock contract address from environment
export const TIMELOCK_CONTRACT_ADDRESS =
  "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

// Vote token contract address from environment
export const VOTE_TOKEN_CONTRACT_ADDRESS =
  "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

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
    })) as [string[], bigint[], string[], string];
    alert(result[0]);
    return {
      targets: result[0],
      values: result[1],
      calldatas: result[2],
      descriptionHash: result[3],
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
    const result = await readContract(config, {
      address: GOVERNOR_CONTRACT_ADDRESS as `0x${string}`,
      abi: GOVERNOR_ABI,
      functionName: "getProposalId",
      args: [targets, values, calldatas, descriptionHash],
    });
    return result.toString();
  } catch (error) {
    console.error("Error getting proposal ID:", error);
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

      const proposalId = await getProposalId(
        details.targets,
        details.values,
        details.calldatas,
        details.descriptionHash,
      );
      if (!proposalId) {
        console.log(`No proposal ID found for proposal at index ${i}`);
        continue;
      }

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
