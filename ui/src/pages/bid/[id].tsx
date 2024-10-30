import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import bidStyles from '../../styles/Bid.module.css';
import ZkappWorkerClient from '../zkappWorkerClient';
import { Field, MerkleMap, MerkleTree, PublicKey } from 'o1js';
import Header from '@/components/Header';


const ZKAPP_ADDRESS = 'B62qjYDFfZWN7xXH7EP3jUX4JMqFQ3ntynFLwUKUTCKE6hXxC2xSDfR';

interface Auction {
  id: number;
  minimumPrice: number;
  title: string;
  endTime: string;
  zkappAddress: string;
}

export default function Bid() {
  const router = useRouter();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const { id } = router.query;
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bidAmount, setBidAmount] = useState<number | null>(null);
  const [bidKey, setBidKey] = useState<number | null>(null);
  const [displayText, setDisplayText] = useState('');
  const [transactionJSON, setTransactionJSON] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zkappAddress, setZkappAddress] = useState<string | null>(null);
  const [state, setState] = useState({
    zkappWorkerClient: null as null | ZkappWorkerClient,
    hasWallet: null as null | boolean,
    hasBeenSetup: false,
    accountExists: false,
    currentNum: null as null | Field,
    publicKey: null as null | PublicKey,
    zkappPublicKey: null as null | PublicKey,
    creatingTransaction: false,
  });
  const zkappWorkerClient = new ZkappWorkerClient();

  useEffect(() => {
    if (id) {
      fetchAuctionDetails();
    }
  }, [id]);

  const fetchAuctionDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/items/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch auction details');
      }
      const data = await response.json();
      setAuction(data);
      setZkappAddress(data.zkappAddress); // Set the zkapp address from the auction data
      setLoading(false);
    } catch (err) {
      setError('Error fetching auction details. Please try again later.');
      setLoading(false);
    }
  };


  const handleBid = useCallback(async (e: React.FormEvent) => {
    // state.hasBeenSetup = true;
    e.preventDefault();
    if (!state.hasBeenSetup) {
      setDisplayText('Setting up ZkApp...');
      await setupZkApp();
    }

    setDisplayText('Fetching MerkleMap...');
    const fetchedMerkleMap = await fetchMerkleMapString(Number(id));
    console.log('Fetched MerkleMapRoot:', fetchedMerkleMap);

    const currentMerkleMapRoot = await zkappWorkerClient.getMerkleMapRoot();
    console.log("current Contract MerkleMapRoot" + currentMerkleMapRoot)

    setDisplayText('Creating transaction...');
    setState({ ...state, creatingTransaction: true });
    console.log(`Placing bid of $${bidAmount} on auction ${id}`);
    
    try {
      console.log("GetCurrent MerkleRoot")

      const mina = (window as any).mina;
       if (mina == null) {
        setState({ ...state, hasWallet: false });
        return;
       }
      const publicKeyBase58 = await mina.requestAccounts();
      const publicKey = PublicKey.fromBase58(publicKeyBase58[0]);


      const transactionJSON1 = await zkappWorkerClient.createUpdateRootTransaction(bidKey, bidAmount, fetchedMerkleMap);

      const { hash } = await (window as any).mina.sendTransaction({
        transaction: transactionJSON1,
        feePayer: {
          fee: 0.1,
          memo: '',
        },
      });
  
      console.log("publickey" + publicKey.toBase58())
      const transactionLink = `https://minascan.io/devnet/tx/${hash}`;
      console.log(`View transaction at ${transactionLink}`);
      setState({ ...state, creatingTransaction: false });

      const response = await fetch(`${backendUrl}/auction-log/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: id,
          key: bidKey,
          bidUser: publicKey.toBase58(),
          bidAmount: bidAmount,
          transactionHash: hash,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to save auction log');
      }
  
      const result = await response.text();
      console.log(result);
      setDisplayText('Bid placed successfully!');
      setState({ ...state, creatingTransaction: false });


    } catch (error) {
      console.error(error);
      setDisplayText('Error creating transaction');
      setState({ ...state, creatingTransaction: false });
      
      
    }

  }, [state, bidAmount, id, ]);


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
    if (!auction) {
      setError('Auction data not available');
      return;
    }
    
    await zkappWorkerClient.setActiveInstanceToDevnet();

    const mina = (window as any).mina;
    if (mina == null) {
      setState({ ...state, hasWallet: false });
      return;
    }
    const publicKeyBase58 = await mina.requestAccounts();
    const publicKey = PublicKey.fromBase58(publicKeyBase58[0]);

    const res = await zkappWorkerClient.fetchAccount({ publicKey: publicKey });
    const accountExists = res.error == null;
    await zkappWorkerClient.loadContract();
    await zkappWorkerClient.compileContract();

    const zkappPublicKey = PublicKey.fromBase58(auction?.zkappAddress);
    await zkappWorkerClient.initZkappInstance(zkappPublicKey);
    await zkappWorkerClient.fetchAccount({ publicKey: zkappPublicKey });
    const currentNum = await zkappWorkerClient.getMerkleMapRoot();
    await setState({
      ...state,
      zkappWorkerClient,
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
        <p>&copy; 2023 AuctionHub. All rights reserved.</p>
      </footer>
    </div>
  );  
}