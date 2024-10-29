import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne } from 'typeorm';
import { AuctionLog } from '../auction-log/auction-log.entity';
import { AuctionWinner } from '../auction-winner/auction-winner.entity';

@Entity('item')
export class Item {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ nullable: true })
  zkappAddress: string;

  @Column('text')
  description: string;

  @Column()
  type: string;

  @Column()
  minimumPrice: number;

  @Column()
  deploymentHash: string;

  @Column()
  endTime: Date;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => AuctionLog, auctionLog => auctionLog.item)
  auctionLogs: AuctionLog[];

  @OneToOne(() => AuctionWinner, auctionWinner => auctionWinner.auctionItem)
  auctionWinner: AuctionWinner;





}
