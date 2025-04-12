import { IsNumber, Min } from 'class-validator';

export class TransferDto {
  @IsNumber()
  @Min(0.01)
  amount: number;
}