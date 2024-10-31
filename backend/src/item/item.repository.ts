import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { Item } from "./item.entity";

@Injectable()
export class ItemRepository extends Repository<Item>{
    constructor(dataSource: DataSource) {
        super(Item, dataSource.createEntityManager());
    }
    async findById(id: number): Promise<Item | null> {
        return this.findOne({
            where: { id },
            relations: {
                auctionWinner: true  
            }
        });
    }
    

}