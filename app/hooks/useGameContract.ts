import { useWriteContract, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract';
import { parseEther } from 'viem';

interface GameData {
  creator: string;
  joiner: string;
  betAmount: bigint;
  isActive: boolean;
  winner: string;
}

export function useGameContract() {
  const { writeContract: createGameWrite } = useWriteContract();
  const { writeContract: joinGameWrite } = useWriteContract();
  const { writeContract: endGameWrite } = useWriteContract();
  const { data: gameData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getGame',
    args: [''], // Default empty gameId
  }) as { data: GameData | undefined };

  const createNewGame = async (gameId: string, betAmount: number) => {
    if (!createGameWrite) throw new Error('Contract write not ready');
    await createGameWrite({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'createGame',
      args: [gameId],
      value: parseEther(betAmount.toString()),
    });
  };

  const joinExistingGame = async (gameId: string, betAmount: number) => {
    if (!joinGameWrite) throw new Error('Contract write not ready');
    const gameInfo = gameData;
    
    if (!gameInfo) throw new Error('Game not found');
    
    await joinGameWrite({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'joinGame',
      args: [gameId],
      value: parseEther(betAmount.toString()),
    });
  };

  const endCurrentGame = async (gameId: string, winner: string) => {
    if (!endGameWrite) throw new Error('Contract write not ready');
    await endGameWrite({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'endGame',
      args: [gameId, winner],
    });
  };

  const getGameData = (gameId: string) => {
    return useReadContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'getGame',
      args: [gameId],
    }) as { data: GameData | undefined };
  };

  return {
    createNewGame,
    joinExistingGame,
    endCurrentGame,
    getGameData,
  };
} 