import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { WalletsModule } from '../wallets/wallets.module';
import { BullModule } from '@nestjs/bull';
import { TransferProcessor } from './transfer.processor';
import { CacheModule } from '../cache/cache.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    forwardRef(() => WalletsModule),
    BullModule.registerQueue({
      name: 'transactionQueue',
    }),
    CacheModule,
  ],
  providers: [TransactionsService, TransferProcessor],
  controllers: [TransactionsController],
  exports: [TransactionsService],
})
export class TransactionsModule {}
