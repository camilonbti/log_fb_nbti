let logData = null;

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
    renderPerformanceChart(data, 'performanceChart');
    renderTableAccessChart(data, 'tableAccessChart');
}

async function handleFormSubmit(e) {
    e.preventDefault();
    console.log("Form submit triggered");
    
    const formData = new FormData();
    const fileInput = document.getElementById('logFile');
    
    if (!fileInput.files[0]) {
        console.error("No file selected");
        alert('Please select a file');
        return;
    }
    
    console.log("Selected file:", fileInput.files[0].name);
    formData.append('log_file', fileInput.files[0]);

    try {
        console.log("Sending request to /analyze");
        const response = await fetch('/analyze', {
            method: 'POST',
            body: formData
        });
        
        console.log("Received response:", response);
        const result = await response.json();
        console.log("Parsed response data:", result);
        
        if (result.success) {
            logData = result.data;
            console.log("Processed log data:", logData);
            
            if (!logData || logData.length === 0) {
                console.warn("No data received from server");
                alert("No data found in the log file");
                return;
            }
            
            updateKPIs(logData);
            updateTypeFilter(result.stats.statement_types);
            updateTableFilter(result.tables);
            renderCharts(logData);
            filterAndDisplayResults();
            
            console.log("Data processing complete");
        } else {
            console.error("Error in response:", result.error);
            alert('Error analyzing log: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error uploading file: ' + error.message);
    }
}

function filterAndDisplayResults() {
    if (!logData) {
        console.warn("No data available for filtering");
        return;
    }

    const timeFilter = parseInt(document.getElementById('timeFilter').value) || 0;
    const typeFilter = document.getElementById('typeFilter').value;
    const tableFilter = document.getElementById('tableFilter').value;

    console.log("Applying filters:", { timeFilter, typeFilter, tableFilter });

    const filteredData = logData.filter(record => {
        if (timeFilter && (!record.execution_time || record.execution_time < timeFilter)) {
            return false;
        }
        if (typeFilter && (!record.statement || !record.statement.trim().toUpperCase().startsWith(typeFilter))) {
            return false;
        }
        if (tableFilter && (!record.tables || !record.tables.includes(tableFilter))) {
            return false;
        }
        return true;
    });

    console.log("Filtered data:", filteredData);
    displayResults(filteredData);
    updateKPIs(filteredData);
    renderCharts(filteredData);
}

function initializeApp() {
    console.log("Initializing application");
    
    const form = document.getElementById('uploadForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    } else {
        console.error("Upload form not found");
    }

    const timeFilter = document.getElementById('timeFilter');
    const typeFilter = document.getElementById('typeFilter');
    const tableFilter = document.getElementById('tableFilter');
    const viewFilter = document.getElementById('viewFilter');

    if (timeFilter) timeFilter.addEventListener('input', filterAndDisplayResults);
    if (typeFilter) typeFilter.addEventListener('change', filterAndDisplayResults);
    if (tableFilter) tableFilter.addEventListener('change', filterAndDisplayResults);
    if (viewFilter) viewFilter.addEventListener('change', handleViewFilter);
    
    console.log("Event listeners initialized");
}

document.addEventListener('DOMContentLoaded', initializeApp);