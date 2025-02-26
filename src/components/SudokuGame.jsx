import React, { useState, useEffect } from 'react';
import '../styles/SudokuGame.css';

const SudokuGame = ({ isDarkMode }) => {
  const [board, setBoard] = useState(Array(9).fill().map(() => Array(9).fill(0)));
  const [solution, setSolution] = useState(Array(9).fill().map(() => Array(9).fill(0)));
  const [initialBoard, setInitialBoard] = useState(Array(9).fill().map(() => Array(9).fill(0)));
  const [selectedCell, setSelectedCell] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [gameStatus, setGameStatus] = useState('playing');
  const [hints, setHints] = useState(3);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [notes, setNotes] = useState(Array(9).fill().map(() => Array(9).fill().map(() => new Set())));
  const [isNoteModeActive, setIsNoteModeActive] = useState(false);

  // Initialize the board when component mounts
  useEffect(() => {
    generateNewGame(difficulty);
  }, []);

  // Timer effect
  useEffect(() => {
    let interval;
    if (isTimerRunning && gameStatus === 'playing') {
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, gameStatus]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate a valid Sudoku board
  const generateSudokuBoard = () => {
    // Creates a solved Sudoku puzzle
    const emptyBoard = Array(9).fill().map(() => Array(9).fill(0));
    const solvedBoard = solveSudoku([...emptyBoard]);
    
    // Remove numbers based on difficulty
    const clues = {
      'easy': 45,
      'medium': 35,
      'hard': 25,
      'expert': 20
    };
    
    const numCellsToKeep = clues[difficulty];
    const playableBoard = createPlayableBoard(solvedBoard, numCellsToKeep);
    
    return { playable: playableBoard, solution: solvedBoard };
  };

  const createPlayableBoard = (solvedBoard, numToKeep) => {
    const board = JSON.parse(JSON.stringify(solvedBoard));
    const totalCells = 81;
    const cellsToRemove = totalCells - numToKeep;
    
    let removed = 0;
    while (removed < cellsToRemove) {
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);
      
      if (board[row][col] !== 0) {
        board[row][col] = 0;
        removed++;
      }
    }
    
    return board;
  };

  const solveSudoku = (board) => {
    const emptyCell = findEmptyCell(board);
    if (!emptyCell) return board; // No empty cells means we solved it
    
    const [row, col] = emptyCell;
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    
    for (const num of nums) {
      if (isValidPlacement(board, row, col, num)) {
        board[row][col] = num;
        
        if (solveSudoku(board)) {
          return board;
        }
        
        board[row][col] = 0; // Backtrack
      }
    }
    
    return false;
  };

  const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const findEmptyCell = (board) => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          return [row, col];
        }
      }
    }
    return null;
  };

  const isValidPlacement = (board, row, col, num) => {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (board[row][x] === num) return false;
    }
    
    // Check column
    for (let y = 0; y < 9; y++) {
      if (board[y][col] === num) return false;
    }
    
    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    
    for (let y = boxRow; y < boxRow + 3; y++) {
      for (let x = boxCol; x < boxCol + 3; x++) {
        if (board[y][x] === num) return false;
      }
    }
    
    return true;
  };

  const generateNewGame = (diff) => {
    setDifficulty(diff);
    const { playable, solution } = generateSudokuBoard();
    
    setBoard(JSON.parse(JSON.stringify(playable)));
    setInitialBoard(JSON.parse(JSON.stringify(playable)));
    setSolution(solution);
    setSelectedCell(null);
    setGameStatus('playing');
    setTimer(0);
    setIsTimerRunning(true);
    setHints(3);
    setNotes(Array(9).fill().map(() => Array(9).fill().map(() => new Set())));
  };

  const handleCellClick = (row, col) => {
    if (gameStatus !== 'playing' || initialBoard[row][col] !== 0) return;
    
    setSelectedCell([row, col]);
  };

  const handleNumberInput = (num) => {
    if (!selectedCell || gameStatus !== 'playing') return;
    
    const [row, col] = selectedCell;
    if (initialBoard[row][col] !== 0) return; // Can't change initial cells
    
    const newBoard = [...board];
    
    if (isNoteModeActive) {
      // Toggle note for this number
      const newNotes = JSON.parse(JSON.stringify(notes));
      const cellNotes = new Set(notes[row][col]);
      
      if (cellNotes.has(num)) {
        cellNotes.delete(num);
      } else {
        cellNotes.add(num);
      }
      
      newNotes[row][col] = cellNotes;
      setNotes(newNotes);
    } else {
      // Regular number placement
      newBoard[row][col] = num === newBoard[row][col] ? 0 : num;
      setBoard(newBoard);
      
      // Clear notes for this cell
      if (num !== 0) {
        const newNotes = [...notes];
        newNotes[row][col] = new Set();
        setNotes(newNotes);
      }
      
      // Check if the board is complete and correct
      if (isBoardComplete(newBoard)) {
        if (isBoardCorrect(newBoard)) {
          setGameStatus('won');
          setIsTimerRunning(false);
        }
      }
    }
  };

  const isBoardComplete = (board) => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) return false;
      }
    }
    return true;
  };

  const isBoardCorrect = (board) => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] !== solution[row][col]) return false;
      }
    }
    return true;
  };

  const useHint = () => {
    if (!selectedCell || hints <= 0 || gameStatus !== 'playing') return;
    
    const [row, col] = selectedCell;
    if (board[row][col] === solution[row][col]) return; // Already correct
    
    const newBoard = [...board];
    newBoard[row][col] = solution[row][col];
    setBoard(newBoard);
    setHints(hints - 1);
    
    // Clear notes for this cell
    const newNotes = [...notes];
    newNotes[row][col] = new Set();
    setNotes(newNotes);
    
    // Check if the board is complete and correct
    if (isBoardComplete(newBoard)) {
      if (isBoardCorrect(newBoard)) {
        setGameStatus('won');
        setIsTimerRunning(false);
      }
    }
  };

  const checkSolution = () => {
    if (gameStatus !== 'playing') return;
    
    let hasErrors = false;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] !== 0 && board[row][col] !== solution[row][col]) {
          hasErrors = true;
          break;
        }
      }
      if (hasErrors) break;
    }
    
    if (hasErrors) {
      setGameStatus('checking');
      setTimeout(() => setGameStatus('playing'), 1500);
    }
  };

  const restartGame = () => {
    setBoard(JSON.parse(JSON.stringify(initialBoard)));
    setSelectedCell(null);
    setGameStatus('playing');
    setTimer(0);
    setIsTimerRunning(true);
    setNotes(Array(9).fill().map(() => Array(9).fill().map(() => new Set())));
  };

  const toggleNoteMode = () => {
    setIsNoteModeActive(!isNoteModeActive);
  };

  const getCellClassNames = (row, col) => {
    const isInitial = initialBoard[row][col] !== 0;
    const isSelected = selectedCell && selectedCell[0] === row && selectedCell[1] === col;
    const isError = gameStatus === 'checking' && board[row][col] !== 0 && board[row][col] !== solution[row][col];
    const isSameValue = selectedCell && board[selectedCell[0]][selectedCell[1]] !== 0 && 
                        board[selectedCell[0]][selectedCell[1]] === board[row][col];
    
    const boxNumber = Math.floor(row / 3) * 3 + Math.floor(col / 3);
    const isEvenBox = boxNumber % 2 === 0;
    
    let cellClasses = 'sudoku-cell';
    if (isSelected) cellClasses += ' selected';
    if (isInitial) cellClasses += ' initial';
    if (isError) cellClasses += ' error';
    if (isSameValue && !isSelected) cellClasses += ' same-value';
    if (isEvenBox) cellClasses += ' even-box';
    return cellClasses;
  };

  return (
    <div className={`sudoku-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="sudoku-header">
        <h2>Sudoku Challenge</h2>
        <p className="sudoku-description">Train your brain with a game of Sudoku</p>
      </div>
      
      <div className="sudoku-content">
        <div className="sudoku-controls">
          <div className="difficulty-controls">
            <span>Difficulty:</span>
            <select 
              value={difficulty} 
              onChange={(e) => generateNewGame(e.target.value)}
              className="difficulty-select"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          
          <div className="game-status">
            <span className="timer">⏱️ {formatTime(timer)}</span>
            <span className="hints-counter">💡 Hints: {hints}</span>
          </div>
        </div>
          
        {gameStatus === 'won' && (
          <div className="win-message">
            <h3>🎉 Puzzle Solved! 🎉</h3>
            <p>Great job! You completed the puzzle in {formatTime(timer)}.</p>
            <button onClick={() => generateNewGame(difficulty)} className="new-game-button">
              New Game
            </button>
          </div>
        )}
        
        <div className="sudoku-board">
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className="sudoku-row">
              {row.map((cell, colIndex) => (
                <div 
                  key={`${rowIndex}-${colIndex}`}
                  className={getCellClassNames(rowIndex, colIndex)}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  {cell !== 0 ? (
                    <span className="cell-value">{cell}</span>
                  ) : (
                    <div className="notes-container">
                      {Array.from({ length: 9 }, (_, i) => i + 1).map(num => (
                        notes[rowIndex][colIndex].has(num) && (
                          <span key={num} className="note">{num}</span>
                        )
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
        
        <div className="number-pad">
          {Array.from({ length: 9 }, (_, i) => i + 1).map(num => (
            <button 
              key={num} 
              className="number-button"
              onClick={() => handleNumberInput(num)}
            >
              {num}
            </button>
          ))}
          <button 
            className="number-button erase"
            onClick={() => handleNumberInput(0)}
          >
            ⌫
          </button>
        </div>
          
        <div className="game-actions">
          <button 
            className={`note-button ${isNoteModeActive ? 'active' : ''}`}
            onClick={toggleNoteMode}
          >
            Notes
          </button>
          <button 
            className="hint-button" 
            onClick={useHint}
            disabled={hints <= 0}
          >
            Use Hint
          </button>
          <button 
            className="check-button"
            onClick={checkSolution}
          >
            Check
          </button>
          <button 
            className="restart-button"
            onClick={restartGame}
          >
            Restart
          </button>
          <button 
            className="new-game-button"
            onClick={() => generateNewGame(difficulty)}
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default SudokuGame;
