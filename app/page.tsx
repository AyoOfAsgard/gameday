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


const generateGameId = () => {
  return Math.random().toString(36).substring(2, 6);
};

const buttonStyle = {
  backgroundColor: '#FFA500', // Light Orange
  color: 'white',
  padding: '12px 24px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: 500,
  transition: 'background-color 0.2s'
};

const inputStyle = {
  padding: '10px',
  borderRadius: '6px',
  border: '1px solid #E5E7EB',
  marginBottom: '10px',
  width: '200px',
  fontSize: '16px'
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '20px',
      textAlign: 'center'
    }}>
      <ConnectButton label="Sign in" />
      {!gameId && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          alignItems: 'center'
        }}>
          <button onClick={createGame} style={buttonStyle}>
            Create Game
          </button>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <input
              type="text"
              placeholder="Enter Game ID"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              style={inputStyle}
            />
            <button onClick={joinGame} style={buttonStyle}>
              Join Game
            </button>
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

