function updateTypeFilter(statementTypes) {
    const typeFilter = document.getElementById('typeFilter');
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
    tableFilter.innerHTML = '<option value="">All Tables</option>';
    
    tables.sort().forEach(table => {
        const option = document.createElement('option');
        option.value = table;
        option.textContent = table;
        tableFilter.appendChild(option);
    });
}

function filterAndDisplayResults() {
    if (!logData || !Array.isArray(logData)) return;

    const timeFilter = parseInt(document.getElementById('timeFilter').value) || 0;
    const typeFilter = document.getElementById('typeFilter').value;
    const tableFilter = document.getElementById('tableFilter').value;

    const filteredData = logData.filter(record => {
        if (!record) return false;
        
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
    if (!logData || !Array.isArray(logData)) return;
    
    const view = e.target.value;
    let filteredData = [...logData];

    switch(view) {
        case 'slow':
            filteredData = filteredData.filter(q => q && q.execution_time > 1000);
            break;
        case 'noindex':
            filteredData = filteredData.filter(q => q && !q.uses_index);
            break;
        case 'top6':
            filteredData = getTopSlowQueries(filteredData, 6);
            break;
    }

    displayResults(filteredData);
    updateKPIs(filteredData);
    renderCharts(filteredData);
}