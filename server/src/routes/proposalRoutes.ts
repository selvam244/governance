import { Router } from "express";
import { ProposalController } from "../controllers/ProposalController";

const router = Router();
const proposalController = new ProposalController();

/**
 * @swagger
 * tags:
 *   name: Proposals
 *   description: Proposal management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Proposal:
 *       type: object
 *       required:
 *         - onchain_id
 *         - title
 *         - description
 *         - userId
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated proposal ID
 *         onchain_id:
 *           type: string
 *           description: Unique onchain identifier
 *         title:
 *           type: string
 *           maxLength: 500
 *           description: Proposal title
 *         description:
 *           type: string
 *           description: Detailed proposal description
 *         published:
 *           type: boolean
 *           default: false
 *           description: Whether the proposal is published
 *         state:
 *           type: integer
 *           minimum: 0
 *           maximum: 7
 *           default: 0
 *           description: Proposal state (0-7)
 *         for:
 *           type: integer
 *           default: 0
 *           description: Number of votes in favor
 *         against:
 *           type: integer
 *           default: 0
 *           description: Number of votes against
 *         abstain:
 *           type: integer
 *           default: 0
 *           description: Number of abstain votes
 *         userId:
 *           type: integer
 *           description: ID of the user who created the proposal
 *         user:
 *           $ref: '#/components/schemas/User'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ProposalInput:
 *       type: object
 *       required:
 *         - onchain_id
 *         - title
 *         - description
 *         - userId
 *       properties:
 *         onchain_id:
 *           type: string
 *           description: Unique onchain identifier
 *         title:
 *           type: string
 *           maxLength: 500
 *           description: Proposal title
 *         description:
 *           type: string
 *           description: Detailed proposal description
 *         published:
 *           type: boolean
 *           default: false
 *           description: Whether the proposal is published
 *         userId:
 *           type: integer
 *           description: ID of the user creating the proposal
 *     ProposalUpdate:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           maxLength: 500
 *           description: Proposal title
 *         description:
 *           type: string
 *           description: Detailed proposal description
 *         published:
 *           type: boolean
 *           description: Whether the proposal is published
 *         state:
 *           type: integer
 *           minimum: 0
 *           maximum: 7
 *           description: Proposal state (0-7)
 *         for:
 *           type: integer
 *           minimum: 0
 *           description: Number of votes in favor
 *         against:
 *           type: integer
 *           minimum: 0
 *           description: Number of votes against
 *         abstain:
 *           type: integer
 *           minimum: 0
 *           description: Number of abstain votes
 *     VoteUpdate:
 *       type: object
 *       properties:
 *         for:
 *           type: integer
 *           minimum: 0
 *           description: Number of votes in favor
 *         against:
 *           type: integer
 *           minimum: 0
 *           description: Number of votes against
 *         abstain:
 *           type: integer
 *           minimum: 0
 *           description: Number of abstain votes
 *     ProposalStats:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Total number of proposals
 *         published:
 *           type: integer
 *           description: Number of published proposals
 *         drafts:
 *           type: integer
 *           description: Number of draft proposals
 *         byState:
 *           type: object
 *           description: Proposals count by state
 */

/**
 * @swagger
 * /api/proposals:
 *   get:
 *     summary: Get all proposals
 *     tags: [Proposals]
 *     parameters:
 *       - in: query
 *         name: published
 *         schema:
 *           type: boolean
 *         description: Filter by published status
 *       - in: query
 *         name: state
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 7
 *         description: Filter by proposal state
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Successfully retrieved proposals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Proposal'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       500:
 *         description: Server error
 */
router.get("/", proposalController.getAllProposals);

/**
 * @swagger
 * /api/proposals/stats:
 *   get:
 *     summary: Get proposal statistics
 *     tags: [Proposals]
 *     responses:
 *       200:
 *         description: Successfully retrieved proposal statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ProposalStats'
 *       500:
 *         description: Server error
 */
router.get("/stats", proposalController.getProposalStats);

/**
 * @swagger
 * /api/proposals/{id}:
 *   get:
 *     summary: Get proposal by ID
 *     tags: [Proposals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Proposal ID
 *     responses:
 *       200:
 *         description: Successfully retrieved proposal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Proposal'
 *       404:
 *         description: Proposal not found
 *       500:
 *         description: Server error
 */
router.get("/:id", proposalController.getProposalById);

/**
 * @swagger
 * /api/proposals/onchain/{onchainId}:
 *   get:
 *     summary: Get proposal by onchain ID
 *     tags: [Proposals]
 *     parameters:
 *       - in: path
 *         name: onchainId
 *         required: true
 *         schema:
 *           type: string
 *         description: Onchain proposal ID
 *     responses:
 *       200:
 *         description: Successfully retrieved proposal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Proposal'
 *       404:
 *         description: Proposal not found
 *       500:
 *         description: Server error
 */
router.get("/onchain/:onchainId", proposalController.getProposalByOnchainId);

/**
 * @swagger
 * /api/proposals/user/{userId}:
 *   get:
 *     summary: Get proposals by user ID
 *     tags: [Proposals]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *       - in: query
 *         name: published
 *         schema:
 *           type: boolean
 *         description: Filter by published status
 *       - in: query
 *         name: state
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 7
 *         description: Filter by proposal state
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Successfully retrieved user proposals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Proposal'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       500:
 *         description: Server error
 */
router.get("/user/:userId", proposalController.getProposalsByUserId);

/**
 * @swagger
 * /api/proposals:
 *   post:
 *     summary: Create a new proposal
 *     tags: [Proposals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProposalInput'
 *     responses:
 *       201:
 *         description: Proposal created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Proposal'
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - missing required fields
 *       404:
 *         description: User not found
 *       409:
 *         description: Proposal with onchain_id already exists
 *       500:
 *         description: Server error
 */
router.post("/", proposalController.createProposal);

/**
 * @swagger
 * /api/proposals/{id}:
 *   put:
 *     summary: Update a proposal
 *     tags: [Proposals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Proposal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProposalUpdate'
 *     responses:
 *       200:
 *         description: Proposal updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Proposal'
 *                 message:
 *                   type: string
 *       404:
 *         description: Proposal not found
 *       500:
 *         description: Server error
 */
router.put("/:id", proposalController.updateProposal);

/**
 * @swagger
 * /api/proposals/{id}/votes:
 *   patch:
 *     summary: Update proposal vote counts
 *     tags: [Proposals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Proposal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VoteUpdate'
 *     responses:
 *       200:
 *         description: Proposal votes updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     onchain_id:
 *                       type: string
 *                     for:
 *                       type: integer
 *                     against:
 *                       type: integer
 *                     abstain:
 *                       type: integer
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - no vote data provided
 *       404:
 *         description: Proposal not found
 *       500:
 *         description: Server error
 */
router.patch("/:id/votes", proposalController.updateProposalVotes);

/**
 * @swagger
 * /api/proposals/{id}:
 *   delete:
 *     summary: Delete a proposal
 *     tags: [Proposals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Proposal ID
 *     responses:
 *       200:
 *         description: Proposal deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Proposal not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", proposalController.deleteProposal);

export default router;
