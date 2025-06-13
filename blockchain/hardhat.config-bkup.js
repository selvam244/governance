require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.8.27", // or your specific version
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337, // hardhat
    },
  },
  etherscan: {
    apiKey: {
      localhost: "SCAN_API_KEY_OPN",
    },
    customChains: [
      {
        network: "localhost",
        chainId: 31337,
        urls: {
          apiURL: "http://localhost/api",
          browserURL: "http://localhost",
        },
      },
    ],
  },
};
