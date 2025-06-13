require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify"); // Required for verification

module.exports = {
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545", // Hardhat RPC
      chainId: 31337, // Hardhat default chain ID
    },
  },
  etherscan: {
    apiKey: {
      // Dummy key (not needed for local verification)
      localhost: "no-api-key-needed",
    },
    customChains: [
      {
        network: "localhost",
        chainId: 31337,
        urls: {
          apiURL: "http://localhost/api", // Your custom Blockscout API endpoint
          browserURL: "http://localhost", // Your Blockscout explorer URL
        },
      },
    ],
  },
  sourcify: {
    enabled: false, // Disable if you're only using Blockscout
  },
};
