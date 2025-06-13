const { ethers, network } = require("hardhat");
const { keccak256, toUtf8Bytes } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
  const [signer] = await ethers.getSigners();
  const GOVERNOR_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/MyGovernor.sol/MyGovernor.json",
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abi = artifact.abi;
  const govern = new ethers.Contract(GOVERNOR_ADDRESS, abi, signer);
  const targets = [signer.address];
  const values = [0];
  const calldatas = ["0x"];
  const description = "Proposal #3: Example proposal description 3";
  const descriptionHash = keccak256(toUtf8Bytes(description));
  const proposalId = await govern.getProposalId(
    targets,
    values,
    calldatas,
    descriptionHash,
  );
	const snapshotTime = await govern.proposalSnapshot(proposalId);
	const votingPeriod = await govern.votingPeriod()
	const deadline = snapshotTime + votingPeriod;
	const block = await ethers.provider.getBlock("latest");
	const now = BigInt(block.timestamp);
  console.log("Current Time:", now.toString());
  console.log("Proposal Deadline:", deadline);
  const timeToBePassed = deadline - now;
  console.log(`⏱️ Fast forwarding time by ${timeToBePassed} seconds...`);
  if (timeToBePassed > 0) {
    await network.provider.send("evm_increaseTime", [Number(timeToBePassed)]);
    await network.provider.send("evm_mine");
    console.log("⛏️ Block mined after time increase.");
  } else {
    console.log("✅ No need to advance time.");
  }
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
