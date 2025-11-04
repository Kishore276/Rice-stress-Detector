# 🌾 Rice Stress Detector - Complete System Documentation

## 📋 Project Overview

Rice Stress Detector is a comprehensive web-based platform designed to help farmers detect rice diseases through AI-powered image recognition and connect them with research institutions, pesticide suppliers, and farming resources.

**Key Features:**
- 🔬 Disease Detection using Deep Learning
- 👨‍🌾 Farmer Dashboard with cart system
- 🔬 Researcher Dashboard with analytics
- 📍 Location-based Shop Finder (using OpenStreetMap/Leaflet)
- 🏥 Research Labs Directory
- 💊 Pesticide & Fertilizer E-commerce
- 📊 Real-time Analytics & Reports
- 🗄️ MySQL Database Integration

---

## 🏗️ Project Structure

```
cap/
├── code.sql                          # Complete SQL schema
├── db_connect.py                     # Database connection handler
├── init_db.py                        # Database initialization script
├── requirements.txt                  # Python dependencies
├── .env                              # Environment variables
├── .gitignore                        # Git ignore file
├── app_auth.py                       # Flask app with authentication
├── train_model.py                    # Model training script
├── models/
│   ├── rice_disease_model.h5         # Trained model
│   └── class_indices.json            # Class mapping
├── uploads/                          # User uploaded images
├── website/
│   ├── index.html                    # Main page
│   ├── login.html                    # Login/Registration
│   ├── farmer_dashboard.html         # Farmer interface
│   ├── researcher_dashboard.html     # Researcher interface
│   ├── css/
│   │   ├── auth.css                  # Login page styles
│   │   ├── dashboard.css             # Dashboard styles
│   │   ├── farmer-dashboard.css      # Farmer specific styles
│   │   └── researcher-dashboard.css  # Researcher specific styles
│   └── js/
│       ├── auth.js                   # Authentication logic
│       ├── farmer-dashboard.js       # Farmer functionality
│       └── researcher-dashboard.js   # Researcher functionality
```

---

## 🗄️ Database Schema

### Tables Created:

1. **users** - Base user table
   - id, username, email, password_hash, user_type, whatsapp_number

2. **farmers** - Farmer profiles
   - id, user_id, full_name, phone_number, address, city, state, latitude, longitude, farm_size

3. **researchers** - Researcher profiles
   - id, user_id, full_name, organization, department, research_focus

4. **diseases** - Disease information
   - id, name, description, symptoms, treatment, prevention_methods, severity_level

5. **pesticides** - Pesticide inventory
   - id, name, type, price_per_unit, unit_type, stock_quantity, effectiveness_percentage

6. **fertilizers** - Fertilizer inventory
   - id, name, type, price_per_unit, unit_type, stock_quantity, NPK values

7. **research_labs** - Research institutions
   - id, name, address, city, latitude, longitude, email, whatsapp_number, specialization

8. **shops** - Pesticide & Fertilizer shops
   - id, name, shop_type, address, city, latitude, longitude, rating

9. **prediction_history** - Disease detection records
   - id, farmer_id, image_filename, disease_detected, disease_id, confidence_score

10. **carts** - Shopping carts
    - id, farmer_id

11. **cart_items** - Cart item details
    - id, cart_id, product_type, product_id, quantity

12. **orders** - Order records
    - id, farmer_id, total_amount, status

13. **order_items** - Order item details
    - id, order_id, product_type, product_id, quantity, price

---

## 🔧 Installation & Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Database

**Edit `.env` file:**
```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Kishore@276
DB_NAME=rice_disease
FLASK_ENV=development
```

### 3. Copy SQL Code to MySQL Workbench

1. Open `code.sql`
2. Copy entire content
3. Paste in MySQL Workbench
4. Execute to create database and tables

**OR** Run initialization script:

```bash
python init_db.py
```

### 4. Verify Database Connection

```bash
python db_connect.py
```

**Expected Output:**
```
✓ Successfully connected to MySQL Server version 9.4.0
✓ Connected to database: rice_disease
✓ Database connection test successful!
```

---

## 🚀 Running the Application

