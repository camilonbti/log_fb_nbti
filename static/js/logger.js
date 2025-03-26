// Logger utility for handling log messages and progress
const Logger = {
    container: null,
    progressBar: null,
    progressText: null,
    stats: {
        total: 0,
        success: 0,
        errors: 0
    },

    init() {
        this.container = document.getElementById('logContainer');
        this.progressBar = document.getElementById('progressBar');
        this.progressText = document.getElementById('progressText');
        this.clearLog();
    },

    clearLog() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.stats = { total: 0, success: 0, errors: 0 };
        this.updateSummary();
    },

    log(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`); // Browser console logging
        
        if (!this.container) return;
        
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        const timestamp = new Date().toLocaleTimeString();
        entry.textContent = `[${timestamp}] ${message}`;
        
        // Add entry at the top of the log
        if (this.container.firstChild) {
            this.container.insertBefore(entry, this.container.firstChild);
        } else {
            this.container.appendChild(entry);
        }
    },

    updateProgress(current, total) {
        if (!this.progressBar || !this.progressText) return;
        
        const percentage = Math.round((current / total) * 100);
        this.progressBar.style.width = `${percentage}%`;
        this.progressText.textContent = `Processing: ${current} of ${total} records (${percentage}%)`;
        
        // Update summary stats based on progress
        this.stats.total = total;
        this.stats.success = current;
        this.updateSummary();
        
        document.getElementById('progressSection')?.classList.remove('hidden');
    },

    updateStats(success = true) {
        this.stats.total++;
        if (success) {
            this.stats.success++;
        } else {
            this.stats.errors++;
        }
        this.updateSummary();
    },

    updateSummary() {
        document.getElementById('summarySection')?.classList.remove('hidden');
        document.getElementById('totalRecords').textContent = this.stats.total;
        document.getElementById('successfulRecords').textContent = this.stats.success;
        document.getElementById('errorRecords').textContent = this.stats.errors;
    },

    showError(error) {
        const errorMessage = error.message || 'An error occurred';
        const errorDetails = error.stack ? `\nStack: ${error.stack}` : '';
        this.log(`${errorMessage}${errorDetails}`, 'error');
        this.updateStats(false);
    },

    showSuccess(message) {
        this.log(message, 'success');
        this.updateStats(true);
    },

    showWarning(message) {
        this.log(message, 'warning');
    }
};