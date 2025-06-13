const { ethers } = require("hardhat");

async function main() {
  const [proposer] = await ethers.getSigners();
  console.log("Proposer Address:", proposer.address);
  const GOVERNOR_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
  const TOKEN_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const govern = await ethers.getContractAt("MyGovernor", GOVERNOR_ADDRESS);

  const targets = [proposer.address];
  const values = [0];
  const calldatas = ["0x"];
  const description = "Proposal #3: Example proposal description 3";
  console.log("Creating proposal...");
  const tx = await govern.propose(targets, values, calldatas, description);

  const receipt = await tx.wait();
  console.log(`Proposal created! Tx hash: ${receipt.hash}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
