// Configuration
const API_URL = 'http://127.0.0.1:5000';

// Check authentication on page load
window.addEventListener('DOMContentLoaded', () => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (!userData.user_id || userData.user_type !== 'research_center') {
        window.location.href = 'login.html';
        return;
    }

    // Display user name
    document.getElementById('user-name').textContent = `Welcome, ${userData.user_name}`;

    // Load initial data
    loadAllDetections();
    loadFarmers();
    loadStatistics();
});

// Navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Update active nav link
    document.querySelectorAll('.sidebar a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });
}

// Load All Detections
async function loadAllDetections() {
    const detectionsList = document.getElementById('detections-list');
    detectionsList.innerHTML = '<div class="loading">Loading all detections...</div>';

    try {
        const response = await fetch(`${API_URL}/api/all-detections`, {
            credentials: 'include'
        });

        const data = await response.json();

        if (data.detections && data.detections.length > 0) {
            detectionsList.innerHTML = data.detections.map(detection => `
                <div class="history-item">
                    <img src="${API_URL}${detection.image_path}" alt="Detection" class="history-image" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect width=%22100%22 height=%22100%22 fill=%22%23ddd%22/><text x=%2250%%22 y=%2250%%22 fill=%22%23999%22 text-anchor=%22middle%22 dy=%22.3em%22>No Image</text></svg>'">
                    <div class="history-details">
                        <h3>${detection.result === 'healthy' ? '✅ Healthy Leaf' : '⚠️ ' + detection.disease}</h3>
                        <p><strong>Farmer:</strong> ${detection.farmer_name} (ID: ${detection.farmer_id})</p>
                        <p><strong>Date:</strong> ${new Date(detection.timestamp).toLocaleString()}</p>
                        <p><strong>Result:</strong> ${detection.result === 'healthy' ? 'No disease detected' : 'Disease detected'}</p>
                        ${detection.disease && detection.result !== 'healthy' ? `<p><strong>Disease:</strong> ${detection.disease}</p>` : ''}
                        <p><span class="confidence-badge ${detection.result === 'healthy' ? 'healthy-badge' : ''}">${detection.confidence}% Confidence</span></p>
                        <div class="contact-buttons" style="margin-top: 10px;">
                            <button class="btn-contact btn-email" onclick="contactFarmer('${detection.farmer_id}', 'email')">✉️ Email Farmer</button>
                            <button class="btn-contact btn-phone" onclick="contactFarmer('${detection.farmer_id}', 'phone')">📞 Call Farmer</button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            detectionsList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #5A9FBA;">
                    <p style="font-size: 18px; margin-bottom: 10px;">📋 No detections yet</p>
                    <p>Farmers haven't uploaded any images yet.</p>
                </div>
            `;
        }
    } catch (error) {
        detectionsList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #FF6B6B;">
                <p>❌ Failed to load detections</p>
            </div>
        `;
    }
}

// Load Farmers
async function loadFarmers() {
    const farmersList = document.getElementById('farmers-list');
    farmersList.innerHTML = '<div class="loading">Loading farmers...</div>';

    try {
        // Get farmers from users.json via backend
        const response = await fetch(`${API_URL}/api/farmers-list`, {
            credentials: 'include'
        });

        const data = await response.json();

        if (data.farmers && data.farmers.length > 0) {
            farmersList.innerHTML = data.farmers.map(farmer => `
                <div class="research-card">
                    <h3>👨‍🌾 ${farmer.name}</h3>
                    <div class="research-info">
                        <p><strong>📍 Location:</strong> ${farmer.location.address}</p>
                        <p><strong>📞 Phone:</strong> ${farmer.phone}</p>
                        <p><strong>📧 Email:</strong> ${farmer.email}</p>
                        <p><strong>🆔 Farmer ID:</strong> ${farmer.id}</p>
                    </div>
                    <div class="contact-buttons">
                        <a href="mailto:${farmer.email}" class="btn-contact btn-email">✉️ Send Email</a>
                        <a href="tel:${farmer.phone}" class="btn-contact btn-phone">📞 Call Now</a>
                        <a href="https://wa.me/${farmer.phone.replace(/[^0-9]/g, '')}" target="_blank" class="btn-contact" style="background: #25D366;">💬 WhatsApp</a>
                    </div>
                </div>
            `).join('');
        } else {
            farmersList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #5A9FBA;">
                    <p>No farmers registered yet</p>
                </div>
            `;
        }
    } catch (error) {
        farmersList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #FF6B6B;">
                <p>❌ Failed to load farmers</p>
            </div>
        `;
    }
}

// Load Statistics
async function loadStatistics() {
    const statsContent = document.getElementById('statistics-content');
    statsContent.innerHTML = '<div class="loading">Loading statistics...</div>';

    try {
        const response = await fetch(`${API_URL}/api/all-detections`, {
            credentials: 'include'
        });

        const data = await response.json();

        if (data.detections) {
            const total = data.detections.length;
            const healthy = data.detections.filter(d => d.result === 'healthy').length;
            const diseased = total - healthy;

            // Count by disease type
            const diseaseCounts = {};
            data.detections.forEach(d => {
                if (d.result !== 'healthy' && d.disease) {
                    diseaseCounts[d.disease] = (diseaseCounts[d.disease] || 0) + 1;
                }
            });

            statsContent.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
                    <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);">
                        <h3 style="margin: 0 0 10px 0; font-size: 48px;">${total}</h3>
                        <p style="margin: 0; font-size: 16px; opacity: 0.95;">Total Detections</p>
                    </div>
                    <div style="background: linear-gradient(135deg, #87CEEB 0%, #5A9FBA 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(135, 206, 235, 0.3);">
                        <h3 style="margin: 0 0 10px 0; font-size: 48px;">${healthy}</h3>
                        <p style="margin: 0; font-size: 16px; opacity: 0.95;">Healthy Leaves</p>
                    </div>
                    <div style="background: linear-gradient(135deg, #FF6B6B 0%, #EE5A52 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);">
                        <h3 style="margin: 0 0 10px 0; font-size: 48px;">${diseased}</h3>
                        <p style="margin: 0; font-size: 16px; opacity: 0.95;">Diseased Leaves</p>
                    </div>
                </div>

                <div style="background: white; padding: 25px; border-radius: 12px; border: 2px solid #E0F6FF;">
                    <h3 style="color: #2C5F7C; margin: 0 0 20px 0;">Disease Breakdown</h3>
                    ${Object.keys(diseaseCounts).length > 0 ? `
                        <div style="display: grid; gap: 15px;">
                            ${Object.entries(diseaseCounts).map(([disease, count]) => `
                                <div style="display: flex; align-items: center; gap: 15px;">
                                    <div style="flex: 0 0 150px; font-weight: 600; color: #2C5F7C;">${disease}</div>
                                    <div style="flex: 1; background: #E0F6FF; border-radius: 20px; height: 30px; overflow: hidden;">
                                        <div style="background: linear-gradient(90deg, #87CEEB 0%, #5A9FBA 100%); height: 100%; width: ${(count / diseased * 100).toFixed(1)}%; display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; color: white; font-weight: 600; font-size: 13px;">
                                            ${count} (${(count / diseased * 100).toFixed(1)}%)
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p style="text-align: center; color: #5A9FBA;">No disease detections yet</p>'}
                </div>
            `;
        }
    } catch (error) {
        statsContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #FF6B6B;">
                <p>❌ Failed to load statistics</p>
            </div>
        `;
    }
}

// Contact Farmer
async function contactFarmer(farmerId, method) {
    alert(`Contacting farmer ${farmerId} via ${method}...`);
}

// Logout
async function logout() {
    try {
        await fetch(`${API_URL}/api/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    localStorage.removeItem('userData');
    window.location.href = 'login.html';
}
