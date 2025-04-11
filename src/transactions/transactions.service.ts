import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { Transaction } from './entities/transaction.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { TransferDto } from './dto/transfer.dto';
import { WithdrawDto } from './dto/withdraw.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
    @InjectRepository(Wallet) private walletRepo: Repository<Wallet>,
    @InjectQueue('transfer-queue') private transferQueue: Queue,
  ) {}

  async queueTransfer(dto: TransferDto) {
    await this.transferQueue.add(dto, {
      jobId: dto.idempotencyKey, // ensures idempotency
      attempts: 3,
      backoff: 3000,
    });
    return { status: 'queued' };
  }

  async withdraw(dto: WithdrawDto) {
    // withdraw logic here or also queue it
  }

  async getTransactions(walletId: string, { page, limit }) {
    return this.txRepo.find({
      where: { wallet: { id: walletId } },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
