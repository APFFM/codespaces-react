import React, { useEffect, useContext } from 'react';
import './App.css';
import TeacherAI from './components/TeacherAI.jsx';
import { ThemeProvider, ThemeContext } from './context/ThemeContext.jsx';

const AppContent = () => {
  const { toggleTheme } = useContext(ThemeContext);
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt+T to toggle theme
      if (e.altKey && e.key === 't') {
        toggleTheme();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleTheme]);
  
  return (
    <div className="App">
      <TeacherAI />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
