import { IsUUID, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { TransactionType } from '../transaction.entity';

export class CreateTransactionDto {
  @IsUUID()
  walletId: string;

  @IsOptional()
  @IsUUID()
  toWalletId?: string;

  @IsNumber()
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsString()
  transactionId: string; // Used for idempotency
}
