import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { TransactionsService } from './transactions.service';  // <-- Correct import
import { WalletsService } from '../wallets/wallets.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { TransactionStatus, TransactionType } from './transaction.entity';
import { RedisService } from 'src/cache/redis.service';

@Processor('transactionQueue')
@Injectable()
export class TransferProcessor {
  constructor(
    private readonly walletsService: WalletsService,
    private readonly transactionsService: TransactionsService,
    private readonly redisService: RedisService, // Inject RedisService
  ) {}

  @Process('transfer')
  async handleTransfer(job: Job): Promise<any> {
    const { fromWalletId, toWalletId, amount, transactionId } = job.data;

    try {
      const result = await this.walletsService.transfer(fromWalletId, toWalletId, amount);

      await this.transactionsService.createTransaction({
        fromWalletId,
        toWalletId,
        amount,
        type: TransactionType.TRANSFER,
        transactionId,
        status: TransactionStatus.SUCCESS,
      });

      // Invalidate cache for both wallets
      await this.redisService.del(`wallet:${fromWalletId}`);
      await this.redisService.del(`wallet:${toWalletId}`);
      console.log(`Cache invalidated for wallets: ${fromWalletId}, ${toWalletId}`);

      return { message: 'Transfer successful', result };
    } catch (error) {
      await this.transactionsService.createTransaction({
        fromWalletId,
        toWalletId,
        amount,
        type: TransactionType.TRANSFER,
        transactionId,
        status: TransactionStatus.FAILED,
      });

      throw error;
    }
  }

  @Process('withdraw')
  async handleWithdraw(job: Job): Promise<any> {
    const { walletId, amount, transactionId } = job.data;

    try {
      // Perform the withdrawal
      const result = await this.walletsService.updateBalance(walletId, -amount);

      // Create a transaction record with SUCCESS status
      await this.transactionsService.createTransaction({
        fromWalletId: walletId,
        amount: -amount, // Negative amount for withdrawal
        type: TransactionType.WITHDRAWAL,
        transactionId,
        status: TransactionStatus.SUCCESS,
      });

      console.log(`Withdrawal processed successfully: ${job.id}`);
      return { message: 'Withdrawal successful', result };
    } catch (error) {
      // Create a transaction record with FAILED status
      await this.transactionsService.createTransaction({
        fromWalletId: walletId,
        amount: -amount,
        type: TransactionType.WITHDRAWAL,
        transactionId,
        status: TransactionStatus.FAILED,
      });

      console.error(`Failed to process withdrawal: ${job.id}`, error);
      throw error; // This will mark the job as failed
    }
  }

  @Process('deposit')
  async handleDeposit(job: Job): Promise<any> {
    const { walletId, amount, transactionId } = job.data;

    try {
      // Perform the deposit
      const result = await this.walletsService.updateBalance(walletId, amount);

      // Create a transaction record with SUCCESS status
      await this.transactionsService.createTransaction({
        //fromWalletId: walletId,
        toWalletId: walletId, // Assuming deposit is to the same wallet
        amount,
        type: TransactionType.DEPOSIT,
        transactionId, 
         status: TransactionStatus.SUCCESS,
      });

      console.log(`Deposit processed successfully: ${job.id}`);
      return { message: 'Deposit successful', result };
    } catch (error) {
      // Create a transaction record with FAILED status
      await this.transactionsService.createTransaction({
        fromWalletId: walletId,
        amount,
        type: TransactionType.DEPOSIT,
        transactionId,
         status: TransactionStatus.FAILED,
      });

      console.error(`Failed to process deposit: ${job.id}`, error);
      throw error; // This will mark the job as failed
    }
  }

  @Process('exportTransactions')
  async handleExportTransactions(job: Job): Promise<{ message: string; result: any }> {
    const { walletId, batchSize } = job.data;

    try{
        console.log(`Starting export for wallet: ${walletId}`);
   const result =    await this.transactionsService.exportBatchTransactions(walletId, batchSize);    
   console.log(`Export completed for wallet: ${walletId}`);
   return { message: 'Deposit successful', result };
    }catch(error){
        console.error(`Failed to process deposit: ${job.id}`, error);
        throw error; // This will mark the job as failed
    }
    
  }
}
