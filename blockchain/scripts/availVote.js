const { ethers } = require("hardhat");
const { keccak256, toUtf8Bytes, Interface } = require("ethers");
const path = require("path");
const fs = require("fs");

async function main() {
  const [proposer] = await ethers.getSigners();
  console.log("Proposer Address:", proposer.address);
  const TOKEN_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const GOVERNOR_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
  const tokenArtifactPath = path.join(
    __dirname,
    "../artifacts/contracts/MyToken.sol/MyToken.json",
  );
  const governorArtifactPath = path.join(
    __dirname,
    "../artifacts/contracts/MyGovernor.sol/MyGovernor.json",
  );
  const tokenArtifact = JSON.parse(fs.readFileSync(tokenArtifactPath, "utf8"));
  const governanceArtifact = JSON.parse(
    fs.readFileSync(governorArtifactPath, "utf8"),
  );
  const tokenABI = tokenArtifact.abi;
  const governanceABI = governanceArtifact.abi;
  const token = new ethers.Contract(TOKEN_ADDRESS, tokenABI, proposer);
  const govern = new ethers.Contract(GOVERNOR_ADDRESS, governanceABI, proposer);
  const targets = [proposer.address];
  const values = [0];
  const calldatas = ["0x"];
  const description = "Proposal #2: Example proposal description 2";
  const descriptionHash = keccak256(toUtf8Bytes(description));
  const proposalId = await govern.getProposalId(
    targets,
    values,
    calldatas,
    descriptionHash,
  );
  const proposalSnapshot = await govern.proposalSnapshot(proposalId);
  const pastVotes = await token.getPastVotes(
    proposer.address,
    proposalSnapshot,
  );
  const currentVote = await token.getVotes(proposer.address);
  const balance = await token.balanceOf(proposer.address);
  console.log("proposalId:", proposalId);
  console.log("Current State:", await govern.state(proposalId));
  console.log("GOpen balance:", balance);
  console.log("Current Vote:", currentVote);
  console.log("pastVotes:", pastVotes);
  if (currentVote != balance) {
    console.log("Delegating votes.....");
    try {
      const tx = await token.delegate(proposer.address);
      const receipt = await tx.wait();
      console.log(`Proposal created! Tx hash: ${receipt.hash}`);
    } catch (err) {
      console.log(err);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
