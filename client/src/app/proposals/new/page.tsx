"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "../../../contexts/WalletContext";
import { getNetworkInfo } from "../../../utils/governance";

export default function NewProposalPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { address, isConnected, chainId } = useWallet();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      alert("Please connect your wallet first");
      return;
    }

    if (!title.trim() || !description.trim()) {
      alert("Please fill in both title and description");
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Implement actual proposal submission logic
      console.log("Submitting proposal:", { title, description, address });

      // Simulate submission
      await new Promise((resolve) => setTimeout(resolve, 2000));

      alert("Proposal submitted successfully!");
      router.push("/proposals");
    } catch (error) {
      console.error("Error submitting proposal:", error);
      alert("Failed to submit proposal. Please try again.");
    } finally {
      setIsSubmitting(false);
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                required
              />
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
                className="w-full px-4 py-4 border-l border-r border-b border-gray-300 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-none"
                required
              />
            </div>

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
                {isSubmitting ? "Submitting..." : "Submit Proposal"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
