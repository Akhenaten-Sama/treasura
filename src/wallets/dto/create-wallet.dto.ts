import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWalletDto {
  @ApiProperty({ description: 'The email of the wallet owner' })
  @IsString()
  @IsNotEmpty()
  email: string;
}
