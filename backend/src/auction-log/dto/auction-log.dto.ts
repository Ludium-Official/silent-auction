
export class AuctionLogDto {
    
    itemId: number;

    key: number;

    bidAmount: number;
    
    bidUser: string;

    transactionHash: string;
}


export class AuctionLogverifyDto{
    itemId: number; 

    key: number;
}