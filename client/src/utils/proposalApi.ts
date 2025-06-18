// API utility functions for proposal management

const API_BASE_URL = "http://localhost:3333";

export interface CreateProposalRequest {
  onchain_id: string;
  title: string;
  description: string;
  published?: boolean;
  userId: number;
}

export interface UpdateProposalRequest {
  title?: string;
  description?: string;
  published?: boolean;
  state?: number;
  for?: number;
  against?: number;
  abstain?: number;
}

export interface UpdateVotesRequest {
  for?: number;
  against?: number;
  abstain?: number;
}

export interface ProposalResponse {
  id: number;
  onchain_id: string;
  title: string;
  description: string;
  published: boolean;
  state: number;
  for: number;
  against: number;
  abstain: number;
  userId: number;
  user: {
    id: number;
    address: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  requestId?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ProposalApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any,
  ) {
    super(message);
    this.name = "ProposalApiError";
  }
}

/**
 * Create a new proposal in the backend
 */
export async function createProposalInBackend(
  proposalData: CreateProposalRequest,
): Promise<ProposalResponse> {
  try {
    console.log("🔥 Creating proposal in backend:", proposalData);

    const response = await fetch(`${API_BASE_URL}/api/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(proposalData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ProposalApiError(
        data.error || `Failed to create proposal: ${response.statusText}`,
        response.status,
        data,
      );
    }

    console.log("✅ Proposal created in backend:", data.data);
    return data.data;
  } catch (error) {
    console.error("❌ Failed to create proposal in backend:", error);
    if (error instanceof ProposalApiError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new ProposalApiError(
        "Unable to connect to server. Please check if the API server is running on port 3333.",
        0,
      );
    }

    throw new ProposalApiError(
      error instanceof Error ? error.message : "Unknown error occurred",
      0,
    );
  }
}

/**
 * Get all proposals with optional filters
 */
export async function getProposals(params?: {
  published?: boolean;
  state?: number;
  userId?: number;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<ProposalResponse>> {
  try {
    const queryParams = new URLSearchParams();

    if (params?.published !== undefined)
      queryParams.append("published", params.published.toString());
    if (params?.state !== undefined)
      queryParams.append("state", params.state.toString());
    if (params?.userId !== undefined)
      queryParams.append("userId", params.userId.toString());
    if (params?.page !== undefined)
      queryParams.append("page", params.page.toString());
    if (params?.limit !== undefined)
      queryParams.append("limit", params.limit.toString());

    const url = `${API_BASE_URL}/api/proposals${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ProposalApiError(
        data.error || `Failed to fetch proposals: ${response.statusText}`,
        response.status,
        data,
      );
    }

    return data;
  } catch (error) {
    console.error("❌ Failed to fetch proposals:", error);
    throw error;
  }
}

/**
 * Get proposal by ID
 */
export async function getProposalById(id: number): Promise<ProposalResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/proposals/${id}`, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ProposalApiError(
        data.error || `Failed to fetch proposal: ${response.statusText}`,
        response.status,
        data,
      );
    }

    return data.data;
  } catch (error) {
    console.error("❌ Failed to fetch proposal by ID:", error);
    throw error;
  }
}

/**
 * Get proposal by onchain ID
 */
export async function getProposalByOnchainId(
  onchainId: string,
): Promise<ProposalResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/proposals/onchain/${onchainId}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new ProposalApiError(
        data.error || `Failed to fetch proposal: ${response.statusText}`,
        response.status,
        data,
      );
    }

    return data.data;
  } catch (error) {
    console.error("❌ Failed to fetch proposal by onchain ID:", error);
    throw error;
  }
}

/**
 * Get proposals by user ID
 */
export async function getProposalsByUserId(
  userId: number,
  params?: {
    published?: boolean;
    state?: number;
    page?: number;
    limit?: number;
  },
): Promise<PaginatedResponse<ProposalResponse>> {
  try {
    const queryParams = new URLSearchParams();

    if (params?.published !== undefined)
      queryParams.append("published", params.published.toString());
    if (params?.state !== undefined)
      queryParams.append("state", params.state.toString());
    if (params?.page !== undefined)
      queryParams.append("page", params.page.toString());
    if (params?.limit !== undefined)
      queryParams.append("limit", params.limit.toString());

    const url = `${API_BASE_URL}/api/proposals/user/${userId}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ProposalApiError(
        data.error || `Failed to fetch user proposals: ${response.statusText}`,
        response.status,
        data,
      );
    }

    return data;
  } catch (error) {
    console.error("❌ Failed to fetch proposals by user ID:", error);
    throw error;
  }
}

/**
 * Update proposal
 */
export async function updateProposal(
  proposalId: number,
  updateData: UpdateProposalRequest,
): Promise<ProposalResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/proposals/${proposalId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(updateData),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new ProposalApiError(
        data.error || `Failed to update proposal: ${response.statusText}`,
        response.status,
        data,
      );
    }

    return data.data;
  } catch (error) {
    console.error("❌ Failed to update proposal:", error);
    throw error;
  }
}

/**
 * Update proposal votes
 */
export async function updateProposalVotes(
  proposalId: number,
  votes: UpdateVotesRequest,
): Promise<{
  id: number;
  onchain_id: string;
  for: number;
  against: number;
  abstain: number;
}> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/proposals/${proposalId}/votes`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(votes),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new ProposalApiError(
        data.error || `Failed to update votes: ${response.statusText}`,
        response.status,
        data,
      );
    }

    return data.data;
  } catch (error) {
    console.error("❌ Failed to update proposal votes:", error);
    throw error;
  }
}

/**
 * Delete proposal
 */
export async function deleteProposal(proposalId: number): Promise<void> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/proposals/${proposalId}`,
      {
        method: "DELETE",
        headers: {
          accept: "application/json",
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new ProposalApiError(
        data.error || `Failed to delete proposal: ${response.statusText}`,
        response.status,
        data,
      );
    }
  } catch (error) {
    console.error("❌ Failed to delete proposal:", error);
    throw error;
  }
}

/**
 * Get proposal statistics
 */
export async function getProposalStats(): Promise<{
  total: number;
  published: number;
  drafts: number;
  byState: Record<string, number>;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/proposals/stats`, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ProposalApiError(
        data.error || `Failed to fetch stats: ${response.statusText}`,
        response.status,
        data,
      );
    }

    return data.data;
  } catch (error) {
    console.error("❌ Failed to fetch proposal stats:", error);
    throw error;
  }
}

/**
 * Get user ID from wallet address
 */
export async function getUserByAddress(address: string): Promise<{
  id: number;
  address: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/users/address/${address}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new ProposalApiError(
        data.error || `Failed to fetch user: ${response.statusText}`,
        response.status,
        data,
      );
    }

    return data.data;
  } catch (error) {
    console.error("❌ Failed to fetch user by address:", error);
    throw error;
  }
}

/**
 * Format API error for display
 */
export function formatProposalApiError(error: unknown): string {
  if (error instanceof ProposalApiError) {
    if (error.status === 0) {
      return error.message;
    }
    return `${error.message} (${error.status})`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
}
