// Funções utilitárias
function safe_int(value, default_value = 0) {
    try {
        return parseInt(value) || default_value;
    } catch {
        return default_value;
    }
}

function formatNumber(num) {
    if (num === null || num === undefined) return '';
    return new Intl.NumberFormat().format(num);
}

function formatDuration(ms) {
    if (!ms) return '';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms/1000).toFixed(2)}s`;   
}

function formatBytes(bytes) {
    if (!bytes) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unitIndex = 0;
    
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }
    
    return `${value.toFixed(2)} ${units[unitIndex]}`;
}

function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    try {
        const date = new Date(timestamp);
        return date.toLocaleString();
    } catch {
        return timestamp;
    }
}

function formatIsolationLevel(level) {
    if (!level) return '';
    const levels = {
        '0': 'Read Uncommitted',
        '1': 'Read Committed',
        '2': 'Repeatable Read',
        '3': 'Serializable'
    };
    return levels[level] || level;
}

function truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Exportar funções
window.formatNumber = formatNumber;
window.formatDuration = formatDuration;
window.formatBytes = formatBytes;
window.formatTimestamp = formatTimestamp;
window.formatIsolationLevel = formatIsolationLevel;
window.truncateText = truncateText;
window.safe_int = safe_int;