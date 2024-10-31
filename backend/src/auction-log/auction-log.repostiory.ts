import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { AuctionLog } from "./auction-log.entity";

@Injectable()
export class AuctionLogRepository extends Repository<AuctionLog>{
    constructor(dataSource: DataSource) {
        super(AuctionLog, dataSource.createEntityManager());
    }
    async findById(id: number): Promise<AuctionLog | null> {
        return this.findOne({ where: { id } });
    }

    async findByItemIdAndKey(itemId: number, key: number): Promise<AuctionLog | null> {
        return this.createQueryBuilder('auctionLog')
            .leftJoinAndSelect('auctionLog.item', 'item')
            .where('item.id = :itemId', { itemId })
            .andWhere('auctionLog.key = :key', { key })
            .getOne();
    }
    
    

}