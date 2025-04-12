import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction, TransactionType, TransactionStatus } from './transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { WalletsService } from '../wallets/wallets.service';
import { Wallet } from '../wallets/wallets.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    private walletsService: WalletsService,
    private dataSource: DataSource,
  ) {}

  // Create a new transaction
  async createTransaction(dto: CreateTransactionDto): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sourceWallet = await queryRunner.manager.findOne(Wallet, {
        where: { id: dto.walletId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!sourceWallet) {
        throw new NotFoundException('Source wallet not found');
      }

      if (dto.type === TransactionType.WITHDRAWAL && sourceWallet.balance < dto.amount) {
        throw new ConflictException('Insufficient funds');
      }

      if (dto.type === TransactionType.TRANSFER) {
        if (!dto.toWalletId) {
          throw new BadRequestException('Destination wallet ID is required');
        }

        const destWallet = await queryRunner.manager.findOne(Wallet, {
          where: { id: dto.toWalletId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!destWallet) {
          throw new NotFoundException('Destination wallet not found');
        }

        if (sourceWallet.balance < dto.amount) {
          throw new ConflictException('Insufficient funds for transfer');
        }

        // Perform the transfer
    const sourceBalance =   parseFloat(sourceWallet.balance.toString())
    const destBalance = parseFloat(destWallet.balance.toString())
    

    const newSourceBalance = sourceBalance - dto.amount
    const newDestBalance = destBalance + dto.amount
    sourceWallet.balance = parseFloat(newSourceBalance.toFixed(2));
    destWallet.balance = parseFloat(newDestBalance.toFixed(2))


        await queryRunner.manager.save(sourceWallet);
        await queryRunner.manager.save(destWallet);
      } else if (dto.type === TransactionType.WITHDRAWAL) {
        // Handle withdrawal
        sourceWallet.balance -= dto.amount;
        await queryRunner.manager.save(sourceWallet);
      } else if (dto.type === TransactionType.DEPOSIT) {
        // Handle deposit
        sourceWallet.balance += dto.amount;
        await queryRunner.manager.save(sourceWallet);
      } else {
        throw new BadRequestException('Invalid transaction type');
      }

      // Save the transaction
      const transaction = this.txRepo.create({
        ...dto,
        status: TransactionStatus.SUCCESS,
      });
      await queryRunner.manager.save(transaction);

      // Commit the transaction
      await queryRunner.commitTransaction();
      return transaction;
    } catch (error) {
      // Rollback the transaction in case of an error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  // Find a transaction by its ID
  async findById(id: string): Promise<Transaction> {
    const transaction = await this.txRepo.findOne({ where: { id } });
    if (!transaction) {
      throw new Error(`Transaction with ID ${id} not found`);
    }
    return transaction;
  }

  // Other methods for transaction management...
}
