async function displayResults(data) {
    const tbody = document.getElementById('resultsBody');
    if (!tbody) {
        Logger.error('Results body element not found');
        return;
    }

    if (!data || !data.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="21" class="text-center py-4">
                    Nenhum registro encontrado
                </td>
            </tr>
        `;
        return;
    }

    try {
        Logger.info(`Exibindo ${data.length} registros`);
        
        // Limpar tbody antes de adicionar novos dados
        tbody.innerHTML = '';

        // Processar registros em lotes
        const batchSize = 50;
        for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize);
            
            // Criar fragmento para melhor performance
            const fragment = document.createDocumentFragment();
            
            batch.forEach(record => {
                const row = document.createElement('tr');
                row.className = `border-b hover:bg-gray-50 ${
                    record.execution_time > 1000 ? 'bg-red-50' : 
                    !record.uses_index ? 'bg-yellow-50' : ''
                }`;

                // Adicionar células com dados
                const cells = [
                    { value: formatTimestamp(record.timestamp), className: '' },
                    { value: record.event || '', className: '' },
                    { value: record.process_id || '', className: '' },
                    { value: record.process || '', className: '' },
                    { value: record.user || '', className: '' },
                    { value: record.database || '', className: '' },
                    { value: record.client_version || '', className: '' },
                    { value: record.protocol_version || '', className: '' },
                    { value: record.remote_address || '', className: '' },
                    { value: record.transaction_id || '', className: '' },
                    { value: formatIsolationLevel(record.isolation_level), className: '' },
                    { 
                        value: formatDuration(record.execution_time), 
                        className: record.execution_time > 1000 ? 'text-red-600 font-bold' : '' 
                    },
                    { 
                        value: record.uses_index ? '✓' : '✗',
                        className: record.uses_index ? 'text-green-600' : 'text-red-600'
                    },
                    { value: formatNumber(record.reads), className: '' },
                    { value: formatNumber(record.writes), className: '' },
                    { value: formatNumber(record.fetches), className: '' },
                    { value: formatBytes(record.memory_usage), className: '' },
                    { value: formatNumber(record.cache_hits), className: '' },
                    { value: formatNumber(record.cache_misses), className: '' },
                    { value: formatDuration(record.lock_wait_time), className: '' },
                    { value: record.io_stats || '', className: '' }
                ];

                cells.forEach(cell => {
                    const td = document.createElement('td');
                    td.className = `px-4 py-2 ${cell.className}`;
                    
                    if (typeof cell.value === 'string' && cell.value.startsWith('SELECT')) {
                        const pre = document.createElement('pre');
                        pre.className = 'whitespace-pre-wrap text-sm';
                        pre.textContent = cell.value;
                        td.appendChild(pre);
                    } else {
                        td.textContent = cell.value || '';
                    }
                    
                    row.appendChild(td);
                });

                fragment.appendChild(row);
            });
            
            tbody.appendChild(fragment);
            
            // Permitir que a UI atualize
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        Logger.info('Registros exibidos com sucesso');

    } catch (error) {
        Logger.error('Error displaying results', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="21" class="text-center py-4 text-red-600">
                    Erro ao exibir resultados: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Exportar funções
window.displayResults = displayResults;