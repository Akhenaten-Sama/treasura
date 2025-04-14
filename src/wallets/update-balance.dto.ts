import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBalanceDto {
  @ApiProperty({ description: 'The amount to update the balance with' })
  @IsNumber()
  @IsNotEmpty()
  amount: number;
}
