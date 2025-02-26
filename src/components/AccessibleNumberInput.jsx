import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const AccessibleNumberInput = ({ numbers, onNumberSelected, isEraseEnabled }) => {
  const gridRef = useRef(null);
  
  // Handle keyboard navigation within the number grid
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gridRef.current) return;
      
      const currentEl = document.activeElement;
      if (!currentEl || !gridRef.current.contains(currentEl)) return;
      
      const buttons = Array.from(gridRef.current.querySelectorAll('button'));
      const currentIndex = buttons.indexOf(currentEl);
      
      if (currentIndex === -1) return;
      
      // Arrow key navigation
      let nextIndex;
      const columns = 3; // 3x3 grid
      
      switch (e.key) {
        case 'ArrowRight':
          nextIndex = Math.min(buttons.length - 1, currentIndex + 1);
          break;
        case 'ArrowLeft':
          nextIndex = Math.max(0, currentIndex - 1);
          break;
        case 'ArrowDown':
          nextIndex = Math.min(buttons.length - 1, currentIndex + columns);
          break;
        case 'ArrowUp':
          nextIndex = Math.max(0, currentIndex - columns);
          break;
        default:
          return; // Not an arrow key
      }
      
      e.preventDefault();
      buttons[nextIndex].focus();
    };
    
    const grid = gridRef.current;
    if (grid) {
      grid.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      if (grid) {
        grid.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, []);
  
  return (
    <div className="number-pad-grid">
      <div className="number-grid" ref={gridRef} role="group" aria-label="Number input buttons">
        {numbers.map(num => (
          <button 
            key={num} 
            className="number-button-grid"
            onClick={() => onNumberSelected(num)}
            aria-label={`Input number ${num}`}
            tabIndex={0}
          >
            {num}
          </button>
        ))}
      </div>
      {isEraseEnabled && (
        <button 
          className="erase-button-wide"
          onClick={() => onNumberSelected(0)}
          aria-label="Erase cell"
        >
          ⌫ Erase
        </button>
      )}
    </div>
  );
};

AccessibleNumberInput.propTypes = {
  numbers: PropTypes.arrayOf(PropTypes.number).isRequired,
  onNumberSelected: PropTypes.func.isRequired,
  isEraseEnabled: PropTypes.bool
};

AccessibleNumberInput.defaultProps = {
  isEraseEnabled: true
};

export default AccessibleNumberInput;
