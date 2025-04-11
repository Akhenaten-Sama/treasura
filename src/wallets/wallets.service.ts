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

  async create(userId: string, balance: number = 0): Promise<Wallet> {
    const user = await this.usersService.findOneById(userId);
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
    const wallet = await this.walletRepository.findOne({ where: { id } });

    if (!wallet) {
      throw new NotFoundException(`Wallet with ID ${id} not found`);
    }

    if (wallet.balance + amount < 0) {
      throw new BadRequestException('Insufficient balance');
    }

    wallet.balance += amount;
    return this.walletRepository.save(wallet);
  }

  async save(wallet: Wallet): Promise<Wallet> {
    // Implement the logic to save the wallet, e.g., using a repository
    return await this.walletRepository.save(wallet);
  }
  // Other methods to deposit, withdraw, etc.
}
