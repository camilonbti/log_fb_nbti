// Dashboard Main Module
import { updateKPIs } from './kpi.js';
import { initializeCharts, renderPerformanceChart, renderTableAccessChart } from './charts.js';
import { initializeFilters, filterData, handleViewFilter } from './filters.js';
import { formatNumber, formatDuration, getTopSlowQueries, getMostAccessedTables } from '../utils.js';

export function initializeDashboard(data) {
    initializeCharts();
    initializeFilters(data, getQueryTypeDistribution(data), getUniqueTables(data));
    updateDashboard(data);
}

export function updateDashboard(data) {
    updateKPIs(data);
    renderCharts(data);
    displayResults(data);
}

function renderCharts(data) {
    document.getElementById('charts').classList.remove('hidden');
    renderPerformanceChart(data, 'performanceChart');
    renderTableAccessChart(data, 'tableAccessChart');
}

function getUniqueTables(data) {
    const tables = new Set();
    data.forEach(record => {
        if (record.tables) {
            record.tables.forEach(table => tables.add(table));
        }
    });
    return Array.from(tables);
}

function getQueryTypeDistribution(data) {
    return data.reduce((acc, record) => {
        if (record.statement) {
            const type = record.statement.trim().split(/\s+/)[0].toUpperCase();
            acc[type] = (acc[type] || 0) + 1;
        }
        return acc;
    }, {});
}