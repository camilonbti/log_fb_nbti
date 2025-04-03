let logData = [];
let currentPage = 0;
let isProcessing = false;
const BATCH_SIZE = 1000;
const CHUNK_SIZE = 1000;

// Gerenciamento de dados
function getCurrentPageData() {
    const start = currentPage * BATCH_SIZE;
    return logData.slice(start, start + BATCH_SIZE);
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

        logData = data.data || [];
        Logger.info(`Loaded ${logData.length} records`);

        // Analisar e logar eventos distintos
        const uniqueEvents = [...new Set(logData.map(item => item.event))].filter(Boolean);
        Logger.info('Eventos distintos encontrados:', uniqueEvents);
        
        // Contar ocorrências de cada evento
        const eventCounts = {};
        logData.forEach(item => {
            if (item.event) {
                eventCounts[item.event] = (eventCounts[item.event] || 0) + 1;
            }
        });
        Logger.info('Contagem de eventos:', eventCounts);

        // Processar dados em etapas
        const stages = [
            {
                name: 'Loading data',
                action: () => {
                    showAnalysisResults();
                    return true;
                }
            },
            {
                name: 'Processing data',
                action: () => {
                    const chunks = processDataInChunks(logData);
                    Logger.info(`Split data into ${chunks.length} chunks`);
                    return chunks;
                }
            },
            {
                name: 'Updating filters',
                action: () => {
                    updateEventFilter(logData);
                    updateTypeFilter(data.stats?.statement_types || {});
                    updateTableFilter(data.tables || []);
                    return true;
                }
            },
            {
                name: 'Rendering UI',
                action: () => {
                    updateKPIs(logData);
                    displayResults(getCurrentPageData());
                    updatePagination();
                    return true;
                }
            }
        ];

        // Executar etapas sequencialmente
        for (const stage of stages) {
            Logger.info(`Stage: ${stage.name}`);
            await stage.action();
        }

        // Renderizar gráficos após processamento
        Logger.info('Rendering charts');
        renderCharts(logData);

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

function updatePagination() {
    if (!logData.length) {
        Logger.debug('No data for pagination');
        return;
    }

    const totalPages = Math.ceil(logData.length / BATCH_SIZE);
    const start = currentPage * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, logData.length);
    
    const paginationElement = document.getElementById('pagination');
    if (!paginationElement) {
        Logger.error('Pagination element not found');
        return;
    }

    paginationElement.classList.remove('hidden');
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
                        Showing <span class="font-medium">${start + 1}</span> to <span class="font-medium">${end}</span> of
                        <span class="font-medium">${logData.length}</span> results
                    </p>
                </div>
            </div>
        </div>
    `;
}

function changePage(newPage) {
    const totalPages = Math.ceil(logData.length / BATCH_SIZE);
    if (newPage < 0 || newPage >= totalPages) {
        Logger.warn('Invalid page number', { newPage, totalPages });
        return;
    }
    
    currentPage = newPage;
    displayResults(getCurrentPageData());
    updatePagination();
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

    if (timeFilter) timeFilter.addEventListener('input', filterAndDisplayResults);
    if (typeFilter) typeFilter.addEventListener('change', filterAndDisplayResults);
    if (tableFilter) tableFilter.addEventListener('change', filterAndDisplayResults);
    if (viewFilter) viewFilter.addEventListener('change', handleViewFilter);
    
    Logger.debug('Event listeners initialized');
}

document.addEventListener('DOMContentLoaded', initializeApp);

// Expose necessary functions
window.changePage = changePage;
window.updatePagination = updatePagination;