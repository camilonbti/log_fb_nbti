// Charts Module
export function initializeCharts() {
    Chart.defaults.color = '#666';
    Chart.defaults.font.family = 'system-ui, -apple-system, sans-serif';
}

export function destroyChart(containerId) {
    const chartInstance = Chart.getChart(containerId);
    if (chartInstance) {
        chartInstance.destroy();
    }
}

export function renderPerformanceChart(data, containerId) {
    destroyChart(containerId);
    const ctx = document.getElementById(containerId).getContext('2d');
    const timeRanges = [
        {min: 0, max: 100, label: '0-100ms'},
        {min: 100, max: 500, label: '100-500ms'},
        {min: 500, max: 1000, label: '500ms-1s'},
        {min: 1000, max: 5000, label: '1s-5s'},
        {min: 5000, max: Infinity, label: '5s+'}
    ];

    const distribution = timeRanges.map(range => ({
        label: range.label,
        count: data.filter(q => 
            q.execution_time && 
            q.execution_time > range.min && 
            q.execution_time <= range.max
        ).length
    }));

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: distribution.map(d => d.label),
            datasets: [{
                label: 'Query Count by Duration',
                data: distribution.map(d => d.count),
                backgroundColor: [
                    '#4CAF50',
                    '#8BC34A',
                    '#FFEB3B',
                    '#FF9800',
                    '#F44336'
                ]
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { display: false }
                },
                y: {
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

export function renderTableAccessChart(data, containerId) {
    destroyChart(containerId);
    const ctx = document.getElementById(containerId).getContext('2d');
    const tableAccess = getMostAccessedTables(data);
    const topTables = Object.entries(tableAccess)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topTables.map(([table]) => table),
            datasets: [{
                label: 'Table Access Count',
                data: topTables.map(([,count]) => count),
                backgroundColor: '#36A2EB'
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { display: false }
                },
                y: {
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}