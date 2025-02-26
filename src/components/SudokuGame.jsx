import React, { useState, useEffect, useCallback } from 'react';
import '../styles/SudokuGame.css';
import SudokuNotepad from './SudokuNotepad';
import { FaBookOpen, FaPen, FaStickyNote } from 'react-icons/fa';

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
  const [message, setMessage] = useState('');
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);
  const [notepadContent, setNotepadContent] = useState('');
  const [notepadType, setNotepadType] = useState('text');
  const [drawingImage, setDrawingImage] = useState(null);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [notesHistory, setNotesHistory] = useState(() => {
    const savedNotes = localStorage.getItem('sudoku_notes_history');
    try {
      return savedNotes ? JSON.parse(savedNotes) : [];
    } catch (e) {
      console.error("Failed to parse saved notes:", e);
      return [];
    }
  });
  const [latestDrawing, setLatestDrawing] = useState(null);

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
    setMessage('');
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
    if (gameStatus !== 'playing') return;
    
    setSelectedCell([row, col]);
    
    // Show message if trying to modify an initial cell
    if (initialBoard[row][col] !== 0) {
      setMessage('This is a fixed cell and cannot be changed');
      setTimeout(() => setMessage(''), 2000);
    } else {
      setMessage('');
    }
  };

  const handleNumberInput = useCallback((num) => {
    if (!selectedCell || gameStatus !== 'playing') return;
    
    const [row, col] = selectedCell;
    if (initialBoard[row][col] !== 0) {
      setMessage('This is a fixed cell and cannot be changed');
      setTimeout(() => setMessage(''), 2000);
      return;
    }
    
    if (isNoteModeActive) {
      // Toggle note for this number
      const newNotes = JSON.parse(JSON.stringify(notes));
      const cellNotes = new Set([...notes[row][col]]);
      
      if (cellNotes.has(num)) {
        cellNotes.delete(num);
        setMessage(`Removed note ${num} from cell`);
      } else {
        cellNotes.add(num);
        setMessage(`Added note ${num} to cell`);
      }
      
      newNotes[row][col] = cellNotes;
      setNotes(newNotes);
      
      // Clear the message after a brief delay
      setTimeout(() => setMessage(''), 1000);
    } else {
      // Regular number placement
      const newBoard = [...board];
      
      if (newBoard[row][col] === num) {
        newBoard[row][col] = 0;
        setMessage(`Cleared cell`);
      } else {
        newBoard[row][col] = num;
        setMessage(`Placed ${num} in cell`);
        
        // Clear notes for this cell
        const newNotes = [...notes];
        newNotes[row][col] = new Set();
        setNotes(newNotes);
      }
      
      setBoard(newBoard);
      
      // Clear the message after a brief delay
      setTimeout(() => setMessage(''), 1000);
      
      // Check if the board is complete and correct
      if (isBoardComplete(newBoard)) {
        if (isBoardCorrect(newBoard)) {
          setGameStatus('won');
          setIsTimerRunning(false);
        }
      }
    }
  }, [selectedCell, gameStatus, initialBoard, isNoteModeActive, notes, board]);

  // Add keyboard support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameStatus !== 'playing' || !selectedCell) return;
      
      // Number keys 1-9
      if (e.key >= '1' && e.key <= '9') {
        handleNumberInput(parseInt(e.key));
      }
      // Backspace or Delete to clear cell
      else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleNumberInput(0);
      }
      // Arrow keys to navigate
      else if (e.key.startsWith('Arrow')) {
        const [row, col] = selectedCell;
        let newRow = row;
        let newCol = col;
        
        if (e.key === 'ArrowUp') newRow = Math.max(0, row - 1);
        else if (e.key === 'ArrowDown') newRow = Math.min(8, row + 1);
        else if (e.key === 'ArrowLeft') newCol = Math.max(0, col - 1);
        else if (e.key === 'ArrowRight') newCol = Math.min(8, col + 1);
        
        setSelectedCell([newRow, newCol]);
      }
      // 'N' key to toggle notes mode
      else if (e.key.toLowerCase() === 'n') {
        toggleNoteMode();
      }
      // 'H' key to use hint
      else if (e.key.toLowerCase() === 'h') {
        useHint();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, gameStatus, handleNumberInput]);

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
    if (!selectedCell || hints <= 0 || gameStatus !== 'playing') {
      if (hints <= 0) {
        setMessage('No hints remaining');
        setTimeout(() => setMessage(''), 2000);
      } else if (!selectedCell) {
        setMessage('Select a cell first to use a hint');
        setTimeout(() => setMessage(''), 2000);
      }
      return;
    }
    
    const [row, col] = selectedCell;
    if (board[row][col] === solution[row][col]) {
      setMessage('This cell is already correct');
      setTimeout(() => setMessage(''), 2000);
      return; // Already correct
    }
    
    const newBoard = [...board];
    newBoard[row][col] = solution[row][col];
    setBoard(newBoard);
    setHints(hints - 1);
    
    setMessage(`Hint used: The correct number is ${solution[row][col]} (${hints-1} hints left)`);
    setTimeout(() => setMessage(''), 3000);
    
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
    let errorCells = [];
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] !== 0 && board[row][col] !== solution[row][col]) {
          hasErrors = true;
          errorCells.push([row, col]);
        }
      }
    }
    
    if (hasErrors) {
      setGameStatus('checking');
      setMessage(`Found ${errorCells.length} incorrect numbers`);
      setTimeout(() => {
        setGameStatus('playing');
        setMessage('');
      }, 2000);
    } else {
      setMessage('All filled cells are correct so far');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const restartGame = () => {
    setBoard(JSON.parse(JSON.stringify(initialBoard)));
    setSelectedCell(null);
    setGameStatus('playing');
    setTimer(0);
    setIsTimerRunning(true);
    setNotes(Array(9).fill().map(() => Array(9).fill().map(() => new Set())));
    setMessage('Game restarted');
    setTimeout(() => setMessage(''), 2000);
  };

  const toggleNoteMode = () => {
    setIsNoteModeActive(!isNoteModeActive);
    setMessage(isNoteModeActive ? 'Number mode activated' : 'Notes mode activated');
    setTimeout(() => setMessage(''), 2000);
  };

  const toggleNotepad = (noteId = null) => {
    if (noteId) {
      setActiveNoteId(noteId);
    } else {
      setActiveNoteId(null);
    }
    setIsNotepadOpen(!isNotepadOpen);
  };

  const handleNotepadSave = (updatedNotes, activeNote) => {
    setNotesHistory(updatedNotes);
    localStorage.setItem('sudoku_notes_history', JSON.stringify(updatedNotes));
    
    // If active note is a drawing, update latest drawing for preview
    if (activeNote && activeNote.type === 'drawing') {
      setLatestDrawing(activeNote);
    }
  };

  useEffect(() => {
    const savedNotes = localStorage.getItem('sudoku_notes');
    const savedNotesType = localStorage.getItem('sudoku_notes_type');
    
    if (savedNotes) {
      setNotepadContent(savedNotes);
      setNotepadType(savedNotesType || 'text');
      
      if (savedNotesType === 'drawing') {
        setDrawingImage(savedNotes);
      }
    }
  }, []);

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

  const latestTextNote = notesHistory.find(note => note.type === 'text');
  const latestDrawingNote = notesHistory.find(note => note.type === 'drawing');

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
          
        {message && (
          <div className="game-message">
            <p>{message}</p>
          </div>
        )}
        
        {gameStatus === 'won' && (
          <div className="win-message">
            <h3>🎉 Puzzle Solved! 🎉</h3>
            <p>Great job! You completed the puzzle in {formatTime(timer)}.</p>
            <button onClick={() => generateNewGame(difficulty)} className="new-game-button">
              New Game
            </button>
          </div>
        )}
        
        {/* Redesigned Game Area with Notepad button */}
        <div className="game-area">
          {/* LEFT SIDE: Game action buttons */}
          <div className="actions-panel-left">
            <button 
              className={`note-button ${isNoteModeActive ? 'active' : ''}`}
              onClick={toggleNoteMode}
              title="Toggle between placing numbers and notes (N)"
            >
              <FaPen /> Notes {isNoteModeActive ? '(ON)' : '(OFF)'}
            </button>
            <button
              className="notepad-open-button"
              onClick={() => toggleNotepad()}
              title="Open notepad for free-form notes"
            >
              <FaBookOpen /> Notepad {notesHistory.length > 0 && `(${notesHistory.length})`}
            </button>
            <button 
              className="hint-button" 
              onClick={useHint}
              disabled={hints <= 0}
              title="Get a hint for the selected cell (H)"
            >
              Use Hint
            </button>
            <button 
              className="check-button"
              onClick={checkSolution}
              title="Check if your numbers are correct"
            >
              Check
            </button>
            <button 
              className="restart-button"
              onClick={restartGame}
              title="Restart current puzzle"
            >
              Restart
            </button>
            <button 
              className="new-game-button"
              onClick={() => generateNewGame(difficulty)}
              title="Start a new puzzle"
            >
              New Game
            </button>
          </div>
          
          {/* CENTER: Sudoku board */}
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
                          notes[rowIndex] && notes[rowIndex][colIndex] && 
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
          
          {/* RIGHT SIDE: Number pad buttons in 3x3 grid plus erase button */}
          <div className="number-pad-grid">
            <div className="number-grid">
              {Array.from({ length: 9 }, (_, i) => i + 1).map(num => (
                <button 
                  key={num} 
                  className="number-button-grid"
                  onClick={() => handleNumberInput(num)}
                >
                  {num}
                </button>
              ))}
            </div>
            <button 
              className="erase-button-wide"
              onClick={() => handleNumberInput(0)}
              title="Erase cell"
            >
              ⌫ Erase
            </button>
          </div>
        </div>
        
        {/* Enhanced Notepad Component */}
        <SudokuNotepad 
          isOpen={isNotepadOpen}
          onClose={() => setIsNotepadOpen(false)}
          onSave={handleNotepadSave}
          isDarkMode={isDarkMode}
          initialNotes={notesHistory}
          activeNoteId={activeNoteId}
        />
        
        {/* Notes Preview Section - display latest notes */}
        {notesHistory.length > 0 && (
          <div className="notes-preview-section">
            {latestTextNote && (
              <div 
                className="note-preview text-preview" 
                onClick={() => toggleNotepad(latestTextNote.id)}
                title="Click to edit this note"
              >
                <div className="note-preview-header">
                  <FaStickyNote /> {latestTextNote.title || 'Latest Note'}
                </div>
                <div className="note-preview-content">
                  {latestTextNote.content?.substring(0, 60) || 'Empty note'}
                  {latestTextNote.content?.length > 60 ? '...' : ''}
                </div>
              </div>
            )}

            {latestDrawingNote && (
              <div 
                className="note-preview drawing-preview"
                onClick={() => toggleNotepad(latestDrawingNote.id)}
                title="Click to edit this drawing"
              >
                <div className="note-preview-header">
                  <FaPen /> {latestDrawingNote.title || 'Latest Drawing'}
                </div>
                <img 
                  src={latestDrawingNote.content} 
                  alt="Your drawing"
                  className="drawing-thumbnail"
                />
              </div>
            )}
          </div>
        )}
        
        <div className="keyboard-shortcuts-info">
          <h4>Keyboard Controls</h4>
          <ul>
            <li>Numbers 1-9: Place number or toggle note</li>
            <li>Backspace/Delete: Clear cell</li>
            <li>Arrow keys: Navigate board</li>
            <li>N: Toggle note mode</li>
            <li>H: Use hint on selected cell</li>
            <li>Tab + Enter: Open notepad</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SudokuGame;
