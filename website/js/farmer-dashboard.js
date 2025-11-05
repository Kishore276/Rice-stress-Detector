// =====================================================
// FARMER DASHBOARD - JavaScript
// =====================================================

let map = null;
let farmerLocation = null;
let currentRadius = 10;
let currentDetectionResult = null;
let cartData = [];
let shopMarkers = []; // Store shop markers to clear them later

document.addEventListener('DOMContentLoaded', function() {
    loadFarmerProfile();
    loadPredictionHistory();
    setupDiseaseDetection();
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
        if (sectionName === 'products') {
            loadProducts();
        } else if (sectionName === 'research-labs') {
            loadResearchLabs();
        } else if (sectionName === 'map') {
            setTimeout(() => initializeMap(), 100);
        } else if (sectionName === 'history') {
            loadPredictionHistory();
        } else if (sectionName === 'cart') {
            loadCart();
        }
    }
}

function setupTabNavigation() {
    // Default to dashboard
    showSection('dashboard');
}

// =====================================================
// FARMER PROFILE
// =====================================================

function loadFarmerProfile() {
    fetch('/api/farmer/profile')
        .then(response => response.json())
        .then(data => {
            if (data.farmer_id) {
                document.getElementById('farmer-name').textContent = data.full_name;
                farmerLocation = {
                    latitude: data.latitude,
                    longitude: data.longitude,
                    city: data.city
                };

                // Update stats
                document.getElementById('total-spent').textContent = '₹' + (Math.random() * 50000).toFixed(2);
            }
        })
        .catch(error => {
            console.error('Error loading profile:', error);
            showAlert('Failed to load profile', 'error');
        });
}

// =====================================================
// DISEASE DETECTION
// =====================================================

function setupDiseaseDetection() {
    const imageInput = document.getElementById('disease-image');
    const uploadLabel = document.querySelector('.upload-label');

    // Click to upload
    uploadLabel.addEventListener('click', () => imageInput.click());

    // Drag and drop
    uploadLabel.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadLabel.style.borderColor = '#764ba2';
        uploadLabel.style.background = '#f0f4ff';
    });

    uploadLabel.addEventListener('dragleave', () => {
        uploadLabel.style.borderColor = '#667eea';
        uploadLabel.style.background = '#f9f9ff';
    });

    uploadLabel.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadLabel.style.borderColor = '#667eea';
        uploadLabel.style.background = '#f9f9ff';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            imageInput.files = files;
            previewImage();
        }
    });

    // File input change
    imageInput.addEventListener('change', previewImage);
}

function previewImage() {
    const imageInput = document.getElementById('disease-image');
    const preview = document.getElementById('preview-image');
    const detectBtn = document.getElementById('detect-btn');

    if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            preview.style.display = 'block';
            detectBtn.disabled = false;
        };
        reader.readAsDataURL(imageInput.files[0]);
    }
}

