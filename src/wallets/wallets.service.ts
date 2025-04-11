import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../wallets/wallets.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    private readonly usersService: UsersService,
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

    const wallet = await this.walletRepository.findOne({ where: { id } });

    if (!wallet) {
      throw new NotFoundException(`Wallet with ID ${id} not found`);
    }

    // Convert balance to a number to ensure proper arithmetic
    const currentBalance = parseFloat(wallet.balance.toString());
    const newBalance = currentBalance + amount;

    if (newBalance < 0) {
      throw new BadRequestException('Insufficient balance');
    }

    // Ensure proper numeric format
    wallet.balance = parseFloat(newBalance.toFixed(2));
    return this.walletRepository.save(wallet);
  }

  async save(wallet: Wallet): Promise<Wallet> {
    // Implement the logic to save the wallet, e.g., using a repository
    return await this.walletRepository.save(wallet);
  }
  // Other methods to deposit, withdraw, etc.
}
