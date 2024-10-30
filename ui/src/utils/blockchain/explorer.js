
export function explorerAccount() {
  const chain = chainId();
  if (chain === "devnet") return "https://minascan.io/devnet/account/";
  if (chain === "mainnet") return "https://minascan.io/mainnet/account/";
  else return "https://zekoscan.io/devnet/account/";
}

export function explorerTransaction() {
  if (chain === "devnet") return "https://minascan.io/devnet/tx/";
  if (chain === "mainnet") return "https://minascan.io/mainnet/tx/";
  else return "https://zekoscan.io/devnet/tx/";
}

export function chainId() {
  NEXT_PUBLIC_APP_CHAIN_ID = 'devnet'
  console.log(NEXT_PUBLIC_APP_CHAIN_ID)
  if (NEXT_PUBLIC_APP_CHAIN_ID === undefined)
    console.error("NEXT_PUBLIC_APP_CHAIN_ID is undefined");
  return NEXT_PUBLIC_APP_CHAIN_ID === "mina:mainnet" ? "mainnet" : "devnet";
}
