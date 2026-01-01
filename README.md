# Pomovity - Productivity Task Manager

A modern, full-stack productivity application with user authentication, task prioritization, analytics, and a beautiful Material-UI interface.

## ✅ Data Persistence Update

**Your data now persists across server restarts!** All tasks, users, and pomodoro sessions are saved to a SQLite database at `backend/instance/tasks.db`. See [DATA_PERSISTENCE_GUIDE.md](DATA_PERSISTENCE_GUIDE.md) for details.

## Features

- 🔐 **User Authentication** - Secure login and registration with JWT tokens
- 📋 **Task Management** - Create, view, complete, and delete tasks
- 🎯 **Priority System** - Tasks sorted by priority (1-5 scale)
- ✅ **Task Completion** - Mark tasks as completed with visual strikethrough
- 📅 **Daily View** - Focus on today's tasks
- 📊 **Analytics Dashboard** - Track daily and weekly productivity with interactive charts
- 📈 **Trend Visualization** - 7-day completion trends and priority breakdown
- 🎨 **Modern UI** - Beautiful, responsive design with Material-UI in red theme
- 🔒 **Secure** - Password hashing with bcrypt, JWT authentication
- 💾 **Data Persistence** - All data saved to SQLite database (survives server restarts)

## Technology Stack

### Frontend
- React 18
- Material-UI (MUI) v5
- React Router v6
- Axios for API calls
- Context API for state management
- Recharts for data visualization

### Backend
- Flask 3.0
- SQLAlchemy (ORM)
- Flask-JWT-Extended (Authentication)
- Flask-Bcrypt (Password hashing)
- SQLite database (easily upgradable to PostgreSQL)

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- Python 3.8 or higher
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment:**
   - macOS/Linux:
     ```bash
     source venv/bin/activate
     ```
   - Windows:
     ```bash
     venv\Scripts\activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run the backend server:**
   
   **Option 1 (Recommended):** Use the startup script
   ```bash
   ./start_server.sh
   ```
   
   **Option 2:** Run directly
   ```bash
   python app.py
   ```
   
   The backend will run on `http://localhost:5000`
   
   **Note:** Always start the server from the `backend` directory to ensure proper data persistence!

### Frontend Setup

1. **Open a new terminal and navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```
   The frontend will run on `http://localhost:3000`

## Usage

1. **Register a new account:**
   - Navigate to `http://localhost:3000`
   - Click "Create one" on the login page
   - Fill in username, email, and password
   - Click "Create Account"

2. **Login:**
   - Enter your username and password
   - Click "Sign In"

3. **Manage Tasks:**
   - Click "Add Task" to create a new task
   - Enter title, description (optional), priority (1-5), and due date
   - Tasks are automatically sorted by priority (highest first)
   - Click the checkbox to mark tasks as completed
   - Click the delete icon to remove tasks

4. **View Analytics:**
   - Click "Analytics" button in the navbar
   - View today's and weekly completion rates
   - See 7-day completion trends
   - Analyze tasks by priority level
   - Toggle back to "Tasks" to return to task list

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user

### Tasks (Protected)
- `GET /api/tasks` - Get today's tasks (sorted by priority)
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/<id>` - Update task
- `DELETE /api/tasks/<id>` - Delete task
- `POST /api/tasks/<id>/toggle` - Toggle task completion

### Analytics (Protected)
- `GET /api/analytics` - Get productivity statistics and trends

## Database Schema

### User Model
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email
- `password` - Hashed password

### Task Model
- `id` - Primary key
- `title` - Task title
- `description` - Task description (optional)
- `priority` - Priority level (1-5)
- `completed` - Completion status
- `due_date` - Due date
- `created_at` - Creation timestamp
- `user_id` - Foreign key to User

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Protected API endpoints
- CORS configuration
- Secure password validation

## Future Enhancements

- Task categories/tags
- Task search and filtering
- Multi-day view
- Task editing
- Email notifications
- Recurring tasks
- Task sharing
- Dark mode toggle
- Mobile app

## Troubleshooting

### Data not persisting after server restart
- Always start the server from the `backend` directory
- Use the provided startup script: `./start_server.sh`
- Check that `backend/instance/tasks.db` exists and is growing in size
- See [DATA_PERSISTENCE_GUIDE.md](DATA_PERSISTENCE_GUIDE.md) for detailed troubleshooting

### Backend won't start
- Ensure virtual environment is activated
- Check if port 5000 is available
- Verify all dependencies are installed

### Frontend won't start
- Delete `node_modules` and `package-lock.json`, then run `npm install` again
- Check if port 3000 is available
- Clear browser cache

### Authentication issues
- Clear browser localStorage
- Verify backend is running
- Check CORS settings

## License

This project is open source and available for educational purposes.

## Contributing

Feel free to submit issues and enhancement requests!

