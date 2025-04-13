import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { WalletsModule } from './wallets/wallets.module';
import { ConfigModule } from '@nestjs/config';
import { configuration, validationSchema } from './config';
import { AppService } from './app.service';
import { TransactionsModule } from './transactions/transactions.module';
import { BullModule, InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validationSchema }),
    UsersModule,
    DatabaseModule,
    WalletsModule,
    TransactionsModule,
    UsersModule,
    AuthModule,
    BullModule.forRoot({
      redis: {
        host: 'localhost', // Redis container name
        port: 6379,            // Redis default port
      },
    }),
    BullModule.registerQueue({
      name: 'transactionQueue', // Register the queue globally
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(@InjectQueue('transactionQueue') private readonly transactionQueue: Queue) {}

  async onModuleInit() {
    const redisClient = await this.transactionQueue.client;

    redisClient.on('ready', () => {
      console.log('Connected to Redis successfully!');
    });

    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
  }
}

