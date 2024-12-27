'use client'

import '@rainbow-me/rainbowkit/styles.css';
import { useEffect, useState } from 'react';
import { getDefaultConfig, RainbowKitProvider} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Socket } from 'socket.io-client';
import io from 'socket.io-client';

let socket: Socket;

// Initialize socket connection once
const initSocket = () => {
  if (!socket) {
    socket = io('', {
      path: '/api/socket',
    });
    console.log('Socket initialized');
  }
  return socket;
};

const config = getDefaultConfig({
  appName: 'Gameday',
  projectId: 'c7f075b8de01f37550265869748cc899',
  chains: [base],
  ssr: true,
});

const queryClient = new QueryClient();

// Custom hook for socket management
const useSocket = (gameId: string) => {
  const [betAmount, setBetAmount] = useState(0);
  const [isBetSet, setIsBetSet] = useState(false);

  useEffect(() => {
    // Use the global socket instance
    const currentSocket = initSocket();

    // Add connection listener
    currentSocket.on('connect', () => {
      console.log('Socket connected with ID:', currentSocket.id);
      
      // Join game room after connection
      if (gameId) {
        console.log('Joining game room:', gameId);
        currentSocket.emit('join-game', gameId);
      }
    });

    currentSocket.on('update-bet', (data) => {
      console.log('Received bet update:', data);
      setBetAmount(data.betAmount);
      setIsBetSet(true);
    });

    return () => {
      currentSocket.off('connect');
      currentSocket.off('update-bet');
    };
  }, [gameId]);

  const sendBet = (amount: number) => {
    if (socket && gameId) {
      console.log('Sending bet:', amount, 'for game:', gameId);
      socket.emit('set-bet', { gameId, betAmount: amount });
      setBetAmount(amount);
      setIsBetSet(true);
    }
  };

  return { betAmount, isBetSet, sendBet };
};

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
  
  const { betAmount, isBetSet, sendBet } = useSocket(gameId);

  const createGame = () => {
    const id = generateGameId();
    setGameId(id);
    setIsCreator(true);
  };

  const joinGame = () => {
    console.log('Joining game with ID:', joinId);
    setGameId(joinId);
    setIsCreator(false);
  };

  const handleBetSelection = (amount: number) => {
    sendBet(amount);
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
      {gameId && isCreator && !isBetSet && (
        <div>
          <p>Game ID: <strong>{gameId}</strong></p>
          <p>Share this ID with another player to join!</p>
          <p>Select Bet Amount:</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px'}}>
            <button onClick={() => handleBetSelection(1)} style={buttonStyle}>
              $1
            </button>
            <button onClick={() => handleBetSelection(5)} style={buttonStyle}>
              $5
            </button>
            <button onClick={() => handleBetSelection(10)} style={buttonStyle}>
              $10
            </button>
          </div>
          <div style={{ marginTop: '10px' }}>
            <input
              type="number"
              placeholder="Custom Amount"
              onChange={(e) => handleBetSelection(Number(e.target.value))}
              style={inputStyle}
            />
          </div>
        </div>
      )}
      {gameId && isCreator && isBetSet && (
        <div>
          <p>GameID: <strong>{gameId}</strong></p>
          <p>Selected Bet Amount: <strong>${betAmount}</strong></p>
          <p>Share this ID with another player to join!</p>
        </div>
      )}
      {gameId && !isCreator && (
        <div>
          <p>Joined Game ID: {gameId}</p>
          {isBetSet ? (
            <p>Bet Amount: <strong>${betAmount}</strong></p>
          ) :(
            <p>Waiting for the creator to select a bet amount...</p>
          )}
        </div>
      )}
    </div>
  );
};
