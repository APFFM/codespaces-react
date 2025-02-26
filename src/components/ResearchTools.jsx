import React, { useState, useEffect } from 'react';
import { FaSearch, FaTimes, FaExternalLinkAlt, FaCommentAlt, FaChevronRight, FaLightbulb, FaRobot, FaCheck, FaQuestion } from 'react-icons/fa';
import { sendMessageToOpenAI } from '../services/aiService';
import '../styles/ResearchTools.css';

// Wikipedia API helper function
const fetchFromWikipedia = async (searchTerm) => {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=8&format=json&origin=*&srsearch=${encodeURIComponent(searchTerm)}`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch from Wikipedia');
  
  const data = await response.json();
  
  if (!data.query || !data.query.search || data.query.search.length === 0) {
    return []; // Return empty array if no results
  }
  
  return data.query.search.map(item => ({
    id: item.pageid,
    title: item.title,
    snippet: item.snippet.replace(/<\/?span[^>]*>/g, ''), // Remove HTML tags
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`
  }));
};

const ResearchTools = ({ onAddToChat, isDarkMode, apiKeys }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchHistory, setSearchHistory] = useState(() => {
    const saved = localStorage.getItem('searchHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [tipsExpanded, setTipsExpanded] = useState(false);
  const [enhancedQuery, setEnhancedQuery] = useState('');
  const [isEnhancingQuery, setIsEnhancingQuery] = useState(false);
  const [suggestedQueries, setSuggestedQueries] = useState([]);
  const [clarifyingQuestions, setClarifyingQuestions] = useState([]);
  const [relevanceScores, setRelevanceScores] = useState({});
  const [isCalculatingRelevance, setIsCalculatingRelevance] = useState(false);
  const [aiSearchMode, setAiSearchMode] = useState(() => {
    const saved = localStorage.getItem('aiSearchMode');
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);

  useEffect(() => {
    localStorage.setItem('aiSearchMode', JSON.stringify(aiSearchMode));
  }, [aiSearchMode]);

  const enhanceQueryWithAI = async (originalQuery) => {
    if (!apiKeys.openai) {
      return originalQuery; // If no API key, use original query
    }
    
    setIsEnhancingQuery(true);
    try {
      const prompt = `I want to research about "${originalQuery}". Please improve my search query to get better educational results. Make sure to keep the essential keywords and concepts. Only respond with the improved search query, no explanations. Keep it concise (max 10 words).`;
      
      const enhancedQuery = await sendMessageToOpenAI([
        { role: 'system', content: 'You are a helpful search assistant that improves search queries for educational research without changing the core topic.' },
        { role: 'user', content: prompt }
      ], apiKeys.openai);
      
      // Clean up the response - remove quotes and any explanatory text
      let cleanQuery = enhancedQuery
        .replace(/^["'](.*)["']$/, '$1')  // Remove surrounding quotes
        .replace(/^I would suggest:|^Try:|^Enhanced query:|^Improved query:|^Here's an improved query:/i, '')  // Remove prefixes
        .trim();
      
      console.log(`Original query: "${originalQuery}" enhanced to: "${cleanQuery}"`);
      
      // If the enhanced query is empty or too different, fall back to the original
      if (!cleanQuery || cleanQuery.length < 2) {
        cleanQuery = originalQuery;
      }
      
      setEnhancedQuery(cleanQuery);
      return cleanQuery;
    } catch (error) {
      console.error("Error enhancing query:", error);
      return originalQuery;
    } finally {
      setIsEnhancingQuery(false);
    }
  };

  const generateRelatedQueries = async (originalQuery, results) => {
    if (!apiKeys.openai) return;
    
    try {
      const titles = results.slice(0, 3).map(r => r.title).join(", ");
      const prompt = `Based on the search query "${originalQuery}" and these result titles: ${titles}, suggest 3 alternative search queries that might help the user find more relevant educational information. Return ONLY a JSON array of strings with no additional text or explanations.`;
      
      const response = await sendMessageToOpenAI([
        { role: 'system', content: 'You are a helpful search assistant that suggests related search queries.' },
        { role: 'user', content: prompt }
      ], apiKeys.openai);
      
      try {
        // Try to parse as JSON
        const suggestions = JSON.parse(response);
        if (Array.isArray(suggestions)) {
          setSuggestedQueries(suggestions.slice(0, 3));
        } else {
          // If not an array, extract using regex
          const matches = response.match(/"([^"]+)"/g);
          if (matches) {
            setSuggestedQueries(matches.map(m => m.replace(/"/g, '')).slice(0, 3));
          }
        }
      } catch (e) {
        // If JSON parsing fails, use regex to extract suggestions
        const matches = response.match(/"([^"]+)"/g) || response.match(/\d+\.\s*(.+?)(?=\d+\.|$)/g);
        if (matches) {
          setSuggestedQueries(
            matches.map(m => m.replace(/"/g, '').replace(/^\d+\.\s*/, '').trim()).slice(0, 3)
          );
        }
      }
    } catch (error) {
      console.error("Error generating related queries:", error);
    }
  };

  const generateClarifyingQuestions = async (originalQuery) => {
    if (!apiKeys.openai) return;
    
    try {
      const prompt = `The user wants to research "${originalQuery}". Generate 2 brief clarifying questions that would help narrow down what they're looking for. Make questions concise and specific. Return ONLY a JSON array of strings with no additional text.`;
      
      const response = await sendMessageToOpenAI([
        { role: 'system', content: 'You are a helpful research assistant that helps users refine their search intentions.' },
        { role: 'user', content: prompt }
      ], apiKeys.openai);
      
      try {
        // Try to parse as JSON
        const questions = JSON.parse(response);
        if (Array.isArray(questions)) {
          setClarifyingQuestions(questions.slice(0, 2));
        } else {
          const matches = response.match(/"([^"]+)"/g);
          if (matches) {
            setClarifyingQuestions(matches.map(m => m.replace(/"/g, '')).slice(0, 2));
          }
        }
      } catch (e) {
        // If JSON parsing fails, use regex to extract questions
        const matches = response.match(/"([^"]+)"/g) || response.match(/\d+\.\s*(.+?)(?=\d+\.|$)/g);
        if (matches) {
          setClarifyingQuestions(
            matches.map(m => m.replace(/"/g, '').replace(/^\d+\.\s*/, '').trim()).slice(0, 2)
          );
        }
      }
    } catch (error) {
      console.error("Error generating clarifying questions:", error);
    }
  };

  const calculateRelevanceScores = async (originalQuery, searchResults) => {
    if (!apiKeys.openai || searchResults.length === 0) return;
    
    setIsCalculatingRelevance(true);
    
    try {
      const items = searchResults.slice(0, 6).map(item => ({
        id: item.id,
        title: item.title,
        snippet: item.snippet.substring(0, 150) // Limit snippet size
      }));
      
      const prompt = `
For the search query "${originalQuery}", rate the relevance of each result on a scale of 1-100.
Results:
${items.map((item, i) => `${i+1}. Title: ${item.title}\nSnippet: ${item.snippet}`).join('\n\n')}
Return ONLY a JSON object with result IDs as keys and relevance scores as values. Example format: {"12345": 85, "67890": 72}
      `;
      
      const response = await sendMessageToOpenAI([
        { role: 'system', content: 'You are a search relevance scoring algorithm that evaluates how relevant search results are to a query.' },
        { role: 'user', content: prompt }
      ], apiKeys.openai);
      
      try {
        // Extract JSON from response
        const jsonMatch = response.match(/\{.*\}/s);
        if (jsonMatch) {
          const scores = JSON.parse(jsonMatch[0]);
          setRelevanceScores(scores);
        }
      } catch (error) {
        console.error("Failed to parse relevance scores:", error);
      }
    } catch (error) {
      console.error("Error calculating relevance scores:", error);
    } finally {
      setIsCalculatingRelevance(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    // Add to search history (avoid duplicates)
    if (!searchHistory.includes(query.trim())) {
      setSearchHistory(prev => [query.trim(), ...prev.slice(0, 4)]);
    }

    setIsLoading(true);
    setError(null);
    setSuggestedQueries([]);
    setClarifyingQuestions([]);
    setRelevanceScores({});

    try {
      // If AI search mode is enabled, enhance the query
      let searchQuery = query;
      let enhancedSearchQuery = '';
      
      if (aiSearchMode && apiKeys.openai) {
        enhancedSearchQuery = await enhanceQueryWithAI(query);
        searchQuery = enhancedSearchQuery || query;
      }
      
      console.log(`Searching for: "${searchQuery}"`);

      // Real API call to Wikipedia
      let wikiResults = await fetchFromWikipedia(searchQuery);
      
      // If enhanced search returned no results, try with original query
      if (wikiResults.length === 0 && enhancedSearchQuery && enhancedSearchQuery !== query) {
        console.log(`Enhanced search returned no results, trying original query: "${query}"`);
        setEnhancedQuery(''); // Clear the enhanced query notification
        wikiResults = await fetchFromWikipedia(query);
      }
      
      setResults(wikiResults);
      
      if (wikiResults.length > 0) {
        // Generate related queries and clarifying questions in parallel
        if (aiSearchMode && apiKeys.openai) {
          Promise.all([
            generateRelatedQueries(query, wikiResults),
            generateClarifyingQuestions(query),
            calculateRelevanceScores(query, wikiResults)
          ]).catch(err => console.error("Error in AI enhancements:", err));
        }
      } else if (query.trim()) {
        // If no results were found with either query, show a message
        setError(`No results found for "${searchQuery}". Try different keywords.`);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(`Search failed: ${err.message || 'Unknown error'}`);
      
      // Fallback to mock results if real API fails
      const mockResults = [
        {
          id: 1,
          title: `Understanding ${query}`,
          snippet: `This article explains the core concepts of ${query} and how it relates to modern education paradigms.`,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`
        },
        {
          id: 2,
          title: `${query} in Practice`,
          snippet: `Learn how to apply ${query} in real-world scenarios with these practical examples and case studies.`,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}_practice`
        },
        {
          id: 3,
          title: `The History of ${query}`,
          snippet: `Explore the historical development of ${query} from its origins to contemporary applications.`,
          url: `https://en.wikipedia.org/wiki/History_of_${encodeURIComponent(query)}`
        }
      ];
      setResults(mockResults);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHistoryItemClick = (item) => {
    setQuery(item);
    // Auto-search when clicking a history item
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    // Auto-search when clicking a suggested query
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  const handleClarifyingQuestionClick = (question) => {
    // Add the question to chat
    onAddToChat(`[Research Question] ${question}`);
  };

  const handleClearSearch = () => {
    setQuery('');
  };

  const handleAddToChat = (result) => {
    const cleanSnippet = result.snippet.replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/<\/?[^>]+(>|$)/g, ''); // Remove HTML tags
    
    const relevanceNote = relevanceScores[result.id] 
      ? `\nRelevance Score: ${relevanceScores[result.id]}/100` 
      : '';
      
    onAddToChat(`[Research] ${result.title}\n\n${cleanSnippet}${relevanceNote}\n\nSource: ${result.url}`);
  };

  const toggleTips = () => {
    setTipsExpanded(!tipsExpanded);
  };

  const toggleAiSearch = () => {
    setAiSearchMode(!aiSearchMode);
  };
  
  // Sort results by relevance score if available
  const sortedResults = [...results].sort((a, b) => {
    if (relevanceScores[a.id] && relevanceScores[b.id]) {
      return relevanceScores[b.id] - relevanceScores[a.id];
    }
    return 0;
  });

  return (
    <div className={`research-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="research-header">
        <h2>Research Tools</h2>
        <p className="research-description">Find information from trusted sources to enhance your learning</p>
      </div>

      <div className="research-content">
        <div className="search-section">
          <div className="search-options">
            <label className="ai-search-toggle">
              <input 
                type="checkbox" 
                checked={aiSearchMode} 
                onChange={toggleAiSearch}
                disabled={!apiKeys.openai}
              />
              <span className="ai-toggle-label">
                <FaRobot /> AI-Enhanced Search
              </span>
              {!apiKeys.openai && (
                <span className="missing-api-warning">
                  (Requires OpenAI API key)
                </span>
              )}
            </label>
          </div>

          <form className="research-form" onSubmit={handleSearch}>
            <div className="search-input-wrapper">
              <input
                className="research-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter a topic to research..."
              />
              {query && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                >
                  <FaTimes />
                </button>
              )}
            </div>
            <button
              className="research-button"
              type="submit"
              disabled={!query.trim() || isLoading}
            >
              <FaSearch /> {isLoading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {aiSearchMode && enhancedQuery && query !== enhancedQuery && (
            <div className="enhanced-query-notice">
              <FaRobot /> Search enhanced to: <strong>"{enhancedQuery}"</strong>
            </div>
          )}

          {searchHistory.length > 0 && (
            <div className="search-history">
              <h3>Recent Searches</h3>
              <div className="history-items">
                {searchHistory.map((item, index) => (
                  <button
                    key={index}
                    className="history-item"
                    onClick={() => handleHistoryItemClick(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Clarifying questions section */}
        {clarifyingQuestions.length > 0 && (
          <div className="clarifying-questions">
            <h3><FaQuestion /> To narrow your search</h3>
            <div className="questions-list">
              {clarifyingQuestions.map((question, index) => (
                <button
                  key={index}
                  className="clarifying-question"
                  onClick={() => handleClarifyingQuestionClick(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            <FaTimes /> {error}
          </div>
        )}

        <div className="results-section">
          {isLoading ? (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Searching educational resources...</p>
              {isEnhancingQuery && (
                <p className="enhancing-text"><FaRobot /> Enhancing your query with AI...</p>
              )}
              {isCalculatingRelevance && (
                <p className="enhancing-text"><FaRobot /> Analyzing result relevance...</p>
              )}
            </div>
          ) : sortedResults.length > 0 ? (
            <>
              <div className="results-header">
                <h3>Search Results</h3>
                <span className="results-count">{sortedResults.length} sources found</span>
              </div>
              <div className="results-grid">
                {sortedResults.map((result) => (
                  <div key={result.id} className="result-card">
                    <h3>
                      <a href={result.url} target="_blank" rel="noopener noreferrer">
                        {result.title}
                        <FaExternalLinkAlt className="external-link-icon" />
                      </a>
                    </h3>
                    {relevanceScores[result.id] && (
                      <div 
                        className={`relevance-badge ${
                          relevanceScores[result.id] > 80 ? 'high' : 
                          relevanceScores[result.id] > 50 ? 'medium' : 'low'
                        }`}
                      >
                        <FaCheck /> Relevance: {relevanceScores[result.id]}%
                      </div>
                    )}
                    <p dangerouslySetInnerHTML={{ __html: result.snippet }} />
                    <div className="result-actions">
                      <button
                        className="add-to-chat-button"
                        onClick={() => handleAddToChat(result)}
                      >
                        <FaCommentAlt /> Add to Chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Suggested related queries */}
              {suggestedQueries.length > 0 && (
                <div className="suggested-queries">
                  <h3>Related searches</h3>
                  <div className="suggestions-list">
                    {suggestedQueries.map((suggestion, index) => (
                      <button
                        key={index}
                        className="suggestion-button"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : query && !isLoading ? (
            <div className="no-results">
              <p>No results found for "{query}". Try different keywords or check your spelling.</p>
            </div>
          ) : null}
        </div>

        <div className="research-tips-section">
          <button 
            className={`research-tips-toggle ${tipsExpanded ? 'expanded' : ''}`} 
            onClick={toggleTips}
          >
            <FaChevronRight /> <FaLightbulb /> Research Tips
          </button>
          
          <div className={`research-tips-content ${tipsExpanded ? 'expanded' : ''}`}>
            <div className="research-tips">
              <h3>How to Research Effectively</h3>
              <ul>
                <li>Use specific keywords rather than full questions</li>
                <li>Try different combinations of terms for better results</li>
                <li>Look for academic sources for reliable information</li>
                <li>Compare multiple sources to verify information</li>
                <li>Use quotes around phrases to find exact matches</li>
                {apiKeys.openai && (
                  <li>Enable AI-Enhanced Search for improved query optimization and relevance scoring</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchTools;