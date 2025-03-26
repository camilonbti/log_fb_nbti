let logData = null;

async function handleFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData();
    const fileInput = document.getElementById('logFile');
    const dashboardBtn = document.getElementById('dashboardBtn');
    
    if (!fileInput?.files?.[0]) {
        Logger.showError(new Error('Please select a file'));
        return;
    }
    
    formData.append('log_file', fileInput.files[0]);
    Logger.init();
    Logger.log('Starting log analysis...', 'info');

    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            logData = result.data;
            const stats = result.stats;
            
            Logger.log(`Successfully loaded ${stats.total_queries} records`, 'success');
            Logger.updateProgress(stats.total_queries, stats.total_queries);
            
            // Process the data
            logData.forEach((record, index) => {
                Logger.updateProgress(index + 1, logData.length);
                if (record.statement) {
                    Logger.showSuccess(`Processed query: ${record.statement.substring(0, 50)}...`);
                }
            });

            // Update UI with results
            updateKPIs(stats);
            filterAndDisplayResults();
            
            // Show results section
            document.getElementById('resultsSection')?.classList.remove('hidden');
            Logger.log('Analysis completed successfully', 'success');

            // Enable dashboard button
            if (dashboardBtn) {
                dashboardBtn.disabled = false;
                dashboardBtn.classList.remove('bg-gray-400', 'hover:bg-gray-500');
                dashboardBtn.classList.add('bg-green-500', 'hover:bg-green-600');
            }
        } else {
            Logger.showError(new Error(`Error analyzing log: ${result.error}`));
        }
    } catch (error) {
        console.error('Error:', error);
        Logger.showError(error);
    }
}

function filterAndDisplayResults() {
    if (!logData) return;

    const timeFilter = parseInt(document.getElementById('timeFilter')?.value) || 0;
    const typeFilter = document.getElementById('typeFilter')?.value;
    const tableFilter = document.getElementById('tableFilter')?.value;

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

    displayResults(filteredData);
    updateKPIs(filteredData);
}

function displayResults(data) {
    const tbody = document.getElementById('resultsBody');
    if (!tbody) return;

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
    if (!data) return;

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
        }
    });
}

function calculateAverageTime(queries) {
    if (!queries.length) return 0;
    const totalTime = queries.reduce((sum, q) => sum + (q.execution_time || 0), 0);
    return totalTime / queries.length;
}

function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}

function formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms/1000).toFixed(2)}s`;
}

function initializeApp() {
    Logger.init();
    
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