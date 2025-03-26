// Filters Module
export function initializeFilters(data, statementTypes, tables) {
    updateTypeFilter(statementTypes);
    updateTableFilter(tables);
    attachFilterListeners(data);
}

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

function attachFilterListeners(data) {
    const timeFilter = document.getElementById('timeFilter');
    const typeFilter = document.getElementById('typeFilter');
    const tableFilter = document.getElementById('tableFilter');
    const viewFilter = document.getElementById('viewFilter');

    const filters = [timeFilter, typeFilter, tableFilter];
    filters.forEach(filter => {
        if (filter) {
            filter.addEventListener('change', () => filterData(data));
        }
    });

    if (viewFilter) {
        viewFilter.addEventListener('change', (e) => handleViewFilter(e, data));
    }
}

export function filterData(data) {
    const timeFilter = parseInt(document.getElementById('timeFilter').value) || 0;
    const typeFilter = document.getElementById('typeFilter').value;
    const tableFilter = document.getElementById('tableFilter').value;

    return data.filter(record => {
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
}

export function handleViewFilter(e, data) {
    const view = e.target.value;
    let filteredData = [...data];

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

    return filteredData;
}