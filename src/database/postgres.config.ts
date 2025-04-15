import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Wallet } from '../wallets/wallets.entity';
import { User } from '../users/users.entity';
import { Transaction } from 'src/transactions/transaction.entity';

export const typeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DATABASE_HOST', 'localhost'), // Use 'postgres' for Docker
  port: configService.get<number>('DATABASE_PORT', 5432),
  username: configService.get<string>('DATABASE_USERNAME', 'postgres'),
  password: configService.get<string>('DATABASE_PASSWORD', 'postgres'),
  database: configService.get<string>('DATABASE_NAME', 'treasura'),
  entities: [User, Wallet, Transaction],
  synchronize: true, // Set to false in production
  logging: true,
  extra: {
    max: 20, // Allow up to 50 concurrent connections
    connectionTimeoutMillis: 5000, 
    idleTimeoutMillis: 10000,
    statement_timeout: 10000, 
    query_timeout: 10000, 
  },
});