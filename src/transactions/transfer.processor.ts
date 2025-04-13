import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { TransactionsService } from './transactions.service';  // <-- Correct import
import { WalletsService } from '../wallets/wallets.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { TransactionStatus, TransactionType } from './transaction.entity';

@Processor('transactionQueue')
@Injectable()
export class TransferProcessor {
  constructor(
    private readonly walletsService: WalletsService,
    private readonly transactionsService: TransactionsService,
  ) {}

  @Process('transfer')
  async handleTransfer(job: Job): Promise<any> {
    const { fromWalletId, toWalletId, amount, transactionId } = job.data;

    try {
      // Perform the transfer
      const result = await this.walletsService.transfer(fromWalletId, toWalletId, amount,);

      // Create a transaction record with SUCCESS status
      await this.transactionsService.createTransaction({
      fromWalletId,
        toWalletId,
        amount,
        type: TransactionType.TRANSFER,
        transactionId,
        status: TransactionStatus.SUCCESS,
      });

      console.log(`Transfer processed successfully: ${job.id}`, result);
      return { message: 'Transfer successful', result };
    } catch (error) {
      // Create a transaction record with FAILED status
      await this.transactionsService.createTransaction({
        fromWalletId,
        toWalletId,
        amount,
        type: TransactionType.TRANSFER,
        transactionId,
        status: TransactionStatus.FAILED,
      });

      console.error(`Failed to process transfer: ${job.id}`, error);
      throw error; // This will mark the job as failed
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
}
