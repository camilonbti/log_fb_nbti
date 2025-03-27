let logData = [];
const CHUNK_SIZE = 1000;
let currentPage = 0;
let isProcessing = false;

function renderCharts(data) {
    Logger.debug('Rendering charts', { dataLength: data?.length });
    
    if (!data || !data.length) {
        Logger.warn('No data available for charts');
        return;
    }
    
    document.getElementById('charts')?.classList.remove('hidden');
    renderPerformanceChart(data, 'performanceChart');
    renderTableAccessChart(data, 'tableAccessChart');
}

function getCurrentPageData() {
    if (!logData.length) {
        Logger.warn('No log data available');
        return [];
    }
    const start = currentPage * CHUNK_SIZE;
    return logData.slice(start, start + CHUNK_SIZE);
}

function updatePagination() {
    if (!logData || !logData.length) {
        Logger.warn('No data for pagination');
        return;
    }

    const totalPages = Math.ceil(logData.length / CHUNK_SIZE);
    const start = currentPage * CHUNK_SIZE;
    const paginationElement = document.getElementById('pagination');

    if (!paginationElement) {
        Logger.error('Pagination element not found');
        return;
    }

    paginationElement.classList.remove('hidden');
    
    Logger.debug('Updating pagination', {
        currentPage,
        totalPages,
        totalRecords: logData.length,
        start
    });

    paginationElement.innerHTML = `
        <div class="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
            <div class="flex justify-between flex-1 sm:hidden">
                <button onclick="changePage(${currentPage - 1})" 
                        ${currentPage === 0 ? 'disabled' : ''}
                        class="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 ${currentPage === 0 ? 'opacity-50 cursor-not-allowed' : ''}">
                    Previous
                </button>
                <button onclick="changePage(${currentPage + 1})"
                        ${currentPage >= totalPages - 1 ? 'disabled' : ''}
                        class="relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 ${currentPage >= totalPages - 1 ? 'opacity-50 cursor-not-allowed' : ''}">
                    Next
                </button>
            </div>
            <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p class="text-sm text-gray-700">
                        Showing <span class="font-medium">${start + 1}</span> to <span class="font-medium">${Math.min(start + CHUNK_SIZE, logData.length)}</span> of
                        <span class="font-medium">${logData.length}</span> results
                    </p>
                </div>
            </div>
        </div>
    `;
}

function changePage(newPage) {
    Logger.debug('Changing page', { from: currentPage, to: newPage });
    
    const totalPages = Math.ceil(logData.length / CHUNK_SIZE);
    
    if (newPage < 0 || newPage >= totalPages) {
        Logger.warn('Invalid page number', { newPage, totalPages });
        return;
    }
    
    currentPage = newPage;
    displayResults(getCurrentPageData());
    updatePagination();
}

async function processResponse(response) {
    try {
        const data = await response.json();
        Logger.debug('Processing response', { success: data.success });
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to process log file');
        }

        logData = data.data || [];
        
        Logger.info('Data processed successfully', {
            recordCount: logData.length
        });

        // Update UI
        const pageData = getCurrentPageData();
        displayResults(pageData);
        updateKPIs(logData);
        updateTypeFilter(data.stats?.statement_types || {});
        updateTableFilter(data.tables || []);
        renderCharts(logData);
        showAnalysisResults();
        updatePagination();

        if (data.stats) {
            Logger.info('Statistics', data.stats);
        }

        return true;
    } catch (error) {
        Logger.error('Error processing response', error);
        throw error;
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (isProcessing) {
        Logger.warn('Analysis already in progress');
        return;
    }
    
    Logger.info('Starting log analysis');
    isProcessing = true;
    logData = [];
    currentPage = 0;
    
    const formData = new FormData();
    const fileInput = document.getElementById('logFile');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    if (!fileInput || !fileInput.files[0]) {
        Logger.warn('No file selected');
        alert('Please select a file');
        isProcessing = false;
        return;
    }
    
    const file = fileInput.files[0];
    Logger.debug('Selected file', {
        name: file.name,
        size: file.size,
        type: file.type
    });
    
    if (file.size > 1024 * 1024 * 1024) { // 1GB
        Logger.error('File too large', { size: file.size });
        alert('File size exceeds 1GB limit');
        isProcessing = false;
        return;
    }
    
    formData.append('log_file', file);

    try {
        loadingIndicator?.classList.remove('hidden');
        
        Logger.debug('Sending request to analyze endpoint');
        const response = await fetch('/analyze', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        await processResponse(response);
        
    } catch (error) {
        Logger.error('Analysis failed', error);
        alert('Error analyzing log: ' + error.message);
    } finally {
        loadingIndicator?.classList.add('hidden');
        isProcessing = false;
    }
}

function initializeApp() {
    Logger.info('Initializing application');
    
    const form = document.getElementById('uploadForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    } else {
        Logger.error('Upload form not found');
    }

    const timeFilter = document.getElementById('timeFilter');
    const typeFilter = document.getElementById('typeFilter');
    const tableFilter = document.getElementById('tableFilter');
    const viewFilter = document.getElementById('viewFilter');

    if (timeFilter) timeFilter.addEventListener('input', filterAndDisplayResults);
    if (typeFilter) typeFilter.addEventListener('change', filterAndDisplayResults);
    if (tableFilter) tableFilter.addEventListener('change', filterAndDisplayResults);
    if (viewFilter) viewFilter.addEventListener('change', handleViewFilter);
    
    Logger.debug('Event listeners initialized');
}

document.addEventListener('DOMContentLoaded', initializeApp);

// Expose necessary functions to window object
window.changePage = changePage;
window.updatePagination = updatePagination;