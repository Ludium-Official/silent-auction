import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import bidStyles from '../../styles/Bid.module.css';
import ZkappWorkerClient from '../../utils/zkappWorkerClient';
import { Field, PublicKey } from 'o1js';
import Header from '@/components/Header';


const ZKAPP_ADDRESS = 'B62qjYDFfZWN7xXH7EP3jUX4JMqFQ3ntynFLwUKUTCKE6hXxC2xSDfR';

interface Auction {
  id: number;
  minimumPrice: number;
  title: string;
  endTime: string;
}

interface BidInfo {
  key: number | null;
  amount: number | null;
  transactionHash: string | null;
  merkleMapRoot: string | null;
  timestamp: string | null;
}

interface AppState {
  zkappWorkerClient: ZkappWorkerClient | null;
  hasWallet: boolean | null;
  hasBeenSetup: boolean;
  accountExists: boolean;
  currentNum: Field | null;
  publicKey: PublicKey | null;
  zkappPublicKey: PublicKey | null;
  creatingTransaction: boolean;
}


export default function Bid() {
  const router = useRouter();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const [auction, setAuction] = useState<Auction | null>(null);
  const [bidAmount, setBidAmount] = useState<number | null>(null);
  const [bidKey, setBidKey] = useState<number | null>(null);
  const [displayText, setDisplayText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidInfo, setBidInfo] = useState<BidInfo | null>(null);

  const [state, setState] = useState<AppState>({
    zkappWorkerClient: null,
    hasWallet: null,
    hasBeenSetup: false,
    accountExists: false,
    currentNum: null,
    publicKey: null,
    zkappPublicKey: null,
    creatingTransaction: false,
  });

  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!router.isReady) return;
      
      const { id } = router.query;
      if (!id || Array.isArray(id)) return;

      try {
        if (mounted) {
          await fetchAuctionDetails(id);
          const zkappWorkerClient = new ZkappWorkerClient();
          setState(prev => ({
            ...prev,
            zkappWorkerClient
          }));
        }
      } catch (err) {
        console.error('Failed to initialize:', err);
        if (mounted) {
          setError('Failed to initialize blockchain connection');
        }
      }
    }
    
    init();

    return () => {
      mounted = false;
    };
  }, [router.isReady, router.query]);

  const fetchAuctionDetails = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/items/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch auction details');
      }
      const data = await response.json();
      setAuction(data);
    } catch (err) {
      setError('Error fetching auction details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleBid = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.zkappWorkerClient) {
      setDisplayText('ZkApp client not initialized. Please try again.');
      return;
    }

    if (!router.query.id || Array.isArray(router.query.id)) {
      setDisplayText('Invalid auction ID');
      return;
    }

    try {
      if (!state.hasBeenSetup) {
        setDisplayText('Setting up ZkApp...');
        await setupZkApp();
      }

      setDisplayText('Fetching MerkleMap...');
      const fetchedMerkleMap = await fetchMerkleMapString(Number(router.query.id));
      
      const currentMerkleMapRoot = await state.zkappWorkerClient.getMerkleMapRoot();

      setDisplayText('Creating transaction...');
      setState(prev => ({ ...prev, creatingTransaction: true }));

      const mina = (window as any).mina;
      if (!mina) {
        setState(prev => ({ ...prev, hasWallet: false }));
        return;
      }

      const publicKeyBase58 = await mina.requestAccounts();
      const publicKey = PublicKey.fromBase58(publicKeyBase58[0]);

      const transactionJSON = await state.zkappWorkerClient.createUpdateRootTransaction(
        bidKey!,
        bidAmount!,
        fetchedMerkleMap
      );

      const { hash } = await mina.sendTransaction({
        transaction: transactionJSON,
        feePayer: {
          fee: 0.1,
          memo: '',
        },
      });

      // Update bid info and save to backend
      await saveBidInfo(publicKey, hash);

      setDisplayText('Bid placed successfully!');
    } catch (error) {
      console.error(error);
      setDisplayText('Error creating transaction');
    } finally {
      setState(prev => ({ ...prev, creatingTransaction: false }));
    }
  }, [state, bidAmount, bidKey, router.query.id]);

  const saveBidInfo = async (publicKey: PublicKey, hash: string) => {
    if (!router.query.id) return;

    const response = await fetch(`${backendUrl}/auction-log/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        itemId: router.query.id,
        key: bidKey,
        bidUser: publicKey.toBase58(),
        bidAmount: bidAmount,
        transactionHash: hash,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save auction log');
    }

    setBidInfo({
      key: bidKey,
      amount: bidAmount,
      transactionHash: hash,
      merkleMapRoot: (await state.zkappWorkerClient?.getMerkleMapRoot())?.toString() || null,
      timestamp: new Date().toISOString()
    });
  };
  
  async function fetchMerkleMapString(itemId: number ) {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  
    console.log(itemId)
    try {
      const response = await fetch(`${backendUrl}/auction-log/merklemap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId: itemId }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch MerkleMap');
      }
  
      const data = await response.text();
  
      // const merkleMap = deserializeMerkleMap(data.tree, data.root)
      // console.log('MerkleMap fetched and set successfully' + merkleMap.getRoot());
      return data;
    } catch (error) {
      console.error('Failed to fetch MerkleMap:', error);
      throw error;
    }
  }
  
  const setupZkApp = async () => {
    if (!state.zkappWorkerClient) {
      setDisplayText('ZkApp client not initialized. Please try again.');
      return;
    }

    await state.zkappWorkerClient.setActiveInstanceToDevnet();

    const mina = (window as any).mina;
    if (mina == null) {
      setState({ ...state, hasWallet: false });
      return;
    }
    const publicKeyBase58 = await mina.requestAccounts();
    const publicKey = PublicKey.fromBase58(publicKeyBase58[0]);

    const res = await state.zkappWorkerClient.fetchAccount({ publicKey: publicKey });
    const accountExists = res.error == null;
    await state.zkappWorkerClient.loadContract();
    await state.zkappWorkerClient.compileContract();

    const zkappPublicKey = PublicKey.fromBase58(ZKAPP_ADDRESS);
    await state.zkappWorkerClient.initZkappInstance(zkappPublicKey);
    await state.zkappWorkerClient.fetchAccount({ publicKey: zkappPublicKey });
    const currentNum = await state.zkappWorkerClient.getMerkleMapRoot();
    await setState({
      ...state,
      hasWallet: true,
      hasBeenSetup: true,
      publicKey : publicKey,
      zkappPublicKey,
      accountExists,
      currentNum,
    });
  };


  if (!auction) return <div>Loading...</div>;

  return (
    <div className={bidStyles.container}>
      <header className={bidStyles.header}>
        <Header />
      </header>

      <main className={bidStyles.main}>
        <h1 className={bidStyles.title}>Create Bid</h1>


        {loading ? (
          <div className={`${bidStyles.statusMessage} ${bidStyles.loading}`}>
            Loading auction details...
          </div>
        ) : error ? (
          <div className={`${bidStyles.statusMessage} ${bidStyles.error}`}>
            {error}
          </div>
        ) : (
          <>
            <h2 className={bidStyles.title}>{auction?.title}</h2>
            <div className={bidStyles.auctionDetails}>
              <p>
                <span>Minimum Price:</span>
                <span>{auction?.minimumPrice} MINA</span>
              </p>
              <p>
                <span>Ends at:</span>
                <span>{new Date(auction?.endTime || '').toLocaleString()}</span>
              </p>
            </div>

            <form onSubmit={handleBid} className={bidStyles.bidForm}>
              <input
                type="number"
                value={bidKey === null ? '' : bidKey}
                onChange={(e) => {
                  const value = e.target.value;
                  setBidKey(value === '' ? null : Number(value));
                }}
                placeholder="Enter your bid key"
                required
              />

              <input
                type="number"
                value={bidAmount === null ? '' : bidAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  setBidAmount(value === '' ? null : Number(value));
                }}
                placeholder="Enter bid amount"
                required
              />

              <button 
                type="submit" 
                disabled={state.creatingTransaction}
              >
                {state.creatingTransaction ? 'Processing...' : 'Place Bid'}
              </button>
            </form>
            
            {bidInfo && (
              <div className={bidStyles.bidInfoContainer}>
                <h3 className={bidStyles.bidInfoTitle}>Bid Information</h3>
                <div className={bidStyles.bidInfoContent}>
                  <div className={bidStyles.bidInfoItem}>
                    <span>Bid Key:</span>
                    <span>{bidInfo.key}</span>
                  </div>
                  <div className={bidStyles.bidInfoItem}>
                    <span>Bid Amount:</span>
                    <span>{bidInfo.amount} MINA</span>
                  </div>
                  <div className={bidStyles.bidInfoItem}>
                    <span>Transaction:</span>
                    <a 
                      href={`https://minascan.io/devnet/tx/${bidInfo.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={bidStyles.transactionLink}
                    >
                      View Transaction
                    </a>
                  </div>
                  <div className={bidStyles.bidInfoItem}>
                    <span>Merkle Map Root:</span>
                    <span className={bidStyles.merkleRoot}>{bidInfo.merkleMapRoot}</span>
                  </div>
                  <div className={bidStyles.bidInfoItem}>
                    <span>Timestamp:</span>
                    <span>{new Date(bidInfo.timestamp!).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {displayText && (
              <div className={`${bidStyles.statusMessage} ${
                displayText.includes('successfully') ? bidStyles.success : 
                displayText.includes('Error') ? bidStyles.error : 
                bidStyles.loading
              }`}>
                {displayText}
              </div>
            )}
          </>
        )}
      </main>

      <footer className={bidStyles.footer}>
        <p>&copy; 2024 Silent-Auction. All rights reserved.</p>
      </footer>
    </div>
  );  
}