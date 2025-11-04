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
    const resultDiv = document.getElementById('detection-result');
    document.getElementById('result-disease-name').textContent = data.disease;
    document.getElementById('result-confidence').textContent = data.confidence + '%';
    
    // Show treatment recommendations
    let recommendations = data.treatment || `Detected: ${data.disease} with ${data.confidence}% confidence.`;
    
    // Add pesticide recommendations if available
    if (data.recommended_pesticides && data.recommended_pesticides.length > 0) {
        recommendations += '\n\n📋 Recommended Pesticides:\n\n';
        data.recommended_pesticides.forEach((pesticide, index) => {
            recommendations += `${index + 1}. ${pesticide.name}\n`;
            recommendations += `   💊 Dosage: ${pesticide.dosage_per_acre || 'As per instructions'}\n`;
            recommendations += `   📝 Method: ${pesticide.application_method || 'Spray application'}\n`;
            recommendations += `   ⭐ Effectiveness: ${pesticide.effectiveness || 'N/A'}%\n`;
            recommendations += `   💰 Price: ₹${pesticide.price}/${pesticide.unit}\n\n`;
        });
    } else {
        recommendations += '\n\nApply appropriate pesticides and follow treatment guidelines.';
    }
    
    document.getElementById('result-recommendations').textContent = recommendations;
    
    resultDiv.style.display = 'block';
    
    // Store pesticides for cart
    currentDetectionResult.pesticides = data.recommended_pesticides || [];
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

function initializeMap() {
    // Use farmer location if available, otherwise use default location (India center)
    const defaultLat = 20.5937;  // India center
    const defaultLng = 78.9629;
    
    const lat = (farmerLocation && farmerLocation.latitude) ? farmerLocation.latitude : defaultLat;
    const lng = (farmerLocation && farmerLocation.longitude) ? farmerLocation.longitude : defaultLng;

    if (map) {
        map.remove();
    }

    map = L.map('map').setView([lat, lng], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

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
