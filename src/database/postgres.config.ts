import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Wallet } from '../wallets/wallets.entity';
import { User } from '../users/users.entity';
import { Transaction } from 'src/transactions/transaction.entity';
//import { Transaction } from '../transactions/entities/transaction.entity';

export const typeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: configService.get<string>('database.host'),
    port: configService.get<number>('database.port'),
    username: configService.get<string>('database.username'),
    password: configService.get<string>('database.password'),
    database: configService.get<string>('database.name'),
    entities: [User, Wallet, Transaction],
    synchronize: true,
    logging: true,
  });