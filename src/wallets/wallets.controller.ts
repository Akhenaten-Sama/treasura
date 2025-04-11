import { Controller, Post, Param, Get, Body } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateBalanceDto } from './update-balance.dto';
import { AuthService } from '../auth/auth.service';
import { ApiResponse } from '@nestjs/swagger';

@Controller('wallets')
export class WalletsController {
  constructor(
    private readonly walletsService: WalletsService,
    private readonly authService: AuthService,
  ) {}

  @Post('create')
  @ApiResponse({ status: 201, description: 'Wallet successfully created.' })
  async createWallet(@Body() createWalletDto: CreateWalletDto) {
    return this.walletsService.create(createWalletDto.userId);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Get wallet by ID.' })
  async getWallet(@Param('id') id: string) {
    return this.walletsService.findOne(id);
  }

  @Post(':id/balance')
  @ApiResponse({ status: 200, description: 'Balance updated successfully.' })
  async updateBalance(
    @Param('id') id: string,
    @Body() updateBalanceDto: UpdateBalanceDto,
  ) {
    return this.walletsService.updateBalance(id, updateBalanceDto.amount);
  }
}
