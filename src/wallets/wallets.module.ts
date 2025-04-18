import { forwardRef, Module } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './wallets.entity';
import { UsersModule } from '../users/users.module'; // Import UsersModule
import { AuthModule } from '../auth/auth.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { CacheModule } from 'src/cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet]),
    UsersModule,
    forwardRef(()=>TransactionsModule),
    CacheModule,
    AuthModule // Add UsersModule here
  ],
  providers: [WalletsService],
  controllers: [WalletsController],
  exports: [WalletsService], // Export WalletsService for use in other modules
})
export class WalletsModule {}
