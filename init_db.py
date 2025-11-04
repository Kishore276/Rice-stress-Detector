import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_database():
    """Create rice_disease database and initialize tables"""
    
    try:
        # Connect without specifying database
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST', '127.0.0.1'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', 'Kishore@276'),
            port=int(os.getenv('DB_PORT', 3306))
        )
        
        cursor = connection.cursor()
        
        # Create database
        database_name = os.getenv('DB_NAME', 'rice_disease')
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {database_name}")
        print(f"✓ Database '{database_name}' created or already exists")
        
        # Select database
        cursor.execute(f"USE {database_name}")
        
        # Create diseases table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS diseases (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                symptoms VARCHAR(500),
                treatment VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✓ Table 'diseases' created")
        
        # Create predictions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS predictions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                image_filename VARCHAR(255),
                disease_id INT,
                confidence_score FLOAT,
                predicted_class VARCHAR(100),
                prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (disease_id) REFERENCES diseases(id)
            )
        """)
        print("✓ Table 'predictions' created")
        
        # Create users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) NOT NULL UNIQUE,
                email VARCHAR(100) NOT NULL UNIQUE,
                password_hash VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✓ Table 'users' created")
        
        # Insert sample disease data
        sample_diseases = [
            ('Bacterial Blight', 'Bacterial leaf blight is a serious disease affecting rice leaves', 'Brown lesions on leaves with yellow halos', 'Use resistant varieties and copper fungicides'),
            ('Blast', 'Rice blast is a fungal disease affecting leaves, stems, and panicles', 'Diamond-shaped lesions on leaves', 'Apply fungicides and use blast-resistant varieties'),
            ('Brown Spot', 'Brown spot is a fungal disease causing brown spots on leaves', 'Small brown spots with gray centers', 'Improve drainage and use fungicides'),
            ('Tungro', 'Tungro is a viral disease causing yellowing of leaves', 'Yellow to orange discoloration of leaves', 'Control vector insects and use resistant varieties')
        ]
        
        for disease_name, description, symptoms, treatment in sample_diseases:
            cursor.execute("""
                INSERT IGNORE INTO diseases (name, description, symptoms, treatment)
                VALUES (%s, %s, %s, %s)
            """, (disease_name, description, symptoms, treatment))
        
        connection.commit()
        print("✓ Sample disease data inserted")
        
        cursor.close()
        connection.close()
        print("\n✓ Database initialization completed successfully!")
        return True
        
    except Error as e:
        print(f"✗ Error initializing database: {e}")
        return False


if __name__ == "__main__":
    create_database()
