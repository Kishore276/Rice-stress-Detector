// Treatment Recommendations Database
const treatmentDatabase = {
    "Bacterialblight": {
        "disease_name": "Bacterial Blight",
        "description": "Bacterial blight is caused by Xanthomonas oryzae pv. oryzae, resulting in wilting and drying of leaves.",
        "symptoms": [
            "Water-soaked lesions on leaf tips and margins",
            "Yellow to white lesions with wavy edges",
            "Wilting of seedlings (kresek phase)",
            "Systemic infection causing plant death"
        ],
        "precautions": [
            "Use disease-free seeds",
            "Avoid excessive nitrogen fertilization",
            "Maintain proper water management",
            "Remove and destroy infected plants",
            "Practice crop rotation"
        ],
        "treatment": [
            "Apply copper-based bactericides",
            "Use resistant varieties (e.g., IR64, IR72)",
            "Spray streptocycline (200-300 ppm) at 7-10 day intervals",
            "Apply zinc sulfate (0.5%) to strengthen plants"
        ],
        "fertilizer": "Balanced NPK (10-26-26) with emphasis on potassium",
        "water_management": "Avoid over-irrigation; maintain 2-5 cm water depth",
        "severity": "High"
    },
    "Blast": {
        "disease_name": "Rice Blast",
        "description": "Rice blast is caused by fungus Magnaporthe oryzae, one of the most destructive rice diseases worldwide.",
        "symptoms": [
            "Diamond-shaped lesions with gray centers and brown margins",
            "Leaf blast: spots on leaves",
            "Neck blast: infection at neck node",
            "Panicle blast: incomplete grain filling"
        ],
        "precautions": [
            "Use certified disease-free seeds",
            "Avoid excessive nitrogen application",
            "Ensure proper spacing between plants",
            "Remove infected stubble and debris",
            "Use silicon amendments to strengthen plants"
        ],
        "treatment": [
            "Apply Tricyclazole 75% WP @ 0.6 g/liter",
            "Spray Carbendazim 50% WP @ 1 g/liter",
            "Use Azoxystrobin 25% SC @ 1 ml/liter",
            "Apply organic fungicides like neem oil (3-5%)"
        ],
        "fertilizer": "Split application of nitrogen; use potassium silicate",
        "water_management": "Intermittent irrigation to reduce humidity",
        "severity": "Very High"
    },
    "Brownspot": {
        "disease_name": "Brown Spot",
        "description": "Brown spot is caused by fungus Bipolaris oryzae, often associated with nutrient deficiency.",
        "symptoms": [
            "Circular to oval brown spots on leaves",
            "Spots with gray or whitish centers",
            "Numerous spots causing leaf withering",
            "Affects grain quality and yield"
        ],
        "precautions": [
            "Treat seeds with fungicides before sowing",
            "Ensure adequate soil nutrition",
            "Avoid water stress conditions",
            "Maintain proper plant spacing",
            "Remove infected plant debris"
        ],
        "treatment": [
            "Spray Mancozeb 75% WP @ 2.5 g/liter",
            "Apply Propiconazole 25% EC @ 1 ml/liter",
            "Use Copper oxychloride 50% WP @ 3 g/liter",
            "Seed treatment with Carbendazim @ 2 g/kg seed"
        ],
        "fertilizer": "Apply NPK (20-10-10) with micronutrients (Zinc, Iron)",
        "water_management": "Maintain consistent moisture; avoid drought stress",
        "severity": "Moderate"
    },
    "Tungro": {
        "disease_name": "Tungro Virus",
        "description": "Tungro is a viral disease transmitted by green leafhoppers, causing severe yield loss.",
        "symptoms": [
            "Yellow or orange-yellow discoloration of leaves",
            "Stunted plant growth",
            "Reduced tillering",
            "Delayed flowering and incomplete panicle formation"
        ],
        "precautions": [
            "Control vector (green leafhopper) population",
            "Use resistant varieties",
            "Remove infected plants immediately",
            "Avoid staggered planting",
            "Synchronize planting dates in community"
        ],
        "treatment": [
            "No direct cure; focus on vector control",
            "Spray Imidacloprid 17.8% SL @ 0.3 ml/liter for leafhopper",
            "Apply Thiamethoxam 25% WG @ 0.2 g/liter",
            "Use light traps to monitor and control vectors",
            "Remove and destroy infected plants"
        ],
        "fertilizer": "Moderate nitrogen; increase potassium for plant vigor",
        "water_management": "Maintain shallow water depth (2-3 cm)",
        "severity": "Very High"
    }
};