### Start Flask Application

```bash
python app_auth.py
```

Server starts at: **http://localhost:5000**

### Access Application

- **Login Page**: http://localhost:5000/login
- **Farmer Dashboard**: http://localhost:5000/farmer-dashboard
- **Researcher Dashboard**: http://localhost:5000/researcher-dashboard

---

## 👥 User Types & Features

### 👨‍🌾 Farmer Login

**Registration Required:**
- Username, Email, Password
- WhatsApp Number, Phone Number
- Full Name, Address, City, State
- Farm Size (hectares)

**Features Available:**
1. **Disease Detection**
   - Upload rice leaf photo
   - AI detects disease with confidence score
   - Get treatment recommendations
   - Auto-logged to database

2. **Disease History**
   - View all previous detections
   - Browse detection images
   - Track disease patterns

3. **Shop Products**
   - Browse pesticides and fertilizers
   - Filter by type
   - Add to cart
   - View prices and stock

4. **Research Labs Directory**
   - View all research institutions
   - Contact details (Email, WhatsApp, Phone)
   - Specialization information
   - Location details

5. **Find Shops (Map)**
   - Interactive map using Leaflet/OpenStreetMap
   - Adjustable radius (1-50 km)
   - View shops within radius
   - Distance calculation
   - Call/WhatsApp contact buttons
   - Shop ratings and timing

6. **Shopping Cart**
   - Add/Remove products
   - Adjust quantities
   - Calculate total
   - Checkout process

### 🔬 Researcher Login

**Registration Required:**
- Username, Email, Password
- WhatsApp Number, Phone Number
- Full Name, Organization, Department
- Research Focus

**Features Available:**
1. **Dashboard Stats**
   - Total farmers in network
   - Disease scans count
   - Total farm area
   - Unique diseases detected

2. **Farmers Directory**
   - View all registered farmers
   - Search by name, city, email
   - Filter by city
   - Contact farmers
   - Pagination (10 items/page)

3. **Statistics & Analytics**
   - Disease distribution chart
   - Regional analysis
   - Disease trends over time
   - Top affected cities
   - Charts.js integration

4. **Reports**
   - Pre-built reports:
     - Disease Prevalence Report
     - Farmer Demographics Report
     - Seasonal Analysis Report
     - Treatment Success Rate Report
   - Custom report generation:
     - Select report type
     - Choose date range
     - Download as document

---

## 📡 API Endpoints

### Authentication
- `POST /login` - User login
- `POST /register` - User registration
- `GET /logout` - User logout

### Farmer APIs
- `GET /api/farmer/profile` - Get farmer profile
- `GET /api/farmer/prediction-history` - Get disease detection history
- `GET /api/farmer/research-labs` - Get all research labs
- `GET /api/farmer/products` - Get products (pesticides/fertilizers)
- `GET /api/farmer/shops` - Get shops within radius
- `POST /api/predict` - Predict disease from image

### Researcher APIs
- `GET /api/researcher/farmers` - Get all farmers

### General
- `GET /api/health` - Health check

---

## 🗺️ Map Integration (OpenStreetMap/Leaflet)

### Features:
- Real-time map rendering
- Farmer location marker (Blue)
- Pesticide shop markers (Red)
- Fertilizer shop markers (Green)
- Mixed shop markers (Orange)
- Radius selection slider (1-50 km)
- Distance calculation from farmer location
- Click markers for shop details

### Libraries Used:
- **Leaflet.js** - Map rendering
- **OpenStreetMap** - Map tiles
- **Haversine Formula** - Distance calculation

---

## 💾 Database Features

### Sample Data Included:
- 6 diseases with full information
- 6 pesticides with prices and specifications
- 7 fertilizers with NPK values
- 5 research labs with contact details
- 5 pesticide/fertilizer shops with locations
- 3 sample farmers
- 2 sample researchers

### Indexes for Performance:
- User email and type
- Farmer and researcher user IDs
- Prediction history queries
- Research labs and shops location queries
- Cart farmer references

---

## 🔐 Security Features

### Authentication:
- SHA256 password hashing
- Session-based authentication
- Login required decorators for protected routes
- CORS enabled for API security

