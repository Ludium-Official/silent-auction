import { Controller, Get, Post, HttpException, HttpStatus, Body, ValidationPipe, Param } from '@nestjs/common';
import { ItemService } from './item.service';
import { MerkleMap } from 'o1js';
import { CreateItemDto } from './dto/create-item.dto';


@Controller('items')
export class ItemsController {
  constructor(private readonly itemService: ItemService) {}

  @Get()
  getHello(): string {
    return "Hello from ItemsController!";
  }

  @Get('/deploy')
  async deployContract(): Promise<{ message: string; transactionHash?: string }> {
    try {
      const result = await this.itemService.DeployMinaContract();
      if (result.success) {
        return { 
          message: 'Item contract deployed successfully', 
          transactionHash: result.hash 
        };
      } else {
        throw new HttpException(result.error || 'Deployment failed', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (error) {
      throw new HttpException('Failed to deploy Item contract', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('/map')
  getMerkleMap(): string {
    const mmap = new MerkleMap();
    
    console.log(mmap.getRoot().toString())
    return "Hello from map";
  }

  @Post('/create')
  async createItem(@Body() createItemDto: CreateItemDto) {
    try {
      console.log("Starting item creation process...");
      
      // Step 1: Deploy Mina Contract
      const result = await this.itemService.DeployMinaContract();
      if (!result.success) {
        throw new Error(`Contract deployment failed: ${result.error}`);
      }

      const txhash = result.hash;
      const zkappAddress = result.zkappAddress; 
      console.log("transaction Hash :" +txhash)

      // Step 2: Add Item to Database
      const newItem = await this.itemService.AddItem(createItemDto, txhash, zkappAddress );
      
      return {
        success: true,
        message: "Item created successfully",
        data: newItem,
        transactionHash: txhash,
        zkappAddress: result.zkappAddress
      };

    } catch (error) {
      console.error("Error in createItem:", error);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  

  @Get('/running')
  async getRunningAuctions() {
    try {
      const runningAuctions = await this.itemService.getRunningAuctions();
      return runningAuctions;
    } catch (error) {
      throw new HttpException('Failed to fetch running auctions', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('/finished')
  async getFinishedAuctions() {
  try {
    const finishedAuctions = await this.itemService.getFinishedAuctions();
    return finishedAuctions;
  } catch (error) {
    throw new HttpException('Failed to fetch finished auctions', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

  @Get('/:id')
  async getAuctionDetails(@Param('id') id: number) {
    try {
      const auctionDetails = await this.itemService.getAuctionDetails(id);
      if (!auctionDetails) {
        throw new HttpException('Auction not found', HttpStatus.NOT_FOUND);
      }
      return auctionDetails;
    } catch (error) {
      throw new HttpException('Failed to fetch auction details', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


}
  
