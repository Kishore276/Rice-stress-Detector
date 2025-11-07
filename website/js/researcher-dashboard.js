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
            loadReports();
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

let currentReportId = null;

function loadReports() {
    fetch('/api/researcher/reports')
        .then(response => response.json())
        .then(data => {
            if (data.reports) {
                displayReportsList(data.reports);
            }
        })
        .catch(error => {
            console.error('Error loading reports:', error);
            showAlert('Failed to load reports', 'error');
        });
}

function displayReportsList(reports) {
    const reportsList = document.getElementById('reports-list');
    
    if (reports.length === 0) {
        reportsList.innerHTML = '<p class="loading">No reports yet. Create your first report above!</p>';
        return;
    }

    reportsList.innerHTML = reports.map(report => `
        <div class="report-item">
            <div class="report-item-info">
                <h4>${report.title}</h4>
                <div class="report-item-meta">
                    <span>📅 ${new Date(report.created_date).toLocaleDateString()}</span>
                    <span>📊 ${formatReportType(report.report_type)}</span>
                    <span>🗓️ ${report.date_range}</span>
                </div>
                <span class="report-type-badge">${formatReportType(report.report_type)}</span>
            </div>
            <div class="report-item-actions">
                <button class="icon-btn" onclick="viewReport(${report.id})" title="View Report">
                    👁️ View
                </button>
                <button class="icon-btn" onclick="downloadReportPDF(${report.id})" title="Download PDF">
                    📥 Download
                </button>
                <button class="icon-btn danger" onclick="deleteReport(${report.id})" title="Delete Report">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `).join('');
}

function formatReportType(type) {
    const types = {
        'disease-analysis': 'Disease Analysis',
        'farmer-survey': 'Farmer Survey',
        'pesticide-usage': 'Pesticide Usage',
        'climate-impact': 'Climate Impact',
        'treatment-effectiveness': 'Treatment Effectiveness',
        'seasonal-trends': 'Seasonal Trends',
        'custom': 'Custom Research'
    };
    return types[type] || type;
}

function generateCustomReport() {
    const title = document.getElementById('report-title').value.trim();
    const reportType = document.getElementById('report-type').value;
    const startDate = document.getElementById('report-start-date').value;
    const endDate = document.getElementById('report-end-date').value;
    const description = document.getElementById('report-description').value.trim();
    const methodology = document.getElementById('report-methodology').value.trim();
    const recommendations = document.getElementById('report-recommendations').value.trim();

    // Validation
    if (!title) {
        showAlert('Please enter a report title', 'error');
        return;
    }

    if (!reportType) {
        showAlert('Please select a report type', 'error');
        return;
    }

    if (!startDate || !endDate) {
        showAlert('Please select both start and end dates', 'error');
        return;
    }

    if (new Date(startDate) > new Date(endDate)) {
        showAlert('Start date must be before end date', 'error');
        return;
    }

    if (!description) {
        showAlert('Please enter report description/findings', 'error');
        return;
    }

    const reportData = {
        title: title,
        report_type: reportType,
        start_date: startDate,
        end_date: endDate,
        description: description,
        methodology: methodology || null,
        recommendations: recommendations || null
    };

    showAlert('Generating report...', 'info');

    fetch('/api/researcher/reports', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('Report generated and saved successfully!', 'success');
            resetReportForm();
            loadReports(); // Reload reports list
        } else {
            showAlert(data.error || 'Failed to generate report', 'error');
        }
    })
    .catch(error => {
        console.error('Error generating report:', error);
        showAlert('Failed to generate report', 'error');
    });
}

function resetReportForm() {
    document.getElementById('report-title').value = '';
    document.getElementById('report-type').value = '';
    document.getElementById('report-start-date').value = '';
    document.getElementById('report-end-date').value = '';
    document.getElementById('report-description').value = '';
    document.getElementById('report-methodology').value = '';
    document.getElementById('report-recommendations').value = '';
}

function viewReport(reportId) {
    fetch(`/api/researcher/reports/${reportId}`)
        .then(response => response.json())
        .then(data => {
            if (data.report) {
                showReportPreview(data.report);
            }
        })
        .catch(error => {
            console.error('Error loading report:', error);
            showAlert('Failed to load report', 'error');
        });
}

function showReportPreview(report) {
    currentReportId = report.id;
    const modal = document.getElementById('report-preview-modal');
    const content = document.getElementById('report-preview-content');

    content.innerHTML = `
        <h1>${report.title}</h1>
        <div class="report-meta">
            <p><strong>Report Type:</strong> ${formatReportType(report.report_type)}</p>
            <p><strong>Date Range:</strong> ${new Date(report.start_date).toLocaleDateString()} - ${new Date(report.end_date).toLocaleDateString()}</p>
            <p><strong>Generated On:</strong> ${new Date(report.created_date).toLocaleDateString()}</p>
        </div>

        <div class="report-section">
            <h2>Research Findings & Description</h2>
            <p>${report.description.replace(/\n/g, '<br>')}</p>
        </div>

        ${report.methodology ? `
        <div class="report-section">
            <h2>Methodology</h2>
            <p>${report.methodology.replace(/\n/g, '<br>')}</p>
        </div>
        ` : ''}

        ${report.recommendations ? `
        <div class="report-section">
            <h2>Recommendations</h2>
            <p>${report.recommendations.replace(/\n/g, '<br>')}</p>
        </div>
        ` : ''}
    `;

    modal.classList.add('active');
}

