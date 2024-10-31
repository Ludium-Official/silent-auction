import { Controller, Get, Post, HttpException, HttpStatus, Body, ValidationPipe, Param } from '@nestjs/common';
import { AuctionLogRepository } from './auction-log.repostiory';
import { ItemRepository } from '../item/item.repository';
import { AuctionLogDto, AuctionLogverifyDto } from './dto/auction-log.dto';
import { AuctionLog } from './auction-log.entity';
import { AuctionLogService } from './auction-log.service';

@Controller('auction-log')
export class AuctionLogController {

constructor(
    private readonly auctionLogRepository: AuctionLogRepository,
    private readonly auctionLogService: AuctionLogService,
    private readonly itemRepository: ItemRepository
    ) {}
    

  @Get()
  getHello(): string {
    return "Hello from  AuctionLogController!";
  }


  @Post('add')
  async addAuctionLog(@Body() auctionLogDto: AuctionLogDto): Promise<string> {

    console.log("addAuctionLog")
    try {
      const item = await this.itemRepository.findById(auctionLogDto.itemId);
      
      if (!item) {
        throw new Error(`Item with id ${auctionLogDto.itemId} not found`);
      }

      const auctionLog = new AuctionLog();
      auctionLog.item = item;
      auctionLog.key = auctionLogDto.key;
      auctionLog.bidUser = auctionLogDto.bidUser;
      auctionLog.bidAmount = auctionLogDto.bidAmount;
      auctionLog.transactionHash = auctionLogDto.transactionHash;

      await this.auctionLogRepository.save(auctionLog);

      return `Auction log saved for item ${auctionLogDto.itemId} with bid amount ${auctionLogDto.bidAmount}`;
    } catch (error) {
      console.error('Error saving auction log:', error);
      throw new Error('Failed to save auction log');
    }
  }

    @Post('merklemap')
    async getMerkleMap(@Body('itemId') itemId: number) {
        const merkleMap = await this.auctionLogService.getMerkleMapForItem(itemId);
        const serializedMap = await this.auctionLogService.serializeMerkleMap(merkleMap);
      
        console.log(serializedMap.length)

        return serializedMap;
    }

    @Post('verify')
    async verifyBid(@Body() AuctionLogverifyDto: AuctionLogverifyDto) {
      console.log('auction-log / verify ')
      return this.auctionLogService.verifyBid(AuctionLogverifyDto);
    }

  

}

  
