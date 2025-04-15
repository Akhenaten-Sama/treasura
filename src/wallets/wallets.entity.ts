import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from '../users/users.entity';
import { Transaction } from '../transactions/transaction.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.wallets, { onDelete: 'CASCADE' })
  @Index() // Add index to the user field
  user: User;

  @Column('decimal', { precision: 18, scale: 2, default: 0 })
  @Index() // Add index to the balance field if it's queried often
  balance: number;

  @OneToMany(() => Transaction, (tx) => tx.fromWallet)
  outgoingTransactions: Transaction[];

  @OneToMany(() => Transaction, (tx) => tx.toWallet)
  incomingTransactions: Transaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
