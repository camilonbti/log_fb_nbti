import React from 'react';
import { Chart } from 'react-chartjs-2';
import { formatDuration } from '../../utils/formatters';

export function TimelineChart({ data }) {
  const timelineData = {
    datasets: [
      {
        label: 'Query Duration',
        data: data.map(record => ({
          x: new Date(record.timestamp),
          y: record.execution_time
        })),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Query Execution Timeline'
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'minute'
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Duration (ms)'
        }
      }
    }
  };

  return (
    <div className="w-full h-96">
      <Chart type="line" data={timelineData} options={options} />
    </div>
  );
}