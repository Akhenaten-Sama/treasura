import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Transaction } from './transaction.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('transactions') // Group the endpoints under the "transactions" tag in Swagger
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

//   @Post()
//   @ApiOperation({ summary: 'Create a new transaction' }) // Describe the purpose of the endpoint
//   @ApiBody({
//     description: 'The data needed to create a transaction',
//     type: CreateTransactionDto,
//     examples: {
//       example1: {
//         summary: 'Example transaction creation',
//         value: {
//           walletId: '123e4567-e89b-12d3-a456-426614174000',
//           toWalletId: '456e7890-e12b-34d5-a678-426614174111',
//           amount: 50.0,
//           type: 'TRANSFER',
//           transactionId: 'unique-transaction-id',
//         },
//       },
//     },
//   })
//   @ApiResponse({ status: 201, description: 'Transaction successfully created.', type: Transaction })
//   @ApiResponse({ status: 400, description: 'Invalid input data.' })
//   async create(@Body() createTransactionDto: CreateTransactionDto): Promise<Transaction> {
//     return this.transactionsService.createTransaction(createTransactionDto);
//   }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' }) // Describe the purpose of the endpoint
  @ApiParam({
    name: 'id',
    description: 'The ID of the transaction to retrieve',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 200, description: 'Transaction found.', type: Transaction })
  @ApiResponse({ status: 404, description: 'Transaction not found.' })
  async findOne(@Param('id') id: string): Promise<Transaction> {
    return this.transactionsService.findById(id);
  }

  // Other endpoints for transaction management...
}
