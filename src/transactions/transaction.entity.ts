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

  @ManyToOne(() => Wallet)
  @JoinColumn({ name: 'from_wallet_id' })
  fromWallet: Wallet;

  @ManyToOne(() => Wallet)
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
  // You can also include timestamps here if needed
}
