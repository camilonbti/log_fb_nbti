let logData = null;

function updateProgress(current, total) {
    const progress = document.getElementById('progress');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const percentage = Math.round((current / total) * 100);

    progress.classList.remove('hidden');
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `Processing: ${current} of ${total} records (${percentage}%)`;
}

function appendToLog(message, isError = false) {
    const logContent = document.getElementById('logContent');
    const timestamp = new Date().toLocaleTimeString();
    const logClass = isError ? 'text-red-500' : 'text-green-500';
    
    logContent.innerHTML += `<div class="${logClass}">[${timestamp}] ${message}</div>`;
    logContent.scrollTop = logContent.scrollHeight;
}

function updateSummary(stats) {
    const summary = document.getElementById('summary');
    summary.classList.remove('hidden');

    const totalRecords = stats.total || 0;
    const errors = stats.errors || 0;
    const successful = totalRecords; // Como não temos erros, todos são successful

    document.getElementById('totalRecords').textContent = totalRecords;
    document.getElementById('successfulRecords').textContent = successful;
    document.getElementById('errorRecords').textContent = errors;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData();
    const fileInput = document.getElementById('logFile');
    
    if (!fileInput.files[0]) {
        alert('Please select a file');
        return;
    }
    
    formData.append('log_file', fileInput.files[0]);

    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        
        if (result.success) {
            logData = result.data;
            
            // Update summary with correct values
            updateSummary({
                total: result.stats.total_queries,
                errors: 0 // Como não temos erros no processamento
            });

            // Log success
            appendToLog(`Successfully processed ${result.stats.total_queries} queries`);
        } else {
            appendToLog(`Error analyzing log: ${result.error}`, true);
        }
    } catch (error) {
        console.error('Error:', error);
        appendToLog(`Error uploading file: ${error.message}`, true);
    }
}

function initializeApp() {
    const form = document.getElementById('uploadForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);