const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("GovernanceModule", (m) => {
  const minDelay = 3600;
  const proposers = [];
  const executors = [];
  const admin = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  const myToken = m.contract("MyToken", [], {});
  const timelock = m.contract(
    "TimelockController",
    [minDelay, [], [], admin],
    {},
  );
  const govern = m.contract(
    "MyGovernor",
    [myToken, timelock],
    {},
  );
  return { myToken, timelock, govern };
});