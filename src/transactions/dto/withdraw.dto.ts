import { IsUUID, IsNumber, IsString, IsOptional } from 'class-validator';

export class WithdrawDto {
  @IsUUID()
  walletId: string;

  @IsNumber()
  amount: number;

  @IsString()
  idempotencyKey: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
