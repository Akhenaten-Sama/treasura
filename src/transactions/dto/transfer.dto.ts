import { IsUUID, IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferDto {
  @ApiProperty({ description: 'ID of the wallet from which the transfer is initiated' })
  @IsUUID()
  fromWalletId: string;

  @ApiProperty({ description: 'ID of the wallet to which the transfer is made' })
  @IsUUID()
  toWalletId: string;

  @ApiProperty({ description: 'Amount to be transferred' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ description: 'Idempotency key for ensuring request uniqueness' })
  @IsString()
  @IsOptional()
  idempotencyKey: string;

  @ApiPropertyOptional({ description: 'Additional metadata for the transfer' })
  @IsOptional()
  metadata?: Record<string, any>;
}
