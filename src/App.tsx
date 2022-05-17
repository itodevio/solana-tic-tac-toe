import 'App.css'
import React, { useRef, useState } from 'react';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
  Program, AnchorProvider, web3
} from '@project-serum/anchor';
import idl from './idl.json';

import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useContext } from './hooks/context';
import { TicTacToe } from './types/game';
require('@solana/wallet-adapter-react-ui/styles.css');

function App() {
  const [board, setBoard] = useState([[null, null, null], [null, null, null], [null, null, null]]);
  const [created, setCreated] = useState(false);
  const [gameId, setGameId] = useState(localStorage.getItem('gameId'));
  const [loading, setLoading] = useState(false);
  const gameIdRef = useRef<HTMLInputElement>();
  const secondPlayerRef = useRef<HTMLInputElement>();
  
  const wallet = useWallet();

  const { opts, programID, endpoint } = useContext();

  async function getProvider() {
    /* create the provider and return it to the caller */
    /* network set to local network for now */
    const network = endpoint;
    const connection = new Connection(network, opts.preflightCommitment);

    const provider = new AnchorProvider(
      connection, wallet as any, opts.preflightCommitment as any,
    );
    return provider;
  }

  async function createGame(gameAccount: Keypair, secondPlayer: PublicKey) {   
    setLoading(true);
    try {
      console.log({wallet: wallet.publicKey});
      const provider = await getProvider()
      /* create the program interface combining the idl, program ID, and provider */
      const program = new Program<TicTacToe>(idl as any, programID, provider);

      subscribe(gameAccount.publicKey.toString());

      console.log('chegou até aqui?')

      /* interact with the program via rpc */
      await program.methods
        .setupGame(secondPlayer)
        .accounts({
          game: gameAccount.publicKey,
          playerOne: wallet.publicKey,
        })
        .signers([gameAccount])
        .rpc();
      
      setLoading(false);
    } catch (err) {
      console.log("Transaction error: ", err);
    }
  }

  async function subscribe(gamePublicKey: string) {
    const provider = await getProvider()
      /* create the program interface combining the idl, program ID, and provider */
    const program = new Program<TicTacToe>(idl as any, programID, provider);

    const emitter =  program.account.game.subscribe(new PublicKey(gamePublicKey));

    emitter.on('change', (data) => setBoard(data.board as any));
  }

  async function play(row: number, column: number) {
    const provider = await getProvider()
      /* create the program interface combining the idl, program ID, and provider */
    const program = new Program<TicTacToe>(idl as any, programID, provider);

    await program.methods
      .play({ row, column })
      .accounts({
        player: wallet.publicKey,
        game: new PublicKey(gameId)
      })
      .signers([])
      .rpc();
  }

  if (!wallet.connected) {
    /* If the user's wallet is not connected, display connect wallet button. */
    return (
      <div className="flex justify-center items-center h-full">
        <WalletMultiButton />
      </div>
    )
  } 

  if (!gameId) {
    return (
      <div className="flex h-full w-full justify-center items-center">
        <div className="flex gap-10">
          <div className="flex flex-col gap-2">
            <input
              ref={gameIdRef}
              className="px-4 h-14 bg-light text-xl w-full text-darker border-none rounded"
              type="text"
              placeholder="Game ID"
              value={gameId}
            />
            <button
              onClick={() => {
                subscribe(gameIdRef.current.value.replace(/ /g, ''))
                setGameId(gameIdRef.current.value.replace(/ /g, ''));
              }}
              className="bg-primary text-light w-full rounded h-14"
            >
              Join Game
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={secondPlayerRef}
              className="px-4 h-14 bg-light text-xl w-full text-darker border-none rounded"
              type="text"
              placeholder="Player Two Key"
              value={gameId}
            />
            <button
              className="bg-secondary text-darker w-full rounded h-14"
              onClick={() => {
                const gamePair = web3.Keypair.generate();
                // console.log(new PublicKey(gamePair.publicKey.toString()))
                createGame(gamePair, new PublicKey(secondPlayerRef.current.value))
                localStorage.setItem('gameID', gamePair.publicKey.toString());
                setCreated(true);
                setGameId(gamePair.publicKey.toString());
              }}
            >
              Create Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex text-secondary justify-center items-center">
        Carregando...
      </div>
    );
  }

  return (
    <div className="w-full relative h-full flex flex-col justify-center items-center gap-4">
      {
        created && (
          <button
            className="absolute text-light bg-primary top-10 left-10 rounded py-2 w-[200px]"
            onClick={() => navigator.clipboard.writeText(gameId)}
          >
            Share game
          </button>
        )
      }
      <div className="bg-purple-500 gap-2 border-purple-500 border-8 flex flex-col">
        {board.map((row, i) => (
          <div key={`row-${i}`} className="flex gap-2">
            {row.map((cell, j) => (
              <div
                key={`cell-${i}-${j}`}
                className="w-20 h-20 bg-slate-200 text-4xl text-slate-800 font-bold flex justify-center items-center"
                onClick={() => play(i, j)}
              >
                {
                  cell?.x && 'X'
                }
                {
                  cell?.o && 'O'
                }
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const AppWithProvider = () => {
  const { wallets, endpoint } = useContext();

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default AppWithProvider;
