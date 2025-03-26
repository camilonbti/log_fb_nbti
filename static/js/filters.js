function updateTypeFilter(statementTypes) {
    const typeFilter = document.getElementById('typeFilter');
    if (!typeFilter) {
        console.warn('Type filter element not found');
        return;
    }
    
    typeFilter.innerHTML = '<option value="">All Types</option>';
    
    Object.entries(statementTypes)
        .sort(([,a], [,b]) => b - a)
        .forEach(([type, count]) => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = `${type} (${count})`;
            typeFilter.appendChild(option);
        });
}

function updateTableFilter(tables) {
    const tableFilter = document.getElementById('tableFilter');
    if (!tableFilter) {
        console.warn('Table filter element not found');
        return;
    }
    
    tableFilter.innerHTML = '<option value="">All Tables</option>';
    
    tables.sort().forEach(table => {
        const option = document.createElement('option');
        option.value = table;
        option.textContent = table;
        tableFilter.appendChild(option);
    });
}

function filterAndDisplayResults() {
    if (!window.logData) {
        console.warn('No log data available for filtering');
        return;
    }

    const timeFilter = parseInt(document.getElementById('timeFilter')?.value) || 0;
    const typeFilter = document.getElementById('typeFilter')?.value || '';
    const tableFilter = document.getElementById('tableFilter')?.value || '';

    const filteredData = window.logData.filter(record => {
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

    displayResults(filteredData);
    updateKPIs(filteredData);
    renderCharts(filteredData);
}

function handleViewFilter(e) {
    if (!window.logData) {
        console.warn('No log data available for view filtering');
        return;
    }

    const view = e.target.value;
    let filteredData = [...window.logData];

    switch(view) {
        case 'slow':
            filteredData = filteredData.filter(q => q.execution_time > 1000);
            break;
        case 'noindex':
            filteredData = filteredData.filter(q => !q.uses_index);
            break;
        case 'top6':
            filteredData = getTopSlowQueries(filteredData, 6);
            break;
    }

    displayResults(filteredData);
    updateKPIs(filteredData);
    renderCharts(filteredData);
}

// Export functions for use in other modules
window.updateTableFilter = updateTableFilter;
window.updateTypeFilter = updateTypeFilter;
window.filterAndDisplayResults = filterAndDisplayResults;
window.handleViewFilter = handleViewFilter;