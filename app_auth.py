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

# Treatment and pesticide recommendations database (fallback when DB doesn't have data)
treatment_database = {
    "Bacterialblight": {
        "disease_name": "Bacterial Blight",
        "description": "Bacterial infection causing wilting and leaf damage",
        "pesticides": [
            {"name": "Copper Hydroxide 77% WP", "dosage": "3g/liter", "details": "Apply @ 3g/liter water"},
            {"name": "Streptocycline 200-300 ppm", "dosage": "200-300 ppm", "details": "Spray at 7-10 day intervals"},
            {"name": "Plantomycin", "dosage": "1g/liter", "details": "Apply @ 1g/liter water"},
            {"name": "Copper Oxychloride 50% WP", "dosage": "3g/liter", "details": "Use @ 3g/liter water"}
        ],
        "application_method": "Foliar spray, cover both leaf surfaces thoroughly",
        "frequency": "Every 7-10 days until symptoms reduce"
    },
    "Blast": {
        "disease_name": "Rice Blast",
        "description": "Fungal disease causing diamond-shaped lesions on leaves",
        "pesticides": [
            {"name": "Tricyclazole 75% WP", "dosage": "0.6g/liter", "details": "Apply @ 0.6g/liter water"},
            {"name": "Carbendazim 50% WP", "dosage": "1g/liter", "details": "Use @ 1g/liter water"},
            {"name": "Azoxystrobin 25% SC", "dosage": "1ml/liter", "details": "Apply @ 1ml/liter water"},
            {"name": "Isoprothiolane 40% EC", "dosage": "1.5ml/liter", "details": "Use @ 1.5ml/liter water"}
        ],
        "application_method": "Spray thoroughly on leaves and stems, ensure complete coverage",
        "frequency": "2-3 applications at 10-12 day intervals"
    },
    "Brownspot": {
        "disease_name": "Brown Spot",
        "description": "Fungal disease with circular brown spots on leaves",
        "pesticides": [
            {"name": "Mancozeb 75% WP", "dosage": "2.5g/liter", "details": "Apply @ 2.5g/liter water"},
            {"name": "Propiconazole 25% EC", "dosage": "1ml/liter", "details": "Use @ 1ml/liter water"},
            {"name": "Copper Oxychloride 50% WP", "dosage": "3g/liter", "details": "Apply @ 3g/liter water"},
            {"name": "Carbendazim 50% WP", "dosage": "2g/kg seed", "details": "Seed treatment @ 2g/kg seed"}
        ],
        "application_method": "Foliar spray and seed treatment before sowing",
        "frequency": "Every 10-15 days, 2-3 applications during crop season"
    },
    "Tungro": {
        "disease_name": "Tungro Virus",
        "description": "Viral disease transmitted by green leafhoppers causing yellow discoloration",
        "pesticides": [
            {"name": "Imidacloprid 17.8% SL", "dosage": "0.3ml/liter", "details": "Apply @ 0.3ml/liter (for vector control)"},
            {"name": "Thiamethoxam 25% WG", "dosage": "0.2g/liter", "details": "Use @ 0.2g/liter (for leafhopper control)"},
            {"name": "Fipronil 5% SC", "dosage": "2ml/liter", "details": "Apply @ 2ml/liter (vector management)"},
            {"name": "Neem oil 3-5%", "dosage": "3-5ml/liter", "details": "Organic alternative for pest control"}
        ],
        "application_method": "Spray to control green leafhopper vectors, focus on preventing transmission",
        "frequency": "Weekly sprays during critical periods, especially in early crop stages"
    }
}

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
    
    print(f"=== LOGIN ATTEMPT ===")
    print(f"Username: {username}")
    print(f"User Type: {user_type}")
    
    if not username or not password:
        print("Error: Missing username or password")
        return render_template('login.html', error='Username and password required')
    
    db = get_db()
    
    try:
        # Query user
        query = "SELECT id, email, password_hash, user_type FROM users WHERE username = %s AND user_type = %s"
        user = db.fetch_one(query, (username, user_type))
        
        print(f"User found in database: {user is not None}")
        
        if user:
            print(f"User ID: {user[0]}, User Type: {user[3]}")
            password_match = verify_password(user[2], password)
            print(f"Password match: {password_match}")
            
            if password_match:
                # Login successful
                session['user_id'] = user[0]
                session['username'] = username
                session['user_type'] = user_type
                
                print(f"✓ Login successful! Redirecting to dashboard")
                
                # Redirect based on user type
                if user_type == 'farmer':
                    return redirect(url_for('farmer_dashboard'))
                else:
                    return redirect(url_for('researcher_dashboard'))
        
        print("✗ Login failed: Invalid credentials")
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
        
        print(f"=== REGISTRATION ATTEMPT ===")
        print(f"Username: {username}")
        print(f"Email: {email}")
        print(f"WhatsApp: {whatsapp_number}")
        print(f"User Type: {user_type}")
        
        # Validation
        if not all([username, email, password, confirm_password, whatsapp_number]):
            print("Error: Missing required fields")
            return render_template('login.html', error='All fields are required')
        
        if password != confirm_password:
            print("Error: Passwords don't match")
            return render_template('login.html', error='Passwords do not match')
        
        if len(password) < 8:
            print("Error: Password too short")
            return render_template('login.html', error='Password must be at least 8 characters')
        
        # Check if user exists
        query = "SELECT id FROM users WHERE username = %s OR email = %s"
        existing_user = db.fetch_one(query, (username, email))
        
        if existing_user:
            print(f"Error: User already exists (ID: {existing_user[0]})")
            return render_template('login.html', error='Username or email already exists')
        
        # Hash password
        password_hash = hash_password(password)
        print(f"Password hashed successfully")
        
        # Create user
        insert_query = """
            INSERT INTO users (username, email, password_hash, user_type, whatsapp_number)
            VALUES (%s, %s, %s, %s, %s)
        """
        
        result = db.execute_query(insert_query, (username, email, password_hash, user_type, whatsapp_number))
        print(f"User insert result: {result}")
        
        if result:
            # Get user ID
            user = db.fetch_one("SELECT id FROM users WHERE username = %s", (username,))
            user_id = user[0]
            print(f"✓ User created with ID: {user_id}")
            
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
    print(f"=== RESEARCHER DASHBOARD ACCESS ===")
    print(f"Session user_type: {session.get('user_type')}")
    print(f"Session user_id: {session.get('user_id')}")
    print(f"Session username: {session.get('username')}")
    
    if session.get('user_type') != 'researcher':
        print(f"✗ Access denied: user_type is '{session.get('user_type')}', not 'researcher'")
        return redirect(url_for('login'))
    
    print(f"✓ Rendering researcher_dashboard.html")
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
    """Get all registered researchers"""
    db = get_db()
    
    try:
        query = """
            SELECT 
                r.id,
                r.full_name,
                r.organization,
                r.department,
                r.research_focus,
                r.phone_number,
                u.email,
                u.whatsapp_number
            FROM researchers r
            JOIN users u ON r.user_id = u.id
            ORDER BY r.full_name
        """
        
        researchers = db.fetch_query(query)
        
        # Check if query failed
        if researchers is None:
            print("✗ Query returned None - database error")
            return jsonify({'error': 'Database query failed'}), 500
        
        labs_list = []
        for researcher in researchers:
            labs_list.append({
                'id': researcher[0],
                'name': researcher[1] or 'Researcher',
                'description': researcher[4] or 'Research in rice diseases and stress analysis',
                'address': researcher[2] or 'N/A',  # organization
                'city': researcher[3] or 'N/A',  # department
                'state': 'N/A',
                'specialization': researcher[3] or 'Rice Disease Research',  # department
                'email': researcher[6] or 'N/A',
                'whatsapp_number': researcher[7] or 'N/A',
                'phone_number': researcher[5] or 'N/A',
                'website': 'N/A'
            })
        
        print(f"✓ Successfully fetched {len(labs_list)} researchers")
        return jsonify({'labs': labs_list}), 200
    
    except Exception as e:
        print(f"✗ Error fetching researchers: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        try:
            db.disconnect()
        except:
            pass

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


@app.route('/api/researcher/gene-analysis', methods=['POST'])
@login_required
def submit_gene_analysis():
    """Submit rice gene expression analysis data"""
    if session.get('user_type') != 'researcher':
        return jsonify({'error': 'Unauthorized. Only researchers can submit analysis data.'}), 403
    
    db = get_db()
    
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['rice_variety', 'ros_level', 'osrmc_level', 'sub1a_level', 
                          'cat_level', 'snca3_level', 'stress_condition']
        
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate gene expression levels (should be numeric)
        try:
            ros_level = float(data['ros_level'])
            osrmc_level = float(data['osrmc_level'])
            sub1a_level = float(data['sub1a_level'])
            cat_level = float(data['cat_level'])
            snca3_level = float(data['snca3_level'])
        except ValueError:
            return jsonify({'error': 'Gene expression levels must be numeric values'}), 400
        
        # Get researcher ID from session
        researcher_id = session.get('user_id')
        
        # Insert gene analysis data
        insert_query = """
            INSERT INTO rice_gene_expression 
            (rice_variety, ros_level, osrmc_level, sub1a_level, cat_level, snca3_level, 
             stress_condition, researcher_id, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        values = (
            data['rice_variety'],
            ros_level,
            osrmc_level,
            sub1a_level,
            cat_level,
            snca3_level,
            data['stress_condition'],
            researcher_id,
            data.get('notes', '')
        )
        
        db.execute_query(insert_query, values)
        
        # Get the ID of the inserted record
        last_id_query = "SELECT LAST_INSERT_ID()"
        result = db.fetch_query(last_id_query)
        analysis_id = result[0][0] if result else None
        
        print(f"✓ Gene analysis data submitted successfully. Analysis ID: {analysis_id}")
        
        return jsonify({
            'success': True,
            'message': 'Gene analysis data submitted successfully',
            'analysis_id': analysis_id
        }), 201
    
    except Exception as e:
        print(f"✗ Error submitting gene analysis data: {str(e)}")
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    finally:
        db.disconnect()


@app.route('/api/researcher/gene-analysis', methods=['GET'])
@login_required
def get_gene_analysis():
    """Get rice gene expression analysis data for researcher"""
    if session.get('user_type') != 'researcher':
        return jsonify({'error': 'Unauthorized'}), 403
    
    db = get_db()
    
    try:
        # Optional filters
        rice_variety = request.args.get('variety')
        stress_condition = request.args.get('stress')
        limit = request.args.get('limit', 100)
        
        query = """
            SELECT id, rice_variety, ros_level, osrmc_level, sub1a_level, 
                   cat_level, snca3_level, stress_condition, submission_date, notes
            FROM rice_gene_expression
            WHERE 1=1
        """
        params = []
        
        if rice_variety:
            query += " AND rice_variety = %s"
            params.append(rice_variety)
        
        if stress_condition:
            query += " AND stress_condition = %s"
            params.append(stress_condition)
        
        query += " ORDER BY submission_date DESC LIMIT %s"
        params.append(int(limit))
        
        results = db.fetch_query(query, tuple(params))
        
        analysis_data = []
        for row in results:
            analysis_data.append({
                'id': row[0],
                'rice_variety': row[1],
                'ros_level': float(row[2]),
                'osrmc_level': float(row[3]),
                'sub1a_level': float(row[4]),
                'cat_level': float(row[5]),
                'snca3_level': float(row[6]),
                'stress_condition': row[7],
                'submission_date': row[8].isoformat() if row[8] else None,
                'notes': row[9]
            })
        
        return jsonify({'data': analysis_data, 'count': len(analysis_data)}), 200
    
    except Exception as e:
        print(f"✗ Error fetching gene analysis data: {str(e)}")
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    finally:
        db.disconnect()

@app.route('/api/researcher/gene-analysis/<int:analysis_id>', methods=['DELETE'])
@login_required
def delete_gene_analysis(analysis_id):
    """Delete a gene analysis record"""
    if session.get('user_type') != 'researcher':
        return jsonify({'error': 'Unauthorized'}), 403
    
    db = get_db()
    
    try:
        # Delete the record
        query = "DELETE FROM rice_gene_expression WHERE id = %s"
        db.execute_query(query, (analysis_id,))
        
        return jsonify({
            'success': True,
            'message': 'Gene analysis record deleted successfully'
        }), 200
    
    except Exception as e:
        print(f"✗ Error deleting gene analysis: {str(e)}")
        return jsonify({'error': f'Database error: {str(e)}'}), 500
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
        application_method = ""
        frequency = ""
        
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
                    treatment_info = disease[1] if disease[1] else ""
                    
                    try:
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
                        
                        print(f"Found {len(pesticides) if pesticides else 0} pesticides from database for disease_id {disease_id}")
                        
                        if pesticides:
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
                    except Exception as pest_error:
                        print(f"Error querying pesticides: {pest_error}")
                        # Continue to fallback
                else:
                    disease_id = None
                    print(f"Disease '{predicted_disease}' not found in database")
                
                # If no pesticides from database, use fallback data
                if not pesticides_list and predicted_disease in treatment_database:
                    print(f"Using fallback data for '{predicted_disease}'")
                    treatment_data = treatment_database[predicted_disease]
                    treatment_info = treatment_data.get('description', '')
                    application_method = treatment_data.get('application_method', '')
                    frequency = treatment_data.get('frequency', '')
                    
                    for idx, pest in enumerate(treatment_data.get('pesticides', []), 1):
                        pesticides_list.append({
                            'id': idx,
                            'name': pest['name'],
                            'description': pest['details'],
                            'price': 0,  # Price not available in fallback
                            'unit': 'liter/kg',
                            'effectiveness': 85,  # Default effectiveness
                            'application_method': application_method,
                            'dosage_per_acre': pest['dosage']
                        })
                    print(f"Added {len(pesticides_list)} pesticides from fallback data")
                elif not pesticides_list:
                    print(f"No fallback data found for '{predicted_disease}'")
                
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
        
        # Get display name from treatment database if available
        disease_display_name = predicted_disease
        if predicted_disease in treatment_database:
            disease_display_name = treatment_database[predicted_disease].get('disease_name', predicted_disease)
        
        return jsonify({
            'success': True,
            'disease': disease_display_name,
            'disease_key': predicted_disease,
            'confidence': round(confidence, 2),
            'uploaded_image': unique_filename,
            'timestamp': datetime.now().isoformat(),
            'treatment': treatment_info,
            'application_method': application_method,
            'frequency': frequency,
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

# =====================================================
# CART API ROUTES
# =====================================================

@app.route('/api/farmer/cart', methods=['GET'])
@login_required
def get_cart():
    """Get farmer's cart items"""
    if session.get('user_type') != 'farmer':
        return jsonify({'error': 'Unauthorized'}), 403
    
    user_id = session.get('user_id')
    db = get_db()
    
    try:
        # Get farmer ID
        farmer = db.fetch_one("SELECT id FROM farmers WHERE user_id = %s", (user_id,))
        if not farmer:
            return jsonify({'error': 'Farmer profile not found'}), 404
        
        farmer_id = farmer[0]
        
        # Get cart
        cart = db.fetch_one("SELECT id FROM carts WHERE farmer_id = %s", (farmer_id,))
        if not cart:
            # Create cart if not exists
            db.execute_query("INSERT INTO carts (farmer_id) VALUES (%s)", (farmer_id,))
            cart = db.fetch_one("SELECT id FROM carts WHERE farmer_id = %s", (farmer_id,))
        
        cart_id = cart[0]
        
        # Get cart items
        query = """
            SELECT ci.id, ci.product_type, ci.product_id, ci.quantity, ci.price_at_purchase,
                   CASE 
                       WHEN ci.product_type = 'pesticide' THEN p.name
                       WHEN ci.product_type = 'fertilizer' THEN f.name
                   END as product_name,
                   CASE 
                       WHEN ci.product_type = 'pesticide' THEN p.price_per_unit
                       WHEN ci.product_type = 'fertilizer' THEN f.price_per_unit
                   END as current_price
            FROM cart_items ci
            LEFT JOIN pesticides p ON ci.product_id = p.id AND ci.product_type = 'pesticide'
            LEFT JOIN fertilizers f ON ci.product_id = f.id AND ci.product_type = 'fertilizer'
            WHERE ci.cart_id = %s
        """
        
        items = db.fetch_query(query, (cart_id,))
        cart_items = []
        
        for item in items:
            cart_items.append({
                'id': item[0],
                'product_type': item[1],
                'product_id': item[2],
                'quantity': item[3],
                'price': float(item[4]) if item[4] else float(item[6]) * item[3],
                'name': item[5],
                'current_price': float(item[6]) if item[6] else 0
            })
        
        return jsonify({'cart_items': cart_items}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.disconnect()

@app.route('/api/farmer/cart', methods=['POST'])
@login_required
def add_to_cart():
    """Add item to cart"""
    if session.get('user_type') != 'farmer':
        return jsonify({'error': 'Unauthorized'}), 403
    
    user_id = session.get('user_id')
    db = get_db()
    
    try:
        data = request.json
        product_id = data.get('product_id')
        product_type = data.get('product_type')
        quantity = data.get('quantity', 1)
        
        if not product_id or not product_type:
            return jsonify({'error': 'Product ID and type required'}), 400
        
        # Get farmer ID
        farmer = db.fetch_one("SELECT id FROM farmers WHERE user_id = %s", (user_id,))
        if not farmer:
            return jsonify({'error': 'Farmer profile not found'}), 404
        
        farmer_id = farmer[0]
        
        # Get or create cart
        cart = db.fetch_one("SELECT id FROM carts WHERE farmer_id = %s", (farmer_id,))
        if not cart:
            db.execute_query("INSERT INTO carts (farmer_id) VALUES (%s)", (farmer_id,))
            cart = db.fetch_one("SELECT id FROM carts WHERE farmer_id = %s", (farmer_id,))
        
        cart_id = cart[0]
        
        # Get product price
        if product_type == 'pesticide':
            product = db.fetch_one("SELECT price_per_unit FROM pesticides WHERE id = %s", (product_id,))
        else:
            product = db.fetch_one("SELECT price_per_unit FROM fertilizers WHERE id = %s", (product_id,))
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        price_per_unit = float(product[0])
        total_price = price_per_unit * quantity
        
        # Check if item already in cart
        existing = db.fetch_one(
            "SELECT id, quantity FROM cart_items WHERE cart_id = %s AND product_id = %s AND product_type = %s",
            (cart_id, product_id, product_type)
        )
        
        if existing:
            # Update quantity
            new_quantity = existing[1] + quantity
            new_price = price_per_unit * new_quantity
            db.execute_query(
                "UPDATE cart_items SET quantity = %s, price_at_purchase = %s WHERE id = %s",
                (new_quantity, new_price, existing[0])
            )
        else:
            # Add new item
            db.execute_query(
                """INSERT INTO cart_items (cart_id, product_type, product_id, quantity, price_at_purchase)
                   VALUES (%s, %s, %s, %s, %s)""",
                (cart_id, product_type, product_id, quantity, total_price)
            )
        
        return jsonify({'success': True, 'message': 'Item added to cart'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.disconnect()

@app.route('/api/farmer/cart/<int:item_id>', methods=['DELETE'])
@login_required
def remove_from_cart(item_id):
    """Remove item from cart"""
    if session.get('user_type') != 'farmer':
        return jsonify({'error': 'Unauthorized'}), 403
    
    user_id = session.get('user_id')
    db = get_db()
    
    try:
        # Get farmer ID
        farmer = db.fetch_one("SELECT id FROM farmers WHERE user_id = %s", (user_id,))
        if not farmer:
            return jsonify({'error': 'Farmer profile not found'}), 404
        
        farmer_id = farmer[0]
        
        # Get cart
        cart = db.fetch_one("SELECT id FROM carts WHERE farmer_id = %s", (farmer_id,))
        if not cart:
            return jsonify({'error': 'Cart not found'}), 404
        
        cart_id = cart[0]
        
        # Delete item
        db.execute_query("DELETE FROM cart_items WHERE id = %s AND cart_id = %s", (item_id, cart_id))
        
        return jsonify({'success': True, 'message': 'Item removed from cart'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.disconnect()

@app.route('/api/farmer/stats', methods=['GET'])
@login_required
def get_farmer_stats():
    """Get farmer's statistics including total spent"""
    if session.get('user_type') != 'farmer':
        return jsonify({'error': 'Unauthorized'}), 403
    
    user_id = session.get('user_id')
    db = get_db()
    
    try:
        # Get farmer ID
        farmer = db.fetch_one("SELECT id FROM farmers WHERE user_id = %s", (user_id,))
        if not farmer:
            return jsonify({'error': 'Farmer profile not found'}), 404
        
        farmer_id = farmer[0]
        
        # Get total spent from completed orders
        total_spent_result = db.fetch_one("""
            SELECT COALESCE(SUM(total_amount), 0) as total_spent
            FROM orders
            WHERE farmer_id = %s AND status IN ('delivered', 'processing', 'shipped')
        """, (farmer_id,))
        
        total_spent = float(total_spent_result[0]) if total_spent_result else 0.0
        
        # Get cart count
        cart = db.fetch_one("SELECT id FROM carts WHERE farmer_id = %s", (farmer_id,))
        cart_count = 0
        if cart:
            cart_id = cart[0]
            cart_count_result = db.fetch_one("SELECT COUNT(*) FROM cart_items WHERE cart_id = %s", (cart_id,))
            cart_count = cart_count_result[0] if cart_count_result else 0
        
        # Get disease scan count
        scan_count_result = db.fetch_one("SELECT COUNT(*) FROM prediction_history WHERE farmer_id = %s", (farmer_id,))
        scan_count = scan_count_result[0] if scan_count_result else 0
        
        # Get last scan date
        last_scan = db.fetch_one("SELECT MAX(prediction_date) FROM prediction_history WHERE farmer_id = %s", (farmer_id,))
        last_scan_date = last_scan[0].strftime('%d/%m/%Y') if last_scan and last_scan[0] else None
        
        return jsonify({
            'total_spent': total_spent,
            'cart_count': cart_count,
            'scan_count': scan_count,
            'last_scan_date': last_scan_date
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.disconnect()

@app.route('/api/farmer/checkout', methods=['POST'])
@login_required
def checkout_cart():
    """Checkout cart and create order"""
    if session.get('user_type') != 'farmer':
        return jsonify({'error': 'Unauthorized'}), 403
    
    user_id = session.get('user_id')
    db = get_db()
    
    try:
        # Get farmer ID and address
        farmer = db.fetch_one("""
            SELECT id, address, city
            FROM farmers
            WHERE user_id = %s
        """, (user_id,))
        
        if not farmer:
            return jsonify({'error': 'Farmer profile not found'}), 404
        
        farmer_id = farmer[0]
        farmer_address = farmer[1] or 'Address not provided'
        farmer_city = farmer[2] or 'City not provided'
        
        # Get cart
        cart = db.fetch_one("SELECT id FROM carts WHERE farmer_id = %s", (farmer_id,))
        if not cart:
            return jsonify({'error': 'Cart not found'}), 404
        
        cart_id = cart[0]
        
        # Get cart items
        cart_items = db.fetch_query("""
            SELECT ci.id, ci.product_type, ci.product_id, ci.quantity, ci.price_at_purchase,
                   CASE 
                       WHEN ci.product_type = 'pesticide' THEN p.price_per_unit
                       WHEN ci.product_type = 'fertilizer' THEN f.price_per_unit
                   END as current_price
            FROM cart_items ci
            LEFT JOIN pesticides p ON ci.product_id = p.id AND ci.product_type = 'pesticide'
            LEFT JOIN fertilizers f ON ci.product_id = f.id AND ci.product_type = 'fertilizer'
            WHERE ci.cart_id = %s
        """, (cart_id,))
        
        if not cart_items or len(cart_items) == 0:
            return jsonify({'error': 'Cart is empty'}), 400
        
        # Calculate total amount
        total_amount = 0
        for item in cart_items:
            price = float(item[4]) if item[4] else float(item[5]) * item[3]
            total_amount += price
        
        # Create order
        db.execute_query("""
            INSERT INTO orders (farmer_id, total_amount, status, delivery_address, delivery_city)
            VALUES (%s, %s, 'processing', %s, %s)
        """, (farmer_id, total_amount, farmer_address, farmer_city))
        
        # Get the created order ID
        order = db.fetch_one("SELECT LAST_INSERT_ID()")
        order_id = order[0]
        
        # Move cart items to order_items
        for item in cart_items:
            price_per_unit = float(item[4]) / item[3] if item[4] else float(item[5])
            total_price = float(item[4]) if item[4] else float(item[5]) * item[3]
            
            db.execute_query("""
                INSERT INTO order_items (order_id, product_type, product_id, quantity, price_per_unit, total_price)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (order_id, item[1], item[2], item[3], price_per_unit, total_price))
        
        # Clear cart items
        db.execute_query("DELETE FROM cart_items WHERE cart_id = %s", (cart_id,))
        
        return jsonify({
            'success': True,
            'message': 'Order placed successfully',
            'order_id': order_id,
            'total_amount': total_amount
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.disconnect()

@app.route('/api/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None
    }), 200

# =====================================================
# RESEARCHER REPORTS API ROUTES
# =====================================================

@app.route('/api/researcher/reports', methods=['GET'])
def get_researcher_reports():
    """Get all reports for the logged-in researcher"""
    if 'user_id' not in session or session.get('user_type') != 'researcher':
        return jsonify({'error': 'Unauthorized'}), 401
    
    db = get_db()
    
    try:
        # Get researcher ID
        researcher = db.fetch_one("SELECT id FROM researchers WHERE user_id = %s", (session['user_id'],))
        
        if not researcher:
            return jsonify({'error': 'Researcher not found'}), 404
        
        researcher_id = researcher[0]
        
        # Get all reports for this researcher
        query = """
            SELECT 
                id,
                title,
                report_type,
                start_date,
                end_date,
                CONCAT(DATE_FORMAT(start_date, '%%b %%d, %%Y'), ' - ', 
                       DATE_FORMAT(end_date, '%%b %%d, %%Y')) as date_range,
                description,
                methodology,
                recommendations,
                created_date
            FROM research_reports
            WHERE researcher_id = %s
            ORDER BY created_date DESC
        """
        
        results = db.fetch_query(query, (researcher_id,))
        
        reports = []
        for row in results:
            reports.append({
                'id': row[0],
                'title': row[1],
                'report_type': row[2],
                'start_date': row[3].isoformat() if row[3] else None,
                'end_date': row[4].isoformat() if row[4] else None,
                'date_range': row[5],
                'description': row[6],
                'methodology': row[7],
                'recommendations': row[8],
                'created_date': row[9].isoformat() if row[9] else None
            })
        
        return jsonify({'reports': reports}), 200
        
    except Exception as e:
        print(f"Error fetching reports: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.disconnect()

@app.route('/api/researcher/reports', methods=['POST'])
def create_researcher_report():
    """Create a new research report"""
    if 'user_id' not in session or session.get('user_type') != 'researcher':
        return jsonify({'error': 'Unauthorized'}), 401
    
    db = get_db()
    
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['title', 'report_type', 'start_date', 'end_date', 'description']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Get researcher ID
        researcher = db.fetch_one("SELECT id FROM researchers WHERE user_id = %s", (session['user_id'],))
        
        if not researcher:
            return jsonify({'error': 'Researcher not found'}), 404
        
        researcher_id = researcher[0]
        
        # Insert report
        query = """
            INSERT INTO research_reports 
            (researcher_id, title, report_type, start_date, end_date, 
             description, methodology, recommendations)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        db.execute_query(query, (
            researcher_id,
            data['title'],
            data['report_type'],
            data['start_date'],
            data['end_date'],
            data['description'],
            data.get('methodology'),
            data.get('recommendations')
        ))
        
        # Get last insert ID
        result = db.fetch_one("SELECT LAST_INSERT_ID()")
        report_id = result[0] if result else None
        
        return jsonify({
            'success': True,
            'report_id': report_id,
            'message': 'Report created successfully'
        }), 201
        
    except Exception as e:
        print(f"Error creating report: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.disconnect()

@app.route('/api/researcher/reports/<int:report_id>', methods=['GET'])
def get_researcher_report(report_id):
    """Get a specific report"""
    if 'user_id' not in session or session.get('user_type') != 'researcher':
        return jsonify({'error': 'Unauthorized'}), 401
    
    db = get_db()
    
    try:
        # Get researcher ID
        researcher = db.fetch_one("SELECT id FROM researchers WHERE user_id = %s", (session['user_id'],))
        
        if not researcher:
            return jsonify({'error': 'Researcher not found'}), 404
        
        researcher_id = researcher[0]
        
        # Get the specific report
        query = """
            SELECT 
                id,
                title,
                report_type,
                start_date,
                end_date,
                description,
                methodology,
                recommendations,
                created_date
            FROM research_reports
            WHERE id = %s AND researcher_id = %s
        """
        
        result = db.fetch_one(query, (report_id, researcher_id))
        
        if not result:
            return jsonify({'error': 'Report not found'}), 404
        
        report = {
            'id': result[0],
            'title': result[1],
            'report_type': result[2],
            'start_date': result[3].isoformat() if result[3] else None,
            'end_date': result[4].isoformat() if result[4] else None,
            'description': result[5],
            'methodology': result[6],
            'recommendations': result[7],
            'created_date': result[8].isoformat() if result[8] else None
        }
        
        return jsonify({'report': report}), 200
        
    except Exception as e:
        print(f"Error fetching report: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.disconnect()

@app.route('/api/researcher/reports/<int:report_id>', methods=['DELETE'])
def delete_researcher_report(report_id):
    """Delete a specific report"""
    if 'user_id' not in session or session.get('user_type') != 'researcher':
        return jsonify({'error': 'Unauthorized'}), 401
    
    db = get_db()
    
    try:
        # Get researcher ID
        researcher = db.fetch_one("SELECT id FROM researchers WHERE user_id = %s", (session['user_id'],))
        
        if not researcher:
            return jsonify({'error': 'Researcher not found'}), 404
        
        researcher_id = researcher[0]
        
        # Delete the report (only if it belongs to this researcher)
        query = "DELETE FROM research_reports WHERE id = %s AND researcher_id = %s"
        db.execute_query(query, (report_id, researcher_id))
        
        # Check if anything was deleted
        check = db.fetch_one("SELECT ROW_COUNT()")
        if check and check[0] == 0:
            return jsonify({'error': 'Report not found or unauthorized'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Report deleted successfully'
        }), 200
        
    except Exception as e:
        print(f"Error deleting report: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.disconnect()

@app.route('/api/researcher/reports/<int:report_id>/download', methods=['GET'])
def download_researcher_report(report_id):
    """Download report as PDF (placeholder for future implementation)"""
    if 'user_id' not in session or session.get('user_type') != 'researcher':
        return jsonify({'error': 'Unauthorized'}), 401
    
    # For now, return an error indicating this feature is coming soon
    return jsonify({
        'error': 'PDF download feature coming soon. Please use the print function.'
    }), 501

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
