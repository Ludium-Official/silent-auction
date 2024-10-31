import { Injectable } from "@nestjs/common";
import fs from 'fs/promises';
import { AccountUpdate, MerkleMap, Mina, PrivateKey, PublicKey } from 'o1js';
import { BiddingContract, BiddingProgram } from "../contracts/Bidding.js";
import { ItemRepository } from "./item.repository.js";
import { CreateItemDto } from "./dto/create-item.dto.js";
import { LessThan, MoreThan } from "typeorm";
import { Item } from "./item.entity.js";

@Injectable()
export class ItemService {

  constructor(private readonly itemRepository: ItemRepository) {}

  async DeployMinaContract(): Promise<{ success: boolean; hash?: string; zkappAddress? :PublicKey ;error?: string }> {
    try {
        const Network = Mina.Network({
            mina: "https://api.minascan.io/node/devnet/v1/graphql",
            archive: 'https://api.minascan.io/archive/devnet/v1/graphql',
        });
        Mina.setActiveInstance(Network);
        console.log("Network setup complete");

        const feepayerKey = PrivateKey.fromBase58('EKEvxehxoKztsx3wZeKuEjWgcsarwobkHb7NYSEZ8eq2xVy94k7h');
        const feepayerAddress = feepayerKey.toPublicKey();
        console.log(feepayerAddress)
        console.log("Feepayer setup complete");

        const zkAppPrivateKey = PrivateKey.random();
        const zkAppAddress = zkAppPrivateKey.toPublicKey();
        console.log("ZkApp keys generated");

        const zkApp = new BiddingContract(zkAppAddress);

        console.time('compile');
        await BiddingProgram.compile();
        await BiddingContract.compile();
        console.timeEnd('compile');

        console.time('deploy');
        let tx = await Mina.transaction(
            { sender: feepayerAddress, fee: 0.1 * 1e9 },
            async () => {
                AccountUpdate.fundNewAccount(feepayerAddress, 1);
                await zkApp.deploy();
            }
        );

        await tx.prove();
        const txResult = await tx.sign([feepayerKey, zkAppPrivateKey]).send();
        console.timeEnd('deploy');

        if (txResult.hash) {
            console.log("Deployment successful. Hash:", txResult.hash);
            return { success: true, hash: txResult.hash , zkappAddress : zkAppAddress };
        } else {
            return { success: false, error: "Transaction failed - no hash returned" };
        }

    } catch (error) {
        console.error("Deployment error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "An unknown error occurred"
        };
    }
}
  async AddItem(createItemDto: CreateItemDto, txhash:string| undefined, zkappAddress: PublicKey|undefined ) {
    try {
      const map = new MerkleMap();
      console.log("adding item..");
  
      const newItem = await this.itemRepository.save({
        name: createItemDto.name,
        description: createItemDto.description,
        minimumPrice: createItemDto.minimumPrice,
        endTime: createItemDto.endTime,
        type: createItemDto.type,
        deploymentHash: txhash,
        zkappAddress: zkappAddress?.toBase58(),
        merkleMap: "none",
        merkleMapRoot: map.getRoot().toString(),
      });
  
      console.log("Item added successfully:", newItem);
      return newItem;
  
    } catch (error: unknown) {
      console.error("Error adding item:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to add item: ${error.message}`);
      } else {
        throw new Error('Failed to add item: An unknown error occurred');
      }
    }
  }
  async getAuctionDetails(id: number): Promise<Item | null> {
    try {
        return await this.itemRepository.findById(id);
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to fetch auction details: ${error.message}`);
        } else {
            throw new Error('Failed to fetch auction details: Unknown error');
        }
    }
  }

  async getRunningAuctions() {
    const currentTime = new Date();
    return this.itemRepository.find({
      where: {
        endTime: MoreThan(currentTime)
      },
      order: {
        endTime: 'ASC'
      }
    });
  }
  async getFinishedAuctions() {
    const currentDate = new Date();
    return await this.itemRepository.find({
      where: {
        endTime: LessThan(currentDate)
      },
      relations: ['auctionWinner'], // Include the winner relation
      order: {
        endTime: 'DESC'
      }
    });
  }
  

  
  

  // Add other methods to interact with the Item contract as needed
}
