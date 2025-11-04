import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class DatabaseConnection:
    """MySQL database connection class for Rice Disease Detection project"""
    
    def __init__(self, host=None, user=None, password=None, database=None):
        """
        Initialize database connection with provided or environment credentials
        
        Args:
            host (str): MySQL server hostname/IP
            user (str): MySQL username
            password (str): MySQL password
            database (str): Database name
        """
        self.host = host or os.getenv('DB_HOST', '127.0.0.1')
        self.user = user or os.getenv('DB_USER', 'root')
        self.password = password or os.getenv('DB_PASSWORD', 'Kishore@276')
        self.database = database or os.getenv('DB_NAME', 'rice_disease')
        self.port = int(os.getenv('DB_PORT', 3306))
        self.connection = None
        self.cursor = None
    
    def connect(self):
        """Establish connection to MySQL database"""
        try:
            self.connection = mysql.connector.connect(
                host=self.host,
                user=self.user,
                password=self.password,
                database=self.database,
                port=self.port
            )
            
            if self.connection.is_connected():
                db_info = self.connection.get_server_info()
                self.cursor = self.connection.cursor()
                print(f"✓ Successfully connected to MySQL Server version {db_info}")
                print(f"✓ Connected to database: {self.database}")
                return True
        except Error as e:
            print(f"✗ Error while connecting to MySQL: {e}")
            return False
    
    def disconnect(self):
        """Close database connection"""
        if self.connection and self.connection.is_connected():
            if self.cursor:
                self.cursor.close()
            self.connection.close()
            print("✓ MySQL connection closed")
    
    def execute_query(self, query, params=None):
        """Execute a single query"""
        try:
            if params:
                self.cursor.execute(query, params)
            else:
                self.cursor.execute(query)
            self.connection.commit()
            print(f"✓ Query executed successfully")
            return True
        except Error as e:
            print(f"✗ Error executing query: {e}")
            self.connection.rollback()
            return False
    
    def fetch_query(self, query, params=None):
        """Fetch results from a SELECT query"""
        try:
            if params:
                self.cursor.execute(query, params)
            else:
                self.cursor.execute(query)
            return self.cursor.fetchall()
        except Error as e:
            print(f"✗ Error fetching data: {e}")
            return None
    
    def fetch_one(self, query, params=None):
        """Fetch a single row from query result"""
        try:
            if params:
                self.cursor.execute(query, params)
            else:
                self.cursor.execute(query)
            return self.cursor.fetchone()
        except Error as e:
            print(f"✗ Error fetching data: {e}")
            return None


if __name__ == "__main__":
    # Test connection
    db = DatabaseConnection()
    if db.connect():
        print("\n✓ Database connection test successful!")
        db.disconnect()
    else:
        print("\n✗ Database connection test failed!")
