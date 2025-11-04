"""
Rice Stress Detector - Enhanced Flask Backend with Authentication
Handles authentication, dashboards, and APIs
"""

from flask import Flask, request, jsonify, send_from_directory, render_template, session, redirect, url_for
from flask_cors import CORS
import tensorflow as tf
from tensorflow import keras
import numpy as np
from PIL import Image
import os
import json
from datetime import datetime
import uuid
import hashlib
from functools import wraps
from db_connect import DatabaseConnection

# Set up Flask with correct template folder
app = Flask(__name__, template_folder='website', static_folder='website')
CORS(app)

# Session Configuration - using Flask built-in sessions
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

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

# =====================================================
# UTILITY FUNCTIONS
# =====================================================

def hash_password(password):
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(stored_hash, provided_password):
    """Verify password against stored hash"""
    return stored_hash == hash_password(provided_password)

def get_db():
    """Get database connection"""
    db = DatabaseConnection()
    db.connect()
    return db

def login_required(f):
    """Decorator to require login"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

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

# =====================================================
# AUTHENTICATION ROUTES
# =====================================================

@app.route('/')
def index():
    """Home page - redirect to login"""
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Login page"""
    if request.method == 'GET':
        return render_template('login.html')
    
    # Handle POST request
    data = request.form
    username = data.get('username', '').strip()
    password = data.get('password', '')
    user_type = data.get('user_type', 'farmer')
    
    if not username or not password:
        return render_template('login.html', error='Username and password required')
    
    db = get_db()
    
    try:
        # Query user
        query = "SELECT id, email, password_hash, user_type FROM users WHERE username = %s AND user_type = %s"
        user = db.fetch_one(query, (username, user_type))
        
        if user and verify_password(user[2], password):
            # Login successful
            session['user_id'] = user[0]
            session['username'] = username
            session['user_type'] = user_type
            
            # Redirect based on user type
            if user_type == 'farmer':
                return redirect(url_for('farmer_dashboard'))
            else:
                return redirect(url_for('researcher_dashboard'))
        else:
            return render_template('login.html', error='Invalid username or password')
    
    except Exception as e:
        print(f"Login error: {e}")
        return render_template('login.html', error='Login failed. Please try again.')
    finally:
        db.disconnect()

@app.route('/register', methods=['POST'])
def register():
    """Register new user"""
    db = get_db()
    
    try:
        data = request.form
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        confirm_password = data.get('confirm_password', '')
        user_type = data.get('user_type', 'farmer')
        whatsapp_number = data.get('whatsapp_number', '').strip()
        
        # Validation
        if not all([username, email, password, confirm_password, whatsapp_number]):
            return render_template('login.html', error='All fields are required')
        
        if password != confirm_password:
            return render_template('login.html', error='Passwords do not match')
        
        if len(password) < 8:
            return render_template('login.html', error='Password must be at least 8 characters')
        
        # Check if user exists
        query = "SELECT id FROM users WHERE username = %s OR email = %s"
        existing_user = db.fetch_one(query, (username, email))
        
        if existing_user:
            return render_template('login.html', error='Username or email already exists')
        
        # Hash password
        password_hash = hash_password(password)
        
        # Create user
        insert_query = """
            INSERT INTO users (username, email, password_hash, user_type, whatsapp_number)
            VALUES (%s, %s, %s, %s, %s)
        """
        
        if db.execute_query(insert_query, (username, email, password_hash, user_type, whatsapp_number)):
            # Get user ID
            user = db.fetch_one("SELECT id FROM users WHERE username = %s", (username,))
            user_id = user[0]
            
            if user_type == 'farmer':
                # Create farmer record
                full_name = data.get('full_name', '').strip()
                phone_number = data.get('phone_number', '').strip()
                address = data.get('address', '').strip()
                city = data.get('city', '').strip()
                state = data.get('state', '').strip()
                postal_code = data.get('postal_code', '').strip()
                farm_size = data.get('farm_size', 0)
                
                farmer_query = """
                    INSERT INTO farmers (user_id, full_name, phone_number, address, city, state, postal_code, farm_size)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """
                
                db.execute_query(farmer_query, (user_id, full_name, phone_number, address, city, state, postal_code, farm_size))
                
                # Create cart for farmer
                cart_query = "INSERT INTO carts (farmer_id) SELECT id FROM farmers WHERE user_id = %s"
                db.execute_query(cart_query, (user_id,))
            
            else:  # researcher
                # Create researcher record
                full_name = data.get('full_name_researcher', '').strip()
                organization = data.get('organization', '').strip()
                department = data.get('department', '').strip()
                research_focus = data.get('research_focus', '').strip()
                
                researcher_query = """
                    INSERT INTO researchers (user_id, full_name, organization, department, research_focus, phone_number)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """
                
                db.execute_query(researcher_query, (user_id, full_name, organization, department, research_focus, data.get('phone_number', '')))
            
            return redirect(url_for('login'))
        
        else:
            return render_template('login.html', error='Registration failed. Please try again.')
    
    except Exception as e:
        print(f"Registration error: {e}")
        return render_template('login.html', error=f'Registration failed: {str(e)}')
    
    finally:
        db.disconnect()

