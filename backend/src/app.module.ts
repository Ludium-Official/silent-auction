import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ItemsModule } from './item/item.module';

import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemsController } from './item/item.controller';
import { ItemService } from './item/item.service';
import { AuctionLogsModule } from './auction-log/auction-log.module';
import { AuctionLog } from './auction-log/auction-log.entity';
import { Item } from './item/item.entity';
import { MerkleMapModule } from './merkle-map/merkle-map.module';
import { AuctionWinnerModule } from './auction-winner/auction-winner.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AuctionWinner } from './auction-winner/auction-winner.entity';

// B62qo23u5UYxJTw4Tni1pLLEHzTQEhh5fNSghHtkQowzNmQHrkJPSBk
@Module({
  imports: [TypeOrmModule.forRoot({
    type: 'mysql',
    host: 'silent-auction.creye0kuc4ct.ap-northeast-2.rds.amazonaws.com',
    port: 3306,
    username: 'root',
    password: 'rootroot',
    database: 'silentauction',
    entities: [Item, AuctionLog, AuctionWinner],
    synchronize: true,
  }), ScheduleModule.forRoot(), ItemsModule, AuctionLogsModule, MerkleMapModule, AuctionWinnerModule, ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
