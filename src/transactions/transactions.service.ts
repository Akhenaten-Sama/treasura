import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction, TransactionType, TransactionStatus } from './transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { WalletsService } from '../wallets/wallets.service';
import { Wallet } from '../wallets/wallets.entity';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { RedisService } from '../cache/redis.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    @InjectQueue('transactionQueue')
    private readonly transactionQueue: Queue,
    private readonly redisService: RedisService, // Inject RedisService
  ) {}

  async createTransaction(dto: CreateTransactionDto): Promise<Transaction> {
    // Check for existing transaction with the same idempotencyKey
    const existingTransaction = await this.txRepo.findOne({ where: { transactionId: dto.transactionId } });
    if (existingTransaction) {
      throw new ConflictException('Transaction with the same idempotencyKey already exists');
    }

    const transaction = this.txRepo.create({
      ...dto,
    });

    // Fetch and set the fromWallet if fromWalletId is provided
    if (dto.fromWalletId) {
      const fromWallet = await this.txRepo.manager.findOne(Wallet, { where: { id: dto.fromWalletId } });
      if (!fromWallet) {
        throw new NotFoundException(`Source wallet with ID ${dto.fromWalletId} not found`);
      }
      transaction.fromWallet = fromWallet;
    }

    // Fetch and set the toWallet if toWalletId is provided
    if (dto.toWalletId) {
      const toWallet = await this.txRepo.manager.findOne(Wallet, { where: { id: dto.toWalletId } });
      if (!toWallet) {
        throw new NotFoundException(`Destination wallet with ID ${dto.toWalletId} not found`);
      }
      transaction.toWallet = toWallet;
    }

    return this.txRepo.save(transaction);
  }

  // Find a transaction by its ID with caching
  async findById(id: string): Promise<Transaction> {
    const cacheKey = `transaction:${id}`;

    // Check Redis cache
    const cachedTransaction = await this.redisService.get(cacheKey);
    if (cachedTransaction) {
      console.log(`Cache hit for transaction ID: ${id}`);
      return JSON.parse(cachedTransaction);
    }

    // Fetch from database if not in cache
    const transaction = await this.txRepo.findOne({ where: { id } });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    // Cache the result
    await this.redisService.set(cacheKey, JSON.stringify(transaction), 3600); // Cache for 1 hour
    console.log(`Cache set for transaction ID: ${id}`);

    return transaction;
  }

  // Get transactions for a wallet with caching
  async getTransactionsForWallet(walletId: string, page: number, limit: number): Promise<{ data: Transaction[]; total: number }> {
    const cacheKey = `transactions:wallet:${walletId}:page:${page}:limit:${limit}`;

    // Check Redis cache
    const cachedTransactions = await this.redisService.get(cacheKey);
    if (cachedTransactions) {
      console.log(`returning result from cache: ${walletId}`);
      return JSON.parse(cachedTransactions);
    }

    // Fetch from database if not in cache
    const offset = (page - 1) * limit;

    const [data, total] = await this.txRepo.findAndCount({
      where: [
        { fromWallet: { id: walletId } }, // Outgoing transactions
        { toWallet: { id: walletId } },  // Incoming transactions
      ],
      order: { createdAt: 'DESC' }, // Ensure 'createdAt' exists in the Transaction entity
      skip: offset,
      take: limit,
    });

    const result = { data, total, currentPage:page };

    // Cache the result
    await this.redisService.set(cacheKey, JSON.stringify(result), 3600); // Cache for 1 hour
    console.log(`Cache set for wallet transactions: ${walletId}`);

    return result;
  }

async queueTransfer(fromWalletId: string, toWalletId: string, amount: number, transactionId: string): Promise<{ message: string; jobId?: string | number }> {
  // Check if the transaction already exists
  const existingTransaction = await this.txRepo.findOne({ where: { transactionId } });
  console.log(existingTransaction, "existing")
  
  if (existingTransaction) {
    return { message: 'Duplicate transaction, please try again after some time' };
  }

  // Queue the job if the transaction does not exist
  const job = await this.transactionQueue.add('transfer', { fromWalletId, toWalletId, amount, transactionId });
  return { message: 'Transfer queued successfully', jobId: job.id };
}

async queueWithdraw(walletId: string, amount: number, transactionId: string): Promise<{ message: string; jobId?: string | number }> {
  // Check if the transaction already exists
  const existingTransaction = await this.txRepo.findOne({ where: { transactionId } });
  if (existingTransaction) {
    return { message: 'Duplicate transaction, please try again in 15 seconds' };
  }

  // Queue the job if the transaction does not exist
  const job = await this.transactionQueue.add('withdraw', { walletId, amount, transactionId });
  return { message: 'Withdrawal queued successfully', jobId: job.id };
}

async queueDeposit(walletId: string, amount: number, transactionId: string): Promise<{ message: string; jobId?: string | number }> {
  // Check if the transaction already exists
  const existingTransaction = await this.txRepo.findOne({ where: { transactionId } });
  if (existingTransaction) {
    return { message: 'Duplicate transaction, please try again in some seconds' };
  }

  // Queue the job if the transaction does not exist
  const job = await this.transactionQueue.add('deposit', { walletId, amount, transactionId });
  return { message: 'Deposit queued successfully', jobId: job.id };
}

async getJobById(id: string): Promise<any> {
  const job = await this.transactionQueue.getJob(id);
  if (!job) {
    throw new NotFoundException(`Job with ID ${id} not found`);
  }

  return {
    jobId: job.id,
    type: job.name,
    data: job.data,
    attemptsMade: job.attemptsMade,
    status: await job.getState(), 
    result: await job.returnvalue, 
    failedReason: job.failedReason, 
   
  };
}
  // Other methods for transaction management...
}
