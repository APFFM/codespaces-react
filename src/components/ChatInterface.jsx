import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToOpenAI, sendMessageToDeepSeek, generateFollowUpQuestions } from '../services/aiService.js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import FollowUpSuggestions from './FollowUpSuggestions';
import { FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';
import '../styles/ChatInterface.css';

const ChatInterface = ({ messages, setMessages, apiKeys, isDarkMode }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(localStorage.getItem('preferred_model') || 'openai');
  const [followUpSuggestions, setFollowUpSuggestions] = useState({});
  const [isGeneratingFollowUps, setIsGeneratingFollowUps] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('preferred_model', selectedModel);
  }, [selectedModel]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return;
    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setIsLoading(true);
    try {
      let response;
      let activeApiKey;
      
      if (selectedModel === 'openai') {
        if (!apiKeys.openai) {
          throw new Error('OpenAI API key is missing. Please add it in Settings.');
        }
        activeApiKey = apiKeys.openai;
        response = await sendMessageToOpenAI([...messages, userMessage], activeApiKey);
      } else {
        if (!apiKeys.deepseek) {
          throw new Error('DeepSeek API key is missing. Please add it in Settings.');
        }
        activeApiKey = apiKeys.deepseek;
        response = await sendMessageToDeepSeek([...messages, userMessage], activeApiKey);
      }
      
      const responseTimestamp = new Date().toISOString();
      
      setMessages(prevMessages => [...prevMessages, { 
        role: 'assistant', 
        content: response,
        timestamp: responseTimestamp
      }]);
      
      // Generate follow-up questions using AI if OpenAI API key is available
      if (apiKeys.openai) {
        setIsGeneratingFollowUps(true);
        try {
          const followUps = await generateFollowUpQuestions(response, apiKeys.openai);
          
          setFollowUpSuggestions(prev => ({
            ...prev,
            [responseTimestamp]: followUps
          }));
        } catch (err) {
          console.error('Error generating follow-up questions:', err);
          // Fallback to default questions
          setFollowUpSuggestions(prev => ({
            ...prev,
            [responseTimestamp]: ['Tell me more about this', 'Can you provide examples?', 'What are the implications?']
          }));
        } finally {
          setIsGeneratingFollowUps(false);
        }
      }
    } catch (error) {
      setMessages(prevMessages => [
        ...prevMessages,
        { 
          role: 'assistant', 
          content: `Error: ${error.message}`,
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      handleClearChat();
    }
  };

  const handleClearChat = () => {
    setShowClearConfirmation(true);
  };

  const confirmClearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Hello! I'm your personal teacher AI. What would you like to learn today?",
      timestamp: new Date().toISOString()
    }]);
    setFollowUpSuggestions({});
    setShowClearConfirmation(false);
  };

  const cancelClearChat = () => {
    setShowClearConfirmation(false);
  };

  const handleFollowUpClick = (question) => {
    setInput(question);
    document.querySelector('.chat-input').focus();
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`chat-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="model-selector">
        <label className={selectedModel === 'openai' ? 'selected' : ''}>
          <input
            type="radio"
            value="openai"
            checked={selectedModel === 'openai'}
            onChange={() => setSelectedModel('openai')}
          />
          <span className="model-name">OpenAI</span>
        </label>
        <label className={selectedModel === 'deepseek' ? 'selected' : ''}>
          <input
            type="radio"
            value="deepseek"
            checked={selectedModel === 'deepseek'}
            onChange={() => setSelectedModel('deepseek')}
          />
          <span className="model-name">DeepSeek</span>
        </label>
        <button 
          className="clear-history-button" 
          onClick={handleClearChat}
          aria-label="Clear chat history"
          title="Clear chat history"
        >
          <FaTrash />
        </button>
      </div>
      
      {showClearConfirmation && (
        <div className="confirmation-modal">
          <div className="confirmation-content">
            <div className="confirmation-header">
              <FaExclamationTriangle className="warning-icon" />
              <h3>Clear Chat History</h3>
            </div>
            <p>Are you sure you want to clear the chat history? This action cannot be undone.</p>
            <div className="confirmation-actions">
              <button className="cancel-button" onClick={cancelClearChat}>Cancel</button>
              <button className="confirm-button" onClick={confirmClearChat}>Clear History</button>
            </div>
          </div>
        </div>
      )}
      
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message-container ${message.role === 'user' ? 'user-container' : 'ai-container'}`}>
            <div 
              className={`message ${message.role === 'user' ? 'user-message' : 'ai-message'} fade-in`}
            >
              <div className="message-header">
                <span className="message-role">{message.role === 'user' ? 'You' : 'AI Teacher'}</span>
                {message.timestamp && <span className="message-time">{formatTimestamp(message.timestamp)}</span>}
              </div>
              <div className="message-content">
                {message.role === 'user' ? (
                  <p>{message.content}</p>
                ) : (
                  <ReactMarkdown
                    children={message.content}
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex, rehypeHighlight]}
                    components={{
                      a: ({node, ...props}) => <a target="_blank" rel="noopener noreferrer" {...props} />
                    }}
                  />
                )}
              </div>
            </div>
            
            {message.role === 'assistant' && message.timestamp && followUpSuggestions[message.timestamp] && (
              <FollowUpSuggestions 
                suggestions={followUpSuggestions[message.timestamp]} 
                onSuggestionClick={handleFollowUpClick}
                isDarkMode={isDarkMode}
                isLoading={isGeneratingFollowUps && messages[messages.length-1]?.timestamp === message.timestamp}
              />
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="message-container ai-container">
            <div className="message ai-message fade-in">
              <div className="message-header">
                <span className="message-role">AI Teacher</span>
              </div>
              <div className="message-content">
                <p className="typing-indicator">Thinking<span>.</span><span>.</span><span>.</span></p>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <textarea
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything... (Shift+Enter for new line, Ctrl+L to clear chat)"
          onKeyDown={handleKeyDown}
        />
        <button 
          className="send-button" 
          type="submit" 
          disabled={isLoading || !input.trim()}
          aria-label="Send message"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;