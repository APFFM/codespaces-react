import React, { useState, useEffect } from 'react';
import { sendMessageToOpenAI } from '../services/aiService.js';
import '../styles/VoiceInteraction.css';

const VoiceInteraction = ({ messages, setMessages, apiKeys, isDarkMode }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState({
    rate: 1,
    pitch: 1,
    volume: 1,
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Check if browser supports speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      setSpeechSupported(true);
    }
    
    // Load saved voice settings
    const savedSettings = localStorage.getItem('voice_settings');
    if (savedSettings) {
      setVoiceSettings(JSON.parse(savedSettings));
    }
  }, []);

  const startListening = () => {
    setTranscript('');
    setIsListening(true);
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.start();
      
      // Stop listening after 10 seconds of silence
      setTimeout(() => {
        if (recognition) {
          recognition.stop();
        }
      }, 10000);
    }
  };

  const handleSendVoiceMessage = async () => {
    if (transcript.trim() === '') return;

    const userMessage = { role: 'user', content: transcript, timestamp: new Date().toISOString() };
    setMessages([...messages, userMessage]);
    
    try {
      if (!apiKeys.openai) {
        throw new Error('OpenAI API key is missing. Please add it in Settings.');
      }
      
      const response = await sendMessageToOpenAI([...messages, userMessage], apiKeys.openai);
      
      const assistantMessage = { 
        role: 'assistant', 
        content: response,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
      
      // Text to speech
      speakResponse(response);
    } catch (error) {
      setMessages(prevMessages => [
        ...prevMessages, 
        { 
          role: 'assistant', 
          content: `Error: ${error.message}`,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  };

  const speakResponse = (text) => {
    if ('speechSynthesis' in window) {
      setSpeaking(true);
      
      // Create a new SpeechSynthesisUtterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure the voice using settings
      utterance.rate = voiceSettings.rate;
      utterance.pitch = voiceSettings.pitch;
      utterance.volume = voiceSettings.volume;
      
      // Select a voice (optional)
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => voice.name.includes('Female') || voice.name.includes('Google'));
      if (preferredVoice) utterance.voice = preferredVoice;
      
      // Event handler for when speech is finished
      utterance.onend = () => {
        setSpeaking(false);
      };
      
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Speak the text
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  };

  const handleVoiceSettingChange = (setting, value) => {
    const newSettings = { ...voiceSettings, [setting]: value };
    setVoiceSettings(newSettings);
    localStorage.setItem('voice_settings', JSON.stringify(newSettings));
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`voice-interaction-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="voice-header">
        <h2>Voice Interaction</h2>
        <button 
          className="settings-toggle-button"
          onClick={toggleSettings}
          aria-label="Voice settings"
        >
          {showSettings ? 'Hide Settings' : 'Voice Settings'}
        </button>
      </div>
      
      {showSettings && (
        <div className="voice-settings-panel fade-in">
          <h3>Voice Settings</h3>
          <div className="setting-item">
            <label htmlFor="rate">Speaking Rate: {voiceSettings.rate.toFixed(1)}</label>
            <input
              id="rate"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={voiceSettings.rate}
              onChange={(e) => handleVoiceSettingChange('rate', parseFloat(e.target.value))}
              className="voice-range-input"
            />
          </div>
          <div className="setting-item">
            <label htmlFor="pitch">Voice Pitch: {voiceSettings.pitch.toFixed(1)}</label>
            <input
              id="pitch"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={voiceSettings.pitch}
              onChange={(e) => handleVoiceSettingChange('pitch', parseFloat(e.target.value))}
              className="voice-range-input"
            />
          </div>
          <div className="setting-item">
            <label htmlFor="volume">Volume: {voiceSettings.volume.toFixed(1)}</label>
            <input
              id="volume"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={voiceSettings.volume}
              onChange={(e) => handleVoiceSettingChange('volume', parseFloat(e.target.value))}
              className="voice-range-input"
            />
          </div>
          <button 
            className="test-voice-button"
            onClick={() => speakResponse("This is a test of the voice settings. You can adjust the rate, pitch, and volume to make it sound just right.")}
            disabled={speaking}
          >
            Test Voice
          </button>
        </div>
      )}
      
      {!speechSupported && (
        <div className="speech-not-supported">
          <p>Your browser does not support voice interaction.</p>
          <p>Please try using a modern browser like Chrome, Edge, or Safari.</p>
        </div>
      )}
      
      {speechSupported && (
        <>
          <div className="voice-status">
            {isListening ? (
              <div className="listening-indicator">
                <span className="pulse-dot"></span>
                <span className="listening-text">Listening...</span>
              </div>
            ) : (
              <button 
                className="start-listening-button" 
                onClick={startListening}
                disabled={speaking}
              >
                Start Listening
              </button>
            )}
            
            {speaking && (
              <button className="stop-speaking-button" onClick={stopSpeaking}>
                Stop Speaking
              </button>
            )}
          </div>
          
          {transcript && (
            <div className="transcript-container">
              <div className="transcript-header">
                <h3>Your message:</h3>
                <span className="transcript-time">{formatTimestamp(new Date().toISOString())}</span>
              </div>
              <p className="transcript-text">{transcript}</p>
              <button 
                className="send-voice-button"
                onClick={handleSendVoiceMessage}
                disabled={isListening || speaking}
              >
                Send Voice Message
              </button>
            </div>
          )}
          
          <div className="voice-chat-history">
            <h3>Recent Voice Conversation</h3>
            <div className="voice-messages">
              {messages.slice(-4).map((message, index) => (
                <div 
                  key={index} 
                  className={`voice-message ${message.role === 'user' ? 'user-voice-message' : 'ai-voice-message'}`}
                >
                  <div className="message-header">
                    <span className="message-role">{message.role === 'user' ? 'You' : 'AI Teacher'}</span>
                    {message.timestamp && <span className="message-time">{formatTimestamp(message.timestamp)}</span>}
                  </div>
                  <p>{message.content}</p>
                  {message.role === 'assistant' && (
                    <button 
                      className="speak-again-button"
                      onClick={() => speakResponse(message.content)}
                      disabled={speaking}
                    >
                      Speak Again
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="voice-instructions">
            <h3>Voice Instructions:</h3>
            <ul>
              <li>Click "Start Listening" and speak clearly</li>
              <li>Your speech will be transcribed automatically</li>
              <li>Click "Send Voice Message" to send your question</li>
              <li>The AI response will be read out loud</li>
              <li>Adjust voice settings to customize the AI's speech</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default VoiceInteraction;