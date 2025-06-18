"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "../../../contexts/WalletContext";
import {
  getNetworkInfo,
  createProposal,
  calculateOnchainProposalId,
} from "../../../utils/governance";
import {
  createProposalInBackend,
  updateProposal,
  getUserByAddress,
  formatProposalApiError,
} from "../../../utils/proposalApi";
import ProposalStatusIndicator from "../../components/ProposalStatusIndicator";

export default function NewProposalPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    "idle" | "saving" | "submitting" | "completed" | "error"
  >("idle");
  const [backendProposalId, setBackendProposalId] = useState<number | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [errorStep, setErrorStep] = useState<"saving" | "submitting" | null>(
    null,
  );
  const { address, isConnected, chainId, isAuthenticated } = useWallet();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      return;
    }

    if (!isAuthenticated) {
      return;
    }

    if (!title.trim() || !description.trim()) {
      return;
    }

    setIsSubmitting(true);
    setCurrentStep("saving");
    setError(null);
    setErrorStep(null);

    try {
      // Step 1: Get user ID from address
      console.log("🔍 Getting user ID for address:", address);
      const user = await getUserByAddress(address);
      console.log("✅ Found user:", user);

      // Step 2: Calculate onchain proposal ID before saving
      console.log("🔢 Calculating onchain proposal ID...");
      const combinedDescription = `${title}\n\n${description}`;
      const targets = [address];
      const values = ["0"];
      const calldatas = ["0x"];

      const onchainProposalId = await calculateOnchainProposalId(
        targets,
        values,
        calldatas,
        combinedDescription,
      );

      if (!onchainProposalId) {
        throw new Error("Failed to calculate onchain proposal ID");
      }

      console.log("✅ Calculated onchain proposal ID:", onchainProposalId);

      // Step 3: Save proposal to backend with calculated onchain ID
      console.log("💾 Saving proposal to backend...");

      const backendProposal = await createProposalInBackend({
        onchain_id: onchainProposalId,
        title: title.trim(),
        description: description.trim(),
        published: false, // Start as draft
        userId: user.id,
      });

      setBackendProposalId(backendProposal.id);
      console.log("✅ Proposal saved to backend with ID:", backendProposal.id);

      // Step 4: Submit to blockchain
      setCurrentStep("submitting");
      console.log("⛓️ Submitting proposal to blockchain...");

      console.log("Submitting proposal with args:", {
        targets,
        values,
        calldatas,
        description: combinedDescription,
      });

      // Call the actual propose method
      const result = await createProposal(
        targets,
        values,
        calldatas,
        combinedDescription,
      );

      console.log(
        "✅ Proposal created on blockchain with transaction hash:",
        result.hash,
      );

      // Step 5: Update backend to mark as published (not necessarily active)
      console.log("🔗 Updating proposal to published state...");
      await updateProposal(backendProposal.id, {
        published: true,
        // Note: Don't set state to active - proposal might be in pending state
      });

      setCurrentStep("completed");
      console.log("🎉 Proposal creation completed successfully!");

      // Refresh the proposals list
      if ((window as any).refreshProposals) {
        (window as any).refreshProposals();
      }

      // Navigate to proposals after a short delay to show completion state
      setTimeout(() => {
        router.push("/proposals");
      }, 2000);
    } catch (error) {
      console.error("❌ Error in proposal submission:", error);

      // Set error state and step
      setCurrentStep("error");
      if (currentStep === "saving") {
        setErrorStep("saving");
        setError(formatProposalApiError(error));
      } else if (currentStep === "submitting") {
        setErrorStep("submitting");
        setError(
          error instanceof Error ? error.message : "Unknown blockchain error",
        );
      } else {
        setErrorStep(null);
        setError("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
      // Reset to idle after showing the state for a while
      if (currentStep === "completed" || currentStep === "error") {
        setTimeout(() => {
          setCurrentStep("idle");
          setError(null);
          setErrorStep(null);
        }, 5000);
      }
    }
  };

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Connect Wallet Required
            </h1>
            <p className="text-gray-600">
              Please connect your wallet to create a new proposal.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Authentication Required
            </h1>
            <p className="text-gray-600 mb-6">
              You must sign in with your wallet to create a new proposal. This
              ensures only verified users can participate in governance.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Why sign in?</strong> Authentication prevents spam and
                ensures accountability in the governance process.
              </p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div
          key={address || "no-address"}
          className="bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">New Proposal</h1>
              {isConnected && (
                <div className="text-sm text-gray-600">
                  Network:{" "}
                  <span className="font-semibold text-green-600">
                    {getNetworkInfo(chainId).name}
                  </span>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Title Section */}
            <div>
              <label
                htmlFor="title"
                className="block text-lg font-semibold text-gray-900 mb-4"
              >
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter the title of your proposal"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base ${
                  title.trim() === "" && isSubmitting
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                }`}
                required
              />
              {title.trim() === "" && isSubmitting && (
                <div className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Title is required</span>
                </div>
              )}
            </div>

            {/* Description Section */}
            <div>
              <label
                htmlFor="description"
                className="block text-lg font-semibold text-gray-900 mb-4"
              >
                Description
              </label>

              {/* Rich Text Editor Toolbar */}
              <div className="border border-gray-300 rounded-t-lg bg-gray-50">
                <div className="flex items-center px-4 py-3 space-x-1">
                  {/* Undo/Redo */}
                  <button
                    type="button"
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                    title="Undo"
                  >
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
                        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                    title="Redo"
                  >
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
                        d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
                      />
                    </svg>
                  </button>

                  <div className="w-px h-6 bg-gray-300 mx-2"></div>

                  {/* Text Formatting */}
                  <button
                    type="button"
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded font-bold"
                    title="Bold"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded italic"
                    title="Italic"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded underline"
                    title="Underline"
                  >
                    U
                  </button>

                  <div className="w-px h-6 bg-gray-300 mx-2"></div>

                  {/* Block Type Dropdown */}
                  <select className="px-3 py-1 text-sm border border-gray-300 rounded bg-white text-gray-600">
                    <option>Block type</option>
                    <option>Paragraph</option>
                    <option>Heading 1</option>
                    <option>Heading 2</option>
                    <option>Heading 3</option>
                  </select>

                  <div className="w-px h-6 bg-gray-300 mx-2"></div>

                  {/* Lists */}
                  <button
                    type="button"
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                    title="Bullet List"
                  >
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
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                    title="Numbered List"
                  >
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
                        d="M3 4h18M3 12h18m-9 8h9"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                    title="Checklist"
                  >
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </button>

                  <div className="w-px h-6 bg-gray-300 mx-2"></div>

                  {/* Link */}
                  <button
                    type="button"
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                    title="Insert Link"
                  >
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
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  </button>

                  {/* Code */}
                  <button
                    type="button"
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                    title="Code Block"
                  >
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
                        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                      />
                    </svg>
                  </button>

                  {/* Image */}
                  <button
                    type="button"
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                    title="Insert Image"
                  >
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
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </button>

                  {/* Table */}
                  <button
                    type="button"
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                    title="Insert Table"
                  >
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
                        d="M3 10h18M3 14h18m-9-4v8m-7 0V4a1 1 0 011-1h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V10z"
                      />
                    </svg>
                  </button>

                  {/* More options */}
                  <button
                    type="button"
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded bg-blue-100"
                    title="More Options"
                  >
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
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                      />
                    </svg>
                  </button>

                  {/* MJ (likely MathJax) */}
                  <button
                    type="button"
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded font-mono text-sm"
                    title="Math Formula"
                  >
                    MJ
                  </button>
                </div>
              </div>

              {/* Text Area */}
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter your proposal description..."
                rows={20}
                className={`w-full px-4 py-4 border-l border-r border-b rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-none ${
                  description.trim() === "" && isSubmitting
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                }`}
                required
              />
              {description.trim() === "" && isSubmitting && (
                <div className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Description is required</span>
                </div>
              )}
            </div>

            {/* Progress Indicator */}
            <ProposalStatusIndicator
              currentStep={currentStep}
              backendProposalId={backendProposalId}
              isVisible={
                isSubmitting ||
                currentStep === "completed" ||
                currentStep === "error"
              }
              error={error}
              errorStep={errorStep}
            />

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? currentStep === "saving"
                    ? "Calculating ID & Saving..."
                    : currentStep === "submitting"
                      ? "Submitting to Blockchain..."
                      : "Processing..."
                  : "Submit Proposal"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
