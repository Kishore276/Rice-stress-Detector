// Configuration
const API_URL = 'http://127.0.0.1:5000';
let map = null;
let userLocation = null;
let allMarkers = []; // Store all markers for search functionality
let searchMarkers = []; // Store search result markers
let userMarker = null;
let userCircle = null;
let watchId = null;

// Check authentication on page load
window.addEventListener('DOMContentLoaded', () => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (!userData.user_id || userData.user_type !== 'farmer') {
        window.location.href = 'login.html';
        return;
    }

    // Display user name
    document.getElementById('user-name').textContent = `Welcome, ${userData.user_name}`;

    // Setup navigation
    setupNavigation();

    // Load initial data
    loadMyHistory();
    initializeMap();
    loadPesticideShops();
    loadResearchCenters();

    // Setup upload functionality
    setupUpload();
});

// Navigation
function setupNavigation() {
    // Navigation is handled by onclick in HTML
}

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

    // Resize map if needed
    if (sectionId === 'shops' && map) {
        setTimeout(() => map.invalidateSize(), 100);
    }
}

// Upload Functionality
function setupUpload() {
    const fileInput = document.getElementById('imageInput');
    const uploadBox = document.getElementById('uploadBox');
    const previewBox = document.getElementById('previewBox');
    const previewImage = document.getElementById('previewImage');
    const resultsSection = document.getElementById('resultsSection');

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.src = e.target.result;
                uploadBox.style.display = 'none';
                previewBox.style.display = 'block';
                
                // Automatically analyze the image
                analyzeImage(file);
            };
            reader.readAsDataURL(file);
        }
    });
}

function clearImage() {
    document.getElementById('imageInput').value = '';
    document.getElementById('uploadBox').style.display = 'block';
    document.getElementById('previewBox').style.display = 'none';
    document.getElementById('resultsSection').innerHTML = '';
}