@app.route('/logout')
def logout():
    """Logout user"""
    session.clear()
    return redirect(url_for('login'))

# =====================================================
# DASHBOARD ROUTES
# =====================================================

@app.route('/dashboard')
@login_required
def dashboard():
    """Redirect to appropriate dashboard"""
    if session.get('user_type') == 'farmer':
        return redirect(url_for('farmer_dashboard'))
    else:
        return redirect(url_for('researcher_dashboard'))

@app.route('/farmer-dashboard')
@login_required
def farmer_dashboard():
    """Farmer dashboard"""
    if session.get('user_type') != 'farmer':
        return redirect(url_for('login'))
    
    return render_template('farmer_dashboard.html')

@app.route('/researcher-dashboard')
@login_required
def researcher_dashboard():
    """Researcher dashboard"""
    if session.get('user_type') != 'researcher':
        return redirect(url_for('login'))
    
    return render_template('researcher_dashboard.html')

# =====================================================
# API ROUTES FOR FARMERS
# =====================================================

@app.route('/api/farmer/profile', methods=['GET'])
@login_required
def get_farmer_profile():
    """Get farmer profile"""
    db = get_db()
    
    try:
        user_id = session.get('user_id')
        query = """
            SELECT f.id, f.full_name, f.phone_number, f.address, f.city, f.state, 
                   f.postal_code, f.latitude, f.longitude, f.farm_size, u.email, u.whatsapp_number
            FROM farmers f
            JOIN users u ON f.user_id = u.id
            WHERE f.user_id = %s
        """
        
        farmer = db.fetch_one(query, (user_id,))
        
        if farmer:
            return jsonify({
                'farmer_id': farmer[0],
                'full_name': farmer[1],
                'phone_number': farmer[2],
                'address': farmer[3],
                'city': farmer[4],
                'state': farmer[5],
                'postal_code': farmer[6],
                'latitude': float(farmer[7]) if farmer[7] else None,
                'longitude': float(farmer[8]) if farmer[8] else None,
                'farm_size': float(farmer[9]),
                'email': farmer[10],
                'whatsapp_number': farmer[11]
            }), 200
        else:
            return jsonify({'error': 'Farmer not found'}), 404
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.disconnect()

