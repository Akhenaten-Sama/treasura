import { Controller, Post, Body, Param, Get, Query, NotFoundException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Transaction } from './transaction.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';

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
  @ApiOperation({ summary: 'Get single transaction by ID' }) // Describe the purpose of the endpoint
  @ApiParam({
    name: 'id',
    description: 'The ID of the transaction to retrieve',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 200, description: 'Transaction found.', type: Transaction })
  @ApiResponse({ status: 404, description: 'Transaction not found.' })
  async findOne(@Param('id') id: string): Promise<Transaction> {
    return this.transactionsService.findById(id.trim());
  }

  @Get('wallet/:walletId')
  @ApiOperation({ summary: 'Get a paginated transactions list for a wallet' })
  @ApiParam({
    name: 'walletId',
    description: 'The ID of the wallet to retrieve transactions for',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'page',
    description: 'The page number to retrieve',
    type: Number,
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'The number of transactions per page',
    type: Number,
    required: false,
    example: 10,
  })
  @ApiResponse({ status: 200, description: 'Paginated list of transactions.' })
  @ApiResponse({ status: 404, description: 'Wallet not found.' })
  async getTransactionsForWallet(
    @Param('walletId') walletId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.transactionsService.getTransactionsForWallet(walletId, page, limit);
  }

  @Get('job/:id')
  @ApiOperation({ summary: 'Query all job id to get the results back' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the job to retrieve',
    type: String,
    example: 'job-id-123',
  })
  @ApiResponse({ status: 200, description: 'Job result retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Job not found.' })
  async getJobStatus(@Param('id') id: string): Promise<{ status: string }> {
    const job = await this.transactionsService.getJobById(id.trim());
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
    return job
  }
  
  @Post('export/:walletId')
  @ApiOperation({ summary: 'Queue export of batched transactions for a wallet in batches. The endoint returns a jobid.  Querying the job id returns a link to download the batched transactions as a csv file' })
  @ApiParam({
    name: 'walletId',
    description: 'The ID of the wallet to export transactions for',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'batchSize',
    description: 'The number of transactions to process per batch',
    type: Number,
    required: false,
    example: 100,
  })
  @ApiResponse({ status: 200, description: 'Export job queued successfully.' })
  @ApiResponse({ status: 404, description: 'Wallet not found.' })
  async queueExportTransactions(
    @Param('walletId') walletId: string,
    @Query('batchSize') batchSize: number = 100,
  ): Promise<{ message: string; jobId: string }> {
    const { jobId } = await this.transactionsService.queueExportTransactions(walletId.trim(), batchSize);
    return { message: `Export job queued for wallet ID: ${walletId}`, jobId };
  }
  
  // Other endpoints for transaction management...
}