// Image upload handling
const imageInput = document.getElementById('imageInput');
const uploadBox = document.getElementById('uploadBox');
const previewBox = document.getElementById('previewBox');
const previewImage = document.getElementById('previewImage');
const resultsSection = document.getElementById('resultsSection');

// Drag and drop functionality
uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = '#27ae60';
    uploadBox.style.background = '#e8f5e9';
});

uploadBox.addEventListener('dragleave', () => {
    uploadBox.style.borderColor = '#2ecc71';
    uploadBox.style.background = '';
});

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = '#2ecc71';
    uploadBox.style.background = '';
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleImageUpload(file);
    }
});

// File input change
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleImageUpload(file);
    }
});

// Handle image upload
function handleImageUpload(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        uploadBox.style.display = 'none';
        previewBox.style.display = 'block';
        
        // Send to backend for prediction
        uploadToBackend(file);
    };
    
    reader.readAsDataURL(file);
}

// Upload to backend API
async function uploadToBackend(file) {
    try {
        // Show loading state
        resultsSection.style.display = 'block';
        resultsSection.innerHTML = '<div style="text-align:center; padding: 40px;"><div class="loader"></div><p>Analyzing image...</p></div>';
        
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch('/api/predict', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            // Not a rice plant or error
            showError(data.message || data.error);
            return;
        }
        
        // Check if leaf is healthy
        if (data.healthy) {
            showHealthyResult(data);
            return;
        }
        
        // Display disease results
        displayResults(data);
        
    } catch (error) {
        showError('Failed to analyze image. Please try again.\n\nError: ' + error.message);
    }
}

