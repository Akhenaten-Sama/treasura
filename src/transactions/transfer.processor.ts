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
    private readonly walletsService: WalletsService,
    private readonly transactionsService: TransactionsService,
  ) {}

  // Process a transfer by adding it to the queue
  async processTransfer(createTransactionDto: CreateTransactionDto) {
    const newTransaction = await this.transactionsService.createTransaction(createTransactionDto);
    // Continue processing (e.g., updating wallet balances, etc.)
  }

  @Process('transfer')
  async handleTransfer(job: Job): Promise<any> {
    const { fromWalletId, toWalletId, amount } = job.data;

    try {
      const result = await this.walletsService.transfer(fromWalletId, toWalletId, amount);
      
      console.log(`Transfer processed successfully: ${job.id}`, result);
      return { message: 'Transfer successful', result }; // This will be stored as `returnvalue`
    } catch (error) {
      console.error(`Failed to process transfer: ${job.id}`, error);
      throw error; // This will mark the job as failed
    }
  }

  @Process('withdraw')
  async handleWithdraw(job: Job): Promise<any> {
    const { walletId, amount } = job.data;

    try {
      const result = await this.walletsService.updateBalance(walletId, -amount);
      console.log(`Withdrawal processed successfully: ${job.id}`);
      return { message: 'Withdrawal successful', result }; // This will be stored as `returnvalue`
    } catch (error) {
      console.error(`Failed to process withdrawal: ${job.id}`, error);
      throw error; // This will mark the job as failed
    }
  }

  @Process('deposit')
  async handleDeposit(job: Job): Promise<any> {
    const { walletId, amount } = job.data;

    try {
      const result = await this.walletsService.updateBalance(walletId, amount);
      console.log(`Deposit processed successfully: ${job.id}`);
      return { message: 'Deposit successful', result }; // This will be stored as `returnvalue`
    } catch (error) {
      console.error(`Failed to process deposit: ${job.id}`, error);
      throw error; // This will mark the job as failed
    }
  }
}
