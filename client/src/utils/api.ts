// API utility functions for authentication and other API calls

const API_BASE_URL = "http://localhost:3333";

export interface AuthRequest {
  message: string;
  signature: string;
  address?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    address: string;
    authenticated: boolean;
  };
  message?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Authenticate user with signed message
 */
export async function authenticateUser(
  message: string,
  signature: string,
  address?: string,
): Promise<AuthResponse> {
  try {
    const requestBody: AuthRequest = {
      message,
      signature,
      ...(address && { address }),
    };

    console.log("🔐 Authentication Request:", {
      url: `${API_BASE_URL}/api/users/auth`,
      method: "POST",
      body: requestBody,
      messageLength: message.length,
      signatureLength: signature.length,
    });

    const response = await fetch(`${API_BASE_URL}/api/users/auth`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("📡 Response Status:", response.status, response.statusText);
    console.log(
      "📡 Response Headers:",
      Object.fromEntries(response.headers.entries()),
    );

    let data;
    try {
      data = await response.json();
      console.log("📡 Response Data:", data);
    } catch (jsonError) {
      console.error("❌ Failed to parse JSON response:", jsonError);
      const text = await response.text();
      console.log("📄 Raw response text:", text);
      throw new ApiError(`Invalid JSON response: ${text}`, response.status);
    }

    if (!response.ok) {
      console.error("❌ API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        data,
      });

      // Provide more detailed error messages
      let errorMessage = `Authentication failed: ${response.statusText}`;
      if (data) {
        if (typeof data === "string") {
          errorMessage = data;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else {
          errorMessage += ` | Server response: ${JSON.stringify(data)}`;
        }
      }

      throw new ApiError(errorMessage, response.status, data);
    }

    console.log("✅ Authentication successful:", data);
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new ApiError(
        "Unable to connect to server. Please check if the API server is running on port 3333.",
        0,
      );
    }

    console.error("❌ Unexpected error:", error);
    throw new ApiError(
      error instanceof Error ? error.message : "Unknown error occurred",
      0,
    );
  }
}

/**
 * Generic API request function
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || `Request failed: ${response.statusText}`,
        response.status,
        data,
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new ApiError(
        "Unable to connect to server. Please check your connection.",
        0,
      );
    }

    throw new ApiError(
      error instanceof Error ? error.message : "Unknown error occurred",
      0,
    );
  }
}

/**
 * Format API error for display
 */
export function formatApiError(error: unknown): string {
  if (error instanceof ApiError) {
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
