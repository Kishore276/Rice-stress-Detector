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
        
        // Simulate prediction (in real app, send to backend)
        setTimeout(() => {
            predictDisease();
        }, 1000);
    };
    
    reader.readAsDataURL(file);
}

// Clear image
function clearImage() {
    previewBox.style.display = 'none';
    uploadBox.style.display = 'block';
    resultsSection.style.display = 'none';
    imageInput.value = '';
}

// Simulate disease prediction
function predictDisease() {
    // In real application, this would send image to backend API
    // For demo, randomly select a disease
    const diseases = ['Bacterialblight', 'Blast', 'Brownspot', 'Tungro'];
    const randomDisease = diseases[Math.floor(Math.random() * diseases.length)];
    const confidence = 85 + Math.random() * 15; // 85-100%
    
    displayResults(randomDisease, confidence);
}

// Display results
function displayResults(diseaseName, confidence) {
    const disease = treatmentDatabase[diseaseName];
    
    // Show results section
    resultsSection.style.display = 'block';
    
    // Update confidence meter
    const confidenceFill = document.getElementById('confidenceFill');
    const confidenceValue = document.getElementById('confidenceValue');
    confidenceFill.style.width = confidence + '%';
    confidenceValue.textContent = confidence.toFixed(1) + '%';
    
    // Update disease info
    document.getElementById('diseaseName').textContent = disease.disease_name;
    document.getElementById('diseaseDescription').textContent = disease.description;
    
    // Update symptoms
    const symptomsList = document.getElementById('symptomsList');
    symptomsList.innerHTML = '';
    disease.symptoms.forEach(symptom => {
        const li = document.createElement('li');
        li.textContent = symptom;
        symptomsList.appendChild(li);
    });
    
    // Update precautions
    const precautionsList = document.getElementById('precautionsList');
    precautionsList.innerHTML = '';
    disease.precautions.forEach(precaution => {
        const li = document.createElement('li');
        li.textContent = precaution;
        precautionsList.appendChild(li);
    });
    
    // Update treatment
    const treatmentList = document.getElementById('treatmentList');
    treatmentList.innerHTML = '';
    disease.treatment.forEach(treatment => {
        const li = document.createElement('li');
        li.textContent = treatment;
        treatmentList.appendChild(li);
    });
    
    // Update other recommendations
    document.getElementById('waterManagement').textContent = disease.water_management;
    document.getElementById('fertilizerRec').textContent = disease.fertilizer;
    document.getElementById('severityLevel').textContent = disease.severity;
    
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
