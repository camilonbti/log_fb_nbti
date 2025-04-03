function safe_int(value, default_value = 0) {
    try {
        return parseInt(value) || default_value;
    } catch {
        return default_value;
    }
}

function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}

function formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms/1000).toFixed(2)}s`;   
}

function calculateAverageTime(queries) {
    if (!queries.length) return 0;
    const totalTime = queries.reduce((sum, q) => sum + (q.execution_time || 0), 0);
    return Math.round(totalTime / queries.length);
}

function getTopSlowQueries(queries, limit = 6) {
    return queries
        .filter(q => q.execution_time && q.execution_time > 0)
        .sort((a, b) => (b.execution_time || 0) - (a.execution_time || 0))
        .slice(0, limit);
}

function getMostAccessedTables(queries) {
    const tableCounts = {};
    queries.forEach(query => {
        if (query.tables) {
            query.tables.forEach(table => {
                tableCounts[table] = (tableCounts[table] || 0) + 1;
            });
        }
    });
    return tableCounts;
}

function getQueryTypeDistribution(queries) {
    const distribution = {};
    queries.forEach(query => {
        if (query.statement) {
            const type = query.statement.trim().split(/\s+/)[0].toUpperCase();
            distribution[type] = (distribution[type] || 0) + 1;
        }
    });
    return distribution;
}