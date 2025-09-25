import { describe, expect, it, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import TicTacToe from "../components/TicTacToe";
import App from "../App";

describe("TicTacToe component (API via MSW)", () => {
  it("places X when clicked during X's turn", async () => {
    render(<App />);
    
    // Wait for at least one board to load
    await waitFor(async () => {
      const allCells = screen.getAllByLabelText(/cell-/);
      expect(allCells.length).toBeGreaterThan(0);
    }, { timeout: 5000 });
    
    const allCells = screen.getAllByLabelText(/cell-/);
    const firstCell = allCells[0];
    
    await act(async () => {
      fireEvent.click(firstCell);
      await new Promise(resolve => setTimeout(resolve, 200));
    });
    
    expect(firstCell.textContent).toBe("X");
  });

  it("sets the correct active board based on the cell position clicked", async () => {
    render(<App />);
    
    // Wait for ALL 81 cells to load (all 9 boards * 9 cells each)
    await waitFor(async () => {
      const allCells = screen.getAllByLabelText(/cell-/);
      expect(allCells).toHaveLength(81);
    }, { timeout: 1000 }); // Longer timeout for all boards
    
    const allCells = screen.getAllByLabelText(/cell-/);
    const board0Cells = allCells.slice(0, 9);
    const board1Cells = allCells.slice(9, 18);
    const board3Cells = allCells.slice(27, 36);
    const board4Cells = allCells.slice(36, 45);
    
    // X clicks on board 4, cell 1
    // This should set the active board to board 1 for O's turn
    await act(async () => {
      fireEvent.click(board4Cells[1]);
      await new Promise(resolve => setTimeout(resolve, 500));
    });
    
    expect(board4Cells[1].textContent).toBe("X");
    
    // Try clicking on board 0 (should not work - not the active board)
    await act(async () => {
      fireEvent.click(board0Cells[0]);
      await new Promise(resolve => setTimeout(resolve, 500));
    });
    
    expect(board0Cells[0].textContent).toBe("");
    
    // Click on board 1 (should work - this is the active board)
    await act(async () => {
      fireEvent.click(board1Cells[3]);
      await new Promise(resolve => setTimeout(resolve, 500));
    });
    
    expect(board1Cells[3].textContent).toBe("O");
  });

  it("only allows moves on the active board", async () => {
    render(<App />);
    
    // Wait for all 81 cells to load
    await waitFor(async () => {
      const allCells = screen.getAllByLabelText(/cell-/);
      expect(allCells).toHaveLength(81);
    }, { timeout: 1000 });
    
    const allCells = screen.getAllByLabelText(/cell-/);
    const board0Cells = allCells.slice(0, 9);
    const board1Cells = allCells.slice(9, 18);
    const board2Cells = allCells.slice(18, 27);
    const board3Cells = allCells.slice(27, 36);
    const board4Cells = allCells.slice(36, 45);
    const board5Cells = allCells.slice(45, 54);
    const board6Cells = allCells.slice(54, 63);
    const board7Cells = allCells.slice(63, 72);
    const board8Cells = allCells.slice(72, 81);

    // X clicks on board 4, cell 7 (middle board, cell 7)
    // This should set the active board to board 7 for O's turn
    await act(async () => {
      fireEvent.click(board4Cells[7]);
      await new Promise(resolve => setTimeout(resolve, 200));
    });
    
    expect(board4Cells[7].textContent).toBe("X");
    
    // Try clicking on all other boards - they should all be ignored
    const testCells = [
      board0Cells[1], board1Cells[2], board2Cells[3], 
      board3Cells[4], board4Cells[5], board5Cells[6], 
      board6Cells[7], board8Cells[0]
    ];
    
    for (const cell of testCells) {
      await act(async () => {
        fireEvent.click(cell);
        await new Promise(resolve => setTimeout(resolve, 1000));
      });
      expect(cell.textContent).toBe("");
    }
    
    // Finally, click on board 7 (should work - this is the active board)
    await act(async () => {
      fireEvent.click(board7Cells[3]);
      await new Promise(resolve => setTimeout(resolve, 200));
    });
    
    expect(board7Cells[3].textContent).toBe("O");
  });

  it("prevents moves in occupied cells", async () => {
    render(<App />);
    
    // Wait for at least one board to load
    await waitFor(async () => {
      const allCells = screen.getAllByLabelText(/cell-/);
      expect(allCells.length).toBeGreaterThan(0);
    }, { timeout: 500 });
    
    const allCells = screen.getAllByLabelText(/cell-/);
    const firstCell = allCells[0];
    
    await act(async () => {
      fireEvent.click(firstCell);
      await new Promise(resolve => setTimeout(resolve, 200));
    });
    
    await act(async () => {
      fireEvent.click(firstCell); // second click ignored/disabled
      await new Promise(resolve => setTimeout(resolve, 200));
    });
    
    expect(firstCell.textContent).toBe("X");
  });

  it("can start a new game after finishing", async () => {
    render(<App />);
    
    // Wait for at least one board to load
    await waitFor(async () => {
      const allCells = screen.getAllByLabelText(/cell-/);
      expect(allCells.length).toBeGreaterThan(0);
    }, { timeout: 500 });
    
    const allCells = screen.getAllByLabelText(/cell-/);
    const firstCell = allCells[0];
    const secondCell = allCells[Math.min(3, allCells.length - 1)];
    
    // Play a few moves
    await act(async () => {
      fireEvent.click(firstCell);
      await new Promise(resolve => setTimeout(resolve, 200));
    });
    
    if (allCells.length > 1) {
      await act(async () => {
        fireEvent.click(secondCell);
        await new Promise(resolve => setTimeout(resolve, 200));
      });
    }
    
    // Verify moves were made
    expect(firstCell.textContent).toBe("X");
    if (allCells.length > 1) {
      expect(secondCell.textContent).toBe("O");
    }

    // Click "New Game" button
    const newGameBtn = await screen.findByRole("button", { name: /new game/i });
    await act(async () => {
      fireEvent.click(newGameBtn);
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for reset
    });

    // Wait for new boards to load after reset
    await waitFor(async () => {
      const newAllCells = screen.getAllByLabelText(/cell-/);
      expect(newAllCells.length).toBeGreaterThan(0);
    }, { timeout: 5000 });

    const newAllCells = screen.getAllByLabelText(/cell-/);
    expect(newAllCells[0].textContent).toBe("");
    if (newAllCells.length > 1) {
      expect(newAllCells[1].textContent).toBe("");
    }
  });
});
