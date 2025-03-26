function displayResults(data) {
    console.log("Displaying results:", data);
    const tbody = document.getElementById('resultsBody');
    
    if (!tbody) {
        console.error("Results table body not found");
        return;
    }
    
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">No data available</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(record => {
        const rowClass = record.execution_time > 1000 ? 'bg-red-50' : 
                        !record.uses_index ? 'bg-yellow-50' : '';
        
        return `
            <tr class="border-b hover:bg-gray-50 ${rowClass}">
                <td class="px-4 py-2">${record.timestamp || ''}</td>
                <td class="px-4 py-2">${record.event || ''}</td>
                <td class="px-4 py-2"><pre class="whitespace-pre-wrap text-sm">${record.statement || ''}</pre></td>
                <td class="px-4 py-2 ${record.execution_time > 1000 ? 'text-red-600 font-bold' : ''}">${record.execution_time || ''}</td>
                <td class="px-4 py-2">
                    ${record.uses_index ? 
                        '<span class="text-green-600">✓</span>' : 
                        '<span class="text-red-600">✗</span>'}
                </td>
                <td class="px-4 py-2">${record.reads || ''}</td>
                <td class="px-4 py-2">${record.writes || ''}</td>
                <td class="px-4 py-2">${record.fetches || ''}</td>
            </tr>
        `;
    }).join('');
}

function updateKPIs(data) {
    console.log("Updating KPIs with data:", data);
    
    if (!data || data.length === 0) {
        console.warn("No data available for KPIs");
        return;
    }

    const queries = data.filter(q => q.statement);
    const executionTimes = queries.map(q => q.execution_time || 0);
    const maxTime = Math.max(...executionTimes);
    const avgTime = calculateAverageTime(queries);
    const slowQueries = queries.filter(q => q.execution_time > 1000).length;
    const noIndexQueries = queries.filter(q => !q.uses_index).length;
    const indexUsageRate = ((queries.length - noIndexQueries) / queries.length * 100) || 0;

    const totalReads = queries.reduce((sum, q) => sum + (parseInt(q.reads) || 0), 0);
    const totalWrites = queries.reduce((sum, q) => sum + (parseInt(q.writes) || 0), 0);
    const totalFetches = queries.reduce((sum, q) => sum + (parseInt(q.fetches) || 0), 0);

    updateElement('totalQueries', formatNumber(queries.length));
    updateElement('avgExecTime', formatDuration(avgTime));
    updateElement('maxExecTime', formatDuration(maxTime));
    updateElement('slowQueries', formatNumber(slowQueries));
    updateElement('noIndexQueries', formatNumber(noIndexQueries));
    updateElement('indexUsageRate', `${indexUsageRate.toFixed(1)}%`);
    updateElement('totalReads', formatNumber(totalReads));
    updateElement('totalWrites', formatNumber(totalWrites));
    updateElement('totalFetches', formatNumber(totalFetches));
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    } else {
        console.error(`Element with id '${id}' not found`);
    }
}