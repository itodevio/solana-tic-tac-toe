import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { Keypair, PublicKey, Commitment } from '@solana/web3.js';
import { useState } from 'react';
import idl from "../idl.json";

interface UseContext {
  programID: PublicKey
  opts: {
    preflightCommitment: Commitment
  }
  gameAccount: Keypair
  wallets: PhantomWalletAdapter[]
  endpoint: string
}

const secretKey = '236,20,152,160,208,45,137,231,92,174,7,149,63,136,172,71,81,137,150,78,126,156,72,134,235,236,200,188,47,52,0,93,226,188,67,170,226,47,105,1,222,116,138,33,207,160,229,4,128,140,142,26,195,106,44,122,35,81,171,195,213,62,224,4';

export function useContext(): UseContext {
  const endpoint = 'https://api.devnet.solana.com'
  const gameAccount = Keypair.fromSecretKey(new Uint8Array(secretKey.split(',').map((num) => Number(num))));
  const programID = new PublicKey(idl.metadata.address);
  const opts: UseContext['opts'] = {
    preflightCommitment: "processed"
  }

  const wallets = [
    /* view list of available wallets at https://github.com/solana-labs/wallet-adapter#wallets */
    new PhantomWalletAdapter()
  ]

  return {
    programID,
    opts,
    gameAccount,
    endpoint,
    wallets,
  }
}