import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import 'chart.js/auto';

ChartJS.register(...registerables);

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('log_file', file);

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/analyze', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        setData(result);
        renderCharts(result);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Error processing file: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderCharts = (data) => {
    // Summary Charts
    renderSummaryCharts(data);
    
    // Performance Charts
    renderPerformanceChart(data.data, 'performanceChart');
    
    // Table Access Charts
    renderTableAccessChart(data.data, 'tableAccessChart');
    
    // Timeline Charts
    renderTimelineChart(data.data, 'timelineChart');
    
    // Plan Analysis Charts
    renderPlanAnalysisChart(data.data, 'planAnalysisChart');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Firebird Log Analyzer</h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <form id="uploadForm" className="mb-6">
            <div className="flex items-center space-x-4">
              <input
                type="file"
                id="logFile"
                accept=".json"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Analyze Log
              </button>
            </div>
          </form>

          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Processing log file...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {data && (
            <div className="space-y-8">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="stat-box">
                  <h3>Total Queries</h3>
                  <p id="totalQueries">0</p>
                </div>
                <div className="stat-box">
                  <h3>Slow Queries</h3>
                  <p id="slowQueries">0</p>
                </div>
                <div className="stat-box">
                  <h3>No Index Queries</h3>
                  <p id="noIndexQueries">0</p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="chart-container">
                  <h3>Query Duration Distribution</h3>
                  <canvas id="performanceChart"></canvas>
                </div>
                <div className="chart-container">
                  <h3>Table Access Frequency</h3>
                  <canvas id="tableAccessChart"></canvas>
                </div>
                <div className="chart-container">
                  <h3>Query Timeline</h3>
                  <canvas id="timelineChart"></canvas>
                </div>
                <div className="chart-container">
                  <h3>Execution Plan Analysis</h3>
                  <canvas id="planAnalysisChart"></canvas>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Duration</th>
                      <th>Statement</th>
                      <th>Plan</th>
                      <th>Reads</th>
                      <th>Writes</th>
                      <th>Fetches</th>
                    </tr>
                  </thead>
                  <tbody id="resultsBody">
                    {data.data.map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td>{new Date(record.timestamp).toLocaleString()}</td>
                        <td>{record.execution_time}ms</td>
                        <td className="max-w-md truncate">{record.statement}</td>
                        <td className="max-w-md truncate">{record.plan}</td>
                        <td>{record.reads}</td>
                        <td>{record.writes}</td>
                        <td>{record.fetches}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;