function detectDisease() {
    const imageInput = document.getElementById('disease-image');
    const detectBtn = document.getElementById('detect-btn');

    if (!imageInput.files || !imageInput.files[0]) {
        showAlert('Please select an image first', 'error');
        return;
    }

    detectBtn.disabled = true;
    detectBtn.textContent = 'Detecting...';

    const formData = new FormData();
    formData.append('image', imageInput.files[0]);

    fetch('/api/predict', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('API Response:', data);
        console.log('Recommended pesticides:', data.recommended_pesticides);
        
        if (data.success) {
            currentDetectionResult = data;
            displayDetectionResult(data);
            showAlert('Disease detected successfully!', 'success');
            updatePredictionStats();
        } else {
            showAlert(data.error || 'Detection failed', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('Error during detection', 'error');
    })
    .finally(() => {
        detectBtn.disabled = false;
        detectBtn.textContent = '🔍 Detect Disease';
    });
}

function displayDetectionResult(data) {
    console.log('displayDetectionResult called with:', data);
    
    const resultDiv = document.getElementById('detection-result');
    document.getElementById('result-disease-name').textContent = data.disease || data.disease_key;
    document.getElementById('result-confidence').textContent = data.confidence + '%';
    
    // Show treatment recommendations
    let recommendations = '';
    
    if (data.treatment) {
        recommendations = data.treatment + '\n\n';
    } else {
        recommendations = `Detected: ${data.disease} with ${data.confidence}% confidence.\n\n`;
    }
    
    // Add application method and frequency if available
    if (data.application_method) {
        recommendations += `📝 Application Method:\n${data.application_method}\n\n`;
    }
    
    if (data.frequency) {
        recommendations += `⏰ Frequency:\n${data.frequency}\n\n`;
    }
    
    console.log('Pesticides array:', data.recommended_pesticides);
    console.log('Pesticides length:', data.recommended_pesticides ? data.recommended_pesticides.length : 0);
    
    // Add pesticide recommendations if available
    if (data.recommended_pesticides && data.recommended_pesticides.length > 0) {
        console.log('Adding pesticide recommendations to display');
        recommendations += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        recommendations += '📋 RECOMMENDED PESTICIDES\n';
        recommendations += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        
        data.recommended_pesticides.forEach((pesticide, index) => {
            console.log(`Adding pesticide ${index + 1}:`, pesticide);
            recommendations += `${index + 1}. ${pesticide.name}\n`;
            recommendations += `   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            recommendations += `   💊 Dosage: ${pesticide.dosage_per_acre || pesticide.description || 'As per instructions'}\n`;
            
            if (pesticide.application_method && pesticide.application_method !== data.application_method) {
                recommendations += `   📝 Method: ${pesticide.application_method}\n`;
            }
            
            if (pesticide.effectiveness) {
                recommendations += `   ⭐ Effectiveness: ${pesticide.effectiveness}%\n`;
            }
            
            if (pesticide.price && pesticide.price > 0) {
                recommendations += `   💰 Price: ₹${pesticide.price}/${pesticide.unit}\n`;
            }
            
            recommendations += '\n';
        });
        
        recommendations += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        recommendations += '💡 Tip: Click "Add Pesticides to Cart" to purchase these products.\n';
    } else {
        console.log('No pesticides found in response');
        recommendations += '\n⚠️ Pesticide recommendations not available.\n';
        recommendations += 'Please consult with agricultural experts for treatment advice.\n';
    }
    
    document.getElementById('result-recommendations').textContent = recommendations;
    
    resultDiv.style.display = 'block';
    
    // Store full detection result for cart
    currentDetectionResult = {
        disease: data.disease || data.disease_key,
        confidence: data.confidence,
        pesticides: data.recommended_pesticides || []
    };
    
    console.log('Detection result displayed:', currentDetectionResult);
}

function addToCart() {
    if (!currentDetectionResult) {
        showAlert('No detection result', 'error');
        return;
    }

    // Add detected disease's pesticides to cart
    const disease = currentDetectionResult.disease;
    
    // For now, add generic pesticide
    const cartItem = {
        product_type: 'pesticide',
        product_id: 1,
        name: 'Recommended Pesticide for ' + disease,
        quantity: 1,
        price: 450
    };

    cartData.push(cartItem);
    updateCartCount();
    showAlert('Added to cart!', 'success');
}

// =====================================================
// PREDICTION HISTORY
// =====================================================

function loadPredictionHistory() {
    fetch('/api/farmer/prediction-history')
        .then(response => response.json())
        .then(data => {
            displayHistoryItems(data.history);
            document.getElementById('scan-count').textContent = data.history.length;
            
            if (data.history.length > 0) {
                document.getElementById('last-scan-date').textContent = 
                    new Date(data.history[0].date).toLocaleDateString();
            }
        })
        .catch(error => {
            console.error('Error loading history:', error);
            showAlert('Failed to load history', 'error');
        });
}

function displayHistoryItems(history) {
    const historyList = document.getElementById('history-list');
    
    if (history.length === 0) {
        historyList.innerHTML = '<p class="loading">No detection history yet</p>';
        return;
    }

    historyList.innerHTML = history.map(item => `
        <div class="history-item">
            <img src="/uploads/${item.image}" alt="Disease" class="history-image">
            <div class="history-details">
                <h4>${item.disease || 'Unknown Disease'}</h4>
                <p class="history-confidence">Confidence: ${item.confidence}%</p>
                <p class="history-date">${new Date(item.date).toLocaleDateString()}</p>
            </div>
            <div class="history-date">${new Date(item.date).toLocaleTimeString()}</div>
        </div>
    `).join('');
}

function updatePredictionStats() {
    loadPredictionHistory();
}

// =====================================================
// PRODUCTS
// =====================================================

let currentProductFilter = 'all';

function loadProducts() {
    fetch(`/api/farmer/products?type=${currentProductFilter}`)
        .then(response => response.json())
        .then(data => {
            displayProducts(data);
        })
        .catch(error => {
            console.error('Error loading products:', error);
            showAlert('Failed to load products', 'error');
        });
}

function filterProducts(type) {
    currentProductFilter = type;
    
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    loadProducts();
}

function displayProducts(data) {
    const grid = document.getElementById('products-grid');
    let html = '';

    if (data.pesticides && data.pesticides.length > 0) {
        html += data.pesticides.map(product => `
            <div class="product-card">
                <div class="product-icon">💊</div>
                <h4>${product.name}</h4>
                <p>${product.description || 'Premium quality pesticide'}</p>
                <div class="product-info">
                    <span class="product-price">₹${product.price}</span>
                    <span class="product-unit">per ${product.unit}</span>
                </div>
                <div class="product-stock">Stock: ${product.stock}</div>
                <div class="product-actions">
                    <input type="number" class="quantity-input" value="1" min="1">
                    <button class="add-to-cart-btn" onclick="addProductToCart(${product.id}, 'pesticide', ${product.price})">
                        Add to Cart
                    </button>
                </div>
            </div>
        `).join('');
    }

    if (data.fertilizers && data.fertilizers.length > 0) {
        html += data.fertilizers.map(product => `
            <div class="product-card">
                <div class="product-icon">🌱</div>
                <h4>${product.name}</h4>
                <p>${product.description || 'Premium quality fertilizer'}</p>
                <div class="product-info">
                    <span class="product-price">₹${product.price}</span>
                    <span class="product-unit">per ${product.unit}</span>
                </div>
                <div class="product-stock">Stock: ${product.stock}</div>
                <div class="product-actions">
                    <input type="number" class="quantity-input" value="1" min="1">
                    <button class="add-to-cart-btn" onclick="addProductToCart(${product.id}, 'fertilizer', ${product.price})">
                        Add to Cart
                    </button>
                </div>
            </div>
        `).join('');
    }

    grid.innerHTML = html || '<p class="loading">No products found</p>';
}

function addProductToCart(productId, type, price) {
    const quantityInput = event.target.parentElement.querySelector('.quantity-input');
    const quantity = parseInt(quantityInput.value) || 1;

    const cartItem = {
        product_id: productId,
        product_type: type,
        quantity: quantity,
        price: price * quantity
    };

    cartData.push(cartItem);
    updateCartCount();
    showAlert(`Added ${quantity} item(s) to cart!`, 'success');
}

// =====================================================
// RESEARCH LABS
// =====================================================

function loadResearchLabs() {
    fetch('/api/farmer/research-labs')
        .then(response => response.json())
        .then(data => {
            displayResearchLabs(data.labs);
        })
        .catch(error => {
            console.error('Error loading research labs:', error);
            showAlert('Failed to load research labs', 'error');
        });
}

function displayResearchLabs(labs) {
    const labsList = document.getElementById('labs-list');
    
    if (labs.length === 0) {
        labsList.innerHTML = '<p class="loading">No research labs found</p>';
        return;
    }

    labsList.innerHTML = labs.map(lab => `
        <div class="lab-card">
            <h3>${lab.name}</h3>
            <p>${lab.description}</p>
            <div class="lab-details">
                <div class="lab-detail">
                    <label>Location</label>
                    <value>${lab.address}, ${lab.city}</value>
                </div>
                <div class="lab-detail">
                    <label>Email</label>
                    <value>${lab.email || 'N/A'}</value>
                </div>
                <div class="lab-detail">
                    <label>WhatsApp</label>
                    <value>${lab.whatsapp_number || 'N/A'}</value>
                </div>
                <div class="lab-detail">
                    <label>Phone</label>
                    <value>${lab.phone_number || 'N/A'}</value>
                </div>
                <div class="lab-detail">
                    <label>Specialization</label>
                    <value>${lab.specialization || 'General'}</value>
                </div>
                <div class="lab-detail">
                    <label>Website</label>
                    <value>${lab.website || 'N/A'}</value>
                </div>
            </div>
        </div>
    `).join('');
}

// =====================================================
// MAP & SHOPS
// =====================================================

let currentMapCenter = null; // Store current map center for search
let baseLayers = {}; // Store different map layers
let roadLayer = null; // Roads overlay layer
let userLocationMarker = null; // Store user's current location marker

function initializeMap() {
    console.log('Initializing map...');
    console.log('Farmer location:', farmerLocation);
    
    // Default to center of India if farmer location not set
    let lat = 20.5937;
    let lng = 78.9629;
    let zoom = 5;
    
    // Use farmer's location if available
    if (farmerLocation && farmerLocation.latitude && farmerLocation.longitude) {
        lat = farmerLocation.latitude;
        lng = farmerLocation.longitude;
        zoom = 12;
    }
    
    currentMapCenter = { lat, lng };
    console.log(`Map center: [${lat}, ${lng}], zoom: ${zoom}`);

    // Remove existing map if any
    if (map) {
        map.remove();
    }

    map = L.map('map').setView([lat, lng], zoom);

    // Define base layers
    baseLayers = {
        street: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }),
        satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri',
            maxZoom: 19
        }),
        hybrid: L.layerGroup([
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri',
                maxZoom: 19
            }),
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors, © CARTO',
                maxZoom: 19
            })
        ]),
        terrain: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap',
            maxZoom: 17
        })
    };

    // Add default street layer
    baseLayers.street.addTo(map);

    // Create roads overlay layer
    roadLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        opacity: 0.5
    });
    roadLayer.addTo(map);

    // Add farmer location marker only if available
    if (farmerLocation && farmerLocation.latitude) {
        L.marker([farmerLocation.latitude, farmerLocation.longitude], {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        }).addTo(map).bindPopup('Your Farm Location');
    } else {
        showAlert('Farm location not set. Showing default map view.', 'info');
    }

    loadShopsOnMap();
}

function changeMapLayer(layerType) {
    if (!map) return;
    
    console.log('Changing map layer to:', layerType);
    
    // Remove all base layers
    Object.values(baseLayers).forEach(layer => {
        map.removeLayer(layer);
    });
    
    // Add selected layer
    if (baseLayers[layerType]) {
        baseLayers[layerType].addTo(map);
    }
    
    // Re-add road layer if enabled
    const showRoads = document.getElementById('show-roads').checked;
    if (showRoads && layerType !== 'street') {
        if (!map.hasLayer(roadLayer)) {
            roadLayer.addTo(map);
        }
    }
}

function toggleRoads(show) {
    if (!map || !roadLayer) return;
    
    const currentLayer = document.getElementById('map-layer-selector').value;
    
    if (show && currentLayer !== 'street') {
        roadLayer.addTo(map);
    } else {
        map.removeLayer(roadLayer);
    }
}

function getCurrentLocation() {
    if (!navigator.geolocation) {
        showAlert('Geolocation is not supported by your browser', 'error');
        return;
    }

    showAlert('Getting your location...', 'info');

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            console.log('Got user location:', lat, lng);
            
            currentMapCenter = { lat, lng };
            
            // Remove old user location marker if exists
            if (userLocationMarker) {
                map.removeLayer(userLocationMarker);
            }
            
            // Add new user location marker
            userLocationMarker = L.marker([lat, lng], {
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                })
            }).addTo(map).bindPopup('📍 Your Current Location');
            
            // Center map on user location
            map.setView([lat, lng], 13);
            
            showAlert('Location found! Searching nearby shops...', 'success');
            loadShopsOnMap();
        },
        (error) => {
            let message = 'Unable to get your location';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    message = 'Location permission denied. Please enable location access.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    message = 'Location information unavailable.';
                    break;
                case error.TIMEOUT:
                    message = 'Location request timed out.';
                    break;
            }
            showAlert(message, 'error');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

function searchLocation() {
    const searchInput = document.getElementById('location-search');
    const query = searchInput.value.trim();
    
    if (!query) {
        showAlert('Please enter a location to search', 'error');
        return;
    }
    
    showAlert('Searching for location...', 'info');
    
    // Use Nominatim API for geocoding
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=1`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const result = data[0];
                const lat = parseFloat(result.lat);
                const lng = parseFloat(result.lon);
                
                console.log('Found location:', result.display_name, lat, lng);
                
                currentMapCenter = { lat, lng };
                
                // Remove old search marker if exists
                if (userLocationMarker) {
                    map.removeLayer(userLocationMarker);
                }
                
                // Add marker for searched location
                userLocationMarker = L.marker([lat, lng], {
                    icon: L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    })
                }).addTo(map).bindPopup(`📍 ${result.display_name}`);
                
                // Center map on found location
                map.setView([lat, lng], 12);
                
                showAlert(`Location found: ${result.display_name}`, 'success');
                loadShopsOnMap();
            } else {
                showAlert('Location not found. Try a different search term.', 'error');
            }
        })
        .catch(error => {
            console.error('Geocoding error:', error);
            showAlert('Failed to search location. Please try again.', 'error');
        });
}

