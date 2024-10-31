import { serializeTransaction } from "./transaction";
import { sendTransferTransaction } from "./send";
import { getNonce } from "./nonce";
import { chainId } from "./blockchain/explorer";
import { NFTContractV2 } from "minanft";
import { Encoding } from "o1js";

const changeNonce = true;

const DEBUG = "true" === process.env.NEXT_PUBLIC_APP_DEBUG;


export async function transferNFT(params) {
  console.log("Starting transferNFT with params:", params);
  console.time("transferNFT");

  try {
    const { newOwner, owner, showText, showPending, libraries } = params;
    const chain = "devnet";
    console.log("Chain:", chain);

    if (owner === undefined) {
      console.error("Owner address is undefined");
      return {
        success: false,
        error: "Owner address is undefined",
      };
    }

    if (newOwner === undefined || newOwner === "") {
      console.error("New owner address is undefined");
      return {
        success: false,
        error: "New owner address is undefined",
      };
    }

    if (libraries === undefined) {
      console.error("o1js library is missing");
      return {
        success: false,
        error: "o1js library is missing",
      };
    }

    console.log("Loading o1js library...");
    const o1jsInfo = (
      <span>
        Loading{" "}
        <a href={"https://docs.minaprotocol.com/zkapps/o1js"} target="_blank">
          o1js
        </a>{" "}
        library...
      </span>
    );
    await showPending(o1jsInfo);
    const lib = await libraries;
    console.log("o1js library loaded");

    const { PublicKey, Mina } = lib.o1js;
    const {
      MinaNFT,
      NameContractV2,
      TransferParams,
      initBlockchain,
      MINANFT_NAME_SERVICE_V2,
      fetchMinaAccount,
      serializeFields,
      accountBalanceMina,
    } = lib.minanft;

    console.log("Initializing blockchain...");
    const contractAddress = MINANFT_NAME_SERVICE_V2;
    console.log("Contract address:", contractAddress);

    try {
      console.log("Validating new owner address:", newOwner);
      const newOwnerAddress = PublicKey.fromBase58(newOwner);
    } catch (error) {
      console.error("Invalid new owner address:", error);
      await showText("Invalid new owner address", "red");
      await showPending(undefined);
      return {
        success: false,
        error: "Invalid new owner address",
      };
    }

    try {
      console.log("Validating NFT address:", params.address);
      const nftAddress = PublicKey.fromBase58(params.address);
    } catch (error) {
      console.error("Invalid NFT address:", error);
      await showText("Invalid NFT address", "red");
      await showPending(undefined);
      return {
        success: false,
        error: "Invalid NFT address",
      };
    }

    console.time("Account setup");
    const address = PublicKey.fromBase58(params.address);
    const newOwnerAddress = PublicKey.fromBase58(newOwner);
    const net = await initBlockchain(chain);
    const sender = PublicKey.fromBase58(owner);
    console.log("Sender address:", sender.toBase58());

    const zkAppAddress = PublicKey.fromBase58(MINANFT_NAME_SERVICE_V2);
    const zkApp = new NameContractV2(zkAppAddress);
    const tokenId = zkApp.deriveTokenId();
    const nftApp = new NFTContractV2(address, tokenId);
    
    const BASE_FEE = 150_000_000; // 0.15 MINA
    const fee = BASE_FEE;

    console.timeEnd("Account setup");

    console.log("Fetching account data...");
    await fetchMinaAccount({ publicKey: sender });
    await fetchMinaAccount({ publicKey: newOwnerAddress });
    await fetchMinaAccount({ publicKey: zkAppAddress });
    await fetchMinaAccount({ publicKey: address, tokenId });
    
    // Account validation checks
    if (!Mina.hasAccount(sender)) {
      console.error("Sender account not found:", sender.toBase58());
      await showText(
        `Account ${sender.toBase58()} not found. Please fund your account or try again later, after all the previous transactions are included in the block.`,
        "red"
      );
      await showPending(undefined);
      return {
        success: false,
        error: "Account not found",
      };
    }


    console.log("Getting NFT owner and name...");
    const nftOwner = nftApp.owner.get();
    const name = Encoding.stringFromFields([nftApp.name.get()]);
    const memo = ("transfer NFT @" + name).substring(0, 30);
    console.log("NFT name:", name);
    console.log("Transaction memo:", memo);

    console.log("Checking nonce and balance...");
    const blockberryNoncePromise = changeNonce
      ? getNonce(sender.toBase58())
      : undefined;
    const requiredBalance = 1 + fee / 1_000_000_000;
    const balance = await accountBalanceMina(sender);
    console.log("Account balance:", balance, "MINA");
    console.log("Required balance:", requiredBalance, "MINA");

    console.time("Transaction preparation");
    const transferParams = new TransferParams({
      address,
      newOwner: newOwnerAddress,
    });

    const senderNonce = Number(Mina.getAccount(sender).nonce.toBigint());
    const blockberryNonce = changeNonce ? await blockberryNoncePromise : -1;
    const nonce = Math.max(senderNonce, blockberryNonce + 1);

    console.log("Transaction nonce:", nonce);

    await ensureWalletConnection();

    console.log("Creating transaction...");
    const tx = await Mina.transaction(
      { sender, fee, memo, nonce },
      async () => {
        await zkApp.transferNFT(transferParams);
      }
    );
    console.timeEnd("Transaction preparation");

    await NameContractV2.compile()
    await NFTContractV2.compile()
    // Add local proving here
    console.log("Starting local proof generation...");
    console.time("proof");
    await showText("Generating proof locally... This may take a few minutes", "blue");
    
    const proof = await tx.prove();
    console.timeEnd("proof");
    console.log("Proof generated successfully");

    const serializedTransaction = tx.toJSON();
    const payload = {
      transaction: serializedTransaction,
      feePayer: {
        fee: fee,
        memo: memo,
      },
    };

    console.log("Requesting user signature...");
    const txResult = await window.mina?.sendTransaction(payload);
    console.log("Transaction signature result:", txResult);

    if (!txResult?.hash) {
      console.error("No transaction hash received");
      await showText("No transaction hash received", "red");
      await showPending(undefined);
      return {
        success: false,
        error: "No transaction hash",
      };
    }

    console.timeEnd("transferNFT");
    return {
      success: true,
      transactionHash: txResult.hash,
    };

  } catch (error) {
    console.error("Transfer NFT error:", error);
    return {
      success: false,
      error: error?.message ?? "Error while transferring NFT",
    };
  }
}


async function ensureWalletConnection() {
  if (!window.mina) {
    throw new Error("Auro wallet not installed");
  }

  try {
    const accounts = await window.mina.getAccounts();
    if (!accounts || accounts.length === 0) {
      // Try to connect if no accounts are found
      await window.mina.requestAccounts();
      const newAccounts = await window.mina.getAccounts();
      console.log(newAccounts)
      if (!newAccounts || newAccounts.length === 0) {
        throw new Error("No accounts available after connection");
      }
    }
    return true;
  } catch (error) {
    console.error("Wallet connection error:", error);
    throw new Error("Failed to connect to wallet");
  }
}