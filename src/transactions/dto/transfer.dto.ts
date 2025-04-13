import { IsUUID, IsNumber, IsString, IsOptional } from 'class-validator';

export class TransferDto {
  @IsUUID()
  fromWalletId: string;

  @IsUUID()
  toWalletId: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  idempotencyKey: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
