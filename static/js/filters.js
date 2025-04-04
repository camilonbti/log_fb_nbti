// Estado global dos filtros
let activeFilters = {
    time: 0,
    types: new Set(),
    tables: new Set(),
    events: new Set(),
    view: ''
};

// Elemento para mostrar filtros ativos
const activeFiltersContainer = document.createElement('div');
activeFiltersContainer.className = 'flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg mb-4';
document.querySelector('#filters').insertBefore(activeFiltersContainer, document.querySelector('#filters').firstChild);

function updateActiveFiltersDisplay() {
    activeFiltersContainer.innerHTML = '';
    
    // Criar chips para cada filtro ativo
    const createFilterChip = (label, value, type) => {
        const chip = document.createElement('div');
        chip.className = 'inline-flex items-center bg-white border rounded-full px-3 py-1 text-sm';
        chip.innerHTML = `
            <span class="font-medium text-gray-600">${label}:</span>
            <span class="ml-1 text-gray-800">${value}</span>
            <button class="ml-2 text-gray-400 hover:text-gray-600" onclick="removeFilter('${type}', '${value}')">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        `;
        return chip;
    };

    // Adicionar chips para cada tipo de filtro
    if (activeFilters.time > 0) {
        activeFiltersContainer.appendChild(
            createFilterChip('Tempo', `>${activeFilters.time}ms`, 'time')
        );
    }

    activeFilters.events.forEach(event => {
        activeFiltersContainer.appendChild(
            createFilterChip('Evento', event, 'event')
        );
    });

    activeFilters.types.forEach(type => {
        activeFiltersContainer.appendChild(
            createFilterChip('Tipo', type, 'type')
        );
    });

    activeFilters.tables.forEach(table => {
        activeFiltersContainer.appendChild(
            createFilterChip('Tabela', table, 'table')
        );
    });

    if (activeFilters.view) {
        const viewLabels = {
            'slow': 'Queries Lentas',
            'noindex': 'Sem Índice',
            'top6': 'Top 6 Mais Lentas'
        };
        activeFiltersContainer.appendChild(
            createFilterChip('Visualização', viewLabels[activeFilters.view], 'view')
        );
    }

    // Adicionar botão de limpar se houver filtros
    if (activeFilters.time > 0 || activeFilters.events.size > 0 || 
        activeFilters.types.size > 0 || activeFilters.tables.size > 0 || 
        activeFilters.view) {
        const clearButton = document.createElement('button');
        clearButton.className = 'ml-2 text-sm text-blue-600 hover:text-blue-800';
        clearButton.textContent = 'Limpar todos';
        clearButton.onclick = clearAllFilters;
        activeFiltersContainer.appendChild(clearButton);
    }
}

function removeFilter(type, value) {
    switch(type) {
        case 'time':
            activeFilters.time = 0;
            document.getElementById('timeFilter').value = '';
            break;
        case 'event':
            activeFilters.events.delete(value);
            document.querySelector(`input[value="${value}"]`).checked = false;
            break;
        case 'type':
            activeFilters.types.delete(value);
            document.getElementById('typeFilter').value = '';
            break;
        case 'table':
            activeFilters.tables.delete(value);
            document.getElementById('tableFilter').value = '';
            break;
        case 'view':
            activeFilters.view = '';
            document.getElementById('viewFilter').value = '';
            break;
    }
    
    filterAndDisplayResults();
}