function updateMapRadius(value) {
    currentRadius = value;
    document.getElementById('radius-display').textContent = value + ' km';
    if (map) {
        loadShopsOnMap();
    }
}

function loadShopsOnMap() {
    console.log(`Loading shops with radius: ${currentRadius}km`);
    
    fetch(`/api/farmer/shops?radius=${currentRadius}`)
        .then(response => response.json())
        .then(data => {
            console.log('Shops API response:', data);
            if (data.shops) {
                console.log(`Received ${data.shops.length} shops`);
                displayShops(data.shops);
                addShopsToMap(data.shops);
            } else if (data.error) {
                console.error('API error:', data.error);
                showAlert(data.error, 'error');
            }
        })
        .catch(error => {
            console.error('Error loading shops:', error);
            showAlert('Failed to load shops', 'error');
        });
}

function addShopsToMap(shops) {
    if (!map) {
        console.error('Map not initialized');
        return;
    }

    // Clear existing shop markers
    shopMarkers.forEach(marker => map.removeLayer(marker));
    shopMarkers = [];
    
    console.log(`Adding ${shops.length} shops to map`);

    shops.forEach(shop => {
        const color = shop.shop_type === 'pesticides' ? 'red' : shop.shop_type === 'fertilizers' ? 'green' : 'orange';
        
        console.log(`Adding marker for ${shop.name} at [${shop.latitude}, ${shop.longitude}] color: ${color}`);
        
        const marker = L.marker([shop.latitude, shop.longitude], {
            icon: L.icon({
                iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        }).addTo(map).bindPopup(`<b>${shop.name}</b><br>${shop.address}<br>⭐ ${shop.rating}`);
        
        shopMarkers.push(marker);
    });
    
    console.log(`Total shop markers on map: ${shopMarkers.length}`);
}

function displayShops(shops) {
    const shopsList = document.getElementById('shops-list');
    
    if (shops.length === 0) {
        shopsList.innerHTML = '<p class="loading">No shops found within radius</p>';
        return;
    }

    shopsList.innerHTML = shops.map(shop => `
        <div class="shop-card">
            <div class="shop-rating">⭐ ${shop.rating}</div>
            <div class="shop-info">
                <h4>${shop.name}</h4>
                <p>${shop.address}</p>
                <p>${shop.city}${shop.distance ? ` - ${shop.distance} km away` : ''}</p>
                <p>Open: ${shop.opening_time} - ${shop.closing_time}</p>
            </div>
            <div class="shop-contact">
                <a href="tel:${shop.phone_number}">📞 Call</a>
                <a href="https://wa.me/${shop.whatsapp_number}">📱 WhatsApp</a>
            </div>
        </div>
    `).join('');
}

// =====================================================
// CART
// =====================================================

function loadCart() {
    updateCartUI();
}

function updateCartUI() {
    const cartContent = document.getElementById('cart-content');
    const cartCount = document.getElementById('cart-total-items');
    const cartPrice = document.getElementById('cart-total-price');

    if (cartData.length === 0) {
        cartContent.innerHTML = '<p class="loading">Your cart is empty</p>';
        cartCount.textContent = '0';
        cartPrice.textContent = '0';
        return;
    }

    let totalPrice = 0;
    let html = cartData.map((item, index) => {
        totalPrice += item.price;
        return `
            <div class="cart-item">
                <div class="cart-item-icon">${item.product_type === 'pesticide' ? '💊' : '🌱'}</div>
                <div class="cart-item-info">
                    <h4>${item.name || item.product_type}</h4>
                    <p>Quantity: ${item.quantity}</p>
                </div>
                <div class="cart-item-price">₹${item.price}</div>
                <button class="remove-btn" onclick="removeFromCart(${index})">Remove</button>
            </div>
        `;
    }).join('');

    cartContent.innerHTML = html;
    cartCount.textContent = cartData.length;
    cartPrice.textContent = totalPrice.toFixed(2);
}

function removeFromCart(index) {
    cartData.splice(index, 1);
    updateCartUI();
    updateCartCount();
    showAlert('Item removed from cart', 'info');
}

function updateCartCount() {
    const badge = document.getElementById('cart-count');
    badge.textContent = cartData.length;
}

function checkout() {
    if (cartData.length === 0) {
        showAlert('Your cart is empty', 'error');
        return;
    }

    showAlert('Proceeding to checkout...', 'success');
    // TODO: Implement checkout process
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
