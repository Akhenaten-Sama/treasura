import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Wallet } from '../wallets/wallets.entity';

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
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Wallet, { nullable: true }) // Allow null for optional fields
  @JoinColumn({ name: 'from_wallet_id' })
  fromWallet: Wallet;

  @ManyToOne(() => Wallet, { nullable: true }) // Allow null for optional fields
  @JoinColumn({ name: 'to_wallet_id' })
  toWallet: Wallet;

  @Column('decimal')
  amount: number;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Column({ type: 'enum', enum: TransactionType, default: TransactionType.TRANSFER })
  type: TransactionType;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ unique: true })
  transactionId: string; // Unique identifier for the transaction
}
