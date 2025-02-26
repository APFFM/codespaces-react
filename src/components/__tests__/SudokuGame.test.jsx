import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import SudokuGame from '../SudokuGame';
import '@testing-library/jest-dom';

// Mock for SudokuNotepad to avoid testing it here
jest.mock('../SudokuNotepad', () => {
  return function MockNotepad({ isOpen, onClose }) {
    return isOpen ? (
      <div data-testid="mock-notepad">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  };
});

describe('SudokuGame Component', () => {
  test('renders with correct initial structure', () => {
    render(<SudokuGame isDarkMode={false} />);
    
    // Check header is present
    expect(screen.getByText('Sudoku Challenge')).toBeInTheDocument();
    
    // Check difficulty selector exists
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    
    // Check board exists (81 cells)
    const cells = document.querySelectorAll('.sudoku-cell');
    expect(cells.length).toBe(81);
    
    // Check action buttons exist
    expect(screen.getByText(/notes/i)).toBeInTheDocument();
    expect(screen.getByText(/hint/i)).toBeInTheDocument();
    expect(screen.getByText(/check/i)).toBeInTheDocument();
  });
  
  test('allows cell selection and displays appropriate message', () => {
    render(<SudokuGame isDarkMode={false} />);
    
    // Find cells and click one
    const cells = document.querySelectorAll('.sudoku-cell');
    fireEvent.click(cells[0]); // Click first cell
    
    // Check if message appears about fixed cell or empty
    const messageElement = screen.queryByText(/fixed cell/i) || 
                          screen.queryByText(/selected cell/i);
    expect(messageElement).toBeTruthy();
  });
  
  test('toggles note mode when note button clicked', () => {
    render(<SudokuGame isDarkMode={false} />);
    
    const noteButton = screen.getByText(/notes/i).closest('button');
    fireEvent.click(noteButton);
    
    // Check if message indicates notes mode is active
    expect(screen.getByText(/notes mode activated/i)).toBeInTheDocument();
  });
  
  test('opens notepad when notepad button clicked', () => {
    render(<SudokuGame isDarkMode={false} />);
    
    const notepadButton = screen.getByText(/notepad/i).closest('button');
    fireEvent.click(notepadButton);
    
    // Check if notepad is shown
    expect(screen.getByTestId('mock-notepad')).toBeInTheDocument();
  });
  
  // Add more tests for game logic, difficulty changes, etc.
});
