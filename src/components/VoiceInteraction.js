import React, { useState, useEffect } from 'react';
import { sendMessageToOpenAI } from '../services/aiService';
import '../styles/VoiceInteraction.css';

const VoiceInteraction = ({ messages, setMessages, apiKeys }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    // Check if browser supports speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      setSpeechSupported(true);
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
        recognition.stop();
      }, 10000);
    }
  };

  const handleSendVoiceMessage = async () => {
    if (transcript.trim() === '') return;

    const userMessage = { role: 'user', content: transcript };
    setMessages([...messages, userMessage]);
    
    try {
      if (!apiKeys.openai) {
        throw new Error('OpenAI API key is missing. Please add it in Settings.');
      }
      
      const response = await sendMessageToOpenAI([...messages, userMessage], apiKeys.openai);
      
      setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: response }]);
      
      // Text to speech
      speakResponse(response);
    } catch (error) {
      setMessages(prevMessages => [
        ...prevMessages, 
        { role: 'assistant', content: `Error: ${error.message}` }
      ]);
    }
  };

  const speakResponse = (text) => {
    if ('speechSynthesis' in window) {
      setSpeaking(true);
      
      // Create a new SpeechSynthesisUtterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure the voice
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // Select a voice (optional)
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => voice.name.includes('Female') || voice.name.includes('Google'));
      if (preferredVoice) utterance.voice = preferredVoice;
      
      // Event handler for when speech is finished
      utterance.onend = () => {
        setSpeaking(false);
      };
      
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

  return (
    <div className="voice-interaction-container">
      <h2>Voice Interaction</h2>
      
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
              <div className="listening-indicator">Listening...</div>
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
              <h3>Your message:</h3>
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
          
          <div className="voice-instructions">
            <h3>Voice Instructions:</h3>
            <ul>
              <li>Click "Start Listening" and speak clearly</li>
              <li>Your speech will be transcribed automatically</li>
              <li>Click "Send Voice Message" to send your question</li>
              <li>The AI response will be read out loud</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default VoiceInteraction;
