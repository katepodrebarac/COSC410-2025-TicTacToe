import React from "react";
import { useGameContext } from '@/App';

type Player = "X" | "O";
type Cell = Player | null;

type Props = {
  boardIndex: number;
  gameKey?: number;
};

// ----- Backend DTOs -----
type GameStateDTO = {
  id: string;
  board: Cell[];
  // current_player: Player;
  winner: Player | null;
  is_draw: boolean;
  status: string;
};

const API_BASE =
  (import.meta as any)?.env?.VITE_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

export default function TicTacToe({ boardIndex, gameKey }: Props) {
  const [state, setState] = React.useState<GameStateDTO | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { 
    currentPlayer, 
    handleMove, 
    getPlayer, 
    handleReset, 
    activeBoard, 
    setActiveBoard, 
    setBoardWinner,
    boardWinners 
  } = useGameContext();

  // Check if this board is playable based on Ultimate Tic-Tac-Toe rules
  const isBoardPlayable = () => {
    // If no active board is set, any board is playable
    if (activeBoard === null) return true;
    
    // If this is the active board, it's playable
    if (activeBoard === boardIndex) return true;
    
    // If the active board is full or finished, any board is playable
    const activeBoardWinner = boardWinners[activeBoard];
    if (activeBoardWinner !== null) return true;
    
    return false;
  };

  // Check if this board should be highlighted (is the active board)
  const shouldHighlight = () => {
    return activeBoard === boardIndex;
  };

  // Create a new game on mount
  React.useEffect(() => {
    let canceled = false;
    async function start() {
      setError(null);
      setLoading(true);
      try {
        const gs = await createGame();
        if (!canceled) setState(gs);
      } catch (e: any) {
        if (!canceled) setError(e?.message ?? "Failed to start game");
      } finally {
        if (!canceled) setLoading(false);
      }
    }
    start();
    return () => {
      canceled = true;
    };
  }, [gameKey]);

  // Report winner to parent when game ends
  React.useEffect(() => {
    if (!state) return;
    
    if (state.winner) {
      setBoardWinner(boardIndex, state.winner);
    } else if (state.is_draw) {
      setBoardWinner(boardIndex, "Draw");
    }
  }, [state?.winner, state?.is_draw, boardIndex, setBoardWinner]);

  async function createGame(): Promise<GameStateDTO> {
    const r = await fetch(`${API_BASE}/tictactoe/new`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ starting_player: getPlayer() }),
    });
    if (!r.ok) throw new Error(`Create failed: ${r.status}`);
    return r.json();
  }

  async function playMove(index: number): Promise<GameStateDTO> {
    if (!state) throw new Error("No game");

    console.log("Playing move", index, getPlayer());

    const r = await fetch(`${API_BASE}/tictactoe/${state.id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index, player: getPlayer() }),
    });
    if (!r.ok) {
      const detail = await r.json().catch(() => ({}));
      throw new Error(detail?.detail ?? `Move failed: ${r.status}`);
    }
    return r.json();
  }

  async function handleClick(i: number) {
    if (!state || loading) return;
    if (state.winner || state.is_draw || state.board[i] !== null) return;
    
    // Check if this board is playable according to Ultimate Tic-Tac-Toe rules
    if (!isBoardPlayable()) return;

    setLoading(true);
    setError(null);
    try {
      const next = await playMove(i);
      // Only update state if the response is valid
      if (next && Array.isArray(next.board)) {
        setState(next);
        
        // Set the next active board based on the move position
        // If the target board is already finished, set activeBoard to null (any board playable)
        const nextActiveBoard = boardWinners[i] !== null ? null : i;
        setActiveBoard(nextActiveBoard);
        
        // Use handleMove from context to switch players
        const nextPlayer = getPlayer() === "X" ? "O" : "X";
        handleMove(nextPlayer);
      } else {
        setError("Invalid response from server.");
      }
    } catch (e: any) {
      setError(e?.message ?? "Move failed");
      // Do NOT clear the board here!
    } finally {
      setLoading(false);
    }
  }

  async function reset() {
    setLoading(true);
    setError(null);
    try {
      const gs = await createGame();
      setState(gs);
    } catch (e: any) {
      setError(e?.message ?? "Failed to reset");
    } finally {
      setLoading(false);
    }
  }

  if (error) {
    return (
      <div className="max-w-sm mx-auto p-4">
        <div className="mb-2 text-red-600 font-semibold">Error: {error}</div>
        <button className="rounded-2xl px-4 py-2 border" onClick={reset}>
          Retry
        </button>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="max-w-sm mx-auto p-4">
        <div className="text-center">Loading…</div>
      </div>
    );
  }

  const { board, status, winner, is_draw } = state;
  const isPlayable = isBoardPlayable();
  const isHighlighted = shouldHighlight();

  return (
    <div className={`max-w-sm mx-auto p-2 h-full transition-all duration-200 ${
      isHighlighted ? 'bg-yellow-200 rounded-2xl shadow-lg' : ''
    }`}>
      <div className="grid grid-cols-3 gap-0 h-full">
        {board.map((c, i) => (
          <button
            key={i}
            className={`aspect-square rounded-2xl border text-3xl font-bold flex items-center justify-center disabled:opacity-50 transition-colors ${
              isHighlighted ? 'border-yellow-600 border-2' : 'border-black'
            }`}
            onClick={() => handleClick(i)}
            aria-label={`cell-${i}`}
            disabled={loading || c !== null || winner !== null || is_draw || !isPlayable}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}