// Show error message
function showError(message) {
    resultsSection.style.display = 'block';
    resultsSection.innerHTML = `
        <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 12px; padding: 30px; text-align: center; margin: 20px 0;">
            <div style="font-size: 60px; margin-bottom: 20px;">⚠️</div>
            <h2 style="color: #856404; margin-bottom: 15px;">Invalid Image</h2>
            <div style="color: #856404; font-size: 16px; line-height: 1.8; white-space: pre-line; text-align: left; max-width: 600px; margin: 0 auto;">
                ${message}
            </div>
            <button onclick="clearImage()" style="margin-top: 20px; padding: 12px 30px; background: #ff6b6b; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                ✕ Clear and Try Again
            </button>
        </div>
        <div style="background: #d4edda; border: 2px solid #28a745; border-radius: 12px; padding: 25px; margin: 20px 0;">
            <h3 style="color: #155724; margin-bottom: 15px;">📸 How to take a proper rice leaf photo:</h3>
            <ul style="color: #155724; text-align: left; line-height: 2; max-width: 600px; margin: 0 auto;">
                <li><strong>Focus on rice plants only</strong> - Not wheat, corn, or other crops</li>
                <li><strong>Close-up of a single leaf</strong> - Show disease symptoms clearly</li>
                <li><strong>Good lighting</strong> - Natural daylight works best</li>
                <li><strong>Sharp focus</strong> - Avoid blurry images</li>
                <li><strong>Visible disease signs</strong> - Spots, lesions, or discoloration</li>
            </ul>
        </div>
    `;
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Show healthy leaf result
function showHealthyResult(data) {
    resultsSection.style.display = 'block';
    resultsSection.innerHTML = `
        <div style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); border: 3px solid #28a745; border-radius: 12px; padding: 40px; text-align: center; margin: 20px 0; box-shadow: 0 5px 20px rgba(40, 167, 69, 0.3);">
            <div style="font-size: 80px; margin-bottom: 20px;">✅</div>
            <h2 style="color: #155724; margin-bottom: 15px; font-size: 32px;">HEALTHY RICE LEAF!</h2>
            <div class="confidence-header" style="margin: 20px 0;">
                <span style="color: #155724; font-size: 18px;">Confidence Level</span>
                <span style="color: #155724; font-size: 24px; font-weight: bold;">${data.confidence.toFixed(1)}%</span>
            </div>
            <div class="confidence-bar" style="background: #fff; height: 30px; border-radius: 15px; overflow: hidden; margin: 15px 0;">
                <div style="width: ${data.confidence}%; height: 100%; background: linear-gradient(90deg, #28a745, #20c997); transition: width 1s ease;"></div>
            </div>
            <p style="color: #155724; font-size: 18px; line-height: 1.8; margin: 20px 0;">
                ${data.description}
            </p>
        </div>

        <div style="background: white; border-radius: 12px; padding: 30px; margin: 20px 0; box-shadow: 0 3px 10px rgba(0,0,0,0.1);">
            <h3 style="color: #28a745; margin-bottom: 20px; font-size: 24px;">🌾 Maintenance Recommendations</h3>
            <ul style="color: #155724; text-align: left; line-height: 2; font-size: 16px;">
                ${data.recommendations.map(r => `<li>${r}</li>`).join('')}
            </ul>
        </div>

        <div style="background: white; border-radius: 12px; padding: 30px; margin: 20px 0; box-shadow: 0 3px 10px rgba(0,0,0,0.1);">
            <h3 style="color: #28a745; margin-bottom: 20px; font-size: 24px;">🛡️ Preventive Measures</h3>
            <ul style="color: #155724; text-align: left; line-height: 2; font-size: 16px;">
                ${data.preventive_measures.map(p => `<li>${p}</li>`).join('')}
            </ul>
        </div>

        <button onclick="clearImage()" style="margin: 30px auto; display: block; padding: 15px 50px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 18px; box-shadow: 0 3px 10px rgba(40, 167, 69, 0.3);">
            📷 Analyze Another Leaf
        </button>
    `;
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Clear image
function clearImage() {
    previewBox.style.display = 'none';
    uploadBox.style.display = 'block';
    resultsSection.style.display = 'none';
    imageInput.value = '';
}

// Smooth scrolling for navigation links
function displayResults(data) {
    const disease = treatmentDatabase[data.disease_key];
    
    // Show results section
    resultsSection.style.display = 'block';
    resultsSection.innerHTML = ''; // Clear loading/error state
    
    // Create results HTML
    resultsSection.innerHTML = `
        <div class="confidence-meter">
            <div class="confidence-header">
                <span>Confidence Level</span>
                <span id="confidenceValue">${data.confidence.toFixed(1)}%</span>
            </div>
            <div class="confidence-bar">
                <div class="confidence-fill" id="confidenceFill" style="width: ${data.confidence}%"></div>
            </div>
        </div>

        <div class="disease-info">
            <h2 id="diseaseName">${disease.disease_name}</h2>
            <p id="diseaseDescription">${disease.description}</p>
        </div>

        <div class="symptoms-section">
            <h3>🔍 Symptoms</h3>
            <ul id="symptomsList">
                ${disease.symptoms.map(s => `<li>${s}</li>`).join('')}
            </ul>
        </div>

        <div class="treatment-section">
            <h3>💊 Treatment & Pesticides</h3>
            <ul id="treatmentList">
                ${disease.treatment.map(t => `<li>${t}</li>`).join('')}
            </ul>
        </div>

        <div class="precautions-section">
            <h3>🛡️ Precautions & Prevention</h3>
            <ul id="precautionsList">
                ${disease.precautions.map(p => `<li>${p}</li>`).join('')}
            </ul>
        </div>

        <div class="recommendations-section">
            <div class="recommendation-card">
                <h4>💧 Water Management</h4>
                <p id="waterManagement">${disease.water_management}</p>
            </div>
            <div class="recommendation-card">
                <h4>🌱 Fertilizer Recommendation</h4>
                <p id="fertilizerRec">${disease.fertilizer}</p>
            </div>
            <div class="recommendation-card severity-${disease.severity.toLowerCase().replace(' ', '-')}">
                <h4>⚠️ Severity Level</h4>
                <p id="severityLevel">${disease.severity}</p>
            </div>
        </div>

        <button onclick="clearImage()" style="margin: 30px auto; display: block; padding: 12px 40px; background: #2ecc71; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
            📷 Analyze Another Image
        </button>
    `;
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Active navigation highlight
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });
    
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});
