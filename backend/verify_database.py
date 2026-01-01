#!/usr/bin/env python3
"""
Database Verification Script
This script checks the database status and displays information about stored data.
"""

import os
import sqlite3
from datetime import datetime

def main():
    # Get the script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(script_dir, 'instance', 'tasks.db')
    
    print("=" * 60)
    print("DATABASE VERIFICATION")
    print("=" * 60)
    print()
    
    # Check if database exists
    if not os.path.exists(db_path):
        print("❌ Database file not found!")
        print(f"   Expected location: {db_path}")
        print()
        print("The database will be created automatically when you start the server.")
        return
    
    # Get database file info
    file_size = os.path.getsize(db_path)
    file_modified = datetime.fromtimestamp(os.path.getmtime(db_path))
    
    print(f"✅ Database file found")
    print(f"   Location: {db_path}")
    print(f"   Size: {file_size:,} bytes ({file_size / 1024:.2f} KB)")
    print(f"   Last modified: {file_modified.strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Connect to database and get statistics
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get table list
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        
        print("📊 Database Tables:")
        for table in tables:
            print(f"   - {table}")
        print()
        
        # Get user count
        cursor.execute('SELECT COUNT(*) FROM user')
        user_count = cursor.fetchone()[0]
        
        # Get task count
        cursor.execute('SELECT COUNT(*) FROM task')
        task_count = cursor.fetchone()[0]
        
        # Get completed tasks count
        cursor.execute('SELECT COUNT(*) FROM task WHERE completed = 1')
        completed_count = cursor.fetchone()[0]
        
        # Get recurring tasks count
        cursor.execute('SELECT COUNT(*) FROM task WHERE is_recurring = 1')
        recurring_count = cursor.fetchone()[0]
        
        # Get pomodoro count
        cursor.execute('SELECT COUNT(*) FROM pomodoro_session')
        pomodoro_count = cursor.fetchone()[0]
        
        print("📈 Data Statistics:")
        print(f"   Users: {user_count}")
        print(f"   Total Tasks: {task_count}")
        print(f"   - Completed: {completed_count}")
        print(f"   - Active: {task_count - completed_count}")
        print(f"   - Recurring Templates: {recurring_count}")
        print(f"   Pomodoro Sessions: {pomodoro_count}")
        print()
        
        # Get recent users
        if user_count > 0:
            cursor.execute('SELECT id, username, email FROM user ORDER BY id DESC LIMIT 5')
            users = cursor.fetchall()
            print("👥 Users:")
            for user in users:
                print(f"   - {user[1]} ({user[2]})")
            print()
        
        # Get recent tasks
        if task_count > 0:
            cursor.execute('''
                SELECT id, title, priority, completed, due_date 
                FROM task 
                WHERE is_recurring = 0 OR is_recurring IS NULL
                ORDER BY created_at DESC 
                LIMIT 5
            ''')
            tasks = cursor.fetchall()
            print("📋 Recent Tasks:")
            for task in tasks:
                status = "✓" if task[3] else "○"
                print(f"   {status} [{task[2]}] {task[1]} (due: {task[4]})")
            print()
        
        # Get pomodoro stats
        if pomodoro_count > 0:
            cursor.execute('''
                SELECT SUM(duration), COUNT(*) 
                FROM pomodoro_session 
                WHERE type = 'work'
            ''')
            result = cursor.fetchone()
            total_focus_time = result[0] or 0
            work_sessions = result[1] or 0
            
            print("🍅 Pomodoro Statistics:")
            print(f"   Total Work Sessions: {work_sessions}")
            print(f"   Total Focus Time: {total_focus_time} minutes ({total_focus_time / 60:.1f} hours)")
            print()
        
        conn.close()
        
        print("=" * 60)
        print("✅ Database is healthy and contains data!")
        print("=" * 60)
        print()
        print("💡 Tip: Your data will persist across server restarts.")
        print("   To backup your database, copy: backend/instance/tasks.db")
        
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
        conn.close()
        return

if __name__ == '__main__':
    main()

