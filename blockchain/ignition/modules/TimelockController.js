const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("TimelockControllerModule", (m) => {
  const minDelay = 3600;
  const proposers = [];
  const executors = [];
  const admin = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  const timelock = m.contract(
    "TimelockController",
    [minDelay, [], [], admin],
    {},
  );
  return { timelock };
});