@app.route('/api/farmer/prediction-history', methods=['GET'])
@login_required
def get_prediction_history():
    """Get farmer's disease detection history"""
    db = get_db()
    
    try:
        user_id = session.get('user_id')
        query = """
            SELECT ph.id, ph.image_filename, d.name, ph.confidence_score, ph.prediction_date
            FROM prediction_history ph
            LEFT JOIN diseases d ON ph.disease_id = d.id
            JOIN farmers f ON ph.farmer_id = f.id
            WHERE f.user_id = %s
            ORDER BY ph.prediction_date DESC
            LIMIT 50
        """
        
        predictions = db.fetch_query(query, (user_id,))
        
        history = []
        for pred in predictions:
            history.append({
                'id': pred[0],
                'image': pred[1],
                'disease': pred[2],
                'confidence': float(pred[3]) if pred[3] else 0,
                'date': pred[4].isoformat() if pred[4] else None
            })
        
        return jsonify({'history': history}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.disconnect()

@app.route('/api/farmer/research-labs', methods=['GET'])
@login_required
def get_research_labs():
    """Get all research labs"""
    db = get_db()
    
    try:
        query = """
            SELECT id, name, description, address, city, state, latitude, longitude, 
                   email, whatsapp_number, phone_number, website
            FROM research_labs
            ORDER BY city, name
        """
        
        labs = db.fetch_query(query)
        
        labs_list = []
        for lab in labs:
            labs_list.append({
                'id': lab[0],
                'name': lab[1],
                'description': lab[2],
                'address': lab[3],
                'city': lab[4],
                'state': lab[5],
                'latitude': float(lab[6]),
                'longitude': float(lab[7]),
                'email': lab[8],
                'whatsapp_number': lab[9],
                'phone_number': lab[10],
                'website': lab[11]
            })
        
        return jsonify({'labs': labs_list}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.disconnect()

@app.route('/api/farmer/products', methods=['GET'])
@login_required
def get_products():
    """Get pesticides and fertilizers"""
    db = get_db()
    
    try:
        product_type = request.args.get('type', 'all')  # pesticide, fertilizer, all
        
        products = {'pesticides': [], 'fertilizers': []}
        
        if product_type in ['all', 'pesticide']:
            pest_query = "SELECT id, name, description, price_per_unit, unit_type, stock_quantity FROM pesticides"
            pesticides = db.fetch_query(pest_query)
            
            for p in pesticides:
                products['pesticides'].append({
                    'id': p[0],
                    'name': p[1],
                    'description': p[2],
                    'price': float(p[3]),
                    'unit': p[4],
                    'stock': p[5]
                })
        
        if product_type in ['all', 'fertilizer']:
            fert_query = "SELECT id, name, description, price_per_unit, unit_type, stock_quantity FROM fertilizers"
            fertilizers = db.fetch_query(fert_query)
            
            for f in fertilizers:
                products['fertilizers'].append({
                    'id': f[0],
                    'name': f[1],
                    'description': f[2],
                    'price': float(f[3]),
                    'unit': f[4],
                    'stock': f[5]
                })
        
        return jsonify(products), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.disconnect()

@app.route('/api/farmer/shops', methods=['GET'])
@login_required
def get_shops():
    """Get pesticide and fertilizer shops"""
    db = get_db()
    
    try:
        # Get farmer location
        user_id = session.get('user_id')
        farmer_query = "SELECT latitude, longitude FROM farmers WHERE user_id = %s"
        farmer = db.fetch_one(farmer_query, (user_id,))
        
        # If farmer location not set, return all shops without distance filtering
        if not farmer or not farmer[0] or not farmer[1]:
            query = """
                SELECT id, name, shop_type, address, city, latitude, longitude, 
                       email, whatsapp_number, phone_number, rating, opening_time, closing_time
                FROM shops
                LIMIT 50
            """
            shops = db.fetch_query(query)
            shops_list = []
            
            for shop in shops:
                shops_list.append({
                    'id': shop[0],
                    'name': shop[1],
                    'shop_type': shop[2],
                    'address': shop[3],
                    'city': shop[4],
                    'latitude': float(shop[5]),
                    'longitude': float(shop[6]),
                    'email': shop[7],
                    'whatsapp_number': shop[8],
                    'phone_number': shop[9],
                    'rating': float(shop[10]) if shop[10] else 0,
                    'opening_time': str(shop[11]),
                    'closing_time': str(shop[12]),
                    'distance': None  # No distance when farmer location not set
                })
            
            return jsonify({'shops': shops_list, 'farmer_location': None}), 200
        
        farmer_lat, farmer_lon = farmer[0], farmer[1]
        radius = float(request.args.get('radius', 10))  # Default 10 km
        
        # Get shops within radius
        query = """
            SELECT id, name, shop_type, address, city, latitude, longitude, 
                   email, whatsapp_number, phone_number, rating, opening_time, closing_time
            FROM shops
        """
        
        shops = db.fetch_query(query)
        shops_list = []
        
        for shop in shops:
            # Calculate distance
            from math import radians, cos, sin, asin, sqrt
            lon1, lat1, lon2, lat2 = map(radians, [farmer_lon, farmer_lat, shop[6], shop[5]])
            dlon = lon2 - lon1
            dlat = lat2 - lat1
            a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
            c = 2 * asin(sqrt(a))
            distance = 6371 * c  # Radius of earth in kilometers
            
            if distance <= radius:
                shops_list.append({
                    'id': shop[0],
                    'name': shop[1],
                    'shop_type': shop[2],
                    'address': shop[3],
                    'city': shop[4],
                    'latitude': float(shop[5]),
                    'longitude': float(shop[6]),
                    'email': shop[7],
                    'whatsapp_number': shop[8],
                    'phone_number': shop[9],
                    'rating': float(shop[10]) if shop[10] else 0,
                    'opening_time': str(shop[11]),
                    'closing_time': str(shop[12]),
                    'distance': round(distance, 2)
                })
        
        return jsonify({
            'shops': shops_list,
            'farmer_location': {'latitude': farmer_lat, 'longitude': farmer_lon}
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.disconnect()

# =====================================================
# API ROUTES FOR RESEARCHERS
# =====================================================

@app.route('/api/researcher/farmers', methods=['GET'])
@login_required
def get_all_farmers():
    """Get all farmers for researcher dashboard"""
    if session.get('user_type') != 'researcher':
        return jsonify({'error': 'Unauthorized'}), 403
    
    db = get_db()
    
    try:
        query = """
            SELECT f.id, f.full_name, f.phone_number, f.address, f.city, f.state, 
                   u.email, u.whatsapp_number, f.farm_size, f.created_at
            FROM farmers f
            JOIN users u ON f.user_id = u.id
            ORDER BY f.created_at DESC
        """
        
        farmers = db.fetch_query(query)
        farmers_list = []
        
        for farmer in farmers:
            farmers_list.append({
                'id': farmer[0],
                'full_name': farmer[1],
                'phone_number': farmer[2],
                'address': farmer[3],
                'city': farmer[4],
                'state': farmer[5],
                'email': farmer[6],
                'whatsapp_number': farmer[7],
                'farm_size': float(farmer[8]),
                'joined_date': farmer[9].isoformat() if farmer[9] else None
            })
        
        return jsonify({'farmers': farmers_list}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.disconnect()

# =====================================================
# PREDICTION API (Enhanced with DB logging)
# =====================================================

@app.route('/api/predict', methods=['POST'])
@login_required
def predict():
    """Handle image upload and prediction"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400
        
        # Generate unique filename
        file_ext = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}.{file_ext}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        
        file.save(file_path)
        
        # Preprocess and predict
        img_array = preprocess_image(file_path)
        predictions = model.predict(img_array, verbose=0)
        
        predicted_class_idx = int(np.argmax(predictions[0]))
        confidence = float(predictions[0][predicted_class_idx]) * 100
        predicted_disease = class_indices[str(predicted_class_idx)]
        
        # Get pesticide recommendations from database
        db = get_db()
        pesticides_list = []
        treatment_info = ""
        
        try:
            user_id = session.get('user_id')
            
            # Get farmer ID
            farmer_query = "SELECT id FROM farmers WHERE user_id = %s"
            farmer = db.fetch_one(farmer_query, (user_id,))
            
            if farmer:
                farmer_id = farmer[0]
                
                # Get disease ID and treatment info
                disease_query = "SELECT id, treatment FROM diseases WHERE name = %s"
                disease = db.fetch_one(disease_query, (predicted_disease,))
                
                if disease:
                    disease_id = disease[0]
                    treatment_info = disease[1] if disease[1] else "Apply appropriate pesticides"
                    
                    # Get recommended pesticides for this disease
                    pesticide_query = """
                        SELECT p.id, p.name, p.description, p.price_per_unit, p.unit_type,
                               p.effectiveness_rating, p.application_method, p.dosage_per_acre
                        FROM pesticides p
                        WHERE p.id IN (
                            SELECT pesticide_id FROM disease_pesticide_mapping 
                            WHERE disease_id = %s
                        )
                        ORDER BY p.effectiveness_rating DESC
                        LIMIT 5
                    """
                    pesticides = db.fetch_query(pesticide_query, (disease_id,))
                    
                    for pest in pesticides:
                        pesticides_list.append({
                            'id': pest[0],
                            'name': pest[1],
                            'description': pest[2],
                            'price': float(pest[3]),
                            'unit': pest[4],
                            'effectiveness': float(pest[5]) if pest[5] else 0,
                            'application_method': pest[6],
                            'dosage_per_acre': pest[7]
                        })
                else:
                    disease_id = None
                
                # Insert prediction
                insert_query = """
                    INSERT INTO prediction_history 
                    (farmer_id, image_filename, disease_detected, disease_id, confidence_score, model_version, prediction_date)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW())
                """
                
                db.execute_query(insert_query, (farmer_id, unique_filename, predicted_disease, disease_id, confidence, '1.0'))
        
        except Exception as e:
            print(f"Database logging error: {e}")
        
        finally:
            db.disconnect()
        
        return jsonify({
            'success': True,
            'disease': predicted_disease,
            'confidence': round(confidence, 2),
            'uploaded_image': unique_filename,
            'timestamp': datetime.now().isoformat(),
            'treatment': treatment_info,
            'recommended_pesticides': pesticides_list
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =====================================================
# STATIC FILE ROUTES
# =====================================================

@app.route('/website/<path:path>')
def serve_static(path):
    """Serve static files"""
    return send_from_directory('website', path)

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded images"""
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/api/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None
    }), 200

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("Rice Stress Detector - Enhanced Flask Backend")
    print("=" * 60)
    print(f"Model: {MODEL_PATH}")
    print(f"Upload folder: {UPLOAD_FOLDER}")
    print("Features: Authentication, Dashboards, Database Integration")
    print("=" * 60)
    print("\nServer starting at http://localhost:5000")
    print("=" * 60 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
