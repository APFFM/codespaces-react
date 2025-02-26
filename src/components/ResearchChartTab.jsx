import React, { useState, useRef, useEffect } from 'react';
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
  Legend
} from 'chart.js';
import { Bar, Line, Pie, Doughnut, Scatter } from 'react-chartjs-2';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FaSearch, FaSpinner, FaChartBar, FaCode, FaFileAlt, FaTable } from 'react-icons/fa';
import '../styles/ResearchChartTab.css';

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
  Legend
);

const STEPS = {
  SEARCH: 'search',
  ANALYZE: 'analyze',
  VISUALIZE: 'visualize',
  RESULT: 'result'
};

const ResearchChartTab = ({ isDarkMode, apiKeys }) => {
  const [query, setQuery] = useState('');
  const [wikiResults, setWikiResults] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [articleContent, setArticleContent] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [chartConfig, setChartConfig] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(STEPS.SEARCH);
  const [showCode, setShowCode] = useState(false);
  
  const resultsRef = useRef(null);

  useEffect(() => {
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentStep, analysisResult, chartConfig]);

  // 1. Wikipedia Search
  const searchWikipedia = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    setWikiResults([]);
    
    try {
      const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=10&origin=*&srsearch=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.query && data.query.search) {
        setWikiResults(data.query.search);
      } else {
        throw new Error('No results found');
      }
    } catch (err) {
      setError(`Search error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Article Content
  const fetchArticleContent = async (pageId, title) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exlimit=1&explaintext=1&format=json&origin=*&pageids=${pageId}`);
      const data = await response.json();
      
      if (data.query && data.query.pages && data.query.pages[pageId]) {
        const content = data.query.pages[pageId].extract;
        setArticleContent(content);
        setSelectedArticle({ id: pageId, title });
        setCurrentStep(STEPS.ANALYZE);
      } else {
        throw new Error('Failed to fetch article content');
      }
    } catch (err) {
      setError(`Content fetch error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 3. Analyze Article Content
  const analyzeContent = async () => {
    if (!apiKeys.openai) {
      setError('OpenAI API key is required for analysis');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // More sophisticated system prompt for better data extraction
      const systemPrompt = `You are an expert data analyst specializing in extracting and structuring data from text. 
      Your task is to carefully read the provided Wikipedia article and:
      
      1. Identify ANY quantitative or categorical data that could be visualized
      2. If explicit data tables or statistics aren't present, derive numerical data from the text
      3. Transform implicit comparisons into concrete numerical estimates when appropriate
      4. Use your knowledge to fill in reasonable values if exact figures are implied but not stated
      5. Create a cohesive dataset that tells a meaningful story about the article topic
      
      Your response MUST include two parts:
      1. A brief analysis of the key insights from the article
      2. A valid JSON structure with visualization-ready data`;
      
      const userPrompt = `Analyze this Wikipedia article about "${selectedArticle.title}" and extract or create meaningful data for visualization:
      
${articleContent.substring(0, 12000)}

First provide a brief analysis (2-3 paragraphs) explaining the key data points and insights.

Then provide structured data in this EXACT JSON format (this is critical):
\`\`\`json
{
  "title": "Clear descriptive title for the chart",
  "description": "Brief explanation of what this data represents",
  "recommendedChartType": "bar|line|pie|scatter|doughnut",
  "labels": ["label1", "label2", ...],
  "datasets": [
    {
      "label": "Dataset name",
      "data": [value1, value2, ...]
    }
  ],
  "insights": ["Key insight 1", "Key insight 2", "Key insight 3"]
}
\`\`\`

If the article doesn't contain explicit numerical data, use your knowledge to create reasonable estimates based on the article content. The goal is to provide meaningful visualization rather than perfect accuracy.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKeys.openai}`
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 3000
        })
      });

      const data = await response.json();
      
      if (data.choices && data.choices[0]) {
        const content = data.choices[0].message.content;
        setAnalysisResult(content);
        
        // Better JSON extraction with multiple fallback methods
        try {
          // Try to extract JSON using regex pattern matching
          let jsonData = null;
          
          // Method 1: Look for ```json ... ``` pattern
          const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (jsonMatch && jsonMatch[1]) {
            try {
              jsonData = JSON.parse(jsonMatch[1].trim());
            } catch (e) {
              console.log("Failed to parse first JSON pattern, trying alternative");
            }
          }
          
          // Method 2: Look for any {...} pattern if first method failed
          if (!jsonData) {
            const objectMatch = content.match(/(\{[\s\S]*\})/);
            if (objectMatch && objectMatch[1]) {
              try {
                jsonData = JSON.parse(objectMatch[1].trim());
              } catch (e) {
                console.log("Failed to parse second JSON pattern");
              }
            }
          }
          
          // Method 3: If all else fails, generate basic data structure for fallback
          if (!jsonData) {
            // Create a simple data structure based on the title
            jsonData = {
              title: `Data from ${selectedArticle.title}`,
              description: "Extracted key information from article",
              recommendedChartType: "bar",
              labels: ["Category 1", "Category 2", "Category 3", "Category 4"],
              datasets: [{
                label: "Values",
                data: [25, 40, 60, 35]
              }],
              insights: ["No structured data could be extracted automatically", 
                        "This is a fallback visualization", 
                        "Please see the analysis text for actual insights"]
            };
            setError("Could not extract structured data, using simplified visualization");
          }
          
          // Now use the extracted or fallback data
          setExtractedData(jsonData);
          
          if (jsonData.recommendedChartType) {
            setChartType(jsonData.recommendedChartType);
          }
          
          setCurrentStep(STEPS.VISUALIZE);
        } catch (jsonError) {
          console.error("All JSON extraction methods failed", jsonError);
          throw new Error(`Data extraction error: ${jsonError.message}`);
        }
      } else {
        throw new Error('Failed to analyze content');
      }
    } catch (err) {
      setError(`Analysis error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 4. Generate Chart
  const generateChart = async () => {
    if (!apiKeys.openai || !extractedData) {
      setError('Missing API key or data for chart generation');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Updated system prompt with explicit JSON requirements
      const systemPrompt = "You are a data visualization expert. Create a Chart.js configuration that is VALID JSON. Never include JavaScript functions, only use JSON data types (strings, numbers, booleans, arrays, objects, null). Optimize the chart for clarity and visual appeal.";
      
      // Prepare a safer version of the extracted data for the prompt
      const safeData = {
        title: extractedData.title || "",
        description: extractedData.description || "",
        labels: extractedData.labels || [],
        datasets: extractedData.datasets || [{ label: "Data", data: [] }],
        insights: extractedData.insights || []
      };
      
      const userPrompt = `Create a ${chartType} chart configuration for this data:
      
${JSON.stringify(safeData, null, 2)}

Return ONLY valid JSON (no JavaScript functions) with this exact structure:
{
  "type": "${chartType}",
  "data": {
    "labels": ["label1", "label2", ...],
    "datasets": [
      {
        "label": "Dataset name",
        "data": [value1, value2, ...],
        "backgroundColor": ["#hexcolor1", "#hexcolor2", ...],
        "borderColor": ["#hexcolor1", "#hexcolor2", ...],
        "borderWidth": 1
      }
    ]
  },
  "options": {
    "responsive": true,
    "maintainAspectRatio": false
    // Only include simple options with primitive values - NO FUNCTIONS
  }
}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKeys.openai}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3, // Lower temperature for more predictable output
          max_tokens: 2000
        })
      });

      const data = await response.json();
      
      if (data.choices && data.choices[0]) {
        const content = data.choices[0].message.content;
        
        try {
          // Enhanced JSON extraction with better fallback
          let chartJSON = null;
          
          // Try different methods to extract valid JSON
          
          // Method 1: Look for ```json ... ``` pattern
          const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (jsonMatch && jsonMatch[1]) {
            try {
              const cleanJson = jsonMatch[1]
                .replace(/\bfunction\s*\([^)]*\)\s*{[^}]*}/g, '"functionRemoved"') // Replace functions with a placeholder
                .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":') // Ensure property names are properly quoted
                .replace(/,\s*}/g, '}'); // Remove trailing commas
                
              chartJSON = JSON.parse(cleanJson);
            } catch (e) {
              console.log("Failed to parse JSON from code block:", e);
            }
          }
          
          // Method 2: Look for any {...} pattern if first method failed
          if (!chartJSON) {
            const objectMatch = content.match(/(\{[\s\S]*\})/);
            if (objectMatch && objectMatch[1]) {
              try {
                const cleanJson = objectMatch[1]
                  .replace(/\bfunction\s*\([^)]*\)\s*{[^}]*}/g, '"functionRemoved"')
                  .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":')
                  .replace(/,\s*}/g, '}');
                  
                chartJSON = JSON.parse(cleanJson);
              } catch (e) {
                console.log("Failed to parse JSON from object match:", e);
              }
            }
          }
          
          // Method 3: Generate fallback chart configuration if all else fails
          if (!chartJSON) {
            // Create a basic chart config based on our data
            chartJSON = {
              type: chartType,
              data: {
                labels: extractedData.labels || [],
                datasets: [
                  {
                    label: extractedData.datasets?.[0]?.label || "Data",
                    data: extractedData.datasets?.[0]?.data || [],
                    backgroundColor: generateColors(extractedData.labels?.length || 0, isDarkMode),
                    borderColor: generateColors(extractedData.labels?.length || 0, isDarkMode, true),
                    borderWidth: 1
                  }
                ]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  title: {
                    display: true,
                    text: extractedData.title || "Chart"
                  },
                  legend: {
                    position: 'top'
                  }
                }
              }
            };
            
            console.log("Using fallback chart configuration");
            setError("Could not parse AI response, using basic chart configuration");
          }
          
          setChartConfig(chartJSON);
          setCurrentStep(STEPS.RESULT);
        } catch (jsonError) {
          throw new Error(`Chart generation error: ${jsonError.message}`);
        }
      } else {
        throw new Error('Failed to generate chart');
      }
    } catch (err) {
      setError(`Chart generation error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to generate colors for charts
  const generateColors = (count, isDark, isBorder = false) => {
    const baseColors = isDark ? 
      ['#4dc9f6', '#f67019', '#f53794', '#537bc4', '#acc236', '#166a8f', '#00a950', '#58595b', '#8549ba'] :
      ['#36a2eb', '#ff6384', '#4bc0c0', '#ffcd56', '#ff9f40', '#9966ff', '#c9cbcf', '#7ac142', '#25cef7'];
      
    if (count <= baseColors.length) {
      return isBorder ? baseColors.slice(0, count) : baseColors.slice(0, count).map(color => color + '80'); // Add transparency for background
    }
    
    // Generate more colors if needed
    const colors = [...baseColors];
    while (colors.length < count) {
      const r = Math.floor(Math.random() * 255);
      const g = Math.floor(Math.random() * 255);
      const b = Math.floor(Math.random() * 255);
      const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      colors.push(color);
    }
    
    return isBorder ? colors : colors.map(color => color + '80'); // Add transparency for background
  };

  const renderChart = () => {
    if (!chartConfig || !chartConfig.data) return null;
    
    const chartProps = { 
      data: chartConfig.data,
      options: {
        ...chartConfig.options,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          ...chartConfig.options?.plugins,
          legend: {
            ...chartConfig.options?.plugins?.legend,
            labels: {
              ...chartConfig.options?.plugins?.legend?.labels,
              color: isDarkMode ? '#e1e1e1' : '#333'
            }
          }
        },
        scales: chartType !== 'pie' && chartType !== 'doughnut' ? {
          ...chartConfig.options?.scales,
          x: {
            ...chartConfig.options?.scales?.x,
            grid: {
              ...chartConfig.options?.scales?.x?.grid,
              color: isDarkMode ? '#444' : '#ddd'
            },
            ticks: {
              ...chartConfig.options?.scales?.x?.ticks,
              color: isDarkMode ? '#e1e1e1' : '#333'
            }
          },
          y: {
            ...chartConfig.options?.scales?.y,
            grid: {
              ...chartConfig.options?.scales?.y?.grid,
              color: isDarkMode ? '#444' : '#ddd'
            },
            ticks: {
              ...chartConfig.options?.scales?.y?.ticks,
              color: isDarkMode ? '#e1e1e1' : '#333'
            }
          }
        } : undefined
      }
    };
    
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

  const resetWorkflow = (toStep = STEPS.SEARCH) => {
    if (toStep === STEPS.SEARCH) {
      setWikiResults([]);
      setSelectedArticle(null);
      setArticleContent('');
      setAnalysisResult('');
      setExtractedData(null);
      setChartConfig(null);
    } else if (toStep === STEPS.ANALYZE) {
      setAnalysisResult('');
      setExtractedData(null);
      setChartConfig(null);
    } else if (toStep === STEPS.VISUALIZE) {
      setChartConfig(null);
    }
    setCurrentStep(toStep);
    setError(null);
  };

  // Step navigation renderer
  const renderStepIndicator = () => {
    return (
      <div className="step-indicator">
        <div className={`step ${currentStep === STEPS.SEARCH ? 'active' : ''}`} 
             onClick={() => currentStep !== STEPS.SEARCH && resetWorkflow(STEPS.SEARCH)}>
          1. Search
        </div>
        <div className="step-connector"></div>
        <div className={`step ${currentStep === STEPS.ANALYZE ? 'active' : ''} ${!selectedArticle ? 'disabled' : ''}`}
             onClick={() => selectedArticle && currentStep !== STEPS.ANALYZE && resetWorkflow(STEPS.ANALYZE)}>
          2. Analyze
        </div>
        <div className="step-connector"></div>
        <div className={`step ${currentStep === STEPS.VISUALIZE ? 'active' : ''} ${!extractedData ? 'disabled' : ''}`}
             onClick={() => extractedData && currentStep !== STEPS.VISUALIZE && resetWorkflow(STEPS.VISUALIZE)}>
          3. Visualize
        </div>
        <div className="step-connector"></div>
        <div className={`step ${currentStep === STEPS.RESULT ? 'active' : ''} ${!chartConfig ? 'disabled' : ''}`}>
          4. Result
        </div>
      </div>
    );
  };

  // Improve article display to show more content with better formatting
  const renderArticleContent = () => {
    if (!articleContent) return null;
    
    // Extract a meaningful preview that's longer than before
    const previewLength = 1200;
    const preview = articleContent.substring(0, previewLength);
    const remaining = articleContent.length > previewLength ? 
      `... (${Math.round((articleContent.length - previewLength) / 1000)}K more characters)` : '';
    
    // Split into paragraphs for better readability
    const paragraphs = preview.split(/\n+/);
    
    return (
      <div className="article-preview">
        <h3>{selectedArticle?.title}</h3>
        {paragraphs.map((paragraph, index) => (
          paragraph.trim() ? <p key={index}>{paragraph}</p> : null
        ))}
        {remaining && <p className="remaining-text">{remaining}</p>}
      </div>
    );
  };

  // Update the visualization prep step to show insights
  const renderDataPreview = () => {
    if (!extractedData) return null;
    
    return (
      <div className="data-insights">
        <div className="data-preview-section">
          <h4>Data Preview</h4>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  {extractedData?.labels?.map((label, idx) => (
                    <th key={idx}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {extractedData?.datasets?.[0]?.data?.map((value, idx) => (
                    <td key={idx}>{value}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {extractedData.insights && extractedData.insights.length > 0 && (
          <div className="insights-section">
            <h4>Key Insights</h4>
            <ul className="insights-list">
              {extractedData.insights.map((insight, idx) => (
                <li key={idx}>{insight}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`research-chart-tab ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Step Indicator */}
      {renderStepIndicator()}
      
      <div className="research-chart-container">
        {/* Step 1: Search */}
        {currentStep === STEPS.SEARCH && (
          <div className="step-container" ref={resultsRef}>
            <div className="step-header">
              <h2><FaSearch /> Search Wikipedia</h2>
              <p>Enter a topic to search for data that can be visualized</p>
            </div>
            
            <form className="search-form" onSubmit={searchWikipedia}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter a topic (e.g., 'World population', 'Global warming')"
                className="search-input"
                disabled={loading}
              />
              <button type="submit" className="search-button" disabled={loading || !query.trim()}>
                {loading ? <FaSpinner className="spinner" /> : <FaSearch />} Search
              </button>
            </form>
            
            {error && <div className="error-message">{error}</div>}
            
            {wikiResults.length > 0 && (
              <div className="search-results">
                <h3>Search Results</h3>
                <ul>
                  {wikiResults.map(result => (
                    <li key={result.pageid} onClick={() => fetchArticleContent(result.pageid, result.title)}>
                      <h4>{result.title}</h4>
                      <p dangerouslySetInnerHTML={{ __html: result.snippet + '...' }}></p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* Step 2: Analyze */}
        {currentStep === STEPS.ANALYZE && (
          <div className="step-container" ref={resultsRef}>
            <div className="step-header">
              <h2><FaFileAlt /> Analyze Article</h2>
              <p>Extract data from the Wikipedia article on "{selectedArticle?.title}"</p>
            </div>
            
            <div className="article-content">
              <div className="article-scrollbox">
                {renderArticleContent()}
              </div>
              
              <div className="action-buttons">
                <button className="analyze-button" onClick={analyzeContent} disabled={loading}>
                  {loading ? (
                    <><FaSpinner className="spinner" /> Extracting Data...</>
                  ) : (
                    'Extract Data for Visualization'
                  )}
                </button>
                <button className="back-button" onClick={() => resetWorkflow(STEPS.SEARCH)}>
                  Select Different Article
                </button>
              </div>
            </div>
            
            {error && <div className="error-message">{error}</div>}
          </div>
        )}
        
        {/* Step 3: Visualize */}
        {currentStep === STEPS.VISUALIZE && (
          <div className="step-container" ref={resultsRef}>
            <div className="step-header">
              <h2><FaTable /> Prepare Visualization</h2>
              <p>Review the extracted data and create a chart</p>
            </div>
            
            <div className="analysis-content">
              <div className="analysis-result">
                <h3>Data Analysis</h3>
                <div className="analysis-text">
                  <ReactMarkdown 
                    children={analysisResult.split('```')[0]} 
                    remarkPlugins={[remarkGfm]}
                  />
                </div>
              </div>
              
              <div className="extracted-data">
                <h3>Extracted Data</h3>
                {renderDataPreview()}
              </div>
              
              <div className="chart-settings">
                <h3>Chart Settings</h3>
                <div className="chart-types">
                  <label>Chart Type:</label>
                  <select 
                    value={chartType} 
                    onChange={(e) => setChartType(e.target.value)}
                    className="chart-type-select"
                  >
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart</option>
                    <option value="pie">Pie Chart</option>
                    <option value="doughnut">Doughnut Chart</option>
                    <option value="scatter">Scatter Plot</option>
                  </select>
                </div>
                
                <div className="action-buttons">
                  <button className="visualize-button" onClick={generateChart} disabled={loading}>
                    {loading ? <FaSpinner className="spinner" /> : 'Generate Chart'}
                  </button>
                  <button className="back-button" onClick={() => resetWorkflow(STEPS.ANALYZE)}>
                    Re-analyze Article
                  </button>
                </div>
              </div>
            </div>
            
            {error && <div className="error-message">{error}</div>}
          </div>
        )}
        
        {/* Step 4: Result */}
        {currentStep === STEPS.RESULT && (
          <div className="step-container" ref={resultsRef}>
            <div className="step-header">
              <h2><FaChartBar /> Visualization Result</h2>
              <p>Here's your data visualization for "{selectedArticle?.title}"</p>
            </div>
            
            <div className="chart-result">
              <div className="chart-actions">
                <div className="chart-title">
                  <h3>{extractedData?.title || 'Chart'}</h3>
                  <p>{extractedData?.description}</p>
                </div>
                <button 
                  className="toggle-code-button"
                  onClick={() => setShowCode(!showCode)}
                >
                  <FaCode /> {showCode ? 'Hide Code' : 'Show Code'}
                </button>
              </div>
              
              {showCode ? (
                <div className="chart-code">
                  <pre>{JSON.stringify(chartConfig, null, 2)}</pre>
                </div>
              ) : (
                <div className="chart-visualization">
                  {renderChart()}
                </div>
              )}
              
              <div className="action-buttons">
                <button className="new-search-button" onClick={() => resetWorkflow(STEPS.SEARCH)}>
                  Start New Search
                </button>
                <button className="back-button" onClick={() => resetWorkflow(STEPS.VISUALIZE)}>
                  Modify Chart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchChartTab;
