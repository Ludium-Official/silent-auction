import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/CreateAuction.module.css';
import Header from '@/components/Header';
import { Gem, Box, Globe, ArrowRight, Send } from 'lucide-react';

interface AuctionInput {
  title: string;
  currentBid: number;
  endTime: string;
  auctionType: 'NFT' | 'RWA' | 'Others';
}

export default function Create() {
  const router = useRouter();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [duration, setDuration] = useState('');
  const [title, setTitle] = useState('');
  const [currentBid, setCurrentBid] = useState('');
  const [endTime, setEndTime] = useState('');
  const [auctionType, setAuctionType] = useState<'NFT' | 'RWA' | 'Others'>('Others');
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("button")
    
    if (step === 1 && auctionType === 'NFT') {
      setStep(2);
      return;
    }

    setIsLoading(true);
    
    const newAuction: AuctionInput = {
      title,
      currentBid: parseFloat(currentBid),
      endTime,
      auctionType
    };

    try {
      if (!backendUrl) {
        throw new Error('Backend URL is not defined in environment variables');
      }

      const itemData = {
        name: newAuction.title,
        description: "Description of the item",
        minimumPrice: newAuction.currentBid,
        type: newAuction.auctionType,
        endTime: newAuction.endTime,
        auctionType: newAuction.auctionType
      };
  
      const response = await fetch(`${backendUrl}/items/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });
  
      if (response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create auction: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`);
      }
  
      const createdAuction = await response.json();
      console.log('Auction created:', createdAuction);
      
      router.push('/auctions');
    } catch (error) {
      console.error('Error creating auction:', error);
      alert('Auction Created!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNFTSend = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      window.location.href = '/auctions';
    } catch (error) {
      alert('Failed to send NFT. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Header/>

        
      <main className={styles.main}>
        <h2 className={styles.title}>
          {step === 1 ? 'Create New Auction' : 'Send NFT to Auction'}
        </h2>
        
        {step === 1 ? (
          <form onSubmit={handleSubmit} className={styles.formContainer}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className={styles.input}
                placeholder="Enter auction title"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Starting Bid</label>
              <div className={styles.inputWithUnit}>
                <input
                  type="number"
                  value={currentBid}
                  onChange={(e) => setCurrentBid(e.target.value)}
                  required
                  className={styles.input}
                  placeholder="Enter amount"
                  min="0"
                  step="0.1"
                />
                <span className={styles.unitLabel}>MINA</span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Ends After</label>
              <select
                value={duration}
                onChange={(e) => {
                  const selectedValue = e.target.value;
                  setDuration(selectedValue);
                  
                  if (selectedValue) {
                    const now = new Date();
                    const hours = parseInt(selectedValue);
                    const endDate = new Date(now.getTime() + hours * 60 * 60 * 1000);
                    setEndTime(endDate.toISOString());
                  } else {
                    setEndTime('');
                  }
                }}
                className={styles.input}
                required
              >
                <option value="">Select duration</option>
                <option value="24">24 Hours</option>
                <option value="48">2 Days</option>
                <option value="72">3 Days</option>
                <option value="168">7 Days</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Auction Type</label>
              <div className={styles.auctionTypeContainer}>
                <div className={styles.auctionTypeCard}>
                  <input
                    type="radio"
                    id="nft"
                    name="auctionType"
                    value="NFT"
                    checked={auctionType === 'NFT'}
                    onChange={(e) => setAuctionType(e.target.value as 'NFT' | 'RWA' | 'Others')}
                    className={styles.auctionTypeInput}
                  />
                  <label htmlFor="nft" className={styles.auctionTypeLabel}>
                    <Gem className={styles.auctionTypeIcon} />
                    <span className={styles.auctionTypeName}>NFT</span>
                  </label>
                </div>

                <div className={styles.auctionTypeCard}>
                  <input
                    type="radio"
                    id="rwa"
                    name="auctionType"
                    value="RWA"
                    checked={auctionType === 'RWA'}
                    onChange={(e) => setAuctionType(e.target.value as 'NFT' | 'RWA' | 'Others')}
                    className={styles.auctionTypeInput}
                  />
                  <label htmlFor="rwa" className={styles.auctionTypeLabel}>
                    <Box className={styles.auctionTypeIcon} />
                    <span className={styles.auctionTypeName}>RWA</span>
                  </label>
                </div>

                <div className={styles.auctionTypeCard}>
                  <input
                    type="radio"
                    id="others"
                    name="auctionType"
                    value="Others"
                    checked={auctionType === 'Others'}
                    onChange={(e) => setAuctionType(e.target.value as 'NFT' | 'RWA' | 'Others')}
                    className={styles.auctionTypeInput}
                  />
                  <label htmlFor="others" className={styles.auctionTypeLabel}>
                    <Globe className={styles.auctionTypeIcon} />
                    <span className={styles.auctionTypeName}>Others</span>
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className={styles.button}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Auction'}
            </button>
          </form>
        ) : (
          <div className={styles.nftSendContainer}>
            <div className={styles.nftInstructions}>
              <h3>Complete Your NFT Auction Setup</h3>
              <p>To list your NFT for auction, you'll need to send it to our auction smart contract.</p>
              <p>Please make sure:</p>
              <ul>
                <li>You own the NFT you're trying to auction</li>
                <li>The NFT is in your connected wallet</li>
                <li>You have enough funds to cover gas fees</li>
              </ul>
            </div>
            <button
              onClick={async (e) => {
                await handleNFTSend();
                await handleSubmit(e);
              }}
              className={styles.sendButton}
              disabled={isLoading}
            >
              {isLoading ? (
                'Sending...'
              ) : (
                <>
                  Send NFT to Auction <Send className={styles.sendIcon} size={20} />
                </>
              )}
            </button>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2023 AuctionHub. All rights reserved.</p>
      </footer>
    </div>
  );
}
