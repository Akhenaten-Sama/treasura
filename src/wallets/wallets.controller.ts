import { Controller, Post, Param, Get, Body } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { AuthService } from '../auth/auth.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { TransactionsService } from '../transactions/transactions.service'; // Import TransactionsService
import { UpdateBalanceDto } from './update-balance.dto';
import { TransferDto } from './dto/transfer.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('wallets') // Group the endpoints under the "wallets" tag in Swagger
@Controller('wallets')
export class WalletsController {
  constructor(
    private readonly walletsService: WalletsService,
    private readonly authService: AuthService,
    private readonly transactionsService: TransactionsService, // Inject TransactionsService
  
  ) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new wallet for a user' }) // Describe the purpose of the endpoint
  @ApiBody({
    description: 'The data needed to create a new wallet',
    type: CreateWalletDto,
    examples: {
      example1: {
        summary: 'Example wallet creation',
        value: {
          email: 'user@example.com',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Wallet successfully created.' })
  async createWallet(@Body() createWalletDto: CreateWalletDto) {
    return this.walletsService.create(createWalletDto.email, ); // Default balance is 0
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get wallet by ID' }) // Describe the purpose of the endpoint
  @ApiParam({
    name: 'id',
    description: 'The ID of the wallet to retrieve',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 200, description: 'Get wallet by ID.' })
  @ApiResponse({ status: 404, description: 'Wallet not found.' })
  async getWallet(@Param('id') id: string) {
    return this.walletsService.findOne(id);
  }

//   @Post(':id/balance')
//   @ApiOperation({ summary: 'Update wallet balance' }) // Describe the purpose of the endpoint
//   @ApiParam({
//     name: 'id',
//     description: 'The ID of the wallet to update',
//     type: String,
//     example: '123e4567-e89b-12d3-a456-426614174000',
//   })
//   @ApiBody({
//     description: 'The data needed to update the wallet balance',
//     type: UpdateBalanceDto,
//     examples: {
//       example1: {
//         summary: 'Example balance update',
//         value: {
//           amount: 100.50,
//         },
//       },
//     },
//   })
//   @ApiResponse({ status: 200, description: 'Balance updated successfully.' })
//   @ApiResponse({ status: 404, description: 'Wallet not found.' })
//   async updateBalance(
//     @Param('id') id: string,
//     @Body() updateBalanceDto: UpdateBalanceDto,
//   ) {
//     return this.walletsService.updateBalance(id, updateBalanceDto.amount);
//   }

  @Post(':id/deposit')
  @ApiOperation({ summary: 'Deposit money into a wallet' }) // Describe the purpose of the endpoint
  @ApiParam({
    name: 'id',
    description: 'The ID of the wallet to deposit into',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    description: 'The amount to deposit',
    type: UpdateBalanceDto,
    examples: {
      example1: {
        summary: 'Example deposit',
        value: {
          amount: 100.50,
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Deposit queued successfully.' })
  @ApiResponse({ status: 404, description: 'Wallet not found.' })
  async deposit(
    @Param('id') id: string,
    @Body() updateBalanceDto: UpdateBalanceDto,
  ) {
    // Generate idempotency key
    const idempotencyKey = `deposit_${id}_${Math.floor(Date.now() / 10000)}`;
    const response = await this.transactionsService.queueDeposit(id, updateBalanceDto.amount, idempotencyKey);
    return { ...response };
  }


  @Post(':id/withdraw')
  @ApiOperation({ summary: 'Withdraw money from a wallet' }) // Describe the purpose of the endpoint
  @ApiParam({
    name: 'id',
    description: 'The ID of the wallet to withdraw from',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    description: 'The amount to withdraw',
    type: UpdateBalanceDto,
    examples: {
      example1: {
        summary: 'Example withdrawal',
        value: {
          amount: 50.00,
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Withdrawal queued successfully.' })
  @ApiResponse({ status: 400, description: 'Insufficient balance.' })
  @ApiResponse({ status: 404, description: 'Wallet not found.' })
  async withdraw(
    @Param('id') id: string,
    @Body() updateBalanceDto: UpdateBalanceDto,
  ) {
    // Generate idempotency key
    const idempotencyKey = `wtd_${id.substring(2,8)}${updateBalanceDto.amount}_${Math.floor(Date.now() / 10000)}`;
    const response = await this.transactionsService.queueWithdraw(id, updateBalanceDto.amount, idempotencyKey);
    return {  ...response };
  }

  @Post(':fromWalletId/transfer/:toWalletId')
  @ApiOperation({ summary: 'Transfer money between wallets' })
  @ApiParam({
    name: 'fromWalletId',
    description: 'The ID of the wallet to transfer from',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'toWalletId',
    description: 'The ID of the wallet to transfer to',
    type: String,
    example: '456e7890-e12b-34d5-a678-426614174111',
  })
  @ApiBody({
    description: 'The amount to transfer',
    type: TransferDto,
    examples: {
      example1: {
        summary: 'Example transfer',
        value: {
          amount: 50.0,
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Transfer successful.' })
  @ApiResponse({ status: 400, description: 'Insufficient funds or invalid input.' })
  @ApiResponse({ status: 404, description: 'Wallet not found.' })
  async transfer(
    @Param('fromWalletId') fromWalletId: string,
    @Param('toWalletId') toWalletId: string,
    @Body() transferDto: TransferDto,
  ) {
    

    //idempotency key with 15 seconds window
    const   idempotencyKey = `txn_${toWalletId.substring(2,8)}${transferDto.amount}_${Math.floor(Date.now() / 10000)}_${fromWalletId.substring(2,8)}`; 
   const response = await this.transactionsService.queueTransfer(fromWalletId, toWalletId, transferDto.amount, idempotencyKey);
    const { message, ...rest } = response;
    return { message, ...rest };
  }
}
