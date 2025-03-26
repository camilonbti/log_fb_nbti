function displayResults(data) {
    if (!Array.isArray(data)) {
        console.error('Data is not an array:', data);
        return;
    }

    const tbody = document.getElementById('resultsBody');
    tbody.innerHTML = data.map(record => {
        if (!record) return '';
        
        const rowClass = record.execution_time > 1000 ? 'bg-red-50' : '';
        
        return `
            <tr class="border-b hover:bg-gray-50 ${rowClass}">
                <td class="px-4 py-2">${record.timestamp || ''}</td>
                <td class="px-4 py-2">${record.event || ''}</td>
                <td class="px-4 py-2"><pre class="whitespace-pre-wrap text-sm">${record.statement || ''}</pre></td>
                <td class="px-4 py-2">${record.execution_time || ''}</td>
            </tr>
        `;
    }).join('');

    document.getElementById('results').classList.remove('hidden');
}

function showProcessingSummary(stats) {
    if (!stats) return;

    const summaryDiv = document.getElementById('summary');
    if (!summaryDiv) return;

    summaryDiv.innerHTML = `
        <div class="grid grid-cols-3 gap-4 mb-8">
            <div class="bg-white p-4 rounded-lg shadow">
                <h3 class="text-sm font-medium text-gray-500">Total Queries</h3>
                <p class="mt-1 text-2xl font-semibold text-gray-900">${stats.total_queries || 0}</p>
            </div>
            <div class="bg-white p-4 rounded-lg shadow">
                <h3 class="text-sm font-medium text-gray-500">Slow Queries (>1s)</h3>
                <p class="mt-1 text-2xl font-semibold text-red-600">${stats.slow_queries || 0}</p>
            </div>
            <div class="bg-white p-4 rounded-lg shadow">
                <h3 class="text-sm font-medium text-gray-500">No Index Queries</h3>
                <p class="mt-1 text-2xl font-semibold text-yellow-600">${stats.no_index_queries || 0}</p>
            </div>
        </div>
    `;
    summaryDiv.classList.remove('hidden');
}