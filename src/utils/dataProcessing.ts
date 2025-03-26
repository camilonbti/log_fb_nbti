export function calculateQueryStats(data) {
    const totalQueries = data.length;
    const slowQueries = data.filter(q => q.execution_time > 1000).length;
    const noIndexQueries = data.filter(q => !q.uses_index).length;
    
    const totalDuration = data.reduce((sum, q) => sum + (q.execution_time || 0), 0);
    const totalReads = data.reduce((sum, q) => sum + (q.reads || 0), 0);
    const totalWrites = data.reduce((sum, q) => sum + (q.writes || 0), 0);
    const totalFetches = data.reduce((sum, q) => sum + (q.fetches || 0), 0);
  
    return {
      totalQueries,
      slowQueries,
      noIndexQueries,
      totalDuration,
      totalReads,
      totalWrites,
      totalFetches,
      avgDuration: totalDuration / totalQueries
    };
  }
  
  export function groupByTimeInterval(data, interval = 'minute') {
    const groups = {};
    
    data.forEach(record => {
      const date = new Date(record.timestamp);
      date.setSeconds(0, 0);
      const key = date.toISOString();
      
      if (!groups[key]) {
        groups[key] = {
          count: 0,
          totalDuration: 0,
          reads: 0,
          writes: 0,
          fetches: 0
        };
      }
      
      groups[key].count++;
      groups[key].totalDuration += record.execution_time || 0;
      groups[key].reads += record.reads || 0;
      groups[key].writes += record.writes || 0;
      groups[key].fetches += record.fetches || 0;
    });
  
    return groups;
  }
  
  export function getTopSlowQueries(data, limit = 10) {
    return [...data]
      .filter(q => q.execution_time > 0)
      .sort((a, b) => (b.execution_time || 0) - (a.execution_time || 0))
      .slice(0, limit);
  }
  
  export function getMostAccessedTables(data) {
    const tableCounts = {};
    
    data.forEach(record => {
      if (record.tables) {
        record.tables.forEach(table => {
          tableCounts[table] = (tableCounts[table] || 0) + 1;
        });
      }
    });
  
    return tableCounts;
  }