import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from './entities/transaction.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { User } from '../users/entities/user.entity';
import { TransferProcessor } from './transfer.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Wallet, User]),
    BullModule.registerQueue({
      name: 'transfer-queue',
    }),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransferProcessor],
})
export class TransactionsModule {}
