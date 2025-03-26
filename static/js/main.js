let logData = null;

function handleFormSubmit(e) {
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
    const viewFilter = document.getElementById('viewFilter');

    if (timeFilter) timeFilter.addEventListener('input', filterAndDisplayResults);
    if (typeFilter) typeFilter.addEventListener('change', filterAndDisplayResults);
    if (viewFilter) viewFilter.addEventListener('change', handleViewFilter);
    
    console.log("Event listeners initialized");
}

document.addEventListener('DOMContentLoaded', initializeApp);