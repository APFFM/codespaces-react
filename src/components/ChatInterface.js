import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToOpenAI, sendMessageToDeepSeek } from '../services/aiService';
import '../styles/ChatInterface.css';

const ChatInterface = ({ messages, setMessages, apiKeys }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('openai');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return;

    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let response;
      if (selectedModel === 'openai') {
        if (!apiKeys.openai) {
          throw new Error('OpenAI API key is missing. Please add it in Settings.');
        }
        response = await sendMessageToOpenAI([...messages, userMessage], apiKeys.openai);
      } else {
        if (!apiKeys.deepseek) {
          throw new Error('DeepSeek API key is missing. Please add it in Settings.');
        }
        response = await sendMessageToDeepSeek([...messages, userMessage], apiKeys.deepseek);
      }

      setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prevMessages => [
        ...prevMessages, 
        { role: 'assistant', content: `Error: ${error.message}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="model-selector">
        <label>
          <input
            type="radio"
            value="openai"
            checked={selectedModel === 'openai'}
            onChange={() => setSelectedModel('openai')}
          />
          OpenAI
        </label>
        <label>
          <input
            type="radio"
            value="deepseek"
            checked={selectedModel === 'deepseek'}
            onChange={() => setSelectedModel('deepseek')}
          />
          DeepSeek
        </label>
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`message ${message.role === 'user' ? 'user-message' : 'ai-message'}`}
          >
            <div className="message-content">
              {message.content.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message ai-message">
            <div className="message-content">
              <p className="typing-indicator">Thinking...</p>
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
          placeholder="Ask me anything..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        ></textarea>
        <button className="send-button" type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;
