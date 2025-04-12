import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from '../wallets/wallets.entity';
import { UsersService } from '../users/users.service';
import { TransactionType, TransactionStatus } from '../transactions/transaction.entity';
import { TransactionsService } from '../transactions/transactions.service';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource, // Inject DataSource for transactions
    private readonly transactionsService: TransactionsService, // Inject TransactionsService
  ) {}

  async create(email: string, balance: number = 0): Promise<Wallet> {
    const user = await this.usersService.findByEmail(email);
    const wallet = this.walletRepository.create({
      user,
      balance,
    });
    return this.walletRepository.save(wallet);
  }

  async findOne(id: string): Promise<Wallet> {
    return this.walletRepository.findOneOrFail({ where: { id }, relations: ['user'] });
  }

  async updateBalance(id: string, amount: number): Promise<Wallet> {
    // Validate that amount is a valid number
    if (isNaN(amount) || typeof amount !== 'number') {
      throw new BadRequestException('Amount must be a valid number');
    }

    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock the wallet row for update
      const wallet = await queryRunner.manager.findOne(Wallet, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new NotFoundException(`Wallet with ID ${id} not found`);
      }

      // Perform balance update
      const currentBalance = parseFloat(wallet.balance.toString());
      const newBalance = currentBalance + amount;
      
//prevent overdraft
      if (newBalance < 0) {
        throw new BadRequestException('Insufficient balance');
      }

      wallet.balance = parseFloat(newBalance.toFixed(2));
      await queryRunner.manager.save(wallet);

      // Commit the transaction
      await queryRunner.commitTransaction();
      return wallet;
    } catch (error) {
      // Rollback the transaction in case of an error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  async transfer(fromWalletId: string, toWalletId: string, amount: number): Promise<void> {
    if (amount <= 0) {
      throw new BadRequestException('Transfer amount must be greater than zero');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock the source wallet
      const sourceWallet = await queryRunner.manager.findOne(Wallet, {
        where: { id: fromWalletId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!sourceWallet) {
        throw new NotFoundException('Source wallet not found');
      }

      // Lock the destination wallet
      const destWallet = await queryRunner.manager.findOne(Wallet, {
        where: { id: toWalletId },
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
      sourceWallet.balance = parseFloat((sourceWallet.balance - amount).toFixed(2));
      destWallet.balance = parseFloat((destWallet.balance + amount).toFixed(2));

      await queryRunner.manager.save(sourceWallet);
      await queryRunner.manager.save(destWallet);

      // Create transaction records for both wallets
      await this.transactionsService.createTransaction({
        walletId: fromWalletId,
        toWalletId,
        amount,
        type: TransactionType.TRANSFER,
        transactionId: this.generateTransactionId(),
      });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async save(wallet: Wallet): Promise<Wallet> {
    // Implement the logic to save the wallet, e.g., using a repository
    return await this.walletRepository.save(wallet);
  }
  // Other methods to deposit, withdraw, etc.
}
