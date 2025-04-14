import { Test, TestingModule } from '@nestjs/testing';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { TransactionsService } from '../transactions/transactions.service';
import { AuthService } from '../auth/auth.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateBalanceDto } from './update-balance.dto';
import { TransferDto } from '../transactions/dto/transfer.dto';
import { NotFoundException } from '@nestjs/common';

describe('WalletsController', () => {
  let walletsController: WalletsController;
  let walletsService: Partial<WalletsService>;
  let transactionsService: Partial<TransactionsService>;

  beforeEach(async () => {
    walletsService = {
      create: jest.fn(),
      findOne: jest.fn(),
    };

    transactionsService = {
      queueDeposit: jest.fn(),
      queueWithdraw: jest.fn(),
      queueTransfer: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletsController],
      providers: [
        { provide: WalletsService, useValue: walletsService },
        { provide: TransactionsService, useValue: transactionsService },
        { provide: AuthService, useValue: {} }, // Mock AuthService if needed
      ],
    }).compile();

    walletsController = module.get<WalletsController>(WalletsController);
  });

  describe('createWallet', () => {
    it('should create a wallet for a user', async () => {
      const createWalletDto: CreateWalletDto = { email: 'test@example.com' };
      const mockWallet = { 
        id: 'wallet-id', 
        balance: 0, 
        user: { 
          id: 'user-id', 
          email: 'test@example.com', 
          password: 'hashed-password', 
          wallets: [], 
          createdAt: new Date(), 
          updatedAt: new Date() 
        }, 
        outgoingTransactions: [], 
        incomingTransactions: [], 
        createdAt: new Date(), 
        updatedAt: new Date() 
      };

      jest.spyOn(walletsService, 'create').mockResolvedValue(mockWallet);

      const result = await walletsController.createWallet(createWalletDto);
      expect(result).toEqual(mockWallet);
      expect(walletsService.create).toHaveBeenCalledWith('test@example.com',);
    });
  });

  describe('getWallet', () => {
    it('should return a wallet by ID', async () => {
      const mockWallet = { 
        id: 'wallet-id', 
        balance: 100, 
        user: { 
          id: 'user-id', 
          email: 'test@example.com', 
          password: 'hashed-password', 
          wallets: [], 
          createdAt: new Date(), 
          updatedAt: new Date() 
        }, 
        outgoingTransactions: [], 
        incomingTransactions: [], 
        createdAt: new Date(), 
        updatedAt: new Date() 
      };

      jest.spyOn(walletsService, 'findOne').mockResolvedValue(mockWallet);

      const result = await walletsController.getWallet('wallet-id');
      expect(result).toEqual(mockWallet);
      expect(walletsService.findOne).toHaveBeenCalledWith('wallet-id');
    });

    it('should throw a NotFoundException if the wallet is not found', async () => {
      jest.spyOn(walletsService, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(walletsController.getWallet('wallet-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deposit', () => {
    it('should queue a deposit job', async () => {
      const updateBalanceDto: UpdateBalanceDto = { amount: 100 };
      const mockResponse = { message: 'Deposit queued successfully', jobId: 'job-id' };

      jest.spyOn(transactionsService, 'queueDeposit').mockResolvedValue(mockResponse);

      const result = await walletsController.deposit('wallet-id', updateBalanceDto);
      expect(result).toEqual(mockResponse);
      expect(transactionsService.queueDeposit).toHaveBeenCalledWith(
        'wallet-id',
        100,
        expect.any(String), // Idempotency key
      );
    });
  });

  describe('withdraw', () => {
    it('should queue a withdrawal job', async () => {
      const updateBalanceDto: UpdateBalanceDto = { amount: 50 };
      const mockResponse = { message: 'Withdrawal queued successfully', jobId: 'job-id' };

      jest.spyOn(transactionsService, 'queueWithdraw').mockResolvedValue(mockResponse);

      const result = await walletsController.withdraw('wallet-id', updateBalanceDto);
      expect(result).toEqual(mockResponse);
      expect(transactionsService.queueWithdraw).toHaveBeenCalledWith(
        'wallet-id',
        50,
        expect.any(String), // Idempotency key
      );
    });
  });

  describe('transfer', () => {
    it('should queue a transfer job', async () => {
      const transferDto: TransferDto = { fromWalletId: 'wallet-1', toWalletId: 'wallet-2', amount: 50, idempotencyKey:"fgyfbhnjf" };
      const mockResponse = { message: 'Transfer queued successfully', jobId: 'job-id' };

      jest.spyOn(transactionsService, 'queueTransfer').mockResolvedValue(mockResponse);

      const result = await walletsController.transfer(
        'wallet-1',
        'wallet-2',
        transferDto,
      );
      expect(result).toEqual(mockResponse);
      expect(transactionsService.queueTransfer).toHaveBeenCalledWith(
        'wallet-1',
        'wallet-2',
        50,
        expect.any(String), // Idempotency key
      );
    });
  });
});