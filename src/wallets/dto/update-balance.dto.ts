import { IsNumber, IsNotEmpty } from 'class-validator';

export class UpdateBalanceDto {
  @IsNumber()
  @IsNotEmpty()
  amount: number;
}
