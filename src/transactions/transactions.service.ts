import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction, TransactionType, TransactionStatus } from './transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { WalletsService } from '../wallets/wallets.service';
import { Wallet } from '../wallets/wallets.entity';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    @InjectQueue('transactionQueue')
    private readonly transactionQueue: Queue,
  ) {}

  async createTransaction(dto: CreateTransactionDto): Promise<Transaction> {
    const transaction = this.txRepo.create({
      ...dto,
      status: TransactionStatus.SUCCESS,
    });

    return this.txRepo.save(transaction);
  }

  // Find a transaction by its ID
  async findById(id: string): Promise<Transaction> {
    const transaction = await this.txRepo.findOne({ where: { id } });
    if (!transaction) {
      throw new Error(`Transaction with ID ${id} not found`);
    }
    return transaction;
  }

  async getTransactionsForWallet(walletId: string, page: number, limit: number): Promise<{ data: Transaction[]; total: number }> {
    const offset = (page - 1) * limit;

    const [data, total] = await this.txRepo.findAndCount({
      where: [
        { fromWallet: { id: walletId } }, // Outgoing transactions
        { toWallet: { id: walletId } },  // Incoming transactions
      ],
      relations: ['fromWallet', 'toWallet'],
      order: { createdAt: 'DESC' }, // Ensure 'createdAt' exists in the Transaction entity
      skip: offset,
      take: limit,
    });

    return { data, total };
  }

async queueTransfer(fromWalletId: string, toWalletId: string, amount: number): Promise<{ jobId: string | number }> {
    const job = await this.transactionQueue.add('transfer', { fromWalletId, toWalletId, amount });
    return { jobId: job.id }; // job.id can be a string or a number
}

  async queueWithdraw(walletId: string, amount: number): Promise<{ jobId: string | number }> {
    
const job = await this.transactionQueue.add('withdraw', { walletId, amount });
return { jobId: job.id };  
}

  async queueDeposit(walletId: string, amount: number): Promise<{ jobId: string | number }> {
   const job =  await this.transactionQueue.add('deposit', { walletId, amount });
   return { jobId: job.id };
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