function clearAllFilters() {
    activeFilters = {
        time: 0,
        types: new Set(),
        tables: new Set(),
        events: new Set(),
        view: ''
    };

    // Limpar inputs
    document.getElementById('timeFilter').value = '';
    document.getElementById('typeFilter').value = '';
    document.getElementById('tableFilter').value = '';
    document.getElementById('viewFilter').value = '';
    
    // Desmarcar checkboxes de eventos
    document.querySelectorAll('#eventFilter input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });

    filterAndDisplayResults();
}

function filterAndDisplayResults() {
    if (!window.logData) return;

    let filteredData = [...window.logData];

    // Aplicar filtros em sequência
    if (activeFilters.events.size > 0) {
        filteredData = filteredData.filter(record => 
            record.event && activeFilters.events.has(record.event)
        );
    }

    if (activeFilters.time > 0) {
        filteredData = filteredData.filter(record => 
            record.execution_time && record.execution_time >= activeFilters.time
        );
    }

    if (activeFilters.types.size > 0) {
        filteredData = filteredData.filter(record => 
            record.statement && Array.from(activeFilters.types).some(type => 
                record.statement.trim().toUpperCase().startsWith(type)
            )
        );
    }

    if (activeFilters.tables.size > 0) {
        filteredData = filteredData.filter(record => 
            record.tables && Array.from(activeFilters.tables).some(table => 
                record.tables.includes(table)
            )
        );
    }

    switch(activeFilters.view) {
        case 'slow':
            filteredData = filteredData.filter(q => q.execution_time > 1000);
            break;
        case 'noindex':
            filteredData = filteredData.filter(q => !q.uses_index);
            break;
        case 'top6':
            filteredData.sort((a, b) => (b.execution_time || 0) - (a.execution_time || 0));
            filteredData = filteredData.slice(0, 6);
            break;
    }

    // Atualizar display de filtros ativos
    updateActiveFiltersDisplay();

    // Resetar paginação ao filtrar
    window.currentPage = 0;
    
    // Atualizar visualização
    displayResults(filteredData);
    updateKPIs(filteredData);
    renderCharts(filteredData);
}

function handleViewFilter(e) {
    activeFilters.view = e.target.value;
    filterAndDisplayResults();
}

function updateEventFilter(data) {
    const eventFilter = document.getElementById('eventFilter');
    if (!eventFilter) return;

    const eventCounts = data.reduce((acc, item) => {
        if (item.event) {
            acc[item.event] = (acc[item.event] || 0) + 1;
        }
        return acc;
    }, {});

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
                       ${activeFilters.events.has(event) ? 'checked' : ''}>
                <label for="event-${event}" class="text-sm">
                    ${event} (${count})
                </label>
            `;
            
            const checkbox = wrapper.querySelector('input');
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    activeFilters.events.add(event);
                } else {
                    activeFilters.events.delete(event);
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

    typeFilter.innerHTML = '<option value="">Todos os Tipos</option>';
    
    Object.entries(statementTypes)
        .sort(([,a], [,b]) => b - a)
        .forEach(([type, count]) => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = `${type} (${count})`;
            option.selected = activeFilters.types.has(type);
            typeFilter.appendChild(option);
        });

    typeFilter.addEventListener('change', (e) => {
        const value = e.target.value;
        activeFilters.types.clear();
        if (value) activeFilters.types.add(value);
        filterAndDisplayResults();
    });
}

function updateTableFilter(tables) {
    const tableFilter = document.getElementById('tableFilter');
    if (!tableFilter) return;

    tableFilter.innerHTML = '<option value="">Todas as Tabelas</option>';
    
    tables.sort().forEach(table => {
        const option = document.createElement('option');
        option.value = table;
        option.textContent = table;
        option.selected = activeFilters.tables.has(table);
        tableFilter.appendChild(option);
    });

    tableFilter.addEventListener('change', (e) => {
        const value = e.target.value;
        activeFilters.tables.clear();
        if (value) activeFilters.tables.add(value);
        filterAndDisplayResults();
    });
}

// Exportar funções necessárias
window.filterAndDisplayResults = filterAndDisplayResults;
window.handleViewFilter = handleViewFilter;
window.updateEventFilter = updateEventFilter;
window.updateTypeFilter = updateTypeFilter;
window.updateTableFilter = updateTableFilter;
window.removeFilter = removeFilter;
window.clearAllFilters = clearAllFilters;