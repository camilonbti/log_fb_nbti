let dashboardData = null;

async function loadDashboardData() {
    try {
        const response = await fetch('/analyze/last');
        const result = await response.json();
        
        if (result.success) {
            dashboardData = result.data;
            
            // Initialize filters
            updateTypeFilter(result.stats.statement_types);
            updateTableFilter(result.tables);
            
            // Display data
            displayResults(dashboardData);
            renderCharts(dashboardData);
            
            // Show sections
            document.getElementById('filters').classList.remove('hidden');
            document.getElementById('charts').classList.remove('hidden');
            document.getElementById('results').classList.remove('hidden');
        } else {
            console.error('Error loading dashboard data:', result.error);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function initializeDashboard() {
    // Add event listeners for filters
    const timeFilter = document.getElementById('timeFilter');
    const typeFilter = document.getElementById('typeFilter');
    const tableFilter = document.getElementById('tableFilter');
    const viewFilter = document.getElementById('viewFilter');

    if (timeFilter) timeFilter.addEventListener('input', filterAndDisplayResults);
    if (typeFilter) typeFilter.addEventListener('change', filterAndDisplayResults);
    if (tableFilter) tableFilter.addEventListener('change', filterAndDisplayResults);
    if (viewFilter) viewFilter.addEventListener('change', handleViewFilter);

    // Load initial data
    loadDashboardData();
}

document.addEventListener('DOMContentLoaded', initializeDashboard);