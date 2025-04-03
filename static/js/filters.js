// Armazena os filtros ativos
let activeFilters = {
    time: 0,
    types: [],
    tables: [],
    events: [],
    view: ''
};

function updateEventFilter(data) {
    const eventFilter = document.getElementById('eventFilter');
    if (!eventFilter) return;

    // Coletar eventos únicos e suas contagens
    const eventCounts = data.reduce((acc, item) => {
        if (item.event) {
            acc[item.event] = (acc[item.event] || 0) + 1;
        }
        return acc;
    }, {});

    // Criar container de checkboxes
    const container = document.createElement('div');
    container.className = 'grid grid-cols-2 gap-2 p-2';
    
    Object.entries(eventCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([event, count]) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'flex items-center space-x-2';
            
            wrapper.innerHTML = `
                <input type="checkbox" 
                       id="event-${event}" 
                       value="${event}" 
                       class="form-checkbox h-4 w-4 text-blue-600"
                       ${activeFilters.events.includes(event) ? 'checked' : ''}>
                <label for="event-${event}" class="text-sm">
                    ${event} (${count})
                </label>
            `;
            
            const checkbox = wrapper.querySelector('input');
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    activeFilters.events.push(event);
                } else {
                    activeFilters.events = activeFilters.events.filter(e => e !== event);
                }
                filterAndDisplayResults();
            });
            
            container.appendChild(wrapper);
        });
    
    eventFilter.innerHTML = '';
    eventFilter.appendChild(container);
}

function updateTypeFilter(statementTypes) {
    const typeFilter = document.getElementById('typeFilter');
    if (!typeFilter) return;

    typeFilter.innerHTML = '<option value="">All Types</option>';
    
    Object.entries(statementTypes)
        .sort(([,a], [,b]) => b - a)
        .forEach(([type, count]) => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = `${type} (${count})`;
            typeFilter.appendChild(option);
        });
}

function updateTableFilter(tables) {
    const tableFilter = document.getElementById('tableFilter');
    if (!tableFilter) return;

    tableFilter.innerHTML = '<option value="">All Tables</option>';
    
    tables.sort().forEach(table => {
        const option = document.createElement('option');
        option.value = table;
        option.textContent = table;
        tableFilter.appendChild(option);
    });
}

function filterAndDisplayResults() {
    if (!logData) return;

    const timeFilter = parseInt(document.getElementById('timeFilter').value) || 0;
    const typeFilter = document.getElementById('typeFilter').value;
    const tableFilter = document.getElementById('tableFilter').value;
    const viewFilter = document.getElementById('viewFilter').value;

    // Atualizar filtros ativos
    activeFilters.time = timeFilter;
    activeFilters.view = viewFilter;

    // Aplicar filtros em sequência
    let filteredData = [...logData];

    // 1. Filtrar por eventos selecionados
    if (activeFilters.events.length > 0) {
        filteredData = filteredData.filter(record => 
            record.event && activeFilters.events.includes(record.event)
        );
    }

    // 2. Filtrar por tempo de execução
    if (timeFilter > 0) {
        filteredData = filteredData.filter(record => 
            record.execution_time && record.execution_time >= timeFilter
        );
    }

    // 3. Filtrar por tipo de statement
    if (typeFilter) {
        filteredData = filteredData.filter(record => 
            record.statement && record.statement.trim().toUpperCase().startsWith(typeFilter)
        );
    }

    // 4. Filtrar por tabela
    if (tableFilter) {
        filteredData = filteredData.filter(record => 
            record.tables && record.tables.includes(tableFilter)
        );
    }

    // 5. Aplicar visualizações especiais
    switch(viewFilter) {
        case 'slow':
            filteredData = filteredData.filter(q => q.execution_time > 1000);
            break;
        case 'noindex':
            filteredData = filteredData.filter(q => !q.uses_index);
            break;
        case 'top6':
            // Primeiro ordenar por tempo de execução
            filteredData.sort((a, b) => (b.execution_time || 0) - (a.execution_time || 0));
            // Depois pegar os 6 primeiros
            filteredData = filteredData.slice(0, 6);
            break;
    }

    // 6. Agrupar por evento e ordenar por tempo de execução
    filteredData = groupByEvent(filteredData);

    // Atualizar visualização
    displayResults(filteredData);
    updateKPIs(filteredData);
    renderCharts(filteredData);
}

function groupByEvent(data) {
    // Primeiro agrupar por evento
    const groups = data.reduce((acc, item) => {
        const event = item.event || 'Unknown';
        if (!acc[event]) {
            acc[event] = [];
        }
        acc[event].push(item);
        return acc;
    }, {});

    // Ordenar cada grupo por tempo de execução
    Object.values(groups).forEach(group => {
        group.sort((a, b) => (b.execution_time || 0) - (a.execution_time || 0));
    });

    // Converter grupos de volta para array plano
    return Object.entries(groups)
        .sort(([a], [b]) => a.localeCompare(b))
        .flatMap(([_, items]) => items);
}

function handleViewFilter(e) {
    activeFilters.view = e.target.value;
    filterAndDisplayResults();
}

// Exportar funções necessárias
window.filterAndDisplayResults = filterAndDisplayResults;
window.handleViewFilter = handleViewFilter;
window.updateEventFilter = updateEventFilter;
window.updateTypeFilter = updateTypeFilter;
window.updateTableFilter = updateTableFilter;