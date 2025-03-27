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

function showAnalysisResults() {
    document.getElementById('filters').classList.remove('hidden');
    document.getElementById('kpis').classList.remove('hidden');
    document.getElementById('results').classList.remove('hidden');
    document.getElementById('pagination').classList.remove('hidden');
}

function updateKPIs(data) {
    if (!data || !data.length) return;

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

    document.getElementById('totalQueries').textContent = formatNumber(queries.length);
    document.getElementById('avgExecTime').textContent = formatDuration(avgTime);
    document.getElementById('maxExecTime').textContent = formatDuration(maxTime);
    document.getElementById('slowQueries').textContent = formatNumber(slowQueries);
    document.getElementById('noIndexQueries').textContent = formatNumber(noIndexQueries);
    document.getElementById('indexUsageRate').textContent = `${indexUsageRate.toFixed(1)}%`;
    document.getElementById('totalReads').textContent = formatNumber(totalReads);
    document.getElementById('totalWrites').textContent = formatNumber(totalWrites);
    document.getElementById('totalFetches').textContent = formatNumber(totalFetches);
}