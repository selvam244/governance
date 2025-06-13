const { ethers } = require("hardhat");
const { keccak256, toUtf8Bytes, Interface } = require("ethers");
const path = require("path");
const fs = require("fs");

async function main() {
  const [proposer] = await ethers.getSigners();
  console.log("Proposer Address:", proposer.address);
  const GOVERNOR_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
  const TIMELOCK_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  const artifactPath = path.join(
    __dirname,
    "../artifacts/@openzeppelin/contracts/governance/TimelockController.sol/TimelockController.json",
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abi = artifact.abi;
  const timelock = new ethers.Contract(TIMELOCK_ADDRESS, abi, proposer);
  const EXECUTOR_ROLE = keccak256(toUtf8Bytes("EXECUTOR_ROLE"));
  const PROPOSER_ROLE = keccak256(toUtf8Bytes("PROPOSER_ROLE"));
  const hasExecuteRole = await timelock.hasRole(
    EXECUTOR_ROLE,
    GOVERNOR_ADDRESS,
  );
  const hasProposeRole = await timelock.hasRole(
    PROPOSER_ROLE,
    GOVERNOR_ADDRESS,
  );
  console.log(hasExecuteRole);
  if (!hasExecuteRole) {
    await timelock.grantRole(EXECUTOR_ROLE, GOVERNOR_ADDRESS);
    console.log("Grant execute role");
  }
  if (!hasProposeRole) {
    await timelock.grantRole(PROPOSER_ROLE, GOVERNOR_ADDRESS);
    console.log("Grant propose role");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
