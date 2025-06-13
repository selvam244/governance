const { ethers } = require("hardhat");
const { keccak256, toUtf8Bytes, Interface } = require("ethers");
const path = require("path");
const fs = require("fs");

async function main() {
  const [proposer] = await ethers.getSigners();
  console.log("Proposer Address:", proposer.address);
  const GOVERNOR_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/MyGovernor.sol/MyGovernor.json",
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abi = artifact.abi;
  const targets = [proposer.address];
  const values = [0];
  const calldatas = ["0x"];
  const description = "Proposal #3: Example proposal description 3";
  const descriptionHash = keccak256(toUtf8Bytes(description));
  const govern = new ethers.Contract(GOVERNOR_ADDRESS, abi, proposer);

  const proposalId = await govern.getProposalId(
    targets,
    values,
    calldatas,
    descriptionHash,
  );
  console.log("proposalId:", proposalId);
  console.log("Vote Count:", await govern.proposalVotes(proposalId));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
