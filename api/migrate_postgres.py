"""
Database migration script for PostgreSQL on Vercel
Run this once to create all tables in your PostgreSQL database
"""
import os
from index import app, db

def init_database():
    """Initialize database tables"""
    print("🔄 Starting database migration...")
    print(f"Database URL: {app.config['SQLALCHEMY_DATABASE_URI'][:30]}...")
    

    with app.app_context():
        try:
            # Create all tables
            #changes

            db.create_all()
            print("✅ Database tables created successfully!")
            
            # List created tables
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            print(f"\n📋 Created tables: {', '.join(tables)}")
            
            return True
        except Exception as e:
            print(f"❌ Error creating tables: {e}")
            return False

if __name__ == '__main__':
    success = init_database()
    if success:
        print("\n🎉 Database initialization complete!")
        print("Your Pomovity database is ready to use.")
    else:
        print("\n⚠️  Database initialization failed!")
        print("Please check your DATABASE_URL environment variable.")





