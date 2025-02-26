// Function to generate a complete solved Sudoku grid
function generateSolvedGrid() {
  // Start with an empty grid
  const grid = Array(9).fill().map(() => Array(9).fill(0));

  // Helper to check if number can be placed at the given position
  const isValid = (grid, row, col, num) => {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (grid[row][x] === num) return false;
    }
    
    // Check column
    for (let y = 0; y < 9; y++) {
      if (grid[y][col] === num) return false;
    }
    
    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let y = boxRow; y < boxRow + 3; y++) {
      for (let x = boxCol; x < boxCol + 3; x++) {
        if (grid[y][x] === num) return false;
      }
    }
    
    return true;
  };

  // Recursively fill the grid
  const fillGrid = (grid) => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          // Try different numbers in random order
          const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
          shuffleArray(nums);
          
          for (const num of nums) {
            if (isValid(grid, row, col, num)) {
              grid[row][col] = num;
              
              if (fillGrid(grid)) {
                return true;
              }
              
              // If we couldn't complete the grid, backtrack
              grid[row][col] = 0;
            }
          }
          
          return false;
        }
      }
    }
    
    return true;
  };

  fillGrid(grid);
  return grid;
}

// Helper function to shuffle array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Create a puzzle by removing numbers from the solution
function createPuzzle(solution, difficulty) {
  // Create a copy of the solution
  const puzzle = solution.map(row => [...row]);
  
  // Define how many cells to remove based on difficulty
  const cellsToRemove = {
    easy: 30,
    medium: 45,
    hard: 55
  };
  
  let removed = 0;
  while (removed < cellsToRemove[difficulty]) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);
    
    if (puzzle[row][col] !== 0) {
      puzzle[row][col] = 0;
      removed++;
    }
  }
  
  return puzzle;
}

// Main function to generate a Sudoku puzzle
export function generateSudoku(difficulty) {
  const solution = generateSolvedGrid();
  const puzzle = createPuzzle(solution, difficulty);
  
  return {
    puzzle,
    solution
  };
}

// Function to check if the user's solution is correct
export function checkSolution(board) {
  // Check rows
  for (let row = 0; row < 9; row++) {
    const rowSet = new Set();
    for (let col = 0; col < 9; col++) {
      const val = board[row][col];
      if (val === 0 || rowSet.has(val)) {
        return false;
      }
      rowSet.add(val);
    }
  }
  
  // Check columns
  for (let col = 0; col < 9; col++) {
    const colSet = new Set();
    for (let row = 0; row < 9; row++) {
      const val = board[row][col];
      if (val === 0 || colSet.has(val)) {
        return false;
      }
      colSet.add(val);
    }
  }
  
  // Check 3x3 boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const boxSet = new Set();
      for (let row = boxRow * 3; row < boxRow * 3 + 3; row++) {
        for (let col = boxCol * 3; col < boxCol * 3 + 3; col++) {
          const val = board[row][col];
          if (val === 0 || boxSet.has(val)) {
            return false;
          }
          boxSet.add(val);
        }
      }
    }
  }
  
  return true;
}
