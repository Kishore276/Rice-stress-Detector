-- =====================================================
-- Rice Stress Detector - Complete Database Schema
-- =====================================================

-- CREATE DATABASE AND SELECT IT
DROP DATABASE IF EXISTS rice_disease;
CREATE DATABASE rice_disease;
USE rice_disease;

-- 1. USERS TABLE (Base table for all users)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    user_type ENUM('farmer', 'researcher') NOT NULL,
    whatsapp_number VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. FARMERS TABLE
CREATE TABLE IF NOT EXISTS farmers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    postal_code VARCHAR(10),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    farm_size DECIMAL(10, 2),
    farm_area_unit ENUM('hectares', 'acres', 'sq_meters') DEFAULT 'hectares',
    total_spent_on_products DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. RESEARCHERS TABLE
CREATE TABLE IF NOT EXISTS researchers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    organization VARCHAR(200),
    department VARCHAR(100),
    research_focus VARCHAR(500),
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. DISEASES TABLE
CREATE TABLE IF NOT EXISTS diseases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    symptoms VARCHAR(500),
    treatment VARCHAR(500),
    prevention_methods TEXT,
    severity_level ENUM('low', 'medium', 'high') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. PESTICIDES TABLE
CREATE TABLE IF NOT EXISTS pesticides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    type VARCHAR(50),
    price_per_unit DECIMAL(10, 2) NOT NULL,
    unit_type ENUM('ml', 'liters', 'kg', 'grams', 'tablets', 'pieces') NOT NULL,
    quantity_per_pack INT DEFAULT 1,
    stock_quantity INT DEFAULT 0,
    effectiveness_percentage INT,
    target_diseases VARCHAR(500),
    instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6. FERTILIZERS TABLE
CREATE TABLE IF NOT EXISTS fertilizers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    type ENUM('organic', 'inorganic', 'mixed') NOT NULL,
    price_per_unit DECIMAL(10, 2) NOT NULL,
    unit_type ENUM('ml', 'liters', 'kg', 'grams', 'tablets', 'pieces') NOT NULL,
    quantity_per_pack INT DEFAULT 1,
    stock_quantity INT DEFAULT 0,
    nitrogen_percentage DECIMAL(5, 2),
    phosphorus_percentage DECIMAL(5, 2),
    potassium_percentage DECIMAL(5, 2),
    application_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 7. RESEARCH LABS TABLE
CREATE TABLE IF NOT EXISTS research_labs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    address TEXT NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50),
    postal_code VARCHAR(10),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    email VARCHAR(100),
    whatsapp_number VARCHAR(20),
    phone_number VARCHAR(20),
    website VARCHAR(200),
    specialization VARCHAR(500),
    facilities_available TEXT,
    head_of_lab VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 8. PESTICIDE/FERTILIZER SHOPS TABLE
CREATE TABLE IF NOT EXISTS shops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    shop_type ENUM('pesticides', 'fertilizers', 'both') NOT NULL DEFAULT 'both',
    address TEXT NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50),
    postal_code VARCHAR(10),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    email VARCHAR(100),
    whatsapp_number VARCHAR(20),
    phone_number VARCHAR(20),
    opening_time TIME,
    closing_time TIME,
    rating DECIMAL(3, 2),
    total_reviews INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 9. SHOP PRODUCTS TABLE (Junction table for shops and products)
CREATE TABLE IF NOT EXISTS shop_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shop_id INT NOT NULL,
    product_type ENUM('pesticide', 'fertilizer') NOT NULL,
    product_id INT NOT NULL,
    in_stock BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    UNIQUE KEY unique_shop_product (shop_id, product_type, product_id)
);

-- 10. PREDICTIONS/DISEASE DETECTION HISTORY TABLE
CREATE TABLE IF NOT EXISTS prediction_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT NOT NULL,
    image_filename VARCHAR(255) NOT NULL,
    image_path VARCHAR(500),
    disease_detected VARCHAR(100),
    disease_id INT,
    confidence_score DECIMAL(5, 2),
    model_version VARCHAR(50),
    result_json LONGTEXT,
    prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
    FOREIGN KEY (disease_id) REFERENCES diseases(id) ON DELETE SET NULL
);

-- 11. CART TABLE
CREATE TABLE IF NOT EXISTS carts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
);

-- 12. CART ITEMS TABLE
CREATE TABLE IF NOT EXISTS cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    product_type ENUM('pesticide', 'fertilizer') NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price_at_purchase DECIMAL(10, 2),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE
);

