import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionType, TransactionStatus } from './transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { WalletsService } from '../wallets/wallets.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    private walletsService: WalletsService,
  ) {}

  // Create a new transaction
  async createTransaction(dto: CreateTransactionDto): Promise<Transaction> {
    const existing = await this.txRepo.findOne({ where: { id: dto.transactionId } });
    if (existing) {
      throw new ConflictException('Duplicate transaction ID');
    }

    const sourceWallet = await this.walletsService.findOne(dto.walletId);
    if (!sourceWallet) throw new NotFoundException('Source wallet not found');

    if (dto.type === TransactionType.WITHDRAWAL && sourceWallet.balance < dto.amount) {
      throw new ConflictException('Insufficient funds');
    }

    if (dto.type === TransactionType.TRANSFER) {
      if (!dto.toWalletId) {
        throw new NotFoundException('Destination wallet ID is required');
      }
      const destWallet = await this.walletsService.findOne(dto.toWalletId);
      if (!destWallet) throw new NotFoundException('Destination wallet not found');

      sourceWallet.balance -= dto.amount;
      destWallet.balance += dto.amount;
      await this.walletsService.save(sourceWallet);
      await this.walletsService.save(destWallet);
    } else {
      const factor = dto.type === TransactionType.DEPOSIT ? 1 : -1;
      sourceWallet.balance += factor * dto.amount;
      await this.walletsService.save(sourceWallet);
    }

    return this.txRepo.save({ ...dto, status: TransactionStatus.SUCCESS });
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
