import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransferDto } from './dto/transfer.dto';
import { WithdrawDto } from './dto/withdraw.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('transfer')
  transfer(@Body() dto: TransferDto) {
    return this.transactionsService.queueTransfer(dto);
  }

  @Post('withdraw')
  withdraw(@Body() dto: WithdrawDto) {
    return this.transactionsService.withdraw(dto);
  }

  @Get(':walletId')
  getWalletTransactions(
    @Param('walletId') walletId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.transactionsService.getTransactions(walletId, { page, limit });
  }
}
