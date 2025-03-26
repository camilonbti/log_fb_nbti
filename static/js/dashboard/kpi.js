// KPI Module
export function updateKPIs(data) {
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