-- 13. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    delivery_address TEXT,
    delivery_city VARCHAR(50),
    delivery_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
);

-- 14. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_type ENUM('pesticide', 'fertilizer') NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price_per_unit DECIMAL(10, 2),
    total_price DECIMAL(12, 2),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 15. RESEARCH REPORTS TABLE
CREATE TABLE IF NOT EXISTS research_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    researcher_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    file_path VARCHAR(500),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (researcher_id) REFERENCES researchers(id) ON DELETE CASCADE
);

-- =====================================================
-- SAMPLE DATA INSERTION
-- =====================================================

-- Insert Diseases
INSERT INTO diseases (name, description, symptoms, treatment, prevention_methods, severity_level) VALUES
('Bacterial Blight', 'Bacterial leaf blight caused by Xanthomonas oryzae pv. oryzae', 'Brown lesions with yellow halos on leaves, watery appearance', 'Use copper fungicides, resistant varieties, proper sanitation', 'Use resistant varieties, improve water management, remove infected plants', 'high'),
('Blast', 'Rice blast caused by Magnaporthe grisea fungus', 'Diamond-shaped lesions on leaves and stems, can affect panicles', 'Apply fungicides like Tricyclazole, use blast-resistant varieties', 'Use resistant varieties, proper fertilization, avoid excess nitrogen', 'high'),
('Brown Spot', 'Brown spot disease caused by Bipolaris oryzae', 'Small brown spots with gray centers on leaves and grains', 'Improve drainage, use fungicides, resistant varieties', 'Use quality seeds, improve soil fertility, proper water drainage', 'medium'),
('Tungro', 'Viral disease transmitted by leafhopper insects', 'Yellow to orange discoloration, stunted growth, twisted leaves', 'Control vector insects, use insecticides, resistant varieties', 'Use resistant varieties, control insect vectors, rogueing', 'high'),
('Sheath Rot', 'Fungal disease affecting leaf sheath', 'Rot symptoms on leaf sheath, spotting on panicles', 'Use fungicides, improve air circulation', 'Proper spacing, improve drainage, crop rotation', 'low'),
('False Smut', 'Fungal disease affecting panicles', 'Green to yellow spore balls on panicles', 'Use resistant varieties, fungicide application at boot stage', 'Use resistant varieties, proper fertilization', 'medium');

-- Insert Pesticides
INSERT INTO pesticides (name, description, type, price_per_unit, unit_type, quantity_per_pack, stock_quantity, effectiveness_percentage, target_diseases, instructions) VALUES
('Tricyclazole', 'Broad spectrum fungicide for rice blast control', 'Fungicide', 450.00, 'ml', 100, 250, 95, 'Blast, Brown Spot', 'Spray 2-3 times during growing season, mix 1 bottle per 15 liters water'),
('Copper Sulphate', 'Effective against bacterial diseases', 'Bactericide', 150.00, 'kg', 1, 100, 85, 'Bacterial Blight', 'Apply as 1% solution, repeat after 15 days'),
('Imidacloprid', 'Systemic insecticide for leafhopper control', 'Insecticide', 320.00, 'ml', 50, 150, 90, 'Tungro Vector Control', 'Dilute 1ml per liter, spray early morning'),
('Neem Oil', 'Organic pesticide for general pest control', 'Bio-pesticide', 200.00, 'liters', 1, 80, 70, 'Multiple Pests', 'Mix 5% with water, spray every 10 days'),
('Chlorothalonil', 'Broad-spectrum fungicide', 'Fungicide', 280.00, 'liters', 1, 120, 88, 'Blast, Brown Spot, Sheath Rot', 'Spray 2-3 times, 2.5ml per liter water'),
('Bacillus Subtilis', 'Biological fungicide', 'Bio-fungicide', 400.00, 'kg', 1, 90, 75, 'Multiple Fungal Diseases', 'Mix 10-15kg per hectare in soil');