async function analyzeImage(file) {
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.innerHTML = '<div class="loading">Analyzing image...</div>';

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_URL}/api/predict`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        const data = await response.json();

        if (data.error) {
            showResults({
                status: 'error',
                message: data.error
            });
        } else {
            showResults(data);
            // Reload history
            loadMyHistory();
        }
    } catch (error) {
        showResults({
            status: 'error',
            message: 'Failed to analyze image. Please try again.'
        });
    }
}

function showResults(data) {
    const resultsSection = document.getElementById('resultsSection');
    
    if (data.status === 'error') {
        resultsSection.innerHTML = `
            <div style="background: #FFE5E5; border-left: 4px solid #FF6B6B; padding: 20px; border-radius: 8px; color: #D32F2F;">
                <h3 style="margin-bottom: 10px;">❌ Error</h3>
                <p style="font-size: 16px;">${data.message}</p>
            </div>
        `;
        return;
    }

    if (data.status === 'healthy') {
        resultsSection.innerHTML = `
            <div style="background: #E8F5E9; border-left: 4px solid #4CAF50; padding: 20px; border-radius: 8px; color: #2E7D32;">
                <h3 style="margin-bottom: 10px;">✅ Healthy Rice Leaf</h3>
                <p style="font-size: 16px;">The rice leaf appears to be healthy with no visible diseases.</p>
                <p style="margin-top: 10px; font-weight: 600;">Confidence: ${data.confidence}%</p>
            </div>
        `;
    } else if (data.status === 'diseased') {
        resultsSection.innerHTML = `
            <div style="background: #FFF3E0; border-left: 4px solid #FF9800; padding: 20px; border-radius: 8px; color: #E65100;">
                <h3 style="margin-bottom: 15px;">⚠️ Disease Detected</h3>
                <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                    <p style="font-size: 18px; font-weight: 600; color: #2C5F7C; margin-bottom: 5px;">${data.disease}</p>
                    <p style="font-size: 14px; color: #5A9FBA;">Confidence: ${data.confidence}%</p>
                </div>
                ${data.recommendations ? `
                    <div style="background: white; padding: 15px; border-radius: 6px;">
                        <h4 style="color: #2C5F7C; margin-bottom: 10px;">📋 Recommendations:</h4>
                        <p style="color: #5A9FBA; line-height: 1.6;">${data.recommendations}</p>
                    </div>
                ` : ''}
                <p style="margin-top: 15px; font-size: 14px;">💡 <strong>Tip:</strong> Visit "Nearby Shops" to find pesticides and fertilizers, or contact a research center for expert advice.</p>
            </div>
        `;
    }
}

// Load Detection History
async function loadMyHistory() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '<div class="loading">Loading your detection history...</div>';

    try {
        const response = await fetch(`${API_URL}/api/my-detections`, {
            credentials: 'include'
        });

        const data = await response.json();

        if (data.detections && data.detections.length > 0) {
            historyList.innerHTML = data.detections.map(detection => `
                <div class="history-item">
                    <img src="${API_URL}${detection.image_path}" alt="Detection" class="history-image" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect width=%22100%22 height=%22100%22 fill=%22%23ddd%22/><text x=%2250%%22 y=%2250%%22 fill=%22%23999%22 text-anchor=%22middle%22 dy=%22.3em%22>No Image</text></svg>'">
                    <div class="history-details">
                        <h3>${detection.result === 'healthy' ? '✅ Healthy Leaf' : '⚠️ ' + detection.disease}</h3>
                        <p><strong>Date:</strong> ${new Date(detection.timestamp).toLocaleString()}</p>
                        <p><strong>Result:</strong> ${detection.result === 'healthy' ? 'No disease detected' : 'Disease detected'}</p>
                        ${detection.disease && detection.result !== 'healthy' ? `<p><strong>Disease:</strong> ${detection.disease}</p>` : ''}
                        <p><span class="confidence-badge ${detection.result === 'healthy' ? 'healthy-badge' : ''}">${detection.confidence}% Confidence</span></p>
                    </div>
                </div>
            `).join('');
        } else {
            historyList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #5A9FBA;">
                    <p style="font-size: 18px; margin-bottom: 10px;">📋 No detection history yet</p>
                    <p>Upload an image in the "Disease Detection" section to get started!</p>
                </div>
            `;
        }
    } catch (error) {
        historyList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #FF6B6B;">
                <p>❌ Failed to load detection history</p>
            </div>
        `;
    }
}

// Map Initialization
function initializeMap() {
    // Default location (Hyderabad, India)
    const defaultLat = 17.385044;
    const defaultLng = 78.486671;

    // Initialize map with better zoom controls
    map = L.map('map', {
        center: [defaultLat, defaultLng],
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true,
        boxZoom: true,
        keyboard: true
    });

    // Fix map display issues
    setTimeout(() => {
        map.invalidateSize();
    }, 100);

    // Add multiple tile layer options
    const streetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 5
    });

    const satelliteMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri',
        maxZoom: 19,
        minZoom: 5
    });

    // Add default layer
    streetMap.addTo(map);

    // Layer control
    const baseMaps = {
        "Street Map": streetMap,
        "Satellite": satelliteMap
    };

    L.control.layers(baseMaps).addTo(map);

    // Add scale control
    L.control.scale({
        imperial: false,
        metric: true
    }).addTo(map);

    // Try to get user's location with high accuracy
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                
                // Center map on user location
                map.setView([userLocation.lat, userLocation.lng], 15);
                
                // Add user marker with custom blue icon
                const userIcon = L.divIcon({
                    className: 'user-location-marker',
                    html: `
                        <div style="position: relative;">
                            <div style="
                                background: #4285F4;
                                width: 20px;
                                height: 20px;
                                border-radius: 50%;
                                border: 4px solid white;
                                box-shadow: 0 0 10px rgba(66, 133, 244, 0.6);
                                position: relative;
                                z-index: 1000;
                            "></div>
                            <div style="
                                position: absolute;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%);
                                background: rgba(66, 133, 244, 0.2);
                                width: ${Math.min(position.coords.accuracy / 2, 100)}px;
                                height: ${Math.min(position.coords.accuracy / 2, 100)}px;
                                border-radius: 50%;
                                border: 2px solid rgba(66, 133, 244, 0.5);
                                z-index: 999;
                            "></div>
                        </div>
                    `,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                });
                
                L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
                    .addTo(map)
                    .bindPopup(`
                        <div style="text-align: center;">
                            <strong>📍 Your Location</strong><br>
                            <small>Lat: ${position.coords.latitude.toFixed(6)}</small><br>
                            <small>Lng: ${position.coords.longitude.toFixed(6)}</small><br>
                            <small>Accuracy: ±${Math.round(position.coords.accuracy)}m</small>
                        </div>
                    `)
                    .openPopup();
                
                // Add accuracy circle
                L.circle([userLocation.lat, userLocation.lng], {
                    color: '#4285F4',
                    fillColor: '#4285F4',
                    fillOpacity: 0.1,
                    radius: position.coords.accuracy
                }).addTo(map);
                
                // Watch position for live updates
                watchUserLocation();
            },
            (error) => {
                console.log('Geolocation error:', error.message);
                alert(`Location access denied or unavailable. Error: ${error.message}\n\nPlease enable location services and refresh the page for accurate map positioning.`);
                // Fallback: Try to get approximate location from IP
                getApproximateLocation();
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
        alert('Geolocation is not supported by your browser. Using default location.');
        getApproximateLocation();
    }
}

// Watch user location for live updates
function watchUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                console.log('Location updated:', userLocation);
            },
            (error) => {
                console.log('Watch position error:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    }
}

// Get approximate location from IP (fallback)
async function getApproximateLocation() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        userLocation = {
            lat: data.latitude,
            lng: data.longitude,
            accuracy: 5000 // Approximate
        };
        map.setView([userLocation.lat, userLocation.lng], 12);
        
        L.marker([userLocation.lat, userLocation.lng])
            .addTo(map)
            .bindPopup('📍 Your Approximate Location')
            .openPopup();
    } catch (error) {
        console.log('Could not get location from IP');
    }
}

// Load Pesticide Shops
async function loadPesticideShops() {
    const shopsList = document.getElementById('shops-list');
    shopsList.innerHTML = '<div class="loading">Loading nearby shops...</div>';

    try {
        const response = await fetch(`${API_URL}/api/pesticide-shops`, {
            credentials: 'include'
        });

        const data = await response.json();

        if (data.shops && data.shops.length > 0) {
            // Custom marker icons for different shop types
            const shopIcon = L.divIcon({
                className: 'shop-marker',
                html: `
                    <div style="
                        background: #FF6B6B;
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        border: 3px solid white;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 16px;
                    ">🏪</div>
                `,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            // Add shop markers to map with enhanced popups
            data.shops.forEach((shop, index) => {
                const marker = L.marker([shop.location.latitude, shop.location.longitude], {
                    icon: shopIcon
                }).addTo(map);
                
                // Add permanent tooltip label
                marker.bindTooltip(shop.name, {
                    permanent: false,
                    direction: 'top',
                    className: 'map-label',
                    offset: [0, -10]
                });
                
                marker.bindPopup(`
                    <div style="min-width: 200px; text-align: left;">
                        <h4 style="margin: 0 0 10px 0; color: #2C5F7C;">${shop.name}</h4>
                        <p style="margin: 5px 0; font-size: 13px;"><strong>📍</strong> ${shop.location.address}</p>
                        <p style="margin: 5px 0; font-size: 13px;"><strong>📞</strong> ${shop.phone}</p>
                        <p style="margin: 5px 0; font-size: 13px;"><strong>⭐</strong> ${shop.rating} Rating</p>
                        <p style="margin: 5px 0; font-size: 13px;"><strong>🕒</strong> ${shop.open_hours}</p>
                        <div style="margin-top: 10px;">
                            <a href="https://www.google.com/maps/dir/?api=1&destination=${shop.location.latitude},${shop.location.longitude}" 
                               target="_blank" 
                               style="
                                   display: inline-block;
                                   padding: 8px 15px;
                                   background: linear-gradient(135deg, #87CEEB 0%, #5A9FBA 100%);
                                   color: white;
                                   text-decoration: none;
                                   border-radius: 5px;
                                   font-size: 12px;
                                   font-weight: 600;
                               ">🗺️ Get Directions</a>
                        </div>
                    </div>
                `);
                
                // Store marker for search
                allMarkers.push({
                    marker: marker,
                    name: shop.name,
                    type: 'shop',
                    lat: shop.location.latitude,
                    lng: shop.location.longitude
                });
                
                // Add connecting line from user location to shop if location available
                if (userLocation) {
                    const distance = calculateDistance(
                        userLocation.lat,
                        userLocation.lng,
                        shop.location.latitude,
                        shop.location.longitude
                    );
                    
                    // Only draw line for shops within 20km
                    if (distance < 20) {
                        marker.on('click', () => {
                            // Draw polyline when marker is clicked
                            if (window.currentPolyline) {
                                map.removeLayer(window.currentPolyline);
                            }
                            window.currentPolyline = L.polyline([
                                [userLocation.lat, userLocation.lng],
                                [shop.location.latitude, shop.location.longitude]
                            ], {
                                color: '#4285F4',
                                weight: 3,
                                opacity: 0.7,
                                dashArray: '10, 10'
                            }).addTo(map);
                        });
                    }
                }
            });

            // Load nearby places (homes, hospitals, etc.) using Overpass API
            if (userLocation) {
                loadNearbyPlaces(userLocation.lat, userLocation.lng);
            }

            // Sort shops by distance if user location available
            let sortedShops = data.shops;
            if (userLocation) {
                sortedShops = data.shops.map(shop => ({
                    ...shop,
                    distance: calculateDistance(
                        userLocation.lat,
                        userLocation.lng,
                        shop.location.latitude,
                        shop.location.longitude
                    )
                })).sort((a, b) => a.distance - b.distance);
            }

            shopsList.innerHTML = sortedShops.map(shop => `
                <div class="shop-card">
                    <h3>🏪 ${shop.name}</h3>
                    <div class="shop-info">
                        <p>📍 ${shop.location.address}</p>
                        <p>📞 ${shop.phone}</p>
                        <p>🏷️ ${shop.type}</p>
                        <p class="rating">★ ${shop.rating} Rating</p>
                        ${shop.distance ? `<p>📏 ${shop.distance.toFixed(2)} km away</p>` : ''}
                        <p>🕒 ${shop.open_hours}</p>
                    </div>
                    <button class="btn-directions" onclick="openDirections(${shop.location.latitude}, ${shop.location.longitude})">
                        🗺️ Get Directions
                    </button>
                </div>
            `).join('');
        } else {
            shopsList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #5A9FBA; grid-column: 1/-1;">
                    <p>No pesticide shops found nearby</p>
                </div>
            `;
        }
    } catch (error) {
        shopsList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #FF6B6B; grid-column: 1/-1;">
                <p>❌ Failed to load pesticide shops</p>
            </div>
        `;
    }
}

// Load nearby places from OpenStreetMap (homes, hospitals, schools, etc.)
async function loadNearbyPlaces(lat, lng) {
    try {
        // Query radius in meters (2km)
        const radius = 2000;
        
        // Overpass API query for nearby amenities
        const query = `
            [out:json];
            (
                node["amenity"="hospital"](around:${radius},${lat},${lng});
                node["amenity"="clinic"](around:${radius},${lat},${lng});
                node["amenity"="pharmacy"](around:${radius},${lat},${lng});
                node["amenity"="school"](around:${radius},${lat},${lng});
                node["amenity"="bank"](around:${radius},${lat},${lng});
                node["shop"="supermarket"](around:${radius},${lat},${lng});
                node["shop"="convenience"](around:${radius},${lat},${lng});
                way["building"="yes"](around:${radius},${lat},${lng});
            );
            out body;
        `;
        
        const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
        
        const response = await fetch(overpassUrl);
        const data = await response.json();
        
        // Icon mapping for different place types
        const iconMap = {
            'hospital': { icon: '🏥', color: '#E74C3C' },
            'clinic': { icon: '⚕️', color: '#E74C3C' },
            'pharmacy': { icon: '💊', color: '#9B59B6' },
            'school': { icon: '🏫', color: '#3498DB' },
            'bank': { icon: '🏦', color: '#F39C12' },
            'supermarket': { icon: '🏬', color: '#27AE60' },
            'convenience': { icon: '🏪', color: '#16A085' },
            'building': { icon: '🏠', color: '#95A5A6' }
        };
        
        // Add markers for nearby places
        data.elements.forEach(element => {
            if (element.lat && element.lon) {
                const amenity = element.tags?.amenity || element.tags?.shop || 'building';
                const name = element.tags?.name || `${amenity.charAt(0).toUpperCase() + amenity.slice(1)}`;
                const iconInfo = iconMap[amenity] || iconMap['building'];
                
                // Create custom marker
                const placeIcon = L.divIcon({
                    className: 'place-marker',
                    html: `
                        <div style="
                            background: ${iconInfo.color};
                            width: 24px;
                            height: 24px;
                            border-radius: 50%;
                            border: 2px solid white;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 12px;
                        ">${iconInfo.icon}</div>
                    `,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });
                
                const marker = L.marker([element.lat, element.lon], { icon: placeIcon }).addTo(map);
                
                // Add permanent tooltip label
                marker.bindTooltip(name, {
                    permanent: false,
                    direction: 'top',
                    className: 'map-label',
                    offset: [0, -10]
                });
                
                marker.bindPopup(`
                    <div style="text-align: center;">
                        <strong>${iconInfo.icon} ${name}</strong><br>
                        <small>${amenity}</small>
                    </div>
                `);
                
                // Store marker for search
                allMarkers.push({
                    marker: marker,
                    name: name,
                    type: amenity,
                    lat: element.lat,
                    lng: element.lon
                });
            }
        });
        
        console.log(`Loaded ${data.elements.length} nearby places`);
    } catch (error) {
        console.log('Could not load nearby places:', error);
    }
}

// Load Research Centers
async function loadResearchCenters() {
    const researchList = document.getElementById('research-centers');
    researchList.innerHTML = '<div class="loading">Loading research centers...</div>';

    try {
        const response = await fetch(`${API_URL}/api/research-centers`, {
            credentials: 'include'
        });

        const data = await response.json();

        if (data.centers && data.centers.length > 0) {
            researchList.innerHTML = data.centers.map(center => `
                <div class="research-card">
                    <h3>${center.name}</h3>
                    <div class="research-info">
                        <p><strong>📍 Location:</strong> ${center.location.address}</p>
                        <p><strong>📞 Phone:</strong> ${center.phone}</p>
                        <p><strong>📧 Email:</strong> ${center.email}</p>
                    </div>
                    ${center.expertise && center.expertise.length > 0 ? `
                        <div class="expertise-tags">
                            ${center.expertise.map(exp => `<span class="expertise-tag">${exp}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div class="contact-buttons">
                        <a href="mailto:${center.email}" class="btn-contact btn-email">✉️ Send Email</a>
                        <a href="tel:${center.phone}" class="btn-contact btn-phone">📞 Call Now</a>
                    </div>
                </div>
            `).join('');
        } else {
            researchList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #5A9FBA;">
                    <p>No research centers found</p>
                </div>
            `;
        }
    } catch (error) {
        researchList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #FF6B6B;">
                <p>❌ Failed to load research centers</p>
            </div>
        `;
    }
}

// Utility Functions
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

function openDirections(lat, lng) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
}

// Map Search Function
function searchMap() {
    const searchInput = document.getElementById('mapSearch');
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (!searchTerm) {
        alert('Please enter a search term');
        return;
    }
    
    // Clear previous search results
    searchMarkers.forEach(marker => map.removeLayer(marker));
    searchMarkers = [];
    
    // Search in all markers
    const results = allMarkers.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.type.toLowerCase().includes(searchTerm)
    );
    
    if (results.length === 0) {
        alert(`No results found for "${searchTerm}"`);
        return;
    }
    
    // If only one result, zoom to it and open popup
    if (results.length === 1) {
        const result = results[0];
        map.setView([result.lat, result.lng], 16);
        result.marker.openPopup();
        
        // Highlight the marker temporarily
        const highlightCircle = L.circle([result.lat, result.lng], {
            color: '#FFD700',
            fillColor: '#FFD700',
            fillOpacity: 0.3,
            radius: 100
        }).addTo(map);
        searchMarkers.push(highlightCircle);
        
        setTimeout(() => {
            map.removeLayer(highlightCircle);
        }, 3000);
    } else {
        // Multiple results - fit bounds to show all
        const bounds = L.latLngBounds(results.map(r => [r.lat, r.lng]));
        map.fitBounds(bounds, { padding: [50, 50] });
        
        // Open all popups for results
        results.forEach(result => {
            result.marker.openPopup();
            
            // Add highlight circles
            const highlightCircle = L.circle([result.lat, result.lng], {
                color: '#FFD700',
                fillColor: '#FFD700',
                fillOpacity: 0.2,
                radius: 80
            }).addTo(map);
            searchMarkers.push(highlightCircle);
        });
        
        // Show results count
        alert(`Found ${results.length} results for "${searchTerm}"`);
        
        // Remove highlights after 5 seconds
        setTimeout(() => {
            searchMarkers.forEach(marker => map.removeLayer(marker));
            searchMarkers = [];
        }, 5000);
    }
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
