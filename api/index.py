from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, date, timedelta
from sqlalchemy import func
import os
import logging
import sys

# Configure logging for Vercel
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Configuration for Vercel serverless deployment
# Use PostgreSQL instead of SQLite
# Handle DATABASE_URL from various providers (some use postgres://, SQLAlchemy needs postgresql://)
database_url = os.environ.get('DATABASE_URL', 'postgresql://localhost/pomovity')
logger.info(f"Initial DATABASE_URL scheme: {database_url.split('://')[0] if '://' in database_url else 'no-scheme'}")

# Fix for Heroku/some providers that use postgres:// instead of postgresql://
if database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)
    logger.info("Converted postgres:// to postgresql://")
elif database_url.startswith('https://'):
    logger.error("DATABASE_URL is an HTTPS URL - this is INVALID! Please use postgresql://")
    
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
logger.info(f"DATABASE_URL configured: {database_url.split('@')[0] if '@' in database_url else 'local'}...")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# Optimized for serverless: smaller pool size, faster connection handling
# Only apply PostgreSQL-specific settings when using PostgreSQL
if database_url.startswith('postgresql://'):
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_size': 1,
        'max_overflow': 0,
        'pool_recycle': 300,
        'pool_pre_ping': True,
        'connect_args': {
            'connect_timeout': 10,
            'sslmode': 'require'
        }
    }
    logger.info("Using PostgreSQL-specific connection pool settings")
else:
    # For local dev with SQLite, use minimal config
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True
    }
    logger.info("Using SQLite configuration")
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'change-this-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# CORS configuration - allow frontend URL
frontend_url = os.environ.get('FRONTEND_URL', '*')
# Handle CORS properly for Vercel: if wildcard, use it directly; otherwise use list
if frontend_url == '*':
    CORS(app, origins='*', supports_credentials=True)
else:
    CORS(app, origins=[frontend_url, 'http://localhost:3001'], supports_credentials=True)

# JWT error handlers
@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'error': 'Invalid token', 'message': str(error)}), 401

@jwt.unauthorized_loader
def unauthorized_callback(error):
    return jsonify({'error': 'Missing authorization header', 'message': str(error)}), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_data):
    return jsonify({'error': 'Token has expired'}), 401

# Helper functions for recurring tasks
def generate_recurring_tasks_for_user(user_id, target_date=None):
    """Generate recurring task instances for a specific date if they don't exist"""
    if target_date is None:
        target_date = date.today()
    
    # Get all recurring task templates for the user
    recurring_templates = Task.query.filter_by(
        user_id=user_id, 
        is_recurring=True,
        recurring_parent_id=None  # Only get templates, not instances
    ).all()
    
    for template in recurring_templates:
        # Check if task should be created for this date
        should_create = False
        
        if template.recurrence_type == 'daily':
            should_create = True
        elif template.recurrence_type == 'weekly':
            # Check if today's weekday matches any of the specified days
            weekday = target_date.weekday()  # 0=Monday, 6=Sunday
            if template.recurrence_days:
                recurring_days = [int(d.strip()) for d in template.recurrence_days.split(',')]
                should_create = weekday in recurring_days
        
        if should_create:
            # Check if instance already exists for this date
            existing = Task.query.filter_by(
                user_id=user_id,
                recurring_parent_id=template.id,
                due_date=target_date
            ).first()
            
            if not existing:
                # Create new instance
                new_instance = Task(
                    title=template.title,
                    description=template.description,
                    priority=template.priority,
                    due_date=target_date,
                    user_id=user_id,
                    is_recurring=False,
                    recurring_parent_id=template.id
                )
                db.session.add(new_instance)
    
    db.session.commit()

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    tasks = db.relationship('Task', backref='owner', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email
        }

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    priority = db.Column(db.Integer, default=1)  # 1-5, 5 being highest
    completed = db.Column(db.Boolean, default=False)
    due_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    is_recurring = db.Column(db.Boolean, default=False)
    recurrence_type = db.Column(db.String(20))  # 'daily' or 'weekly'
    recurrence_days = db.Column(db.String(50))  # For weekly: comma-separated days (0-6, 0=Monday)
    recurring_parent_id = db.Column(db.Integer, db.ForeignKey('task.id'))  # Link to template task
    pomodoros = db.relationship('PomodoroSession', backref='task', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        result = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'priority': self.priority,
            'completed': self.completed,
            'due_date': self.due_date.isoformat(),
            'created_at': self.created_at.isoformat(),
            'pomodoro_count': len([p for p in self.pomodoros if p.type == 'work']),
            'is_recurring': self.is_recurring,
        }
        if self.is_recurring:
            result['recurrence_type'] = self.recurrence_type
            result['recurrence_days'] = self.recurrence_days
        if self.recurring_parent_id:
            result['recurring_parent_id'] = self.recurring_parent_id
        return result

class PomodoroSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=True)
    duration = db.Column(db.Integer, nullable=False)  # in minutes
    type = db.Column(db.String(20), nullable=False)  # 'work' or 'break'
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'task_id': self.task_id,
            'duration': self.duration,
            'type': self.type,
            'completed_at': self.completed_at.isoformat()
        }

# Routes
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not username or not email or not password:
            return jsonify({'error': 'Missing required fields'}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already exists'}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already exists'}), 400

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        new_user = User(username=username, email=email, password=hashed_password)
        
        db.session.add(new_user)
        db.session.commit()

        return jsonify({'message': 'User registered successfully', 'user': new_user.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({'error': 'Missing username or password'}), 400

        user = User.query.filter_by(username=username).first()

        if not user or not bcrypt.check_password_hash(user.password, password):
            return jsonify({'error': 'Invalid credentials'}), 401

        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        
        # Validate inputs
        if username and username != user.username:
            if User.query.filter_by(username=username).first():
                return jsonify({'error': 'Username already exists'}), 400
            user.username = username
        
        if email and email != user.email:
            if User.query.filter_by(email=email).first():
                return jsonify({'error': 'Email already exists'}), 400
            user.email = email
        
        db.session.commit()
        
        # Generate new token with updated info
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict(),
            'access_token': access_token
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/profile/password', methods=['PUT'])
@jwt_required()
def change_password():
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Verify current password
        if not bcrypt.check_password_hash(user.password, current_password):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Validate new password
        if len(new_password) < 6:
            return jsonify({'error': 'New password must be at least 6 characters'}), 400
        
        # Update password
        user.password = bcrypt.generate_password_hash(new_password).decode('utf-8')
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks', methods=['GET'])
@jwt_required()
def get_tasks():
    try:
        current_user_id = int(get_jwt_identity())
        today = date.today()
        
        # Generate recurring tasks for today if they don't exist
        generate_recurring_tasks_for_user(current_user_id, today)
        
        # Get all tasks for today (excluding recurring templates)
        tasks = Task.query.filter(
            Task.user_id == current_user_id,
            Task.due_date == today,
            db.or_(Task.is_recurring == False, Task.is_recurring == None)
        ).order_by(Task.priority.desc(), Task.created_at.asc()).all()
        
        return jsonify({'tasks': [task.to_dict() for task in tasks]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks', methods=['POST'])
@jwt_required()
def create_task():
    try:
        current_user_id = int(get_jwt_identity())
        data = request.get_json()

        title = data.get('title')
        description = data.get('description', '')
        priority = data.get('priority', 1)
        due_date_str = data.get('due_date')
        is_recurring = data.get('is_recurring', False)
        recurrence_type = data.get('recurrence_type')
        recurrence_days = data.get('recurrence_days')

        if not title:
            return jsonify({'error': 'Title is required'}), 400

        # Parse due_date or default to today
        if due_date_str:
            due_date = datetime.strptime(due_date_str, '%Y-%m-%d').date()
        else:
            due_date = date.today()

        new_task = Task(
            title=title,
            description=description,
            priority=priority,
            due_date=due_date,
            user_id=current_user_id,
            is_recurring=is_recurring,
            recurrence_type=recurrence_type if is_recurring else None,
            recurrence_days=recurrence_days if is_recurring else None
        )

        db.session.add(new_task)
        db.session.commit()

        return jsonify({'message': 'Task created successfully', 'task': new_task.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    try:
        current_user_id = int(get_jwt_identity())
        task = Task.query.filter_by(id=task_id, user_id=current_user_id).first()

        if not task:
            return jsonify({'error': 'Task not found'}), 404

        data = request.get_json()

        if 'title' in data:
            task.title = data['title']
        if 'description' in data:
            task.description = data['description']
        if 'priority' in data:
            task.priority = data['priority']
        if 'completed' in data:
            task.completed = data['completed']
        if 'due_date' in data:
            task.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()

        db.session.commit()

        return jsonify({'message': 'Task updated successfully', 'task': task.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    try:
        current_user_id = int(get_jwt_identity())
        task = Task.query.filter_by(id=task_id, user_id=current_user_id).first()

        if not task:
            return jsonify({'error': 'Task not found'}), 404

        db.session.delete(task)
        db.session.commit()

        return jsonify({'message': 'Task deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>/toggle', methods=['POST'])
@jwt_required()
def toggle_task(task_id):
    try:
        current_user_id = int(get_jwt_identity())
        task = Task.query.filter_by(id=task_id, user_id=current_user_id).first()

        if not task:
            return jsonify({'error': 'Task not found'}), 404

        task.completed = not task.completed
        db.session.commit()

        return jsonify({'message': 'Task toggled successfully', 'task': task.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    try:
        current_user_id = int(get_jwt_identity())
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        
        # Today's stats
        today_tasks = Task.query.filter_by(user_id=current_user_id, due_date=today).all()
        today_completed = sum(1 for task in today_tasks if task.completed)
        today_total = len(today_tasks)
        
        # This week's stats
        week_tasks = Task.query.filter(
            Task.user_id == current_user_id,
            Task.due_date >= week_start,
            Task.due_date <= today
        ).all()
        week_completed = sum(1 for task in week_tasks if task.completed)
        week_total = len(week_tasks)
        
        # Last 7 days completion trend
        daily_stats = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            day_tasks = Task.query.filter_by(user_id=current_user_id, due_date=day).all()
            completed = sum(1 for task in day_tasks if task.completed)
            total = len(day_tasks)
            daily_stats.append({
                'date': day.isoformat(),
                'completed': completed,
                'total': total,
                'day': day.strftime('%a')
            })
        
        # Completion by priority
        priority_stats = []
        for priority in range(1, 6):
            priority_tasks = Task.query.filter(
                Task.user_id == current_user_id,
                Task.priority == priority,
                Task.due_date >= week_start,
                Task.due_date <= today
            ).all()
            completed = sum(1 for task in priority_tasks if task.completed)
            total = len(priority_tasks)
            priority_stats.append({
                'priority': priority,
                'completed': completed,
                'total': total
            })
        
        return jsonify({
            'today': {
                'completed': today_completed,
                'total': today_total,
                'rate': round((today_completed / today_total * 100) if today_total > 0 else 0, 1)
            },
            'week': {
                'completed': week_completed,
                'total': week_total,
                'rate': round((week_completed / week_total * 100) if week_total > 0 else 0, 1)
            },
            'daily_trend': daily_stats,
            'priority_stats': priority_stats
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/pomodoros', methods=['POST'])
@jwt_required()
def create_pomodoro():
    logger.info("Pomodoro endpoint hit - POST /api/pomodoros")
    try:
        current_user_id = int(get_jwt_identity())
        logger.info(f"Authenticated user ID: {current_user_id}")
        data = request.get_json()
        logger.debug(f"Received pomodoro data: {data}")
        
        task_id = data.get('task_id')
        duration = data.get('duration', 25)
        session_type = data.get('type', 'work')
        
        logger.info(f"Creating pomodoro session - task_id: {task_id}, duration: {duration}, type: {session_type}")
        
        new_pomodoro = PomodoroSession(
            user_id=current_user_id,
            task_id=task_id,
            duration=duration,
            type=session_type
        )
        
        db.session.add(new_pomodoro)
        db.session.commit()
        logger.info(f"Successfully created pomodoro session ID: {new_pomodoro.id}")
        
        return jsonify({'message': 'Pomodoro recorded', 'pomodoro': new_pomodoro.to_dict()}), 201
    except Exception as e:
        logger.error(f"Failed to create pomodoro: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/pomodoros/stats', methods=['GET'])
@jwt_required()
def get_pomodoro_stats():
    logger.info("Pomodoro stats endpoint hit - GET /api/pomodoros/stats")
    try:
        current_user_id = int(get_jwt_identity())
        logger.info(f"Fetching pomodoro stats for user ID: {current_user_id}")
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        
        # Today's pomodoros
        today_pomodoros = PomodoroSession.query.filter(
            PomodoroSession.user_id == current_user_id,
            PomodoroSession.type == 'work',
            func.date(PomodoroSession.completed_at) == today
        ).all()
        logger.debug(f"Found {len(today_pomodoros)} pomodoros for today")
        
        # This week's pomodoros
        week_pomodoros = PomodoroSession.query.filter(
            PomodoroSession.user_id == current_user_id,
            PomodoroSession.type == 'work',
            PomodoroSession.completed_at >= week_start
        ).all()
        logger.debug(f"Found {len(week_pomodoros)} pomodoros for this week")
        
        # Calculate focus time
        today_focus_time = sum(p.duration for p in today_pomodoros)
        week_focus_time = sum(p.duration for p in week_pomodoros)
        
        result = {
            'today': {
                'count': len(today_pomodoros),
                'focus_time': today_focus_time
            },
            'week': {
                'count': len(week_pomodoros),
                'focus_time': week_focus_time
            }
        }
        logger.info(f"Returning pomodoro stats: today={result['today']['count']}, week={result['week']['count']}")
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Failed to get pomodoro stats: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/recurring-tasks', methods=['GET'])
@jwt_required()
def get_recurring_tasks():
    """Get all recurring task templates for the user"""
    try:
        current_user_id = int(get_jwt_identity())
        
        recurring_tasks = Task.query.filter_by(
            user_id=current_user_id,
            is_recurring=True
        ).filter(Task.recurring_parent_id.is_(None)).order_by(Task.created_at.desc()).all()
        
        return jsonify({'recurring_tasks': [task.to_dict() for task in recurring_tasks]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/recurring-tasks/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_recurring_task(task_id):
    """Update a recurring task template"""
    try:
        current_user_id = int(get_jwt_identity())
        task = Task.query.filter_by(
            id=task_id, 
            user_id=current_user_id,
            is_recurring=True
        ).first()

        if not task:
            return jsonify({'error': 'Recurring task not found'}), 404

        data = request.get_json()

        if 'title' in data:
            task.title = data['title']
        if 'description' in data:
            task.description = data['description']
        if 'priority' in data:
            task.priority = data['priority']
        if 'recurrence_type' in data:
            task.recurrence_type = data['recurrence_type']
        if 'recurrence_days' in data:
            task.recurrence_days = data['recurrence_days']

        db.session.commit()

        return jsonify({'message': 'Recurring task updated successfully', 'task': task.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/recurring-tasks/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_recurring_task(task_id):
    """Delete a recurring task template (does not delete generated instances)"""
    try:
        current_user_id = int(get_jwt_identity())
        task = Task.query.filter_by(
            id=task_id, 
            user_id=current_user_id,
            is_recurring=True
        ).first()

        if not task:
            return jsonify({'error': 'Recurring task not found'}), 404

        db.session.delete(task)
        db.session.commit()

        return jsonify({'message': 'Recurring task deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'database': 'postgresql'}), 200

# Initialize database tables (only if they don't exist)
# In serverless context, this is safe to run on each cold start
# but will only create tables if they don't exist
logger.info("Attempting to initialize database tables...")
try:
    with app.app_context():
        db.create_all()
        logger.info("Database tables created/verified successfully")
except Exception as e:
    # Log but don't fail - tables might already exist
    logger.error(f"Database initialization failed: {str(e)}")
    logger.error(f"Error type: {type(e).__name__}")

logger.info("Flask app initialized and ready for Vercel")

# Export for Vercel serverless functions
# The app object is automatically available to Vercel's Python runtime

