import { Entity, Index,PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Wallet } from '../wallets/wallets.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER = 'TRANSFER',
}

@Entity('transactions')
@Index(['fromWallet', 'toWallet', 'transactionId'])
export class Transaction {
  @ApiProperty({ description: 'Unique identifier for the transaction', example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Wallet from which the transaction originates', type: () => Wallet, nullable: true })
  @ManyToOne(() => Wallet, { nullable: true })
  @JoinColumn({ name: 'from_wallet_id' })
  fromWallet: Wallet | null;

  @ApiProperty({ description: 'Wallet to which the transaction is sent', type: () => Wallet, nullable: true })
  @ManyToOne(() => Wallet, { nullable: true })
  @JoinColumn({ name: 'to_wallet_id' })
  toWallet: Wallet | null;

  @ApiProperty({ description: 'Amount involved in the transaction', example: 100.50 })
  @Column('decimal')
  amount: number;

  @ApiProperty({ description: 'Status of the transaction', enum: TransactionStatus, example: TransactionStatus.PENDING })
  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @ApiProperty({ description: 'Type of the transaction', enum: TransactionType, example: TransactionType.TRANSFER })
  @Column({ type: 'enum', enum: TransactionType, default: TransactionType.TRANSFER })
  type: TransactionType;

  @ApiProperty({ description: 'Timestamp when the transaction was created', example: '2023-01-01T00:00:00.000Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Unique transaction ID', example: 'TXN1234567890' })
  @Column({ unique: true })
  transactionId: string;
}
