import React, { useState } from 'react';
import ChatInterface from './ChatInterface';
import ResearchTools from './ResearchTools';
import VoiceInteraction from './VoiceInteraction';
import ApiSettings from './ApiSettings';
import '../styles/TeacherAI.css';

const TeacherAI = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [apiKeys, setApiKeys] = useState({
    openai: localStorage.getItem('openai_api_key') || '',
    deepseek: localStorage.getItem('deepseek_api_key') || ''
  });
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your personal teacher AI. What would you like to learn today?"
    }
  ]);

  const handleApiKeySave = (keys) => {
    setApiKeys(keys);
    localStorage.setItem('openai_api_key', keys.openai);
    localStorage.setItem('deepseek_api_key', keys.deepseek);
  };

  return (
    <div className="teacher-ai-container">
      <header className="teacher-ai-header">
        <h1>Personal Teacher AI</h1>
        <nav className="teacher-ai-nav">
          <button 
            className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
          <button 
            className={`tab-button ${activeTab === 'research' ? 'active' : ''}`}
            onClick={() => setActiveTab('research')}
          >
            Research
          </button>
          <button 
            className={`tab-button ${activeTab === 'voice' ? 'active' : ''}`}
            onClick={() => setActiveTab('voice')}
          >
            Voice
          </button>
          <button 
            className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
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
          />
        )}
        {activeTab === 'research' && (
          <ResearchTools 
            apiKeys={apiKeys} 
            addToChat={(content) => setMessages([...messages, {role: 'system', content}])} 
          />
        )}
        {activeTab === 'voice' && (
          <VoiceInteraction 
            messages={messages} 
            setMessages={setMessages} 
            apiKeys={apiKeys} 
          />
        )}
        {activeTab === 'settings' && (
          <ApiSettings 
            apiKeys={apiKeys} 
            onSave={handleApiKeySave} 
          />
        )}
      </main>
    </div>
  );
};

export default TeacherAI;
