import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
  } from 'typeorm';
  import { User } from '../users/users.entity';
  import { Transaction } from '../transactions/transaction.entity';
  
  @Entity('wallets')
  export class Wallet {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @ManyToOne(() => User, (user) => user.wallets, { onDelete: 'CASCADE' })
    user: User;
  
    @Column('decimal', { precision: 18, scale: 2, default: 0 })
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
  
