// KPIs management module
async function updateKPIs(data) {
    try {
        Logger.info('Calculating KPIs');
        
        const stats = {
            totalQueries: 0,
            totalTime: 0,
            maxTime: 0,
            slowQueries: 0,
            noIndexQueries: 0,
            totalReads: 0,
            totalWrites: 0,
            totalFetches: 0
        };

        // Processar em lotes para evitar bloqueio da UI
        const batchSize = 1000;
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

            // Permitir que a UI atualize
            await new Promise(resolve => setTimeout(resolve, 0));
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

        Logger.info('KPIs updated successfully');
    } catch (error) {
        Logger.error('Error calculating KPIs', error);
        throw error;
    }
}

// Exportar função para escopo global
window.updateKPIs = updateKPIs;