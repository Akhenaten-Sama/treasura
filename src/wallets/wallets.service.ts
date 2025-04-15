import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from '../wallets/wallets.entity';
import { UsersService } from '../users/users.service';
import { TransactionType, TransactionStatus } from '../transactions/transaction.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { validate as isUuid } from 'uuid';
import { RedisService } from '../cache/redis.service';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource, // Inject DataSource for transactions
    private readonly transactionsService: TransactionsService, // Inject TransactionsService
    private readonly redisService: RedisService, // Inject RedisService
  ) {}

  // Helper method to validate UUID
  private validateUUID(id: string, fieldName: string): void {
    if (!isUuid(id)) {
      throw new BadRequestException(`${fieldName} must be a valid UUID`);
    }
  }

  async create(email: string,): Promise<Wallet|{message:string,wallet:Wallet}> {
    const user = await this.usersService.findByEmail(email.trim());
    console.log(user)

    // Check if the user already has a wallet
    const existingWallet = await this.walletRepository.findOne({ where: { user: { id: user.id } }, relations: ['user'] });
    if (existingWallet) {
       return {message:"wallet for user already exist", wallet:existingWallet}
    }

    const wallet = this.walletRepository.create({
      user,
     
    });
    return this.walletRepository.save(wallet);
  }

  async findOne(id: string): Promise<Wallet> {
    this.validateUUID(id.trim(), 'Wallet ID'); // Validate UUID

    // Check Redis cache
    const cacheKey = `wallet:${id}`;
    const cachedWallet = await this.redisService.get(cacheKey);
    if (cachedWallet) {
      console.log(`Cache hit for wallet ID: ${id}`);
      return JSON.parse(cachedWallet);
    }

    // Fetch from database if not in cache
    const wallet = await this.walletRepository.findOne({ where: { id:id.trim() }, relations: ['user'] });
    if (!wallet) {
      throw new NotFoundException(`Wallet with ID ${id} not found`);
    }

    // Cache the result
    await this.redisService.set(cacheKey, JSON.stringify(wallet), 3600); // Cache for 1 hour
    console.log(`Cache set for wallet ID: ${id}`);

    return wallet;
  }

  async updateBalance(id: string, amount: number): Promise<Wallet> {
    this.validateUUID(id.trim(), 'Wallet ID'); // Validate UUID

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager.findOne(Wallet, {
        where: { id: id.trim() },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new NotFoundException(`Wallet with ID ${id} not found`);
      }

      const currentBalance = parseFloat(wallet.balance.toString());
      const newBalance = currentBalance + amount;

      if (newBalance < 0) {
        throw new BadRequestException('Insufficient balance');
      }

      wallet.balance = parseFloat(newBalance.toFixed(2));
      await queryRunner.manager.save(wallet);

      // Invalidate cache
      const cacheKey = `wallet:${id}`;
      await this.redisService.del(cacheKey);
      console.log(`Cache invalidated for wallet ID: ${id}`);

      await queryRunner.commitTransaction();
      return wallet;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error.name === 'QueryFailedError' && error.message.includes('invalid input syntax for type uuid')) {
        throw new BadRequestException('Invalid UUID format provided');
      }

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async transfer(fromWalletId: string, toWalletId: string, amount: number): Promise<void> {

    if (fromWalletId === toWalletId) {
      throw new BadRequestException('Source and destination wallets cannot be the same');
    }
    this.validateUUID(fromWalletId.trim(), 'Source Wallet ID'); // Validate UUID
    this.validateUUID(toWalletId.trim(), 'Destination Wallet ID'); // Validate UUID

    if (amount <= 0) {
      throw new BadRequestException('Transfer amount must be greater than zero');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock the source wallet
      const sourceWallet = await queryRunner.manager.findOne(Wallet, {
        where: { id: fromWalletId.trim() },
        lock: { mode: 'pessimistic_write' },
      });

      if (!sourceWallet) {
        throw new NotFoundException('Source wallet not found');
      }

      // Lock the destination wallet
      const destWallet = await queryRunner.manager.findOne(Wallet, {
        where: { id: toWalletId.trim() },
        lock: { mode: 'pessimistic_write' },
      });

      if (!destWallet) {
        throw new NotFoundException('Destination wallet not found');
      }

      // Check for sufficient funds
      if (sourceWallet.balance < amount) {
        throw new BadRequestException('Insufficient funds for transfer');
      }

      // Perform the transfer
      const sourceBalance =   parseFloat(sourceWallet.balance.toString())
      const destBalance = parseFloat(destWallet.balance.toString())


      sourceWallet.balance = parseFloat((sourceBalance - amount).toFixed(2));
      destWallet.balance = parseFloat((destBalance + amount).toFixed(2));

      await queryRunner.manager.save(sourceWallet);
      await queryRunner.manager.save(destWallet);

      // Create transaction records for both wallets
    //   await this.transactionsService.createTransaction({
    //     walletId: fromWalletId,
    //     toWalletId,
    //     amount,
    //     type: TransactionType.TRANSFER,
    //     transactionId: this.generateTransactionId(),
    //   });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error.name === 'QueryFailedError' && error.message.includes('invalid input syntax for type uuid')) {
        throw new BadRequestException('Invalid UUID format provided');
      }

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async save(wallet: Wallet): Promise<Wallet> {
    return await this.walletRepository.save(wallet);
  }
}