-- Insert Fertilizers
INSERT INTO fertilizers (name, description, type, price_per_unit, unit_type, quantity_per_pack, stock_quantity, nitrogen_percentage, phosphorus_percentage, potassium_percentage, application_instructions) VALUES
('Urea (46-0-0)', 'High nitrogen fertilizer for vegetative growth', 'inorganic', 250.00, 'kg', 50, 500, 46, 0, 0, 'Apply 100-150 kg/hectare in 2-3 splits during growing season'),
('DAP (18-46-0)', 'Di-ammonium phosphate for initial growth', 'inorganic', 450.00, 'kg', 50, 300, 18, 46, 0, 'Apply 50-100 kg/hectare at sowing time'),
('NPK (10-10-10)', 'Balanced fertilizer for overall growth', 'inorganic', 350.00, 'kg', 50, 400, 10, 10, 10, 'Apply 150-200 kg/hectare, can be split into 2-3 doses'),
('Potash (0-0-60)', 'Potassium fertilizer for crop maturity', 'inorganic', 300.00, 'kg', 50, 250, 0, 0, 60, 'Apply 40-50 kg/hectare at boot/grain filling stage'),
('Vermicompost', 'Organic compost rich in nutrients', 'organic', 150.00, 'kg', 25, 200, 1.5, 1.2, 0.8, 'Mix 5-10 tons per hectare before sowing'),
('Bone Meal', 'Organic phosphate source', 'organic', 400.00, 'kg', 10, 150, 2, 24, 0, 'Apply 500kg per hectare as basal fertilizer'),
('Seaweed Extract', 'Bio-stimulant with micronutrients', 'organic', 350.00, 'liters', 1, 100, 0.5, 0.5, 2, 'Spray 500ml per hectare or 5ml per liter water');

-- Insert Research Labs
INSERT INTO research_labs (name, description, address, city, state, postal_code, latitude, longitude, email, whatsapp_number, phone_number, website, specialization, facilities_available, head_of_lab) VALUES
('Central Rice Research Institute', 'Government research institute for rice studies', 'Cuttack Road, Cuttack', 'Cuttack', 'Odisha', '753006', 20.4489, 85.9389, 'info@crri.in', '+919876543210', '0671-2612338', 'www.crri.in', 'Rice disease management, crop improvement', 'Laboratory, Field trials, Germplasm bank', 'Dr. RK Mohanty'),
('IARI Delhi', 'Indian Agricultural Research Institute', 'New Delhi', 'New Delhi', 'Delhi', '110012', 28.6123, 77.2055, 'contact@iari.in', '+919876543211', '011-2584-6565', 'www.iari.in', 'Rice breeding, pest management', 'Advanced lab, Greenhouse, Research farm', 'Dr. Girish Chandra'),
('Tamil Nadu Rice Research Institute', 'State institute for rice research', 'Aduthurai', 'Tiruvannamalai', 'Tamil Nadu', '606101', 11.8289, 79.3012, 'info@tnrri.in', '+919876543212', '04177-242224', 'www.tnrri.in', 'Rice diseases, agronomy', 'Molecular lab, Field station', 'Dr. MS Ranganathan'),
('Punjab Agricultural University', 'Multi-crop research facility', 'Ludhiana', 'Ludhiana', 'Punjab', '141004', 30.9010, 75.8573, 'info@pau.edu', '+919876543213', '0161-2401960', 'www.pau.edu', 'Rice disease monitoring, IPM', 'State-of-art facilities', 'Dr. Harpreet Singh'),
('UP Rice Research Centre', 'Uttar Pradesh Rice Research', 'Varanasi', 'Varanasi', 'Uttar Pradesh', '221005', 25.3176, 82.9789, 'info@uprrc.in', '+919876543214', '0542-2503019', 'www.uprrc.in', 'Rice improvement, disease diagnosis', 'Diagnostic lab, Field trials', 'Dr. Rajesh Kumar');

-- Insert Shops
INSERT INTO shops (name, shop_type, address, city, state, postal_code, latitude, longitude, email, whatsapp_number, phone_number, opening_time, closing_time, rating, total_reviews) VALUES
('Green Valley Agro Mart', 'both', '123 Market Street', 'Cuttack', 'Odisha', '753001', 20.4489, 85.9389, 'contact@greenvalley.in', '+919876543220', '0671-2234567', '08:00:00', '20:00:00', 4.5, 127),
('Pesticide Paradise', 'pesticides', '45 Industrial Area', 'Cuttack', 'Odisha', '753010', 20.4500, 85.9400, 'info@pesticideparadise.in', '+919876543221', '0671-2345678', '07:00:00', '21:00:00', 4.2, 89),
('Organic Farmers Store', 'both', '67 Ring Road', 'Cuttack', 'Odisha', '753002', 20.4495, 85.9385, 'support@organicfarmers.in', '+919876543222', '0671-2456789', '09:00:00', '19:00:00', 4.7, 156),
('Metro Agri Shop', 'both', '89 New Market', 'Odisha', 'Odisha', '753005', 20.4520, 85.9410, 'contact@metroagri.in', '+919876543223', '0671-2567890', '08:30:00', '20:30:00', 4.3, 98),
('Premium Farm Supplies', 'both', '12 Commerce Street', 'Cuttack', 'Odisha', '753009', 20.4475, 85.9375, 'info@premiumfarm.in', '+919876543224', '0671-2678901', '07:30:00', '20:00:00', 4.6, 142);

