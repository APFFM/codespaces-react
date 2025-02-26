import React, { useState, useEffect, useRef } from 'react';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Pie, Scatter, Doughnut } from 'react-chartjs-2';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FaSync, FaChartBar, FaCode } from 'react-icons/fa';
import '../styles/AIChartTab.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AIChartTab = ({ isDarkMode, apiKeys }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: "Welcome to Chart AI! Ask me to create any chart or visualization for you. For example:\n\n- Show me a bar chart of top 10 countries by population\n- Create a pie chart of global energy sources\n- Generate a line chart showing Bitcoin price over the last year\n- Visualize the distribution of COVID-19 cases by continent" 
    }
  ]);
  const [chartCode, setChartCode] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [chartOptions, setChartOptions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [codeView, setCodeView] = useState(false);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Execute chart code safely
  useEffect(() => {
    if (chartCode) {
      try {
        // Extract JSON configuration for chart
        const jsonMatch = chartCode.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          const chartConfig = JSON.parse(jsonMatch[1]);
          
          // Set chart type and data
          if (chartConfig.type && ['bar', 'line', 'pie', 'scatter', 'doughnut'].includes(chartConfig.type)) {
            setChartType(chartConfig.type);
          }
          
          if (chartConfig.data) {
            setChartData(chartConfig.data);
          }
          
          if (chartConfig.options) {
            // Apply dark mode to options
            const options = chartConfig.options;
            if (isDarkMode) {
              options.scales = options.scales || {};
              options.plugins = options.plugins || {};
              options.plugins.legend = options.plugins.legend || {};
              options.plugins.title = options.plugins.title || {};
              
              // Update colors for dark mode
              if (options.scales.x) {
                options.scales.x.grid = options.scales.x.grid || {};
                options.scales.x.grid.color = '#444';
                options.scales.x.ticks = options.scales.x.ticks || {};
                options.scales.x.ticks.color = '#e1e1e1';
              }
              
              if (options.scales.y) {
                options.scales.y.grid = options.scales.y.grid || {};
                options.scales.y.grid.color = '#444';
                options.scales.y.ticks = options.scales.y.ticks || {};
                options.scales.y.ticks.color = '#e1e1e1';
              }
              
              options.plugins.legend.labels = options.plugins.legend.labels || {};
              options.plugins.legend.labels.color = '#e1e1e1';
              
              if (options.plugins.title.display) {
                options.plugins.title.color = '#e1e1e1';
              }
            }
            
            setChartOptions(options);
          } else {
            // Default options with color settings
            setChartOptions({
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                  labels: {
                    color: isDarkMode ? '#e1e1e1' : '#333'
                  }
                },
                title: {
                  display: true,
                  text: chartConfig.title || 'Chart',
                  color: isDarkMode ? '#e1e1e1' : '#333'
                }
              },
              scales: {
                x: {
                  grid: { color: isDarkMode ? '#444' : '#ddd' },
                  ticks: { color: isDarkMode ? '#e1e1e1' : '#333' }
                },
                y: {
                  grid: { color: isDarkMode ? '#444' : '#ddd' },
                  ticks: { color: isDarkMode ? '#e1e1e1' : '#333' }
                }
              }
            });
          }
          
          setError(null);
        } else {
          throw new Error('No valid chart configuration found in response');
        }
      } catch (err) {
        console.error('Error executing chart code:', err);
        setError(`Failed to render chart: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  }, [chartCode, isDarkMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const apiKey = apiKeys.openai || '';
      if (!apiKey) {
        throw new Error('OpenAI API key is not set. Please configure it in Settings.');
      }

      // Enhanced prompt to get chart data and code with more confident response
      const chartPrompt = `${input}

Create a data visualization chart based on the query. Act as a data expert with comprehensive knowledge:

1. Provide a concise, factual explanation of the data without disclaimers
2. Always use real-world data from your knowledge base (do not apologize about not having up-to-date information)
3. Include a Chart.js configuration like this:
\`\`\`json
{
  "type": "bar", // Choose the most appropriate: bar, line, pie, scatter, doughnut
  "title": "Descriptive Chart Title",
  "data": {
    "labels": ["Label1", "Label2", ...],
    "datasets": [
      {
        "label": "Clear Dataset Label",
        "data": [value1, value2, ...],
        "backgroundColor": ["#color1", "#color2", ...],
        "borderColor": ["#color1", "#color2", ...],
        "borderWidth": 1
      }
    ]
  },
  "options": {} // Optional configuration settings
}
\`\`\`

Ensure data accuracy - use your knowledge to provide real values and statistics. If exact figures aren't in your training, provide reasonable estimates based on your knowledge.`;
      
      const systemPrompt = "You are a data visualization expert with extensive knowledge. Confidently create charts with accurate data from your knowledge base. Never apologize about being an AI or having limited information - instead, provide your best data representation based on what you know. Focus on creating informative, accurate visualizations.";
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: chartPrompt }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const aiMessage = { role: 'assistant', content: data.choices[0].message.content };
      setMessages(prev => [...prev, aiMessage]);
      setChartCode(data.choices[0].message.content);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate chart';
      setError(errorMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errorMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (example) => {
    setInput(example);
  };

  const renderChart = () => {
    if (!chartData) return null;
    
    const chartProps = { data: chartData, options: chartOptions };
    
    switch (chartType) {
      case 'bar':
        return <Bar {...chartProps} />;
      case 'line':
        return <Line {...chartProps} />;
      case 'pie':
        return <Pie {...chartProps} />;
      case 'doughnut':
        return <Doughnut {...chartProps} />;
      case 'scatter':
        return <Scatter {...chartProps} />;
      default:
        return <Bar {...chartProps} />;
    }
  };

  const examples = [
    "Create a bar chart of top 5 countries by GDP",
    "Make a pie chart showing market share of smartphone brands",
    "Show me a line chart of global temperature changes over the last 100 years",
    "Generate a visualization of Olympic medals by country"
  ];

  return (
    <div className={`ai-chart-tab ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="chart-messages-container">
        <div className="messages-box">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role === 'user' ? 'user-message' : 'ai-message'}`}>
              <div className="message-header">
                <strong>{message.role === 'user' ? 'You' : 'AI'}</strong>
              </div>
              <div className="message-content">
                <ReactMarkdown 
                  children={message.role === 'assistant' && !codeView ? message.content.split("```json")[0] : message.content}
                  remarkPlugins={[remarkGfm]}
                />
              </div>
              
              {message.role === 'assistant' && chartData && index === messages.length - 1 && (
                <div className="chart-container">
                  <div className="chart-header">
                    <h3>Generated Chart</h3>
                    <div className="chart-actions">
                      <button 
                        className="toggle-code-button"
                        onClick={() => setCodeView(!codeView)}
                        title={codeView ? "Hide code" : "Show code"}
                      >
                        <FaCode /> {codeView ? "Hide Code" : "Show Code"}
                      </button>
                    </div>
                  </div>
                  
                  {codeView ? (
                    <div className="chart-code">
                      <pre>{chartCode?.match(/```json\n([\s\S]*?)\n```/)?.[1] || 'No code available'}</pre>
                    </div>
                  ) : (
                    <div className="chart-visualization">
                      {error ? (
                        <div className="chart-error">
                          <p>{error}</p>
                        </div>
                      ) : (
                        renderChart()
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="message ai-message">
              <div className="message-content">
                <div className="loading-indicator">
                  <span>Creating your chart</span>
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form className="input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the chart you want to create..."
            className="chart-input"
            disabled={loading}
          />
          <button 
            type="submit" 
            className="chart-submit"
            disabled={loading || !input.trim()}
          >
            {loading ? <FaSync className="spin" /> : <FaChartBar />}
          </button>
        </form>
      </div>
      
      <div className="examples-section">
        <h3>Try these examples:</h3>
        <div className="examples-list">
          {examples.map((example, index) => (
            <div 
              key={index} 
              className="example-item" 
              onClick={() => handleExampleClick(example)}
            >
              <FaChartBar className="example-icon" />
              <span>{example}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIChartTab;
