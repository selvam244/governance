"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useWallet } from "../../contexts/WalletContext";

export default function Header() {
  const pathname = usePathname();
  const {
    isConnected,
    isAuthenticated,
    isAuthenticating,
    authenticate,
    authError,
  } = useWallet();
  return (
    <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center relative">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="ml-3 text-xl font-semibold text-gray-900">
                Arbitrum
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className={`flex items-center px-3 py-2 text-sm font-medium ${
                pathname === "/"
                  ? "text-blue-600 hover:text-blue-700 relative"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Home
              {pathname === "/" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </Link>
            <Link
              href="/proposals"
              className={`flex items-center px-3 py-2 text-sm font-medium ${
                pathname === "/proposals"
                  ? "text-blue-600 hover:text-blue-700 relative"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                  clipRule="evenodd"
                />
              </svg>
              Proposals
              {pathname === "/proposals" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </Link>
          </nav>

          {/* Connect Wallet and Authentication */}
          <div className="flex items-center space-x-4">
            <ConnectButton />

            {/* Authentication Status/Button */}
            {isConnected && (
              <div className="flex items-center space-x-2">
                {isAuthenticated ? (
                  <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Authenticated</span>
                  </div>
                ) : (
                  <button
                    onClick={authenticate}
                    disabled={isAuthenticating}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {isAuthenticating ? "Signing..." : "Sign In"}
                  </button>
                )}

                {authError && (
                  <div className="absolute top-full right-0 mt-2 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm max-w-xs">
                    {authError}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