### Best Practices:
- Environment variables for credentials
- Database connection pooling
- Input validation on forms
- SQL injection prevention (parameterized queries)
- HTTPS ready (can be enabled in production)

---

## 📊 Database Queries Reference

### Get farmer's disease history:
```sql
SELECT ph.*, d.name as disease_name 
FROM prediction_history ph 
LEFT JOIN diseases d ON ph.disease_id = d.id 
WHERE ph.farmer_id = ?;
```

### Get shops within radius:
```sql
SELECT * FROM shops 
WHERE SQRT(POW(latitude - ?, 2) + POW(longitude - ?, 2)) * 111 <= ? 
ORDER BY rating DESC;
```

### Get all farmers by city:
```sql
SELECT f.*, u.email, u.whatsapp_number 
FROM farmers f 
JOIN users u ON f.user_id = u.id 
WHERE f.city = ? 
ORDER BY f.created_at DESC;
```

### Get disease statistics:
```sql
SELECT d.name, COUNT(ph.id) as count 
FROM diseases d 
LEFT JOIN prediction_history ph ON d.id = ph.disease_id 
GROUP BY d.id, d.name 
ORDER BY count DESC;
```

---

## 🎨 UI/UX Features

### Login Page:
- Two user type selection (Farmer/Researcher)
- Gradient background
- Smooth animations
- Form validation with alerts
- Responsive design

### Dashboard:
- Sticky navigation bar
- Section-based layout
- Stats cards with hover effects
- Quick action buttons
- Alert notifications
- Responsive grid layout

### Farmer Dashboard:
- Disease detection with image preview
- Filter products by type
- Interactive map with Leaflet
- Cart management
- Search and pagination for history
- Lab contact links

### Researcher Dashboard:
- Searchable farmer list with filters
- Multiple chart types (Chart.js)
- Statistics dashboard
- Report generation interface
- Pagination

---

## 🐛 Troubleshooting

### Database Connection Issues:
```
Error: Unknown database 'rice_disease'
Solution: Run init_db.py or execute code.sql
```

### Port Already in Use:
```bash
# Change port in app_auth.py:
app.run(debug=True, host='0.0.0.0', port=5001)  # Use different port
```

### Image Upload Issues:
- Check `uploads/` folder exists
- Verify write permissions
- Ensure allowed file types (PNG, JPG, JPEG)

### Map Not Loading:
- Check internet connection for map tiles
- Verify Leaflet.js CDN is accessible
- Check browser console for errors

---

## 📚 Model Information

- **Model**: Rice Disease Detection CNN
- **Framework**: TensorFlow/Keras
- **Classes**: Bacterial Blight, Blast, Brown Spot, Tungro
- **Input Size**: 224x224 pixels
- **Location**: `models/rice_disease_model.h5`

---

## 🚀 Production Deployment

### Before Deploying:
1. Set `FLASK_ENV=production`
2. Change SECRET_KEY in app_auth.py
3. Use HTTPS certificate
4. Enable database backups
5. Configure email for notifications
6. Set up monitoring and logging
7. Use production WSGI server (Gunicorn)

### Recommended Server Setup:
- **Web Server**: Nginx
- **App Server**: Gunicorn
- **Database**: MySQL on separate server
- **Storage**: Cloud storage for images
- **CDN**: CloudFlare for static files

---

## 📞 Support & Contact

For issues or questions:
- Create an issue in GitHub repository
- Contact development team
- Check documentation

---

## 📝 License

This project is proprietary. All rights reserved.

---

## ✨ Future Enhancements

- [ ] Mobile app (React Native/Flutter)
- [ ] Real-time disease alerts
- [ ] WhatsApp Bot integration
- [ ] SMS notifications
- [ ] Video tutorials
- [ ] Farmer training portal
- [ ] Government subsidy information
- [ ] Weather integration
- [ ] Soil health analysis
- [ ] Yield prediction
- [ ] Export data to Excel/PDF
- [ ] Multi-language support

---

**Last Updated**: November 5, 2025  
**Version**: 1.0
