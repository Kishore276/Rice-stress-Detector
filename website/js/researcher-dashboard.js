// =====================================================
// RESEARCHER DASHBOARD - JavaScript
// =====================================================

let currentPage = 1;
const itemsPerPage = 10;
let allFarmers = [];
let filteredFarmers = [];

document.addEventListener('DOMContentLoaded', function() {
    loadDashboardStats();
    setupTabNavigation();
});

// =====================================================
// TAB NAVIGATION
// =====================================================

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const section = document.getElementById(sectionName + '-section');
    if (section) {
        section.classList.add('active');

        // Load section-specific data
        if (sectionName === 'farmers') {
            loadFarmers();
        } else if (sectionName === 'statistics') {
            loadStatistics();
        } else if (sectionName === 'reports') {
            // Reports section is static
        }
    }
}

function setupTabNavigation() {
    showSection('dashboard');
}

// =====================================================
// DASHBOARD STATS
// =====================================================

function loadDashboardStats() {
    // Load farmers for stats
    fetch('/api/researcher/farmers')
        .then(response => response.json())
        .then(data => {
            if (data.farmers) {
                allFarmers = data.farmers;
                
                // Update stats
                document.getElementById('total-farmers').textContent = data.farmers.length;
                
                let totalArea = 0;
                data.farmers.forEach(farmer => {
                    totalArea += farmer.farm_size;
                });
                
                document.getElementById('total-farm-area').textContent = totalArea.toFixed(1) + ' ha';
            }
        })
        .catch(error => {
            console.error('Error loading stats:', error);
        });
}

// =====================================================
// FARMERS LIST
// =====================================================

function loadFarmers() {
    fetch('/api/researcher/farmers')
        .then(response => response.json())
        .then(data => {
            allFarmers = data.farmers;
            filteredFarmers = [...allFarmers];
            
            // Populate city filter
            populateCityFilter();
            
            // Display first page
            displayFarmersPage();
        })
        .catch(error => {
            console.error('Error loading farmers:', error);
            showAlert('Failed to load farmers', 'error');
        });
}

function populateCityFilter() {
    const select = document.getElementById('city-filter');
    const cities = [...new Set(allFarmers.map(f => f.city))].sort();
    
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        select.appendChild(option);
    });
}

function filterFarmers() {
    const searchTerm = document.getElementById('farmer-search').value.toLowerCase();
    const cityFilter = document.getElementById('city-filter').value;

    filteredFarmers = allFarmers.filter(farmer => {
        const matchesSearch = !searchTerm || 
            farmer.full_name.toLowerCase().includes(searchTerm) ||
            farmer.email.toLowerCase().includes(searchTerm) ||
            farmer.city.toLowerCase().includes(searchTerm);

        const matchesCity = !cityFilter || farmer.city === cityFilter;

        return matchesSearch && matchesCity;
    });

    currentPage = 1;
    displayFarmersPage();
}

function displayFarmersPage() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = filteredFarmers.slice(start, end);

    const list = document.getElementById('farmers-list');
    
    if (pageItems.length === 0) {
        list.innerHTML = '<p class="loading">No farmers found</p>';
        document.getElementById('page-info').textContent = 'Page 0';
        return;
    }

    list.innerHTML = pageItems.map(farmer => `
        <div class="farmer-card">
            <div class="farmer-info">
                <div class="info-field">
                    <label>Name</label>
                    <value>${farmer.full_name}</value>
                </div>
                <div class="info-field">
                    <label>City</label>
                    <value>${farmer.city}, ${farmer.state}</value>
                </div>
                <div class="info-field">
                    <label>Farm Size</label>
                    <value>${farmer.farm_size} hectares</value>
                </div>
                <div class="info-field">
                    <label>Email</label>
                    <value>${farmer.email}</value>
                </div>
                <div class="info-field">
                    <label>Phone</label>
                    <value>${farmer.phone_number || 'N/A'}</value>
                </div>
                <div class="info-field">
                    <label>WhatsApp</label>
                    <value>${farmer.whatsapp_number}</value>
                </div>
            </div>
            <div class="farmer-actions">
                <button class="action-link" onclick="viewFarmerDetails(${farmer.id})">View Details</button>
                <button class="action-link" onclick="contactFarmer('${farmer.whatsapp_number}')">Contact</button>
            </div>
        </div>
    `).join('');

    const totalPages = Math.ceil(filteredFarmers.length / itemsPerPage);
    document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayFarmersPage();
        window.scrollTo(0, 0);
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredFarmers.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayFarmersPage();
        window.scrollTo(0, 0);
    }
}

