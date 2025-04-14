import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Wallet } from '../wallets/wallets.entity';
import { User } from '../users/users.entity';
import { Transaction } from 'src/transactions/transaction.entity';
//import { Transaction } from '../transactions/entities/transaction.entity';

export const typeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.NODE_ENV === 'development' ? 'localhost' : 'postgres', // Use 'localhost' for local dev
  port: configService.get<number>('DATABASE_PORT', 5432),
  username: configService.get<string>('DATABASE_USERNAME', 'postgres'),
  password: configService.get<string>('DATABASE_PASSWORD', 'postgres'),
  database: configService.get<string>('DATABASE_NAME', 'treasura'),
  entities: [User, Wallet, Transaction],
  synchronize: true, // Set to false in production
  logging: true,
});