import React from 'react';
import '../styles/FollowUpSuggestions.css';

const FollowUpSuggestions = ({ suggestions, onSuggestionClick, isDarkMode, isLoading }) => {
  if ((!suggestions || suggestions.length === 0) && !isLoading) return null;
  
  return (
    <div className={`follow-up-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <h4 className="follow-up-header">Follow-up questions:</h4>
      <div className="suggestions-list">
        {isLoading ? (
          <div className="suggestion-loading">
            Generating suggestions<span className="dot-animation">...</span>
          </div>
        ) : (
          suggestions.map((suggestion, index) => (
            <button 
              key={index}
              className="suggestion-button"
              onClick={() => onSuggestionClick(suggestion)}
            >
              {suggestion}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default FollowUpSuggestions;
