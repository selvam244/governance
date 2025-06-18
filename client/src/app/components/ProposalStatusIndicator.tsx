"use client";

import React from "react";

interface ProposalStatusIndicatorProps {
  currentStep: "idle" | "saving" | "submitting" | "completed" | "error";
  backendProposalId?: number | null;
  isVisible: boolean;
  error?: string | null;
  errorStep?: "saving" | "submitting" | null;
}

export default function ProposalStatusIndicator({
  currentStep,
  backendProposalId,
  isVisible,
  error,
  errorStep,
}: ProposalStatusIndicatorProps) {
  if (!isVisible) return null;

  const steps = [
    {
      id: "saving",
      title: "Calculating ID & Saving",
      description: "Calculating onchain proposal ID and saving to database",
      icon: "🔢",
    },
    {
      id: "submitting",
      title: "Submitting to Blockchain",
      description: "Creating proposal on governance contract",
      icon: "⛓️",
    },
    {
      id: "completed",
      title: "Completed",
      description: "Proposal successfully created and published",
      icon: "🎉",
    },
  ];

  const getStepStatus = (stepId: string) => {
    const stepIndex = steps.findIndex((s) => s.id === stepId);
    const currentIndex = steps.findIndex((s) => s.id === currentStep);

    // Handle error states
    if (currentStep === "error" && errorStep === stepId) {
      return "error";
    }

    if (currentStep === "completed") {
      return "completed";
    }

    if (stepIndex < currentIndex) {
      return "completed";
    } else if (stepIndex === currentIndex) {
      return "active";
    } else {
      return "pending";
    }
  };

  const getStepClasses = (status: string) => {
    switch (status) {
      case "completed":
        return {
          circle: "bg-green-500 text-white",
          text: "text-green-700",
          line: "bg-green-500",
        };
      case "active":
        return {
          circle: "bg-blue-500 text-white animate-pulse",
          text: "text-blue-700 font-medium",
          line: "bg-gray-300",
        };
      case "error":
        return {
          circle: "bg-red-500 text-white",
          text: "text-red-700 font-medium",
          line: "bg-gray-300",
        };
      case "pending":
        return {
          circle: "bg-gray-300 text-gray-500",
          text: "text-gray-500",
          line: "bg-gray-300",
        };
      default:
        return {
          circle: "bg-gray-300 text-gray-500",
          text: "text-gray-500",
          line: "bg-gray-300",
        };
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-blue-900">
          Proposal Submission Progress
        </h4>
        {currentStep === "completed" && (
          <div className="flex items-center space-x-2 text-green-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium">Success!</span>
          </div>
        )}
        {currentStep === "error" && (
          <div className="flex items-center space-x-2 text-red-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium">Error Occurred</span>
          </div>
        )}
      </div>

      <div className="relative">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const classes = getStepClasses(status);
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="relative flex items-start">
              {/* Step indicator */}
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${classes.circle}`}
                >
                  {status === "completed" ? (
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : status === "active" ? (
                    <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                  ) : status === "error" ? (
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Connecting line */}
                {!isLast && (
                  <div
                    className={`absolute left-5 top-10 w-0.5 h-16 ${classes.line}`}
                  />
                )}
              </div>

              {/* Step content */}
              <div className="ml-4 pb-8">
                <div className={`text-sm font-medium ${classes.text}`}>
                  {step.icon} {step.title}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {step.description}
                </div>

                {/* Additional info for each step */}
                {step.id === "saving" && status === "active" && (
                  <div className="mt-2 text-xs text-blue-600">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <span>
                        Calculating onchain proposal ID and saving to
                        database...
                      </span>
                    </div>
                  </div>
                )}

                {step.id === "saving" &&
                  status === "completed" &&
                  backendProposalId && (
                    <div className="mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      ✅ Saved with ID: {backendProposalId}
                    </div>
                  )}

                {step.id === "submitting" && status === "active" && (
                  <div className="mt-2 text-xs text-blue-600">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.3s]"></div>
                      <span className="ml-2">
                        Please confirm in your wallet...
                      </span>
                    </div>
                  </div>
                )}

                {step.id === "completed" && status === "completed" && (
                  <div className="mt-2 text-xs text-green-600">
                    <div className="bg-green-50 border border-green-200 rounded p-2">
                      <div className="font-medium">
                        Proposal created successfully!
                      </div>
                      <div className="mt-1">
                        • Saved to database with ID: {backendProposalId}
                      </div>
                      <div>• Onchain proposal ID calculated and stored</div>
                      <div>
                        • Submitted to blockchain and marked as published
                      </div>
                      <div className="mt-2 text-xs text-green-700 font-medium">
                        ✅ Redirecting to proposals page...
                      </div>
                    </div>
                  </div>
                )}

                {/* Error states */}
                {status === "error" && error && (
                  <div className="mt-2 text-xs text-red-600">
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      <div className="font-medium flex items-center space-x-1">
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
                        <span>
                          {step.id === "saving"
                            ? "Failed to save proposal"
                            : "Failed to submit to blockchain"}
                        </span>
                      </div>
                      <div className="mt-1 text-red-700">{error}</div>
                      {step.id === "submitting" && backendProposalId && (
                        <div className="mt-2">
                          <div className="text-xs text-green-600">
                            ✅ Proposal saved to database (ID:{" "}
                            {backendProposalId})
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            💡 You can retry submitting to blockchain later
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Progress</span>
          <span>
            {currentStep === "completed"
              ? "100%"
              : currentStep === "submitting"
                ? "66%"
                : currentStep === "saving"
                  ? "33%"
                  : "0%"}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              currentStep === "completed"
                ? "w-full bg-green-500"
                : currentStep === "submitting"
                  ? "w-2/3 bg-blue-500"
                  : currentStep === "saving"
                    ? "w-1/3 bg-blue-500"
                    : "w-0 bg-blue-500"
            }`}
          />
        </div>
      </div>

      {/* Help text */}
      <div className="mt-4 text-xs text-gray-500">
        {currentStep === "saving" && (
          <div className="flex items-start space-x-2">
            <svg
              className="w-4 h-4 mt-0.5 text-blue-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              Calculating the onchain proposal ID and saving your proposal to
              the database. This ensures proper tracking and prevents data loss.
            </span>
          </div>
        )}
        {currentStep === "submitting" && (
          <div className="flex items-start space-x-2">
            <svg
              className="w-4 h-4 mt-0.5 text-blue-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              Your proposal is being submitted to the governance contract.
              Please confirm the transaction in your wallet.
            </span>
          </div>
        )}
        {currentStep === "completed" && (
          <div className="flex items-start space-x-2">
            <svg
              className="w-4 h-4 mt-0.5 text-green-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              Your proposal has been successfully created with the correct
              onchain ID and is now published. The proposal state will update
              based on governance contract rules.
            </span>
          </div>
        )}
        {currentStep === "error" && (
          <div className="flex items-start space-x-2">
            <svg
              className="w-4 h-4 mt-0.5 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              {errorStep === "saving"
                ? "Failed to save proposal to database. Please check your connection and try again."
                : errorStep === "submitting"
                  ? "Failed to submit to blockchain. Your proposal is saved in the database and you can retry later."
                  : "An error occurred during proposal creation. Please try again."}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
