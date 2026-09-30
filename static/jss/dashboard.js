// Dashboard JavaScript - Handles real-time updates
let autoRefreshInterval;
let isAutoRefreshing = false;

// Function to fetch API health data from our Python backend
async function checkHealth() {
    try {
        // Show loading state
        document.getElementById('apiGrid').innerHTML = '<div class="loading">🔄 Checking API health...</div>';
        
        // Call our Python Flask endpoint
        const response = await fetch('/api/health-check');
        const data = await response.json();
        
        // Update dashboard with fresh data
        updateDashboard(data);
        
        // Update last refresh time
        document.getElementById('lastUpdated').textContent = data.timestamp;
        
    } catch (error) {
        console.error('Error fetching health data:', error);
        document.getElementById('apiGrid').innerHTML = '<div class="loading">❌ Error loading data</div>';
    }
}

// Function to update dashboard with API health data
function updateDashboard(data) {
    // Update summary cards
    document.getElementById('totalCount').textContent = data.total_apis;
    document.getElementById('healthyCount').textContent = data.healthy_apis;
    document.getElementById('unhealthyCount').textContent = data.total_apis - data.healthy_apis;
    
    // Create API cards
    const apiGrid = document.getElementById('apiGrid');
    apiGrid.innerHTML = '';
    
    data.results.forEach(api => {
        const card = createApiCard(api);
        apiGrid.appendChild(card);
    });
}

// Function to create individual API status cards
function createApiCard(api) {
    const card = document.createElement('div');
    card.className = `api-card ${api.status}`;
    
    // Determine status emoji and text
    let statusEmoji = '✅';
    let statusText = 'Healthy';
    
    if (api.status === 'unhealthy') {
        statusEmoji = '⚠️';
        statusText = 'Issues';
    } else if (api.status === 'error') {
        statusEmoji = '❌';
        statusText = 'Error';
    }
    
    card.innerHTML = `
        <h3>
            <div class="status-indicator ${api.status}"></div>
            ${api.name}
        </h3>
        <div class="api-details">
            <div class="detail-item">
                <div class="detail-label">Status</div>
                <div class="detail-value">${statusEmoji} ${statusText}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Response Time</div>
                <div class="detail-value">${api.response_time || 0}ms</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Status Code</div>
                <div class="detail-value">${api.status_code || 'N/A'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Last Check</div>
                <div class="detail-value">${api.last_checked}</div>
            </div>
        </div>
        ${api.error ? `<div style="margin-top: 10px; color: #dc3545; font-size: 0.9rem;">Error: ${api.error}</div>` : ''}
    `;
    
    return card;
}

// Function to toggle auto-refresh
function toggleAutoRefresh() {
    const button = document.getElementById('autoRefreshBtn');
    
    if (isAutoRefreshing) {
        // Stop auto-refresh
        clearInterval(autoRefreshInterval);
        button.textContent = '▶️ Start Auto-Refresh';
        isAutoRefreshing = false;
    } else {
        // Start auto-refresh (every 10 seconds)
        autoRefreshInterval = setInterval(checkHealth, 10000);
        button.textContent = '⏸️ Stop Auto-Refresh';
        isAutoRefreshing = true;
    }
}

// Run initial health check when page loads
document.addEventListener('DOMContentLoaded', function() {
    checkHealth();
});
