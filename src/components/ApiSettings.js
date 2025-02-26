import React, { useState } from 'react';
import '../styles/ApiSettings.css';

const ApiSettings = ({ apiKeys, onSave }) => {
  const [keys, setKeys] = useState({
    openai: apiKeys.openai || '',
    deepseek: apiKeys.deepseek || ''
  });
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showDeepSeek, setShowDeepSeek] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    onSave(keys);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="api-settings-container">
      <h2>API Settings</h2>
      <p className="settings-description">
        Enter your API keys below to enable AI functionality. Your keys are stored locally in your browser.
      </p>

      <div className="api-key-input">
        <label htmlFor="openai-key">OpenAI API Key</label>
        <div className="input-with-toggle">
          <input
            type={showOpenAI ? "text" : "password"}
            id="openai-key"
            value={keys.openai}
            onChange={(e) => setKeys({ ...keys, openai: e.target.value })}
            placeholder="Enter your OpenAI API key"
          />
          <button 
            type="button" 
            className="toggle-visibility"
            onClick={() => setShowOpenAI(!showOpenAI)}
          >
            {showOpenAI ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <div className="api-key-input">
        <label htmlFor="deepseek-key">DeepSeek API Key</label>
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
          >
            {showDeepSeek ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <div className="api-links">
        <h3>How to get API keys:</h3>
        <ul>
          <li>
            <a 
              href="https://platform.openai.com/api-keys" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Get OpenAI API Key
            </a>
          </li>
          <li>
            <a 
              href="https://platform.deepseek.com/" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Get DeepSeek API Key
            </a>
          </li>
        </ul>
      </div>

      <button className="save-api-keys" onClick={handleSave}>
        Save API Keys
      </button>

      {saveSuccess && (
        <div className="save-success-message">
          API keys saved successfully!
        </div>
      )}
    </div>
  );
};

export default ApiSettings;