function closeReportPreview() {
    const modal = document.getElementById('report-preview-modal');
    modal.classList.remove('active');
    currentReportId = null;
}

function printReport() {
    const reportContent = document.getElementById('report-preview-content').innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    
    printWindow.document.write(`
        <html>
        <head>
            <title>Research Report</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
                h1 { color: #0288D1; border-bottom: 3px solid #4FC3F7; padding-bottom: 10px; }
                h2 { color: #0288D1; margin-top: 30px; }
                .report-meta { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .report-meta p { margin: 5px 0; }
                .report-section { margin: 30px 0; }
                p { text-align: justify; }
                @media print {
                    body { padding: 20px; }
                }
            </style>
        </head>
        <body>
            ${reportContent}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
    }, 250);
}

function downloadReport() {
    if (!currentReportId) return;
    
    fetch(`/api/researcher/reports/${currentReportId}/download`)
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `research-report-${currentReportId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showAlert('Report downloaded successfully!', 'success');
        })
        .catch(error => {
            console.error('Error downloading report:', error);
            showAlert('Download feature coming soon! Use print for now.', 'info');
            // Fallback to print
            printReport();
        });
}

function downloadReportPDF(reportId) {
    fetch(`/api/researcher/reports/${reportId}`)
        .then(response => response.json())
        .then(data => {
            if (data.report) {
                currentReportId = reportId;
                downloadReport();
            }
        })
        .catch(error => {
            console.error('Error downloading report:', error);
            showAlert('Download feature coming soon! Use print for now.', 'info');
        });
}

function deleteReport(reportId) {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
        return;
    }

    fetch(`/api/researcher/reports/${reportId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('Report deleted successfully', 'success');
            loadReports(); // Reload reports list
        } else {
            showAlert(data.error || 'Failed to delete report', 'error');
        }
    })
    .catch(error => {
        console.error('Error deleting report:', error);
        showAlert('Failed to delete report', 'error');
    });
}

// =====================================================
// GENE ANALYSIS
// =====================================================

function submitGeneAnalysis(event) {
    event.preventDefault();
    
    const form = document.getElementById('gene-analysis-form');
    const formData = new FormData(form);
    
    // Convert FormData to JSON
    const data = {
        rice_variety: formData.get('rice_variety'),
        stress_condition: formData.get('stress_condition'),
        ros_level: parseFloat(formData.get('ros_level')),
        osrmc_level: parseFloat(formData.get('osrmc_level')),
        sub1a_level: parseFloat(formData.get('sub1a_level')),
        cat_level: parseFloat(formData.get('cat_level')),
        snca3_level: parseFloat(formData.get('snca3_level')),
        notes: formData.get('notes') || ''
    };
    
    // Validation
    if (!data.rice_variety || !data.stress_condition) {
        showAlert('Please fill all required fields', 'error');
        return;
    }
    
    // Validate numeric values
    const geneValues = [data.ros_level, data.osrmc_level, data.sub1a_level, 
                       data.cat_level, data.snca3_level];
    
    if (geneValues.some(val => isNaN(val) || val < 0 || val > 10)) {
        showAlert('Gene expression levels must be between 0 and 10', 'error');
        return;
    }
    
    // Show loading
    showAlert('Submitting gene analysis data...', 'info');
    
    // Submit to backend
    fetch('/api/researcher/gene-analysis', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Submission failed');
            });
        }
        return response.json();
    })
    .then(result => {
        showAlert('✓ Gene analysis data submitted successfully!', 'success');
        
        // Reset form after successful submission
        setTimeout(() => {
            resetAnalysisForm();
        }, 1500);
    })
    .catch(error => {
        console.error('Error submitting gene analysis:', error);
        showAlert(`Failed to submit: ${error.message}`, 'error');
    });
}

function resetAnalysisForm() {
    const form = document.getElementById('gene-analysis-form');
    if (form) {
        form.reset();
        showAlert('Form reset', 'info');
    }
}

function validateGeneValue(inputId, min = 0, max = 10) {
    const input = document.getElementById(inputId);
    if (input) {
        const value = parseFloat(input.value);
        if (isNaN(value) || value < min || value > max) {
            input.setCustomValidity(`Value must be between ${min} and ${max}`);
        } else {
            input.setCustomValidity('');
        }
    }
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