function viewFarmerDetails(farmerId) {
    showAlert('Loading farmer details...', 'info');
    // TODO: Implement detailed view
}

function contactFarmer(whatsappNumber) {
    window.open(`https://wa.me/${whatsappNumber}`, '_blank');
}

// =====================================================
// STATISTICS
// =====================================================

function loadStatistics() {
    // Create sample charts
    setTimeout(() => {
        createDiseaseChart();
        createRegionalChart();
        createTrendsChart();
        loadTopCities();
    }, 100);
}

function createDiseaseChart() {
    const ctx = document.getElementById('disease-chart');
    
    if (ctx.innerHTML.includes('canvas')) return; // Already created
    
    ctx.innerHTML = `
        <canvas id="diseaseCanvas"></canvas>
    `;

    const canvas = document.getElementById('diseaseCanvas');
    
    new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Bacterial Blight', 'Blast', 'Brown Spot', 'Tungro'],
            datasets: [{
                data: [25, 35, 20, 20],
                backgroundColor: [
                    '#667eea',
                    '#764ba2',
                    '#f093fb',
                    '#4facfe'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createRegionalChart() {
    const ctx = document.getElementById('regional-chart');
    
    if (ctx.innerHTML.includes('canvas')) return;
    
    ctx.innerHTML = `
        <canvas id="regionalCanvas"></canvas>
    `;

    const canvas = document.getElementById('regionalCanvas');
    
    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ['Odisha', 'Tamil Nadu', 'Punjab', 'Uttar Pradesh', 'West Bengal'],
            datasets: [{
                label: 'Number of Farmers',
                data: [45, 38, 52, 41, 35],
                backgroundColor: '#667eea'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createTrendsChart() {
    const ctx = document.getElementById('trends-chart');
    
    if (ctx.innerHTML.includes('canvas')) return;
    
    ctx.innerHTML = `
        <canvas id="trendsCanvas"></canvas>
    `;

    const canvas = document.getElementById('trendsCanvas');
    
    new Chart(canvas, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Disease Cases',
                data: [12, 19, 15, 25, 22, 30],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function loadTopCities() {
    const cityStats = document.getElementById('cities-list');
    
    const cities = {};
    allFarmers.forEach(farmer => {
        cities[farmer.city] = (cities[farmer.city] || 0) + 1;
    });

    const topCities = Object.entries(cities)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    cityStats.innerHTML = topCities.map(([city, count]) => `
        <div class="city-stat-item">
            <span class="city-name">${city}</span>
            <span class="city-count">${count} farmers</span>
        </div>
    `).join('');
}

// =====================================================
// REPORTS
// =====================================================

function generateReport(reportType) {
    showAlert(`Generating ${reportType} report...`, 'info');
    
    // Simulate report generation
    setTimeout(() => {
        // In real app, this would download a file
        showAlert('Report generated successfully! Downloading...', 'success');
    }, 2000);
}

function generateCustomReport() {
    const reportType = document.getElementById('report-type').value;
    const startDate = document.getElementById('report-start-date').value;
    const endDate = document.getElementById('report-end-date').value;

    if (!reportType || !startDate || !endDate) {
        showAlert('Please fill all fields', 'error');
        return;
    }

    if (new Date(startDate) > new Date(endDate)) {
        showAlert('Start date must be before end date', 'error');
        return;
    }

    showAlert('Generating custom report...', 'info');
    
    setTimeout(() => {
        showAlert('Custom report generated successfully!', 'success');
    }, 2000);
}

// =====================================================
// LOGOUT
// =====================================================

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = '/logout';
    }
}

// =====================================================
// ALERTS
// =====================================================

function showAlert(message, type = 'info') {
    const container = document.getElementById('alert-container');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    container.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 5000);
}
