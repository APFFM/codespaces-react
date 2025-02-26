import React, { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * Optimized Cell Component for Sudoku Grid
 * Prevents unnecessary re-renders with React.memo
 */
const OptimizedCell = memo(function OptimizedCell({
  value,
  notes,
  row,
  col,
  isInitial,
  isSelected,
  isError,
  isSameValue,
  isEvenBox,
  onClick
}) {
  // Determine CSS classes for styling
  const getCellClasses = () => {
    let cellClasses = 'sudoku-cell';
    if (isSelected) cellClasses += ' selected';
    if (isInitial) cellClasses += ' initial';
    if (isError) cellClasses += ' error';
    if (isSameValue && !isSelected) cellClasses += ' same-value';
    if (isEvenBox) cellClasses += ' even-box';
    return cellClasses;
  };

  const handleClick = () => {
    onClick(row, col);
  };

  return (
    <div 
      className={getCellClasses()}
      onClick={handleClick}
      data-testid={`cell-${row}-${col}`}
    >
      {value !== 0 ? (
        <span className="cell-value">{value}</span>
      ) : (
        <div className="notes-container">
          {Array.from({ length: 9 }, (_, i) => i + 1).map(num => (
            notes && notes.has(num) && (
              <span key={num} className="note">{num}</span>
            )
          ))}
        </div>
      )}
    </div>
  );
});

OptimizedCell.propTypes = {
  value: PropTypes.number.isRequired,
  notes: PropTypes.object, // Set of notes
  row: PropTypes.number.isRequired,
  col: PropTypes.number.isRequired,
  isInitial: PropTypes.bool.isRequired,
  isSelected: PropTypes.bool.isRequired,
  isError: PropTypes.bool.isRequired,
  isSameValue: PropTypes.bool.isRequired,
  isEvenBox: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired
};

export default OptimizedCell;
