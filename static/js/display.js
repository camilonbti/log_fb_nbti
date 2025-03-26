function displayResults(data) {
    const tbody = document.getElementById('resultsBody');
    tbody.innerHTML = data.map(record => {
        const rowClass = record.execution_time > 1000 ? 'bg-red-50' : 
                        !record.uses_index ? 'bg-yellow-50' : '';
        
        return `
            <tr class="border-b hover:bg-gray-50 ${rowClass}">
                <td class="px-4 py-2">${record.timestamp || ''}</td>
                <td class="px-4 py-2">${record.event || ''}</td>
                <td class="px-4 py-2"><pre class="whitespace-pre-wrap text-sm">${record.statement || ''}</pre></td>
                <td class="px-4 py-2">${record.tables ? record.tables.join(', ') : ''}</td>
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
    if (!data || !Array.isArray(data)) {
        console.error('Invalid data provided to updateKPIs');
        return;
    }

    const queries = data.filter(q => q.statement);
    const executionTimes = queries.map(q => q.execution_time || 0);
    const maxTime = Math.max(...executionTimes);
    const avgTime = calculateAverageTime(queries);
    const slowQueries = queries.filter(q => q.execution_time > 1000).length;
    const noIndexQueries = queries.filter(q => !q.uses_index).length;
    const indexUsageRate = queries.length ? ((queries.length - noIndexQueries) / queries.length * 100) : 0;

    const totalReads = queries.reduce((sum, q) => sum + (parseInt(q.reads) || 0), 0);
    const totalWrites = queries.reduce((sum, q) => sum + (parseInt(q.writes) || 0), 0);
    const totalFetches = queries.reduce((sum, q) => sum + (parseInt(q.fetches) || 0), 0);

    // Update KPI elements
    const kpiUpdates = {
        'totalQueries': formatNumber(queries.length),
        'avgExecTime': formatDuration(avgTime),
        'maxExecTime': formatDuration(maxTime),
        'slowQueries': formatNumber(slowQueries),
        'noIndexQueries': formatNumber(noIndexQueries),
        'indexUsageRate': `${indexUsageRate.toFixed(1)}%`,
        'totalReads': formatNumber(totalReads),
        'totalWrites': formatNumber(totalWrites),
        'totalFetches': formatNumber(totalFetches)
    };

    // Safely update each KPI element
    Object.entries(kpiUpdates).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        } else {
            console.warn(`Element with id '${id}' not found`);
        }
    });
}

function showAnalysisResults() {
    document.getElementById('initialSection').classList.add('hidden');
    document.getElementById('resultsSection').classList.remove('hidden');
}