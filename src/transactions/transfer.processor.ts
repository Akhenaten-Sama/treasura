import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { TransactionsService } from './transactions.service';  // <-- Correct import
import { WalletsService } from '../wallets/wallets.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('transactionQueue')
@Injectable()
export class TransferProcessor {
  constructor(
    @InjectQueue('transactionQueue') private readonly transactionQueue: Queue,
    private readonly transactionsService: TransactionsService,  // <-- Inject the service here
    private readonly walletsService: WalletsService,
  ) {}

  // Process a transfer by adding it to the queue
  async processTransfer(createTransactionDto: CreateTransactionDto) {
    const newTransaction = await this.transactionsService.createTransaction(createTransactionDto);
    // Continue processing (e.g., updating wallet balances, etc.)
  }

  @Process('transfer')
  async handleTransfer(job: Job) {
    const { fromWalletId, toWalletId, amount } = job.data;

    try {
      await this.walletsService.transfer(fromWalletId, toWalletId, amount);
      console.log(`Transfer processed successfully: ${job.id}`);
    } catch (error) {
      console.error(`Failed to process transfer: ${job.id}`, error);
      throw error; // Retry logic will be triggered
    }
  }

  @Process('withdraw')
  async handleWithdraw(job: Job) {
    const { walletId, amount } = job.data;

    try {
      await this.walletsService.updateBalance(walletId, -amount);
      console.log(`Withdrawal processed successfully: ${job.id}`);
    } catch (error) {
      console.error(`Failed to process withdrawal: ${job.id}`, error);
      throw error; // Retry logic will be triggered
    }
  }
}
