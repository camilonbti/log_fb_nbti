import React from 'react';
import { Chart } from 'react-chartjs-2';
import { formatNumber, formatDuration } from '../../utils/formatters';

export function SummaryCharts({ data }) {
  const summaryData = {
    labels: ['Duration', 'Reads', 'Writes', 'Fetches'],
    datasets: [
      {
        data: [
          data.stats.totalDuration,
          data.stats.totalReads,
          data.stats.totalWrites,
          data.stats.totalFetches
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Query Execution Summary'
      }
    }
  };

  return (
    <div className="w-full h-96">
      <Chart type="doughnut" data={summaryData} options={options} />
    </div>
  );
}