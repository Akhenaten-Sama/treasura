import { IsUUID, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { TransactionStatus, TransactionType } from '../transaction.entity';

export class CreateTransactionDto {
  @IsOptional()
  @IsUUID()
  fromWalletId?: string;

  @IsOptional()
  @IsUUID()
  toWalletId?: string;

  @IsNumber()
  amount: number;

  @IsEnum(TransactionStatus)
  status: TransactionStatus; // PENDING, SUCCESS, FAILED

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsString()
  transactionId: string; // Used for idempotency
}
