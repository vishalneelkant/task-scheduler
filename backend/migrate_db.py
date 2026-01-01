"""
Database migration script to add recurring task fields to existing database.
This script safely adds new columns to the Task table without losing existing data.
"""
import sqlite3
import os

DB_PATH = 'instance/tasks.db'

def migrate_database():
    """Add new columns for recurring tasks to the Task table"""
    if not os.path.exists(DB_PATH):
        print("Database doesn't exist. It will be created automatically when you run app.py")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if columns already exist
    cursor.execute("PRAGMA table_info(task)")
    columns = [column[1] for column in cursor.fetchall()]
    
    migrations_needed = []
    
    if 'is_recurring' not in columns:
        migrations_needed.append("ALTER TABLE task ADD COLUMN is_recurring BOOLEAN DEFAULT 0")
    
    if 'recurrence_type' not in columns:
        migrations_needed.append("ALTER TABLE task ADD COLUMN recurrence_type VARCHAR(20)")
    
    if 'recurrence_days' not in columns:
        migrations_needed.append("ALTER TABLE task ADD COLUMN recurrence_days VARCHAR(50)")
    
    if 'recurring_parent_id' not in columns:
        migrations_needed.append("ALTER TABLE task ADD COLUMN recurring_parent_id INTEGER")
    
    if migrations_needed:
        print(f"Applying {len(migrations_needed)} migrations...")
        for migration in migrations_needed:
            try:
                cursor.execute(migration)
                print(f"✓ Applied: {migration}")
            except sqlite3.Error as e:
                print(f"✗ Error applying migration: {e}")
                conn.rollback()
                conn.close()
                return False
        
        conn.commit()
        print("✓ All migrations applied successfully!")
    else:
        print("✓ Database is already up to date. No migrations needed.")
    
    conn.close()
    return True

if __name__ == '__main__':
    print("Starting database migration...")
    print(f"Database path: {DB_PATH}")
    print("-" * 50)
    
    if migrate_database():
        print("-" * 50)
        print("Migration completed successfully!")
        print("You can now restart your Flask application.")
    else:
        print("-" * 50)
        print("Migration failed. Please check the errors above.")

