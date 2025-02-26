import { useState, useCallback, useEffect } from 'react';
import useLocalStorage from './useLocalStorage';

/**
 * Custom hook that encapsulates Sudoku game logic
 * 
 * @param {string} difficultyLevel - Initial difficulty level
 * @returns {Object} Sudoku state and functions
 */
function useSudoku(difficultyLevel = 'medium') {
  // Game state
  const [board, setBoard] = useState(Array(9).fill().map(() => Array(9).fill(0)));
  const [solution, setSolution] = useState(Array(9).fill().map(() => Array(9).fill(0)));
  const [initialBoard, setInitialBoard] = useState(Array(9).fill().map(() => Array(9).fill(0)));
  const [selectedCell, setSelectedCell] = useState(null);
  const [difficulty, setDifficulty] = useState(difficultyLevel);
  const [gameStatus, setGameStatus] = useState('playing');
  const [hints, setHints] = useState(3);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [notes, setNotes] = useState(Array(9).fill().map(() => Array(9).fill().map(() => new Set())));
  const [isNoteModeActive, setIsNoteModeActive] = useState(false);
  const [message, setMessage] = useState('');
  
  // Persist game progress
  const [savedGameState, setSavedGameState] = useLocalStorage('sudoku_game_state', null);

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

  // Load saved game on mount
  useEffect(() => {
    if (savedGameState) {
      try {
        setBoard(savedGameState.board);
        setSolution(savedGameState.solution);
        setInitialBoard(savedGameState.initialBoard);
        setDifficulty(savedGameState.difficulty);
        setTimer(savedGameState.timer);
        setHints(savedGameState.hints);
        setNotes(savedGameState.notes);
        setGameStatus(savedGameState.gameStatus);
        
        if (savedGameState.gameStatus === 'playing') {
          setIsTimerRunning(true);
        }
        
        return; // Don't generate a new game
      } catch (e) {
        console.error("Failed to load saved game:", e);
      }
    }
    
    // If no saved game or loading fails, generate a new game
    generateNewGame(difficulty);
  }, []);

  // Periodically save game state
  useEffect(() => {
    if (gameStatus !== 'initial') {
      const gameState = {
        board,
        solution,
        initialBoard,
        difficulty,
        timer,
        hints,
        notes,
        gameStatus
      };
      setSavedGameState(gameState);
    }
  }, [board, solution, initialBoard, difficulty, timer, hints, notes, gameStatus]);

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

  // ... other utility functions (createPlayableBoard, solveSudoku, etc.) ...

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
    
    // Clear saved game when starting a new one
    setSavedGameState(null);
  };

  // ... other game logic functions (handleCellClick, handleNumberInput, etc.) ...

  return {
    // Game state
    board,
    solution,
    initialBoard,
    selectedCell,
    difficulty,
    gameStatus,
    hints,
    timer,
    isTimerRunning,
    notes,
    isNoteModeActive,
    message,
    
    // Functions
    setSelectedCell,
    generateNewGame,
    handleNumberInput,
    useHint,
    checkSolution,
    restartGame,
    toggleNoteMode,
    formatTime,
    
    // Helper functions
    getCellClassNames, // Function to determine cell CSS classes
    isBoardComplete,
    isBoardCorrect
  };
}

export default useSudoku;
