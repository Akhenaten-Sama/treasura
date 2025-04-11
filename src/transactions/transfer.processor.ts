import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { TransactionsService } from './transactions.service';  // <-- Correct import
import { WalletsService } from '../wallets/wallets.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

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
}
