import React, { useState } from 'react';
import { FaEye, FaEyeSlash, FaSave, FaInfoCircle } from 'react-icons/fa';
import '../styles/ApiSettings.css';

const ApiSettings = ({ apiKeys, onSave, isDarkMode }) => {
  const [keys, setKeys] = useState({
    openai: apiKeys.openai || '',
    deepseek: apiKeys.deepseek || ''
  });
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showDeepSeek, setShowDeepSeek] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const handleSave = () => {
    onSave(keys);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const toggleInfo = () => {
    setShowInfo(!showInfo);
  };

  const isValidOpenAIKey = (key) => {
    return key.startsWith('sk-') && key.length > 30;
  };

  const getKeyStatus = (key, type) => {
    if (!key) return 'missing';
    if (type === 'openai' && !isValidOpenAIKey(key)) return 'invalid';
    return 'valid';
  };

  return (
    <div className={`api-settings-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="settings-header">
        <h2>API Settings</h2>
        <button className="info-button" onClick={toggleInfo} aria-label="API information">
          <FaInfoCircle />
        </button>
      </div>

      <p className="settings-description">
        Enter your API keys below to enable AI functionality. Your keys are stored locally in your browser.
      </p>

      {showInfo && (
        <div className="api-info-box fade-in">
          <h3>About API Keys</h3>
          <p>API keys are required to connect to AI services. These keys are stored only on your device and never sent to our servers.</p>
          <h4>Key Requirements:</h4>
          <ul>
            <li>OpenAI keys start with "sk-" and are 51 characters long</li>
            <li>You'll need to create an account at OpenAI or DeepSeek to get these keys</li>
            <li>Free trial credits are available for new accounts</li>
          </ul>
          <button className="close-info" onClick={toggleInfo}>Close</button>
        </div>
      )}

      <div className="api-key-section">
        <div className="api-key-header">
          <h3>OpenAI API Key</h3>
          <div className={`key-status ${getKeyStatus(keys.openai, 'openai')}`}>
            {getKeyStatus(keys.openai, 'openai') === 'valid' ? 'Valid' : 
             getKeyStatus(keys.openai, 'openai') === 'invalid' ? 'Invalid format' : 'Missing'}
          </div>
        </div>

        <div className="api-key-input">
          <div className="input-with-toggle">
            <input
              type={showOpenAI ? "text" : "password"}
              id="openai-key"
              value={keys.openai}
              onChange={(e) => setKeys({ ...keys, openai: e.target.value })}
              placeholder="Enter your OpenAI API key"
              className={getKeyStatus(keys.openai, 'openai') === 'invalid' ? 'invalid-key' : ''}
            />
            <button 
              type="button" 
              className="toggle-visibility"
              onClick={() => setShowOpenAI(!showOpenAI)}
              aria-label={showOpenAI ? "Hide API key" : "Show API key"}
            >
              {showOpenAI ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {getKeyStatus(keys.openai, 'openai') === 'invalid' && (
            <p className="key-error">OpenAI keys should start with "sk-" and be at least 30 characters long.</p>
          )}
        </div>
      </div>

      <div className="api-key-section">
        <div className="api-key-header">
          <h3>DeepSeek API Key</h3>
          <div className={`key-status ${getKeyStatus(keys.deepseek, 'deepseek')}`}>
            {keys.deepseek ? 'Provided' : 'Missing'}
          </div>
        </div>

        <div className="api-key-input">
          <div className="input-with-toggle">
            <input
              type={showDeepSeek ? "text" : "password"}
              id="deepseek-key"
              value={keys.deepseek}
              onChange={(e) => setKeys({ ...keys, deepseek: e.target.value })}
              placeholder="Enter your DeepSeek API key"
            />
            <button 
              type="button" 
              className="toggle-visibility"
              onClick={() => setShowDeepSeek(!showDeepSeek)}
              aria-label={showDeepSeek ? "Hide API key" : "Show API key"}
            >
              {showDeepSeek ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>
      </div>

      <div className="api-links">
        <h3>How to get API keys:</h3>
        <div className="api-link-cards">
          <a 
            href="https://platform.openai.com/api-keys" 
            target="_blank" 
            rel="noopener noreferrer"
            className="api-link-card"
          >
            <h4>OpenAI</h4>
            <p>Get API keys for ChatGPT and other OpenAI models</p>
          </a>
          <a 
            href="https://platform.deepseek.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="api-link-card"
          >
            <h4>DeepSeek</h4>
            <p>Access DeepSeek's AI models and services</p>
          </a>
        </div>
      </div>

      <button 
        className="save-api-keys" 
        onClick={handleSave}
        disabled={getKeyStatus(keys.openai, 'openai') === 'invalid'}
      >
        <FaSave /> Save API Keys
      </button>

      {saveSuccess && (
        <div className="save-success-message fade-in">
          API keys saved successfully!
        </div>
      )}
    </div>
  );
};

export default ApiSettings;