import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { verifyMessage } from "ethers";
import { logger } from "../config/logger";

export class UserController {
  private userRepository = AppDataSource.getRepository(User);

  // Get all users
  getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Fetching all users', { requestId: req.requestId });
      
      const users = await this.userRepository.find({
        order: { createdAt: "DESC" }
      });
      
      logger.info('Successfully fetched users', { 
        requestId: req.requestId, 
        count: users.length 
      });
      
      res.json({
        success: true,
        data: users,
        count: users.length
      });
    } catch (error) {
      logger.error('Failed to fetch users', { 
        requestId: req.requestId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      res.status(500).json({
        success: false,
        error: "Failed to fetch users",
        requestId: req.requestId
      });
    }
  };

  // Get user by ID
  getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      logger.info('Fetching user by ID', { 
        requestId: req.requestId, 
        userId: id 
      });
      
      const user = await this.userRepository.findOne({
        where: { id: parseInt(id) }
      });

      if (!user) {
        logger.warn('User not found', { 
          requestId: req.requestId, 
          userId: id 
        });
        
        res.status(404).json({
          success: false,
          error: "User not found",
          requestId: req.requestId
        });
        return;
      }

      logger.info('Successfully fetched user by ID', { 
        requestId: req.requestId, 
        userId: id,
        userAddress: user.address
      });

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Failed to fetch user by ID', { 
        requestId: req.requestId, 
        userId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      res.status(500).json({
        success: false,
        error: "Failed to fetch user",
        requestId: req.requestId
      });
    }
  };

  // Get user by address
  getUserByAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      const { address } = req.params;
      
      logger.info('Fetching user by address', { 
        requestId: req.requestId, 
        address: address 
      });
      
      const user = await this.userRepository.findOne({
        where: { address: address.toLowerCase() }
      });

      if (!user) {
        logger.warn('User not found by address', { 
          requestId: req.requestId, 
          address: address 
        });
        
        res.status(404).json({
          success: false,
          error: "User not found",
          requestId: req.requestId
        });
        return;
      }

      logger.info('Successfully fetched user by address', { 
        requestId: req.requestId, 
        address: address,
        userId: user.id
      });

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Failed to fetch user by address', { 
        requestId: req.requestId, 
        address: req.params.address,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      res.status(500).json({
        success: false,
        error: "Failed to fetch user",
        requestId: req.requestId
      });
    }
  };

  // Authenticate user with signed message
  authenticateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { message, signature } = req.body;

      logger.info('Authentication attempt', { 
        requestId: req.requestId,
        messageLength: message?.length,
        hasSignature: !!signature
      });

      if (!message || !signature) {
        logger.warn('Authentication failed - missing fields', { 
          requestId: req.requestId,
          hasMessage: !!message,
          hasSignature: !!signature
        });
        
        res.status(400).json({
          success: false,
          error: "Message and signature are required",
          requestId: req.requestId
        });
        return;
      }

      // Verify the signature and extract the address
      let recoveredAddress: string;
      try {
        recoveredAddress = verifyMessage(message, signature);
        
        logger.info('Signature verified successfully', { 
          requestId: req.requestId,
          recoveredAddress: recoveredAddress
        });
      } catch (error) {
        logger.warn('Signature verification failed', { 
          requestId: req.requestId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        res.status(400).json({
          success: false,
          error: "Invalid signature",
          requestId: req.requestId
        });
        return;
      }

      // Convert address to lowercase for consistency
      const normalizedAddress = recoveredAddress.toLowerCase();

      // Check if user already exists
      let user = await this.userRepository.findOne({
        where: { address: normalizedAddress }
      });

      let isNewUser = false;
      
      // If user doesn't exist, create a new one
      if (!user) {
        logger.info('Creating new user', { 
          requestId: req.requestId,
          address: normalizedAddress
        });
        
        user = new User();
        user.address = normalizedAddress;
        user = await this.userRepository.save(user);
        isNewUser = true;
        
        logger.info('New user created successfully', { 
          requestId: req.requestId,
          userId: user.id,
          address: normalizedAddress
        });
      } else {
        logger.info('Existing user authenticated', { 
          requestId: req.requestId,
          userId: user.id,
          address: normalizedAddress
        });
      }

      res.json({
        success: true,
        data: {
          user,
          address: recoveredAddress,
          isNewUser
        },
        message: "Authentication successful"
      });
    } catch (error) {
      logger.error('Authentication error', { 
        requestId: req.requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      res.status(500).json({
        success: false,
        error: "Authentication failed",
        requestId: req.requestId
      });
    }
  };

  // Update user status
  updateUserStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      logger.info('Updating user status', { 
        requestId: req.requestId,
        userId: id,
        newStatus: status
      });

      if (!status) {
        logger.warn('Status update failed - missing status', { 
          requestId: req.requestId,
          userId: id
        });
        
        res.status(400).json({
          success: false,
          error: "Status is required",
          requestId: req.requestId
        });
        return;
      }

      const user = await this.userRepository.findOne({
        where: { id: parseInt(id) }
      });

      if (!user) {
        logger.warn('Status update failed - user not found', { 
          requestId: req.requestId,
          userId: id
        });
        
        res.status(404).json({
          success: false,
          error: "User not found",
          requestId: req.requestId
        });
        return;
      }

      const oldStatus = user.status;
      user.status = status;
      const updatedUser = await this.userRepository.save(user);

      logger.info('User status updated successfully', { 
        requestId: req.requestId,
        userId: id,
        oldStatus: oldStatus,
        newStatus: status,
        address: user.address
      });

      res.json({
        success: true,
        data: updatedUser,
        message: "User status updated successfully"
      });
    } catch (error) {
      logger.error('Failed to update user status', { 
        requestId: req.requestId,
        userId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      res.status(500).json({
        success: false,
        error: "Failed to update user status",
        requestId: req.requestId
      });
    }
  };

  // Delete user
  deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      logger.info('Deleting user', { 
        requestId: req.requestId,
        userId: id
      });

      const user = await this.userRepository.findOne({
        where: { id: parseInt(id) }
      });

      if (!user) {
        logger.warn('Delete failed - user not found', { 
          requestId: req.requestId,
          userId: id
        });
        
        res.status(404).json({
          success: false,
          error: "User not found",
          requestId: req.requestId
        });
        return;
      }

      await this.userRepository.remove(user);

      logger.info('User deleted successfully', { 
        requestId: req.requestId,
        userId: id,
        address: user.address
      });

      res.json({
        success: true,
        message: "User deleted successfully"
      });
    } catch (error) {
      logger.error('Failed to delete user', { 
        requestId: req.requestId,
        userId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      res.status(500).json({
        success: false,
        error: "Failed to delete user",
        requestId: req.requestId
      });
    }
  };
}