import React, { useState, useRef, useEffect } from 'react';
import { loadPyodide } from 'pyodide';
import { useSettings } from '../../contexts/SettingsContext';
import './PythonChat.css';

const PythonChat = () => {
  const { settings } = useSettings();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pyodide, setPyodide] = useState(null);
  const [isRunningCode, setIsRunningCode] = useState(false);
  const messagesEndRef = useRef(null);
  const plotOutputRef = useRef(null);

  // Initialize Pyodide
  useEffect(() => {
    async function initPyodide() {
      setIsLoading(true);
      try {
        const pyodideInstance = await loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/"
        });
        
        // Install matplotlib and other visualization packages
        await pyodideInstance.loadPackagesFromImports('import matplotlib.pyplot as plt\nimport numpy as np\nimport pandas as pd');
        
        // Configure matplotlib for web output
        await pyodideInstance.runPythonAsync(`
          import matplotlib
          matplotlib.use("module://matplotlib.backends.html5_canvas_backend")
        `);
        
        setPyodide(pyodideInstance);
      } catch (error) {
        console.error("Pyodide initialization error:", error);
      }
      setIsLoading(false);
    }
    
    initPyodide();
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle user message submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    // Check if API key is available
    if (!settings.openaiApiKey) {
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: "OpenAI API key is missing. Please add your API key in the Settings section."
        }
      ]);
      return;
    }

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetchAIResponse(input);
      
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: response.text,
          pythonCode: response.pythonCode 
        }
      ]);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: `Error: ${error.message || "Failed to get response from OpenAI. Please check your API key and try again."}`
        }
      ]);
    }
    
    setIsLoading(false);
  };

  // OpenAI API call
  const fetchAIResponse = async (prompt) => {
    try {
      const messages = [
        {
          role: "system",
          content: `You are a helpful AI assistant specialized in data visualization with Python.
When asked for visualizations, follow these rules:
1. First provide a brief textual explanation addressing the user's query.
2. Then provide working Python code that uses matplotlib, seaborn, or other visualization libraries.
3. The code MUST work within a Pyodide environment in the browser with these limitations:
   - No file system access (don't read/write files)
   - No network requests (don't fetch external data)
   - Available packages: numpy, pandas, matplotlib, seaborn
   - Use synthetic/generated data when needed
   - Don't use plt.savefig() as it won't work
4. The code must end with plt.show() to display the visualization in the browser.
5. Keep code examples simple, focused, and well-commented.
6. Don't use incompatible libraries like plotly, bokeh, or altair.
7. Format your code within a Python code block using triple backticks.`
        },
        {
          role: "user",
          content: prompt
        }
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: messages,
          temperature: 0.7,
          max_tokens: 2048
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Error calling OpenAI API');
      }

      const responseData = await response.json();
      const assistantResponse = responseData.choices[0].message.content;
      
      // Extract Python code blocks from the response
      const codeBlockRegex = /```python([\s\S]*?)```/;
      const codeMatch = assistantResponse.match(codeBlockRegex);
      
      let pythonCode = "";
      let textContent = assistantResponse;
      
      if (codeMatch && codeMatch[1]) {
        pythonCode = codeMatch[1].trim();
        // Remove the code block from the text response
        textContent = assistantResponse.replace(codeBlockRegex, "").trim();
      }
      
      return {
        text: textContent,
        pythonCode: pythonCode
      };
    } catch (error) {
      console.error('Error in OpenAI API call:', error);
      throw error;
    }
  };

  // Execute Python code
  const runPythonCode = async (code) => {
    if (!pyodide || isRunningCode) return;
    
    setIsRunningCode(true);
    
    try {
      // Clear previous output
      if (plotOutputRef.current) {
        plotOutputRef.current.innerHTML = '';
      }
      
      // Run the Python code
      await pyodide.runPythonAsync(code);
      
    } catch (error) {
      console.error("Python execution error:", error);
      if (plotOutputRef.current) {
        plotOutputRef.current.innerHTML = `<div class="error-message">Error executing Python code: ${error.message}</div>`;
      }
    }
    
    setIsRunningCode(false);
  };

  return (
    <div className="python-chat-container">
      <div className="chat-header">
        <h2>Python Visualization Chat</h2>
        {isLoading && !pyodide && <div className="loading-indicator">Loading Python environment...</div>}
        {!settings.openaiApiKey && <div className="api-key-missing">OpenAI API key missing</div>}
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="welcome-message">
            <h3>Welcome to Python Visualization Chat!</h3>
            <p>Ask questions and get visualizations generated with Python.</p>
            <p>Try asking something like:</p>
            <ul>
              <li>"Plot a sine wave"</li>
              <li>"Create a bar chart comparing different categories"</li>
              <li>"Generate a scatter plot with random data points"</li>
              <li>"Show me a histogram of normal distribution"</li>
            </ul>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div className="message-content">{message.content}</div>
            
            {message.pythonCode && (
              <div className="code-container">
                <div className="code-header">
                  <span>Python Code</span>
                  <button 
                    onClick={() => runPythonCode(message.pythonCode)}
                    disabled={isRunningCode || !pyodide}
                    className="run-code-button"
                  >
                    {isRunningCode ? 'Running...' : 'Run Code'}
                  </button>
                </div>
                <pre className="code-block">{message.pythonCode}</pre>
              </div>
            )}
            
            {index === messages.length - 1 && message.role === 'assistant' && (
              <div ref={plotOutputRef} className="plot-output"></div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about data visualization..."
          disabled={isLoading || !pyodide}
          className="chat-input"
        />
        <button 
          type="submit" 
          disabled={isLoading || !input.trim() || !pyodide || !settings.openaiApiKey}
          className="send-button"
        >
          {isLoading ? 'Thinking...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default PythonChat;
