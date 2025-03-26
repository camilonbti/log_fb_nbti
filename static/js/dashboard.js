// Dashboard initialization
let dashboardData = null;

// Fetch data from backend
async function loadDashboardData() {
    try {
        const sessionId = new URL(window.location.href).pathname.split('/').pop();
        const response = await fetch('/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session_id: sessionId
            })
        });

        if (!response.ok) {
            throw new Error('Failed to load data');
        }

        const result = await response.json();
        if (result.success) {
            dashboardData = result.data;
            renderDashboard();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error loading data:', error);
        // Show error in UI
    }
}

// Render all charts
function renderDashboard() {
    if (!dashboardData) return;

    renderTimeSummary();
    renderFrequency();
    renderDurationDistribution();
    renderFetchesDistribution();
    renderReadsDistribution(); 
    renderTimeline();
}

// Individual chart renderers
function renderTimeSummary() {
    const ctx = document.getElementById('timeSummaryChart').getContext('2d');
    // Implement time summary pie chart
}

function renderFrequency() {
    const ctx = document.getElementById('frequencyChart').getContext('2d');
    // Implement frequency pie chart
}

function renderDurationDistribution() {
    const ctx = document.getElementById('durationChart').getContext('2d');
    // Implement duration bar chart
}

function renderFetchesDistribution() {
    const ctx = document.getElementById('fetchesChart').getContext('2d');
    // Implement fetches bar chart
}

function renderReadsDistribution() {
    const ctx = document.getElementById('readsChart').getContext('2d');
    // Implement reads bar chart
}

function renderTimeline() {
    const ctx = document.getElementById('timelineChart').getContext('2d');
    // Implement timeline line chart
}

// Event handlers
document.getElementById('collapseTimeline')?.addEventListener('change', (e) => {
    // Implement timeline collapse/expand
});

// Initialize dashboard
document.addEventListener('DOMContentLoaded', loadDashboardData);