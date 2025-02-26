import React, { useState } from 'react';
import { searchWeb } from '../services/researchService';
import '../styles/ResearchTools.css';

const ResearchTools = ({ apiKeys, addToChat }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (query.trim() === '') return;

    setIsLoading(true);
    setError('');
    
    try {
      const searchResults = await searchWeb(query, apiKeys.openai);
      setResults(searchResults);
    } catch (err) {
      setError(`Error: ${err.message}`);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addResultToChat = (result) => {
    addToChat(`Research information: ${result.title}\n${result.snippet}\nSource: ${result.link}`);
  };

  return (
    <div className="research-container">
      <h2>Research Tools</h2>
      
      <form className="research-form" onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for information..."
          className="research-input"
        />
        <button type="submit" className="research-button" disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}
      
      <div className="research-results">
        {isLoading ? (
          <div className="loading-indicator">Searching for information...</div>
        ) : (
          results.length > 0 ? (
            results.map((result, index) => (
              <div key={index} className="result-card">
                <h3>
                  <a href={result.link} target="_blank" rel="noopener noreferrer">
                    {result.title}
                  </a>
                </h3>
                <p>{result.snippet}</p>
                <div className="result-actions">
                  <button 
                    className="add-to-chat-button"
                    onClick={() => addResultToChat(result)}
                  >
                    Add to Chat
                  </button>
                </div>
              </div>
            ))
          ) : (
            query && !error && <p>No results found. Try another search term.</p>
          )
        )}
      </div>
    </div>
  );
};

export default ResearchTools;
