let logData = [];
let filteredData = [];
let currentPage = 0;
let pageSize = 10;
let isProcessing = false;
const CHUNK_SIZE = 1000;

// Gerenciamento de dados
function getCurrentPageData() {
    const start = currentPage * pageSize;
    return filteredData.slice(start, start + pageSize);
}

function processDataInChunks(data, chunkSize = CHUNK_SIZE) {
    Logger.info(`Processing data in chunks of ${chunkSize}`);
    const chunks = [];
    for (let i = 0; i < data.length; i += chunkSize) {
        chunks.push(data.slice(i, i + chunkSize));
    }
    return chunks;
}

async function processResponse(response) {
    try {
        const data = await response.json();
        Logger.info('Processing server response');
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to process log file');
        }

        // Resetar estado
        logData = [];
        filteredData = [];
        currentPage = 0;

        // 1. Carregar dados
        Logger.info('Stage: Loading data');
        logData = data.data || [];
        filteredData = [...logData];
        Logger.info(`Loaded ${logData.length} records`);
        
        // 2. Mostrar containers
        showAnalysisResults();

        // 3. Processar dados em chunks
        Logger.info('Stage: Processing data');
        const chunks = await processDataInChunks(logData);
        Logger.info(`Split data into ${chunks.length} chunks`);

        // 4. Atualizar filtros
        Logger.info('Stage: Updating filters');
        await updateEventFilter(logData);
        await updateTypeFilter(data.stats?.statement_types || {});
        await updateTableFilter(data.tables || []);

        // 5. Calcular e atualizar KPIs
        Logger.info('Stage: Updating KPIs');
        await calculateAndUpdateKPIs(filteredData);

        // 6. Renderizar gráficos
        Logger.info('Stage: Rendering charts');
        await renderCharts(filteredData);

        // 7. Exibir resultados e paginação
        Logger.info('Stage: Displaying results');
        await displayResults(getCurrentPageData());
        await updatePaginationInfo();

        return true;
    } catch (error) {
        Logger.error('Error processing response', error);
        throw error;
    }
}

async function calculateAndUpdateKPIs(data) {
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

async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (isProcessing) {
        Logger.warn('Analysis already in progress');
        return;
    }
    
    Logger.info('Starting log analysis');
    isProcessing = true;
    
    const formData = new FormData();
    const fileInput = document.getElementById('logFile');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    if (!fileInput?.files[0]) {
        Logger.warn('No file selected');
        alert('Please select a file');
        isProcessing = false;
        return;
    }
    
    const file = fileInput.files[0];
    Logger.info('Processing file', { name: file.name, size: file.size });
    
    if (file.size > 1024 * 1024 * 1024) {
        Logger.error('File too large');
        alert('File size exceeds 1GB limit');
        isProcessing = false;
        return;
    }
    
    formData.append('log_file', file);

    try {
        loadingIndicator?.classList.remove('hidden');
        
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

async function updatePaginationInfo() {
    if (!filteredData.length) {
        Logger.debug('No data for pagination');
        return;
    }

    const totalPages = Math.ceil(filteredData.length / pageSize);
    const start = currentPage * pageSize + 1;
    const end = Math.min(start + pageSize - 1, filteredData.length);
    
    // Atualizar elementos da paginação
    document.getElementById('pageStart').textContent = start;
    document.getElementById('pageEnd').textContent = end;
    document.getElementById('totalItems').textContent = filteredData.length;
    document.getElementById('currentPage').textContent = currentPage + 1;
    document.getElementById('totalPages').textContent = totalPages;

    // Atualizar estado dos botões
    document.getElementById('firstPage').disabled = currentPage === 0;
    document.getElementById('prevPage').disabled = currentPage === 0;
    document.getElementById('nextPage').disabled = currentPage >= totalPages - 1;
    document.getElementById('lastPage').disabled = currentPage >= totalPages - 1;
}

async function changePage(action) {
    const totalPages = Math.ceil(filteredData.length / pageSize);
    let newPage = currentPage;

    switch (action) {
        case 'first':
            newPage = 0;
            break;
        case 'prev':
            newPage = Math.max(0, currentPage - 1);
            break;
        case 'next':
            newPage = Math.min(totalPages - 1, currentPage + 1);
            break;
        case 'last':
            newPage = totalPages - 1;
            break;
        default:
            if (typeof action === 'number') {
                newPage = Math.max(0, Math.min(totalPages - 1, action));
            }
    }

    if (newPage !== currentPage) {
        currentPage = newPage;
        await displayResults(getCurrentPageData());
        await updatePaginationInfo();
    }
}

function handlePageSizeChange(e) {
    pageSize = parseInt(e.target.value, 10);
    currentPage = 0;
    filterAndDisplayResults();
}

function showAnalysisResults() {
    document.getElementById('filters')?.classList.remove('hidden');
    document.getElementById('kpis')?.classList.remove('hidden');
    document.getElementById('results')?.classList.remove('hidden');
    document.getElementById('charts')?.classList.remove('hidden');
}

// Inicialização
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
    const pageSizeSelect = document.getElementById('pageSizeSelect');

    if (timeFilter) timeFilter.addEventListener('input', filterAndDisplayResults);
    if (typeFilter) typeFilter.addEventListener('change', filterAndDisplayResults);
    if (tableFilter) tableFilter.addEventListener('change', filterAndDisplayResults);
    if (viewFilter) viewFilter.addEventListener('change', handleViewFilter);
    if (pageSizeSelect) pageSizeSelect.addEventListener('change', handlePageSizeChange);
    
    Logger.debug('Event listeners initialized');
}

document.addEventListener('DOMContentLoaded', initializeApp);

// Expose necessary functions
window.changePage = changePage;
window.updatePaginationInfo = updatePaginationInfo;
window.handlePageSizeChange = handlePageSizeChange;
window.logData = logData;
window.filteredData = filteredData;
window.getCurrentPageData = getCurrentPageData;
window.showAnalysisResults = showAnalysisResults;
window.calculateAndUpdateKPIs = calculateAndUpdateKPIs;