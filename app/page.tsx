'use client'

import '@rainbow-me/rainbowkit/styles.css';
import { useState} from 'react';
import { getDefaultConfig, RainbowKitProvider} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ConnectButton } from '@rainbow-me/rainbowkit';


const config = getDefaultConfig({
  appName: 'Gameday',
  projectId: 'c7f075b8de01f37550265869748cc899',
  chains: [base],
  ssr: true,
});

const queryClient = new QueryClient();

export default function Home() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <Gameday />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}


export const generateGameId = () => {
  return Math.random().toString(36).substring(2, 6);
};

const Gameday = () => {
  const [gameId, setGameId] = useState('');
  const [isCreator, setIsCreator] = useState(false);
  const [joinId, setJoinId] = useState('');

  const createGame = () => {
    const id = generateGameId();
    setGameId(id);
    setIsCreator(true);
  };

  const joinGame = () => {
    setGameId(joinId);
    setIsCreator(false);
  };

  return (
    <div>
      <ConnectButton label="Sign in" />
      {!gameId && (
        <div>
          <button onClick={createGame} style={{ marginTop: '20px' }}>
          Create Game
          </button>
          <div style={{ marginTop: '20px' }}>
            <input
              type="text"
              placeholder="Enter Game ID"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
            />
            <button onClick={joinGame}>Join Game</button>
          </div>
        </div>
      )}
      {gameId && isCreator && (
        <div>
          <p>Game ID: <strong>{gameId}</strong></p>
          <p>Share this ID with another player to join!</p>
        </div>
      )}
      {gameId && !isCreator && <p>Joined Game ID: {gameId}</p>}
    </div>
  );
};