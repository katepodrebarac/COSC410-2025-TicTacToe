import React from "react";
import { createContext, useContext, useCallback, useEffect, useState } from "react";
import TicTacToe from "@/components/TicTacToe";

type Player = "X" | "O";

interface GameContextType {
  currentPlayer: Player;
  setCurrentPlayer: (player: Player) => void;
  handleMove: (player: Player) => void;
  getPlayer: () => Player;
  handleReset: () => void;
  resetCount: number;
  activeBoard: number | null;
  setActiveBoard: (board: number | null) => void;
  boardWinners: (Player | "Draw" | null)[];
  setBoardWinner: (boardIndex: number, winner: Player | "Draw" | null) => void;
  metaWinner: Player | null;
  metaIsDraw: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};

const API_BASE = (import.meta as any)?.env?.VITE_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export default function App() {
  const [currentPlayer, setCurrentPlayer] = React.useState<Player>("X");
  const [resetCount, setResetCount] = React.useState(0);
  const [activeBoard, setActiveBoard] = React.useState<number | null>(null);
  const [boardWinners, setBoardWinners] = React.useState<(Player | "Draw" | null)[]>(Array(9).fill(null));
  const [metaGameId, setMetaGameId] = React.useState<string | null>(null);
  const [metaWinner, setMetaWinner] = React.useState<Player | null>(null);
  const [metaIsDraw, setMetaIsDraw] = React.useState(false);

  const allBoardsFilled = boardWinners.every(winner => winner !== null);
  const isOverallDraw = !metaWinner && !metaIsDraw && allBoardsFilled;

  // Create meta game when component mounts
  useEffect(() => {
    async function createMetaGame() {
      try {
        const response = await fetch(`${API_BASE}/tictactoe/new`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ starting_player: "X" }),
        });
        if (response.ok) {
          const game = await response.json();
          setMetaGameId(game.id);
        }
      } catch (error) {
        console.error("Failed to create meta game:", error);
      }
    }
    createMetaGame();
  }, [resetCount]);

  // Check meta game state whenever boardWinners changes
  useEffect(() => {
    if (!metaGameId) return;
    
    async function checkMetaGame() {
      try {
        // Convert boardWinners to the format expected by backend (null for Draw)
        const metaBoard = boardWinners.map(winner => winner === "Draw" ? null : winner);
        
        // Check if there are any moves to make
        const hasChanges = metaBoard.some(cell => cell !== null);
        if (!hasChanges) return;

        // Get current meta game state
        const response = await fetch(`${API_BASE}/tictactoe/${metaGameId}`);
        if (response.ok) {
          const currentState = await response.json();
          
          // Update meta game state by making moves for each position that changed
          for (let i = 0; i < metaBoard.length; i++) {
            if (metaBoard[i] !== null && currentState.board[i] === null) {
              try {
                const moveResponse = await fetch(`${API_BASE}/tictactoe/${metaGameId}/move`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ index: i, player: metaBoard[i] }),
                });
                
                if (moveResponse.ok) {
                  const updatedState = await moveResponse.json();
                  setMetaWinner(updatedState.winner);
                  setMetaIsDraw(updatedState.is_draw);
                  currentState.board = updatedState.board; // Update for next iteration
                }
              } catch (error) {
                console.error("Failed to make meta move:", error);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to check meta game:", error);
      }
    }

    checkMetaGame();
  }, [boardWinners, metaGameId]);

  function handleMove(player: Player) {
    setCurrentPlayer(player);
  }

  function getPlayer(): Player {
    return currentPlayer;
  }


function handleReset() {
  setResetCount(c => c + 1);
  setCurrentPlayer("X");
  setActiveBoard(null); // Reset active board
  setBoardWinners(Array(9).fill(null));
  setMetaWinner(null);
  setMetaIsDraw(false);
  setMetaGameId(null);
}


  const setBoardWinner = useCallback((boardIndex: number, winner: Player | "Draw" | null) => {
    setBoardWinners(prev => {
      const newWinners = [...prev];
      newWinners[boardIndex] = winner;
      return newWinners;
    });
  }, []);

  const contextValue: GameContextType = {
    currentPlayer,
    setCurrentPlayer,
    handleMove,
    getPlayer,
    handleReset,
    resetCount,
    activeBoard,
    setActiveBoard,
    boardWinners,
    setBoardWinner,
    metaWinner,
    metaIsDraw: metaIsDraw || isOverallDraw,
  };

  return (
    <GameContext.Provider value={contextValue}>
      <div className="flex flex-col min-h-screen">
        <div className="text-center text-xl font-semibold my-4">
          {metaWinner ? `${metaWinner} wins Super Tic Tac Toe!` : 
           (metaIsDraw || isOverallDraw) ? "Draw" : 
           `${currentPlayer}'s turn`}
        </div>
        <div className="flex-grow flex items-center justify-center">
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={`${resetCount}-${i}`} className="w-64 h-64 relative">
                <TicTacToe
                  boardIndex={i}
                  gameKey={resetCount}
                />
                {boardWinners[i] !== null && (
                  <div className="absolute inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
                    <div className="text-8xl font-bold text-gray-800">
                      {boardWinners[i] === "Draw" ? "" : boardWinners[i]}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center my-8">
          <button
            className="rounded-2xl px-6 py-3 border border-black text-lg font-semibold"
            onClick={handleReset}
          >
            New Game
          </button>
        </div>
      </div>
    </GameContext.Provider>
  );
}
