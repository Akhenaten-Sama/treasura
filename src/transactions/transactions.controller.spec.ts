import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { Transaction } from './transaction.entity';
import { NotFoundException } from '@nestjs/common';
import { TransactionType, TransactionStatus } from './transaction.entity';

describe('TransactionsController', () => {
  let transactionsController: TransactionsController;
  let transactionsService: Partial<TransactionsService>;

  beforeEach(async () => {
    transactionsService = {
      findById: jest.fn(),
      getTransactionsForWallet: jest.fn(),
      getJobById: jest.fn(),
      queueExportTransactions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [{ provide: TransactionsService, useValue: transactionsService }],
    }).compile();

    transactionsController = module.get<TransactionsController>(TransactionsController);
  });

  describe('findOne', () => {
    it('should return a transaction by ID', async () => {
    const mockTransaction: Transaction = {
      id: 'txn-id',
      fromWallet: null,
      toWallet: null,
      amount: 100,
      status: TransactionStatus.SUCCESS,
      type: TransactionType.TRANSFER,
      createdAt: new Date(),
      transactionId: 'txn-id',
    };

      jest.spyOn(transactionsService, 'findById').mockResolvedValue(mockTransaction);

      const result = await transactionsController.findOne('txn-id');
      expect(result).toEqual(mockTransaction);
      expect(transactionsService.findById).toHaveBeenCalledWith('txn-id');
    });

    it('should throw a NotFoundException if the transaction is not found', async () => {
      jest.spyOn(transactionsService, 'findById').mockRejectedValue(new NotFoundException());

      await expect(transactionsController.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTransactionsForWallet', () => {
    it('should return paginated transactions for a wallet', async () => {
      const mockTransactions = {
        data: [
          {
            id: 'txn-id-1',
            fromWallet: { id: 'wallet-1', balance: 100, user: { id: 'user-1', email: 'user1@example.com', password: 'hashed-password', wallets: [], createdAt: new Date(), updatedAt: new Date() }, outgoingTransactions: [], incomingTransactions: [], createdAt: new Date(), updatedAt: new Date() }, // Mock Wallet object
            toWallet: { id: 'wallet-2', balance: 200, user: { id: 'user-2', email: 'user2@example.com', password: 'hashed-password', wallets: [], createdAt: new Date(), updatedAt: new Date() }, outgoingTransactions: [], incomingTransactions: [], createdAt: new Date(), updatedAt: new Date() },   // Mock Wallet object
            amount: 50,
            status: TransactionStatus.SUCCESS,
            type: TransactionType.TRANSFER,
            createdAt: new Date(),
            transactionId: 'txn-id-1',
          },
        ],
        total: 1,
      };

      jest.spyOn(transactionsService, 'getTransactionsForWallet').mockResolvedValue(mockTransactions);

      const result = await transactionsController.getTransactionsForWallet('wallet-id', 1, 10);
      expect(result).toEqual(mockTransactions);
      expect(transactionsService.getTransactionsForWallet).toHaveBeenCalledWith('wallet-id', 1, 10);
    });
  });

  describe('getJobStatus', () => {
    it('should return the status of a job by ID', async () => {
      const mockJob = {
        jobId: 'job-id-123',
        type: 'export',
        data: { walletId: 'wallet-id' },
        attemptsMade: 1,
        status: 'completed',
        result: { message: 'Export successful' },
        failedReason: null,
      };

      jest.spyOn(transactionsService, 'getJobById').mockResolvedValue(mockJob);

      const result = await transactionsController.getJobStatus('job-id-123');
      expect(result).toEqual(mockJob);
      expect(transactionsService.getJobById).toHaveBeenCalledWith('job-id-123');
    });

    it('should throw a NotFoundException if the job is not found', async () => {
      jest.spyOn(transactionsService, 'getJobById').mockRejectedValue(new NotFoundException());

      await expect(transactionsController.getJobStatus('nonexistent-job-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('queueExportTransactions', () => {
    it('should queue an export job for a wallet', async () => {
      const mockResponse = { message: 'Export job queued for wallet ID: wallet-id', jobId: 'job-id-123' };

      jest.spyOn(transactionsService, 'queueExportTransactions').mockResolvedValue({ jobId: 'job-id-123' });

      const result = await transactionsController.queueExportTransactions('wallet-id', 100);
      expect(result).toEqual(mockResponse);
      expect(transactionsService.queueExportTransactions).toHaveBeenCalledWith('wallet-id', 100);
    });
  });
});