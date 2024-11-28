let logData = null;

function renderCharts(data) {
    document.getElementById('charts').classList.remove('hidden');
    renderPerformanceChart(data, 'performanceChart');
    renderTableAccessChart(data, 'tableAccessChart');
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData();
    const fileInput = document.getElementById('logFile');
    
    if (!fileInput.files[0]) {
        alert('Please select a file');
        return;
    }
    
    formData.append('log_file', fileInput.files[0]);

    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        
        if (result.success) {
            logData = result.data;
            updateKPIs(logData);
            updateTypeFilter(result.stats.statement_types);
            updateTableFilter(result.tables);
            renderCharts(logData);
            filterAndDisplayResults();
            showAnalysisResults();
        } else {
            alert('Error analyzing log: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error uploading file: ' + error.message);
    }
}

function initializeApp() {
    const form = document.getElementById('uploadForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    const timeFilter = document.getElementById('timeFilter');
    const typeFilter = document.getElementById('typeFilter');
    const tableFilter = document.getElementById('tableFilter');
    const viewFilter = document.getElementById('viewFilter');

    if (timeFilter) timeFilter.addEventListener('input', filterAndDisplayResults);
    if (typeFilter) typeFilter.addEventListener('change', filterAndDisplayResults);
    if (tableFilter) tableFilter.addEventListener('change', filterAndDisplayResults);
    if (viewFilter) viewFilter.addEventListener('change', handleViewFilter);
}

document.addEventListener('DOMContentLoaded', initializeApp);