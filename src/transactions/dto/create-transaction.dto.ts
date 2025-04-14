import { IsUUID, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionStatus, TransactionType } from '../transaction.entity';

export class CreateTransactionDto {
  @ApiPropertyOptional({ description: 'ID of the wallet from which the transaction originates', type: String, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  fromWalletId?: string;

  @ApiPropertyOptional({ description: 'ID of the wallet to which the transaction is sent', type: String, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  toWalletId?: string;

  @ApiProperty({ description: 'Amount of the transaction', type: Number })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Status of the transaction', enum: TransactionStatus })
  @IsEnum(TransactionStatus)
  status: TransactionStatus; // PENDING, SUCCESS, FAILED

  @ApiProperty({ description: 'Type of the transaction', enum: TransactionType })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ description: 'Unique transaction ID for idempotency', type: String })
  @IsString()
  transactionId: string; // Used for idempotency
}
