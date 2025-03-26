import React from 'react';
import { Chart } from 'react-chartjs-2';
import { formatNumber } from '../../utils/formatters';

export function PlanAnalysisChart({ data }) {
  const planTypes = {};
  data.forEach(record => {
    if (record.plan) {
      const type = record.plan.includes('INDEX') ? 'Index Scan' : 
                   record.plan.includes('NATURAL') ? 'Natural Scan' : 'Other';
      planTypes[type] = (planTypes[type] || 0) + 1;
    }
  });

  const planData = {
    labels: Object.keys(planTypes),
    datasets: [
      {
        data: Object.values(planTypes),
        backgroundColor: [
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 99, 132, 0.5)',
          'rgba(255, 206, 86, 0.5)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)'
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
        text: 'Execution Plan Distribution'
      }
    }
  };

  return (
    <div className="w-full h-96">
      <Chart type="pie" data={planData} options={options} />
    </div>
  );
}