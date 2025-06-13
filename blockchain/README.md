Verify Contract:
---------------
npx hardhat verify --network localhost 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
npx hardhat verify --network localhost 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0   --constructor-args constructor-args.json
npx hardhat verify --network localhost 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0


let MyToken = await ethers.getContractFactory("MyToken")
let myToken = await MyToken.deploy()

let TimelockController = await ethers.getContractFactory("TimelockController")
let timelockController = await TimelockController.deploy(3600, [], [], "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")

let Govern = await ethers.getContractFactory("MyGovernor")
let govern = await Govern.deploy(myToken.target, timelockController.target)

let Storage = await ethers.getContractFactory("SimpleStorage")
let storage = await Storage.deploy()

const SimpleStorage = await ethers.getContractAt("SimpleStorage", storage.target);
const calldata = SimpleStorage.interface.encodeFunctionData("set", [42]);

Create a Proposal:
-----------------
let targets = [storage.target]
let values = [0]
let calldatas = [calldata]
let description = "Proposal #1: Set value to 42";

let tx = await govern.propose(targets, values, calldatas, description)
const iface = govern.interface;
iface.parseLog(receipt.logs[0]).args.proposalId

const { keccak256, toUtf8Bytes } = require("ethers");
let hash = keccak256(toUtf8Bytes(description));
await govern.hashProposal(targets, values, calldatas, hash)

bypass time - (Pending - Active):
--------------------------------
const block = await ethers.provider.getBlock("latest");
const now = block.timestamp;
const snapshotTime = await govern.proposalSnapshot(proposalId)
timeToBePassed = snapshotTime - BigInt(now)
await network.provider.send("evm_increaseTime", [76904]);
await network.provider.send("evm_mine");

Vote Proposal:
-------------
const state = await govern.state(proposalId);
let tx_hash = await govern.castVote(proposalId, 1);

bypass time - (Active to Succeed):
----------------------------------
let votingPeriod = await govern.votingPeriod()
let deadline = snapshotTime + votingPeriod
let currentBlock = await ethers.provider.getBlock("latest");
let currentTime = currentBlock.timestamp
let toBePassed = deadline - currentTime

Queue Proposal:
--------------
const PROPOSER_ROLE = keccak256(toUtf8Bytes("PROPOSER_ROLE"));
await timelockController.grantRole("0xb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc1", govern.target)
await timelockController.hasRole("0xb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc1", govern.target)

await govern.queue(targets, values, calldatas, hash)

pass proposalEta(block.timestamp + minDelay): //set in timelock controller
---------------------------------------------
currentBlockTime = (await ethers.provider.getBlock('latest')).timestamp;
proposalEta = await govern.proposalEta(proposal_id);
toBePassed = proposalEta - BigInt(currentBlockTime)

Execute Proposal:
----------------
=> proposalEta should be passed.

const EXECUTOR_ROLE = keccak256(toUtf8Bytes("EXECUTOR_ROLE"));
await timelockController.hasRole(EXECUTOR_ROLE, govern.target)
await timelockController.grantRole(EXECUTOR_ROLE, govern.target)

await govern.execute(targets, values, calldatas, hash)

Cancel Proposal:
---------------
=> only proposer can cancel a propose
=> we can cancel only pending state proposal.

await govern.cancel(targets, values, calldatas, hash)

let [signer, recv] = await ethers.getSigners()


Actionless Proposal:
-------------------

Create Proposal:
---------------
=> state: 0 (Pending)
let proposers = [proposer]
tx = await govern.propose([proposer], [0], ['0x'], description);

Get hash of description:
-----------------------
let descriptionHash = keccak256(toUtf8Bytes(description1));


