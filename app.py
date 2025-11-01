"""
Rice Disease Detection - Flask Backend API
Serves predictions and handles image uploads
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import tensorflow as tf
from tensorflow import keras
import numpy as np
from PIL import Image
import os
import json
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app)

# Configuration
MODEL_PATH = 'models/rice_disease_model.h5'
CLASS_INDICES_PATH = 'models/class_indices.json'
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
IMG_SIZE = 224

# Create upload folder
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load model and class indices
print("Loading model...")
model = keras.models.load_model(MODEL_PATH)
print("✓ Model loaded successfully")

with open(CLASS_INDICES_PATH, 'r') as f:
    class_indices = json.load(f)

# Treatment and pesticide recommendations database
treatment_database = {
    "Bacterialblight": {
        "disease_name": "Bacterial Blight",
        "description": "Bacterial infection causing wilting and leaf damage",
        "pesticides": [
            "Copper Hydroxide 77% WP - Apply @ 3g/liter",
            "Streptocycline 200-300 ppm - Spray at 7-10 day intervals",
            "Plantomycin - Apply @ 1g/liter water",
            "Copper Oxychloride 50% WP - Use @ 3g/liter"
        ],
        "application_method": "Foliar spray, cover both leaf surfaces",
        "frequency": "Every 7-10 days until symptoms reduce",
        "preventive_measures": [
            "Use disease-free seeds",
            "Avoid excessive nitrogen fertilizer",
            "Maintain proper water depth (2-5 cm)",
            "Remove infected plants immediately"
        ]
    },
    "Blast": {
        "disease_name": "Rice Blast",
        "description": "Fungal disease causing diamond-shaped lesions",
        "pesticides": [
            "Tricyclazole 75% WP - Apply @ 0.6g/liter",
            "Carbendazim 50% WP - Use @ 1g/liter",
            "Azoxystrobin 25% SC - Apply @ 1ml/liter",
            "Isoprothiolane 40% EC - Use @ 1.5ml/liter"
        ],
        "application_method": "Spray thoroughly on leaves and stems",
        "frequency": "2-3 applications at 10-12 day intervals",
        "preventive_measures": [
            "Use certified disease-free seeds",
            "Apply silicon fertilizers",
            "Avoid excessive nitrogen",
            "Ensure proper plant spacing"
        ]
    },
    "Brownspot": {
        "disease_name": "Brown Spot",
        "description": "Fungal disease with brown spots on leaves",
        "pesticides": [
            "Mancozeb 75% WP - Apply @ 2.5g/liter",
            "Propiconazole 25% EC - Use @ 1ml/liter",
            "Copper Oxychloride 50% WP - Apply @ 3g/liter",
            "Carbendazim 50% WP - Seed treatment @ 2g/kg seed"
        ],
        "application_method": "Foliar spray and seed treatment",
        "frequency": "Every 10-15 days, 2-3 applications",
        "preventive_measures": [
            "Treat seeds before sowing",
            "Ensure adequate soil nutrition",
            "Maintain consistent moisture",
            "Remove infected debris"
        ]
    },
    "Tungro": {
        "disease_name": "Tungro Virus",
        "description": "Viral disease transmitted by green leafhoppers",
        "pesticides": [
            "Imidacloprid 17.8% SL - Apply @ 0.3ml/liter (for vector control)",
            "Thiamethoxam 25% WG - Use @ 0.2g/liter (for leafhopper)",
            "Fipronil 5% SC - Apply @ 2ml/liter (vector control)",
            "Neem oil 3-5% - Organic alternative for pest control"
        ],
        "application_method": "Spray to control leafhopper vectors",
        "frequency": "Weekly sprays during critical periods",
        "preventive_measures": [
            "Remove and destroy infected plants",
            "Control green leafhopper population",
            "Use resistant varieties",
            "Synchronize planting dates in area",
            "Use light traps for monitoring"
        ]
    }
}

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def preprocess_image(image_path):
    """Preprocess image for model prediction"""
    img = Image.open(image_path)
    img = img.convert('RGB')
    img = img.resize((IMG_SIZE, IMG_SIZE))
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    return img_array

@app.route('/')
def index():
    """Serve the main page"""
    return send_from_directory('website', 'index.html')

@app.route('/website/<path:path>')
def serve_static(path):
    """Serve static files"""
    return send_from_directory('website', path)

@app.route('/api/predict', methods=['POST'])
def predict():
    """Handle image upload and prediction"""
    try:
        # Check if image was uploaded
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400
        
        file = request.files['image']
        
        # Check if file is valid
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Use PNG, JPG, or JPEG'}), 400
        
        # Generate unique filename
        file_ext = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}.{file_ext}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        
        # Save uploaded file
        file.save(file_path)
        print(f"✓ Image saved: {file_path}")
        
        # Preprocess and predict
        img_array = preprocess_image(file_path)
        predictions = model.predict(img_array, verbose=0)
        
        # Get predicted class and confidence
        predicted_class_idx = int(np.argmax(predictions[0]))
        confidence = float(predictions[0][predicted_class_idx]) * 100
        
        # Get class name
        predicted_disease = class_indices[str(predicted_class_idx)]
        
        # Get treatment info
        treatment_info = treatment_database.get(predicted_disease, {})
        
        # Prepare response
        response = {
            'success': True,
            'disease': treatment_info.get('disease_name', predicted_disease),
            'disease_key': predicted_disease,
            'confidence': round(confidence, 2),
            'description': treatment_info.get('description', ''),
            'pesticides': treatment_info.get('pesticides', []),
            'application_method': treatment_info.get('application_method', ''),
            'frequency': treatment_info.get('frequency', ''),
            'preventive_measures': treatment_info.get('preventive_measures', []),
            'uploaded_image': unique_filename,
            'timestamp': datetime.now().isoformat()
        }
        
        print(f"✓ Prediction: {predicted_disease} ({confidence:.2f}%)")
        
        return jsonify(response), 200
        
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'classes': list(class_indices.values())
    }), 200

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded images"""
    return send_from_directory(UPLOAD_FOLDER, filename)

if __name__ == '__main__':
    print("\n" + "=" * 50)
    print("Rice Disease Detection API Server")
    print("=" * 50)
    print(f"Model: {MODEL_PATH}")
    print(f"Classes: {list(class_indices.values())}")
    print(f"Upload folder: {UPLOAD_FOLDER}")
    print("=" * 50)
    print("\nServer starting at http://localhost:5000")
    print("=" * 50 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
