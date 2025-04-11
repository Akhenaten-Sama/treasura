import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './wallets.entity';
import { UsersService } from '../users/users.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateBalanceDto } from './update-balance.dto';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private walletsRepository: Repository<Wallet>,
    private usersService: UsersService,
  ) {}

  async createWallet(userId: string): Promise<Wallet> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    const wallet = this.walletsRepository.create({ userId });
    return this.walletsRepository.save(wallet);
  }

  async getWalletById(id: string): Promise<Wallet> {
    const wallet = await this.walletsRepository.findOne({ where: { id } });
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    return wallet;
  }

  async updateBalance(walletId: string, amount: number): Promise<Wallet> {
    const wallet = await this.getWalletById(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    wallet.balance += amount;
    return this.walletsRepository.save(wallet);
  }
}
