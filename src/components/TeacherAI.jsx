import React, { useState, useContext } from 'react';
import ChatInterface from './ChatInterface.jsx';
import ResearchTools from './ResearchTools.jsx';
import VoiceInteraction from './VoiceInteraction.jsx';
import ApiSettings from './ApiSettings.jsx';
import SudokuGame from './SudokuGame.jsx';
import AIChartTab from './AIChartTab.jsx';
import ResearchChartTab from './ResearchChartTab.jsx';
import { ThemeContext } from '../context/ThemeContext.jsx';
import { FaMoon, FaSun, FaKeyboard, FaGamepad, FaChartLine, FaSearch, FaChartBar } from 'react-icons/fa';
import '../styles/TeacherAI.css';

const TeacherAI = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [apiKeys, setApiKeys] = useState({
    openai: localStorage.getItem('openai_api_key') || '',
    deepseek: localStorage.getItem('deepseek_api_key') || ''
  });
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your personal teacher AI. What would you like to learn today?",
      timestamp: new Date().toISOString()
    }
  ]);

  const handleApiKeySave = (keys) => {
    setApiKeys(keys);
    localStorage.setItem('openai_api_key', keys.openai);
    localStorage.setItem('deepseek_api_key', keys.deepseek);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const toggleShortcutsModal = () => {
    setShowShortcuts(!showShortcuts);
  };

  return (
    <div className={`teacher-ai-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <header className="teacher-ai-header">
        <div className="header-content">
          <h1>Personal Teacher AI</h1>
          <div className="header-actions">
            <button 
              className="icon-button" 
              onClick={toggleTheme}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <FaSun /> : <FaMoon />}
            </button>
            <button 
              className="icon-button" 
              onClick={toggleShortcutsModal}
              aria-label="Keyboard shortcuts"
            >
              <FaKeyboard />
            </button>
          </div>
        </div>
        <nav className="teacher-ai-nav">
          <button 
            className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => handleTabChange('chat')}
          >
            Chat
          </button>
          <button 
            className={`tab-button ${activeTab === 'research' ? 'active' : ''}`}
            onClick={() => handleTabChange('research')}
          >
            Research
          </button>
          <button 
            className={`tab-button ${activeTab === 'dataviz' ? 'active' : ''}`}
            onClick={() => handleTabChange('dataviz')}
          >
            <FaSearch /> + <FaChartBar /> Data Research
          </button>
          <button 
            className={`tab-button ${activeTab === 'voice' ? 'active' : ''}`}
            onClick={() => handleTabChange('voice')}
          >
            Voice
          </button>
          <button 
            className={`tab-button ${activeTab === 'sudoku' ? 'active' : ''}`}
            onClick={() => handleTabChange('sudoku')}
          >
            <FaGamepad /> Sudoku
          </button>
          <button 
            className={`tab-button ${activeTab === 'chart' ? 'active' : ''}`}
            onClick={() => handleTabChange('chart')}
          >
            <FaChartLine /> Charts
          </button>
          <button 
            className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleTabChange('settings')}
          >
            Settings
          </button>
        </nav>
      </header>

      <main className="teacher-ai-main">
        {activeTab === 'chat' && (
          <ChatInterface 
            messages={messages} 
            setMessages={setMessages} 
            apiKeys={apiKeys}
            isDarkMode={isDarkMode}
          />
        )}
        {activeTab === 'research' && (
          <ResearchTools 
            apiKeys={apiKeys} 
            addToChat={(content) => setMessages([...messages, {
              role: 'system', 
              content,
              timestamp: new Date().toISOString()
            }])}
            isDarkMode={isDarkMode}
          />
        )}
        {activeTab === 'dataviz' && (
          <ResearchChartTab 
            apiKeys={apiKeys}
            isDarkMode={isDarkMode}
          />
        )}
        {activeTab === 'voice' && (
          <VoiceInteraction 
            messages={messages} 
            setMessages={setMessages} 
            apiKeys={apiKeys}
            isDarkMode={isDarkMode}
          />
        )}
        {activeTab === 'sudoku' && (
          <SudokuGame 
            isDarkMode={isDarkMode}
          />
        )}
        {activeTab === 'chart' && (
          <AIChartTab 
            isDarkMode={isDarkMode}
            apiKeys={apiKeys}
          />
        )}
        {activeTab === 'settings' && (
          <ApiSettings 
            apiKeys={apiKeys} 
            onSave={handleApiKeySave}
            isDarkMode={isDarkMode}
          />
        )}
      </main>

      {showShortcuts && (
        <div className="shortcuts-modal">
          <div className="shortcuts-content">
            <h2>Keyboard Shortcuts</h2>
            <button 
              className="close-modal" 
              onClick={toggleShortcutsModal}
              aria-label="Close shortcuts modal"
            >
              ×
            </button>
            <div className="shortcuts-list">
              <div className="shortcut-item">
                <span className="shortcut-keys">Enter</span>
                <span className="shortcut-desc">Send message</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-keys">Shift + Enter</span>
                <span className="shortcut-desc">New line</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-keys">Ctrl + L</span>
                <span className="shortcut-desc">Clear chat history</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-keys">1-4</span>
                <span className="shortcut-desc">Switch tabs (when focused on document)</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-keys">Alt + T</span>
                <span className="shortcut-desc">Toggle dark/light mode</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAI;
