import axios from "axios";
import { chainId } from "./blockchain/explorer";
const {
  NEXT_PUBLIC_APP_DEBUG,
  REACT_APP_ZKCW_JWT,
  REACT_APP_ZKCW_AUTH,
  REACT_APP_ZKCW_ENDPOINT,
} = process.env;
const DEBUG = NEXT_PUBLIC_APP_DEBUG === "true";

export async function sendMintTransaction(
  params
  /* {
  serializedTransaction: string,
  signedData: string,
  mintParams: string,
  contractAddress: string,
}*/
) /*: Promise<{ isSent: boolean, hash: string }> */ {
  const {
    serializedTransaction,
    signedData,
    contractAddress,
    mintParams,
    chain,
    name,
  } = params;
  if (DEBUG)
    console.log("sendMintTransaction", {
      name,
      serializedTransaction,
      signedData,
      contractAddress,
      mintParams,
      chain,
    });

  let args = JSON.stringify({
    contractAddress,
  });

  const transaction = JSON.stringify(
    {
      serializedTransaction,
      signedData,
      mintParams,
    },
    null,
    2
  );

  let answer = await zkCloudWorkerRequest({
    command: "execute",
    transactions: [transaction],
    task: "mint",
    args,
    metadata: `mint NFT @${name}`,
    mode: "async",
  });

  if (DEBUG) console.log(`zkCloudWorker answer:`, answer);
  const jobId = answer?.jobId;
  if (DEBUG) console.log(`jobId:`, jobId);
  return jobId;
}

export async function sendSellTransaction(
  params
  /* {
  serializedTransaction: string,
  signedData: string,
  mintParams: string,
  contractAddress: string,
}*/
) /*: Promise<{ isSent: boolean, hash: string }> */ {
  const {
    serializedTransaction,
    signedData,
    contractAddress,
    sellParams,
    chain,
    name,
  } = params;
  if (DEBUG)
    console.log("sendSellTransaction", {
      name,
      serializedTransaction,
      signedData,
      contractAddress,
      sellParams,
      chain,
    });

  let args = JSON.stringify({
    contractAddress,
  });

  const transaction = JSON.stringify(
    {
      serializedTransaction,
      signedData,
      sellParams,
      name,
    },
    null,
    2
  );

  let answer = await zkCloudWorkerRequest({
    command: "execute",
    transactions: [transaction],
    task: "sell",
    args,
    metadata: `sell NFT @${name}`,
    mode: "async",
  });

  if (DEBUG) console.log(`zkCloudWorker answer:`, answer);
  const jobId = answer?.jobId;
  if (DEBUG) console.log(`jobId:`, jobId);
  return jobId;
}

export async function sendTransferTransaction(
  params
  /* {
  serializedTransaction: string,
  signedData: string,
  mintParams: string,
  contractAddress: string,
}*/
) /*: Promise<{ isSent: boolean, hash: string }> */ {
  const {
    serializedTransaction,
    signedData,
    contractAddress,
    transferParams,
    chain,
    name,
  } = params;
  if (DEBUG)
    console.log("sendTransferTransaction", {
      name,
      serializedTransaction,
      signedData,
      contractAddress,
      transferParams,
      chain,
    });

  let args = JSON.stringify({
    contractAddress,
  });

  const transaction = JSON.stringify(
    {
      serializedTransaction,
      signedData,
      transferParams,
      name,
    },
    null,
    2
  );

  let answer = await zkCloudWorkerRequest({
    command: "execute",
    transactions: [transaction],
    task: "transfer",
    args,
    metadata: `transfer NFT @${name}`,
    mode: "async",
  });

  if (DEBUG) console.log(`zkCloudWorker answer:`, answer);
  const jobId = answer?.jobId;
  if (DEBUG) console.log(`jobId:`, jobId);
  return jobId;
}

export async function sendUpdateTransaction(
  params
  /* {
  serializedTransaction: string,
  signedData: string,
  mintParams: string,
  contractAddress: string,
}*/
) /*: Promise<{ isSent: boolean, hash: string }> */ {
  const {
    serializedTransaction,
    signedData,
    contractAddress,
    updateParams,
    chain,
    name,
    updateCode,
  } = params;
  if (DEBUG)
    console.log("sendUpdateTransaction", {
      name,
      serializedTransaction,
      signedData,
      contractAddress,
      updateParams,
      chain,
      updateCode,
    });

  let args = JSON.stringify({
    contractAddress,
  });

  const transaction = JSON.stringify(
    {
      serializedTransaction,
      signedData,
      updateParams,
      name,
      updateCode,
    },
    null,
    2
  );

  let answer = await zkCloudWorkerRequest({
    command: "execute",
    transactions: [transaction],
    task: "update",
    args,
    metadata: `update NFT @${name}`,
    mode: "async",
  });

  if (DEBUG) console.log(`zkCloudWorker answer:`, answer);
  const jobId = answer?.jobId;
  if (DEBUG) console.log(`jobId:`, jobId);
  return jobId;
}

export async function sendBuyTransaction(
  params
  /* {
  serializedTransaction: string,
  signedData: string,
  mintParams: string,
  contractAddress: string,
}*/
) /*: Promise<{ isSent: boolean, hash: string }> */ {
  const {
    serializedTransaction,
    signedData,
    contractAddress,
    buyParams,
    chain,
    name,
  } = params;
  if (DEBUG)
    console.log("sendBuyTransaction", {
      name,
      serializedTransaction,
      signedData,
      contractAddress,
      buyParams,
      chain,
    });

  let args = JSON.stringify({
    contractAddress,
  });

  const transaction = JSON.stringify(
    {
      serializedTransaction,
      signedData,
      buyParams,
      name,
    },
    null,
    2
  );

  let answer = await zkCloudWorkerRequest({
    command: "execute",
    transactions: [transaction],
    task: "buy",
    args,
    metadata: `buy NFT @${name}`,
    mode: "async",
  });

  if (DEBUG) console.log(`zkCloudWorker answer:`, answer);
  const jobId = answer?.jobId;
  if (DEBUG) console.log(`jobId:`, jobId);
  return jobId;
}

export async function waitForTransaction(jobId) {
  if (jobId === undefined || jobId === "") {
    console.error("JobId is undefined");
    return {
      success: false,
      error: "JobId is undefined",
    };
  }
  let result;
  let answer = await zkCloudWorkerRequest({
    command: "jobResult",
    jobId,
  });
  while (result === undefined && answer.jobStatus !== "failed") {
    await sleep(5000);
    answer = await zkCloudWorkerRequest({
      command: "jobResult",
      jobId,
    });
    if (DEBUG) console.log(`jobResult api call result:`, answer);
    result = answer.result;
    if (result !== undefined)
      if (DEBUG) console.log(`jobResult result:`, result);
  }
  if (answer.jobStatus === "failed") {
    return { success: false, error: result };
  } else if (result === undefined) {
    return { success: false, error: "job error" };
  } else return { success: true, hash: result };
}

async function zkCloudWorkerRequest(params) {
  const { command, task, transactions, args, metadata, mode, jobId } = params;
  const chain = chainId();
  const apiData = {
    auth: REACT_APP_ZKCW_AUTH,
    command: command,
    jwtToken: REACT_APP_ZKCW_JWT,
    data: {
      task,
      transactions: transactions ?? [],
      args,
      repo: "mint-worker",
      developer: "DFST",
      metadata,
      mode: mode ?? "sync",
      jobId,
    },
    chain,
  };
  const endpoint = REACT_APP_ZKCW_ENDPOINT + chain;

  const response = await axios.post(endpoint, apiData);
  return response.data;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
