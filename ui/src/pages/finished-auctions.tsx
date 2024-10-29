import React, { useState, useEffect } from 'react';
import styles from '../styles/FinishedAuctions.module.css';
import { useRouter } from 'next/router';
import Header from '@/components/Header';

interface FinishedAuction {
  id: number;
  title: string;
  name: string;
  description: string;
  minimumPrice: number;
  endTime: string;
  winner: string;
}

export default function FinishedAuctions() {
  const [auctions, setAuctions] = useState<FinishedAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/items/finished`);
      if (!response.ok) {
        throw new Error('Failed to fetch auctions');
      }
      const data = await response.json();
      setAuctions(data);
      setLoading(false);
    } catch (err) {
      setError('Error fetching auctions. Please try again later.');
      setLoading(false);
    }
  };

  const handleAuctionClick = (id: number) => {
    router.push(`/auction-info/${id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={styles.container}>
      <Header />

      <main className={styles.main}>
        <h2 className={styles.title}>Finished Auctions</h2>
        
        {loading ? (
          <div className={styles.loading}>
            <svg className={styles.spinner} viewBox="0 0 50 50">
              <circle className={styles.path} cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
            </svg>
            Loading auctions...
          </div>
        ) : error ? (
          <div className={styles.error}>
            <svg className={styles.errorIcon} viewBox="0 0 20 20">
              <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15H9v-2h2v2zm0-4H9V5h2v6z"/>
            </svg>
            {error}
          </div>
        ) : auctions.length > 0 ? (
          <div className={styles.auctionGrid}>
            {auctions.map((auction) => (
              <div 
                key={auction.id} 
                className={styles.auctionBox}
                onClick={() => handleAuctionClick(auction.id)}
              >
                <h3 className={styles.auctionTitle}>{auction.title}</h3>
                
                <div className={styles.auctionInfo}>
                  <strong>Name:</strong> {auction.name}
                </div>
                
                <div className={styles.auctionInfo}>
                  <strong>Description:</strong> 
                  <span>{auction.description}</span>
                </div>
                
                <div className={styles.auctionInfo}>
                  <strong>Minimum Price:</strong> 
                  <span>{auction.minimumPrice} MINA</span>
                </div>
                
                <div className={styles.auctionInfo}>
                  <strong>End Time:</strong> 
                  <span>{formatDate(auction.endTime)}</span>
                </div>
                
                <div className={styles.winnerBadge}>
                  <svg className={styles.trophyIcon} viewBox="0 0 20 20" width="16" height="16">
                    <path fill="currentColor" d="M15 2v2h-1v1h-1v1h-1v1h-1v1H7V7H6V6H5V5H4V4H3V2h12zm-2 7v1h-1v1H8v-1H7V9h6zM8 11v1h4v-1H8z"/>
                  </svg>
                  Winning Bid: {"170 MINA"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noAuctions}>
            No finished auctions available at the moment.
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2023 AuctionHub. All rights reserved.</p>
      </footer>
    </div>
  );
}
