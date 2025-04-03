function destroyChart(containerId) {
    const chartInstance = Chart.getChart(containerId);
    if (chartInstance) {
        chartInstance.destroy();
    }
}

function renderCharts(data) {
    Logger.info('Rendering charts');
    
    if (!data?.length) {
        Logger.warn('No data available for charts');
        return;
    }
    
    const chartsContainer = document.getElementById('charts');
    if (!chartsContainer) {
        Logger.error('Charts container not found');
        return;
    }
    
    chartsContainer.classList.remove('hidden');
    
    const charts = [
        { id: 'performanceChart', render: renderPerformanceChart },
        { id: 'tableAccessChart', render: renderTableAccessChart },
        { id: 'queryTypeChart', render: renderQueryTypeChart },
        { id: 'timelineChart', render: renderTimelineChart }
    ];

    charts.forEach(chart => {
        try {
            Logger.debug(`Rendering chart: ${chart.id}`);
            chart.render(data, chart.id);
        } catch (error) {
            Logger.error(`Error rendering ${chart.id}`, error);
        }
    });
}

function renderPerformanceChart(data, containerId) {
    try {
        destroyChart(containerId);
        const ctx = document.getElementById(containerId)?.getContext('2d');
        if (!ctx) {
            Logger.error(`Canvas context not found for ${containerId}`);
            return;
        }
        
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
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Queries: ${context.raw}`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        Logger.error('Error rendering performance chart', error);
    }
}

function renderTableAccessChart(data, containerId) {
    try {
        destroyChart(containerId);
        const ctx = document.getElementById(containerId)?.getContext('2d');
        if (!ctx) {
            Logger.error(`Canvas context not found for ${containerId}`);
            return;
        }

        const tableAccess = data.reduce((acc, query) => {
            if (query.tables) {
                query.tables.forEach(table => {
                    acc[table] = (acc[table] || 0) + 1;
                });
            }
            return acc;
        }, {});

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
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Accesses: ${context.raw}`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        Logger.error('Error rendering table access chart', error);
    }
}

function renderQueryTypeChart(data, containerId) {
    try {
        destroyChart(containerId);
        const ctx = document.getElementById(containerId)?.getContext('2d');
        if (!ctx) {
            Logger.error(`Canvas context not found for ${containerId}`);
            return;
        }

        const queryTypes = data.reduce((acc, query) => {
            if (query.statement) {
                const type = query.statement.trim().split(/\s+/)[0].toUpperCase();
                acc[type] = (acc[type] || 0) + 1;
            }
            return acc;
        }, {});

        const sortedTypes = Object.entries(queryTypes)
            .sort(([,a], [,b]) => b - a);

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: sortedTypes.map(([type]) => type),
                datasets: [{
                    data: sortedTypes.map(([,count]) => count),
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40',
                        '#4BC0C0',
                        '#FF6384'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 12
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.raw / total) * 100).toFixed(1);
                                return `${context.label}: ${context.raw} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        Logger.error('Error rendering query type chart', error);
    }
}

function renderTimelineChart(data, containerId) {
    try {
        destroyChart(containerId);
        const ctx = document.getElementById(containerId)?.getContext('2d');
        if (!ctx) {
            Logger.error(`Canvas context not found for ${containerId}`);
            return;
        }

        const timeData = data
            .filter(q => q.timestamp && q.execution_time)
            .map(q => ({
                x: new Date(q.timestamp),
                y: q.execution_time,
                event: q.event,
                statement: q.statement
            }))
            .sort((a, b) => a.x - b.x);

        if (timeData.length === 0) {
            Logger.warn('No timeline data available');
            return;
        }

        new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Query Execution Time',
                    data: timeData,
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    borderWidth: 1,
                    pointRadius: 2,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'nearest'
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'minute',
                            displayFormats: {
                                millisecond: 'HH:mm:ss.SSS',
                                second: 'HH:mm:ss',
                                minute: 'HH:mm',
                                hour: 'DD/MM HH:mm'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Time'
                        },
                        grid: { display: false }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Execution Time (ms)'
                        },
                        beginAtZero: true,
                        grid: { display: true }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                const point = context[0];
                                const data = point.raw;
                                return `${data.event || 'Query'} at ${point.label}`;
                            },
                            label: function(context) {
                                const data = context.raw;
                                const lines = [
                                    `Execution Time: ${data.y}ms`,
                                ];
                                if (data.statement) {
                                    const truncatedStatement = data.statement.length > 50 ? 
                                        data.statement.substring(0, 47) + '...' : 
                                        data.statement;
                                    lines.push(`Statement: ${truncatedStatement}`);
                                }
                                return lines;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        Logger.error('Error rendering timeline chart', error);
    }
}

// Exportar funções necessárias
window.renderCharts = renderCharts;
window.destroyChart = destroyChart;