-- =====================================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- =====================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_farmers_user_id ON farmers(user_id);
CREATE INDEX idx_researchers_user_id ON researchers(user_id);
CREATE INDEX idx_prediction_history_farmer_id ON prediction_history(farmer_id);
CREATE INDEX idx_prediction_history_disease_id ON prediction_history(disease_id);
CREATE INDEX idx_research_labs_city ON research_labs(city);
CREATE INDEX idx_shops_city ON shops(city);
CREATE INDEX idx_carts_farmer_id ON carts(farmer_id);
CREATE INDEX idx_orders_farmer_id ON orders(farmer_id);

-- =====================================================
-- SAMPLE USER DATA (Passwords should be hashed in real application)
-- =====================================================

-- NOTE: In production, passwords must be hashed using bcrypt or similar
-- These are sample plain text entries - NEVER use in production!
INSERT INTO users (username, email, password_hash, user_type, whatsapp_number) VALUES
('farmer1', 'farmer1@example.com', 'hashed_password_here', 'farmer', '9876543210'),
('farmer2', 'farmer2@example.com', 'hashed_password_here', 'farmer', '9876543211'),
('farmer3', 'farmer3@example.com', 'hashed_password_here', 'farmer', '9876543212'),
('researcher1', 'researcher1@example.com', 'hashed_password_here', 'researcher', '9876543213'),
('researcher2', 'researcher2@example.com', 'hashed_password_here', 'researcher', '9876543214');

-- Insert Farmers (Link to users)
INSERT INTO farmers (user_id, full_name, phone_number, address, city, state, postal_code, latitude, longitude, farm_size) VALUES
(1, 'Ramakrishnan', '9876543210', 'Village Farm Area, Main Road', 'Cuttack', 'Odisha', '753001', 20.4489, 85.9389, 5.5),
(2, 'Prabhakaran', '9876543211', 'Agricultural Lane, District Center', 'Cuttack', 'Odisha', '753002', 20.4500, 85.9400, 3.2),
(3, 'Suresh Kumar', '9876543212', 'Farmland Area, Ring Road', 'Cuttack', 'Odisha', '753005', 20.4495, 85.9385, 4.8);

-- Insert Researchers (Link to users)
INSERT INTO researchers (user_id, full_name, organization, department, research_focus, phone_number) VALUES
(4, 'Dr. Arjun Singh', 'Central Rice Research Institute', 'Plant Pathology', 'Rice disease management and control', '0671-2612338'),
(5, 'Dr. Meera Sharma', 'Tamil Nadu Rice Research Institute', 'Agronomy', 'Crop improvement and sustainable farming', '04177-242224');

-- =====================================================
-- USEFUL QUERIES FOR REFERENCE
-- =====================================================

-- Get all farmers with their contact details
-- SELECT f.*, u.email, u.whatsapp_number FROM farmers f JOIN users u ON f.user_id = u.id;

-- Get farmer's disease detection history
-- SELECT ph.*, d.name as disease_name FROM prediction_history ph LEFT JOIN diseases d ON ph.disease_id = d.id WHERE ph.farmer_id = 1;

-- Get all research labs in a specific city
-- SELECT * FROM research_labs WHERE city = 'Cuttack';

-- Get pesticide shops within radius of a location (requires distance calculation)
-- SELECT * FROM shops WHERE shop_type IN ('pesticides', 'both') AND SQRT(POW(latitude - ?, 2) + POW(longitude - ?, 2)) * 111 <= ?;

-- Get top-rated shops
-- SELECT * FROM shops ORDER BY rating DESC LIMIT 5;

-- Get farmer's cart items
-- SELECT ci.*, p.name as product_name, p.price_per_unit FROM cart_items ci LEFT JOIN pesticides p ON ci.product_id = p.id AND ci.product_type = 'pesticide' WHERE ci.cart_id IN (SELECT id FROM carts WHERE farmer_id = 1);
