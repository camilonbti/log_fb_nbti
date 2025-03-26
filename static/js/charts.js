function renderCharts(data) {
    console.log("Rendering charts with data:", data);
    const chartsDiv = document.querySelector('.charts');
    if (!chartsDiv) {
        console.error("Charts container not found");
        return;
    }
    
    if (!data || data.length === 0) {
        console.warn("No data available for charts");
        chartsDiv.innerHTML = '<p class="text-center text-gray-500">No data available for visualization</p>';
        return;
    }

    chartsDiv.style.display = 'block';
    renderSummaryChart(data);
    renderTimelineChart(data);
    renderPlanAnalysisChart(data);
}

function renderSummaryChart(data) {
    const ctx = document.getElementById('summaryChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Duration', 'Reads', 'Writes', 'Fetches'],
            datasets: [{
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
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                },
                title: {
                    display: true,
                    text: 'Query Execution Summary'
                }
            }
        }
    });
}

function renderTimelineChart(data) {
    const ctx = document.getElementById('timelineChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.timeline.map(item => item.time),
            datasets: [
                {
                    label: 'Count',
                    data: data.timeline.map(item => item.count),
                    yAxisID: 'count',
                    type: 'bar',
                    backgroundColor: 'rgba(70, 130, 180, 0.3)',
                    borderColor: 'rgb(70, 130, 180)'
                },
                {
                    label: 'Duration',
                    data: data.timeline.map(item => item.duration),
                    yAxisID: 'duration',
                    borderColor: 'rgb(165, 42, 42)',
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                count: {
                    type: 'linear',
                    position: 'left'
                },
                duration: {
                    type: 'linear',
                    position: 'right'
                }
            }
        }
    });
}

function renderPlanAnalysisChart(data) {
    const ctx = document.getElementById('planAnalysisChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(data.planAnalysis),
            datasets: [{
                data: Object.values(data.planAnalysis).map(p => p.count),
                backgroundColor: [
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(255, 206, 86, 0.5)'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                },
                title: {
                    display: true,
                    text: 'Execution Plan Distribution'
                }
            }
        }
    });
}