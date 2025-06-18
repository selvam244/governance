import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Proposal } from "../entities/Proposal";
import { User } from "../entities/User";
import { logger } from "../config/logger";

export class ProposalController {
  private proposalRepository = AppDataSource.getRepository(Proposal);
  private userRepository = AppDataSource.getRepository(User);

  // Get all proposals
  getAllProposals = async (req: Request, res: Response): Promise<void> => {
    try {
      const { published, state, userId, page = 1, limit = 10 } = req.query;

      logger.info('Fetching proposals', {
        requestId: req.requestId,
        filters: { published, state, userId },
        pagination: { page, limit }
      });

      const queryBuilder = this.proposalRepository
        .createQueryBuilder("proposal")
        .leftJoinAndSelect("proposal.user", "user")
        .orderBy("proposal.createdAt", "DESC");

      // Apply filters
      if (published !== undefined) {
        queryBuilder.andWhere("proposal.published = :published", { published: published === 'true' });
      }

      if (state !== undefined) {
        queryBuilder.andWhere("proposal.state = :state", { state: parseInt(state as string) });
      }

      if (userId) {
        queryBuilder.andWhere("proposal.userId = :userId", { userId: parseInt(userId as string) });
      }

      // Apply pagination
      const pageNumber = Math.max(1, parseInt(page as string));
      const limitNumber = Math.min(100, Math.max(1, parseInt(limit as string)));
      const skip = (pageNumber - 1) * limitNumber;

      queryBuilder.skip(skip).take(limitNumber);

      const [proposals, total] = await queryBuilder.getManyAndCount();

      logger.info('Successfully fetched proposals', {
        requestId: req.requestId,
        count: proposals.length,
        total,
        page: pageNumber,
        limit: limitNumber
      });

      res.json({
        success: true,
        data: proposals,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages: Math.ceil(total / limitNumber)
        }
      });
    } catch (error) {
      logger.error('Failed to fetch proposals', {
        requestId: req.requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: "Failed to fetch proposals",
        requestId: req.requestId
      });
    }
  };

  // Get proposal by ID
  getProposalById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      logger.info('Fetching proposal by ID', {
        requestId: req.requestId,
        proposalId: id
      });

      const proposal = await this.proposalRepository.findOne({
        where: { id: parseInt(id) },
        relations: ["user"]
      });

      if (!proposal) {
        logger.warn('Proposal not found', {
          requestId: req.requestId,
          proposalId: id
        });

        res.status(404).json({
          success: false,
          error: "Proposal not found",
          requestId: req.requestId
        });
        return;
      }

      logger.info('Successfully fetched proposal by ID', {
        requestId: req.requestId,
        proposalId: id,
        onchainId: proposal.onchain_id
      });

      res.json({
        success: true,
        data: proposal
      });
    } catch (error) {
      logger.error('Failed to fetch proposal by ID', {
        requestId: req.requestId,
        proposalId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: "Failed to fetch proposal",
        requestId: req.requestId
      });
    }
  };

  // Get proposal by onchain ID
  getProposalByOnchainId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { onchainId } = req.params;

      logger.info('Fetching proposal by onchain ID', {
        requestId: req.requestId,
        onchainId
      });

      const proposal = await this.proposalRepository.findOne({
        where: { onchain_id: onchainId },
        relations: ["user"]
      });

      if (!proposal) {
        logger.warn('Proposal not found by onchain ID', {
          requestId: req.requestId,
          onchainId
        });

        res.status(404).json({
          success: false,
          error: "Proposal not found",
          requestId: req.requestId
        });
        return;
      }

      logger.info('Successfully fetched proposal by onchain ID', {
        requestId: req.requestId,
        onchainId,
        proposalId: proposal.id
      });

      res.json({
        success: true,
        data: proposal
      });
    } catch (error) {
      logger.error('Failed to fetch proposal by onchain ID', {
        requestId: req.requestId,
        onchainId: req.params.onchainId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: "Failed to fetch proposal",
        requestId: req.requestId
      });
    }
  };

  // Get proposals by user ID
  getProposalsByUserId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { published, state, page = 1, limit = 10 } = req.query;

      logger.info('Fetching proposals by user ID', {
        requestId: req.requestId,
        userId,
        filters: { published, state }
      });

      const queryBuilder = this.proposalRepository
        .createQueryBuilder("proposal")
        .leftJoinAndSelect("proposal.user", "user")
        .where("proposal.userId = :userId", { userId: parseInt(userId) })
        .orderBy("proposal.createdAt", "DESC");

      // Apply filters
      if (published !== undefined) {
        queryBuilder.andWhere("proposal.published = :published", { published: published === 'true' });
      }

      if (state !== undefined) {
        queryBuilder.andWhere("proposal.state = :state", { state: parseInt(state as string) });
      }

      // Apply pagination
      const pageNumber = Math.max(1, parseInt(page as string));
      const limitNumber = Math.min(100, Math.max(1, parseInt(limit as string)));
      const skip = (pageNumber - 1) * limitNumber;

      queryBuilder.skip(skip).take(limitNumber);

      const [proposals, total] = await queryBuilder.getManyAndCount();

      logger.info('Successfully fetched proposals by user ID', {
        requestId: req.requestId,
        userId,
        count: proposals.length,
        total
      });

      res.json({
        success: true,
        data: proposals,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages: Math.ceil(total / limitNumber)
        }
      });
    } catch (error) {
      logger.error('Failed to fetch proposals by user ID', {
        requestId: req.requestId,
        userId: req.params.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: "Failed to fetch user proposals",
        requestId: req.requestId
      });
    }
  };

  // Create new proposal
  createProposal = async (req: Request, res: Response): Promise<void> => {
    try {
      const { onchain_id, title, description, published = false, userId } = req.body;

      logger.info('Creating new proposal', {
        requestId: req.requestId,
        onchain_id,
        title: title?.substring(0, 50) + '...',
        userId,
        published
      });

      // Validate required fields
      if (!onchain_id || !title || !description || !userId) {
        logger.warn('Proposal creation failed - missing required fields', {
          requestId: req.requestId,
          hasOnchainId: !!onchain_id,
          hasTitle: !!title,
          hasDescription: !!description,
          hasUserId: !!userId
        });

        res.status(400).json({
          success: false,
          error: "onchain_id, title, description, and userId are required",
          requestId: req.requestId
        });
        return;
      }

      // Check if user exists
      const user = await this.userRepository.findOne({
        where: { id: parseInt(userId) }
      });

      if (!user) {
        logger.warn('Proposal creation failed - user not found', {
          requestId: req.requestId,
          userId
        });

        res.status(404).json({
          success: false,
          error: "User not found",
          requestId: req.requestId
        });
        return;
      }

      // Check if proposal with same onchain_id already exists
      const existingProposal = await this.proposalRepository.findOne({
        where: { onchain_id }
      });

      if (existingProposal) {
        logger.warn('Proposal creation failed - onchain_id already exists', {
          requestId: req.requestId,
          onchain_id,
          existingProposalId: existingProposal.id
        });

        res.status(409).json({
          success: false,
          error: "Proposal with this onchain_id already exists",
          requestId: req.requestId
        });
        return;
      }

      // Create new proposal
      const proposal = new Proposal();
      proposal.onchain_id = onchain_id;
      proposal.title = title;
      proposal.description = description;
      proposal.published = published;
      proposal.userId = parseInt(userId);

      const savedProposal = await this.proposalRepository.save(proposal);

      // Fetch the complete proposal with user relation
      const completeProposal = await this.proposalRepository.findOne({
        where: { id: savedProposal.id },
        relations: ["user"]
      });

      logger.info('Proposal created successfully', {
        requestId: req.requestId,
        proposalId: savedProposal.id,
        onchain_id: savedProposal.onchain_id,
        userId: userId
      });

      res.status(201).json({
        success: true,
        data: completeProposal,
        message: "Proposal created successfully"
      });
    } catch (error) {
      logger.error('Failed to create proposal', {
        requestId: req.requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: "Failed to create proposal",
        requestId: req.requestId
      });
    }
  };

  // Update proposal
  updateProposal = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { title, description, published, state, for: forVotes, against, abstain } = req.body;

      logger.info('Updating proposal', {
        requestId: req.requestId,
        proposalId: id,
        updates: { title: !!title, description: !!description, published, state, forVotes, against, abstain }
      });

      const proposal = await this.proposalRepository.findOne({
        where: { id: parseInt(id) }
      });

      if (!proposal) {
        logger.warn('Proposal update failed - proposal not found', {
          requestId: req.requestId,
          proposalId: id
        });

        res.status(404).json({
          success: false,
          error: "Proposal not found",
          requestId: req.requestId
        });
        return;
      }

      // Update fields if provided
      if (title !== undefined) proposal.title = title;
      if (description !== undefined) proposal.description = description;
      if (published !== undefined) proposal.published = published;
      if (state !== undefined) proposal.state = parseInt(state);
      if (forVotes !== undefined) proposal.for = parseInt(forVotes);
      if (against !== undefined) proposal.against = parseInt(against);
      if (abstain !== undefined) proposal.abstain = parseInt(abstain);

      const updatedProposal = await this.proposalRepository.save(proposal);

      // Fetch the complete proposal with user relation
      const completeProposal = await this.proposalRepository.findOne({
        where: { id: updatedProposal.id },
        relations: ["user"]
      });

      logger.info('Proposal updated successfully', {
        requestId: req.requestId,
        proposalId: id,
        onchain_id: proposal.onchain_id
      });

      res.json({
        success: true,
        data: completeProposal,
        message: "Proposal updated successfully"
      });
    } catch (error) {
      logger.error('Failed to update proposal', {
        requestId: req.requestId,
        proposalId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: "Failed to update proposal",
        requestId: req.requestId
      });
    }
  };

  // Update proposal votes
  updateProposalVotes = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { for: forVotes, against, abstain } = req.body;

      logger.info('Updating proposal votes', {
        requestId: req.requestId,
        proposalId: id,
        votes: { forVotes, against, abstain }
      });

      if (forVotes === undefined && against === undefined && abstain === undefined) {
        logger.warn('Vote update failed - no vote data provided', {
          requestId: req.requestId,
          proposalId: id
        });

        res.status(400).json({
          success: false,
          error: "At least one vote field (for, against, abstain) is required",
          requestId: req.requestId
        });
        return;
      }

      const proposal = await this.proposalRepository.findOne({
        where: { id: parseInt(id) }
      });

      if (!proposal) {
        logger.warn('Vote update failed - proposal not found', {
          requestId: req.requestId,
          proposalId: id
        });

        res.status(404).json({
          success: false,
          error: "Proposal not found",
          requestId: req.requestId
        });
        return;
      }

      // Update vote counts
      if (forVotes !== undefined) proposal.for = parseInt(forVotes);
      if (against !== undefined) proposal.against = parseInt(against);
      if (abstain !== undefined) proposal.abstain = parseInt(abstain);

      const updatedProposal = await this.proposalRepository.save(proposal);

      logger.info('Proposal votes updated successfully', {
        requestId: req.requestId,
        proposalId: id,
        newVotes: { for: updatedProposal.for, against: updatedProposal.against, abstain: updatedProposal.abstain }
      });

      res.json({
        success: true,
        data: {
          id: updatedProposal.id,
          onchain_id: updatedProposal.onchain_id,
          for: updatedProposal.for,
          against: updatedProposal.against,
          abstain: updatedProposal.abstain
        },
        message: "Proposal votes updated successfully"
      });
    } catch (error) {
      logger.error('Failed to update proposal votes', {
        requestId: req.requestId,
        proposalId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: "Failed to update proposal votes",
        requestId: req.requestId
      });
    }
  };

  // Delete proposal
  deleteProposal = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      logger.info('Deleting proposal', {
        requestId: req.requestId,
        proposalId: id
      });

      const proposal = await this.proposalRepository.findOne({
        where: { id: parseInt(id) }
      });

      if (!proposal) {
        logger.warn('Proposal deletion failed - proposal not found', {
          requestId: req.requestId,
          proposalId: id
        });

        res.status(404).json({
          success: false,
          error: "Proposal not found",
          requestId: req.requestId
        });
        return;
      }

      await this.proposalRepository.remove(proposal);

      logger.info('Proposal deleted successfully', {
        requestId: req.requestId,
        proposalId: id,
        onchain_id: proposal.onchain_id
      });

      res.json({
        success: true,
        message: "Proposal deleted successfully"
      });
    } catch (error) {
      logger.error('Failed to delete proposal', {
        requestId: req.requestId,
        proposalId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: "Failed to delete proposal",
        requestId: req.requestId
      });
    }
  };

  // Get proposal statistics
  getProposalStats = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Fetching proposal statistics', {
        requestId: req.requestId
      });

      const [
        totalProposals,
        publishedProposals,
        draftProposals,
        stateStats
      ] = await Promise.all([
        this.proposalRepository.count(),
        this.proposalRepository.count({ where: { published: true } }),
        this.proposalRepository.count({ where: { published: false } }),
        this.proposalRepository
          .createQueryBuilder("proposal")
          .select("proposal.state")
          .addSelect("COUNT(*)", "count")
          .groupBy("proposal.state")
          .getRawMany()
      ]);

      const stats = {
        total: totalProposals,
        published: publishedProposals,
        drafts: draftProposals,
        byState: stateStats.reduce((acc: any, item: any) => {
          acc[item.proposal_state] = parseInt(item.count);
          return acc;
        }, {})
      };

      logger.info('Successfully fetched proposal statistics', {
        requestId: req.requestId,
        stats
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Failed to fetch proposal statistics', {
        requestId: req.requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: "Failed to fetch proposal statistics",
        requestId: req.requestId
      });
    }
  };
}
