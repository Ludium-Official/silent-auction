// src/auction-winner/auction-winner.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuctionLog } from '../auction-log/auction-log.entity';
import { AuctionWinner } from './auction-winner.entity';
import { Item } from '../item/item.entity';
import { ItemRepository } from '../item/item.repository';
import { AuctionWinnerRepository } from './auction-winner.repostiory';
import { AuctionLogRepository } from '../auction-log/auction-log.repostiory';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AuctionWinnerService {
  private readonly logger = new Logger(AuctionWinnerService.name);

  constructor(
    private readonly itemRepository: ItemRepository,
    private readonly auctionWinnerRepository: AuctionWinnerRepository,
    private readonly auctionLogRepository: AuctionLogRepository,

  ) {}

  async calculateAndStoreWinners() {
    try {
      const endedAuctions = await this.getEndedAuctionsWithoutWinners();

      for (const auction of endedAuctions) {
        const highestBid = await this.getHighestBid(auction.id);

        if (highestBid !== null) {
          await this.storeWinner(auction, highestBid);
        } else {
          this.logger.log(`Auction ${auction.id} ended with no bids`);
          // You might want to handle this case, e.g., mark the auction as ended without a winner
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Error calculating winners: ${error.message}`, error.stack);
      } else {
        this.logger.error('An unknown error occurred while calculating winners');
      }
    }
  }

  private async getEndedAuctionsWithoutWinners(): Promise<Item[]> {
    return this.itemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.auctionWinner', 'auctionWinner')
      .where('item.endTime < :now', { now: new Date() })
      .andWhere('auctionWinner.id IS NULL')
      .getMany();
  }
  
  private async getHighestBid(itemId: number): Promise<AuctionLog | null> {
    return this.auctionLogRepository.createQueryBuilder('log')
      .where('log.item_id = :itemId', { itemId })
      .orderBy('log.bidAmount', 'DESC')
      .addOrderBy('log.bidTime', 'ASC')  // In case of tie, earliest bid wins
      .getOne();
  }


  private async storeWinner(auction: Item, highestBid: AuctionLog) {
    const winner = new AuctionWinner();
    winner.auctionItem = auction;
    winner.winningKey = highestBid.key;
    winner.winningBid = highestBid.bidAmount;
    winner.winnerAddress = highestBid.bidUser;
    winner.winTime = new Date();

    await this.auctionWinnerRepository.save(winner);
    this.logger.log(`Stored winner for auction ${auction.id}`);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCron() {
    this.logger.log('Running auction winner calculation');
    await this.calculateAndStoreWinners();
  }

  
}
