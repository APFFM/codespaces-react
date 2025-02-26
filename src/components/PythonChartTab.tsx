import React, { useState } from 'react';
import { Line, Bar, Pie, Scatter } from 'react-chartjs-2';
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

interface PythonChartTabProps {
  isDarkMode: boolean;
}

const PythonChartTab: React.FC<PythonChartTabProps> = ({ isDarkMode }) => {
  const [pythonCode, setPythonCode] = useState('');
  const [chartData, setChartData] = useState<any>(null);
  const [chartType, setChartType] = useState('line');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateChart = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Call your AI service to generate Python code and chart data
      const response = await fetch('/api/generate-chart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: pythonCode }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setChartData(data.chartData);
      setPythonCode(data.generatedCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate chart');
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    if (!chartData) return null;

    const chartProps = {
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top' as const,
            labels: {
              color: isDarkMode ? '#e1e1e1' : '#333',
            },
          },
          title: {
            display: true,
            text: 'Generated Chart',
            color: isDarkMode ? '#e1e1e1' : '#333',
          },
        },
        scales: {
          x: {
            grid: {
              color: isDarkMode ? '#444' : '#ddd',
            },
            ticks: {
              color: isDarkMode ? '#e1e1e1' : '#333',
            },
          },
          y: {
            grid: {
              color: isDarkMode ? '#444' : '#ddd',
            },
            ticks: {
              color: isDarkMode ? '#e1e1e1' : '#333',
            },
          },
        },
      },
    };

    switch (chartType) {
      case 'line':
        return <Line {...chartProps} />;
      case 'bar':
        return <Bar {...chartProps} />;
      case 'pie':
        return <Pie {...chartProps} />;
      case 'scatter':
        return <Scatter {...chartProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="python-chart-container">
      <div className="chart-controls">
        <select
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
          className="chart-type-select"
        >
          <option value="line">Line Chart</option>
          <option value="bar">Bar Chart</option>
          <option value="pie">Pie Chart</option>
          <option value="scatter">Scatter Plot</option>
        </select>
        <button
          onClick={generateChart}
          disabled={loading}
          className="generate-chart-button"
        >
          {loading ? 'Generating...' : 'Generate Chart'}
        </button>
      </div>

      <textarea
        value={pythonCode}
        onChange={(e) => setPythonCode(e.target.value)}
        placeholder="Enter your data visualization prompt here..."
        className="python-code-input"
      />

      {error && <div className="chart-error">{error}</div>}

      <div className="chart-display">
        {renderChart()}
      </div>
    </div>
  );
};

export default PythonChartTab;
