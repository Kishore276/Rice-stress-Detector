"""
Rice Disease Detection - Flask Backend API (Simplified)
Serves predictions and handles image uploads
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from keras.models import load_model
from keras.preprocessing import image
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
model = load_model(MODEL_PATH)
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
        "application_method": "Foliar spray, cover both leaf surfaces thoroughly",
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
        "description": "Fungal disease causing diamond-shaped lesions on leaves",
        "pesticides": [
            "Tricyclazole 75% WP - Apply @ 0.6g/liter",
            "Carbendazim 50% WP - Use @ 1g/liter",
            "Azoxystrobin 25% SC - Apply @ 1ml/liter",
            "Isoprothiolane 40% EC - Use @ 1.5ml/liter"
        ],
        "application_method": "Spray thoroughly on leaves and stems, ensure complete coverage",
        "frequency": "2-3 applications at 10-12 day intervals",
        "preventive_measures": [
            "Use certified disease-free seeds",
            "Apply silicon fertilizers to strengthen plants",
            "Avoid excessive nitrogen application",
            "Ensure proper plant spacing for air circulation"
        ]
    },
    "Brownspot": {
        "disease_name": "Brown Spot",
        "description": "Fungal disease with circular brown spots on leaves",
        "pesticides": [
            "Mancozeb 75% WP - Apply @ 2.5g/liter",
            "Propiconazole 25% EC - Use @ 1ml/liter",
            "Copper Oxychloride 50% WP - Apply @ 3g/liter",
            "Carbendazim 50% WP - Seed treatment @ 2g/kg seed"
        ],
        "application_method": "Foliar spray and seed treatment before sowing",
        "frequency": "Every 10-15 days, 2-3 applications during crop season",
        "preventive_measures": [
            "Treat seeds before sowing",
            "Ensure adequate soil nutrition with balanced fertilizer",
            "Maintain consistent moisture levels",
            "Remove and burn infected plant debris"
        ]
    },
    "Tungro": {
        "disease_name": "Tungro Virus",
        "description": "Viral disease transmitted by green leafhoppers causing yellow discoloration",
        "pesticides": [
            "Imidacloprid 17.8% SL - Apply @ 0.3ml/liter (for vector control)",
            "Thiamethoxam 25% WG - Use @ 0.2g/liter (for leafhopper control)",
            "Fipronil 5% SC - Apply @ 2ml/liter (vector management)",
            "Neem oil 3-5% - Organic alternative for pest control"
        ],
        "application_method": "Spray to control green leafhopper vectors, focus on preventing transmission",
        "frequency": "Weekly sprays during critical periods, especially in early crop stages",
        "preventive_measures": [
            "Remove and destroy infected plants immediately",
            "Control green leafhopper population with insecticides",
            "Use resistant rice varieties",
            "Synchronize planting dates within the community",
            "Use light traps for monitoring leafhopper population"
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

def is_healthy_rice_leaf(img_array, predictions):
    """
    Determine if the rice leaf is healthy (no disease)
    Returns: (is_healthy, confidence_score)
    """
    img = img_array[0]
    
    # Calculate green color dominance (healthy leaves are vibrant green)
    mean_rgb = np.mean(img, axis=(0, 1))
    green_dominance = mean_rgb[1] / (mean_rgb[0] + mean_rgb[2] + 0.001)
    
    # Calculate color uniformity (healthy leaves have uniform color)
    std_rgb = np.std(img, axis=(0, 1))
    color_uniformity = 1.0 / (np.mean(std_rgb) + 0.001)
    
    # Check if predictions are all low (confused = likely healthy/no clear disease)
    max_confidence = float(np.max(predictions[0]))
    prediction_uncertainty = float(np.std(predictions[0]))
    
    # Healthy leaf indicators:
    # 1. Very low prediction confidence across all diseases (< 70%)
    # 2. High green color dominance (> 1.2)
    # 3. Low color variation (uniform green color)
    # 4. Predictions are evenly distributed (model is uncertain = no clear disease)
    
    is_healthy = False
    health_score = 0.0
    
    # If max confidence is low AND predictions are uncertain
    if max_confidence < 0.70 and prediction_uncertainty < 0.20:
        is_healthy = True
        health_score = 85.0 + (1.0 - max_confidence) * 15.0  # 85-100%
    
    # If green dominance is very high (vibrant green, no brown/yellow spots)
    elif green_dominance > 1.3 and max_confidence < 0.75:
        is_healthy = True
        health_score = 80.0 + green_dominance * 10.0
    
    return is_healthy, min(health_score, 99.0)

def is_rice_leaf(img_array, predictions):
    """
    Validate if the uploaded image is likely a rice leaf
    Returns: (is_valid, reason)
    """
    # Extract image for analysis
    img = img_array[0]  # Remove batch dimension
    
    # Check 1: Image quality and characteristics
    # Rice leaves typically have specific color patterns (green with disease spots)
    # Calculate color distribution
    mean_rgb = np.mean(img, axis=(0, 1))
    std_rgb = np.std(img, axis=(0, 1))
    
    # Rice leaves should have significant green component
    # If red or blue dominates over green, it's likely not a rice leaf
    if mean_rgb[1] < mean_rgb[0] or mean_rgb[1] < mean_rgb[2]:
        return False, "⚠️ NOT A RICE PLANT!\n\nThis image does not appear to be a rice plant. Rice leaves are primarily green. Please upload a clear close-up image of a RICE LEAF."
    
    # Check 2: Very strict confidence threshold for DISEASED leaves
    max_confidence = float(np.max(predictions[0]))
    
    # Check if it might be a healthy leaf first
    is_healthy, health_score = is_healthy_rice_leaf(img_array, predictions)
    
    # If potentially healthy, that's also valid (will be handled later)
    if is_healthy:
        return True, "Healthy rice leaf detected"
    
    # For diseased leaves, require very high confidence (85%+)
    if max_confidence < 0.85:
        return False, f"⚠️ NOT A RICE PLANT!\n\nConfidence too low ({max_confidence*100:.1f}%). This image doesn't appear to be a rice plant or the image quality is poor.\n\n✅ Please upload:\n• A close-up photo of a RICE LEAF (not other crops)\n• Clear, well-lit image\n• Good quality image showing the leaf clearly"
    
    # Check 3: Prediction certainty - should be decisive, not confused
    prediction_std = float(np.std(predictions[0]))
    
    if prediction_std < 0.18:
        return False, "⚠️ NOT A RICE PLANT OR UNCLEAR IMAGE!\n\nThe model cannot confidently classify this image. This usually means:\n• The image is NOT a rice plant\n• The image quality is too poor\n• The plant/leaf is not clearly visible\n\n✅ Please upload a clear, close-up photo of a RICE LEAF."
    
    # Check 4: Second-best prediction shouldn't be too close
    sorted_preds = sorted(predictions[0], reverse=True)
    if len(sorted_preds) > 1:
        confidence_gap = sorted_preds[0] - sorted_preds[1]
        if confidence_gap < 0.25:
            return False, "⚠️ AMBIGUOUS IMAGE - NOT RICE PLANT!\n\nThe model is confused between multiple classes, which indicates:\n• This is likely NOT a rice plant\n• The image shows multiple plants or unclear features\n\n✅ Please upload:\n• A single RICE LEAF in focus\n• Good lighting and image quality"
    
    # Check 5: Texture analysis - rice leaves have specific texture patterns
    # Calculate edge intensity
    gray_img = np.mean(img, axis=2)
    edges = np.abs(np.diff(gray_img, axis=0)).mean() + np.abs(np.diff(gray_img, axis=1)).mean()
    
    # If very low edge intensity, might be a blurry image or not a leaf
    if edges < 0.05:
        return False, "⚠️ IMAGE TOO BLURRY OR NOT A PLANT!\n\nThe image lacks clear leaf structure. Please upload:\n• A sharp, focused image\n• Clear RICE LEAF with visible veins and texture\n• Adequate lighting"
    
    return True, "Valid rice leaf detected"

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
        
        # Validate if image is a rice leaf
        is_valid, validation_message = is_rice_leaf(img_array, predictions)
        
        if not is_valid:
            return jsonify({
                'success': False,
                'error': 'Not a rice leaf',
                'message': validation_message,
                'suggestion': 'Please upload a clear image of a rice leaf.'
            }), 400
        
        # Check if the rice leaf is healthy (no disease)
        is_healthy, health_confidence = is_healthy_rice_leaf(img_array, predictions)
        
        if is_healthy:
            # Return healthy leaf response
            response = {
                'success': True,
                'healthy': True,
                'confidence': round(health_confidence, 2),
                'message': '✅ HEALTHY RICE LEAF DETECTED!',
                'description': 'Great news! This rice leaf appears to be healthy with no visible disease symptoms.',
                'recommendations': [
                    'Continue regular monitoring of your rice crop',
                    'Maintain proper water management (2-5 cm depth)',
                    'Apply balanced NPK fertilizer as per crop stage',
                    'Keep field free from weeds',
                    'Monitor for early signs of pests or diseases',
                    'Ensure adequate spacing for air circulation'
                ],
                'preventive_measures': [
                    'Use disease-free certified seeds',
                    'Practice crop rotation',
                    'Maintain field hygiene - remove crop debris',
                    'Apply organic matter to improve soil health',
                    'Use recommended fertilizer doses - avoid excess nitrogen',
                    'Monitor weather conditions and adjust management accordingly'
                ],
                'uploaded_image': unique_filename,
                'timestamp': datetime.now().isoformat()
            }
            print(f"✓ Healthy rice leaf detected ({health_confidence:.2f}%)")
            return jsonify(response), 200
        
        # Get predicted class and confidence for diseased leaves
        predicted_class_idx = int(np.argmax(predictions[0]))
        confidence = float(predictions[0][predicted_class_idx]) * 100
        
        # Get class name
        predicted_disease = class_indices[str(predicted_class_idx)]
        
        # Get treatment info
        treatment_info = treatment_database.get(predicted_disease, {})
        
        # Prepare response for diseased leaves
        response = {
            'success': True,
            'healthy': False,
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
