import { IsUUID, IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WithdrawDto {
  @ApiProperty({ description: 'The unique identifier of the wallet' })
  @IsUUID()
  walletId: string;

  @ApiProperty({ description: 'The amount to withdraw', example: 100 })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'A unique key to ensure idempotency', example: 'unique-key-123' })
  @IsString()
  idempotencyKey: string;

  @ApiProperty({ description: 'Optional metadata for the transaction', required: false, type: Object })
  @IsOptional()
  metadata?: Record<string, any>;
}
