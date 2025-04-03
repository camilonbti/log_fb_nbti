function displayResults(data) {
    if (!data || !data.length) {
        Logger.warn('No data to display');
        return;
    }

    const tbody = document.getElementById('resultsBody');
    if (!tbody) {
        Logger.error('Results body element not found');
        return;
    }

    // Processar em lotes para evitar stack overflow
    const batchSize = 100;
    let currentIndex = 0;

    function processBatch() {
        const end = Math.min(currentIndex + batchSize, data.length);
        const batch = data.slice(currentIndex, end);
        
        const html = batch.map(record => {
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

        // Append batch HTML
        if (currentIndex === 0) {
            tbody.innerHTML = html;
        } else {
            tbody.insertAdjacentHTML('beforeend', html);
        }

        currentIndex = end;

        // Process next batch if there's more data
        if (currentIndex < data.length) {
            setTimeout(processBatch, 0);
        }
    }

    processBatch();
}

function showAnalysisResults() {
    document.getElementById('filters')?.classList.remove('hidden');
    document.getElementById('kpis')?.classList.remove('hidden');
    document.getElementById('results')?.classList.remove('hidden');
    document.getElementById('pagination')?.classList.remove('hidden');
}

function updateKPIs(data) {
    if (!data || !data.length) {
        Logger.warn('No data for KPI update');
        return;
    }

    try {
        // Processar KPIs em lotes para evitar stack overflow
        const batchSize = 1000;
        let stats = {
            totalQueries: 0,
            totalTime: 0,
            maxTime: 0,
            slowQueries: 0,
            noIndexQueries: 0,
            totalReads: 0,
            totalWrites: 0,
            totalFetches: 0
        };

        for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, Math.min(i + batchSize, data.length));
            
            batch.forEach(query => {
                if (query.statement) {
                    stats.totalQueries++;
                    stats.totalTime += query.execution_time || 0;
                    stats.maxTime = Math.max(stats.maxTime, query.execution_time || 0);
                    
                    if (query.execution_time > 1000) stats.slowQueries++;
                    if (!query.uses_index) stats.noIndexQueries++;
                    
                    stats.totalReads += parseInt(query.reads) || 0;
                    stats.totalWrites += parseInt(query.writes) || 0;
                    stats.totalFetches += parseInt(query.fetches) || 0;
                }
            });
        }

        const avgTime = stats.totalQueries ? Math.round(stats.totalTime / stats.totalQueries) : 0;
        const indexUsageRate = stats.totalQueries ? 
            ((stats.totalQueries - stats.noIndexQueries) / stats.totalQueries * 100) : 0;

        // Atualizar elementos DOM
        document.getElementById('totalQueries').textContent = formatNumber(stats.totalQueries);
        document.getElementById('avgExecTime').textContent = formatDuration(avgTime);
        document.getElementById('maxExecTime').textContent = formatDuration(stats.maxTime);
        document.getElementById('slowQueries').textContent = formatNumber(stats.slowQueries);
        document.getElementById('noIndexQueries').textContent = formatNumber(stats.noIndexQueries);
        document.getElementById('indexUsageRate').textContent = `${indexUsageRate.toFixed(1)}%`;
        document.getElementById('totalReads').textContent = formatNumber(stats.totalReads);
        document.getElementById('totalWrites').textContent = formatNumber(stats.totalWrites);
        document.getElementById('totalFetches').textContent = formatNumber(stats.totalFetches);

    } catch (error) {
        Logger.error('Error updating KPIs', error);
    }
}