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
import * as fs from 'fs';
import * as path from 'path';
import { validate as isUUID } from 'uuid';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    @InjectQueue('transactionQueue')
    private readonly transactionQueue: Queue,
    private readonly redisService: RedisService, // Inject RedisService
  ) {}


  // methods
  async createTransaction(dto: CreateTransactionDto): Promise<Transaction> {
    const existingTransaction = await this.txRepo.findOne({ where: { transactionId: dto.transactionId } });
    if (existingTransaction) {
      throw new ConflictException('Transaction with the same idempotencyKey already exists');
    }

    const transaction = this.txRepo.create({ ...dto });

    if (dto.fromWalletId) {
      const fromWallet = await this.txRepo.manager.findOne(Wallet, { where: { id: dto.fromWalletId } });
      if (!fromWallet) {
        throw new NotFoundException(`Source wallet with ID ${dto.fromWalletId} not found`);
      }
      transaction.fromWallet = fromWallet;
    }

    if (dto.toWalletId) {
      const toWallet = await this.txRepo.manager.findOne(Wallet, { where: { id: dto.toWalletId } });
      if (!toWallet) {
        throw new NotFoundException(`Destination wallet with ID ${dto.toWalletId} not found`);
      }
      transaction.toWallet = toWallet;
    }

    const savedTransaction = await this.txRepo.save(transaction);

    // Invalidate cache for the wallets involved in the transaction
    if (dto.fromWalletId) {
      const fromWalletCacheKey = `transactions:wallet:${dto.fromWalletId}:*`;
      await this.redisService.del(fromWalletCacheKey);
      console.log(`Cache invalidated for wallet transactions: ${dto.fromWalletId}`);
    }

    if (dto.toWalletId) {
      const toWalletCacheKey = `transactions:wallet:${dto.toWalletId}:*`;
      await this.redisService.del(toWalletCacheKey);
      console.log(`Cache invalidated for wallet transactions: ${dto.toWalletId}`);
    }

    return savedTransaction;
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
  
  async exportBatchTransactions(walletId: string, batchSize: number = 100): Promise<string> {
    let offset = 0;
    let hasMore = true;
  
    const exportsDir = path.join(__dirname, '../../exports');
    const fileName = `transactions_${walletId}_${Date.now()}.csv`;
    const filePath = path.join(exportsDir, fileName);

    // Generate a full URL for the exported file
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000'; // Replace with your actual base URL
    const fileUrl = `${baseUrl}/exports/${fileName}`;
    // Ensure the exports directory exists
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
      console.log(`Created directory: ${exportsDir}`);
    }
  
    const writeStream = fs.createWriteStream(filePath);
  
    // Write CSV headers
    writeStream.write('Transaction ID,From Wallet,To Wallet,Amount,Type,Status,Created At\n');
  
    while (hasMore) {
      const transactions = await this.txRepo.find({
        where: [
          { fromWallet: { id: walletId } },
          { toWallet: { id: walletId } },
        ],
        order: { createdAt: 'DESC' },
        skip: offset,
        take: batchSize,
      });
  
      if (transactions.length === 0) {
        hasMore = false;
        break;
      }
  
      // Write transactions to the file
      for (const tx of transactions) {
        writeStream.write(
          `${tx.transactionId},${tx.fromWallet?.id || 'N/A'},${tx.toWallet?.id || 'N/A'},${tx.amount},${tx.type},${tx.status},${tx.createdAt}\n`,
        );
      }
  
      offset += batchSize;
    }
  
    writeStream.end();
    console.log(`Transactions exported to ${filePath}`);
  
    return `${fileUrl}`; // Return the relative file path
  }
  


//    Queues
async queueTransfer(fromWalletId: string, toWalletId: string, amount: number, transactionId: string): Promise<{ message: string; jobId?: string | number }> {
  // Validate wallet IDs
  if (!isUUID(fromWalletId) || !isUUID(toWalletId)) {
    throw new BadRequestException({
      statusCode: 400,
      message: 'Invalid wallet ID(s). Both source and destination wallet IDs must be valid UUIDs',
    });
  }

  // Check if the transaction already exists
  if (fromWalletId === toWalletId) {
    throw new BadRequestException('Source and destination wallets cannot be the same');
  }

  const existingTransaction = await this.txRepo.findOne({ where: { transactionId } });
  if (existingTransaction) {
    throw new ConflictException('Duplicate transaction, please try again after some time');
  }

  // Prevent overdraft
 
  // Check if source wallet exists
  const fromWallet = await this.txRepo.manager.findOne(Wallet, { where: { id: fromWalletId } });
  if (!fromWallet) {
    throw new NotFoundException({
      statusCode: 404,
      message: `Source wallet with ID ${fromWalletId} does not exist`,
    });
  }

  const OriginWallet = await this.txRepo.manager.findOne(Wallet, { where: { id: fromWalletId } });
  if (!OriginWallet || OriginWallet.balance < amount) {
    throw new BadRequestException({
      statusCode: 400,
      message: 'Insufficient balance to complete the transfer',
    });
  }

  // Check if destination wallet exists
  const toWallet = await this.txRepo.manager.findOne(Wallet, { where: { id: toWalletId } });
  if (!toWallet) {
    throw new NotFoundException({
      statusCode: 404,
      message: `Destination wallet with ID ${toWalletId} does not exist`,
    });
  }

  // Queue the job if the transaction does not exist
  const job = await this.transactionQueue.add('transfer', { fromWalletId, toWalletId, amount, transactionId });
  return { message: 'Transfer queued successfully', jobId: job.id };
}

async queueWithdraw(walletId: string, amount: number, transactionId: string): Promise<{ message: string; jobId?: string | number }> {
  // Check if the transaction already exists
  const existingTransaction = await this.txRepo.findOne({ where: { transactionId } });
  if (existingTransaction) {
    throw new ConflictException('Duplicate transaction detected. Please try again after some time.');
  }

  // Check if the wallet exists
  const wallet = await this.txRepo.manager.findOne(Wallet, { where: { id: walletId } });
  if (!wallet) {
    throw new NotFoundException(`Wallet with ID ${walletId} does not exist`);
  }

  // Prevent overdraft
  if (wallet.balance < amount) {
    throw new BadRequestException('Insufficient balance to complete the withdrawal');
  }

  // Queue the job if the transaction does not exist and balance is sufficient
  const job = await this.transactionQueue.add('withdraw', { walletId, amount, transactionId });
  return { message: 'Withdrawal queued successfully', jobId: job.id };
}

async queueDeposit(walletId: string, amount: number, transactionId: string): Promise<{ message: string; jobId?: string | number }> {
  // Check if the transaction already exists
  const existingTransaction = await this.txRepo.findOne({ where: { transactionId } });
  if (existingTransaction) {
    throw new ConflictException('A transaction with the same ID already exists. Please try again later.');
  }

  // Queue the job if the transaction does not exist
  const job = await this.transactionQueue.add('deposit', { walletId, amount, transactionId });
  return { message: 'Deposit queued successfully', jobId: job.id };
}

async queueExportTransactions(walletId: string, batchSize: number = 100): Promise<{ jobId: string }> {
    const job = await this.transactionQueue.add('exportTransactions', { walletId, batchSize });
    return { jobId: job.id.toString() };
}



  // Other methods for transaction management...
}
